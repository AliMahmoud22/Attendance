using System.ComponentModel.DataAnnotations;

namespace Attendance.DTOs
{
    public class EditDepartmentDto
    {
        [StringLength(4, ErrorMessage = "الكود بحد اقصى اربع حروف")]
        [Required(ErrorMessage = "Code is required.")]

        public string NewCode { get; set; } = "";
        [StringLength(50, ErrorMessage = "اقصى عدد حروف لاسم القسم 50.")]
        [Required(ErrorMessage = "Name is required.")]
        public string Name { get; set; } = "";
    }
}
