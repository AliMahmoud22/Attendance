using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Attendance.Models.Machine
{

    [Table("MachineAlerts")]
    public class MachineAlerts
    {
        [Key]
        public int Id { get; set; }
        public string DeviceName { get; set; }
        public string DeviceSN { get; set; } = string.Empty;
        public string AlertType { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }


    }

}
