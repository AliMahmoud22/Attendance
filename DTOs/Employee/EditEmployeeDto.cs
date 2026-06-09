using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace Attendance.DTOs.Employee
{
    public class EditEmployeeDto
    {
        [ReadOnly(true)]
        [Required(ErrorMessage = "Code is required.")]
        public decimal Code { get; set; }
        public string? Name { get; set; }
        public string? DepartmentId { get; set; }
        public string? Birth { get; set; }
        public string? Gender { get; set; }
        public bool? EmpFinger { get; set; }
        public bool? OverTime { get; set; }
        public bool? IS_Deleted { get; set; }




    }
}
