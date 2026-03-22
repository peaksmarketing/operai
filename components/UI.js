'use client';

const P = "#2b6876";

export function Badge({ children, variant = "default" }) {
  const styles = {
    default: { background: "var(--bg-secondary)", color: "var(--text-secondary)" },
    success: { background: "var(--success-bg)", color: "var(--success)" },
    warning: { background: "var(--warning-bg)", color: "var(--warning)" },
    danger: { background: "var(--danger-bg)", color: "var(--danger)" },
    info: { background: "var(--info-bg)", color: P },
    purple: { background: "#EEEDFE", color: "#534AB7" },
  };
  const s = styles[variant] || styles.default;
  return (
    <span style={{ ...s, padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap", display: "inline-block" }}>
      {children}
    </span>
  );
}

export function Card({ children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bg-primary)", border: "1px solid var(--border-light)",
        borderRadius: 12, padding: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.2s, transform 0.2s",
        ...(style || {}),
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)"; e.currentTarget.style.transform = "none"; } }}
    >
      {children}
    </div>
  );
}

export function KPI({ label, value, sub, trend, trendUp, icon, color }) {
  const c = color || P;
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 6, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: "var(--text-primary)" }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>{sub}</div>}
          {trend && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 6, fontSize: 12, fontWeight: 600, color: trendUp ? "var(--success)" : "var(--danger)" }}>
              {trendUp ? "↑" : "↓"} {trend}
            </div>
          )}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${c}20, ${c}10)`, border: `1px solid ${c}18`, display: "flex", alignItems: "center", justifyContent: "center", color: c }}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function Tbl({ cols, data, onRow }) {
  if (!data || !data.length) {
    return <div style={{ padding: 24, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>データなし</div>;
  }
  return (
    <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--border-light)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th key={i} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "var(--text-secondary)", fontSize: 11, background: "var(--bg-secondary)", borderBottom: "2px solid var(--border-light)", letterSpacing: 0.3, textTransform: "uppercase" }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr
              key={i}
              onClick={() => { if (onRow) onRow(r); }}
              style={{ borderBottom: "1px solid var(--border-light)", cursor: onRow ? "pointer" : "default", transition: "background 0.15s", background: i % 2 === 1 ? "var(--bg-secondary)" : "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#2b687808"; }}
              onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 1 ? "var(--bg-secondary)" : "transparent"; }}
            >
              {cols.map((c, j) => (
                <td key={j} style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Btn({ children, variant = "default", size = "md", onClick, style, disabled }) {
  const vs = {
    default: { background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-light)" },
    primary: { background: `linear-gradient(135deg, ${P}, #1e4f5a)`, color: "#fff", border: "none" },
    success: { background: "linear-gradient(135deg, #0F6E56, #0a5a46)", color: "#fff", border: "none" },
    danger: { background: "linear-gradient(135deg, #A32D2D, #8a2424)", color: "#fff", border: "none" },
    ghost: { background: "transparent", color: "var(--text-secondary)", border: "none" },
  };
  const szs = {
    sm: { padding: "5px 10px", fontSize: 12 },
    md: { padding: "8px 16px", fontSize: 13 },
    lg: { padding: "10px 20px", fontSize: 14 },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6,
        opacity: disabled ? 0.5 : 1, transition: "all 0.15s, transform 0.1s",
        boxShadow: variant !== "ghost" && variant !== "default" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
        ...(vs[variant] || vs.default),
        ...(szs[size] || szs.md),
        ...(style || {}),
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={e => { e.currentTarget.style.transform = "none"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
    >
      {children}
    </button>
  );
}

export function PBar({ value, max = 100, color, h = 6 }) {
  const cl = color || P;
  return (
    <div style={{ width: "100%", height: h, background: "var(--bg-tertiary)", borderRadius: h / 2, overflow: "hidden" }}>
      <div style={{ width: Math.min(100, (value / max) * 100) + "%", height: "100%", background: cl, borderRadius: h / 2, transition: "width 0.4s" }} />
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg-primary)", borderRadius: 14, width: "100%", maxWidth: wide ? 680 : 480, maxHeight: "85vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border-light)" }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
          <span onClick={onClose} style={{ cursor: "pointer", color: "var(--text-tertiary)", fontSize: 18, lineHeight: 1 }}>✕</span>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

export function Fld({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

export const inputStyle = {
  width: "100%", padding: "9px 12px",
  border: "1px solid var(--border-light)", borderRadius: 8,
  fontSize: 14, background: "var(--bg-primary)", color: "var(--text-primary)",
  outline: "none", boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s",
};
