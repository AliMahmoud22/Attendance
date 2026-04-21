using System.ComponentModel.DataAnnotations;

namespace Attendance.Models
{
    public class LoginDto
    {
        [Required]
        [StringLength(50, ErrorMessage = "The username cannot be longer than 50 characters.")]

        public string Username { get; set; } = null!;
        [Required]
        [StringLength(50, ErrorMessage = "The password  cannot be longer than 50 characters.")]

        [DataType(DataType.Password)]
        public string Password { get; set; } = null!;

        public bool RememberMe { get; set; } = false;
    }
}
