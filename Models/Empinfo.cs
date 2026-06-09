using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Attendance.Models
{
    public class Empinfo
    {

        [Key]
        [Column("Code")]
        public decimal? EmployeeCode { get; set; }


        //[Required(ErrorMessage = "Name is required.")]
        [StringLength(50, MinimumLength = 10, ErrorMessage = "Name must be between 10 and 50 characters.")]
        public string? Name { get; set; } = null!;



        //[Required(ErrorMessage = "Department is required.")]
        public string ?DepartmentId { get; set; } = null!;

        
        [Column("IS_work")]
        public bool? IsDeleted { get; set; }
        public string? birth { get; set; }
        public bool ? Empfinger { get; set; }
        public bool ? OverTime { get; set; }

        public Department Department { get; set; }

        public ICollection<EmpHoliday> EmpHolidays { get; set; } = new List<EmpHoliday>(); // Navigation Property
    }
}
