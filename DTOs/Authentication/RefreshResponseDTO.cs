namespace Attendance.DTOs.Authentication
{
    public class RefreshResponseDTO
    {
        public string AccessToken { get; set; } = null!;
        public string? RefreshToken { get; set; } 
    }
}
