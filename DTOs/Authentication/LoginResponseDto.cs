namespace Attendance.DTOs.Authentication
{
    public class LoginResponseDTO
    {
        public string AccessToken { get; set; } = null!;
        public string? RefreshToken { get; set; } 
    }
}
