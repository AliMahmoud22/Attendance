using Attendance.Exceptions;

namespace Attendance.Middleware
{
    public class ExceptionMiddleware(RequestDelegate next)
    {
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await next(context);
            }
            catch (AppException ex)
            {
                context.Response.StatusCode = ex.StatusCode;
                context.Response.ContentType = "application/json";

                await context.Response.WriteAsJsonAsync(new
                {
                    message = ex.Message
                });
            }
            catch (Exception)
            {
                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/json";

                await context.Response.WriteAsJsonAsync(new
                {
                    message = "Something went wrong"
                });
            }
        }
    }
}