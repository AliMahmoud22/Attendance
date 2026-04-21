namespace Attendance.Models
{
    public class vw_CheckInOutViewModelWithShift
    {

        public string? EmpName { get; set; }
        public decimal EmpCode { get; set; }
        public string? DepartmentID { get; set; }
        public string? DepartmentName { get; set; }
        public DateTime? CheckTime { get; set; }
        public string? CheckType { get; set; }
        public string? Sensor { get; set; }
        public DateTime? mainAllowedCheckInTime { get; set; }
        public DateTime? mainAllowedCheckOutTime { get; set; }
        public string ? mainShiftName{ get; set; }
        public DateTime? overTimeAllowedCheckInTime { get; set; }
        public DateTime? overTimeAllowedCheckOutTime { get; set; }
        public string ? overTimeShiftName{ get; set; }
    }
}
