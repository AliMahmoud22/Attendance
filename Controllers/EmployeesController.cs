using Attendance.Models;
using Attendance.services;
using Attendance.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Attendance.Controllers
{
    [ApiController]
    [Route("api/employees")]
    [Authorize(Roles = "IT")]
    public class EmployeesController(
        DBContext context,
        IPdfGeneratorService pdfService,
        IMemoryCache memoryCache) : ControllerBase
    {
        private const int PageSize = 30;

        // GET api/employees?empCode=1&empName=x&departmentId=x&page=1
        [HttpGet]
        public async Task<IActionResult> GetEmployees(
            decimal? empCode,
            string? empName,
            decimal? empCodeFrom,
            decimal? empCodeTo,
            string? departmentId,
            int page = 1)
        {
            var query = context.EmpInfo.Include(e => e.Department).AsQueryable();

            if (!string.IsNullOrEmpty(departmentId))
                query = query.Where(e => e.DepartmentId == departmentId);

            if (!string.IsNullOrEmpty(empName))
                query = query.Where(e => EF.Functions.Like(e.Name, $"{empName}%"));

            if (empCode != null)
                query = query.Where(e => EF.Functions.Like(e.EmployeeCode.ToString(), $"{empCode}%"));

            if (empCodeFrom.HasValue && empCodeTo.HasValue)
                query = query.Where(e => e.EmployeeCode >= empCodeFrom && e.EmployeeCode <= empCodeTo);

            context.Database.SetCommandTimeout(240);

            var totalCount = await query.CountAsync();

            var data = await query
                .OrderBy(e => e.EmployeeCode)
                .Skip((page - 1) * PageSize)
                .Take(PageSize)
                .Select(e => new
                {
                    e.EmployeeCode,
                    e.Name,
                    DepartmentName = e.Department.Name,
                    Status = e.IsDeleted
                })
                .ToListAsync();

            // cache full result key for pagination
            var cacheKey = Guid.NewGuid().ToString();
            memoryCache.Set(cacheKey, data, TimeSpan.FromMinutes(20));

            return Ok(new
            {
                data,
                page,
                pageSize = PageSize,
                hasMore = data.Count == PageSize,
                totalCount,
                cacheKey
            });
        }

        // GET api/employees/lookups  — departments + shifts for dropdowns
        [HttpGet("lookups")]
        public async Task<IActionResult> GetLookups()
        {
            var departments = await context.Department
                .AsNoTracking()
                .Select(d => new { d.Id, d.Name })
                .ToListAsync();

            var shifts = await context.ShiftTime
                .AsNoTracking()
                .Select(s => new { s.ShiftCode, s.ShiftName })
                .ToListAsync();

            return Ok(new { departments, shifts });
        }

        // POST api/employees
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Empinfo employee)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            context.Add(employee);
            await context.SaveChangesAsync();
            return Ok(new { message = "تم إضافة الموظف بنجاح ✅" });
        }

        // PUT api/employees/{code}
        //[HttpPut("{code}")]
        //public async Task<IActionResult> Edit(decimal code, [FromBody] Empinfo employee)
        //{
        //    if (!ModelState.IsValid) return BadRequest(ModelState);

        //    var existing = await context.EmpInfo.FirstOrDefaultAsync(e => e.EmployeeCode == code);
        //    if (existing == null) return NotFound();

        //    existing.Name = employee.Name;
        //    existing.DepartmentId = employee.DepartmentId;
        //    existing.Shift = employee.Shift;

        //    await context.SaveChangesAsync();
        //    return Ok(new { message = "تم تعديل بيانات الموظف بنجاح ✅" });
        //}

        // DELETE api/employees/{code}  — soft delete
        [HttpDelete("{code}")]
        public async Task<IActionResult> Delete(decimal code)
        {
            var emp = await context.EmpInfo.FirstOrDefaultAsync(e => e.EmployeeCode == code);
            if (emp == null) return NotFound();

            emp.IsDeleted = true;
            context.EmpInfo.Update(emp);
            await context.SaveChangesAsync();
            return Ok(new { message = "تم حذف الموظف بنجاح 🗑️" });
        }
    }
}