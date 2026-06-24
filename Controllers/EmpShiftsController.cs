using Attendance.Models;
using Attendance.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Attendance.Controllers
{
    [ApiController]
    [Route("api/emp-shifts")]
    [Authorize(Roles = "IT,SuperAdmin")]
    public class EmpshiftsController(
        DBContext context) : ControllerBase
    {
        private const int PageSize = 20;

        // GET api/emp-shifts?filterType=single&empCode=1&fromDate=x&toDate=x&departmentId=x&page=1
        [HttpGet]
        public async Task<IActionResult> GetAll(string? filterType, decimal? empCode, decimal? empCodeFrom, decimal? empCodeTo, DateTime? fromDate, DateTime? toDate, string? departmentId, string? sortColumn, string? sortDirection,
            int page = 1)
        {
            var query = context.vw_EmpShiftWithAllowance.AsQueryable();
            bool hasFilters = false;

            if (filterType == "single" && empCode.HasValue)
            {
                query = query.Where(x => x.EmpCode == empCode.Value);
                hasFilters = true;
            }
            else if (filterType == "range" && empCodeFrom.HasValue && empCodeTo.HasValue)
            {
                query = query.Where(x => x.EmpCode >= empCodeFrom && x.EmpCode <= empCodeTo);
                hasFilters = true;
            }

            if (fromDate.HasValue && toDate.HasValue)
            {
                query = query.Where(e => e.FromDate >= fromDate && e.ToDate <= toDate);
                hasFilters = true;
            }

            if (!string.IsNullOrEmpty(departmentId))
            {
                query = query.Where(e => e.DepartmentID == departmentId);
                hasFilters = true;
            }

            bool asc = !string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);
            query = !string.IsNullOrEmpty(sortColumn)
                ? sortColumn switch
                {
                    "EmpCode" => asc ? query.OrderBy(x => x.EmpCode) : query.OrderByDescending(x => x.EmpCode),
                    "Name" => asc ? query.OrderBy(x => x.EmpName) : query.OrderByDescending(x => x.EmpName),
                    "DepartmentID" => asc ? query.OrderBy(x => x.DepartmentID) : query.OrderByDescending(x => x.DepartmentID),
                    "FromDate" => asc ? query.OrderBy(x => x.FromDate) : query.OrderByDescending(x => x.FromDate),
                    "ToDate" => asc ? query.OrderBy(x => x.ToDate) : query.OrderByDescending(x => x.ToDate),
                    "ShiftName" => asc ? query.OrderBy(x => x.ShiftName) : query.OrderByDescending(x => x.ShiftName),
                    _ => query.OrderByDescending(x => x.FromDate)
                }
                : query.OrderByDescending(x => x.FromDate);

            context.Database.SetCommandTimeout(240);

            var fullResult = hasFilters
                ? await query.ToListAsync()
                : await query.Take(1000).ToListAsync();

            var paged = fullResult.Skip((page - 1) * PageSize).Take(PageSize).ToList();



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
                departments
            });
        }

        // GET api/emp-shifts/{empCode}/{shiftCode}/{fromDate}
        [HttpGet("{empCode}/{shiftCode}/{fromDate}")]
        public async Task<IActionResult> GetById(decimal empCode, string shiftCode, DateTime fromDate)
        {
            var shift = await context.EmpShift
                .FirstOrDefaultAsync(e => e.EmpCode == empCode && e.ShiftCode == shiftCode && e.FromDate == fromDate);

            if (shift == null) return NotFound();
            return Ok(shift);
        }

        // GET api/emp-shifts/lookups
        [HttpGet("lookups")]
        public async Task<IActionResult> GetLookups()
        {
            var shifts = await context.ShiftTime
                .AsNoTracking()
                .Select(s => new { s.ShiftCode, s.ShiftName })
                .ToListAsync();

            var departments = await context.Department
                .AsNoTracking()
                .Select(d => new { d.Id, d.Name })
                .ToListAsync();

            return Ok(new { shifts, departments });
        }
        // POST api/emp-shifts
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEmpShiftDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (dto.FromDate >= dto.ToDate)
                return BadRequest(new { message = "التاريخ من يجب ان يكون اقل من التاريخ الي." });

            List<decimal> codes = [];

            if (dto.TargetType == "Single" && dto.EmpCode.HasValue)
            {
                codes.Add(dto.EmpCode.Value);
            }
            else if (dto.TargetType == "Multiple" && dto.FromEmpCode.HasValue && dto.ToEmpCode.HasValue)
            {
                if (dto.FromEmpCode > dto.ToEmpCode)
                    return BadRequest(new { message = "كود الموظف من يجب ان يكون اقل من كود الموظف الي." });

                codes = await context.EmpShift
                    .Where(e => e.EmpCode >= dto.FromEmpCode && e.EmpCode <= dto.ToEmpCode)
                    .Select(e => e.EmpCode)
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
                context.EmpShift.Add(new Empshift
                {
                    EmpCode = code,
                    ShiftCode = dto.ShiftCode,
                    FromDate = dto.FromDate,
                    ToDate = dto.ToDate
                });
            }

            try
            {
                await context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("duplicate") == true)
            {
                return Conflict(new { message = "هذا الشيفت موجود بالفعل لهذا الموظف في نفس الفترة." });
            }

            return Ok(new { message = "تم إضافة الشيفت بنجاح ✅" });
        }
        // PUT api/emp-shifts/{empCode}/{shiftCode}/{fromDate}
        [HttpPut("{empCode}/{shiftCode}/{fromDate}")]
        public async Task<IActionResult> Edit(decimal empCode, string shiftCode, DateTime fromDate, [FromBody] Empshift updated)
        {
            var existing = await context.EmpShift
                .FirstOrDefaultAsync(e => e.EmpCode == empCode && e.ShiftCode == shiftCode && e.FromDate == fromDate);

            if (existing == null) return NotFound();

            try
            {
                context.EmpShift.Remove(existing);
                context.EmpShift.Add(updated);
                await context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("duplicate") == true)
            {
                return Conflict(new { message = "هذا الشيفت موجود بالفعل لهذا الموظف في نفس الفترة." });
            }

            return Ok(new { message = "تم تعديل الشيفت بنجاح ✅" });
        }

        // DELETE api/emp-shifts/{empCode}/{shiftCode}/{fromDate}
        [HttpDelete("{empCode}/{shiftCode}/{fromDate}")]
        public async Task<IActionResult> Delete(decimal empCode, string shiftCode, DateTime fromDate)
        {
            var shift = await context.EmpShift
                .FirstOrDefaultAsync(e => e.EmpCode == empCode && e.ShiftCode == shiftCode && e.FromDate == fromDate);

            if (shift == null) return NotFound();

            context.EmpShift.Remove(shift);
            await context.SaveChangesAsync();
            return Ok(new { message = "تم حذف الشيفت بنجاح 🗑️" });
        }
    }

    public class CreateEmpShiftDto
    {
        public string TargetType { get; set; } = "Single";
        public decimal? EmpCode { get; set; }
        public decimal? FromEmpCode { get; set; }
        public decimal? ToEmpCode { get; set; }
        public string? DepartmentId { get; set; }
        public string ShiftCode { get; set; } = "";
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
    }
}