using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Attendance.Models.Machine
{
    [Table("MachineLastSync")]
    public class MachineLastSync
    {
        [Key]
        public string DeviceSN { get; set; }
        public DateTime LastSeen { get; set; }
        public bool IsOnline { get; set; }
        public string IP { get; set; }
        public string DeviceName { get; set; }

    }
}
