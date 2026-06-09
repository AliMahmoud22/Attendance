using Attendance.Data;
using Attendance.DTOs.Employee;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Attendance.Controllers
{
    [ApiController]
    [Route("api/employees")]
    [Authorize]
    public class EmployeesController (
        DBContext context) : ControllerBase
    {
        private const int PageSize = 30;

        // GET api/employees?empCode=1&empName=x&departmentId=x&page=1
        [HttpGet]
        public async Task<IActionResult> GetEmployees (
            decimal? empCode,
            string? empName,
            decimal? empCodeFrom,
            decimal? empCodeTo,
            string? departmentId,
            bool? status,
            string sortBy = "code_asc",
            int page = 1)
        {
            var query = context.EmpInfo.Include(e => e.Department).AsQueryable();

            if (!string.IsNullOrWhiteSpace(departmentId))
                query = query.Where(e => e.DepartmentId == departmentId);

            if (!string.IsNullOrWhiteSpace(empName))
                query = query.Where(e => EF.Functions.Like(e.Name, $"{empName}%"));

            if (empCode != null)
                query = query.Where(e => EF.Functions.Like(e.EmployeeCode.ToString(), $"{empCode}%"));

            if (empCodeFrom.HasValue && empCodeTo.HasValue)
                query = query.Where(e => e.EmployeeCode >= empCodeFrom && e.EmployeeCode <= empCodeTo);
            if (status.HasValue)
            {
                query = query.Where(e =>
                    e.IsDeleted == status.Value);
            }

            /* ───────────────────────────── */


            // Sorting
            query = sortBy switch
            {
                "name_desc" => query.OrderByDescending(d => d.Name),
                "name_asc" => query.OrderBy(d => d.Name),
                "code_desc" => query.OrderByDescending(d => d.EmployeeCode),
                "code_asc" => query.OrderBy(d => d.EmployeeCode),
                _ => query.OrderBy(d => d.Name)
            };


            context.Database.SetCommandTimeout(240);

            var totalCount = await query.CountAsync();

            var data = await query
                .Skip((page - 1) * PageSize)
                .Take(PageSize)
                .Select(e => new
                {
                    e.EmployeeCode,
                    e.Name,
                    e.DepartmentId,
                    DepartmentName = e.Department.Name,
                    e.birth,
                    e.OverTime,
                    e.Empfinger,
                    Status = e.IsDeleted
                })
                .ToListAsync();

            return Ok(new
            {
                data,
                page,
                pageSize = PageSize,
                hasMore = data.Count == PageSize,
                totalCount

            });
        }

        // GET api/employees/lookups  — departments + shifts for dropdowns
        [HttpGet("lookups")]
        public async Task<IActionResult> GetLookups ()
        {
            var departments = await context.Department
                .AsNoTracking()
                .Select(d => new { Id = d.Id.Trim(), d.Name })
                .ToListAsync();

            var shifts = await context.ShiftTime
                .AsNoTracking()
                .Select(s => new { s.ShiftCode, s.ShiftName })
                .ToListAsync();

            return Ok(new { departments, shifts });
        }

        // POST api/employees
        [HttpPost]
        [Authorize(Roles = "IT, SuperAdmin, Admin ")]
        public async Task<IActionResult> Create ([FromBody] CreateEmployeeDto dto)
        {
            try
            {
                var result = await Task.Run(() =>
                    context.CreateEmployeeSpResult
                        .FromSqlRaw(
                            @"EXEC dbo.sp_CreateEmployee
                        @Code,
                        @Name,
                        @Empfinger,
                        @DepartmentID,
                        @Gender,
                        @OverTime,
                        @IS_WORK,
                        @Birth",

                            new SqlParameter("@Code", dto.Code),
                            new SqlParameter("@Name", dto.Name),
                            new SqlParameter("@Empfinger", dto.Empfinger),
                            new SqlParameter("@DepartmentID", dto.DepartmentID),
                            new SqlParameter("@Gender", dto.Gender),
                            new SqlParameter("@OverTime", dto.OverTime),
                            new SqlParameter("@IS_WORK", dto.IS_Deleted),
                            new SqlParameter("@Birth", dto.Birth.Replace("-", "").ToString())
                        )
                        .AsEnumerable()
                        .FirstOrDefault()
                );

                if (result == null)
                    return BadRequest(new
                    {
                        message = "Failed to create employee"
                    });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // PUT api/employees
        [HttpPut]
        [Authorize(Roles = "IT, SuperAdmin, Admin ")]
        public async Task<IActionResult> Edit ([FromBody] EditEmployeeDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var existing = await context.EmpInfo.FirstOrDefaultAsync(e => e.EmployeeCode == dto.Code);

                if (existing == null) return NotFound();

                existing.Name = dto.Name ?? existing.Name;
                existing.DepartmentId = dto.DepartmentId ?? existing.DepartmentId;
                existing.Empfinger = dto.EmpFinger ?? existing.Empfinger;
                existing.OverTime = dto.OverTime ?? existing.OverTime;
                existing.birth = dto.Birth ?? existing.birth;
                existing.IsDeleted = dto.IS_Deleted ?? existing.IsDeleted;

                await context.SaveChangesAsync();
                return Ok(new { message = "تم تعديل بيانات الموظف بنجاح ✅" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // DELETE api/employees/{code}  — soft delete
        [HttpDelete("{code}")]
        [Authorize(Roles = "IT, SuperAdmin, Admin ")]
        public async Task<IActionResult> Delete (decimal code)
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