import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../utils/api";

/* ── Animated counter ── */
function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

/* ── Stat card ── */
function StatCard({ label, value, accent ,lightColor }) {
  const count = useCountUp(value);
  
  return (
    <div className={`rounded-2xl p-4 border ${lightColor}  dark:bg-linear-to-r from-white dark:from-gray-800 from-10% ${accent} to-white to-90% dark:to-gray-800  border-gray-200 dark:border-gray-700 shadow-sm`}>
      <p className="text-xs font-semibold uppercase text-gray-300 ">
        {label}
      </p>
      <p className="text-2xl sm:text-3xl font-bold text-gray-300 ">
        {count}
      </p>
    </div>
  );
}

/* ── Status pill ── */
function StatusPill({ enabled }) {
  return (
    <span
      className={`px-4 py-2 rounded-full text-xs font-semibold ${
        enabled
          ? "bg-green-200 text-green-700"
          : "bg-red-200 text-red-600"
      }`}
    >
      {enabled ? "Active" : "Disabled"}
    </span>
  );
}
/* ── Modal ── */
function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", animation: "fadeIn 0.2s ease" }}
    >
      <div
        className="w-full max-w-md rounded-2xl border overflow-hidden"
        style={{
          background: "#0f172a",
          borderColor: "#334155",
          animation: "scaleIn 0.25s cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#1e293b" }}>
          <h3 className="font-bold text-white text-base">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition"
            style={{ background: "#1e293b", color: "#94a3b8" }}
            onMouseEnter={e => e.target.style.color = "#f1f5f9"}
            onMouseLeave={e => e.target.style.color = "#94a3b8"}
          >✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ── Field ── */
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#64748b" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = `w-full rounded-xl px-4 py-2.5 text-sm bg-[#1e293b] border border-[#334155] border-solid  text-white outline-none transition`;
/* ── Create Machine Form ── */
function CreateMachineForm({ nextCode, onSuccess, onClose }) {
  const [form, setForm] = useState({ Name: "", IP: "", MachineNumber:"", SN:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/machines", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      console.log(data.errors);
    if (!res.ok) {
      if (data.errors) {
        setFieldErrors(data.errors); 
      } else {
        setError(data.message || "حدث خطأ");
      }
    } else {
      setFieldErrors({});
      onSuccess(data.message);
    }
    } catch { setError("حدث خطأ في الاتصال"); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Machine Name">
        <input name="Name" value={form.Name} onChange={handleChange} required placeholder="e.g. Main Entrance"
          className= {inputCls} />
      </Field>
      <Field label="IP Address">

        <input name="IP" value={form.IP} type="text" pattern="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
          onChange={handleChange} required placeholder="10.14.14.x"
          className={inputCls} />
      </Field>

      <Field label="Machine Serial Number">
        <input name="SN" value={form.SN} onChange={handleChange} required placeholder="xxx123456789"
          className= {inputCls} />
      </Field>

      <Field label="Machine Number">
        <input name="MachineNumber"  onChange={handleChange} required
          className={inputCls} />
      </Field>
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 btin-action rounded-xl font-bold text-sm text-white transition disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
          {loading ? "Creating..." : "Create Machine"}
        </button>
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 btn-action rounded-xl font-bold text-sm transition"
          style={{ background: "#1e293b", color: "#94a3b8" }}>
          Cancel
        </button>
      </div>
      {Object.keys(fieldErrors).length > 0 && (
        <div className="text-red-400 text-sm">
          {Object.entries(fieldErrors).map(([key, msgs]) => (
            <p key={key}>{msgs[0]}</p>
          ))}
        </div>
      )}
    </form>
  );
}

/* ── Edit Machine Form ── */
function EditMachineForm({ machine, onSuccess, onClose }) {
  const [form, setForm] = useState({
    ID: machine.id,
    Name: machine.name,
    IP: machine.ip,
    MachineNumber: machine.machineNumber,
    SN:machine.sn
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch(`/api/machines/${machine.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) setError(data.message || "حدث خطأ");
      else onSuccess(data.message);
    } catch { setError("حدث خطأ في الاتصال"); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Machine Name">
        <input name="Name" value={form.Name} onChange={handleChange} required
          className={inputCls} />
      </Field>
      <Field label="IP Address">
        <input name="IP" value={form.IP} onChange={handleChange} required
          className={inputCls} />
      </Field>
      <Field label="Machine Number">
        <input name="MachineNumber" value={form.MachineNumber} onChange={handleChange} required
          className={inputCls} />
      </Field>
            <Field label="Machine Serial Number">
        <input name="SN" value={form.SN} onChange={handleChange} required
          className={inputCls} />
      </Field>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 btn-action rounded-xl font-bold text-sm text-white transition disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 btn-action rounded-xl font-bold text-sm transition"
          style={{ background: "#1e293b", color: "#94a3b8" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── Toast ── */
function Toast({ message, type = "success" }) {
  const colors = {
    success: { bg: "rgba(16,185,129,0.15)", border: "#10b98140", text: "#10b981" },
    error:   { bg: "rgba(239,68,68,0.15)",  border: "#ef444440", text: "#ef4444" },
  };
  const c = colors[type];
  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text, backdropFilter: "blur(10px)", animation: "slideDown 0.3s cubic-bezier(.34,1.56,.64,1)" }}
    >
      {type === "success" ? "✓" : "✕"} {message}
    </div>
  );
}


export default function MachinesPage() {
  const [machines, setMachines]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(false);
  const [nextCode, setNextCode]   = useState(null);
  const [modal, setModal]         = useState(null); // null | "create" | { type:"edit"|"delete", machine }
  const [toast, setToast]         = useState(null); // { message, type }
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    disabled: 0
  });
  const totalMachines = stats.total;
  const activeMachines = stats.active;
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Load machines ── */
  const loadMachines = async (p = 1, replace = true) => {
    try {
      if (p === 1) setLoading(true);

      const params = new URLSearchParams({ page: p });
      if (search) params.set("name", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await apiFetch(`/api/machines?${params}`);
      const json = await res.json();

      setMachines(prev => replace ? json.data : [...prev, ...json.data]);

      setStats(json.stats); 

      setHasMore(json.hasMore);
      setPage(p);

    } catch {
      showToast("Failed to load machines", "error");
    } finally {
      if (p === 1) setLoading(false);
    }
  };
  /* ── Load next code ── */
  const loadNextCode = async () => {
    try {
      const res  = await apiFetch("/api/machines/next-code");
      const json = await res.json();
      setNextCode(json.nextCode);
    } catch {}
  };

  useEffect(() => { loadMachines(); loadNextCode(); }, []);

  /* ── Search / filter ── */
  const handleSearch = (e) => {
    e.preventDefault();
    loadMachines(1, true);
  };

  /* ── Disable ── */
  const handleDisable = async (machine) => {
    try {
      const res  = await apiFetch(`/api/machines/${machine.id}`, { method: "DELETE" });
      const data = await res.json();
      showToast(data.message);
      setModal(null);
      loadMachines(1, true);
    } catch { showToast("Failed to delete", "error"); }
  };

  const handleDelete = async (machine) => {
    try {
      const res  = await apiFetch(`/api/machines/permanent/${machine.id}`, { method: "DELETE" });
      const data = await res.json();
      showToast(data.message);
      setModal(null);
      loadMachines(1, true);
      
    } catch  {
      showToast("Failed to delete", "error");
    }
  }
  const handleSuccess = (msg) => {
    setModal(null);
    showToast(msg);
    loadMachines(1, true);
    loadNextCode();
  };


  return (
    <>
      <div className="min-h-screen p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        {/* Toast */}
        {toast && <Toast message={toast.message} type={toast.type} />}

        {/* Modals */}
        {modal === "create" && (
          <Modal title="New Machine" onClose={() => setModal(null)}>
            <CreateMachineForm nextCode={nextCode} onSuccess={handleSuccess} onClose={() => setModal(null)} />
          </Modal>
        )}
        {modal?.type === "edit" && (
          <Modal title="Edit Machine" onClose={() => setModal(null)}>
            <EditMachineForm machine={modal.machine} onSuccess={handleSuccess} onClose={() => setModal(null)} />
          </Modal>
        )}
        {modal?.type === "disable" && (
          <Modal title="Confirm Disable" onClose={() => setModal(null)}>
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-white font-semibold mb-1">{modal.machine.name}</p>
              <p className="text-sm mb-6" style={{ color: "#94a3b8" }}>
                This machine will be disabled. Are you sure?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDisable(modal.machine)}
                  className="flex-1 py-2.5 btn-action rounded-xl font-bold text-sm text-white"
                  style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
                  Yes, Disable
                </button>
                <button onClick={() => setModal(null)}
                  className="flex-1 py-2.5 btn-action rounded-xl font-bold text-sm"
                  style={{ background: "#1e293b", color: "#94a3b8" }}>
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}{modal?.type === "delete" && (
          <Modal title="Confirm Delete" onClose={() => setModal(null)}>
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-white font-semibold mb-1">{modal.machine.name}</p>
              <p className="text-sm mb-6" style={{ color: "#94a3b8" }}>
                This machine will be deleted. Are you sure?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(modal.machine)}
                  className="flex-1 py-2.5 btn-action rounded-xl font-bold text-sm text-white"
                  style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
                  Yes, Delete
                </button>
                <button onClick={() => setModal(null)}
                  className="flex-1 py-2.5 btn-action rounded-xl font-bold text-sm"
                  style={{ background: "#1e293b", color: "#94a3b8" }}>
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* ── Header ── */}
        <div className="mb-8" style={{ animation: "fadeSlideUp 0.4s ease both" }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                اجهزة البصمة
              </h1>            
            </div>
            <button
              onClick={() => setModal("create")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl btn-action font-semibold text-white bg-[#1C4D8D] hover:bg-[#163d70] transition"
            >
              + اضافة جهاز بصمة
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total"    value={totalMachines}     lightColor={"bg-[#124170]"}         accent="via-[#124170]"  />
          <StatCard label="Active"   value={activeMachines}    lightColor={"bg-[#016B61]"}         accent="via-[#016B61]"  />
          <StatCard label="Disabled" value={stats.disabled} lightColor={"bg-red-900"} accent="via-red-900"  />
        </div>

        {/* ── Filters ── */}
       <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row gap-3 mb-6 p-4 rounded-2xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
       >
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 rounded-xl px-4 py-2 filter-input border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 outline-none"
          />

          <select
            value={statusFilter}
            onChange={e => setStatus(e.target.value)}
            className="rounded-xl px-4 py-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Disabled</option>
          </select>

          <button className="px-4 py-2 rounded-xl btn-action bg-[#1C4D8D] text-white hover:bg-[#163d70]">
            Search
          </button>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatus("");
              loadMachines(1, true);
            }}
            className="px-4 py-2 rounded-xl btn-action border border-gray-300 dark:border-gray-600"
          >
            Reset
          </button>
         </form>

        {/* ── Table ── */}

        <div className="rounded-2xl border overflow-hidden  bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          {/* Table header */}
          <div className="grid grid-cols-16 gap-2 sm:gap-4 px-4 sm:px-6 py-3 text-xs font-bold uppercase bg-[#0C2B4E] dark:bg-gray-700 text-white text-center dark:text-gray-300">
            <span className="col-span-4">Name</span>
            <span className="col-span-3">IP Address</span>
            <span className="col-span-3">SN</span>
            <span className="col-span-1">Machine Number</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-3 text-center">Actions</span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-16">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-transparent animate-spin"
                  style={{ borderTopColor: "#3b82f6", borderRightColor: "#6366f1" }} />
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && machines.length === 0 && (
            <div className="py-20 text-center" style={{ color: "#475569" }}>
              <div className="text-5xl mb-3">🖥️</div>
              <p className="font-semibold">No machines found</p>
            </div>
          )}

          {/* Rows */}
          {!loading && machines.map((m, i) => (
            <div
              key={m.id}
              className="grid grid-cols-2 sm:grid-cols-16 gap-2 sm:gap-4 px-4 sm:px-6 py-4 border-t text-center bg-[#edeef0b7]  hover:bg-[#0c2b4e4d]  dark:hover:bg-[#696969b7] dark:bg-[#edeef0b7]/10 border-gray-200 dark:border-gray-700"
            >

              <span className="sm:col-span-4 font-semibold">{m.name}</span>
              <span className="sm:col-span-3 text-lg ">{m.ip}</span>
              <span className="sm:col-span-3 text-lg ">{m.sn}</span>
              <span className="sm:col-span-1 text-lg ">{m.machineNumber}</span>
              <span className="sm:col-span-2">
                <StatusPill enabled={m.enabled} />
              </span>

              <div className="sm:col-span-3  justify-center flex gap-2">
                <button onClick={() => setModal({type : "edit",machine: m})} className="px-2 py-1 btn-action text-xs rounded bg-yellow-300 text-yellow-900">
                  Edit
                </button>
                <button onClick={() => setModal({type : "disable",machine: m})} className="px-2 py-1 btn-action text-xs rounded bg-[#393e49] text-red-600">
                  Disable
                </button>                
                <button onClick={() => setModal({type : "delete",machine: m})} className="px-2 py-1 btn-action text-xs rounded bg-red-300 text-red-700">
                  Delete
                </button>
              </div>
            </div>
          ))}

          {/* Load more */}
          {hasMore && !loading && (
            <div className="px-6 py-4 flex justify-center" >
              <button
                onClick={() => loadMachines(page + 1, false)}
                className="px-8 py-2.5 rounded-xl btn-action bg-[#1e293b] dark:bg-[#717283] text-[#ebebeb] border-2 border-solid border-[#334155] font-bold text-sm btn-action"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
