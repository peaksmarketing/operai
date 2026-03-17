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
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.15s",
        ...(style || {}),
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.boxShadow = "none"; }}
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
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 6, fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>{sub}</div>}
          {trend && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 6, fontSize: 12, fontWeight: 500, color: trendUp ? "var(--success)" : "var(--danger)" }}>
              {trendUp ? "↑" : "↓"} {trend}
            </div>
          )}
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: c + "18", display: "flex", alignItems: "center", justifyContent: "center", color: c }}>
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
    <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--border-light)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th key={i} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 500, color: "var(--text-secondary)", fontSize: 11, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-light)" }}>
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
              style={{ borderBottom: "1px solid var(--border-light)", cursor: onRow ? "pointer" : "default", transition: "background 0.1s" }}
              onMouseEnter={e => { if (onRow) e.currentTarget.style.background = "var(--bg-secondary)"; }}
              onMouseLeave={e => { if (onRow) e.currentTarget.style.background = "transparent"; }}
            >
              {cols.map((c, j) => (
                <td key={j} style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
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
    default: { background: "var(--bg-secondary)", color: "var(--text-primary)" },
    primary: { background: P, color: "#fff" },
    success: { background: "var(--success)", color: "#fff" },
    danger: { background: "var(--danger)", color: "#fff" },
    ghost: { background: "transparent", color: "var(--text-secondary)" },
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
        border: "none", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6,
        opacity: disabled ? 0.5 : 1, transition: "all 0.15s",
        ...(vs[variant] || vs.default),
        ...(szs[size] || szs.md),
        ...(style || {}),
      }}
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
  width: "100%", padding: "8px 12px",
  border: "1px solid var(--border-light)", borderRadius: 8,
  fontSize: 14, background: "var(--bg-primary)", color: "var(--text-primary)",
  outline: "none", boxSizing: "border-box",
};
