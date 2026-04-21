using Attendance.Models;
using Attendance.services;
using Attendance.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Attendance.Controllers
{
    [ApiController]
    [Route("api/departments")]
    [Authorize]
    public class DepartmentsController(DBContext context, IPdfGeneratorService pdfService) : ControllerBase
    {
        // GET api/departments?search=x&filterBy=name&sortOrder=name_asc
        [HttpGet]
        public async Task<IActionResult> GetAll(string? search, string? filterBy, string? sortOrder)
        {
            var query = context.Department.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                if (filterBy == "id")
                    query = query.Where(d => d.Id == search);
                else if (filterBy == "name")
                    query = query.Where(d => d.Name.Contains(search));
            }

            query = sortOrder switch
            {
                "name_desc" => query.OrderByDescending(d => d.Name),
                "name_asc" => query.OrderBy(d => d.Name),
                "code_desc" => query.OrderByDescending(d => d.Id),
                "code_asc" => query.OrderBy(d => d.Id),
                _ => query.OrderBy(d => d.Name)
            };

            var data = await query.AsNoTracking()
                .Select(d => new { d.Id, d.Name })
                .ToListAsync();

            return Ok(data);
        }

        // GET api/departments/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var dept = await context.Department
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == id);

            if (dept == null) return NotFound();
            return Ok(dept);
        }

        // POST api/departments
        [HttpPost]
        [Authorize(Roles = "IT,SuperAdmin")]
        public async Task<IActionResult> Create([FromBody] Department department)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            context.Add(department);
            await context.SaveChangesAsync();
            return Ok(new { message = "تم إضافة القسم بنجاح ✅", department });
        }

        // PUT api/departments/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "IT")]
        public async Task<IActionResult> Edit(string id, [FromBody] EditDepartmentDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var dept = await context.Department.FirstOrDefaultAsync(d => d.Id == id);
            if (dept == null) return NotFound();

            // update employees that reference old dept id
            var emps = await context.EmpInfo
                .Where(e => e.DepartmentId == id)
                .ToListAsync();

            foreach (var emp in emps)
                emp.DepartmentId = dto.NewId;

            context.Department.Remove(dept);
            await context.SaveChangesAsync();

            context.Department.Add(new Department { Id = dto.NewId, Name = dto.Name });
            await context.SaveChangesAsync();

            return Ok(new { message = "تم تعديل القسم بنجاح ✅" });
        }

        // DELETE api/departments/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "IT")]
        public async Task<IActionResult> Delete(string id)
        {
            var dept = await context.Department.FindAsync(id);
            if (dept == null) return NotFound();

            context.Department.Remove(dept);
            await context.SaveChangesAsync();
            return Ok(new { message = "تم حذف القسم بنجاح 🗑️" });
        }
    }

    public class EditDepartmentDto
    {
        public string NewId { get; set; } = "";
        public string Name { get; set; } = "";
    }
}