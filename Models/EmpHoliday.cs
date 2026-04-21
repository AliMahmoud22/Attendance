using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;

namespace Attendance.Models
{
    public class EmpHoliday
    {
        
        public decimal EmpCode { get; set; }
        
        public DateTime Day { get; set; }
        
        public string? Explain { get; set; }
        public Empinfo Employee { get; set; }   // Navigation Property

    }
}