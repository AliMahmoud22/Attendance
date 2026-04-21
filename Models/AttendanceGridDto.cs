namespace Attendance.Models
{
    public class AttendanceGridDto
    {
        public decimal EmpCode { get; set; }
        public string EmpName { get; set; }

        // key = Date , value = List of times (08:01, 16:03)
        public Dictionary<DateTime, List<string>> Days { get; set; } = new();
    }
}
