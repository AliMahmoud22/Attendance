using System.ComponentModel.DataAnnotations;

namespace Attendance.Models
{
    public class ShiftType
    {
        [Key]
        public int Id { get; set; }
        public int Code { get; set; }
        public string Name { get; set; } = null!;  // "أساسي" أو "إضافي"


    }
}
