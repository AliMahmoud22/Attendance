namespace Attendance.Models
{
    public class AbsenceReportPdfDto
    {
        public IEnumerable<AbsenceViewModel> Employees { get; set; } = default!;
        public List<DateTime> FilteredDates { get; set; } = default!;
    }
}
