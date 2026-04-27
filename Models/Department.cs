
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Attendance.Models
{
    public class Department
    {
        // even though in DB allow null !!!
        //[Key]
        [Column("Code")]
        [StringLength(4, ErrorMessage = "الكود بحد اقصى اربع حروف")]
        public string Id { get; set; } = null!;

        [Required(ErrorMessage = "الاسم مطلوب.")]
        [StringLength(50, ErrorMessage = "اقصى عدد حروف لاسم القسم 50.")]
        public string Name { get; set; } = null!;

        public virtual ICollection<Empinfo> Employees { get; set; } = new List<Empinfo>();
    }
}
