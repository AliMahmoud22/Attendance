namespace Attendance.Models
{
    public class Vw_CheckInOutViewModel
    {

        public string? EmpName { get; set; }
        public decimal? EmpCode { get; set; }
        public string? DepartmentID { get; set; }
        public string? DepartmentName { get; set; }
        public DateTime? CheckTime { get; set; }
        public string? CheckType { get; set; }
        public string? Sensor { get; set; }
        public bool? Empfinger { get; set; }
        public bool? OverTime { get; set; }


    }
}
