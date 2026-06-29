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
        private readonly List<IGrouping<string?, Vw_CheckInOutViewModel>> _groupedByDept;
        private readonly string _webRootPath;

        // Arabic day names indexed by DayOfWeek (0=Sunday)
        private static readonly string[] ArabicDays =
            ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

        public AttendanceReportDocument(AttendanceReportDto model, string webRootPath)
        {
            _model = model;
            _webRootPath = webRootPath;

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
            _groupedByDept = records
                .GroupBy(x => x.DepartmentName)
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
            PdfA = false,
        };
        public void Compose(IDocumentContainer container)
        {
            const int chunk = 31;

            var dayGroups = _allDays
                .Select((d, i) => new { d, i })
                .GroupBy(x => x.i / chunk)
                .Select(g => g.Select(x => x.d).ToList())
                .ToList();

            string now = DateTime.Now.ToString("yyyy/MM/dd HH:mm");

            var departments = _model.DepartmentName?.Any() == true
                ? _model.DepartmentName
                : [null];

            foreach (var dept in departments)
            {
                // 🔹 Filter records ONLY for this department
                var deptRecords = dept == null
                    ? _model.Records
                    : _model.Records.Where(x => x.DepartmentName == dept).ToList();

                var empGroups = deptRecords
                    .GroupBy(x => (x.EmpCode, x.EmpName))
                    .ToList();

                foreach (var days in dayGroups)
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A3.Landscape());
                        page.Margin(10, Unit.Millimetre);
                        page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(9).Bold());
                        page.PageColor(Colors.White);
                        page.ContentFromRightToLeft();

                        // ✅ PASS department to header
                        page.Header().Element(c => BuildHeader(c, days, now, dept));

                        page.Content().Element(c => BuildTable(c, days, empGroups));

                        page.Footer().Element(BuildFooter);
                    });
                }
            }
        }
        // ── Header (repeats on every page) ───────────────────────
        void BuildHeader(IContainer container, List<DateTime> days, string now, string? dept)
        {
            var itLogo = Path.Combine(_webRootPath, "IT-logo.png");
            var hospitalLogo = Path.Combine(_webRootPath, "hospital logo.png");
            container.Column(col =>
            {
                col.Item().Row(row =>
                {
                    row.ConstantItem(50).Image(itLogo).FitArea();
                    if (!string.IsNullOrEmpty(dept))
                    {

                        row.RelativeItem().AlignCenter().TranslateX(90).Column(inner =>
                        {
                            inner.Item()
                                .Border(2).BorderColor(Colors.Grey.Darken2)
                                .Padding(8)
                                .AlignCenter()
                                .Text($"القسم: {dept}")
                                .FontSize(16).Bold();
                        });
                        row.RelativeItem().AlignRight().TranslateX(190).Column(inner =>
                                             {
                                                 inner.Item()
                                                     .Border(2).BorderColor(Colors.Grey.Darken2)
                                                     .Padding(8)
                                                     .AlignCenter()
                                                     .Text($"كشف حضور وانصراف تفصيلي — من {days.First():yyyy/MM/dd} إلى {days.Last():yyyy/MM/dd}")
                                                     .FontSize(15).Bold();
                                             });
                    }
                    else
                    {
                        row.RelativeItem().AlignCenter().Column(inner =>
                                         {
                                             inner.Item()
                                                 .Border(2).BorderColor(Colors.Grey.Darken2)
                                                 .Padding(8)
                                                 .AlignCenter()
                                                 .Text($"كشف حضور وانصراف تفصيلي — من {days.First():yyyy/MM/dd} إلى {days.Last():yyyy/MM/dd}")
                                                 .FontSize(15).Bold();
                                         });
                    }

                    row.ConstantItem(50).Image(hospitalLogo).FitArea();
                });

                col.Item()
                    .AlignLeft().PaddingVertical(5)
                    .Text($"تاريخ الطباعة: {now}")
                    .FontSize(10).Bold();

                col.Item().Table(table =>
                {
                    DefineColumns(table, days);
                    table.Header(header => BuildHeaderRow(header, days));
                });
            });
        }
        void BuildFooter(IContainer container)
        {
            container.Row(row =>
            {
                row.RelativeItem()
                    .AlignLeft()
                    .Text("مستشفى عين الشمس التخصّصي")
                    .FontSize(10).Bold().FontColor(Colors.Grey.Darken1);

                row.RelativeItem()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.DefaultTextStyle(s => s.FontSize(10).Bold().FontColor(Colors.Grey.Darken1));
                        x.CurrentPageNumber();
                        x.Span(" / ");
                        x.TotalPages();
                    });

                row.RelativeItem()
                    .AlignRight()
                    .Text("إدارة نظم المعلومات والتحول الرقمي")
                    .FontSize(10).Bold().FontColor(Colors.Grey.Darken1);
            });
        }

        // ── Table (data rows only — no header here) ───────────────
        void BuildTable(IContainer container, List<DateTime> days,
        List<IGrouping<(decimal? EmpCode, string? EmpName), Vw_CheckInOutViewModel>> empGroups)
        {
            bool isExtraSpace = _model.ShiftType == "اضافي مساحة";
            float rowHeight = isExtraSpace ? 130f : 30f;

            container.Column(mainCol =>
            {
                foreach (var empGrp in empGroups)
                {
                    var empRecs = empGrp
                        .Where(x => x.CheckTime.HasValue)
                        .GroupBy(x => x.CheckTime!.Value.Date)
                        .ToDictionary(
                            g => g.Key,
                            g => g.OrderBy(x => x.CheckTime)
                                  .Select(x => new { Time = x.CheckTime!.Value.ToString("HH:mm"), Highlight = x.Sensor == "9" ? true : false })
                                  .Distinct()
                                  .ToList());

                    mainCol.Item().ShowEntire().Table(table =>
                    {
                        DefineColumns(table, days);

                        table.Cell().Border(0.5F).BorderColor(Colors.Grey.Medium).PaddingVertical(3).PaddingHorizontal(1).AlignCenter().Text(empGrp.Key.EmpCode?.ToString() ?? "").FontSize(13).Bold();

                        table.Cell().MinHeight(rowHeight)
                                                .Border(0.5f).BorderColor(Colors.Grey.Medium)
                                                .Padding(3).AlignRight().Text(empGrp.Key.EmpName ?? "").FontSize(12).Bold();

                        foreach (var date in days)
                        {
                            bool isWeekend = date.DayOfWeek is DayOfWeek.Thursday or DayOfWeek.Friday;
                            string bg = isWeekend ? Colors.Grey.Lighten2 : Colors.White;

                            var cell = table.Cell().Background(bg)
                                                        .Border(0.5f).BorderColor(Colors.Grey.Medium)
                                                        .MinHeight(rowHeight)
                                                        .PaddingTop(2).PaddingHorizontal(1); ;

                            if (empRecs.TryGetValue(date.Date, out var times))
                            {
                                cell.PaddingBottom(10).Column(col =>
                                {
                                    foreach (var t in times)
                                    {
                                        col.Item()
                                           .AlignCenter()
                                           .Text(text =>
                                           {
                                               text.Span(t.Time)
                                                   .FontSize(11)
                                                   .Bold()
                                                   .FontColor(t.Highlight
                                                       ? Colors.Orange.Darken4
                                                       : Colors.Black);
                                           });
                                    }
                                });
                            }
                            else
                            {
                                cell.AlignCenter().Text("-").FontSize(15).ExtraBold().FontColor(Colors.Red.Darken1); ;
                            }
                        }
                    });
                }
            });
        }
        void DefineColumns(TableDescriptor table, List<DateTime> days)
        {
            table.ColumnsDefinition(cols =>
            {
                cols.ConstantColumn(48);   // emp code
                cols.ConstantColumn(120);  // emp name
                foreach (var _ in days)
                    cols.RelativeColumn(); // one per day
            });
        }

        void BuildHeaderRow(TableCellDescriptor header, List<DateTime> days)
        {
            header.Cell()
                .Background(Colors.Grey.Lighten2)
                .Border(0.5f).BorderColor(Colors.Grey.Medium)
                .Padding(2).AlignCenter()
                .Text("كود").FontSize(11).Bold();

            header.Cell()
                .Background(Colors.Grey.Lighten2)
                .Border(0.5f).BorderColor(Colors.Grey.Medium)
                .Padding(3).AlignCenter()
                .Text("اسم الموظف").FontSize(11).Bold();

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
                        c.Item().Text(ArabicDays[(int)date.DayOfWeek]).FontSize(9).Bold();
                        c.Item().Text(date.ToString("dd/MM")).FontSize(9).Bold();
                    });
            }
        }
    }
}