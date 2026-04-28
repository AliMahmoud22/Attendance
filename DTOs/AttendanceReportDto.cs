using Attendance.Models;

namespace Attendance.DTOs
{
    public class AttendanceReportDto
    {
        public string? DepartmentName { get; set; }
        public DateTime? FilterFromDate { get; set; }
        public DateTime? FilterToDate { get; set; }
        public string? ShiftType { get; set; }
        public List<Vw_CheckInOutViewModel> Records { get; set; } = [];
    }
}
