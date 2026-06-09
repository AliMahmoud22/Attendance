namespace Attendance.DTOs.Employee
{
    public class CreateEmployeeDto
    {
        public decimal Code { get; set; }
        public string Name { get; set; } = null!;
        public bool Empfinger { get; set; }
        public string DepartmentID { get; set; } = null!;
        public string Gender { get; set; } = null!;
        public bool OverTime { get; set; }
        public bool IS_Deleted { get; set; }
        public string Birth { get; set; }=null!;
    }
}
