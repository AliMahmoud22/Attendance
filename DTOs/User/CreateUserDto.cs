using System.ComponentModel.DataAnnotations;

namespace Attendance.DTOs.User
{
    public class CreateUserDto
    {
        [Required(ErrorMessage = "اسم المستخدم مطلوب")]
        public string UserName { get; set; } = null!;

        [Required(ErrorMessage = "كلمة المرور مطلوبة")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = null!;

        [Required(ErrorMessage = "تأكيد كلمة المرور مطلوب")]
        [DataType(DataType.Password)]
        [Compare("Password", ErrorMessage = "كلمة المرور غير متطابقة")]
        public string ConfirmPassword { get; set; } = null!;

        [Required(ErrorMessage = "نوع المستخدم مطلوب")]
        public string Role { get; set; } = null!;
    }
}
