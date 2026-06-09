using System.ComponentModel.DataAnnotations;

namespace Attendance.DTOs.User
{
    public class EditUserDto
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Username is required")]
        public string UserName { get; set; }

        [DataType(DataType.Password)]
        public string? NewPassword { get; set; }

        [Required(ErrorMessage = "Role is required")]
        public string Role { get; set; }
        [Required]
        public bool Status { get; set; } 
    }
}
