export default function Toast({ message, type = "success" }) {
  const colors = {
    success: {
      bg: "rgba(16,185,129,0.40)",
      border: "#10b98140",
      text: "#ffffff",
    },

    error: {
      bg: "rgba(239,68,68,0.40)",
      border: "#ef444440",
      text: "#ffffff",
    },
  };

  const c = colors[type];

  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 z-60 px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        backdropFilter: "blur(10px)",
        animation: "slideDown 0.3s cubic-bezier(.34,1.56,.64,1)",
      }}
    >
      {type === "success" ? " ✔ " : " ❌ "}

      {message}
    </div>
  );
}
