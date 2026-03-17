'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '../lib/supabase-browser';
import { IcDash, IcUsers, IcBox, IcCalc, IcPpl, IcRcpt, IcBell, IcClk, IcSet, IcOut, IcZap, IcFlow, IcX } from './Icons';
import { DATA } from './data';
import { useAuto } from './useAuto';

const P = "#2b6876";
const A = "#534AB7";

function IcBuilding() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="9" y2="6" /><line x1="15" y1="6" x2="15" y2="6" /><line x1="9" y1="10" x2="9" y2="10" /><line x1="15" y1="10" x2="15" y2="10" /><line x1="9" y1="14" x2="9" y2="14" /><line x1="15" y1="14" x2="15" y2="14" /><path d="M9 22v-4h6v4" /></svg>;
}
function IcPerson() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}

function AutoToast({ items, onDismiss }) {
  if (!items.length) return null;
  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 2000, display: "flex", flexDirection: "column", gap: 8, maxWidth: 380 }}>
      {items.map((t, i) => (
        <div key={i} style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderLeft: "4px solid " + A, borderRadius: 10, padding: "12px 16px", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", animation: "slideIn 0.3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ color: A }}><IcZap /></span>
            <span style={{ fontSize: 12, fontWeight: 600, color: A }}>自動連携</span>
            <span onClick={() => onDismiss(i)} style={{ marginLeft: "auto", cursor: "pointer", color: "var(--text-tertiary)" }}><IcX /></span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{t.action}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{t.detail}</div>
        </div>
      ))}
    </div>
  );
}

const MENU_COMPANY = [
  { id: "dashboard", path: "/dashboard", l: "ダッシュボード", Ic: IcDash },
  { id: "crm", path: "/crm", l: "営業・顧客管理", Ic: IcUsers },
  { id: "inventory", path: "/inventory", l: "在庫・物流", Ic: IcBox },
  { id: "accounting", path: "/accounting", l: "会計・財務", Ic: IcCalc },
  { id: "hr", path: "/hr", l: "人事・労務", Ic: IcPpl },
  { id: "billing", path: "/billing", l: "請求・決済", Ic: IcRcpt },
  { id: "automation", path: "/automation", l: "データ連携", Ic: IcFlow },
  { id: "settings", path: "/settings", l: "設定", Ic: IcSet },
];
const MENU_EMPLOYEE = [
  { id: "dashboard", path: "/dashboard", l: "ダッシュボード", Ic: IcDash },
  { id: "hr", path: "/hr", l: "勤怠・給与", Ic: IcClk },
  { id: "crm", path: "/crm", l: "営業・顧客", Ic: IcUsers },
  { id: "inventory", path: "/inventory", l: "在庫・物流", Ic: IcBox },
];

export function useAppData() {
  const [data, setData] = useState(DATA);
  const auto = useAuto(data, setData);
  return { data, setData, ...auto };
}

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [col, setCol] = useState(false);
  const [nOpen, setNOpen] = useState(false);
  const [uMenuOpen, setUMenuOpen] = useState(false);
  const nRef = useRef(null);
  const uRef = useRef(null);
  const [data] = useState(DATA);

  // Load user from Supabase
  useEffect(() => {
    const getUser = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        const meta = u.user_metadata || {};
        setUser({ email: u.email, name: meta.name || u.email?.split('@')[0] || 'ユーザー', role: meta.role || 'company' });
      }
      setLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/login');
      } else if (session?.user) {
        const meta = session.user.user_metadata || {};
        setUser({ email: session.user.email, name: meta.name || session.user.email?.split('@')[0] || 'ユーザー', role: meta.role || 'company' });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (nRef.current && !nRef.current.contains(e.target)) setNOpen(false);
      if (uRef.current && !uRef.current.contains(e.target)) setUMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
        <div style={{ fontSize: 14, color: "var(--text-tertiary)" }}>読み込み中...</div>
      </div>
    );
  }

  const role = user?.role || 'company';
  const menu = role === "company" ? MENU_COMPANY : MENU_EMPLOYEE;
  const unread = data.notifs.filter(n => !n.read).length;
  const currentPage = menu.find(m => pathname.startsWith(m.path));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fff" }}>
      {/* Sidebar */}
      <div style={{ width: col ? 60 : 220, background: P, display: "flex", flexDirection: "column", transition: "width 0.2s", flexShrink: 0, overflow: "hidden" }}>
        <div style={{ padding: col ? "16px 14px" : "20px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.12)", cursor: "pointer" }} onClick={() => setCol(!col)}>
          {col ? (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>O</span>
            </div>
          ) : (
            <img src="/logo.svg" alt="Operai" style={{ height: 27, filter: "brightness(0) invert(1)" }} />
          )}
        </div>
        <div style={{ flex: 1, padding: 8, display: "flex", flexDirection: "column", gap: 2 }}>
          {menu.map(m => {
            const MIcon = m.Ic;
            const isActive = pathname.startsWith(m.path);
            return (
              <div key={m.id} onClick={() => router.push(m.path)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: col ? "10px 14px" : "9px 12px", borderRadius: 8, cursor: "pointer", background: isActive ? "rgba(255,255,255,0.15)" : "transparent", color: isActive ? "#fff" : "rgba(255,255,255,0.65)", fontWeight: isActive ? 600 : 400, fontSize: 13, whiteSpace: "nowrap", transition: "all 0.1s" }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? "rgba(255,255,255,0.15)" : "transparent"; }}>
                <span style={{ flexShrink: 0, display: "flex" }}><MIcon /></span>
                {!col && <span>{m.l}</span>}
              </div>
            );
          })}
        </div>
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          <div onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, cursor: "pointer", color: "rgba(255,255,255,0.55)", fontSize: 13 }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            <span style={{ flexShrink: 0, display: "flex" }}><IcOut /></span>
            {!col && <span>ログアウト</span>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <div style={{ padding: "12px 24px", background: "var(--bg-primary)", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{currentPage?.l || ""}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Notifications */}
            <div ref={nRef} style={{ position: "relative" }}>
              <div onClick={() => { setNOpen(!nOpen); setUMenuOpen(false); }}
                style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)", background: nOpen ? "var(--bg-secondary)" : "transparent", transition: "background 0.1s" }}
                onMouseEnter={e => { if (!nOpen) e.currentTarget.style.background = "var(--bg-secondary)"; }}
                onMouseLeave={e => { if (!nOpen) e.currentTarget.style.background = nOpen ? "var(--bg-secondary)" : "transparent"; }}>
                <IcBell />
              </div>
              {unread > 0 && <div style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: 8, background: "#A32D2D", color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, pointerEvents: "none" }}>{unread}</div>}
              {nOpen && (
                <div style={{ position: "absolute", top: 42, right: 0, width: 340, background: "var(--bg-primary)", border: "1px solid var(--border-light)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100 }}>
                  <div style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500, borderBottom: "1px solid var(--border-light)" }}>通知</div>
                  {data.notifs.slice(-6).reverse().map(n => (
                    <div key={n.id} style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-light)", fontSize: 12, opacity: n.read ? 0.6 : 1 }}>
                      {n.msg}
                      <div style={{ color: "var(--text-tertiary)", marginTop: 2, fontSize: 11 }}>{n.date}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* User Menu */}
            <div ref={uRef} style={{ position: "relative" }}>
              <div onClick={() => { setUMenuOpen(!uMenuOpen); setNOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderRadius: 8, cursor: "pointer", background: uMenuOpen ? "var(--bg-secondary)" : "transparent", transition: "background 0.1s" }}
                onMouseEnter={e => { if (!uMenuOpen) e.currentTarget.style.background = "var(--bg-secondary)"; }}
                onMouseLeave={e => { if (!uMenuOpen) e.currentTarget.style.background = uMenuOpen ? "var(--bg-secondary)" : "transparent"; }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: role === "company" ? P : A, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {role === "company" ? <IcBuilding /> : <IcPerson />}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{user?.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{role === "company" ? "管理者" : "従業員"}</div>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              {uMenuOpen && (
                <div style={{ position: "absolute", top: 42, right: 0, width: 220, background: "var(--bg-primary)", border: "1px solid var(--border-light)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-light)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{user?.email}</div>
                  </div>
                  {[
                    { label: "個人設定", icon: <IcSet />, action: () => { router.push("/settings"); setUMenuOpen(false); } },
                    { label: "通知設定", icon: <IcBell />, action: () => { router.push("/settings"); setUMenuOpen(false); } },
                  ].map((item, i) => (
                    <div key={i} onClick={item.action}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 13, color: "var(--text-secondary)", cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-secondary)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                      <span style={{ display: "flex", color: "var(--text-tertiary)" }}>{item.icon}</span>
                      {item.label}
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid var(--border-light)" }}>
                    <div onClick={handleLogout}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 13, color: "#A32D2D", cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--danger-bg)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                      <span style={{ display: "flex" }}><IcOut /></span>
                      ログアウト
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Main area */}
        <div style={{ flex: 1, padding: 24, overflow: "auto" }}>
          {children}
        </div>
      </div>

      <AutoToast items={[]} onDismiss={() => {}} />
    </div>
  );
}
