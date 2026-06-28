/* eslint-disable no-empty */
import { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";

const ROLES = ["User", "SuperUser", "Admin", "SuperAdmin", "IT"];

/* ── Modal wrapper ── */
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ── Create User Form ── */
function CreateUserForm({ onSuccess, onClose }) {
  const [form, setForm] = useState({
    userName: "",
    password: "",
    confirmPassword: "",
    role: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/account/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "حدث خطأ");
      } else {
        onSuccess(data.message);
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          اسم المستخدم
        </label>
        <input
          name="userName"
          value={form.userName}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 dark:text-black rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          كلمة المرور
        </label>
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-xl dark:text-black px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          تأكيد كلمة المرور
        </label>
        <input
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-xl dark:text-black px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          الدور
        </label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-xl px-4 py-2 bg-white dark:text-black focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">اختر الدور</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center">
          {error}
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-60"
        >
          {loading ? "جاري الإنشاء..." : "إنشاء المستخدم"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl transition"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

/* ── Edit User Form ── */
function EditUserForm({ user, onSuccess, onClose }) {
  const [form, setForm] = useState({
    userName: user.userName,
    newPassword: "",
    role: user.role,
    status: user.status,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "select-one" && name === "status" ? value === "true" : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch(`/api/account/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "حدث خطأ");
      } else {
        onSuccess(data.message);
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username
        </label>
        <input
          name="userName"
          value={form.userName}
          onChange={handleChange}
          required
          className="w-full text-gray-700 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          New Password (optional)
        </label>
        <input
          name="newPassword"
          type="password"
          value={form.newPassword}
          onChange={handleChange}
          placeholder="Leave blank to keep current"
          className="w-full text-gray-700 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role
        </label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full text-gray-700 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          name="status"
          value={String(form.status)}
          onChange={handleChange}
          className="w-full text-gray-700 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="true">Active</option>
          <option value="false">Deactivated</option>
        </select>
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center">
          {error}
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── Main ManageUsers page ── */
export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null); // null | "create" | { type:"edit", user }

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/account/users");
      const data = await res.json();
      setUsers(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    try {
      const res = await apiFetch(`/api/account/users/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      showToast(data.message);
      loadUsers();
    } catch {}
  };
  const handleStatusToggle = async (id) => {
    try {
      const res = await apiFetch(`/api/account/users/${id}`, {
        method: "POST",
      });
      const data = await res.json();
      showToast(data.message);
      loadUsers();
    } catch {}
  };

  const handleSuccess = (msg) => {
    setModal(null);
    showToast(msg);
    loadUsers();
  };

  return (
    <div className="min-h-screen p-4 sm:p-6  ">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg font-medium transition-all">
          {toast}
        </div>
      )}

      {/* Modals */}
      {modal === "create" && (
        <Modal title="إضافة مستخدم جديد" onClose={() => setModal(null)}>
          <CreateUserForm
            onSuccess={handleSuccess}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === "edit" && (
        <Modal title="Edit User" onClose={() => setModal(null)}>
          <EditUserForm
            user={modal.user}
            onSuccess={handleSuccess}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      <div className="max-w-6xl mx-auto mt-10 bg-white shadow-lg rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Manage Users</h2>
          <button
            onClick={() => setModal("create")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow transition"
          >
            + Add New User
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded">
            <table className="min-w-full border-collapse divide-y divide-gray-200 text-sm text-gray-700">
              <thead className="bg-blue-300 text-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left">Username</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Last Login</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{user.userName}</td>
                    <td className="px-4 py-3">{user.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold text-white rounded-full shadow-sm ${
                          user.status ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        {user.status ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleString("ar-EG")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setModal({ type: "edit", user })}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleStatusToggle(user.id)}
                          className={`bg-gray-500 hover:bg-gray-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition ${
                            user.status
                              ? "bg-gray-500 hover:bg-gray-600"
                              : "bg-green-500 hover:bg-green-600"
                          }`}
                        >
                          {user.status ? "Deactivate" : "Active"}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
