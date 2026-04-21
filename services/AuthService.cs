using Attendance.Data;
using Attendance.DTOs.Authentication;
using Attendance.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Attendance.services
{
    public class AuthService(DBContext dbContext, ITokenService tokenService) : IAuthService
    {
        public async Task<LoginResponseDTO?> Login(LoginDTO loginDTO) 
        {
            var user = await dbContext.Users
                .FirstOrDefaultAsync(u => u.UserName == loginDTO.UserName) ?? throw new AppException("User not found", 404);

            if (!BCrypt.Net.BCrypt.Verify(loginDTO.Password, user.Password))
                throw new AppException("Invalid password", 401);

            if (!user.IsActive)
                throw new AppException("Account is deactivated.", 403);

            user.LastLogin = DateTime.Now;
            await dbContext.SaveChangesAsync();

            var accessToken = tokenService.GenerateAccessToken(user);
            string? refreshToken = null;
            if (loginDTO.RememberMe)
                refreshToken = await tokenService.GenerateRefreshToken(user);

            //var refreshToken = await tokenService.GenerateRefreshToken(user);


            return new LoginResponseDTO
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };

        }
        public async Task<bool> Logout(string refreshToken) 
        {
            return await tokenService.RevokeRefreshToken(refreshToken);
        }
        

    }
}
