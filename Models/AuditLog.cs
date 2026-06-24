using Microsoft.EntityFrameworkCore;
using System;

namespace Attendance.Models
{
    public class AuditLog
    {
        public int Id { get; set; }
        public DateTime TimeStamp { get; set; }
        public int? UserId { get; set; }
        public string? UserName { get; set; }
        public string? Action { get; set; }
        public string? Controller { get; set; }
        public string? Method { get; set; }
        public string? HttpMethod { get; set; }
        public int? StatusCode { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? RequestData { get; set; }
        public string? ResponseData { get; set; }
        public string? Exception { get; set; }
        public long? ExecutionTimeMs { get; set; }
        public string? AdditionalInfo { get; set; }
    }
}
