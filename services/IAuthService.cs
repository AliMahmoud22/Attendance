using Attendance.DTOs.Authentication;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.services
{
    public interface IAuthService
    {
        Task <LoginResponseDTO?> Login(LoginDTO loginDTO);
        Task<bool> Logout(string refreshToken); 
    }
}
