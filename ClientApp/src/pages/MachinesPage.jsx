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
function StatCard({ label, value, accent, delay = 0 }) {
  const count = useCountUp(value);
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 border"
      style={{
        background: "rgba(15,23,42,0.6)",
        borderColor: accent + "40",
        animation: `fadeSlideUp 0.5s ease both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        className="absolute inset-0 opacity-10 rounded-2xl"
        style={{ background: `radial-gradient(circle at 30% 50%, ${accent}, transparent 70%)` }}
      />
      <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: accent }}>
        {label}
      </p>
      <p className="text-4xl font-black text-white">{count}</p>
    </div>
  );
}

/* ── Status pill ── */
function StatusPill({ enabled }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide"
      style={{
        background: enabled ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
        color: enabled ? "#10b981" : "#ef4444",
        border: `1px solid ${enabled ? "#10b98130" : "#ef444430"}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: enabled ? "#10b981" : "#ef4444",
          boxShadow: `0 0 6px ${enabled ? "#10b981" : "#ef4444"}`,
          animation: enabled ? "pulse 2s infinite" : "none",
        }}
      />
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

const inputCls = `w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none transition`;
const inputStyle = {
  background: "#1e293b",
  border: "1px solid #334155",
};

/* ── Create Machine Form ── */
function CreateMachineForm({ nextCode, onSuccess, onClose }) {
  const [form, setForm] = useState({ name: "", iP: "", machineNumber: nextCode ?? "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      if (!res.ok) setError(data.message || "حدث خطأ");
      else onSuccess(data.message);
    } catch { setError("حدث خطأ في الاتصال"); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Machine Name">
        <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Main Entrance"
          className={inputCls} style={inputStyle} />
      </Field>
      <Field label="IP Address">
        <input name="iP" value={form.iP} onChange={handleChange} required placeholder="192.168.1.x"
          className={inputCls} style={inputStyle} />
      </Field>
      <Field label="Machine Number">
        <input name="machineNumber" value={form.machineNumber} onChange={handleChange} required
          className={inputCls} style={inputStyle} />
      </Field>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
          {loading ? "Creating..." : "Create Machine"}
        </button>
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm transition"
          style={{ background: "#1e293b", color: "#94a3b8" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── Edit Machine Form ── */
function EditMachineForm({ machine, onSuccess, onClose }) {
  const [form, setForm] = useState({
    iD: machine.iD,
    name: machine.name,
    iP: machine.iP,
    machineNumber: machine.machineNumber,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch(`/api/machines/${machine.iD}`, {
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
        <input name="name" value={form.name} onChange={handleChange} required
          className={inputCls} style={inputStyle} />
      </Field>
      <Field label="IP Address">
        <input name="iP" value={form.iP} onChange={handleChange} required
          className={inputCls} style={inputStyle} />
      </Field>
      <Field label="Machine Number">
        <input name="machineNumber" value={form.machineNumber} onChange={handleChange} required
          className={inputCls} style={inputStyle} />
      </Field>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm transition"
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

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
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

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Load machines ── */
  const loadMachines = async (p = 1, replace = true) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p });
      if (search)       params.set("name", search);
      if (statusFilter) params.set("status", statusFilter);

      const res  = await apiFetch(`/api/machines?${params}`);
      const json = await res.json();

      setMachines(prev => replace ? json.data : [...prev, ...json.data]);
      setHasMore(json.hasMore);
      setPage(p);
    } catch { showToast("Failed to load machines", "error"); }
    finally { setLoading(false); }
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

  /* ── Delete ── */
  const handleDelete = async (machine) => {
    try {
      const res  = await apiFetch(`/api/machines/${machine.iD}`, { method: "DELETE" });
      const data = await res.json();
      showToast(data.message);
      setModal(null);
      loadMachines(1, true);
    } catch { showToast("Failed to delete", "error"); }
  };

  const handleSuccess = (msg) => {
    setModal(null);
    showToast(msg);
    loadMachines(1, true);
    loadNextCode();
  };


  return (
    <>
      <style>{`
        @keyframes fadeSlideUp  { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn       { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn      { from { opacity:0; transform:scale(.93) } to { opacity:1; transform:scale(1) } }
        @keyframes slideDown    { from { opacity:0; transform:translateX(-50%) translateY(-12px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }
        @keyframes pulse        { 0%,100%{opacity:1} 50%{opacity:.4} }
        .machine-row            { animation: fadeSlideUp 0.4s ease both; }
        .machine-row:hover      { background: rgba(59,130,246,0.06) !important; }
        .btn-action             { transition: all 0.18s ease; }
        .btn-action:hover       { transform: translateY(-1px); }
        .filter-input:focus     { border-color: #3b82f6 !important; }
      `}</style>

      <div className="min-h-screen p-6" style={{ color: "#e2e8f0" }}>

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
        {modal?.type === "delete" && (
          <Modal title="Confirm Delete" onClose={() => setModal(null)}>
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-white font-semibold mb-1">{modal.machine.name}</p>
              <p className="text-sm mb-6" style={{ color: "#94a3b8" }}>
                This machine will be disabled. Are you sure?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(modal.machine)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white"
                  style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
                  Yes, Disable
                </button>
                <button onClick={() => setModal(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm"
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
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#3b82f6" }}>
                Biometric Devices
              </p>
              <h1 className="text-3xl font-black text-white">Machines</h1>
            </div>
            <button
              onClick={() => setModal("create")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition btn-action"
              style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", boxShadow: "0 4px 20px rgba(99,102,241,0.4)" }}
            >
              <span className="text-lg">+</span> New Machine
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total"    value={totalMachines}              accent="#3b82f6" delay={0} />
          <StatCard label="Active"   value={activeMachines}             accent="#10b981" delay={80} />
          <StatCard label="Disabled" value={totalMachines - activeMachines} accent="#ef4444" delay={160} />
        </div>

        {/* ── Filters ── */}
        <form onSubmit={handleSearch}
          className="flex flex-wrap gap-3 mb-6 p-4 rounded-2xl border"
          style={{ background: "rgba(15,23,42,0.6)", borderColor: "#1e293b", animation: "fadeSlideUp 0.5s ease 0.1s both" }}
        >
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className={`filter-input flex-1 min-w-[180px] rounded-xl px-4 py-2.5 text-sm text-white outline-none`}
            style={{ background: "#1e293b", border: "1px solid #334155" }}
          />
          <select
            value={statusFilter}
            onChange={e => setStatus(e.target.value)}
            className="rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ background: "#1e293b", border: "1px solid #334155", color: statusFilter ? "#e2e8f0" : "#64748b" }}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Disabled</option>
          </select>
          <button type="submit"
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-white btn-action"
            style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
            Search
          </button>
          <button type="button"
            onClick={() => { setSearch(""); setStatus(""); setTimeout(() => loadMachines(1, true), 50); }}
            className="px-4 py-2.5 rounded-xl font-bold text-sm btn-action"
            style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155" }}>
            Reset
          </button>
        </form>

        {/* ── Table ── */}
        <div className="rounded-2xl border overflow-hidden"
          style={{ background: "rgba(15,23,42,0.6)", borderColor: "#1e293b", animation: "fadeSlideUp 0.5s ease 0.2s both" }}>

          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold tracking-widest uppercase"
            style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", color: "#475569" }}>
            <span className="col-span-1">#</span>
            <span className="col-span-4">Name</span>
            <span className="col-span-3">IP Address</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-2 text-center">Actions</span>
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
              key={m.iD}
              className="machine-row grid grid-cols-12 gap-4 px-6 py-4 items-center"
              style={{
                borderBottom: "1px solid #1e293b",
                animationDelay: `${i * 40}ms`,
                background: "transparent",
                transition: "background 0.2s ease",
              }}
            >
              <span className="col-span-1 text-xs font-mono" style={{ color: "#475569" }}>{m.iD}</span>
              <span className="col-span-4 font-semibold text-white text-sm">{m.name}</span>
              <span className="col-span-3 font-mono text-xs" style={{ color: "#64748b" }}>{m.iP}</span>
              <span className="col-span-2"><StatusPill enabled={m.enabled} /></span>
              <div className="col-span-2 flex justify-center gap-2">
                <button
                  onClick={() => setModal({ type: "edit", machine: m })}
                  className="btn-action px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: "rgba(234,179,8,0.15)", color: "#eab308", border: "1px solid rgba(234,179,8,0.25)" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => setModal({ type: "delete", machine: m })}
                  className="btn-action px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
                >
                  Disable
                </button>
              </div>
            </div>
          ))}

          {/* Load more */}
          {hasMore && !loading && (
            <div className="px-6 py-4 flex justify-center" style={{ borderTop: "1px solid #1e293b" }}>
              <button
                onClick={() => loadMachines(page + 1, false)}
                className="px-8 py-2.5 rounded-xl font-bold text-sm btn-action"
                style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155" }}
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
