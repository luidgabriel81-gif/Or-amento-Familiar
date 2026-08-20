import React from "react";
import { X } from "lucide-react";

/* ============================================================
   CORES E GRADIENTES BASE
============================================================ */
export const C = {
  ink: "#F3F4F7",
  ink2: "#9BA1AE",
  line: "rgba(255, 255, 255, 0.1)",
  line2: "rgba(255, 255, 255, 0.05)",
  brass: "#8B5CF6",
  pine: "#34D399",
  brick: "#FB4E4E",
  clay: "#F59E0B",
};

export const GRADIENT_PRIMARY = "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)";

/* ============================================================
   SMALL UI PRIMITIVES (Visual Moderno e Arredondado)
============================================================ */
export const Card = ({ children, style, className = "", onClick }) => (
  <div
    onClick={onClick}
    className={`rounded-2xl sm:rounded-3xl transition-all duration-200 ${className}`}
    style={{
      background: "rgba(22, 24, 31, 0.85)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Pill = ({ children, color, soft, style }) => (
  <span
    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide backdrop-blur-md"
    style={{ 
      background: soft || "rgba(255, 255, 255, 0.06)", 
      color: color || C.ink, 
      border: `1px solid ${color ? `${color}33` : "transparent"}`,
      ...style 
    }}
  >
    {children}
  </span>
);

export const ProgressBar = ({ pct, tone }) => {
  const color = tone === "brick" ? C.brick : tone === "clay" ? C.clay : C.pine;
  return (
    <div className="w-full h-2.5 rounded-full overflow-hidden p-0.5" style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${C.line2}` }}>
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ 
          width: `${Math.min(pct, 100)}%`, 
          background: `linear-gradient(90deg, ${color}, ${color}DD)`,
          boxShadow: `0 0 12px ${color}66`
        }}
      />
    </div>
  );
};

export const IconBtn = ({ children, onClick, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="p-2.5 rounded-xl transition-all duration-150 active:scale-95 flex items-center justify-center cursor-pointer"
    style={{ color: C.ink2, background: "rgba(255, 255, 255, 0.03)", border: `1px solid ${C.line2}` }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
      e.currentTarget.style.color = C.ink;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
      e.currentTarget.style.color = C.ink2;
    }}
  >
    {children}
  </button>
);

export const PrimaryBtn = ({ children, onClick, style, type = "button", full }) => (
  <button
    type={type}
    onClick={onClick}
    className={`px-5 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer ${full ? "w-full" : ""}`}
    style={{ 
      background: GRADIENT_PRIMARY, 
      color: "#fff", 
      boxShadow: "0 8px 20px -6px rgba(139, 92, 246, 0.5)", 
      border: "1px solid rgba(255,255,255,0.2)",
      ...style 
    }}
  >
    {children}
  </button>
);

export const GhostBtn = ({ children, onClick, style, full }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-5 py-3 rounded-2xl font-semibold text-sm border transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer ${full ? "w-full" : ""}`}
    style={{ 
      borderColor: C.line, 
      color: C.ink, 
      background: "rgba(255, 255, 255, 0.04)", 
      backdropFilter: "blur(8px)",
      ...style 
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)")}
  >
    {children}
  </button>
);

export const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">{label}</span>
    {children}
  </div>
);

const inputStyle = {
  background: "rgba(11, 12, 16, 0.7)",
  border: `1px solid ${C.line}`,
  color: C.ink,
};

export const TextInput = (props) => (
  <input
    {...props}
    className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 ${props.className || ""}`}
    style={{ ...inputStyle, ...(props.style || {}) }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = C.brass;
      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.2)";
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = C.line;
      e.currentTarget.style.boxShadow = "none";
    }}
  />
);

export const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none transition-all duration-200 cursor-pointer"
    style={{
      ...inputStyle,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239BA1AE'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 1rem center",
      backgroundSize: "1.2em",
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = C.brass;
      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.2)";
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = C.line;
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    {children}
  </select>
);

export const SegButton = ({ options, value, onChange }) => (
  <div className="flex rounded-2xl p-1.5 gap-1.5" style={{ background: "rgba(11, 12, 16, 0.8)", border: `1px solid ${C.line}` }}>
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className="flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer"
        style={{
          background: value === o.value ? GRADIENT_PRIMARY : "transparent",
          color: value === o.value ? "#fff" : C.ink2,
          boxShadow: value === o.value ? "0 4px 14px -3px rgba(139, 92, 246, 0.5)" : "none",
        }}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export const Modal = ({ title, onClose, children, wide }) => (
  <div
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300"
    style={{ background: "rgba(4, 5, 10, 0.75)", backdropFilter: "blur(8px)" }}
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className={`w-full ${wide ? "sm:max-w-xl" : "sm:max-w-md"} sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto border shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200`}
      style={{ background: "#16181F", borderColor: C.line }}
    >
      <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10 backdrop-blur-md" style={{ background: "rgba(22, 24, 31, 0.95)", borderBottom: `1px solid ${C.line2}` }}>
        <h3 className="font-bold text-lg tracking-tight" style={{ color: C.ink }}>{title}</h3>
        <IconBtn onClick={onClose}><X size={18} /></IconBtn>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);
