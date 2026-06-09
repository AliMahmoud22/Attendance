using System.ComponentModel.DataAnnotations;

namespace Attendance.Models
{
    public class ShiftTime
    {
        [Key]
        [StringLength(50)]
        public string ShiftCode { get; set; } = null!;

        [StringLength(80)]
        [Required]
        public string ShiftName { get; set; }    = null!;
        [Required]
        public TimeSpan StartTime { get; set; }
        [Required]
        public TimeSpan EndTime { get; set; }
        [Required]
        public bool Sat {get;set;}          
        [Required]
        public bool Sun  {get;set;}         
        [Required]
        public bool Mon { get; set; }       
        [Required]
        public bool Tue { get; set; }       
        [Required]
        public bool  Wed { get; set; }      
        [Required]
        public bool  Thu { get; set; }      
        [Required]
        public bool  Fri { get; set; }
        [Required]
        public int ShiftTypeId   { get; set; }


        public ShiftType? ShiftType { get; set; }

        // Navigation: one shift has many empShift records
        public List<Empshift>? EmpShifts { get; set; }
    }
}
