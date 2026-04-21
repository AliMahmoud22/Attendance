using System.ComponentModel.DataAnnotations;

namespace Attendance.Models
{
    public class Holidays
    {
        [Key]
        public int HOLIDAYID { get; set; }
        public string? HOLIDAYNAME { get; set; }
        public DateTime STARTDATE { get; set; }
        public DateTime ENDDATE { get; set; }



    }
}
