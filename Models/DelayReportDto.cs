using Microsoft.EntityFrameworkCore;

namespace Attendance.Models
{
    [Keyless]
    public class DelayReportDto
    {
        public decimal EmpCode { get; set; }
        public string? EmpName { get; set; }
        public string? DepartmentName { get; set; }

        public int TotalDelayDays { get; set; }
        public string? TotalDelayTime { get; set; }



    }
}
