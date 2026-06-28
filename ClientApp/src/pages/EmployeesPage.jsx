import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { useNavigate } from "react-router-dom";
import CreateEmployeeForm from "../components/Employees/CreateEmployeeForm";
import EditEmployeeForm from "../components/Employees/EditEmployeeForm";

import Modal from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(null);

  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const [hasMore, setHasMore] = useState(false);
  const [searchCode, setSearchCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [sortBy, setSortBy] = useState("code_asc");

  /* ───────────────────────────── */

  const loadEmployees = async (p = 1, replace = true) => {
    try {
      if (p === 1) setLoading(true);

      const params = new URLSearchParams({
        page: p,
        empCode: searchCode,
        empName: searchName,
        departmentId: departmentFilter,
        sortBy,
      });

      if (statusFilter !== "") params.append("status", statusFilter);

      const res = await apiFetch(`/api/employees?${params}`);
      if (!res || !res.ok) {
        if (res && res.status !== 403) {
          const errorData = await res.json().catch(() => ({}));
          showToast(errorData.message || "Failed to load employees", "error");
        }
        return;
      }

      const data = await res.json();
      setEmployees((prev) => (replace ? data.data : [...prev, ...data.data]));

      setHasMore(data.hasMore);

      setPage(p);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /* ───────────────────────────── */

  const loadLookups = async () => {
    try {
      const res = await apiFetch("/api/employees/lookups");
      if (!res || !res.ok) {
        if (res && res.status !== 403) {
          const errorData = await res.json().catch(() => ({}));
          showToast(errorData.message || "Failed to load departments", "error");
        }
        return;
      }
      const data = await res.json();

      setDepartments(data.departments);
    } catch {
      console.error(error);
    }
  };

  /* ───────────────────────────── */

  useEffect(() => {
    loadEmployees();
    loadLookups();
  }, []);

  /* ───────────────────────────── */

  const handleSuccess = (message) => {
    setModal(null);

    showToast(message);

    loadEmployees();
  };

  /* ───────────────────────────── */

  const handleDelete = async (employeeCode) => {
    try {
      const res = await apiFetch(`/api/employees/${employeeCode}`, {
        method: "DELETE",
      });

      if (!res || !res.ok) {
        if (res && res.status !== 403) {
          const data = await res.json().catch(() => ({}));
          showToast(data.message || "Delete failed", "error");
        }
        return; // اخرج فوراً ولا تكمل لتجنب الـ catch والـ Toasts المتداخلة
      }

      const data = await res.json();
      showToast(data.message || "Deleted successfully");
      setModal(null);
      loadEmployees();
    } catch {
      showToast("Server error", "error");
    }
  };

  const handleReset = async () => {
    setSearchCode("");
    setSearchName("");
    setDepartmentFilter("");
    setStatusFilter("");

    setSortBy("code_asc");
    try {
      setLoading(true);

      const res = await apiFetch("/api/employees?page=1&sortBy=code");

      const data = await res.json();

      setEmployees(data.data);

      setHasMore(data.hasMore);

      setPage(1);
    } catch {
      showToast("Failed to reset filters", "error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
      {/* Create Modal */}
      {modal === "create" && (
        <Modal title="Create Employee" onClose={() => setModal(null)}>
          <CreateEmployeeForm
            departments={departments}
            onSuccess={handleSuccess}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {modal?.type === "edit" && (
        <Modal title="Edit Employee" onClose={() => setModal(null)}>
          <EditEmployeeForm
            employee={modal.employee}
            departments={departments}
            onSuccess={handleSuccess}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Delete Modal */}
      {modal?.type === "delete" && (
        <Modal title="Delete Employee" onClose={() => setModal(null)}>
          <div className="text-center space-y-5">
            <p className="text-white text-lg font-semibold">
              {modal.employee.name}
            </p>

            <p className="text-gray-400">
              Are you sure you want to delete this employee?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(modal.employee.employeeCode)}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white"
              >
                Delete
              </button>

              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2 rounded-xl bg-gray-700 text-white"
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
              Employees
            </h1>
          </div>
          <button
            onClick={() => setModal("create")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl btn-action font-semibold text-white bg-[#1C4D8D] hover:bg-[#163d70] transition"
          >
            Add Employee
          </button>
        </div>
      </div>
      {/* Filters */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadEmployees();
        }}
        className="flex flex-col flex-wrap md:flex-row sm:flex-row gap-3 mb-6 p-4 rounded-2xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      >
        <input
          placeholder="Employee Code"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          className="flex-1 rounded-xl px-4 py-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 outline-none"
        />

        <input
          placeholder="Employee Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="flex-1 rounded-xl px-4 py-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 outline-none"
        />

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-md"
        >
          <option value="">جميع الادارات</option>

          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-md"
        >
          <option value="">All Status</option>
          <option value="false">Active</option>
          <option value="true">Deleted</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-md"
        >
          <option value="code_asc">الكود ↑</option>
          <option value="code_desc">الكود ↓</option>
          <option value="name_asc">الاسم ↑</option>
          <option value="name_desc">الاسم ↓</option>
        </select>

        <button className="px-4 py-2 rounded-xl btn-action bg-[#1C4D8D] text-white hover:bg-[#163d70]">
          Search
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 rounded-xl btn-action border border-gray-300 dark:border-gray-600"
        >
          Reset
        </button>
      </form>

      {/* Table */}
      <div
        dir="rtl"
        className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden text-center"
      >
        {/* Header */}
        <div className="grid grid-cols-8 bg-[#0C2B4E] text-white p-3 font-bold">
          <span>الكود</span>
          <span>الاسم</span>
          <span>الادارة</span>
          <span>تاريخ الميلاد</span>
          <span>الحاله</span>
          <span>البصمة</span>
          <span>الاضافي</span>
          <span>Actions</span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-10 text-center text-gray-800 dark:text-white">
            Loading...
          </div>
        )}

        {/* Empty */}
        {!loading && employees.length === 0 && (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400">
            لا يوجد موظفين
          </div>
        )}

        {/* Rows */}
        {!loading &&
          employees.map((e) => (
            <div
              key={e.employeeCode}
              className="grid grid-cols-8 p-3 gap-2 sm:gap-4 px-4 sm:px-6 py-4 border-t text-center bg-[#edeef0b7] hover:bg-[#0c2b4e4d] dark:hover:bg-[#696969b7] dark:bg-[#edeef0b7]/10 border-gray-200 dark:border-gray-700"
            >
              <span>{e.employeeCode}</span>
              <span>{e.name}</span>
              <span>{e.departmentName}</span>
              <span>
                {e.birth
                  ? `${e.birth.slice(0, 4)}-${e.birth.slice(4, 6)}-${e.birth.slice(6, 8)}`
                  : "-"}
              </span>
              <span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    e.status
                      ? "bg-red-200 text-red-700"
                      : "bg-green-200 text-green-700"
                  }`}
                >
                  {e.status ? "غير نشط" : "نشط"}
                </span>
              </span>
              <span>{e.empfinger ? "✔" : "❌"}</span>{" "}
              <span>{e.overTime ? "✔" : "❌"}</span>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() =>
                    navigate(
                      `/check-in-outs?empCode=${e.employeeCode}&filterType=emp`,
                    )
                  }
                  className="px-2 py-1 btn-action text-md rounded-lg bg-green-600 text-black"
                >
                  البصمات
                </button>
                <button
                  onClick={() =>
                    setModal({
                      type: "edit",
                      employee: e,
                    })
                  }
                  className="px-2 py-1 btn-action text-md rounded-lg bg-yellow-400 text-yellow-900"
                >
                  تعديل
                </button>

                <button
                  onClick={() =>
                    setModal({
                      type: "delete",
                      employee: e,
                    })
                  }
                  className="px-2 py-1 btn-action text-md rounded-lg bg-red-700 text-white"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}

        {/* Load More */}
        {hasMore && (
          <div className="p-4 flex justify-center">
            <button
              onClick={() => loadEmployees(page + 1, false)}
              className="px-5 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
