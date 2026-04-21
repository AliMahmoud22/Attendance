using Attendance.Data;
using Attendance.DTOs.Authentication;
using Attendance.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Attendance.services
{
    public class TokenService(IConfiguration config, DBContext dbContext) : ITokenService
    {
        public string GenerateAccessToken(Users user)
        {
            var claims = new[]
            {
            new Claim(ClaimTypes.NameIdentifier, user.ID.ToString()),
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("SecurityStamp", user.SecurityStamp  ?? Guid.NewGuid().ToString())
        };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(config["Jwt:Key"])
            );

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: config["Jwt:Issuer"],
                audience: config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(int.Parse(config["Jwt:AccessTokenExpiryMinutes"])),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
        public async Task<string> GenerateRefreshToken(Users user)
        {
            var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

            var refreshToken = new RefreshToken
            {
                Token = token,
                UserId = user.ID,
                Expires = DateTime.Now.AddDays(int.Parse(config["Jwt:RefreshTokenExpiryDays"]))
            };

            dbContext.RefreshTokens.Add(refreshToken);
            await dbContext.SaveChangesAsync();

            return token;
        }
        public async Task<RefreshResponseDTO?> RefreshAccessToken(string refreshToken)
        {
            var storedToken = await dbContext.RefreshTokens
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Token == refreshToken);

            if (storedToken == null)
                return null;

            if (storedToken.Expires < DateTime.Now)
                return null;

            if (storedToken.IsRevoked)
            {
                await RevokeAllUserTokens(storedToken.UserId);
                return null;
            }

            if (storedToken.User == null)
                return null;

            storedToken.IsRevoked = true;

            await dbContext.SaveChangesAsync();

            // FIX: issue both a new access token and a new refresh token (rotation)
            var newAccessToken = GenerateAccessToken(storedToken.User);
            var newRefreshToken = await GenerateRefreshToken(storedToken.User);


            return new RefreshResponseDTO
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken
            };
        }

        public async Task<bool> RevokeRefreshToken(string refreshToken)
        {
            var storedToken = await dbContext.RefreshTokens
                .FirstOrDefaultAsync(r => r.Token == refreshToken);

            if (storedToken == null || storedToken.IsRevoked)
                return false;

            storedToken.IsRevoked = true;
            await dbContext.SaveChangesAsync();
            return true;
        }
        public async Task RevokeAllUserTokens(int userId)
        {
            var tokens = await dbContext.RefreshTokens
                .Where(t => t.UserId == userId && !t.IsRevoked)
                .ToListAsync();

            foreach (var token in tokens)
            {
                token.IsRevoked = true;
            }

            await dbContext.SaveChangesAsync();
        }
    }
}
