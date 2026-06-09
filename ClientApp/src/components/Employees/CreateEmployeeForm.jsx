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
export default function CreateEmployeeForm({
  departments,
  onSuccess,
  onClose,
}) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    empfinger: true,
    departmentID: "",
    gender: "0001",
    overTime: true,
    IS_Deleted: false,
    birth: "",
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
      const res = await apiFetch("/api/employees", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          code: Number(form.code),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data);
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
      <Field label="Employee Code">
        <input
          name="code"
          value={form.code}
          onChange={handleChange}
          required
          className={inputCls}
        />
      </Field>

      <Field label="Employee Name">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className={inputCls}
        />
      </Field>

      <Field label="Department">
        <select
          name="departmentID"
          value={form.departmentID}
          onChange={handleChange}
          required
          className={inputCls}
        >
          <option value="">Select Department</option>

          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Gender">
        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          className={inputCls}
        >
          <option value="0001">Male</option>
          <option value="0002">Female</option>
        </select>
      </Field>
      <Field label="Birth Date">
        <input
          type="date"
          name="birth"
          value={form.birth}
          onChange={handleChange}
          className={inputCls}
        />
      </Field>
      <Field label="Status">
        <select
          name="IS_Deleted"
          value={form.IS_Deleted}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              IS_Deleted: e.target.value === "true",
            }))
          }
          className={inputCls}
        >
          <option value="false">Active</option>
          <option value="true">Deleted</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-2 text-sm text-white">
          <input
            type="checkbox"
            name="empfinger"
            checked={form.empfinger}
            onChange={handleChange}
          />
          Finger Print
        </label>

        <label className="flex items-center gap-2 text-sm text-white">
          <input
            type="checkbox"
            name="overTime"
            checked={form.overTime}
            onChange={handleChange}
          />
          Over Time
        </label>
      </div>

      {error && <div className="text-red-400 text-sm">{error}</div>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-[#1C4D8D]"
        >
          {loading ? "Creating..." : "Create Employee"}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-700 text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
