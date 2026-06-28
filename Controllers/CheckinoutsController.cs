using Attendance.Data;
using Attendance.DTOs;
using Attendance.Models;
using Attendance.services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using QuestPDF.Fluent;

namespace Attendance.Controllers
{
    [ApiController]
    [Route("api/check-in-outs")]
    [Authorize]
    public class CheckInOutsController(
        DBContext context,
        IMemoryCache memoryCache, IWebHostEnvironment _env) : ControllerBase
    {

        private const int PageSize = 20;

        private const string AllowedViewPrint = "IT,SuperAdmin,Admin,SuperUser";
        private const string AllowedView = "IT,SuperAdmin,Admin,SuperUser,User";
        // ──────────────────────────────────────────
        // GET api/check-in-outs/lookups
        // departments + shift types for dropdowns
        // ──────────────────────────────────────────
        [HttpGet("lookups")]
        public async Task<IActionResult> Lookups()
        {
            var departments = await context.Department
                .Select(d => new { d.Id, d.Name })
                .ToListAsync();

            var shifts = await context.ShiftType
                .Select(s => s.Name)
                .ToListAsync();

            return Ok(new { departments, shifts });
        }

        // ──────────────────────────────────────────
        // GET api/check-in-outs
        // main attendance grid data
        // ──────────────────────────────────────────
        [HttpGet("CheckIns")]
        [Authorize(Roles = AllowedView)]
        public async Task<IActionResult> GetCheckIns(
            string? Name,
            decimal? empCode,
            decimal? empCodeFrom,
            decimal? empCodeTo,
            DateTime? fromDate,
            DateTime? toDate,
            string? departmentId,
            string? departmentIds,
            string? filterType,
            string? shiftType)
        {
            try
            {
                if (empCode != null)
                {
                    var user = await context.EmpInfo.AnyAsync(x => x.EmployeeCode == empCode);
                    if (!user)
                    {
                        return BadRequest(new { message = "الكود غير موجود." });
                    }
                }
                else if (!string.IsNullOrWhiteSpace(Name))
                {
                    var user = await context.EmpInfo.AnyAsync(x => EF.Functions.Like(x.NameNormalized, $"{Name}%"));
                    if (!user)
                    {
                        return BadRequest(new { message = "الاسم غير موجود." });
                    }

                }



                // default to current month
                if (!fromDate.HasValue)
                    fromDate = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);

                if (!toDate.HasValue)
                    toDate = DateTime.Now;

                var query = context.vw_CheckInOutViewModel.AsNoTracking().AsQueryable();

                // date range
                query = query.Where(x =>
                    x.CheckTime >= fromDate &&
                    x.CheckTime <= toDate.Value.Date.AddDays(1)
                );

                // shift type filter
                if (!string.IsNullOrEmpty(shiftType))
                {
                    if (shiftType == "اضافي" || shiftType == "اضافي مساحة")
                        query = query.Where(x => x.Sensor == "9" && x.OverTime == true);
                    else if (shiftType == "اساسي")
                        query = query.Where(x => x.Sensor != "9" && x.Empfinger == true);
                    else
                        query = query.Where(x => (x.Sensor == "9" && x.OverTime == true) || (x.Sensor != "9" && x.Empfinger == true));
                }

                // employee filter                                                                  
                if (filterType == "single" && empCode.HasValue)
                    query = query.Where(x => x.EmpCode == empCode.Value);

                else if (filterType == "name" && !string.IsNullOrWhiteSpace(Name))
                {
                    query = query.Where(x => EF.Functions.Like(x.NameNormalized, $"{Name}%"));
                }

                else if (filterType == "range" && empCodeFrom.HasValue && empCodeTo.HasValue)
                    query = query.Where(x => x.EmpCode >= empCodeFrom && x.EmpCode <= empCodeTo);


                else if (!string.IsNullOrEmpty(departmentId))
                {
                    query = query.Where(x => x.DepartmentID == departmentId);
                }

                else if (departmentIds != null && departmentIds.Length > 0)
                {
                    var ids = departmentIds?.Split(',').ToList();
                    query = query.Where(x => ids!.Contains(x.DepartmentID!));
                }

                var rawData = await query
                                        .OrderBy(x => x.EmpCode)
                                        .ThenBy(x => x.CheckTime)
                                        .ToListAsync();
                if (departmentIds != null &&
                    departmentIds.Length > 0)
                {
                    var ids = departmentIds?.Split(',').ToList();
                    rawData = [.. rawData.OrderBy(x => ids!.IndexOf(x.DepartmentID!))];
                }

                //  Remove duplicates (same minute + same sensor)
                var data = rawData
                    .Where(x => x.CheckTime.HasValue)
                    .GroupBy(x => new
                    {
                        x.EmpCode,
                        x.CheckTime!.Value.Date,
                        x.CheckTime.Value.Hour,
                        x.CheckTime.Value.Minute,
                        x.Sensor
                    })
                    .Select(g => g.First()) // keep first occurrence
                    .ToList();
                // group into monthly grid  { empCode, empName, days: { "yyyy-MM-dd": ["HH:mm",...] } }
                var gridData = data
                    .GroupBy(x => new { x.EmpCode, x.EmpName })
                    .Select(g => new
                    {
                        empCode = g.Key.EmpCode,
                        empName = g.Key.EmpName,
                        days = g
                            .Where(x => x.CheckTime.HasValue)
                            .GroupBy(x => x.CheckTime!.Value.Date.ToString("yyyy-MM-dd"))
                            .ToDictionary(
                                d => d.Key,
                                d => d.OrderBy(x => x.CheckTime)
                                      .Select(x => x.CheckTime!.Value.ToString("HH:mm")).Distinct()
                                      .ToList()
                            )
                    });

                // cache raw data for print later
                var cacheKey = Guid.NewGuid().ToString();
                memoryCache.Set(cacheKey, data, TimeSpan.FromMinutes(20));

                return Ok(new
                {
                    fromDate = fromDate.Value.ToString("yyyy-MM-dd"),
                    toDate = toDate.Value.ToString("yyyy-MM-dd"),
                    data = gridData,
                    cacheKey
                });
            }
            catch (Exception ex)
            {
                return BadRequest(ex);

            }

        }

        [HttpGet("generate-print-ticket")]
        [Authorize(Roles = AllowedViewPrint)] // محمية بالتوكن الأصلي والأدوار المسموحة
        public IActionResult GeneratePrintTicket([FromQuery] string key)
        {
            if (string.IsNullOrEmpty(key) || !memoryCache.TryGetValue(key, out _))
            {
                return BadRequest(new { message = "انتهت صلاحية الجلسة أو البيانات غير موجودة." });
            }

            // توليد رمز توقيع فريد وعشوائي (Secure Ticket)
            var ticket = Guid.NewGuid().ToString("N");

            // تحديد وقت انتهاء التذكرة 
            var expiration = DateTime.UtcNow.AddMinutes(1);

            // حفظ التذكرة في الـ Cache وربطها بالـ cacheKey الأصلي للبيانات
            var ticketInfo = new PrintTicketInfo { CacheKey = key, ExpiresAt = expiration };
            memoryCache.Set($"print_ticket_{ticket}", ticketInfo, TimeSpan.FromMinutes(2));

            return Ok(new { ticket });
        }
        // ──────────────────────────────────────────────────────────
        // GET api/check-in-outs/print?key=xxx&fromDate=&toDate=&...
        // Returns a real PDF (A3 landscape) that opens in browser
        // ──────────────────────────────────────────────────────────

        [AllowAnonymous] // تظل كذا لأن المتصفح سيفتحها بدون Headers ولكنها أصبحت مؤمنة بالتذكرة التلقائية
        [HttpGet("print")]
        public IActionResult PrintReport(
            string? ticket,
            DateTime? fromDate,
            DateTime? toDate,
            string? departmentName,
            string? shiftType)
        {
            // التحقق من وجود التذكرة وصلاحيتها الزمنية
            if (string.IsNullOrEmpty(ticket) ||
                !memoryCache.TryGetValue($"print_ticket_{ticket}", out PrintTicketInfo? ticketInfo) ||
                ticketInfo is null || DateTime.UtcNow > ticketInfo.ExpiresAt)
            {
                return Unauthorized("رابط الطباعة غير صالح أو انتهت صلاحيته الأمنية.");
            }

            // جلب البيانات الأصلية باستخدام الـ CacheKey المرتبط بالتذكرة
            if (!memoryCache.TryGetValue(ticketInfo.CacheKey, out List<Vw_CheckInOutViewModel>? data) || data is null)
            {
                return BadRequest(new { message = "انتهت صلاحية التقرير أو لم يتم العثور عليه." });
            }


            var model = new AttendanceReportDto
            {
                DepartmentName = departmentName?.Split(',').ToList(),
                ShiftType = shiftType,
                FilterFromDate = fromDate,
                FilterToDate = toDate,
                Records = data
            };

            var document = new AttendanceReportDocument(model, _env.WebRootPath);
            byte[] pdfBytes = document.GeneratePdf();

            Response.Headers.Append("Content-Disposition", $"inline; filename=\"attendance-report-{DateTime.Now:yyyyMMdd}.pdf\"");
            return File(pdfBytes, "application/pdf");
        }
    }

    // كلاس مساعد لحفظ بيانات التذكرة المؤقتة
    public class PrintTicketInfo
    {
        public required string CacheKey { get; set; }
        public DateTime ExpiresAt { get; set; }
    }
}
