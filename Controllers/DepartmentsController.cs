//using Attendance.Models;
//using Attendance.services;
//using Attendance.Data;
//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using Attendance.DTOs;

//namespace Attendance.Controllers
//{
//    [ApiController]
//    [Route("api/departments")]
//    [Authorize]
//    public class DepartmentsController(DBContext context, IPdfGeneratorService pdfService) : ControllerBase
//    {
//        // GET api/departments?search=x&filterBy=name&sortOrder=name_asc
//        [HttpGet]
//        public async Task<IActionResult> GetAll(string? search, string? filterBy, string? sortOrder)
//        {
//            var query = context.Department.AsQueryable();

//            if (!string.IsNullOrEmpty(search))
//            {
//                if (filterBy == "id")
//                    query = query.Where(d => d.Code.Contains(search));
//                else if (filterBy == "name")
//                    query = query.Where(d => d.Name.Contains(search));
//            }

//            query = sortOrder switch
//            {
//                "name_desc" => query.OrderByDescending(d => d.Name),
//                "name_asc" => query.OrderBy(d => d.Name),
//                "code_desc" => query.OrderByDescending(d => d.Code),
//                "code_asc" => query.OrderBy(d => d.Code),
//                _ => query.OrderBy(d => d.Name)
//            };

//            var data = await query.AsNoTracking()
//                .Select(d => new { d.Code, d.Name })
//                .ToListAsync();

//            return Ok(data);
//        }

//        // GET api/departments/{id}
//        [HttpGet("{id}")]
//        public async Task<IActionResult> GetById(string id)
//        {
//            var dept = await context.Department
//                .AsNoTracking()
//                .FirstOrDefaultAsync(d => d.Code == id);

//            if (dept == null) return NotFound();
//            return Ok(dept);
//        }

//        // POST api/departments
//        [HttpPost]
//        [Authorize(Roles = "IT,SuperAdmin")]
//        public async Task<IActionResult> Create([FromBody] Department department)
//        {
//            if (!ModelState.IsValid) return BadRequest(ModelState);

//            context.Add(department);
//            await context.SaveChangesAsync();
//            return Ok(new { message = "تم إضافة القسم بنجاح ✅", department });
//        }

//        // PUT api/departments/{id}
//        [HttpPut("{id}")]
//        [Authorize(Roles = "IT")]
//        public async Task<IActionResult> Edit(string id, [FromBody] EditDepartmentDto dto)
//        {
//            if (!ModelState.IsValid) return BadRequest(ModelState);

//            var dept = await context.Department.FirstOrDefaultAsync(d => d.Code == id);
//            if (dept == null) return NotFound();

//            // update employees that reference old dept id
//            var emps = await context.EmpInfo
//                .Where(e => e.DepartmentId == id)
//                .ToListAsync();

//            foreach (var emp in emps)
//                emp.DepartmentId = dto.NewCode;

//            context.Department.Remove(dept);
//            await context.SaveChangesAsync();

//            context.Department.Add(new Department { Code = dto.NewCode, Name = dto.Name });
//            await context.SaveChangesAsync();

//            return Ok(new { message = "تم تعديل القسم بنجاح ✅" });
//        }

//        // DELETE api/departments/{id}
//        [HttpDelete("{id}")]
//        [Authorize(Roles = "IT")]
//        public async Task<IActionResult> Delete(string id)
//        {
//            var dept = await context.Department.FindAsync(id);
//            if (dept == null) return NotFound();

//            context.Department.Remove(dept);
//            await context.SaveChangesAsync();
//            return Ok(new { message = "تم حذف القسم بنجاح 🗑️" });
//        }
//    }

//}
using Attendance.Models;
using Attendance.services;
using Attendance.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Attendance.DTOs;

namespace Attendance.Controllers
{
    [ApiController]
    [Route("api/departments")]
    [Authorize]
    public class DepartmentsController(DBContext context) : ControllerBase
    {
        // GET api/departments?search=x&filterBy=name&sortOrder=name_asc
        [HttpGet]
        public async Task<IActionResult> GetAll(string? search, string? filterBy, string? sortOrder)
        {
            var query = context.Department.AsQueryable();

            // 🔍 Filtering
            if (!string.IsNullOrWhiteSpace(search))
            {
                query = filterBy switch
                {
                    "id" => query.Where(d => d.Id.Contains(search)),
                    "name" => query.Where(d => d.Name.Contains(search)),
                    _ => query
                };
            }

            // 🔽 Sorting
            query = sortOrder switch
            {
                "name_desc" => query.OrderByDescending(d => d.Name),
                "name_asc" => query.OrderBy(d => d.Name),
                "code_desc" => query.OrderByDescending(d => d.Id),
                "code_asc" => query.OrderBy(d => d.Id),
                _ => query.OrderBy(d => d.Name)
            };

            var data = await query
                .AsNoTracking()
                .Select(d => new
                {
                    d.Id,
                    d.Name
                })
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

            if (dept == null)
                return NotFound(new { message = "القسم غير موجود ❌" });

            return Ok(dept);
        }

        // POST api/departments
        [HttpPost]
        [Authorize(Roles = "IT,SuperAdmin")]
        public async Task<IActionResult> Create([FromBody] Department department)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (await context.Department.AnyAsync(d => d.Id == department.Id))
                return BadRequest(new { message = "كود القسم موجود بالفعل ❌" });

            context.Department.Add(department);
            await context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = department.Id }, department);
        }

        // PUT api/departments/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "IT")]
        public async Task<IActionResult> Edit(string id, [FromBody] EditDepartmentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var dept = await context.Department.FirstOrDefaultAsync(d => d.Id == id);
            if (dept == null)
                return NotFound(new { message = "القسم غير موجود ❌" });

            // 🔒 Check new code uniqueness
            if (id != dto.NewCode &&
                await context.Department.AnyAsync(d => d.Id == dto.NewCode))
            {
                return BadRequest(new { message = "كود القسم الجديد مستخدم بالفعل ❌" });
            }

            // ⚠️ Use TRANSACTION (VERY IMPORTANT)
            using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                // update employees
                var emps = await context.EmpInfo
                    .Where(e => e.DepartmentId == id)
                    .ToListAsync();

                foreach (var emp in emps)
                    emp.DepartmentId = dto.NewCode;

                await context.SaveChangesAsync();

                // delete old
                context.Department.Remove(dept);
                await context.SaveChangesAsync();

                // add new
                var newDept = new Department
                {
                    Id = dto.NewCode,
                    Name = dto.Name
                };

                context.Department.Add(newDept);
                await context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new { message = "تم تعديل القسم بنجاح ✅" });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // DELETE api/departments/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "IT")]
        public async Task<IActionResult> Delete(string id)
        {
            var dept = await context.Department.FindAsync(id);
            if (dept == null)
                return NotFound(new { message = "القسم غير موجود ❌" });

            // ⚠️ Optional: prevent delete if used
            bool hasEmployees = await context.EmpInfo.AnyAsync(e => e.DepartmentId == id);
            if (hasEmployees)
                return BadRequest(new { message = "لا يمكن حذف القسم لوجود موظفين مرتبطين به ❌" });

            context.Department.Remove(dept);
            await context.SaveChangesAsync();

            return Ok(new { message = "تم حذف القسم بنجاح 🗑️" });
        }

    }
}