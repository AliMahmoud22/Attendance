using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;

namespace Attendance.Models.Machine
{
    public class Machine
    {
        [Key]
        public int ID { get; set; }

        [Column("MachineAlias")]
        [Required]
        [StringLength(20, ErrorMessage = "The Name cannot be longer than 20 characters.")]

        public string Name { get; set; } = null!;

        public int ConnectType { get; set; } = 1;

        [AllowNull]
        [RegularExpression(@"^((25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})$", ErrorMessage = "enter a valid IP")]
        public string IP { get; set; }

        [Required] // This ensures it can't be null
        [Range(1, int.MaxValue, ErrorMessage = "MachineNumber must be greater than 0.")]
        public int MachineNumber { get; set; }

        public bool Enabled { get; set; } = true;

        [Column("sn")]
        [Required]
        public string SN { get; set; } = null!;
    }
}
