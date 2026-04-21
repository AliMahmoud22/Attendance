/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
export default function AttendanceMonthly() {
    const [filterType, setFilterType] = useState("single");
    const [filters, setFilters] = useState({
        empCode: "",
        empCodeFrom: "",
        empCodeTo: "",
        departmentId: "",
        shiftType: "",
        fromDate: "",
        toDate: "",
    });

    const [departments, setDepartments] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [cacheKey, setCacheKey] = useState(null);
    const [data, setData] = useState([]);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const shiftOptions = shifts.map(s => ({
        value: s,
        label: s
    }));
    const departmentOptions = departments.map(d => ({
        value: d.id,
        label: d.name
    }));

    /* ================= LOOKUPS ================= */
    useEffect(() => {
        fetch("/CheckInOuts/Lookups")
            .then(r => r.json())
            .then(res => {
                setDepartments(Array.isArray(res.departments) ? res.departments : []);
                setShifts(Array.isArray(res.shifts) ? res.shifts : []);
            });
    }, []);

    /* ================= DAYS ================= */
    const days = useMemo(() => {
        if (!fromDate || !toDate) return [];
        const result = [];
        const start = new Date(fromDate);
        const end = new Date(toDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            result.push(new Date(d));
        }
        return result;
    }, [fromDate, toDate]);

    /* ================= HANDLERS ================= */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const submitFilters = async (e) => {
        e.preventDefault();
        setLoading(true);

        // remove empty values
        const cleanFilters = Object.fromEntries(
            Object.entries({ filterType, ...filters })
                .filter(([_, v]) => v !== "" && v != null)
        );

        const params = new URLSearchParams(cleanFilters);

        const res = await fetch(`/CheckInOuts/IndexJson?${params}`);
        const json = await res.json();
        setData(json.data);
        setFromDate(json.fromDate);
        setToDate(json.toDate);
        setCacheKey(json.cacheKey);
        setLoading(false);
    };

    const resetFilters = () => {
        setFilterType("single");
        setFilters({
            empCode: "",
            empCodeFrom: "",
            empCodeTo: "",
            departmentId: "",
            shiftType: "",
            fromDate: "",
            toDate: "",
        });
        setData([]);
        setFromDate(null);
        setToDate(null);
        setCacheKey(null);
    };

    const printReport = () => {
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v !== "" && v != null)
        );
        let url, selectedDepartment;
        const params = new URLSearchParams(cleanFilters).toString();
        if (cleanFilters.departmentId != null) {
            selectedDepartment = departments.find(
                d => d.id === cleanFilters.departmentId
            ).name;
            url = `/CheckInOuts/PrintReport?key=${cacheKey}&${params}&DepartmentName=${selectedDepartment}`;
        }
        else {
            url = `/CheckInOuts/PrintReport?key=${cacheKey}&${params}`;
    }
        

        window.open(url, "_blank");
    };




    /* ================= UI ================= */
    return (
        <div className="p-6 bg-gradient-to-br from-green-300 rounded-lg to-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold text-center mb-6">📅 مواعيد الحضور والانصراف</h1>

            {/* FILTERS */}
            <form
                onSubmit={submitFilters}
                className="bg-white rounded-xl shadow p-4 grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
            >
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border rounded-lg p-2"
                >
                    <option value="single">كود موظف</option>
                    <option value="range">مجموعة أكواد</option>
                </select>

                {filterType === "single" && (
                    <input
                        type="number"
                        name="empCode"
                        placeholder="كود الموظف"
                        value={filters.empCode}
                        onChange={handleChange}
                        className="border rounded-lg p-2"
                    />
                )}

                {filterType === "range" && (
                    <>
                        <input
                            type="number"
                            name="empCodeFrom"
                            placeholder="من كود"
                            value={filters.empCodeFrom}
                            onChange={handleChange}
                            className="border rounded-lg p-2"
                        />
                        <input
                            type="number"
                            name="empCodeTo"
                            placeholder="إلى كود"
                            value={filters.empCodeTo}
                            onChange={handleChange}
                            className="border rounded-lg p-2"
                        />
                    </>
                )}

                <Select
                    options={shiftOptions}
                    isClearable
                    placeholder="-- الشيفت --"
                    value={shiftOptions.find(o => o.value === filters.shiftType) || null}
                    onChange={(selected) =>
                        setFilters(prev => ({
                            ...prev,
                            shiftType: selected ? selected.value : ""
                        }))
                    }
                />

                <Select
                    options={departmentOptions}
                    maxMenuHeight={150}
                    isClearable
                    placeholder="-- اختر القسم --"
                    value={departmentOptions.find(o => o.value === filters.departmentId) || null}
                    onChange={(selected) =>
                        setFilters(prev => ({
                            ...prev,
                            departmentId: selected ? selected.value : ""
                        }))
                    }
                />
                <div>
                    <label class="block text-gray-700 font-medium mb-1">من تاريخ</label>
                    <input type="date" name="fromDate" value={filters.fromDate} onChange={handleChange} className="border rounded-lg p-2 w-full" />
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-1">إلى تاريخ</label>
                    <input type="date" name="toDate" value={filters.toDate} onChange={handleChange} className="border rounded-lg p-2 w-full" />
                </div>

                <div
                    className="flex items-center justify-center gap-3 col-span-full mt-2"
                >
                    {/* PRINT */}
                    <button
                        type="button"
                        onClick={printReport}
                        disabled={!data.length}
                        className="px-5 py-2 border border-green-500 text-green-600 rounded-lg shadow
                   hover:bg-green-100 transition disabled:opacity-50"
                    >
                        🖨 طباعة التقرير
                    </button>

                    {/* FILTER */}
                    <button
                        type="submit"
                        className="px-5 py-2 bg-green-500 text-white rounded-lg shadow
                   hover:bg-green-600 transition"
                        disabled={loading}
                    >
                        {loading ? "⏳ جاري التحميل..." : "فلترة"}
                    </button>

                    {/* RESET */}
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="px-5 py-2 bg-gray-400 text-white rounded-lg shadow
                   hover:bg-gray-500 transition"
                    >
                        إعادة تعيين
                    </button>
                </div>



            </form>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow overflow-auto max-h-[70vh]">
                {loading && (
                    <div className="flex justify-center items-center py-6">
                        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
                    </div>
                )}

                {!loading && (
                    <table className="w-full border-collapse text-center text-sm rounded" >
                        <thead className="sticky top-0 bg-green-600 text-white z-10">
                            <tr>
                                <th className="border p-2">الكود</th>
                                <th className="border p-2">الاسم</th>
                                {days.map(d => (
                                    <th key={d} className="border p-2">
                                        {d.toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit" })}
                                        <br />
                                        {d.toLocaleDateString("ar-EG", { weekday: "short" })}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(emp => (
                                <tr key={emp.empCode} className="hover:bg-gray-50">
                                    <td className="border">{emp.empCode}</td>
                                    <td className="border font-semibold">{emp.empName}</td>
                                    {days.map(d => {
                                        const key = d.toISOString().split("T")[0];
                                        return (
                                            <td key={key} className="border text-xs">
                                                {emp.days[key]?.map((t, i) => <div key={i}>{t}</div>) || "-"}
                                            </td>
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
