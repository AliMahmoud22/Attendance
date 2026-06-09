using System.ComponentModel.DataAnnotations;

namespace Attendance.Models
{
    public class Users
    {
        [Key]
        public int ID { get; set; }
        [Required]
        public string UserName { get; set; } = null!;
        [Required]
        [DataType(DataType.Password)]
        public string Password { get; set; } = null!;
        [Required]
        public string Role { get; set; } = null!;
        [Required]
        public bool Status { get; set; } = true;
        public DateTime? LastLogin { get; set; }
        public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
        public string? SecurityStamp { get; set; } = Guid.NewGuid().ToString();

    }
}
