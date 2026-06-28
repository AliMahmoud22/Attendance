import { Link } from "react-router-dom";
export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className=" bg-[#1C4D8D]/95  p-10 rounded-2xl shadow-lg text-center max-w-md mx-auto">
        <div className="text-6xl mb-5">🚫</div>
        <h1 className="text-3xl font-bold text-red-600 mb-3">الوصول مرفوض</h1>
        <p className="text-white mb-6">
          ليس لديك إذن للوصول إلى هذه الصفحة. يرجى الاتصال بالمسؤول إذا كنت
          تعتقد أن هذا خطأ.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
        >
          العودة إلى الصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
