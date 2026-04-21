using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Attendance.Models
{
    public class userinfo
    {
        [Key]
        public int USERID { get; set; }

        [Required(ErrorMessage = "Employee code is required.")]
        public string BADGENUMBER { get; set; } = null!; // Employee code (badge number)
        public string NAME { get; set; } = null!;

        [Column("DEFAULTDEPTID")]
        public int DeptIDE { get; set; }

        public string TITLE { get; set; } = null!;

        //[ForeignKey(nameof(BADGENUMBER))]
        public Empinfo? EmpInfo { get; set; }

        //public ICollection<CheckInOut> CheckInOuts { get; set; } = new List<CheckInOut>();
    }
}
