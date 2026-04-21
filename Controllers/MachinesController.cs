using Attendance.Models.Machine;
using Attendance.services;
using Attendance.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Machine = Attendance.Models.Machine.Machine;

namespace Attendance.Controllers
{
    [ApiController]
    [Route("api/machines")]
    [Authorize(Roles = "IT,SuperAdmin")]
    public class MachinesController(
        DBContext context,
        IPdfGeneratorService pdfService,
        IMemoryCache memoryCache) : ControllerBase
    {
        private const int PageSize = 20;

        // GET api/machines?name=x&status=true&page=1
        [HttpGet]
        public async Task<IActionResult> GetAll(string? name, string? status, int page = 1)
        {
            var query = context.Machines.AsQueryable();

            if (!string.IsNullOrEmpty(name))
                query = query.Where(m => EF.Functions.Like(m.Name, $"%{name}%"));

            if (!string.IsNullOrEmpty(status))
            {
                bool isWorking = status == "true";
                query = query.Where(m => m.Enabled == isWorking);
            }

            var fullResults = await query.OrderBy(m => m.Name).ToListAsync();

            var paged = fullResults
                .Skip((page - 1) * PageSize)
                .Take(PageSize)
                .ToList();

            var cacheKey = Guid.NewGuid().ToString();
            memoryCache.Set(cacheKey, fullResults, TimeSpan.FromMinutes(20));

            return Ok(new
            {
                data = paged,
                page,
                pageSize = PageSize,
                hasMore = paged.Count == PageSize,
                cacheKey
            });
        }

        // GET api/machines/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var machine = await context.Machines.FindAsync(id);
            if (machine == null) return NotFound();
            return Ok(machine);
        }

        // GET api/machines/connectivity
        [HttpGet("connectivity")]
        public async Task<IActionResult> GetConnectivity()
        {
            var machines = await context.MachineLastSync
                .Select(m => new
                {
                    m.DeviceName,
                    m.IP,
                    m.LastSeen,
                    m.IsOnline
                })
                .OrderBy(m => m.IsOnline)
                .ToListAsync();

            return Ok(machines);
        }

        // GET api/machines/next-code
        [HttpGet("next-code")]
        public IActionResult GetNextCode()
        {
            int lastId = context.Machines
                .OrderByDescending(m => m.ID)
                .Select(m => m.ID)
                .FirstOrDefault();

            return Ok(new { nextCode = lastId + 1 });
        }

        // POST api/machines
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Machine machine)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            machine.ConnectType = 1;
            context.Add(machine);
            await context.SaveChangesAsync();
            return Ok(new { message = "تم إضافة الجهاز بنجاح ✅", machine });
        }

        // PUT api/machines/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Edit(int id, [FromBody] Machine machine)
        {
            if (id != machine.ID) return BadRequest();
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                context.Machines.Update(machine);
                await context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!context.Machines.Any(m => m.ID == id)) return NotFound();
                throw;
            }

            return Ok(new { message = "تم تعديل بيانات الجهاز بنجاح ✅" });
        }

        // DELETE api/machines/{id}  — soft delete
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var machine = await context.Machines.FindAsync(id);
            if (machine == null) return NotFound();

            machine.Enabled = false;
            context.Machines.Update(machine);
            await context.SaveChangesAsync();
            return Ok(new { message = "تم تعطيل الجهاز بنجاح 🗑️" });
        }
    }
}