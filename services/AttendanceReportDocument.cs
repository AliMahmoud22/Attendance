using Attendance.DTOs;
using Attendance.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Attendance.services
{
    public class AttendanceReportDocument : IDocument
    {
        private readonly AttendanceReportDto _model;
        private readonly List<DateTime> _allDays;
        private readonly List<IGrouping<(decimal? EmpCode, string? EmpName), Vw_CheckInOutViewModel>> _grouped;

        // Arabic day names indexed by DayOfWeek (0=Sunday)
        private static readonly string[] ArabicDays =
            ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

        public AttendanceReportDocument(AttendanceReportDto model)
        {
            _model = model;

            var records = model.Records ?? [];

            DateTime start = model.FilterFromDate
                ?? records.Where(x => x.CheckTime.HasValue).Min(x => x.CheckTime)?.Date
                ?? DateTime.Now;

            DateTime end = model.FilterToDate
                ?? records.Where(x => x.CheckTime.HasValue).Max(x => x.CheckTime)?.Date
                ?? DateTime.Now;

            _allDays = [];
            for (var d = start.Date; d <= end.Date; d = d.AddDays(1))
                _allDays.Add(d);

            _grouped = records
                .GroupBy(x => (x.EmpCode, x.EmpName))
                .ToList();
        }

        public DocumentMetadata GetMetadata() => new()
        {
            Title = "تقرير الحضور والانصراف",
            Author = "نظام الحضور - عين شمس التخصصي",
            CreationDate = DateTimeOffset.Now,
        };

        public DocumentSettings GetSettings() => new()
        {
            // A3 landscape = best for wide attendance grids
            PdfA = false,
        };

        public void Compose(IDocumentContainer container)
        {
            // chunk days into 31-day groups (one table per group)
            const int chunk = 31;
            var dayGroups = _allDays
                .Select((d, i) => new { d, i })
                .GroupBy(x => x.i / chunk)
                .Select(g => g.Select(x => x.d).ToList())
                .ToList();

            string now = DateTime.Now.ToString("yyyy/MM/dd HH:mm");

            foreach (var days in dayGroups)
            {
                container.Page(page =>
                {
                    // ── A3 Landscape ──
                    page.Size(PageSizes.A3.Landscape());
                    page.Margin(10, Unit.Millimetre);
                    page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(9).Bold());
                    page.PageColor(Colors.White);

                    page.Header().Element(c => BuildHeader(c, days, now));
                    page.Content().Element(c => BuildTable(c, days));
                    page.Footer().Element(BuildFooter);
                });
            }
        }

        // ── Header ────────────────────────────────────────────────
        void BuildHeader(IContainer container, List<DateTime> days, string now)
        {
            container.Column(col =>
            {
                col.Item().Row(row =>
                {
                    // IT logo (left)
                    row.ConstantItem(70).Image("wwwroot/IT-logo.png").FitArea();

                    // Title block (center)
                    row.RelativeItem().AlignCenter().Column(inner =>
                    {
                        if (!string.IsNullOrEmpty(_model.DepartmentName))
                        {
                            inner.Item()
                                .Border(2).BorderColor(Colors.Grey.Darken2)
                                .Padding(3)
                                .AlignCenter()
                                .Text($"إدارة: {_model.DepartmentName}")
                                .FontSize(14).Bold();
                        }

                        inner.Item()
                            .Border(2).BorderColor(Colors.Grey.Darken2)
                            .Padding(4)
                            .AlignCenter()
                            .Text($"كشف حضور وانصراف تفصيلي — من {days.First():yyyy/MM/dd} إلى {days.Last():yyyy/MM/dd}")
                            .FontSize(13).Bold();
                    });

                    // Hospital logo (right)
                    row.ConstantItem(70).Image("wwwroot/hospital logo.png").FitArea();
                });

                // Print timestamp
                col.Item()
                    .AlignLeft()
                    .Text($"تاريخ الطباعة: {now}")
                    .FontSize(8);
            });
        }

        // ── Footer ────────────────────────────────────────────────
        void BuildFooter(IContainer container)
        {
            container.Row(row =>
            {
                row.RelativeItem()
                    .AlignLeft()
                    .Text("مستشفى عين الشمس التخصّصي")
                    .FontSize(8).FontColor(Colors.Grey.Darken1);


                row.RelativeItem()
                .AlignCenter()
                .Text(x =>
                {
                    x.DefaultTextStyle(s => s.FontSize(8).FontColor(Colors.Grey.Darken1));
                    x.CurrentPageNumber();
                    x.Span(" / ");
                    x.TotalPages();
                });
                row.RelativeItem()
                    .AlignRight()
                    .Text("إدارة نظم المعلومات والتحول الرقمي")
                    .FontSize(8).FontColor(Colors.Grey.Darken1);
            });
        }

        // ── Table ─────────────────────────────────────────────────
        void BuildTable(IContainer container, List<DateTime> days)
        {
            container.Table(table =>
            {
                // ── Columns definition ──────────────────────────
                table.ColumnsDefinition(cols =>
                {
                    cols.ConstantColumn(40);   // emp code
                    cols.ConstantColumn(120);  // emp name
                    foreach (var _ in days)
                        cols.RelativeColumn();  // one per day, equal width
                });

                // ── Header row ──────────────────────────────────
                table.Header(header =>
                {
                    // Code col
                    header.Cell()
                        .Background(Colors.Grey.Lighten2)
                        .Border(0.5f).BorderColor(Colors.Grey.Medium)
                        .Padding(3).AlignCenter()
                        .Text("كود").FontSize(9).Bold();

                    // Name col
                    header.Cell()
                        .Background(Colors.Grey.Lighten2)
                        .Border(0.5f).BorderColor(Colors.Grey.Medium)
                        .Padding(3).AlignCenter()
                        .Text("اسم الموظف").FontSize(9).Bold();

                    // Day cols
                    foreach (var date in days)
                    {
                        bool isWeekend = date.DayOfWeek is DayOfWeek.Thursday or DayOfWeek.Friday;
                        string bg = isWeekend ? Colors.Grey.Lighten1 : Colors.Grey.Lighten2;

                        header.Cell()
                            .Background(bg)
                            .Border(0.5f).BorderColor(Colors.Grey.Medium)
                            .Padding(2).AlignCenter()
                            .Column(c =>
                            {
                                c.Item().Text(ArabicDays[(int)date.DayOfWeek]).FontSize(7).Bold();
                                c.Item().Text(date.ToString("dd/MM")).FontSize(7);
                            });
                    }
                });

                // ── Data rows ───────────────────────────────────
                bool isExtraSpace = _model.ShiftType == "اضافي مساحة";

                foreach (var empGrp in _grouped)
                {
                    // build dict: date → [HH:mm, ...]  (already deduped)
                    var empRecs = empGrp
                        .Where(x => x.CheckTime.HasValue)
                        .GroupBy(x => x.CheckTime!.Value.Date)
                        .ToDictionary(
                            g => g.Key,
                            g => g.OrderBy(x => x.CheckTime)
                                  .Select(x => x.CheckTime!.Value.ToString("HH:mm"))
                                  .Distinct()
                                  .ToList());

                    // emp code
                    table.Cell()
                        .Border(0.5f).BorderColor(Colors.Grey.Medium)
                        .Padding(3).AlignCenter()
                        .Text(empGrp.Key.EmpCode?.ToString() ?? "").FontSize(8);

                    // emp name
                    float nameHeight = isExtraSpace ? 60f : 18f;
                    table.Cell()
                        .MinHeight(nameHeight)
                        .Border(0.5f).BorderColor(Colors.Grey.Medium)
                        .Padding(3).AlignLeft()
                        .Text(empGrp.Key.EmpName ?? "").FontSize(9);

                    // day cells
                    foreach (var date in days)
                    {
                        bool isWeekend = date.DayOfWeek is DayOfWeek.Thursday or DayOfWeek.Friday;
                        string bg = isWeekend ? Colors.Grey.Lighten2 : Colors.White;

                        var cell = table.Cell()
                            .Background(bg)
                            .Border(0.5f).BorderColor(Colors.Grey.Medium)
                            .MinHeight(isExtraSpace ? 60f : 18f)
                            .PaddingTop(2).PaddingHorizontal(1);

                        if (empRecs.TryGetValue(date.Date, out var times))
                        {
                            cell.Column(col =>
                            {
                                foreach (var t in times)
                                    col.Item().AlignCenter().Text(t).FontSize(8);
                            });
                        }
                        else
                        {
                            cell.AlignCenter().Text("-").FontSize(8).FontColor(Colors.Grey.Medium);
                        }
                    }
                }
            });
        }
    }
}