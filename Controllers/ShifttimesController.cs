using Attendance.Models;
using Attendance.services;
using Attendance.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Attendance.Controllers
{
    [ApiController]
    [Route("api/shift-times")]
    [Authorize(Roles = "IT,SuperAdmin")]
    public class ShiftTimesController(
        DBContext context) : ControllerBase
    {
        // GET api/shift-times?searchName=x&sortColumn=ShiftName&sortDirection=asc
        [HttpGet]
        public async Task<IActionResult> GetAll(
            string? searchName,
            string? sortColumn,
            string? sortDirection)
        {
            var query = context.ShiftTime.Include(s => s.ShiftType).AsQueryable();

            if (!string.IsNullOrEmpty(searchName))
                query = query.Where(s => s.ShiftName.Contains(searchName));

            sortColumn = string.IsNullOrEmpty(sortColumn) ? "ShiftName" : sortColumn;
            sortDirection = string.IsNullOrEmpty(sortDirection) ? "asc" : sortDirection;

            query = sortColumn switch
            {
                "ShiftName" => sortDirection == "asc"
                    ? query.OrderBy(s => s.ShiftName) : query.OrderByDescending(s => s.ShiftName),
                "ShiftType" => sortDirection == "asc"
                    ? query.OrderBy(s => s.ShiftType) : query.OrderByDescending(s => s.ShiftType),
                "StartTime" => sortDirection == "asc"
                    ? query.OrderBy(s => s.StartTime) : query.OrderByDescending(s => s.StartTime),
                "EndTime" => sortDirection == "asc"
                    ? query.OrderBy(s => s.EndTime) : query.OrderByDescending(s => s.EndTime),
                _ => query
            };

            var data = await query.ToListAsync();
            return Ok(data);
        }

        // GET api/shift-times/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var shift = await context.ShiftTime
                .Include(s => s.ShiftType)
                .FirstOrDefaultAsync(s => s.ShiftCode == id);

            if (shift == null) return NotFound();
            return Ok(shift);
        }

        // GET api/shift-times/next-code
        [HttpGet("next-code")]
        public IActionResult GetNextCode()
        {
            var lastCode = context.ShiftTime
                .AsEnumerable()
                .OrderByDescending(s =>
                {
                    var num = new string(s.ShiftCode.SkipWhile(c => !char.IsDigit(c)).ToArray());
                    return int.TryParse(num, out var n) ? n : 0;
                })
                .Select(s => s.ShiftCode)
                .FirstOrDefault();

            if (string.IsNullOrEmpty(lastCode))
                return Ok(new { nextCode = "A1" });

            string prefix = new string(lastCode.TakeWhile(c => !char.IsDigit(c)).ToArray());
            string numPart = new string(lastCode.SkipWhile(c => !char.IsDigit(c)).ToArray());
            int number = int.TryParse(numPart, out var n) ? n + 1 : 1;

            return Ok(new { nextCode = $"{prefix}{number}" });
        }

        // POST api/shift-times
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ShiftTime shiftTime)
        {
            if (shiftTime.StartTime == shiftTime.EndTime)
                ModelState.AddModelError("", "End Time must be after Start Time.");

            if (!ModelState.IsValid) return BadRequest(ModelState);

            context.Add(shiftTime);
            await context.SaveChangesAsync();
            return Ok(new { message = "تم إضافة الشيفت بنجاح ✅" });
        }

        // PUT api/shift-times/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Edit(string id, [FromBody] EditShiftDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            context.Database.SetCommandTimeout(180);

            // update emp shifts that reference old shift code
            var emps = await context.EmpShift
                .Where(e => e.ShiftCode == id)
                .ToListAsync();

            foreach (var emp in emps)
                emp.ShiftCode = dto.ShiftTime.ShiftCode;

            context.Update(dto.ShiftTime);
            await context.SaveChangesAsync();

            return Ok(new { message = "تم تعديل الشيفت بنجاح ✅" });
        }

        // DELETE api/shift-times/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var shift = await context.ShiftTime.FindAsync(id);
            if (shift == null) return NotFound();

            context.ShiftTime.Remove(shift);
            await context.SaveChangesAsync();
            return Ok(new { message = "تم حذف الشيفت بنجاح 🗑️" });
        }
    }

    public class EditShiftDto
    {
        public string OldShiftCode { get; set; } = "";
        public ShiftTime ShiftTime { get; set; } = new();
    }
}