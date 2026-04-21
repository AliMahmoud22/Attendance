using Attendance.Data;
using Attendance.DTOs.Authentication;
using Attendance.Models;
using Attendance.services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

[ApiController]
[Route("api/account")]
public class AccountController(
    DBContext context,
    IAuthService authService,
    ITokenService tokenService
) : ControllerBase
{
    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userId == null)
            return Unauthorized();

        var user = await context.Users
            .Where(u => u.ID == int.Parse(userId))
            .Select(u => new { u.UserName })
            .FirstOrDefaultAsync();

        if (user == null) return NotFound();

        return Ok(user);
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> EditProfile([FromBody] EditProfileDto model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var user = await context.Users.FindAsync(int.Parse(userId!));
        if (user == null) return NotFound();

        if (!string.IsNullOrEmpty(model.CurrentPassword))
        {
            if (!BCrypt.Net.BCrypt.Verify(model.CurrentPassword, user.Password))
                return BadRequest(new { message = "كلمة المرور الحالية غير صحيحة" });

            user.Password = BCrypt.Net.BCrypt.HashPassword(model.NewPassword);

            // 🔥 invalidate old tokens
            user.SecurityStamp = Guid.NewGuid().ToString();
        }

        var exists = await context.Users
            .AnyAsync(u => u.UserName == model.UserName && u.ID != user.ID);

        if (exists)
            return Conflict(new { message = "Username already taken" });

        user.UserName = model.UserName;

        await context.SaveChangesAsync();

        return Ok(new { message = "Updated successfully" });
    }

    [Authorize(Roles = "IT")]
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await context.Users
            .Select(u => new { u.ID, u.UserName, u.Role, u.IsActive, u.LastLogin })
            .AsNoTracking()
            .ToListAsync();

        return Ok(users);
    }

    [Authorize(Roles = "IT")]
    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var exists = await context.Users.AnyAsync(u => u.UserName == model.UserName);
        if (exists)
            return Conflict(new { message = "Username already exists" });

        var newUser = new Users
        {
            UserName = model.UserName,
            Password = BCrypt.Net.BCrypt.HashPassword(model.Password),
            Role = model.Role,
            SecurityStamp = Guid.NewGuid().ToString()
        };

        context.Users.Add(newUser);
        await context.SaveChangesAsync();

        return Created("", newUser);
    }

    [Authorize(Roles = "IT")]
    [HttpPut("users/{id}")]
    public async Task<IActionResult> EditUser(int id, [FromBody] EditUserDto model)
    {
        var user = await context.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.UserName = model.UserName;
        user.Role = model.Role;
        user.IsActive = model.isActive;

        if (!string.IsNullOrEmpty(model.NewPassword))
        {
            user.Password = BCrypt.Net.BCrypt.HashPassword(model.NewPassword);
            user.SecurityStamp = Guid.NewGuid().ToString();
        }

        await context.SaveChangesAsync();

        return Ok(new { message = "Updated" });
    }

    [Authorize(Roles = "IT")]
    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await context.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.IsActive = false;
        user.SecurityStamp = Guid.NewGuid().ToString();

        await context.SaveChangesAsync();

        return Ok(new { message = "Deleted" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDTO dto)
    {
        var result = await authService.Login(dto);

        if (result == null)
            return Unauthorized(new { message = "Invalid credentials" });

        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenDto dto)
    {
        if (string.IsNullOrEmpty(dto.RefreshToken))
            return Unauthorized(new { message = "Session expired" });

        var result = await tokenService.RefreshAccessToken(dto.RefreshToken);

        if (result == null)
            return Unauthorized();

        return Ok(result);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutDto dto)
    {
        var success = await authService.Logout(dto.RefreshToken);

        if (!success)
            return BadRequest(new { message = "Invalid token" });

        return Ok(new { message = "Logged out" });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var user = await context.Users
            .Where(u => u.ID == int.Parse(userId!))
            .Select(u => new UserResponseDTO
            {
                Id = u.ID,
                UserName = u.UserName,
                Role = u.Role,
                IsActive = u.IsActive,
                LastLogin = u.LastLogin
            })
            .FirstOrDefaultAsync();

        return Ok(user);
    }
}