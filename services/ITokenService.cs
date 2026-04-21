using Attendance.DTOs.Authentication;
using Attendance.Models;

namespace Attendance.services
{
    public interface ITokenService
    {
        string GenerateAccessToken(Users user);
        Task<string> GenerateRefreshToken(Users user);
        Task<RefreshResponseDTO?> RefreshAccessToken(string refreshToken);
        Task<bool> RevokeRefreshToken(string refreshToken);
        Task RevokeAllUserTokens(int userId);

    }
}
