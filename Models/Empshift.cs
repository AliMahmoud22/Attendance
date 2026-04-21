using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Attendance.Models
{

    public class Empshift
    {
        [Key]
        [Column(Order = 0)]
        [Required]
        public decimal EmpCode { get; set; }

        [Key]
        [Column(Order = 1)]
        [StringLength(2, ErrorMessage = "Shift must be maximum 2 characters")]
        public string ShiftCode { get; set; } = null!;

        [Key]
        [Column(Order = 2)]
        [Required(ErrorMessage ="يجب ادخال قيمة التاريخ من")]
        public DateTime FromDate { get; set; }

        [Required(ErrorMessage = "يجب ادخال قيمة التاريخ الي")]

        public DateTime? ToDate { get; set; }

        //public List<Empinfo>? EmpInfo { get; set; }
        //public ShiftTime? ShiftTime { get; set; }

        [ForeignKey("EmpCode")]
        public Empinfo? EmpInfo { get; set; } = null!;  // Navigation to Employee Info

        // Foreign Key to ShiftTime
        [ForeignKey("ShiftCode")]
        public ShiftTime? ShiftTime { get; set; } = null!;  // Navigation to Shift Time




    }
}
