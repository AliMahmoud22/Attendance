using Microsoft.AspNetCore.Mvc;

namespace Attendance.services
{
    public interface IPdfGeneratorService
    {
        IActionResult GeneratePdf(Controller controller, string viewName, object model, string fileName, bool Portrait);
    }
}
