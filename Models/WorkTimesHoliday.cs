using System.ComponentModel.DataAnnotations;

namespace Attendance.Models
{
    public class WorkTimesHoliday
    {

        [Key]
        public int Id { get; set; }
        public string startTime { get; set; } = null!;
        public string startTimeLate { get; set; } = null!;
        public string EndTime { get; set; } = null!;
        public string endTimeLate { get; set; } = null!;
        public string Explain { get; set; } = null!;
        public string Date { get; set; } = null!;

    }
}
