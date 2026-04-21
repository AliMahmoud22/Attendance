import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/* ── Reusable nav card ── */
// function NavCard({ to, label, children }) {
//   return (
//     <Link
//       to={to}
//       // className="bg-[#1C4D8D]/80 rounded-2xl p-8 text-center text-lg font-semibold text-white shadow-lg transform transition duration-400 hover:scale-105 hover:bg-[#4e5e72] hover:text-white flex flex-col items-center gap-3"
//     className="
//       bg-[#1C4D8D]/90 
//       dark:bg-[#10375C]
//       rounded-2xl p-8 text-center text-lg font-semibold 
//       text-white shadow-lg shadow-[#2A4759] dark:border-[#447D9B] dark:border-2 transform transition duration-300
//       hover:scale-105 hover:bg-[#1C4D8D]/80 dark:hover:bg-[#0C2D57]
//       flex flex-col items-center gap-3"
//     >
//       {children}
//       {label}
//     </Link>
//   );
// }
function NavCard({ to, label, children }) {
  return (
    <Link
      to={to}
      className="
        bg-[#1C4D8D] dark:bg-gray-800
        rounded-2xl p-6 sm:p-8
        text-center text-sm sm:text-lg font-semibold text-white
        shadow-md shadow-[#2A4759] dark:border-[#447D9B] dark:border-2
        flex flex-col items-center gap-3
        transition-all duration-300
        hover:scale-105
        hover:bg-[#163b6b] dark:hover:bg-gray-700
      "
    >
      {children}
      {label}
    </Link>
  );
}

export default function HomePage() {
  const { user } = useAuth();

  return (
    <>

      <h3 className="text-center text-3xl font-bold text-gray-700 dark:text-gray-100 mt-6 mb-6">🧭 نظام الحضور والانصراف</h3>

      <div className="flex justify-center items-center px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 w-full max-w-7xl" dir="rtl">

          {/* ساعات البصمة */}
          <NavCard to="/machines" label="ساعات البصمة">
            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a28.076 28.076 0 0 1-1.091 9M7.231 4.37a8.994 8.994 0 0 1 12.88 3.73M2.958 15S3 14.577 3 12a8.949 8.949 0 0 1 1.735-5.307m12.84 3.088A5.98 5.98 0 0 1 18 12a30 30 0 0 1-.464 6.232M6 12a6 6 0 0 1 9.352-4.974M4 21a5.964 5.964 0 0 1 1.01-3.328 5.15 5.15 0 0 0 .786-1.926m8.66 2.486a13.96 13.96 0 0 1-.962 2.683M7.5 19.336C9 17.092 9 14.845 9 12a3 3 0 1 1 6 0c0 .749 0 1.521-.031 2.311M12 12c0 3 0 6-2 9" />
            </svg>
          </NavCard>

          {/* حالة ساعات البصمة */}
          <NavCard to="/machines/connectivity" label="حالة ساعات البصمة">
            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a28.076 28.076 0 0 1-1.091 9M7.231 4.37a8.994 8.994 0 0 1 12.88 3.73M2.958 15S3 14.577 3 12a8.949 8.949 0 0 1 1.735-5.307m12.84 3.088A5.98 5.98 0 0 1 18 12a30 30 0 0 1-.464 6.232M6 12a6 6 0 0 1 9.352-4.974M4 21a5.964 5.964 0 0 1 1.01-3.328 5.15 5.15 0 0 0 .786-1.926m8.66 2.486a13.96 13.96 0 0 1-.962 2.683M7.5 19.336C9 17.092 9 14.845 9 12a3 3 0 1 1 6 0c0 .749 0 1.521-.031 2.311M12 12c0 3 0 6-2 9" />
            </svg>
          </NavCard>

          {/* الإدارات */}
          <NavCard to="/departments" label="الإدارات">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </NavCard>

          {/* الشيفتات */}
          <NavCard to="/shift-times" label="الشيفتات">
            <svg className="w-10 h-10 pt-2" fill="none" viewBox="0 -3 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-7a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </NavCard>

          {/* شيفتات الموظفين */}
          <NavCard to="/emp-shifts" label="شيفتات الموظفين">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a2 2 0 00-2-2h-3V8a2 2 0 00-2-2H9a2 2 0 00-2 2v8H4a2 2 0 00-2 2v2h5" />
            </svg>
          </NavCard>

          {/* بيانات الموظفين */}
          <NavCard to="/employees" label="بيانات الموظفين">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A8.966 8.966 0 0112 15c2.21 0 4.21.803 5.879 2.137M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </NavCard>

          {/* إدارة المستخدمين — IT only ── replaces @if (User.IsInRole("IT")) */}
          {user?.role === "IT" && (
            <NavCard to="/account/users" label="Manage Users">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A8.966 8.966 0 0112 15c2.21 0 4.21.803 5.879 2.137M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </NavCard>
          )}

          {/* الإجازات الرسمية */}
          <NavCard to="/official-holidays" label="الإجازات الرسمية">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M4 11h16M4 19h16" />
            </svg>
          </NavCard>

          {/* استعلام الحضور والانصراف */}
          <NavCard to="/check-in-outs" label="استعلام الحضور والانصراف">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M4 11h16M4 19h16" />
            </svg>
          </NavCard>

          {/* تقرير التأخيرات */}
          <NavCard to="/delay-report" label="تقرير التأخيرات">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" />
            </svg>
          </NavCard>

          {/* تقرير الغياب */}
          <NavCard to="/absence-report" label="تقرير الغياب">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a2 2 0 00-2-2h-3V8a2 2 0 00-2-2H9a2 2 0 00-2 2v8H4a2 2 0 00-2 2v2h5" />
            </svg>
          </NavCard>

          {/* تقرير الإضافي */}
          <NavCard to="/bonus-report" label="تقرير الإضافي">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2z" />
            </svg>
          </NavCard>

          {/* إجازات الموظف */}
          <NavCard to="/emp-holidays" label="اجازات الموظف">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M4 11h16M4 19h16" />
            </svg>
          </NavCard>

          {/* مأموريات الموظف */}
          <NavCard to="/employee-missions" label="مأموريات الموظف">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h6l6 6v10a2 2 0 01-2 2z" />
            </svg>
          </NavCard>

          {/* تصاريح وإذونات */}
          <NavCard to="/permits" label="تصاريح واذونات">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </NavCard>

        </div>
      </div>
    </>
  );
}