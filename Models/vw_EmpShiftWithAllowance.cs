using Microsoft.EntityFrameworkCore;

namespace Attendance.Models
{
    [Keyless] // Since it's a view, no primary key
    public class Vw_EmpShiftWithAllowance
    {
        public decimal EmpCode { get; set; }
        public string? EmpName { get; set; }
        public string? DepartmentID { get; set; }
        public string? DepartmentName { get; set; }
        public string? ShiftCode { get; set; }
        public string? ShiftName { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public TimeSpan ShiftStart { get; set; }
        public TimeSpan ShiftEnd { get; set; }
        public TimeSpan AllowedCheckInTime { get; set; }
        public TimeSpan AllowedCheckOutTime { get; set; }
        public int ShiftTypeId { get; set; }
        public string? ShiftTypeName { get; set; }
        public bool CollectHours { get; set; }
    }

}
