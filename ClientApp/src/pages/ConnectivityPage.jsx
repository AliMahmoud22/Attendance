import { useEffect, useState, useRef } from "react";
import { apiFetch } from "../utils/api";

/* ── Status Pill (LIVE) ── */
function StatusPill({ online }) {
  return (
    <span
      className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
        online
          ? "bg-green-200 text-green-700 shadow-md shadow-green-300/40"
          : "bg-red-200 text-red-600 shadow-md shadow-red-300/40 animate-pulse"
      }`}
    >
      {online && (
        <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
      )}
      {online ? "Online" : "Offline"}
    </span>
  );
}

/* ── Relative Time ── */
function getRelativeTime(date) {
  if (!date) return "-";

  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

  return `${Math.floor(seconds / 86400)}d ago`;
}

/* ── Toast ── */
function Toast({ message, type = "success" }) {
  const colors = {
    success: { bg: "rgba(16,185,129,0.4)", text: "#fff" },
    error: { bg: "rgba(239,68,68,0.4)", text: "#fff" },
  };

  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl text-sm font-semibold z-50"
      style={{
        background: colors[type].bg,
        color: colors[type].text,
        backdropFilter: "blur(10px)",
        animation: "slideDown 0.3s",
      }}
    >
      {message}
    </div>
  );
}

/* ── Main ── */
export default function ConnectivityPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [toast, setToast] = useState(null);
  const alertSound = useRef(null);
  const prevStatus = useRef({});
  const lastSoundTime = useRef(0);
  const SOUND_COOLDOWN = 30000; // 30 seconds

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  useEffect(() => {
    const enableSound = () => {
      alertSound.current?.play().catch(() => {});
      document.removeEventListener("click", enableSound);
    };

    document.addEventListener("click", enableSound);
  }, []);
  useEffect(() => {
    alertSound.current = new Audio("/alert.mp3");

    const unlockAudio = () => {
      alertSound.current
        .play()
        .then(() => {
          alertSound.current.pause();
          alertSound.current.currentTime = 0;
        })
        .catch(() => {});

      document.removeEventListener("click", unlockAudio);
    };

    document.addEventListener("click", unlockAudio);

    return () => document.removeEventListener("click", unlockAudio);
  }, []);
  const loadData = async () => {
    try {
      const res = await apiFetch("/api/machines/connectivity");
      const json = await res.json();

      /* ── ALERT LOGIC ── */
      const hasOffline = json.some((m) => !m.isOnline);

      if (hasOffline) {
        const now = Date.now();

        if (now - lastSoundTime.current > SOUND_COOLDOWN) {
          showToast("🚨 Some devices are OFFLINE", "error");

          alertSound.current.currentTime = 0;
          alertSound.current?.play().catch(() => {});

          lastSoundTime.current = now;
        }
      }

      setData(json);
      setLastUpdate(new Date());
    } catch {
      showToast("Connection lost", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ── REAL-TIME LOOP ── */
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // every 10 sec

    return () => clearInterval(interval);
  }, []);

  /* ── Stats ── */
  const total = data.length;
  const online = data.filter((d) => d.isOnline).length;
  const offline = total - online;

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">
          Live Machines Dashboard
        </h1>

        <span className="text-sm text-gray-500">
          {lastUpdate && `Updated ${getRelativeTime(lastUpdate)}`}
        </span>
      </div>
      <span className="text-md  text-green-500 animate-pulse">
        ● Live monitoring
      </span>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl p-4 bg-[#124170] text-white">
          <p className="text-xs">Total</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>

        <div className="rounded-2xl p-4 bg-[#016B61] text-white">
          <p className="text-xs">Online</p>
          <p className="text-2xl font-bold">{online}</p>
        </div>

        <div className="rounded-2xl p-4 bg-red-900 text-white">
          <p className="text-xs">Offline</p>
          <p className="text-2xl font-bold">{offline}</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="grid grid-cols-4 px-6 py-3 text-xs font-bold uppercase bg-[#0C2B4E] text-white text-center">
          <span>Device</span>
          <span>IP</span>
          <span>Last Seen</span>
          <span>Status</span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div
              className="w-10 h-10 rounded-full border-2 border-transparent animate-spin"
              style={{
                borderTopColor: "#3b82f6",
                borderRightColor: "#6366f1",
              }}
            />
          </div>
        )}

        {/* Rows */}
        {!loading &&
          data.map((m, i) => (
            <div
              key={i}
              className={`border-t border-gray-200 dark:border-gray-700 transition 
      ${!m.isOnline ? "bg-red-50 dark:bg-red-900/20" : ""}
      hover:bg-[#0c2b4e4d] dark:hover:bg-[#696969b7]`}
            >
              {/* 🖥 Desktop */}
              <div className="hidden sm:grid grid-cols-4 px-6 py-4 text-center">
                <span className="font-semibold">{m.deviceName}</span>
                <span>{m.ip}</span>
                <span>{getRelativeTime(m.lastSeen)}</span>
                <span>
                  <StatusPill online={m.isOnline} />
                </span>
              </div>

              {/* 📱 Mobile Card */}
              <div className="sm:hidden p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold">{m.deviceName}</span>
                  <StatusPill online={m.isOnline} />
                </div>

                <div className="text-sm text-gray-500">
                  <p>
                    <strong>IP:</strong> {m.ip}
                  </p>
                  <p>
                    <strong>Last Seen:</strong> {getRelativeTime(m.lastSeen)}
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
