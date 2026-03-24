'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Card, KPI, Tbl, PBar, Btn } from './UI';
import { IcRcpt, IcUsers, IcChk, IcZap, IcClk, IcPpl, IcBox, IcAlrt, IcAi, IcCalc, IcFlow } from './Icons';
import { fmtY } from './useAuto';

const P = "#2b6876";
const A = "#534AB7";
const STG = { lead: "リード", qualification: "精査", proposal: "提案", negotiation: "交渉", processing: "処理中" };
const STGC = { lead: "#888", qualification: "#854F0B", proposal: P, negotiation: A, processing: "#D85A30" };
const ORDS = { pending: "未確認", confirmed: "確定", shipped: "出荷済" };

function MiniChart({ data, color, labels }) {
  const [hover, setHover] = useState(null);
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setAnimated(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 600, h = 140, px = 40, py = 10;
  const cw = w - px * 2, ch = h - py * 2 - 20;
  const pts = data.map((v, i) => ({ x: px + (i / (data.length - 1)) * cw, y: py + ch - ((v - min) / (max - min || 1)) * ch, v }));
  const line = pts.map((p, i) => (i === 0 ? "M" : "L") + p.x + "," + p.y).join(" ");
  const area = line + ` L${pts[pts.length - 1].x},${py + ch} L${pts[0].x},${py + ch} Z`;
  const lineLen = pts.reduce((s, p, i) => i === 0 ? 0 : s + Math.sqrt((p.x - pts[i-1].x)**2 + (p.y - pts[i-1].y)**2), 0);

  return (
    <svg ref={ref} viewBox={`0 0 ${w} ${h + 10}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
      <style>{`
        @keyframes drawLine { from { stroke-dashoffset: ${lineLen}; } to { stroke-dashoffset: 0; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 0.1; } }
        @keyframes popIn { from { r: 0; } to { r: 3; } }
      `}</style>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
        const y = py + ch * (1 - r);
        const val = Math.round(min + (max - min) * r);
        return <g key={i}><line x1={px} y1={y} x2={w - px} y2={y} stroke="var(--border-light)" strokeWidth="0.5" /><text x={px - 6} y={y + 3} textAnchor="end" style={{ fontSize: 9, fill: "var(--text-tertiary)" }}>{val > 999 ? (val / 10000).toFixed(0) + "万" : val}</text></g>;
      })}
      {/* Area fill with animation */}
      <path d={area} fill={color} style={{ opacity: animated ? 0.1 : 0, transition: "opacity 1.5s ease 0.8s" }} />
      {/* Line with draw animation */}
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={lineLen} strokeDashoffset={animated ? 0 : lineLen}
        style={{ transition: `stroke-dashoffset 1.5s ease` }} />
      {/* Data points with staggered animation */}
      {pts.map((p, i) => (
        <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
          <circle cx={p.x} cy={p.y} r={animated ? (hover === i ? 5 : 3) : 0} fill={color} stroke="#fff" strokeWidth="2"
            style={{ transition: `r 0.3s ease ${0.1 * i + 0.8}s, r 0.15s` }} />
          {hover === i && (
            <g>
              <rect x={p.x - 32} y={p.y - 26} width="64" height="20" rx="4" fill={color} opacity="0.95" />
              <text x={p.x} y={p.y - 13} textAnchor="middle" style={{ fontSize: 10, fill: "#fff", fontWeight: 600 }}>{fmtY(p.v * 10000)}</text>
            </g>
          )}
          <text x={p.x} y={h + 6} textAnchor="middle" style={{ fontSize: 9, fill: hover === i ? color : "var(--text-tertiary)", fontWeight: hover === i ? 600 : 400 }}>{labels ? labels[i] : ""}</text>
        </g>
      ))}
    </svg>
  );
}

function RingChart({ value, max, color, label }) {
  const [animPct, setAnimPct] = useState(0);
  const [displayPct, setDisplayPct] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const pct = max ? Math.round((value / max) * 100) : 0;
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => { if (visible) { const t = setTimeout(() => setAnimPct(pct), 200); return () => clearTimeout(t); } }, [visible, pct]);
  useEffect(() => {
    if (displayPct < animPct) {
      const t = setTimeout(() => setDisplayPct(prev => Math.min(prev + 1, animPct)), 15);
      return () => clearTimeout(t);
    }
  }, [displayPct, animPct]);
  const r = 40, circ = 2 * Math.PI * r, offset = circ - (circ * animPct) / 100;
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border-light)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color || P} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition: "stroke-dashoffset 1s ease-out" }} />
        <text x="50" y="46" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 22, fontWeight: 700, fill: "var(--text-primary)" }}>{displayPct}%</text>
        <text x="50" y="62" textAnchor="middle" style={{ fontSize: 10, fill: "var(--text-tertiary)" }}>{label}</text>
      </svg>
    </div>
  );
}

export default function Dashboard({ data, role }) {
  const router = useRouter();
  const [showGuide, setShowGuide] = useState(true);
  const tR = data.invs.reduce((s, i) => s + i.amt, 0);
  const pR = data.invs.filter(i => i.st === "paid").reduce((s, i) => s + i.paid, 0);
  const invTotal = data.invs.reduce((s, i) => s + i.total, 0);
  const oD = data.deals.filter(d => d.stage !== "won" && d.stage !== "lost");
  const pV = oD.reduce((s, d) => s + d.val, 0);
  const lowStock = data.prods.filter(p => p.stk <= p.min);
  const monthlyData = [280, 320, 290, 350, 410, 380, 450, 420, 480, 520, 490, tR / 10000];
  const monthLabels = ["4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月"];

  if (role === "employee") {
    const e = data.emps[0];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>おはようございます、{e.name}さん</h2>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>{new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
          <KPI label="今月の勤務時間" value="156h" sub="残業: 12h" icon={<IcClk />} color={P} />
          <KPI label="有給残日数" value={(e.pl - e.ul) + "日"} sub={`${e.pl}日中 ${e.ul}日使用`} icon={<IcPpl />} color="#0F6E56" />
          <KPI label="今月の給与" value={fmtY(e.sal)} icon={<IcRcpt />} color={A} />
        </div>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>お知らせ</div>
          {data.notifs.slice(-5).reverse().map(n => (
            <div key={n.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border-light)", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0, background: n.type === "warning" ? "#BA7517" : n.type === "success" ? "#0F6E56" : P }} />
              <div><div style={{ fontSize: 13 }}>{n.msg}</div><div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 3 }}>{n.date}</div></div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  const now = new Date();
  const greeting = now.getHours() < 12 ? "おはようございます" : "お疲れ様です";

  const guideSteps = [
    { step: 1, title: "顧客・取引先を登録", desc: "まず顧客情報を登録。CSV一括インポートも可能です。", path: "/crm" },
    { step: 2, title: "商品・在庫を管理", desc: "商品マスタを登録し、発注点を設定すると自動アラートが始動。", path: "/inventory" },
    { step: 3, title: "請求書を発行", desc: "受注データから請求書を自動生成。入金消込も自動化。", path: "/billing" },
    { step: 4, title: "会計・仕訳を記録", desc: "請求書や入金から仕訳が自動生成。P/L・B/Sをリアルタイム確認。", path: "/accounting" },
    { step: 5, title: "従業員・給与を管理", desc: "勤怠連動の給与計算を自動化。全銀FBデータも出力可能。", path: "/hr" },
    { step: 6, title: "AIに何でも聞く", desc: "「売上を分析して」など自然言語で業務を実行。", path: "/ai-chat" },
  ];

  const activities = [
    { icon: <IcClk />, color: P, action: "出勤打刻", user: "田中 太郎", time: "2時間前" },
    { icon: <IcRcpt />, color: "#0F6E56", action: "請求書 INV-1037 を作成", user: "システム", time: "3時間前" },
    { icon: <IcCalc />, color: A, action: "売上仕訳を自動生成", user: "自動連携", time: "3時間前" },
    { icon: <IcBox />, color: "#BA7517", action: "在庫引当を実行", user: "自動連携", time: "3時間前" },
    { icon: <IcUsers />, color: P, action: "新規顧客を登録", user: "鈴木 一郎", time: "5時間前" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>{greeting}</h2>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>{now.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" })} {now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <Badge variant="info">リアルタイム更新</Badge>
      </div>

      {showGuide && (
        <Card style={{ background: P + "06", border: "1px solid " + P + "20" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 16 }}>[提案]</div>
              <div><div style={{ fontSize: 14, fontWeight: 600 }}>はじめに — Operaiの使い方</div><div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>6つのステップで業務を効率化しましょう</div></div>
            </div>
            <span onClick={() => setShowGuide(false)} style={{ fontSize: 12, color: "var(--text-tertiary)", cursor: "pointer", padding: "4px 8px" }}>閉じる ×</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {guideSteps.map(s => (
              <div key={s.step} onClick={() => router.push(s.path)} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg-primary)", border: "1px solid var(--border-light)", cursor: "pointer", transition: "0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = P; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-light)"; }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: P, marginBottom: 4 }}>Step {s.step}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ background: `linear-gradient(135deg, ${A}10, ${P}08)`, border: "1px solid " + A + "25" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: A + "20", display: "flex", alignItems: "center", justifyContent: "center", color: A }}><IcAi /></div>
            <div><div style={{ fontSize: 14, fontWeight: 600, color: A }}>AIコマンドセンター</div><div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>自然言語で顧客登録・請求書作成・仕訳入力など、あらゆる業務を瞬時に実行</div></div>
          </div>
          <Btn variant="primary" size="sm" onClick={() => router.push('/ai-chat')} style={{ background: A }}>AIチャットを開く →</Btn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(90px,1fr))", gap: 8 }}>
          {[
            { label: "メール生成", path: "/ai-mail" },
            { label: "議事録要約", path: "/ai-minutes" },
            { label: "売上予測", path: "/ai-report" },
            { label: "スマート通知", path: "/ai-notify" },
            { label: "経営参謀", path: "/ai" },
          ].map(a => (
            <div key={a.label} onClick={() => router.push(a.path)} style={{ textAlign: "center", padding: "14px 8px", borderRadius: 10, background: "var(--bg-primary)", border: "1px solid var(--border-light)", cursor: "pointer", transition: "0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = A; e.currentTarget.style.background = A + "08"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.background = "var(--bg-primary)"; }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: A }}>{a.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
        <KPI label="月間売上高" value={fmtY(tR)} trend="+12.5% 前月比" trendUp icon={<IcRcpt />} color={P} />
        <KPI label="パイプライン" value={fmtY(pV)} sub={`${oD.length}件の進行中案件`} icon={<IcUsers />} color={A} />
        <KPI label="入金済み" value={fmtY(pR)} sub={`回収率 ${invTotal ? Math.round(pR / invTotal * 100) : 0}%`} icon={<IcChk />} color="#0F6E56" />
        <KPI label="在庫アラート" value={lowStock.length + "件"} sub="要発注商品" icon={lowStock.length > 0 ? <IcAlrt /> : <IcBox />} color={lowStock.length > 0 ? "#A32D2D" : "#0F6E56"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 10 }}>
        {[
          { label: "請求書", value: data.invs.length + "件", sub: `未払い ${data.invs.filter(i => i.st !== "paid").length}件`, color: P },
          { label: "入金", value: data.invs.filter(i => i.st === "paid").length + "件", sub: `合計 ${fmtY(pR)}`, color: "#0F6E56" },
          { label: "商品", value: data.prods.length + "件", sub: `アラート ${lowStock.length}件`, color: "#BA7517" },
          { label: "仕訳", value: data.jrnl.length + "件", color: A },
          { label: "従業員", value: data.emps.length + "名", color: P },
          { label: "顧客", value: data.custs.length + "社", color: "#0F6E56" },
        ].map(r => (
          <Card key={r.label} style={{ padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: r.color }}>{r.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{r.label}</div>
            {r.sub && <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>{r.sub}</div>}
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div><div style={{ fontSize: 14, fontWeight: 600 }}>売上推移</div><div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>過去12ヶ月</div></div>
            <div style={{ fontSize: 20, fontWeight: 700, color: P }}>{fmtY(tR)}</div>
          </div>
          <MiniChart data={monthlyData} color={P} labels={monthLabels} />
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: A }}><IcAi /></span> AI経営参謀</div>
          {[
            { label: "売上予測", desc: "来月の売上は前月比+12%の見込み", color: "#0F6E56" },
            { label: "在庫最適化", desc: `在庫アラート: ${lowStock.length}件`, color: lowStock.length > 0 ? "#BA7517" : "#0F6E56" },
            { label: "売掛金管理", desc: invTotal - pR > 0 ? `期限超過請求: ${data.invs.filter(i => i.st !== "paid" && i.due < new Date().toISOString().slice(0, 10)).length}件` : "回収状況良好", color: invTotal - pR > 0 ? "#A32D2D" : "#0F6E56" },
          ].map(r => (
            <div key={r.label} style={{ padding: "10px 12px", borderRadius: 8, background: r.color + "08", marginBottom: 8, cursor: "pointer" }} onClick={() => router.push('/ai')}>
              <div style={{ fontSize: 12, fontWeight: 600, color: r.color, marginBottom: 2 }}>{r.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{r.desc}</div>
            </div>
          ))}
          <div onClick={() => router.push('/ai')} style={{ fontSize: 12, color: A, textAlign: "center", marginTop: 4, cursor: "pointer", fontWeight: 500 }}>詳細分析を見る →</div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>案件パイプライン</div>
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{fmtY(pV)}</span>
          </div>
          {["lead", "qualification", "proposal", "negotiation", "processing"].map(s => {
            const sd = data.deals.filter(d => d.stage === s);
            const t = sd.reduce((a, d) => a + d.val, 0);
            if (sd.length === 0) return null;
            return (
              <div key={s} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: STGC[s] }} /><span style={{ fontWeight: 500 }}>{STG[s]}</span><span style={{ color: "var(--text-tertiary)" }}>{sd.length}件</span></div>
                  <span style={{ fontWeight: 600, color: STGC[s] }}>{fmtY(t)}</span>
                </div>
                <PBar value={t} max={pV || 1} color={STGC[s]} h={6} />
              </div>
            );
          })}
        </Card>
        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <RingChart value={pR} max={invTotal} color={P} label="回収率" />
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-tertiary)", textAlign: "center" }}>{fmtY(pR)} / {fmtY(invTotal)}</div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>最近のアクティビティ</div>
            <Badge variant="default">システム全体</Badge>
          </div>
          {activities.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < activities.length - 1 ? "1px solid var(--border-light)" : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: a.color + "14", display: "flex", alignItems: "center", justifyContent: "center", color: a.color, flexShrink: 0 }}>{a.icon}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{a.action}</div><div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{a.user}</div></div>
              <span style={{ fontSize: 10, color: "var(--text-tertiary)", flexShrink: 0 }}>{a.time}</span>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>クイックアクション</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "顧客を追加", icon: <IcUsers />, path: "/crm", color: P },
              { label: "請求書を作成", icon: <IcRcpt />, path: "/billing", color: "#0F6E56" },
              { label: "在庫を確認", icon: <IcBox />, path: "/inventory", color: "#BA7517" },
              { label: "仕訳を入力", icon: <IcCalc />, path: "/accounting", color: A },
              { label: "従業員管理", icon: <IcPpl />, path: "/hr", color: P },
              { label: "AIに質問", icon: <IcAi />, path: "/ai-chat", color: A },
            ].map(a => (
              <div key={a.label} onClick={() => router.push(a.path)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, background: "var(--bg-secondary)", cursor: "pointer", transition: "0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = a.color + "10"; }} onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-secondary)"; }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: a.color + "18", display: "flex", alignItems: "center", justifyContent: "center", color: a.color, flexShrink: 0 }}>{a.icon}</div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{a.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>最近の受注</div>
          {lowStock.length > 0 && <Badge variant="danger">{lowStock.length}件の在庫アラート</Badge>}
        </div>
        <Tbl cols={[
          { label: "受注ID", key: "id" },
          { label: "顧客", render: r => <span style={{ fontWeight: 500 }}>{(data.custs.find(c => c.id === r.cid) || {}).name || "-"}</span> },
          { label: "日付", key: "date" },
          { label: "品目数", render: r => r.items.length + "品目" },
          { label: "金額", render: r => <span style={{ fontWeight: 600 }}>{fmtY(r.total)}</span> },
          { label: "ステータス", render: r => <Badge variant={r.st === "confirmed" ? "success" : r.st === "shipped" ? "info" : "warning"}>{ORDS[r.st]}</Badge> },
        ]} data={data.ords} />
      </Card>

      {data.notifs.filter(n => !n.read).length > 0 && (
        <Card style={{ borderLeft: "3px solid " + P }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>未読の通知</div>
          {data.notifs.filter(n => !n.read).map(n => (
            <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border-light)" }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, background: n.type === "warning" ? "#BA7517" : n.type === "success" ? "#0F6E56" : P }} />
              <span style={{ fontSize: 13, flex: 1 }}>{n.msg}</span>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", flexShrink: 0 }}>{n.date}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
