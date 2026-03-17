'use client';
import { useState } from 'react';
import { Badge, Card, KPI, Tbl, Btn, PBar, Modal, Fld, inputStyle } from './UI';
import { IcBox, IcCalc, IcPpl, IcRcpt, IcBell, IcClk, IcSet, IcZap, IcFlow, IcChk, IcAlrt, IcPlus } from './Icons';
import { fmtY, today, uid } from './useAuto';

const P = "#2b6876";
const A = "#534AB7";
const ORDS = { pending: "未確認", confirmed: "確定", shipped: "出荷済" };

export function InvView({ data, setData, confirmOrder }) {
  const [v, setV] = useState("prod");
  const [showNew, setShowNew] = useState(false);
  const [newCid, setNewCid] = useState(data.custs[0].id);
  const [newItems, setNewItems] = useState([{ pid: data.prods[0].id, qty: 1 }]);
  const newTotal = newItems.reduce((s, it) => { const p = data.prods.find(x => x.id === it.pid); return s + (p ? p.price * it.qty : 0); }, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>在庫・物流管理</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant={v === "prod" ? "primary" : "default"} size="sm" onClick={() => setV("prod")}>商品</Btn>
          <Btn variant={v === "ord" ? "primary" : "default"} size="sm" onClick={() => setV("ord")}>受注</Btn>
          <Btn variant="primary" size="sm" onClick={() => setShowNew(true)}><IcPlus /> 新規受注</Btn>
        </div>
      </div>
      {v === "prod" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
            <KPI label="総SKU" value={data.prods.length} icon={<IcBox />} color={P} />
            <KPI label="在庫総額" value={fmtY(data.prods.reduce((s, p) => s + p.cost * p.stk, 0))} icon={<IcCalc />} color="#0F6E56" />
            <KPI label="要発注" value={data.prods.filter(p => p.stk <= p.min).length + "件"} icon={<IcAlrt />} color="#A32D2D" />
          </div>
          <Tbl cols={[
            { label: "商品名", render: r => <div><div style={{ fontWeight: 500 }}>{r.name}</div><div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{r.sku}</div></div> },
            { label: "カテゴリ", key: "cat" }, { label: "単価", render: r => fmtY(r.price) },
            { label: "在庫", render: r => <span style={{ fontWeight: 500, color: r.stk <= r.min ? "#A32D2D" : "inherit" }}>{r.stk}{r.stk <= r.min ? " ⚠" : ""}</span> },
            { label: "倉庫", key: "wh" },
          ]} data={data.prods} />
        </>
      )}
      {v === "ord" && (
        <>
          <Tbl cols={[
            { label: "ID", key: "id" }, { label: "顧客", render: r => (data.custs.find(c => c.id === r.cid) || {}).name || "-" },
            { label: "日付", key: "date" }, { label: "合計", render: r => fmtY(r.total) },
            { label: "状態", render: r => <Badge variant={r.st === "confirmed" ? "success" : r.st === "shipped" ? "info" : "warning"}>{ORDS[r.st]}</Badge> },
            { label: "操作", render: r => r.st === "pending" ? <Btn variant="success" size="sm" onClick={e => { e.stopPropagation(); confirmOrder(r.id); }}><IcZap /> 受注確定</Btn> : r.st === "confirmed" ? <span style={{ color: "#0F6E56", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}><IcChk /> 確定済</span> : null },
          ]} data={data.ords} />
          <Card style={{ borderLeft: "3px solid " + A, padding: 14 }}>
            <div style={{ fontSize: 13, color: A, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}><IcZap />「受注確定」で自動実行:</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.8 }}>1. 請求書自動生成（税込・30日払い）<br />2. 売上仕訳自動計上（売掛金/売上高）<br />3. 在庫自動引当・出庫処理</div>
          </Card>
        </>
      )}
      {showNew && (
        <Modal title="新規受注登録" onClose={() => setShowNew(false)} wide>
          <Fld label="顧客"><select value={newCid} onChange={e => setNewCid(e.target.value)} style={inputStyle}>{data.custs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Fld>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>商品明細</div>
          {newItems.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <select value={it.pid} onChange={e => setNewItems(newItems.map((x, j) => j === i ? { ...x, pid: e.target.value } : x))} style={{ ...inputStyle, flex: 2 }}>{data.prods.map(p => <option key={p.id} value={p.id}>{p.name} ({fmtY(p.price)}) 在庫:{p.stk}</option>)}</select>
              <input type="number" min="1" value={it.qty} onChange={e => setNewItems(newItems.map((x, j) => j === i ? { ...x, qty: Number(e.target.value) } : x))} style={{ ...inputStyle, width: 70, flex: "none" }} />
            </div>
          ))}
          <Btn variant="ghost" size="sm" onClick={() => setNewItems([...newItems, { pid: data.prods[0].id, qty: 1 }])}><IcPlus /> 追加</Btn>
          <div style={{ borderTop: "1px solid var(--border-light)", marginTop: 16, paddingTop: 16, display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>合計: {fmtY(newTotal)}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => setShowNew(false)}>キャンセル</Btn>
              <Btn variant="primary" onClick={() => { setData(p => ({ ...p, ords: [...p.ords, { id: uid("o"), cid: newCid, date: today(), st: "pending", items: newItems.map(it => { const pr = data.prods.find(x => x.id === it.pid); return { pid: it.pid, qty: it.qty, pr: pr ? pr.price : 0 }; }), total: newTotal }] })); setShowNew(false); setNewItems([{ pid: data.prods[0].id, qty: 1 }]); }}>受注登録</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function AcctView({ data }) {
  const [v, setV] = useState("jnl");
  const tS = data.jrnl.filter(j => j.cr.acc === "売上高").reduce((s, j) => s + j.cr.amt, 0);
  const tE = data.jrnl.filter(j => !["売掛金", "普通預金"].includes(j.dr.acc)).reduce((s, j) => s + j.dr.amt, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>会計・財務</h2>
        <div style={{ display: "flex", gap: 8 }}>{[["jnl", "仕訳帳"], ["pl", "P/L"], ["bs", "B/S"]].map(([k, l]) => <Btn key={k} variant={v === k ? "primary" : "default"} size="sm" onClick={() => setV(k)}>{l}</Btn>)}</div>
      </div>
      {v === "jnl" && (<><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}><KPI label="売上高" value={fmtY(tS)} icon={<IcRcpt />} color="#0F6E56" trend="+15%" trendUp /><KPI label="経費" value={fmtY(tE)} icon={<IcCalc />} color="#A32D2D" /><KPI label="自動仕訳" value={data.jrnl.filter(j => j.auto).length + "件"} sub={"全" + data.jrnl.length + "件中"} icon={<IcZap />} color={A} /></div><Tbl cols={[{ label: "日付", key: "date" }, { label: "摘要", render: r => <span>{r.auto && <Badge variant="purple">自動</Badge>} {r.desc}</span> }, { label: "借方", render: r => r.dr.acc }, { label: "借方額", render: r => fmtY(r.dr.amt) }, { label: "貸方", render: r => r.cr.acc }, { label: "貸方額", render: r => fmtY(r.cr.amt) }, { label: "連携", render: r => r.ref ? <span style={{ fontSize: 11, color: A }}>{r.ref}</span> : <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>手動</span> }]} data={data.jrnl} /></>)}
      {v === "pl" && (<Card><h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>損益計算書 (P/L)</h3>{[{ l: "売上高", a: tS, b: true }, { l: "売上原価", a: 800000 }, { l: "売上総利益", a: tS - 800000, b: true, d: true }, { l: "販管費", a: tE }, { l: "営業利益", a: tS - 800000 - tE, b: true, d: true, h: true }].map((r, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: r.d ? "1px solid var(--border-light)" : "none", fontWeight: r.b ? 600 : 400, color: r.h ? "#0F6E56" : "inherit" }}><span>{r.l}</span><span>{fmtY(r.a)}</span></div>)}</Card>)}
      {v === "bs" && (<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}><Card><h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px", color: P }}>資産</h3>{[{ l: "現金", a: 500000 }, { l: "普通預金", a: 8500000 }, { l: "売掛金", a: data.invs.reduce((s, i) => s + (i.total - i.paid), 0) }, { l: "棚卸資産", a: data.prods.reduce((s, p) => s + p.cost * p.stk, 0) }].map((r, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, borderBottom: "1px solid var(--border-light)" }}><span>{r.l}</span><span style={{ fontWeight: 500 }}>{fmtY(r.a)}</span></div>)}</Card><Card><h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px", color: "#A32D2D" }}>負債・資本</h3>{[{ l: "買掛金", a: 1200000 }, { l: "未払金", a: 800000 }, { l: "資本金", a: 3000000 }, { l: "利益剰余金", a: 5200000 }].map((r, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, borderBottom: "1px solid var(--border-light)" }}><span>{r.l}</span><span style={{ fontWeight: 500 }}>{fmtY(r.a)}</span></div>)}</Card></div>)}
    </div>
  );
}

export function HRView({ data, role, confirmPayroll }) {
  const [v, setV] = useState("emp"); const [clk, setClk] = useState(false); const [pd, setPd] = useState(false);
  if (role === "employee") return <div style={{ display: "flex", flexDirection: "column", gap: 16 }}><h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>勤怠・給与</h2><Card style={{ textAlign: "center", padding: 32 }}><div style={{ fontSize: 48, fontWeight: 700, marginBottom: 16 }}>{new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</div><Btn variant={clk ? "danger" : "success"} size="lg" onClick={() => setClk(!clk)}>{clk ? "退勤打刻" : "出勤打刻"}</Btn>{clk && <div style={{ marginTop: 12, color: "#0F6E56", fontWeight: 500 }}>勤務中</div>}</Card></div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>人事・労務</h2><div style={{ display: "flex", gap: 8 }}><Btn variant={v === "emp" ? "primary" : "default"} size="sm" onClick={() => setV("emp")}>従業員</Btn><Btn variant={v === "pay" ? "primary" : "default"} size="sm" onClick={() => setV("pay")}>給与計算</Btn></div></div>
      {v === "emp" && <Tbl cols={[{ label: "氏名", render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> }, { label: "部署", key: "dept" }, { label: "役職", key: "role" }, { label: "月給", render: r => fmtY(r.sal) }, { label: "有給残", render: r => (r.pl - r.ul) + "日" }]} data={data.emps} />}
      {v === "pay" && <Card><div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>給与計算 — 2025年3月</div><Tbl cols={[{ label: "氏名", render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> }, { label: "基本給", render: r => fmtY(r.sal) }, { label: "社保", render: r => fmtY(Math.round(r.sal * 0.15)) }, { label: "所得税", render: r => fmtY(Math.round(r.sal * 0.05)) }, { label: "手取り", render: r => fmtY(Math.round(r.sal * 0.80)) }]} data={data.emps} /><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-light)" }}><span>支給総額: <b>{fmtY(data.emps.reduce((s, e) => s + e.sal, 0))}</b></span><Btn variant="success" onClick={() => { confirmPayroll(); setPd(true); }} disabled={pd}><IcZap /> 給与確定→仕訳自動生成</Btn></div>{pd && <div style={{ marginTop: 12, padding: 10, background: "var(--success-bg)", borderRadius: 8, fontSize: 12, color: "var(--success)", display: "flex", alignItems: "center", gap: 6 }}><IcChk /> 給与・社保仕訳を自動生成しました</div>}</Card>}
    </div>
  );
}

export function BillView({ data, registerPay }) {
  const [pt, setPt] = useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>請求・決済</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}><KPI label="請求総額" value={fmtY(data.invs.reduce((s, i) => s + i.total, 0))} icon={<IcRcpt />} color={P} /><KPI label="入金済" value={fmtY(data.invs.reduce((s, i) => s + i.paid, 0))} icon={<IcChk />} color="#0F6E56" /><KPI label="未回収" value={fmtY(data.invs.reduce((s, i) => s + (i.total - i.paid), 0))} icon={<IcAlrt />} color="#A32D2D" /></div>
      <Tbl cols={[{ label: "No", key: "id" }, { label: "顧客", render: r => (data.custs.find(c => c.id === r.cid) || {}).name || "-" }, { label: "発行日", key: "date" }, { label: "期日", key: "due" }, { label: "税込", render: r => fmtY(r.total) }, { label: "入金額", render: r => fmtY(r.paid) }, { label: "状態", render: r => <Badge variant={r.st === "paid" ? "success" : r.st === "partial" ? "warning" : "info"}>{r.st === "paid" ? "入金済" : r.st === "partial" ? "一部入金" : "送付済"}</Badge> }, { label: "操作", render: r => r.st !== "paid" ? <Btn variant="success" size="sm" onClick={e => { e.stopPropagation(); setPt(r); }}><IcZap /> 入金登録</Btn> : <span style={{ color: "#0F6E56", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}><IcChk /> 完了</span> }]} data={data.invs} />
      <Card style={{ borderLeft: "3px solid " + P }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><Badge variant="info">Stripe連携</Badge><span style={{ fontSize: 14, fontWeight: 500 }}>SaaS課金設定</span></div><div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Stripeアカウントを接続して月額課金・自動決済を有効化</div><Btn variant="primary" size="sm" style={{ marginTop: 12 }}>Stripeアカウントを接続</Btn></Card>
      {pt && <Modal title="入金登録" onClose={() => setPt(null)}><Fld label="顧客"><div style={{ fontWeight: 500 }}>{(data.custs.find(c => c.id === pt.cid) || {}).name}</div></Fld><Fld label="請求額">{fmtY(pt.total)}</Fld><Fld label="未回収"><span style={{ fontWeight: 600, color: "#A32D2D" }}>{fmtY(pt.total - pt.paid)}</span></Fld><div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}><Btn onClick={() => setPt(null)}>キャンセル</Btn><Btn variant="success" onClick={() => { registerPay(pt.id, pt.total - pt.paid); setPt(null); }}>入金を登録</Btn></div></Modal>}
    </div>
  );
}

export function AutoLogView({ data }) {
  const tc = { "受注確定": P, "請求書発行": "#0F6E56", "入金登録": A, "給与確定": "#854F0B" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>データ連携ログ</h2><Badge variant="purple">{data.alog.length}件</Badge></div>
      <Card style={{ padding: 16 }}><div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>自動連携フロー</div><div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>{["受注確定", "→", "請求書生成", "→", "売上仕訳", "+", "在庫引当"].map((x, i) => x === "→" || x === "+" ? <span key={i} style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>{x}</span> : <span key={i} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: P + "18", color: P }}>{x}</span>)}</div><div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", marginTop: 8 }}>{["入金登録", "→", "消込仕訳", "｜", "給与確定", "→", "給与・社保仕訳"].map((x, i) => x === "→" || x === "｜" ? <span key={i} style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>{x}</span> : <span key={i} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: A + "18", color: A }}>{x}</span>)}</div></Card>
      <Card style={{ padding: 0 }}><div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-light)", fontSize: 13, fontWeight: 500 }}>タイムライン</div>{[...data.alog].reverse().map(l => <div key={l.id} style={{ display: "flex", gap: 14, padding: "14px 20px", borderBottom: "1px solid var(--border-light)" }}><div style={{ width: 32, height: 32, borderRadius: 8, background: (tc[l.trig] || "#888") + "18", display: "flex", alignItems: "center", justifyContent: "center", color: tc[l.trig] || "#888", flexShrink: 0 }}><IcZap /></div><div style={{ flex: 1 }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 12, fontWeight: 600, color: tc[l.trig] || "#888" }}>{l.trig}</span><span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>→</span><span style={{ fontSize: 13, fontWeight: 500 }}>{l.act}</span></div><div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{l.det}</div><div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{l.ts}</div></div></div>)}</Card>
    </div>
  );
}

export function SettView({ data }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>設定</h2>
      <Card><h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>会社情報</h3><div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13 }}><span style={{ color: "var(--text-secondary)" }}>会社名</span><span style={{ fontWeight: 500 }}>{data.company.name}</span></div></Card>
      <Card style={{ borderLeft: "3px solid " + A }}><h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px" }}>データ連携設定</h3>{["受注確定→請求書自動生成", "請求書発行→売上仕訳", "受注確定→在庫引当", "入金登録→消込仕訳", "給与確定→給与仕訳"].map(r => <div key={r} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}><span style={{ display: "flex", alignItems: "center", gap: 6 }}><IcZap /> {r}</span><Badge variant="success">有効</Badge></div>)}</Card>
    </div>
  );
}
