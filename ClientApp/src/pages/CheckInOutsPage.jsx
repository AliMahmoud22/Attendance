import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { param } from "framer-motion/client";

/* ── Toast ── */
function Toast({ message, type = "success" }) {
  const colors = {
    success: "bg-green-500/40",
    error: "bg-red-500/40",
  };

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl text-white text-sm z-50 backdrop-blur ${colors[type]}`}
      style={{ animation: "slideDown 0.3s" }}
    >
      {message}
    </div>
  );
}

/* ── Main ── */
export default function CheckInOutsPage() {
  const [data, setData] = useState([]);
  const [days, setDays] = useState([]);
  const [filterType, setFilterType] = useState("");
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    departmentId: "",
    departmentIds: [],
    shiftType: "",
    empCode: "",
    empCodeFrom: "",
    empCodeTo: "",
  });

  const [lookups, setLookups] = useState({
    departments: [],
    shifts: [],
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [cacheKey, setCacheKey] = useState(null);

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Load Lookups ── */
  const loadLookups = async () => {
    try {
      const res = await apiFetch("/api/check-in-outs/lookups");
      const json = await res.json();
      setLookups(json);
    } catch {
      showToast("Failed to load filters");
    }
  };

  /* ── Load Data ── */
  const loadData = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      params.append("fromDate", filters.fromDate);
      params.append("toDate", filters.toDate);
      params.append("shiftType", filters.shiftType);

      // 👇 dynamic filters
      if (filterType === "emp" && filters.empCode) {
        params.append("filterType", "single");
        params.append("empCode", filters.empCode);
      }

      if (filterType === "range") {
        params.append("filterType", "range");
        params.append("empCodeFrom", filters.empCodeFrom);
        params.append("empCodeTo", filters.empCodeTo);
      }

      if (filterType === "department") {
        params.append("departmentId", filters.departmentId.trim());
      }

      if (filterType === "departments") {
        filters.departmentIds.forEach((id) =>
          params.append("departmentIds", id.trim()),
        );
      }
      console.log(params.get("departmentId"));
      console.log(`/api/check-in-outs/CheckIns?${params.toString()}`);
      const res = await apiFetch(`/api/check-in-outs/CheckIns?${params}`);
      const json = await res.json();

      setData(json.data);
      setCacheKey(json.cacheKey);

      // days logic...
      const start = new Date(filters.fromDate);
      const end = new Date(filters.toDate);

      const tempDays = [];
      for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
        tempDays.push(new Date(d).toISOString().slice(0, 10));
      }

      setDays(tempDays);
    } catch {
      showToast("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
    loadData();
  }, []);

  /* ── Print ── */
  const handlePrint = () => {
    if (!cacheKey) return;
    var deptName =
      lookups.departments.find((d) => d.id === filters.departmentId)?.name ||
      "";
    window.open(
      `/api/check-in-outs/print?key=${cacheKey}&departmentName=${deptName}&shiftType=${filters.shiftType}&fromDate=${filters.fromDate}&toDate=${filters.toDate}`,
      "_blank",
    );
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="mb-6 flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">Attendance Report</h1>
      </div>
      <div className="mb-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl px-3 py-2 border"
        >
          <option value="">Select Filter Type</option>
          <option value="emp">Employee</option>
          <option value="range">Employee Range</option>
          <option value="department">Department</option>
          <option value="departments">Group of Departments</option>
        </select>
      </div>
      {/* Filters */}
      <div className="grid sm:grid-cols-7 gap-3 mb-6 p-4 rounded-2xl bg-white dark:bg-gray-800 border">
        {/* Dates always visible */}
        <div className="flex flex-col gap-1">
          <span className="text-center ">from :</span>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) =>
              setFilters((p) => ({ ...p, fromDate: e.target.value }))
            }
            className="rounded-xl px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-center ">to :</span>
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) =>
              setFilters((p) => ({ ...p, toDate: e.target.value }))
            }
            className="rounded-xl px-3 py-2"
          />
        </div>

        {/* 👤 Single Employee */}
        {filterType === "emp" && (
          <input
            type="number"
            placeholder="Emp Code"
            value={filters.empCode}
            onChange={(e) =>
              setFilters((p) => ({ ...p, empCode: e.target.value }))
            }
            className="rounded-xl px-3 py-2"
          />
        )}

        {/* 👥 Range */}
        {filterType === "range" && (
          <>
            <input
              type="number"
              placeholder="From"
              value={filters.empCodeFrom}
              onChange={(e) =>
                setFilters((p) => ({ ...p, empCodeFrom: e.target.value }))
              }
              className="rounded-xl px-3 py-2"
            />
            <input
              type="number"
              placeholder="To"
              value={filters.empCodeTo}
              onChange={(e) =>
                setFilters((p) => ({ ...p, empCodeTo: e.target.value }))
              }
              className="rounded-xl px-3 py-2"
            />
          </>
        )}

        {/* 🏢 Single Department */}
        {filterType === "department" && (
          <select
            onChange={(e) =>
              setFilters((p) => ({ ...p, departmentId: e.target.value }))
            }
            className="rounded-xl px-3 py-2"
          >
            <option value="">Select Department</option>
            {lookups.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}

        {/* 🏢🏢 Multi Departments */}
        {filterType === "departments" && (
          <select
            multiple
            onChange={(e) => {
              const values = Array.from(
                e.target.selectedOptions,
                (o) => o.value,
              );
              setFilters((p) => ({ ...p, departmentIds: values }));
            }}
            className="rounded-xl px-3 py-2 h-24"
          >
            {lookups.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}

        {/* Shift always optional */}
        <select
          onChange={(e) =>
            setFilters((p) => ({ ...p, shiftType: e.target.value }))
          }
          className="rounded-xl px-3 py-2"
        >
          {lookups.shifts.map((s, i) => (
            <option key={i}>{s}</option>
          ))}
        </select>

        <button
          onClick={loadData}
          className="bg-[#1C4D8D] hover:bg-[#163a69] text-white rounded-xl px-4 py-2"
        >
          Search
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition"
        >
          🖨 Print
        </button>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-2xl border bg-white dark:bg-gray-800">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && (
          <table className="min-w-full text-sm text-center" dir="rtl">
            <thead className="bg-[#0C2B4E] text-white">
              <tr>
                <th className="p-2">Code</th>
                <th className="p-2">Name</th>
                {days.map((d) => (
                  <th key={d} className="p-2">
                    {d.slice(5)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.map((emp, i) => (
                <tr
                  key={i}
                  className="border-t hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <td>{emp.empCode}</td>
                  <td className="font-semibold">{emp.empName}</td>

                  {days.map((d) => (
                    <td
                      key={d}
                      dangerouslySetInnerHTML={{
                        __html: emp.days[d]?.join("<br/>") || "-",
                      }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
