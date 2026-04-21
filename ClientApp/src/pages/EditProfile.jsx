import { useState, useEffect } from "react";

export default function EditProfile() {
  const [form, setForm] = useState({
    userName: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/account/profile")
      .then(r => r.json())
      .then(data => setForm(prev => ({ ...prev, userName: data.userName })))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (form.newPassword && form.newPassword !== form.confirmNewPassword) {
      setMessage({ text: "كلمتا المرور الجديدتان غير متطابقتين", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.message || "حدث خطأ", type: "error" });
      } else {
        setMessage({ text: data.message, type: "success" });
        setForm(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmNewPassword: "" }));
      }
    } catch {
      setMessage({ text: "حدث خطأ في الاتصال بالخادم", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 flex items-center justify-center" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">تعديل البيانات الشخصية</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم</label>
            <input
              name="userName"
              value={form.userName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <hr />

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الحالية</label>
            <input
              name="currentPassword"
              type="password"
              value={form.currentPassword}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الجديدة</label>
            <input
              name="newPassword"
              type="password"
              value={form.newPassword}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور الجديدة</label>
            <input
              name="confirmNewPassword"
              type="password"
              value={form.confirmNewPassword}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Message */}
          {message.text && (
            <div className={`p-3 rounded-lg text-center text-sm ${
              message.type === "success"
                ? "bg-green-100 border border-green-300 text-green-700"
                : "bg-red-100 border border-red-300 text-red-700"
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow transition disabled:opacity-60"
          >
            {loading ? "جاري التحديث..." : "تحديث"}
          </button>
        </form>
      </div>
    </div>
  );
}