export default function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border overflow-hidden"
        style={{
          background: "#0f172a",
          borderColor: "#334155",
          animation: "scaleIn 0.25s cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "#1e293b" }}
        >
          <h3 className="font-bold text-white text-base">{title}</h3>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition"
            style={{
              background: "#1e293b",
              color: "#94a3b8",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
