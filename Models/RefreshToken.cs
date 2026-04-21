using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Attendance.Models
{
    [Index(nameof(UserId))]
    [Index(nameof(Token))]
    public class RefreshToken
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Token { get; set; } = null!;

        [Required]
        public int UserId { get; set; }

        public Users User { get; set; } = null!;

        public DateTime Expires { get; set; }

        public bool IsRevoked { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
