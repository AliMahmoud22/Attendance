//this saves every request and response to the database, including user info, timestamps, and any exceptions that occur. It also excludes sensitive routes like login and registration from logging request/response bodies for security reasons.
//using System.Diagnostics;
//using System.Text;
//using Attendance.Data;
//using Attendance.Models;

//namespace Attendance.Middleware;

//public class AuditLoggingMiddleware
//{
//    private readonly RequestDelegate _next;

//    // 1. Define centralized lists of routes or controllers to exclude from logging sensitive data
//    private static readonly HashSet<string> ExcludedPathSegments = new(StringComparer.OrdinalIgnoreCase)
//    {
//        "/login",
//        "/register",
//        "/forgot-password",
//        "/reset-password",
//        "/api/account/me",
//        "/profile",
//        "/me",
//        "/lookups",
//    };

//    public AuditLoggingMiddleware(RequestDelegate next)
//    {
//        _next = next;
//    }

//    public async Task InvokeAsync(HttpContext context, DBContext dbContext)
//    {
//        var stopwatch = Stopwatch.StartNew();

//        // 2. Extract endpoint and path route details safely
//        var endpoint = context.GetEndpoint();
//        var controllerName = endpoint?.Metadata.GetMetadata<Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor>()?.ControllerName ?? string.Empty;
//        var methodName = endpoint?.Metadata.GetMetadata<Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor>()?.ActionName ?? string.Empty;
//        var httpMethod = context.Request.Method ?? "UNKNOWN";

//        // SAFE TRIMMING: Always provide a fallback string if Path or Value is null
//        var requestPath = context.Request.Path.Value ?? string.Empty;

//        // 3. CHECK IF THIS ENDPOINT IS IN THE EXCLUSION LISTS WITH NULL-SAFETY
//        bool isSensitiveRoute = false;


//        if (!isSensitiveRoute && ExcludedPathSegments != null && !string.IsNullOrEmpty(requestPath))
//        {
//            isSensitiveRoute = ExcludedPathSegments.Any(segment =>
//                !string.IsNullOrEmpty(segment) &&
//                requestPath.Contains(segment, StringComparison.OrdinalIgnoreCase));
//        }

//        // 4. Read incoming request body securely
//        string requestData = "[SENSITIVE DATA OMITTED FOR SECURITY]";
//        if (!isSensitiveRoute)
//        {
//            requestData = await ReadRequestBodyAsync(context.Request);
//        }

//        // 5. Intercept the response body stream properly
//        var originalResponseBodyStream = context.Response.Body;
//        using var responseBodyMemoryStream = new MemoryStream();
//        context.Response.Body = responseBodyMemoryStream;

//        string? exceptionMessage = null;

//        try
//        {
//            await _next(context);
//        }
//        catch (Exception ex)
//        {
//            exceptionMessage = ex.ToString();
//            throw;
//        }
//        finally
//        {
//            stopwatch.Stop();

//            // 6. Read response from memory stream safely
//            string responseData = "[SENSITIVE RESPONSE OMITTED]";

//            responseBodyMemoryStream.Position = 0;
//            using var reader = new StreamReader(responseBodyMemoryStream, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, bufferSize: 1024, leaveOpen: true);
//            var actualResponseText = await reader.ReadToEndAsync();

//            if (!isSensitiveRoute)
//            {
//                if (context.Response.StatusCode == 200 || context.Response.StatusCode == 201)
//                {
//                    responseData = actualResponseText;
//                }
//                else
//                {
//                    responseData = "Non-Success Payload";
//                }
//            }

//            // CRITICAL STEP: Always rewind and copy the original data back to the actual response pipeline
//            responseBodyMemoryStream.Position = 0;
//            await responseBodyMemoryStream.CopyToAsync(originalResponseBodyStream);
//            context.Response.Body = originalResponseBodyStream; // Restore original stream pointer

//            // 7. Gather User identity properties from JWT claims context
//            int? userId = null;
//            string? userName = null;

//            if (context.User.Identity?.IsAuthenticated == true)
//            {
//                userName = context.User.Identity.Name;
//                var userIdClaim = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
//                                  ?? context.User.FindFirst("id")?.Value;

//                if (int.TryParse(userIdClaim, out int parsedId))
//                {
//                    userId = parsedId;
//                }
//            }

//            // 8. Compose safe details for your AuditLog table
//            var auditLog = new AuditLog
//            {
//                TimeStamp = DateTime.UtcNow,
//                UserId = userId,
//                UserName = userName,
//                Action = isSensitiveRoute ? "Sensitive Security Action" : $"{httpMethod} Request to {controllerName}/{methodName}",
//                Controller = controllerName,
//                Method = methodName,
//                HttpMethod = httpMethod,
//                StatusCode = context.Response.StatusCode,
//                IpAddress = context.Connection.RemoteIpAddress?.ToString(),
//                UserAgent = context.Request.Headers["User-Agent"].ToString(),
//                RequestData = requestData,
//                ResponseData = string.IsNullOrWhiteSpace(responseData) ? "No Response Body" : responseData,
//                Exception = exceptionMessage,
//                ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
//                AdditionalInfo = $"Path: {context.Request.Path}{context.Request.QueryString}"
//            };

//            // 9. Save to Database Context
//            try
//            {
//                dbContext.AuditLogs.Add(auditLog);
//                await dbContext.SaveChangesAsync();
//            }
//            catch (Exception dbEx)
//            {
//                System.Diagnostics.Debug.WriteLine($"Failed writing Audit Log to DB Context: {dbEx.Message}");
//            }
//        }
//    }

//    private static async Task<string> ReadRequestBodyAsync(HttpRequest request)
//    {
//        request.EnableBuffering();
//        using var reader = new StreamReader(request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
//        var body = await reader.ReadToEndAsync();
//        request.Body.Position = 0;
//        return string.IsNullOrWhiteSpace(body) ? "No Request Body" : body;
//    }
//}


// This middleware captures detailed audit logs for every request and response, including user information, timestamps, and any exceptions that occur. It also excludes sensitive routes like login and registration from logging request/response bodies for security reasons.
//using System.Diagnostics;
//using System.Text;
//using Attendance.Data;
//using Attendance.Models;

//namespace Attendance.Middleware;

//public class AuditLoggingMiddleware
//{
//    private readonly RequestDelegate _next;

//    // 1. Centralized list of routes to completely exclude from logging
//    private static readonly HashSet<string> ExcludedPathSegments = new(StringComparer.OrdinalIgnoreCase)
//    {
//        "/login",
//        "/register",
//        "/forgot-password",
//        "/reset-password",
//        "/api/account/me",
//        "/profile",
//        "/me",
//        "/lookups",
//        "/print",
//        "/generate-print-ticket",
//        "/"

//    };

//    public AuditLoggingMiddleware(RequestDelegate next)
//    {
//        _next = next;
//    }

//    public async Task InvokeAsync(HttpContext context, DBContext dbContext)
//    {
//        var stopwatch = Stopwatch.StartNew();

//        var endpoint = context.GetEndpoint();
//        var controllerName = endpoint?.Metadata.GetMetadata<Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor>()?.ControllerName ?? string.Empty;
//        var methodName = endpoint?.Metadata.GetMetadata<Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor>()?.ActionName ?? string.Empty;
//        var httpMethod = context.Request.Method ?? "UNKNOWN";
//        var requestPath = context.Request.Path.Value ?? string.Empty;

//        // Check if this route should be skipped entirely
//        bool isSensitiveRoute = ExcludedPathSegments != null &&
//                               !string.IsNullOrEmpty(requestPath) &&
//                               ExcludedPathSegments.Any(segment => !string.IsNullOrEmpty(segment) && requestPath.Contains(segment, StringComparison.OrdinalIgnoreCase));

//        string requestData = "[SENSITIVE DATA OMITTED FOR SECURITY]";
//        if (!isSensitiveRoute)
//        {
//            requestData = await ReadRequestBodyAsync(context.Request);
//        }

//        // Set up response interception
//        var originalResponseBodyStream = context.Response.Body;
//        using var responseBodyMemoryStream = new MemoryStream();
//        context.Response.Body = responseBodyMemoryStream;

//        string? exceptionMessage = null;
//        string responseData = "[SENSITIVE RESPONSE OMITTED]";

//        try
//        {
//            // Pass control to the next middleware
//            await _next(context);
//        }
//        catch (Exception ex)
//        {
//            exceptionMessage = ex.ToString();
//            throw; // Re-throw so the global exception handler can catch it
//        }
//        finally
//        {
//            stopwatch.Stop();

//            // 1. Read response from memory stream safely before restoring it
//            responseBodyMemoryStream.Position = 0;
//            using var reader = new StreamReader(responseBodyMemoryStream, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, bufferSize: 1024, leaveOpen: true);
//            var actualResponseText = await reader.ReadToEndAsync();

//            if (!isSensitiveRoute)
//            {
//                responseData = (context.Response.StatusCode == 200 || context.Response.StatusCode == 201)
//                    ? actualResponseText
//                    : "Non-Success Payload";
//            }

//            // 2. CRITICAL: Always copy data back to original stream to keep the client happy
//            responseBodyMemoryStream.Position = 0;
//            await responseBodyMemoryStream.CopyToAsync(originalResponseBodyStream);
//            context.Response.Body = originalResponseBodyStream;
//        }

//        // ==========================================================
//        // OUTSIDE THE FINALLY BLOCK: Safe to drop or proceed
//        // ==========================================================

//        // 3. THE DB GUARD CLAUSE: Works perfectly here!
//        if (isSensitiveRoute)
//        {
//            return;
//        }

//        // 4. Gather User identity properties
//        int? userId = null;
//        string? userName = null;

//        if (context.User.Identity?.IsAuthenticated == true)
//        {
//            userName = context.User.Identity.Name;
//            var userIdClaim = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
//                              ?? context.User.FindFirst("id")?.Value;

//            if (int.TryParse(userIdClaim, out int parsedId))
//            {
//                userId = parsedId;
//            }
//        }

//        // 5. Compose and Save your AuditLog
//        var auditLog = new AuditLog
//        {
//            TimeStamp = DateTime.UtcNow,
//            UserId = userId,
//            UserName = userName,
//            Action = $"{httpMethod} Request to {controllerName}/{methodName}",
//            Controller = controllerName,
//            Method = methodName,
//            HttpMethod = httpMethod,
//            StatusCode = context.Response.StatusCode,
//            IpAddress = context.Connection.RemoteIpAddress?.ToString(),
//            UserAgent = context.Request.Headers["User-Agent"].ToString(),
//            RequestData = requestData,
//            ResponseData = string.IsNullOrWhiteSpace(responseData) ? "No Response Body" : responseData,
//            Exception = exceptionMessage,
//            ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
//            AdditionalInfo = $"Path: {context.Request.Path}{context.Request.QueryString}"
//        };

//        try
//        {
//            dbContext.AuditLogs.Add(auditLog);
//            await dbContext.SaveChangesAsync();
//        }
//        catch (Exception dbEx)
//        {
//            System.Diagnostics.Debug.WriteLine($"Failed writing Audit Log to DB Context: {dbEx.Message}");
//        }
//    }
//    private static async Task<string> ReadRequestBodyAsync(HttpRequest request)
//    {
//        request.EnableBuffering();
//        using var reader = new StreamReader(request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
//        var body = await reader.ReadToEndAsync();
//        request.Body.Position = 0;
//        return string.IsNullOrWhiteSpace(body) ? "No Request Body" : body;
//    }
//}

using System.Diagnostics;
using System.Text;
using Attendance.Data;
using Attendance.Models;

namespace Attendance.Middleware;

public class AuditLoggingMiddleware
{
    private readonly RequestDelegate _next;

    // 1. Define custom logging rules specifying paths and optional method overrides
    private static readonly List<(string PathSegment, string? HttpMethod)> ExclusionRules = new()
    {
        // Global path exclusions (any HTTP method)
        ("/login", null),
        ("/register", null),
        ("/forgot-password", null),
        ("/reset-password", null),
        ("/api/account/me", null),
        ("/profile", null),
        ("/me", null),
        ("/lookups", null),
        ("/next-code", null),
        ("/print", null),
        ("/generate-print-ticket", null),
        // Verb-Specific Exclusions:
        ("/users", "POST"),   // Skips User Creation & Status Toggles (POST)
        ("/users", "PUT"),    // Skips User Updates (PUT)
        ("/users", "DELETE"),  // Skips User Deletion (DELETE)
        ("/departments", "GET"),
        ("/employees","GET"),
        ("/emp-shifts","GET"),
        ("/machines","GET"),


    };

    public AuditLoggingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, DBContext dbContext)
    {
        var stopwatch = Stopwatch.StartNew();

        var endpoint = context.GetEndpoint();
        var controllerName = endpoint?.Metadata.GetMetadata<Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor>()?.ControllerName ?? string.Empty;
        var methodName = endpoint?.Metadata.GetMetadata<Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor>()?.ActionName ?? string.Empty;
        var httpMethod = context.Request.Method ?? "UNKNOWN";
        var requestPath = context.Request.Path.Value ?? string.Empty;

        // 2. Evaluate rules against both Path and HTTP Method
        bool isSensitiveRoute = ExclusionRules.Any(rule =>
            !string.IsNullOrEmpty(requestPath) &&
            requestPath.Contains(rule.PathSegment, StringComparison.OrdinalIgnoreCase) &&
            (rule.HttpMethod == null || string.Equals(rule.HttpMethod, httpMethod, StringComparison.OrdinalIgnoreCase))
        );

        string requestData = "[SENSITIVE DATA OMITTED FOR SECURITY]";
        if (!isSensitiveRoute)
        {
            requestData = await ReadRequestBodyAsync(context.Request);
        }

        // Intercept response stream
        var originalResponseBodyStream = context.Response.Body;
        using var responseBodyMemoryStream = new MemoryStream();
        context.Response.Body = responseBodyMemoryStream;

        string? exceptionMessage = null;
        string responseData = "[SENSITIVE RESPONSE OMITTED]";

        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            exceptionMessage = ex.ToString();
            throw;
        }
        finally
        {
            stopwatch.Stop();

            responseBodyMemoryStream.Position = 0;
            using var reader = new StreamReader(responseBodyMemoryStream, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, bufferSize: 1024, leaveOpen: true);
            var actualResponseText = await reader.ReadToEndAsync();

            if (!isSensitiveRoute)
            {
                responseData = (context.Response.StatusCode == 200 || context.Response.StatusCode == 201)
                    ? actualResponseText
                    : "Non-Success Payload";
            }

            responseBodyMemoryStream.Position = 0;
            await responseBodyMemoryStream.CopyToAsync(originalResponseBodyStream);
            context.Response.Body = originalResponseBodyStream;
        }

        // 3. Early exit if the combined Path + Verb rule matches
        if (isSensitiveRoute)
        {
            return;
        }

        // Gather User Identity
        int? userId = null;
        string? userName = null;

        if (context.User.Identity?.IsAuthenticated == true)
        {
            userName = context.User.Identity.Name;
            var userIdClaim = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                              ?? context.User.FindFirst("id")?.Value;

            if (int.TryParse(userIdClaim, out int parsedId))
            {
                userId = parsedId;
            }
        }

        // Compose and Save Audit Log
        var auditLog = new AuditLog
        {
            TimeStamp = DateTime.UtcNow,
            UserId = userId,
            UserName = userName,
            Action = $"{httpMethod} Request to {controllerName}/{methodName}",
            Controller = controllerName,
            Method = methodName,
            HttpMethod = httpMethod,
            StatusCode = context.Response.StatusCode,
            IpAddress = context.Connection.RemoteIpAddress?.ToString(),
            UserAgent = context.Request.Headers["User-Agent"].ToString(),
            RequestData = requestData,
            ResponseData = string.IsNullOrWhiteSpace(responseData) ? "No Response Body" : responseData,
            Exception = exceptionMessage,
            ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
            AdditionalInfo = $"Path: {context.Request.Path}{context.Request.QueryString}"
        };

        try
        {
            dbContext.AuditLogs.Add(auditLog);
            await dbContext.SaveChangesAsync();
        }
        catch (Exception dbEx)
        {
            System.Diagnostics.Debug.WriteLine($"Failed writing Audit Log to DB Context: {dbEx.Message}");
        }
    }

    private static async Task<string> ReadRequestBodyAsync(HttpRequest request)
    {
        request.EnableBuffering();
        using var reader = new StreamReader(request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
        var body = await reader.ReadToEndAsync();
        request.Body.Position = 0;
        return string.IsNullOrWhiteSpace(body) ? "No Request Body" : body;
    }
}