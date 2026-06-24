import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { param } from "framer-motion/client";
import Select from "react-select";
import { apiFetch } from "../utils/api";
import CustomSelect from "../components/CustomSelect";
import { useToast } from "../context/ToastContext";

/* ── Main ── */
export default function CheckInOutsPage() {
  const [data, setData] = useState([]);
  const [days, setDays] = useState([]);
  const [filterType, setFilterType] = useState("emp");
  const [searchParams] = useSearchParams();
  const today = new Date().toISOString().slice(0, 10);
  const { showToast } = useToast();

  const firstDay = new Date();
  firstDay.setDate(1);

  const initialFilters = {
    fromDate: firstDay.toISOString().slice(0, 10),
    toDate: today,
    departmentId: "",
    departmentIds: [],
    shiftType: "الكل",
    name: "",
    empCode: "",
    empCodeFrom: "",
    empCodeTo: "",
  };
  const [filters, setFilters] = useState(initialFilters);

  const handleReset = () => {
    setFilters(initialFilters);
    setFilterType("emp");
    setData([]);
    setDays([]);
    setCacheKey(null);
  };

  const [lookups, setLookups] = useState({
    departments: [],
    shifts: [],
  });

  const [loading, setLoading] = useState(false);
  const [cacheKey, setCacheKey] = useState(null);

  /* ── Load Lookups ── */
  const loadLookups = async () => {
    try {
      const res = await apiFetch("/api/check-in-outs/lookups");
      const json = await res.json();
      setLookups(json);
    } catch {
      showToast("Failed to load lookups");
    }
  };

  /* ── Load Data ── */
  const loadData = async (
    currentFilters = filters,
    currentFilterType = filterType,
  ) => {
    const hasFilter =
      currentFilters.name ||
      currentFilters.empCode ||
      currentFilters.departmentId ||
      currentFilters.departmentIds.length > 0 ||
      (currentFilters.empCodeFrom && currentFilters.empCodeTo);

    if (!hasFilter) {
      showToast(" اختر موظف أو إدارة أولاً ", "error");
      return;
    }

    setLoading(true);

    setLoading(true);

    try {
      const params = new URLSearchParams();

      params.append("fromDate", currentFilters.fromDate);
      params.append("toDate", currentFilters.toDate);
      params.append("shiftType", currentFilters.shiftType);

      if (currentFilterType === "name" && currentFilters.name) {
        params.append("filterType", "name");
        params.append("name", currentFilters.name);
      } else if (currentFilterType === "emp" && currentFilters.empCode) {
        params.append("filterType", "single");
        params.append("empCode", currentFilters.empCode);
      } else if (currentFilterType === "range") {
        params.append("filterType", "range");
        params.append("empCodeFrom", currentFilters.empCodeFrom);
        params.append("empCodeTo", currentFilters.empCodeTo);
      } else if (currentFilterType === "department") {
        params.append("departmentId", currentFilters.departmentId.trim());
      } else if (
        currentFilterType === "departments" &&
        currentFilters.departmentIds.length
      ) {
        params.append(
          "departmentIds",
          currentFilters.departmentIds.join(",").trim(),
        );
      }

      const res = await apiFetch(
        `/api/check-in-outs/CheckIns?${params.toString()}`,
      );

      if (!res || !res.ok) {
        if (res && res.status !== 403) {
          const errorData = await res.json().catch(() => ({}));
          showToast(errorData.message || "فشل جلب البصمات", "error");
        }
        return;
      }
      const json = await res.json();

      setData(json.data);
      setCacheKey(json.cacheKey);
      const start = new Date(currentFilters.fromDate);
      const end = new Date(currentFilters.toDate);

      const tempDays = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        tempDays.push(new Date(d).toISOString().slice(0, 10));
      }

      setDays(tempDays);

      showToast("تم تحميل البصمات", "success");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (date) => {
    return new Date(date).toLocaleDateString("ar-SA", {
      weekday: "short",
    });
  };

  useEffect(() => {
    loadLookups();

    const empCode = searchParams.get("empCode");
    const filter = searchParams.get("filterType");

    if (empCode && filter === "emp") {
      const newFilters = {
        ...initialFilters,
        empCode,
      };

      setFilterType("emp");
      setFilters(newFilters);

      loadData(newFilters, "emp");
    }
  }, []);
  /* ── Secured Print ── */
  const handlePrint = async () => {
    if (!cacheKey) return;

    try {
      // 1. نطلب تذكرة طباعة مؤقتة وآمنة من السيرفر باستخدام الـ cacheKey الحالي
      const ticketRes = await apiFetch(
        `/api/check-in-outs/generate-print-ticket?key=${cacheKey}`,
      );

      if (!ticketRes || !ticketRes.ok) {
        const errJson = await ticketRes.json().catch(() => ({}));
        showToast(
          errJson.message || "غير مسموح لك بالطباعة أو انتهت الجلسة",
          "error",
        );
        return;
      }

      const { ticket } = await ticketRes.json();

      // 2. بناء باراميترز الرابط مع تمرير الـ ticket بدلاً من الـ key القديم
      const params = new URLSearchParams();
      params.append("ticket", ticket); // التذكرة الأمنية المشفرة المؤقتة
      params.append("shiftType", filters.shiftType);
      params.append("fromDate", filters.fromDate);
      params.append("toDate", filters.toDate);

      if (filterType === "departments" && filters.departmentIds.length) {
        params.append(
          "departmentName",
          filters.departmentIds
            .map(
              (id) => lookups.departments.find((d) => d.id === id)?.name || "",
            )
            .join(","),
        );
      }
      if (filterType === "department" && filters.departmentId != null) {
        params.append(
          "departmentName",
          lookups.departments.find((d) => d.id === filters.departmentId)
            ?.name || "",
        );
      }

      // 3. فتح الرابط الآمن الآن في تبويب جديد بنجاح
      window.open(`/api/check-in-outs/print?${params.toString()}`, "_blank");
    } catch (error) {
      console.error("Print Error:", error);
      showToast("حدث خطأ أثناء إعداد ملف الطباعة", "error");
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      {/* Header */}
      <div className="flex justify-between">
        <div className="mb-6 flex justify-between items-center flex-wrap gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">
            تقرير الحضور والانصراف
          </h1>
        </div>
        <div className="mb-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl px-3 py-2 border 
             bg-white dark:bg-gray-800 
             text-gray-800 dark:text-gray-100
             border-gray-300 dark:border-gray-600
             focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="emp">كود موظف</option>
            <option value="name">اسم الموظف</option>
            <option value="range"> مجموعة اكواد موظفين</option>
            <option value="department">ادارة</option>
            <option value="departments">مجموعة ادارات</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadData();
        }}
        className="grid sm:grid-cols-8 gap-3 mb-6 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-700"
        dir="rtl"
      >
        {/* Dates always visible */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">من: </label>
          <input
            required
            type="date"
            value={filters.fromDate}
            onChange={(e) =>
              setFilters((p) => ({ ...p, fromDate: e.target.value }))
            }
            className="rounded-xl px-3 py-2 border dark:bg-gray-700"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">الي: </label>
          <input
            required
            type="date"
            value={filters.toDate}
            onChange={(e) =>
              setFilters((p) => ({ ...p, toDate: e.target.value }))
            }
            className="rounded-xl px-3 py-2 border dark:bg-gray-700"
          />
        </div>
        {/* 👤 Single Employee */}
        {filterType === "emp" && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">كود الموظف</label>
            <input
              type="number"
              value={filters.empCode}
              onChange={(e) =>
                setFilters((p) => ({ ...p, empCode: e.target.value }))
              }
              className="rounded-xl px-3 py-2 border dark:bg-gray-700"
            />
          </div>
        )}
        {/*  Employee's Name */}
        {filterType === "name" && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">اسم الموظف</label>
            <input
              type="text"
              value={filters.name}
              onChange={(e) =>
                setFilters((p) => ({ ...p, name: e.target.value }))
              }
              className="rounded-xl px-4 py-2 border dark:bg-gray-700"
            />
          </div>
        )}

        {/* 👥 Range */}
        {filterType === "range" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">كود الموظف</label>
              <input
                type="number"
                placeholder="From"
                value={filters.empCodeFrom}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, empCodeFrom: e.target.value }))
                }
                className="rounded-xl px-3 py-2 border dark:bg-gray-700"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">كود الموظف</label>
              <input
                type="number"
                placeholder="To"
                value={filters.empCodeTo}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, empCodeTo: e.target.value }))
                }
                className="rounded-xl px-3 py-2 border dark:bg-gray-700"
              />
            </div>
          </>
        )}

        {/* 🏢 Single Department */}
        {filterType === "department" && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">ادارة</label>

            <CustomSelect
              options={lookups.departments.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
              value={lookups.departments
                .map((d) => ({ value: d.id, label: d.name }))
                .find((o) => o.value === filters.departmentId)}
              onChange={(selected) =>
                setFilters((p) => ({
                  ...p,
                  departmentId: selected?.value || "",
                }))
              }
            />
          </div>
        )}

        {/* 🏢🏢 Multi Departments */}
        {filterType === "departments" && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">الادارات</label>
            <CustomSelect
              isMulti
              options={lookups.departments.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
              value={lookups.departments
                .filter((d) => filters.departmentIds.includes(d.id))
                .map((d) => ({ value: d.id, label: d.name }))}
              onChange={(selected) =>
                setFilters((p) => ({
                  ...p,
                  departmentIds: selected.map((s) => s.value), // 👈 الترتيب محفوظ
                }))
              }
            />
          </div>
        )}

        {/* Shift always optional */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">الشيفت</label>
          <select
            value={filters.shiftType}
            onChange={(e) =>
              setFilters((p) => ({ ...p, shiftType: e.target.value }))
            }
            className="rounded-xl px-3 py-2 border 
             bg-white dark:bg-gray-800 
             text-gray-800 dark:text-gray-100
             border-gray-300 dark:border-gray-600
             focus:ring-2 focus:ring-blue-500 outline-none "
          >
            {lookups.shifts.map((s, i) => (
              <option key={i}>{s}</option>
            ))}
          </select>
        </div>

        <button className="bg-[#1C4D8D] hover:bg-[#163a69] text-white rounded-xl px-4 py-2">
          Search
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 rounded-xl bg-gray-500 text-white hover:bg-gray-600 transition"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition"
        >
          🖨 Print
        </button>
      </form>

      {/* Table */}
      <div
        className="overflow-auto scrollbar scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-mist-600 scrollbar-track-gray-300 max-h-screen rounded-2xl border bg-white dark:bg-gray-800"
        dir="rtl"
      >
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && (
          <table
            className="min-w-max  table-auto text-sm text-center border border-gray-300 dark:border-gray-600"
            dir="rtl"
          >
            <thead>
              <tr>
                <th
                  className="
                            sticky top-0 right-0 z-40
                            bg-[#0C2B4E]
                            p-4 border
                            whitespace-nowrap
                            text-white
                          "
                >
                  الكود
                </th>

                <th
                  className="
                            sticky top-0 right-5 z-40
                            bg-[#0C2B4E]
                            p-4 border
                            whitespace-nowrap
                            text-white
                          "
                >
                  الاسم
                </th>

                {days.map((d) => {
                  const dayName = new Date(d).getDay();

                  const isWeekend = dayName === 4 || dayName === 5;

                  return (
                    <th
                      key={d}
                      className={`
            sticky top-0 z-40
            p-4 border whitespace-nowrap
            ${isWeekend ? "bg-gray-600 text-white" : "bg-[#0C2B4E] text-white"}
          `}
                    >
                      <div className="text-xs">{getDayName(d)}</div>

                      <div className="text-xs">{d.slice(5)}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {data.map((emp, i) => (
                <tr key={i} className="border-t  transition">
                  <td
                    className="
                      sticky right-0 z-30
                      bg-white dark:bg-gray-800
                      font-semibold border  
                      whitespace-nowrap px-3
                    "
                  >
                    {emp.empCode}
                  </td>

                  <td
                    className="
                          sticky right-5 z-30
                          bg-white dark:bg-gray-800
                          font-semibold border
                          whitespace-nowrap px-3
                        "
                  >
                    {emp.empName}
                  </td>

                  {days.map((d) => {
                    const dayName = new Date(d).getDay(); // 0=Sunday

                    const isWeekend = dayName === 4 || dayName === 5; // Thu, Fri

                    return (
                      <td
                        className={`border border-gray-300 font-bold hover:bg-green-300 dark:hover:bg-green-900  ${isWeekend ? "bg-gray-600 text-white" : ""}  dark:border-white px-2 py-4`}
                        dangerouslySetInnerHTML={{
                          __html: emp.days[d]?.join("<br/>") || "-",
                        }}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
