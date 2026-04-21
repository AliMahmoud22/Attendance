///* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Select from "react-select";
import { useRef } from "react";


function Employees() {
    const [employees, setEmployees] = useState([]);
    const [name, setName] = useState("");
    const [code, setCode] = useState(null);
    const [departmentId, setDepartmentId] = useState("");
    const [page, setPage] = useState(1);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [hasMore, setHasMore] = useState(true);


    const loaderRef = useRef(null);

    const handleEdit = (code) => {
        navigate(`/employees/edit/${code}`);
    };

    const handleDelete = async (code) => {
        if (!window.confirm("هل تريد حذف الموظف؟")) return;

        try {
            const res = await fetch(`/Employees/Delete/${code}`, {
                method: "POST",
            });

            if (!res.ok) {
                toast.error("حدث خطأ أثناء الحذف");
                return;
            }
            toast.success("تم حذف الموظف بنجاح");
            // refresh data
            fetchEmployees(true);
        } catch (err) {
            toast.error("فشل الاتصال بالسيرفر");
            console.error(err);
        }
    };

    const handleCheckins = (code) => {
        navigate(`/checkins?empCode=${code}`);
    };

    const fetchEmployees = async (reset = false, customPage) => {
        const currentPage = reset ? 1 : (customPage || page);

        setLoading(true);

        const res = await fetch(
            `/Employees/GetEmployee?empName=${name}&departmentId=${departmentId}&empCode=${code}&page=${currentPage}`
        );

        const data = await res.json();

        //if (reset) {
        //    setEmployees(data);
        //    setPage(1);
        //} else {
        //    setEmployees(prev => [...prev, ...data]);
        //}
        if (reset) {
            setEmployees(data);
            setHasMore(data.length > 0);
        } else {
            setEmployees(prev => [...prev, ...data]);
            if (data.length === 0) setHasMore(false);
        }

        setLoading(false);
    };

    //useEffect(() => {
    //    const observer = new IntersectionObserver(
    //        (entries) => {
    //            if (entries[0].isIntersecting && !loading && hasMore) {
    //                const nextPage = page + 1;
    //                setPage(nextPage);
    //                fetchEmployees(false, nextPage);
    //            }
    //        },
    //        { threshold: 1 }
    //    );

    //    if (loaderRef.current) {
    //        observer.observe(loaderRef.current);
    //    }

    //    return () => {
    //        if (loaderRef.current) observer.unobserve(loaderRef.current);
    //    };
    //}, [loading, page, hasMore]);
    useEffect(() => {
        const currentLoader = loaderRef.current;

        if (!currentLoader) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading && hasMore) {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchEmployees(false, nextPage);
                }
            },
            { threshold: 1 }
        );

        observer.observe(currentLoader);

        return () => {
            observer.unobserve(currentLoader);
        };
    }, [loading, page, hasMore]);

    useEffect(() => {
        fetch("/CheckInOuts/Lookups")
            .then(r => r.json())
            .then(res => {
                setDepartments(Array.isArray(res.departments) ? res.departments : []);

            });
    }, []);

    // أول تحميل
    useEffect(() => {
        fetchEmployees(true);
    }, []);

    
    useEffect(() => {
        const delay = setTimeout(() => {
            fetchEmployees(true);
        }, 500);

        return () => clearTimeout(delay);
    }, [name, departmentId,code]);

    
    return (
        <div className="p-6 bg-green-300  rounded-lg">
            <h1 className="text-2xl text-center font-bold mb-4">بيانات الموظفين</h1>

            {/* Filters */}
            <div className="flex gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Search by name..."
                    className="border p-2 rounded"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Search by Code..."
                    className="border p-2 rounded"
                    value={code || ""}
                    onChange={(e) => setCode(e.target.value)}
                />

               
                <Select
                    options={departments.map(d => ({value:d.id, label:d.name}))}
                    maxMenuHeight={150}
                    isClearable
                    placeholder="-- اختر القسم --"
                    onChange={(selected) =>
                        setDepartmentId(selected?.value||"")
                    }
                />
            </div>

            {/* Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-5 bg-green-500 text-white font-bold p-3">
                    <div>الكود</div>
                    <div>الاسم</div>
                    <div>القسم</div>
                    <div>الحالة</div>
                    <div>الاجراء</div>
                </div>

                {/* Table Body */}
                {loading && (
                    <div className="flex justify-center items-center py-6">
                        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
                    </div>
                )}
                {!loading && (employees.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        لا يوجد بيانات
                    </div>
                ) : (
                    employees.map(emp => (
                        <div
                            key={emp.employeeCode}
                            className="grid grid-cols-5 p-3 border-b hover:bg-green-100 transition"
                        >
                            <div>{emp.employeeCode}</div>
                            <div>{emp.name}</div>
                            <div>{emp.departmentName}</div>

                            {/* Status */}
                            <div>
                                {emp.status ? (
                                    <span className="px-2 py-1 text-sm bg-red-100 text-red-600 rounded-full">
                                        لا يعمل
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 text-sm bg-green-100 text-green-600 rounded-full">
                                        يعمل
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {/* Edit */}
                                <button
                                    onClick={() => handleEdit(emp.employeeCode)}
                                    className="px-2 py-1 text-sm bg-yellow-400 text-white rounded"
                                >
                                    تعديل
                                </button>

                                {/* Delete */}
                                 <button
                                    disabled={emp.status}
                                    onClick={() => handleDelete(emp.employeeCode)}
                                    className={`px-2 py-1 text-sm rounded ${emp.status
                                            ? "bg-gray-300 cursor-not-allowed"
                                            : "bg-red-500 text-white"
                                        }`}
                                >
                                    حذف
                                </button>

                                {/* Checkins */}
                                <button
                                    onClick={() => handleCheckins(emp.employeeCode)}
                                    className="px-2 py-1 text-sm bg-blue-500 text-white rounded"
                                >
                                    الحضور
                                </button>
                            </div>
                        </div>
                    ))
                ))}
            </div>

            {/* Load More */}
            <div ref={loaderRef} className="h-10 flex justify-center items-center">
                {loading && (
                    <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                )}
            </div>
        </div>
    );
}

export default Employees;
