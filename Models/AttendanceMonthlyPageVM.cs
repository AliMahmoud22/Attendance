namespace Attendance.Models
{
    public class AttendanceMonthlyPageVM
    {
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public string? DepartmentId { get; set; }
        public decimal? EmployeeId { get; set; }
        public List<AttendanceGridDto> Data { get; set; } = [];
        public string cacheKey { get; set; } = string.Empty;
    }
}
