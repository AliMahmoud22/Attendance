using Microsoft.AspNetCore.Mvc;
using Rotativa.AspNetCore;

namespace Attendance.services
{
    public class RotativaPdfGeneratorService : IPdfGeneratorService
    {
        public IActionResult GeneratePdf(Controller controller, string viewName, object model, string fileName, bool Portrait)
        {
            return new ViewAsPdf(viewName, model)
            {
                PageSize = Rotativa.AspNetCore.Options.Size.A3,
                PageOrientation = Portrait ? Rotativa.AspNetCore.Options.Orientation.Portrait
                                           : Rotativa.AspNetCore.Options.Orientation.Landscape,
                // إضافة الترقيم هنا
                CustomSwitches = "--footer-center \"صفحة [page] من [toPage]\" " +
                 "--footer-font-size 10 " +
                 "--footer-spacing 5 " +
                 "--footer-font-name \"Arial\""
            };
        }
    }
}


