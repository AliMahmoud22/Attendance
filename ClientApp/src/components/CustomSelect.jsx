import Select from "react-select";
import { useState, useEffect } from "react";
export default function CustomSelect({
  options = [],
  value,
  onChange,
  isMulti = false,
  placeholder = "Select...",
}) {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newValue = document.documentElement.classList.contains("dark");

      setIsDark((prev) => (prev !== newValue ? newValue : prev));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const styles = {
    control: (base, state) => ({
      ...base,
      display: "flex",
      alignItems: "center",
      borderRadius: "0.75rem",
      padding: "2px 4px",
      backgroundColor: isDark ? "#1f2937" : "#fff",
      borderColor: state.isFocused ? "#3b82f6" : isDark ? "#4b5563" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 2px #3b82f6" : "none",
      minHeight: "42px",
      "&:hover": {
        borderColor: "#3b82f6",
      },
    }),

    singleValue: (base) => ({
      ...base,
      color: isDark ? "#f3f4f6" : "#111827",
    }),

    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? "#1f2937" : "#fff",
      borderRadius: "0.75rem",
      border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`,
      marginTop: "4px",
    }),

    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
          ? isDark
            ? "#374151"
            : "#f3f4f6"
          : "transparent",
      color: state.isSelected ? "#fff" : isDark ? "#f3f4f6" : "#111827",
      cursor: "pointer",
    }),

    placeholder: (base) => ({
      ...base,
      color: isDark ? "#9ca3af" : "#6b7280",
    }),

    input: (base) => ({
      ...base,
      color: isDark ? "#f3f4f6" : "#111827",
    }),

    // multi styles
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#3b82f6",
      borderRadius: "0.5rem",
    }),

    multiValueLabel: (base) => ({
      ...base,
      color: "#fff",
    }),

    multiValueRemove: (base) => ({
      ...base,
      color: "#fff",
      cursor: "pointer",
      ":hover": {
        backgroundColor: "#ef4444",
        color: "#fff",
      },
    }),
  };

  return (
    <Select
      isClearable
      isMulti={isMulti}
      options={options}
      value={value}
      onChange={onChange}
      styles={styles}
      placeholder={placeholder}
      className="text-sm z-50"
    />
  );
}
