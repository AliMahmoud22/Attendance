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
        IPdfGeneratorService pdfService,
        IMemoryCache memoryCache) : ControllerBase
    {
        private const int PageSize = 20;

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
        public async Task<IActionResult> GetCheckIns(
            decimal? empCode,
            decimal? empCodeFrom,
            decimal? empCodeTo,
            DateTime? fromDate,
            DateTime? toDate, string? departmentId,
            List<string>? departmentIds,
            string? filterType,
            string? shiftType)
        {
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
                    query = query.Where(x => x.Sensor == "9");
                else if (shiftType == "اساسي")
                    query = query.Where(x => x.Sensor != "9");
            }

            // employee filter
            if (filterType == "single" && empCode.HasValue)
                query = query.Where(x => x.EmpCode == empCode.Value);

            if (filterType == "range" && empCodeFrom.HasValue && empCodeTo.HasValue)
                query = query.Where(x => x.EmpCode >= empCodeFrom && x.EmpCode <= empCodeTo);

            // department filter (single or multiple)
            if (!string.IsNullOrEmpty(departmentId))
            {
                query = query.Where(x => x.DepartmentID == departmentId);
            }
            if (departmentIds != null && departmentIds.Any())
            {
                query = query.Where(x => departmentIds.Contains(x.DepartmentID!));

                // preserve order
                query = query.OrderBy(x => departmentIds.IndexOf(x.DepartmentID!));
            }

            var rawData = await query
                                    .OrderBy(x => x.EmpCode)
                                    .ThenBy(x => x.CheckTime)
                                    .ToListAsync();

            // 🔥 Remove duplicates (same minute + same sensor)
            var data = rawData
                .Where(x => x.CheckTime.HasValue)
                .GroupBy(x => new
                {
                    x.EmpCode,
                    Date = x.CheckTime!.Value.Date,
                    Hour = x.CheckTime.Value.Hour,
                    Minute = x.CheckTime.Value.Minute,
                    x.Sensor // ✅ VERY IMPORTANT
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

        // ──────────────────────────────────────────────────────────
        // GET api/check-in-outs/print?key=xxx&fromDate=&toDate=&...
        // Returns a real PDF (A3 landscape) that opens in browser
        // ──────────────────────────────────────────────────────────
        [AllowAnonymous] // new tab can't pass auth header
        [HttpGet("print")]
        public IActionResult PrintReport(
            string? key,
            DateTime? fromDate,
            DateTime? toDate,
            string? departmentName,
            string? shiftType)
        {
            if (string.IsNullOrEmpty(key) ||
                !memoryCache.TryGetValue(key, out List<Vw_CheckInOutViewModel>? data) ||
                data is null)
            {
                return BadRequest(new { message = "انتهت صلاحية التقرير أو لم يتم العثور عليه." });
            }

            // build the DTO the document needs
            var model = new AttendanceReportDto
            {
                DepartmentName = departmentName,
                ShiftType = shiftType,
                FilterFromDate = fromDate,
                FilterToDate = toDate,
                Records = data
            };

            // generate PDF bytes in memory
            var document = new AttendanceReportDocument(model);
            byte[] pdfBytes = document.GeneratePdf();

            // inline disposition → opens directly in browser tab
            // change to "attachment" if you want a download instead
            Response.Headers.Append(
                "Content-Disposition",
                $"inline; filename=\"attendance-report-{DateTime.Now:yyyyMMdd}.pdf\""
            );

            return File(pdfBytes, "application/pdf");
        }

        //        // ──────────────────────────────────────────
        //        // GET api/check-in-outs/print?key=xxx&...
        //        // returns a self-contained HTML page → 
        //        // the browser opens it in a new tab and prints
        //        // ──────────────────────────────────────────
        //        [AllowAnonymous] // no auth for print endpoint (since it opens in a new tab and we can't pass auth header)
        //        [HttpGet("print")]
        //        public IActionResult PrintReport(
        //            string? key,
        //            DateTime? fromDate,
        //            DateTime? toDate,
        //            string? departmentName,
        //            string? shiftType)
        //        {
        //            if (string.IsNullOrEmpty(key) ||
        //                !memoryCache.TryGetValue(key, out List<Vw_CheckInOutViewModel> data))
        //            {
        //                return BadRequest(new { message = "انتهت صلاحية التقرير أو لم يتم العثور عليه." });
        //            }

        //            // build date range
        //            DateTime reportStart = fromDate
        //                ?? data!.Where(x => x.CheckTime.HasValue).Min(x => x.CheckTime)?.Date
        //                ?? DateTime.Now;

        //            DateTime reportEnd = toDate
        //                ?? data!.Where(x => x.CheckTime.HasValue).Max(x => x.CheckTime)?.Date
        //                ?? DateTime.Now;

        //            var allDays = new List<DateTime>();
        //            for (var d = reportStart.Date; d <= reportEnd.Date; d = d.AddDays(1))
        //                allDays.Add(d);

        //            // split into 31-day page groups
        //            int chunkSize = 31;
        //            var dayGroups = allDays
        //                .Select((day, i) => new { day, i })
        //                .GroupBy(x => x.i / chunkSize)
        //                .Select(g => g.Select(x => x.day).ToList())
        //                .ToList();

        //            var groupedData = data!
        //                .GroupBy(x => new { x.EmpCode, x.EmpName })
        //                .ToList();

        //            var now = DateTime.Now.ToString("yyyy/MM/dd HH:mm");

        //            // ── build HTML inline (no Rotativa needed) ──────────────
        //            var sb = new System.Text.StringBuilder();

        //            sb.Append(@"<!DOCTYPE html>
        //<html lang=""ar"" dir=""rtl"">
        //<head>
        //<meta charset=""utf-8""/>
        //<title>تقرير الحضور والانصراف</title>
        //<style>
        //  body  { font-family:Arial; margin:4px; direction:rtl; font-weight:bold; }
        //  .ts   { text-align:left; font-size:14px; margin-bottom:8px; }
        //  table { width:100%; border-collapse:collapse; font-size:13px; page-break-inside:avoid; }
        //  th,td { border:1px solid #666; padding:6px; text-align:center; }
        //  th    { background:#eee; font-weight:bold; font-size:18px; }
        //  td    { font-weight:bold; font-size:14px; }
        //  .ct   { font-size:16px; }
        //  .nm   { min-width:200px; text-align:start; font-size:18px; }
        //  .pb   { page-break-after:always; }
        //  .wk   { background-color:lightgray; }
        //  @page { margin-bottom:18mm; }
        //  @media print { thead{display:table-header-group} tfoot{display:table-footer-group} tr{page-break-inside:avoid} }
        //</style>
        //</head>
        //<body>");

        //            var arabicDays = new[] { "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت" };

        //            for (int gi = 0; gi < dayGroups.Count; gi++)
        //            {
        //                var days = dayGroups[gi];
        //                bool isLast = gi == dayGroups.Count - 1;
        //                string colSpan = (days.Count + 2).ToString();

        //                sb.Append($@"<table>
        //<thead>
        //  <tr>
        //    <th colspan=""{colSpan}"" style=""background:white;border:none;padding-bottom:4px;"">
        //      <div style=""overflow:hidden;"">
        //        <img src=""/IT-logo.png""      style=""width:80px;float:left;"" />
        //        <img src=""/hospital logo.png"" style=""width:70px;float:right;"" />
        //        <div style=""text-align:center;margin-top:3px;"">
        //");
        //                if (!string.IsNullOrEmpty(departmentName))
        //                    sb.Append($@"<div style=""display:inline-block;font-size:30px;border:5px double #333;margin-left:200px;margin-right:-240px;padding:3px 5px;border-radius:5px;"">إدارة: {departmentName}</div>");

        //                sb.Append($@"<div style=""display:inline-block;font-size:28px;border:5px double #333;padding:3px 5px;border-radius:5px;"">
        //  كشف حضور وانصراف — من {days.First():yyyy/MM/dd} إلى {days.Last():yyyy/MM/dd}
        //</div>
        //</div>
        //<div class=""ts"" style=""margin-top:4px;"">تاريخ الطباعة: {now}</div>
        //</div>
        //    </th>
        //  </tr>
        //  <tr>
        //    <th style=""width:60px;"">كود الموظف</th>
        //    <th class=""nm"">اسم الموظف</th>
        //");
        //                foreach (var date in days)
        //                {
        //                    string dayName = arabicDays[(int)date.DayOfWeek];
        //                    string wk = (date.DayOfWeek == DayOfWeek.Thursday || date.DayOfWeek == DayOfWeek.Friday) ? " class=\"wk\"" : "";
        //                    sb.Append($"<th{wk}>{dayName}<br/>{date:dd/MM}</th>\n");
        //                }

        //                sb.Append("</tr>\n</thead>\n<tbody>\n");

        //                foreach (var empGrp in groupedData)
        //                {
        //                    var empRecs = empGrp
        //                        .Where(x => x.CheckTime.HasValue)
        //                        .GroupBy(x => x.CheckTime!.Value.Date)
        //                        .ToDictionary(d => d.Key, d => d.OrderBy(x => x.CheckTime).Select(x => x.CheckTime!.Value.ToString("HH:mm")).Distinct().ToList());

        //                    sb.Append($"<tr><td>{empGrp.Key.EmpCode}</td><td class=\"nm\">{empGrp.Key.EmpName}</td>\n");

        //                    foreach (var date in days)
        //                    {
        //                        string wk = (date.DayOfWeek == DayOfWeek.Thursday || date.DayOfWeek == DayOfWeek.Friday) ? "wk " : "";
        //                        sb.Append($"<td class=\"{wk}ct\" style=\"vertical-align:top;padding-top:3px;padding-bottom:30px;\">");

        //                        if (empRecs.ContainsKey(date.Date))
        //                            foreach (var chk in empRecs[date.Date])
        //                                sb.Append($"{chk}<br/>");
        //                        else
        //                            sb.Append("-");

        //                        sb.Append("</td>\n");
        //                    }
        //                    sb.Append("</tr>\n");
        //                }

        //                sb.Append($@"</tbody>
        //<tfoot>
        //  <tr>
        //    <td colspan=""{colSpan}"" style=""border:none;padding-top:14px;"">
        //      <div style=""display:flex;justify-content:space-between;"">
        //        <span style=""font-size:12px;color:#444;"">مستشفى عين الشمس التخصّصي</span>
        //        <span style=""font-size:12px;color:#444;"">إدارة نظم المعلومات والتحول الرقمي</span>
        //      </div>
        //    </td>
        //  </tr>
        //</tfoot>
        //</table>
        //");
        //                if (!isLast) sb.Append("<div class=\"pb\"></div>\n");
        //            }

        //            // auto-print script — opens the tab and immediately triggers print dialog
        //            sb.Append(@"
        //<script>window.onload = () => window.print();</script>
        //</body></html>");

        //            return Content(sb.ToString(), "text/html");
        //        }
    }
}