import { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";
import Toast from "../components/ui/Toast";
import Modal from "../components/ui/Modal";

const inputCls = `w-full rounded-xl px-4 py-2 bg-[#1e293b] border border-[#334155] text-white`;

/* ── Create ── */
function CreateForm({ onSuccess, onClose }) {
  const [form, setForm] = useState({ Id: "", Name: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/departments", {
        method: "POST",
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else setError(data.message || "حدث خطأ ما");
      } else {
        setFieldErrors({});
        onSuccess("Created successfully");
      }
    } catch {
      setError("حدث خطا في الخادم");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase mb-2 text-[#64748b]">
          Code
        </label>
        <input
          name="Id"
          placeholder="Code"
          className={inputCls}
          onChange={(e) => setForm({ ...form, Id: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase mb-2 text-[#64748b]">
          Name
        </label>
        <input
          name="Name"
          placeholder="Name"
          className={inputCls}
          onChange={(e) => setForm({ ...form, Name: e.target.value })}
        />
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm text-red-400"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          {error}
        </div>
      )}
      {Object.keys(fieldErrors).length > 0 && (
        <div className="text-red-400 text-xl text-center">
          {Object.entries(fieldErrors).map(([key, msgs]) => (
            <p key={key}>{msgs[0]}</p>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button className="flex-1 bg-blue-600 btn-action text-white rounded-xl py-2">
          Create
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-700 btn-action text-white rounded-xl py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── Edit ── */
function EditForm({ dept, onSuccess, onClose }) {
  const [form, setForm] = useState({
    Name: dept.name,
    NewCode: dept.id,
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      const res = await apiFetch(`/api/departments/${dept.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      console.log(data);
      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else setError(data.message || "حدث خطأ ما");
      } else {
        setFieldErrors({});
        onSuccess("Updated successfully");
      }
    } catch {
      setError("حدث خطا في الخادم");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase mb-2 text-[#64748b]">
          Code
        </label>
        <input
          value={form.NewCode}
          onChange={(e) => setForm({ ...form, NewCode: e.target.value })}
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase mb-2 text-[#64748b]">
          Name
        </label>
        <input
          value={form.Name}
          onChange={(e) => setForm({ ...form, Name: e.target.value })}
          className={inputCls}
        />
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm text-red-400"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          {error}
        </div>
      )}
      {Object.keys(fieldErrors).length > 0 && (
        <div className="text-red-400 text-xl text-center">
          {Object.entries(fieldErrors).map(([key, msgs]) => (
            <p key={key}>{msgs[0]}</p>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button className="flex-1 btn-action bg-green-600 text-white py-2 rounded-xl">
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-700 btn-action text-white rounded-xl py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── Main Page ── */
export default function DepartmentsPage() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("name");
  const [sortOrder, setSort] = useState("");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async (customParams = {}) => {
    try {
      const params = new URLSearchParams({
        search: customParams.search ?? search,
        filterBy: customParams.filterBy ?? filterBy,
        sortOrder: customParams.sortOrder ?? sortOrder,
      });
      console.log(params.toString());

      const res = await apiFetch(`/api/departments?${params}`);
      const json = await res.json();
      console.log(res);
      setData(json);
    } catch {
      showToast("Failed to load data", "error");
    }
  };

  const handleDelete = async (dept) => {
    try {
      const res = await apiFetch(`/api/departments/${dept.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Failed to delete", "error");
      } else {
        showToast(data.message);
      }
      setModal(null);
      load();
    } catch {
      showToast("Failed to delete", "error");
    }
  };
  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Create Department */}
      {modal === "create" && (
        <Modal title="New Department" onClose={() => setModal(null)}>
          <CreateForm
            onSuccess={(m) => {
              showToast(m);
              setModal(null);
              load();
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {/* Edit Department */}
      {modal?.type === "edit" && (
        <Modal title="Edit" onClose={() => setModal(null)}>
          <EditForm
            dept={modal.dept}
            onSuccess={(m) => {
              showToast(m);
              setModal(null);
              load();
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {/* Delete Department */}
      {modal?.type === "delete" && (
        <Modal title="Confirm Delete" onClose={() => setModal(null)}>
          <div className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-white font-semibold mb-1">{modal.dept.name}</p>
            <p className="text-sm mb-6" style={{ color: "#94a3b8" }}>
              This department will be deleted. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(modal.dept)}
                className="flex-1 py-2.5 btn-action rounded-xl font-bold text-sm text-white"
                style={{
                  background: "linear-gradient(135deg,#ef4444,#dc2626)",
                }}
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 btn-action rounded-xl font-bold text-sm"
                style={{ background: "#1e293b", color: "#94a3b8" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="mb-8" style={{ animation: "fadeSlideUp 0.4s ease both" }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
              Departments
            </h1>
          </div>
          <button
            onClick={() => setModal("create")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl btn-action font-semibold text-white bg-[#1C4D8D] hover:bg-[#163d70] transition"
          >
            Add Department
          </button>
        </div>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row gap-3 mb-6 p-4 rounded-2xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="flex-1 rounded-xl px-4 py-2  border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 outline-none"
        />

        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
          className="px-3 py-2  rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-md"
        >
          <option value="name">Name</option>
          <option value="id">Code</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2  rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-md"
        >
          <option value="name_asc">Name ↑</option>
          <option value="name_desc">Name ↓</option>
        </select>

        <button className="px-4 py-2 rounded-xl btn-action bg-[#1C4D8D] text-white hover:bg-[#163d70]">
          Search
        </button>
        <button
          type="button"
          onClick={() => {
            const reset = { search: "", filterBy: "", sortOrder: "" };
            setSearch("");
            setFilterBy("");
            setSort("");
            load(reset);
          }}
          className="px-4 py-2 rounded-xl btn-action border border-gray-300 dark:border-gray-600"
        >
          Reset
        </button>
      </form>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl text-center  overflow-hidden">
        <div className="grid grid-cols-3 bg-[#0C2B4E] text-white p-3">
          <span>Code</span>
          <span>Name</span>
          <span>Actions</span>
        </div>

        {data.map((d) => (
          <div
            key={d.id}
            className="grid grid-cols-3  p-3 gap-2 sm:gap-4 px-4 sm:px-6 py-4 border-t text-center bg-[#edeef0b7]  hover:bg-[#0c2b4e4d]  dark:hover:bg-[#696969b7] dark:bg-[#edeef0b7]/10 border-gray-200 dark:border-gray-700"
          >
            <span>{d.id}</span>
            <span>{d.name}</span>
            <div className="flex  justify-center gap-2">
              <button
                onClick={() => setModal({ type: "edit", dept: d })}
                className="px-2 py-1 btn-action text-md rounded bg-yellow-300 text-yellow-900"
              >
                Edit
              </button>
              <button
                onClick={() => setModal({ type: "delete", dept: d })}
                className="px-2 py-1 btn-action text-md rounded bg-red-300 text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
