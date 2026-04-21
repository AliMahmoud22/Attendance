using System.ComponentModel.DataAnnotations;

namespace Attendance.Models
{
    public class EditProfileDto
    {
        [Required]
        public string UserName { get; set; }

        [DataType(DataType.Password)]
        public string? CurrentPassword { get; set; }

        [DataType(DataType.Password)]
        public string? NewPassword { get; set; }

        [DataType(DataType.Password)]
        [Compare("NewPassword", ErrorMessage = "كلمة المرور الجديدة غير متطابقة")]
        public string? ConfirmNewPassword { get; set; }
    }
}
