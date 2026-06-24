//using Attendance.Exceptions;

//namespace Attendance.Middleware
//{
//    public class ExceptionMiddleware(RequestDelegate next)
//    {
//        public async Task InvokeAsync(HttpContext context)
//        {
//            try
//            {
//                await next(context);
//            }
//            catch (AppException ex)
//            {
//                context.Response.StatusCode = ex.StatusCode;
//                context.Response.ContentType = "application/json";

//                await context.Response.WriteAsJsonAsync(new
//                {
//                    message = ex.Message
//                });
//            }
//            catch (Exception)
//            {
//                context.Response.StatusCode = 500;
//                context.Response.ContentType = "application/json";

//                await context.Response.WriteAsJsonAsync(new
//                {
//                    message = "Something went wrong"
//                });
//            }
//        }
//    }
//}
using System.Net;
using System.Text.Json;

namespace Attendance.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            // Structural Logging passes payload context details into separate SQL table columns
            _logger.LogError(ex, "An exception caught at route {Path} during processing.", context.Request.Path);

            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError; // 500

        var response = new
        {
            statusCode = context.Response.StatusCode,
            message = "حدث خطأ غير متوقع في السيرفر. برجاء المحاولة لاحقاً.",
            detailed = exception.Message
        };

        return context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}