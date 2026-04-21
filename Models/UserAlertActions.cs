using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Attendance.Models
{
    [Table("UserAlertActions")]
    public class UserAlertActions
    {
        [Key]
        public int Id { get; set; }
        public int AlertId { get; set; }
        public int UserId { get; set; }
        public bool IsDismissed { get; set; }
        public DateTime DismissedAt { get; set; }

    }
}
