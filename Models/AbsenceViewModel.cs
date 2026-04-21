using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;

namespace Attendance.Models
{
    //[Keyless]
    //public class AbsenceViewModel
    //{
    //    public decimal EmpCode { get; set; }
    //    public string? EmpName { get; set; }
    //    public string ?DepartmentName { get; set; }
    //    public int TotalAbsence { get; set; }
    //}
    [Keyless]
    public class AbsenceViewModel
    {
        public decimal EmpCode { get; set; }
        public string? EmpName { get; set; }
        public string? DepartmentName { get; set; }
        public DateTime AbsenceDate { get; set; }  // جاية من SQL

        // هنحسبها في C#
        [NotMapped]
        public int TotalAbsence { get; set; }
        [NotMapped]
        public List<DateTime> AbsenceDates { get; set; } = new();
    }

}
