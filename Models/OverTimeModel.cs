using Microsoft.EntityFrameworkCore;

namespace Attendance.Models
{
    [Keyless]
    public class OverTimeModel
    {
        public decimal EmpCode { get; set; }

        public string EmpName { get; set; } = "غير معروف"; // Default

        public List<DateTime> OverTimeDates { get; set; } = new(); 

        public decimal TotalOverTimeHours { get; set; }

        public int TotalOverTimeDays { get; set; }
    }
}
