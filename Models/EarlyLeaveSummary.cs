using Microsoft.EntityFrameworkCore;

namespace Attendance.Models
{
    [Keyless]
    public class EarlyLeaveSummary
    {
        public string EmpCode { get; set; }
        public string EmpName { get; set; }
        public string DepartmentName { get; set; }
        public int TotalEarlyLeaveCount { get; set; }
        public string TotalEarlyLeave_HHMM { get; set; }
    }
}
