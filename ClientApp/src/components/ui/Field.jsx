export default function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-widest uppercase mb-2 text-[#64748b]">
        {label}
      </label>

      {children}
    </div>
  );
}
