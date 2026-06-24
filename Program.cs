using Attendance.Data;
using Attendance.Middleware;
using Attendance.services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QuestPDF.Infrastructure;
using Rotativa.AspNetCore;
using System.Security.Claims;
using System.Text;
using Serilog;


QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

// 1. Initialize Serilog from configuration file
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

try
{
    builder.Host.UseSerilog(); // 2. Use Serilog for logging
    builder.Services.AddControllers();

    builder.Configuration
        .SetBasePath(Directory.GetCurrentDirectory())
        .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
        .AddEnvironmentVariables();

    builder.Services.AddDbContext<DBContext>(options =>
    {
        var connectionString = builder.Configuration.GetConnectionString("LiveConnection");
        //var connectionString = builder.Configuration.GetConnectionString("TestConnection");
        options.UseSqlServer(connectionString);
    });
    builder.Services.AddMemoryCache();
    builder.Services.AddDistributedMemoryCache();
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowReact",
            policy =>
            {
                policy.WithOrigins("http://localhost:5173")
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            });
    });


    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;

    }).AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.Zero,

            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var dbContext = context.HttpContext.RequestServices.GetRequiredService<DBContext>();

                var userIdClaim = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var stampClaim = context.Principal?.FindFirst("SecurityStamp")?.Value;

                if (userIdClaim == null || stampClaim == null)
                {
                    context.Fail("Invalid token claims.");
                    return;
                }

                var user = await dbContext.Users.AsNoTracking()
                .Select(u => new { u.ID, u.SecurityStamp, IsActive = u.Status })
                .FirstOrDefaultAsync(u => u.ID == int.Parse(userIdClaim));
                if (user == null || user.SecurityStamp != stampClaim)
                {
                    context.Fail("Token has been invalidated.");
                    return;
                }
                if (!user.IsActive)
                {
                    context.Fail("User account is deactivated.");
                    return;
                }
            }
            ,
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine("Authentication failed: " + context.Exception.Message);
                var logger = context.HttpContext.RequestServices
                .GetRequiredService<ILogger<Program>>();
                logger.LogWarning("Authentication failed: {Message}", context.Exception.Message);

                return Task.CompletedTask;
            }
            ,
            OnForbidden = context =>
            {
                Console.WriteLine("Authorization failed ");
                return Task.CompletedTask;
            },

        };
    });
    builder.Services.AddAuthorizationBuilder()
        .AddPolicy("RequireUserRole", policy => policy.RequireRole("User", "IT", "Admin", "SuperAdmin", "SuperUser"));

    builder.Services.AddScoped<ITokenService, TokenService>();
    builder.Services.AddScoped<IAuthService, AuthService>();

    var app = builder.Build();
    app.UseSerilogRequestLogging(); // 3. Use Serilog for request logging

    if (!app.Environment.IsDevelopment())
    {
        app.UseHsts();
    }
    app.UseHttpsRedirection();
    //app.UseMiddleware<ExceptionMiddleware>();
    app.UseCors("AllowReact");
    app.UseStaticFiles();
    app.UseRouting();
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseMiddleware<AuditLoggingMiddleware>();
    app.MapControllers();

    app.MapFallbackToFile("react/index.html");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application start-up failed");
}
finally
{
    Log.CloseAndFlush();
}
