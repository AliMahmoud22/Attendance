import { useState } from "react";
import { apiFetch } from "../../utils/api";

const inputCls =
  "w-full rounded-xl px-4 py-2 bg-[#1e293b] border border-[#334155] text-white";

function Field({ label, children }) {
  return (
    <div>
      <label className="block mb-2 text-sm text-gray-400">{label}</label>

      {children}
    </div>
  );
}

export default function EditEmployeeForm({
  employee,
  departments,
  onSuccess,
  onClose,
}) {
  const [form, setForm] = useState({
    code: employee.employeeCode || 0,
    name: employee.name || "",
    departmentID: employee.departmentId || "",
    gender: employee.gender || "0001",

    birth: employee.birth
      ? `${employee.birth.slice(0, 4)}-${employee.birth.slice(4, 6)}-${employee.birth.slice(6, 8)}`
      : "",

    empfinger: employee.empfinger || "",

    overTime: employee.overTime || false,

    IS_Deleted: employee.status || false,
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    setError("");

    try {
      const body = {
        ...form,

        birth: form.birth.replaceAll("-", ""),
      };

      const res = await apiFetch(`/api/employees`, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Update failed");
      } else {
        onSuccess(data.message);
      }
    } catch {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <Field label="Employee Name">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className={inputCls}
        />
      </Field>

      {/* Department */}
      <Field label="Department">
        <select
          name="departmentID"
          value={form.departmentID}
          onChange={handleChange}
          className={inputCls}
        >
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>

      {/* Gender */}
      <Field label="Gender">
        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          className={inputCls}
        >
          <option value="0001">ذكر</option>
          <option value="0002">انثى</option>
        </select>
      </Field>
      {/* Birth */}
      <Field label="Birth Date">
        <input
          type="date"
          name="birth"
          value={
            form.birth ??
            `${form.birth.slice(0, 4)}-${form.birth.slice(4, 6)}-${form.birth.slice(6, 8)}`
          }
          onChange={handleChange}
          className={inputCls}
        />
      </Field>

      {/* Finger ID */}
      <Field label="Finger Print">
        <label className="flex items-center gap-3 text-white">
          <input
            type="checkbox"
            name="empfinger"
            checked={form.empfinger}
            onChange={handleChange}
          />
          اظهار البصمة
        </label>
      </Field>

      {/* Overtime */}
      <Field label="Over Time">
        <label className="flex items-center gap-3 text-white">
          <input
            type="checkbox"
            name="overTime"
            checked={form.overTime}
            onChange={handleChange}
          />
          اظهار بصمة الاضافي
        </label>
      </Field>

      {/* Status */}
      <Field label="Status">
        <select
          name="IS_Deleted"
          value={form.IS_Deleted ? "true" : "false"}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              IS_Deleted: e.target.value === "true",
            }))
          }
          className={inputCls}
        >
          <option value="false">نشط</option>
          <option value="true">غير نشط</option>
        </select>
      </Field>

      {/* Error */}
      {error && <div className="text-red-400 text-sm">{error}</div>}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 rounded-xl bg-green-600 text-white"
        >
          {loading ? "...جاري الحفظ" : "حفظ"}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 rounded-xl bg-gray-700 text-white"
        >
          الغاء
        </button>
      </div>
    </form>
  );
}
