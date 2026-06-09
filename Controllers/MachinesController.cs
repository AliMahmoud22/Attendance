using Attendance.Models.Machine;
using Attendance.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Attendance.Exceptions;


namespace Attendance.Controllers
{
    [ApiController]
    [Route("api/machines")]
    [Authorize]
    public class MachinesController(
        DBContext context) : ControllerBase
    {
        private const int PageSize = 20;

        // GET api/machines?name=x&status=true&page=1
        [HttpGet]
        public async Task<IActionResult> GetAll(string? name, string? status, int page = 1)
        {
            var query = context.Machines.AsQueryable();

            if (!string.IsNullOrEmpty(name))
                query = query.Where(m => m.Name.Contains(name));


            if (!string.IsNullOrEmpty(status))
            {
                bool isWorking = status == "true";
                query = query.Where(m => m.Enabled == isWorking);
            }

            var total = await query.CountAsync();

            var data = await query
                .OrderBy(m => m.Name)
                .Skip((page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            var active = await context.Machines.CountAsync(m => m.Enabled);
            var disabled = await context.Machines.CountAsync(m => !m.Enabled);

            return Ok(new
            {
                data,
                page,
                pageSize = PageSize,
                total,
                hasMore = (page * PageSize) < total,

                stats = new
                {
                    total,
                    active,
                    disabled
                }
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
        [Authorize(Roles = "IT,SuperAdmin,Admin")]
        public async Task<IActionResult> Create([FromBody] Machine machine)
        {
            if (!ModelState.IsValid) throw new AppException($"{ModelState}", 400);

            machine.ConnectType = 1;
            context.Add(machine);
            await context.SaveChangesAsync();
            return Ok(new { message = "تم إضافة الجهاز بنجاح ✅", machine });
        }

        // PUT api/machines/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "IT,SuperAdmin,Admin")]
        public async Task<IActionResult> Edit(int id, [FromBody] Machine machine)
        {
            if (id != machine.ID) throw new AppException("ID mismatch", 400);
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
        [Authorize(Roles = "IT,SuperAdmin,Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var machine = await context.Machines.FindAsync(id);
            if (machine == null) return NotFound();

            machine.Enabled = false;
            context.Machines.Update(machine);
            await context.SaveChangesAsync();
            return Ok(new { message = "تم تعطيل الجهاز بنجاح 🗑️" });
        }

        // DELETE api/machines/{id}  — permanent delete
        [HttpDelete("permanent/{id}")]
        [Authorize(Roles = "IT,SuperAdmin,Admin")]
        public async Task<IActionResult> PermentDelete(int id)
        {
            var machine = await context.Machines.FindAsync(id);
            if (machine == null) return NotFound();

            context.Machines.Remove(machine);
            await context.SaveChangesAsync();

            return Ok(new { message = "تم حذف الجهاز نهائيًا 🗑️" });
        }
    }
}