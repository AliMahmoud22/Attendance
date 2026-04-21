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
    [Route("api/emp-holidays")]
    [Authorize(Roles = "IT")]
    public class EmpHolidaysController(
        DBContext context,
        IPdfGeneratorService pdfService,
        IMemoryCache memoryCache) : ControllerBase
    {
        private const int PageSize = 20;

        // GET api/emp-holidays?empCode=1&fromDate=2024-01-01&toDate=2024-12-31&departmentId=x&page=1
        [HttpGet]
        public async Task<IActionResult> GetAll(
            decimal? empCode,
            decimal? empCodeFrom,
            decimal? empCodeTo,
            DateTime? fromDate,
            DateTime? toDate,
            string? departmentId,
            string? sortColumn,
            string? sortDirection,
            int page = 1)
        {
            var query = context.EmpHoliday.Include(e => e.Employee).AsQueryable();

            if (empCode.HasValue)
                query = query.Where(eh => eh.EmpCode == empCode.Value);

            if (empCodeFrom.HasValue && empCodeTo.HasValue)
                query = query.Where(eh => eh.EmpCode >= empCodeFrom && eh.EmpCode <= empCodeTo);

            if (fromDate.HasValue && toDate.HasValue)
                query = query.Where(eh => eh.Day.Date >= fromDate.Value.Date && eh.Day.Date <= toDate.Value.Date);

            if (fromDate.HasValue && !toDate.HasValue)
                query = query.Where(eh => eh.Day.Date == fromDate.Value.Date);

            if (!string.IsNullOrEmpty(departmentId))
                query = query.Where(eh => eh.Employee.DepartmentId == departmentId);

            if (!string.IsNullOrEmpty(sortColumn))
            {
                bool asc = !string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);
                query = sortColumn.ToLower() switch
                {
                    "code" => asc ? query.OrderBy(eh => eh.EmpCode) : query.OrderByDescending(eh => eh.EmpCode),
                    "name" => asc ? query.OrderBy(eh => eh.Employee.Name) : query.OrderByDescending(eh => eh.Employee.Name),
                    "day" => asc ? query.OrderBy(eh => eh.Day) : query.OrderByDescending(eh => eh.Day),
                    "explain" => asc ? query.OrderBy(eh => eh.Explain) : query.OrderByDescending(eh => eh.Explain),
                    "department" => asc ? query.OrderBy(eh => eh.Employee.DepartmentId) : query.OrderByDescending(eh => eh.Employee.DepartmentId),
                    _ => query.OrderBy(eh => eh.Day)
                };
            }

            context.Database.SetCommandTimeout(240);

            bool hasFilters = empCode.HasValue || empCodeFrom.HasValue || fromDate.HasValue || !string.IsNullOrEmpty(departmentId);
            var fullResult = hasFilters
                ? await query.ToListAsync()
                : await query.Take(1000).ToListAsync();

            var paged = fullResult.Skip((page - 1) * PageSize).Take(PageSize).ToList();

            var cacheKey = Guid.NewGuid().ToString();
            memoryCache.Set(cacheKey, fullResult, TimeSpan.FromMinutes(30));

            // load departments for frontend dropdowns
            var departments = await context.Department
                .AsNoTracking()
                .Select(d => new { d.Id, d.Name })
                .ToListAsync();

            return Ok(new
            {
                data = paged,
                page,
                pageSize = PageSize,
                hasMore = paged.Count == PageSize,
                totalCount = fullResult.Count,
                cacheKey,
                departments
            });
        }

        // GET api/emp-holidays/{empCode}/{date}
        [HttpGet("{empCode}/{date}")]
        public async Task<IActionResult> GetById(decimal empCode, DateTime date)
        {
            var holiday = await context.EmpHoliday
                .Include(e => e.Employee)
                .FirstOrDefaultAsync(m => m.EmpCode == empCode && m.Day == date);

            if (holiday == null) return NotFound();
            return Ok(holiday);
        }

        // POST api/emp-holidays
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEmpHolidayDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            List<decimal> codes = new();

            if (dto.TargetType == "Single")
            {
                codes.Add(dto.EmpCode!.Value);
            }
            else if (dto.TargetType == "Multiple" && dto.FromEmpCode.HasValue && dto.ToEmpCode.HasValue)
            {
                if (dto.FromEmpCode > dto.ToEmpCode)
                    return BadRequest(new { message = "كود الموظف (من) يجب أن يكون أقل من (إلى)." });

                codes = await context.USERINFO
                    .FromSqlRaw(@"SELECT * FROM USERINFO WHERE TRY_CAST(BADGENUMBER AS DECIMAL) BETWEEN {0} AND {1}",
                        dto.FromEmpCode, dto.ToEmpCode)
                    .Select(e => decimal.Parse(e.BADGENUMBER))
                    .ToListAsync();
            }
            else if (dto.TargetType == "Department" && !string.IsNullOrEmpty(dto.DepartmentId))
            {
                codes = await context.EmpInfo
                    .Where(e => e.DepartmentId == dto.DepartmentId && e.EmployeeCode.HasValue)
                    .Select(e => e.EmployeeCode!.Value)
                    .ToListAsync();
            }

            foreach (var code in codes)
            {
                context.EmpHoliday.Add(new EmpHoliday
                {
                    EmpCode = code,
                    Day = dto.Day,
                    Explain = dto.Explain
                });
            }

            try
            {
                await context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("duplicate") == true)
            {
                return Conflict(new { message = "هذه الإجازة موجودة بالفعل لهذا الموظف في نفس اليوم." });
            }

            return Ok(new { message = "تم إضافة الإجازة بنجاح ✅" });
        }

        // PUT api/emp-holidays/{empCode}/{oldDate}
        [HttpPut("{empCode}/{oldDate}")]
        public async Task<IActionResult> Edit(decimal empCode, DateTime oldDate, [FromBody] EmpHoliday updated)
        {
            var entity = await context.EmpHoliday
                .FirstOrDefaultAsync(e => e.EmpCode == empCode && e.Day == oldDate);

            if (entity == null) return NotFound();

            try
            {
                context.EmpHoliday.Remove(entity);
                context.EmpHoliday.Add(updated);
                await context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("duplicate") == true)
            {
                return Conflict(new { message = "يوجد عطلة مسجلة لهذا الموظف في نفس التاريخ." });
            }

            return Ok(new { message = "تم تعديل الإجازة بنجاح ✅" });
        }

        // DELETE api/emp-holidays/{empCode}/{date}
        [HttpDelete("{empCode}/{date}")]
        public async Task<IActionResult> Delete(decimal empCode, DateTime date)
        {
            var holiday = await context.EmpHoliday
                .FirstOrDefaultAsync(e => e.EmpCode == empCode && e.Day.Date == date.Date);

            if (holiday == null) return NotFound();

            context.EmpHoliday.Remove(holiday);
            await context.SaveChangesAsync();
            return Ok(new { message = "تم حذف الإجازة بنجاح 🗑️" });
        }
    }

    public class CreateEmpHolidayDto
    {
        public string TargetType { get; set; } = "Single";
        public decimal? EmpCode { get; set; }
        public decimal? FromEmpCode { get; set; }
        public decimal? ToEmpCode { get; set; }
        public string? DepartmentId { get; set; }
        public DateTime Day { get; set; }
        public string? Explain { get; set; }
    }
}