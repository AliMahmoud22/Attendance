using Attendance.Models;

namespace Attendance.DTOs
{
    public class AbsenceReportPdfDto
    {
        public IEnumerable<AbsenceViewModel> Employees { get; set; } = default!;
        public List<DateTime> FilteredDates { get; set; } = default!;
    }
}
