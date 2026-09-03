'use client';
import { useState, useMemo } from 'react';
import { Badge, Card, KPI, Tbl, Btn, Modal, Fld, inputStyle } from './UI';
import { IcRcpt, IcChk, IcAlrt, IcClk, IcPlus, IcZap, IcSnd } from './Icons';
import { today, uid, fmt, fmtY } from './useAuto';
import { methodLabel } from './POSModule';

const P = "#2b6876";
const A = "#534AB7";
const dayDiff = (a, b) => Math.floor((new Date(a) - new Date(b)) / 86400000);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const AP_CATS = ["仕入高", "外注費", "消耗品費", "地代家賃", "通信費", "広告宣伝費", "雑費"];

function IcScale() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21" /><path d="M5 7h14" /><path d="M3 14l2-7 2 7a2 2 0 0 1-4 0z" /><path d="M17 14l2-7 2 7a2 2 0 0 1-4 0z" /><path d="M8 21h8" /></svg>;
}

// 簡易正規化（銀行摘要との照合用）
const norm = (s) => (s || "").toString().replace(/[\s　・,.，。()（）株式会社|カ）|（カ|有限会社|ユ）|（ユ]/g, "").toLowerCase();

export function ARAPView({ data, setData, registerPay, settlePos, addPayable, payPayable, deletePayable }) {
  const [v, setV] = useState("overview");
  const [arFilter, setArFilter] = useState("open");
  const [apFilter, setApFilter] = useState("open");
  const [payInv, setPayInv] = useState(null);
  const [payAmt, setPayAmt] = useState("");
  const [payAp, setPayAp] = useState(null);
  const [apAmt, setApAmt] = useState("");
  const [showNewAp, setShowNewAp] = useState(false);
  const [newAp, setNewAp] = useState({ supplier: "", date: today(), due: addDays(today(), 30), amt: "", desc: "", cat: "仕入高" });
  const [feeRate, setFeeRate] = useState("3.3");
  const [bankText, setBankText] = useState("");
  const [matches, setMatches] = useState(null);
  const [bulkDone, setBulkDone] = useState(false);
  const [openBal, setOpenBal] = useState("8500000");
  const [selAp, setSelAp] = useState([]);

  const invs = data.invs || [];
  const pos = data.pos || [];
  const payables = data.payables || [];
  const custName = (id) => (data.custs.find(c => c.id === id) || {}).name || "-";

  // ---- 債権 ----
  const openInvs = invs.filter(i => i.st !== "paid" && i.st !== "draft");
  const arInv = openInvs.reduce((s, i) => s + (i.total - i.paid), 0);
  const unsettledPos = pos.filter(s => !s.settled && s.st !== "refunded");
  const arPos = unsettledPos.reduce((s, x) => s + x.total, 0);
  const arTotal = arInv + arPos;
  const arOverdue = openInvs.filter(i => i.due < today());
  const arOverdueAmt = arOverdue.reduce((s, i) => s + (i.total - i.paid), 0);

  // ---- 債務 ----
  const openAps = payables.filter(p => p.st !== "paid");
  const apTotal = openAps.reduce((s, p) => s + (p.total - p.paid), 0);
  const apOverdue = openAps.filter(p => p.due < today());
  const apOverdueAmt = apOverdue.reduce((s, p) => s + (p.total - p.paid), 0);
  const apDue7 = openAps.filter(p => p.due >= today() && dayDiff(p.due, today()) <= 7).reduce((s, p) => s + (p.total - p.paid), 0);

  // ---- エージング ----
  const ageBuckets = (rows, dueKey, remFn) => {
    const b = { current: 0, d30: 0, d60: 0, d90: 0 };
    rows.forEach(r => {
      const d = dayDiff(today(), r[dueKey]);
      const amt = remFn(r);
      if (d <= 0) b.current += amt; else if (d <= 30) b.d30 += amt; else if (d <= 60) b.d60 += amt; else b.d90 += amt;
    });
    return b;
  };
  const arAge = ageBuckets(openInvs, "due", i => i.total - i.paid);
  const apAge = ageBuckets(openAps, "due", p => p.total - p.paid);

  // ---- 資金繰り（8週） ----
  const weeks = useMemo(() => {
    const out = [];
    let cum = Number(openBal) || 0;
    for (let w = 0; w < 8; w++) {
      const from = addDays(today(), w * 7), to = addDays(today(), w * 7 + 6);
      const inRange = (d) => (w === 0 ? d <= to : d >= from && d <= to);
      const arIn = openInvs.filter(i => inRange(i.due)).reduce((s, i) => s + (i.total - i.paid), 0) + (w === 0 ? arPos : 0);
      const apOut = openAps.filter(p => inRange(p.due)).reduce((s, p) => s + (p.total - p.paid), 0);
      cum += arIn - apOut;
      out.push({ w: w + 1, from, to, arIn, apOut, net: arIn - apOut, cum });
    }
    return out;
  }, [openInvs, openAps, arPos, openBal]);
  const maxFlow = Math.max(1, ...weeks.map(w => Math.max(w.arIn, w.apOut)));

  // ---- 自動消込 ----
  const loadSample = () => {
    const lines = [];
    openInvs.slice(0, 2).forEach((i, k) => {
      const nm = custName(i.cid);
      lines.push(`${today()},振込 ${k === 0 ? nm : "カ）" + nm},${i.total - i.paid}`);
    });
    if (openInvs[2]) lines.push(`${today()},振込 ${custName(openInvs[2].cid)},${Math.round((openInvs[2].total - openInvs[2].paid) / 2)}`);
    lines.push(`${today()},振込 ナカムラショウテン,88000`);
    setBankText(lines.join("\n"));
    setMatches(null); setBulkDone(false);
  };

  const runMatch = () => {
    const rows = bankText.split("\n").map(l => l.trim()).filter(Boolean).map(l => {
      const [date, desc, amt] = l.split(/[,\t]/);
      return { date: date || today(), desc: desc || "", amt: Number((amt || "").replace(/[^\d]/g, "")) || 0 };
    });
    const used = new Set();
    const res = rows.map(r => {
      const nd = norm(r.desc);
      // 1) 金額完全一致 + 名称一致
      let cand = openInvs.filter(i => !used.has(i.id) && i.total - i.paid === r.amt && nd.includes(norm(custName(i.cid))));
      let conf = "high";
      if (!cand.length) { cand = openInvs.filter(i => !used.has(i.id) && i.total - i.paid === r.amt); conf = "high"; }
      if (!cand.length) { cand = openInvs.filter(i => !used.has(i.id) && nd.includes(norm(custName(i.cid))) && r.amt > 0 && r.amt < i.total - i.paid); conf = "partial"; }
      if (!cand.length) { cand = openInvs.filter(i => !used.has(i.id) && nd.includes(norm(custName(i.cid)))); conf = "low"; }
      const inv = cand[0] || null;
      if (inv) used.add(inv.id);
      return { ...r, inv, conf: inv ? conf : "none", apply: inv ? conf !== "low" : false };
    });
    setMatches(res); setBulkDone(false);
  };

  const applyMatches = () => {
    (matches || []).filter(m => m.apply && m.inv).forEach(m => registerPay(m.inv.id, Math.min(m.amt, m.inv.total - m.inv.paid)));
    setBulkDone(true);
  };

  // ---- 督促 ----
  const sendReminder = (inv) => {
    const cn = custName(inv.cid);
    const ts = new Date().toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    setData(prev => ({
      ...prev,
      activities: [{ id: uid("act"), cid: inv.cid, date: today(), type: "email", user: "システム", note: `請求書 ${inv.id}（${fmtY(inv.total - inv.paid)}・期日${inv.due}）の入金督促メールを自動送信。` }, ...(prev.activities || [])],
      alog: [...prev.alog, { id: uid("a"), ts, trig: "期日超過検知", act: "督促メール自動生成", det: cn + " " + fmtY(inv.total - inv.paid) }],
      notifs: [...prev.notifs, { id: uid("n"), msg: cn + "へ督促メールを送信（" + inv.id + "）", type: "info", read: false, date: today() }],
    }));
  };

  // ---- 全銀FB出力 ----
  const exportFB = (rows) => {
    const lines = rows.map(p => ["1", "0", p.supplier, (p.total - p.paid), p.due.replace(/-/g, ""), "普通", "振込"].join(","));
    const csv = ["区分,銀行コード,受取人名,金額,支払日,預金種別,摘要", ...lines].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `FB_payment_${today()}.csv`; a.click();
  };

  const bulkPay = () => {
    const rows = openAps.filter(p => selAp.includes(p.id));
    if (!rows.length) return;
    exportFB(rows);
    rows.forEach(p => payPayable(p.id, p.total - p.paid));
    setSelAp([]);
  };

  const inp = { ...inputStyle };
  const confBadge = { high: <Badge variant="success">自動一致</Badge>, partial: <Badge variant="info">一部入金</Badge>, low: <Badge variant="warning">要確認</Badge>, none: <Badge variant="danger">未一致</Badge> };

  const AgeBar = ({ b, color }) => {
    const t = b.current + b.d30 + b.d60 + b.d90 || 1;
    const segs = [["期限内", b.current, color], ["1-30日", b.d30, "#BA7517"], ["31-60日", b.d60, "#c1531b"], ["61日超", b.d90, "#A32D2D"]];
    return (
      <>
        <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", background: "var(--bg-tertiary)", marginBottom: 10 }}>
          {segs.map(([l, a, c]) => a > 0 && <div key={l} title={l} style={{ width: (a / t * 100) + "%", background: c }} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {segs.map(([l, a, c]) => (
            <div key={l}><div style={{ fontSize: 11, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: "inline-block" }} />{l}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{fmtY(a)}</div></div>
          ))}
        </div>
      </>
    );
  };

  const arRows = [...openInvs.map(i => ({ kind: "inv", id: i.id, name: custName(i.cid), date: i.date, due: i.due, total: i.total, paid: i.paid, rem: i.total - i.paid, st: i.st, raw: i })), ...invs.filter(i => i.st === "paid").map(i => ({ kind: "inv", id: i.id, name: custName(i.cid), date: i.date, due: i.due, total: i.total, paid: i.paid, rem: 0, st: "paid", raw: i }))]
    .filter(r => arFilter === "all" || (arFilter === "open" && r.rem > 0) || (arFilter === "overdue" && r.rem > 0 && r.due < today()) || (arFilter === "paid" && r.rem === 0));

  const apRows = payables.filter(p => apFilter === "all" || (apFilter === "open" && p.st !== "paid") || (apFilter === "overdue" && p.st !== "paid" && p.due < today()) || (apFilter === "paid" && p.st === "paid")).sort((a, b) => a.due.localeCompare(b.due));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>債権債務管理</h2>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>売掛金・買掛金・決済代行債権を一元管理し、消込と支払を自動化</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[["overview", "概要"], ["ar", "債権（売掛）"], ["ap", "債務（買掛）"], ["match", "自動消込"], ["cash", "資金繰り"]].map(([k, l]) => (
            <Btn key={k} variant={v === k ? "primary" : "default"} onClick={() => setV(k)}>{l}</Btn>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        <KPI label="債権残高" value={fmtY(arTotal)} sub={`売掛 ${fmtY(arInv)} / 決済代行 ${fmtY(arPos)}`} icon={<IcRcpt />} color={P} />
        <KPI label="債務残高" value={fmtY(apTotal)} sub={`${openAps.length}件`} icon={<IcScale />} color={A} />
        <KPI label="ネットポジション" value={(arTotal - apTotal >= 0 ? "+" : "") + fmtY(arTotal - apTotal)} sub="債権 − 債務" icon={<IcChk />} color={arTotal - apTotal >= 0 ? "#0F6E56" : "#A32D2D"} />
        <KPI label="期日超過" value={fmtY(arOverdueAmt + apOverdueAmt)} sub={`回収${arOverdue.length}件 / 支払${apOverdue.length}件`} icon={<IcAlrt />} color={arOverdue.length + apOverdue.length > 0 ? "#A32D2D" : "#0F6E56"} />
      </div>

      {/* ===== 概要 ===== */}
      {v === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>売掛金エージング</div>
              <AgeBar b={arAge} color={P} />
            </Card>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>買掛金エージング</div>
              <AgeBar b={apAge} color={A} />
            </Card>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card style={{ borderLeft: "3px solid " + A, background: A + "04" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: A, display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><IcZap /> AIアクション提案</div>
              {[
                arOverdue.length > 0 && { t: `期日超過の売掛${arOverdue.length}件（${fmtY(arOverdueAmt)}）に督促を送る`, act: () => setV("ar") },
                unsettledPos.length > 0 && { t: `決済代行の未入金${unsettledPos.length}件（${fmtY(arPos)}）を入金確認する`, act: () => setV("ar") },
                apDue7 > 0 && { t: `7日以内の支払予定 ${fmtY(apDue7)} をFBデータで一括処理する`, act: () => setV("ap") },
                openInvs.length > 0 && { t: "銀行入金データを取り込んで自動消込する", act: () => setV("match") },
              ].filter(Boolean).map((x, i) => (
                <div key={i} onClick={x.act} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border-light)", fontSize: 13, cursor: "pointer" }}>
                  <span>{x.t}</span><span style={{ color: A, fontSize: 12 }}>実行 →</span>
                </div>
              ))}
              {arOverdue.length === 0 && unsettledPos.length === 0 && apDue7 === 0 && <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>対応が必要な項目はありません</div>}
            </Card>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>直近の入出金予定（14日）</div>
              {[...openInvs.filter(i => dayDiff(i.due, today()) <= 14).map(i => ({ d: i.due, n: custName(i.cid), a: i.total - i.paid, io: "in" })),
                ...openAps.filter(p => dayDiff(p.due, today()) <= 14).map(p => ({ d: p.due, n: p.supplier, a: p.total - p.paid, io: "out" }))]
                .sort((a, b) => a.d.localeCompare(b.d)).slice(0, 8).map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
                    <span><span style={{ color: r.d < today() ? "#A32D2D" : "var(--text-tertiary)", fontSize: 12, marginRight: 8 }}>{r.d}</span>{r.n}</span>
                    <span style={{ fontWeight: 600, color: r.io === "in" ? "#0F6E56" : "#A32D2D" }}>{r.io === "in" ? "+" : "−"}{fmtY(r.a)}</span>
                  </div>
                ))}
            </Card>
          </div>
        </>
      )}

      {/* ===== 債権 ===== */}
      {v === "ar" && (
        <>
          {unsettledPos.length > 0 && (
            <Card style={{ borderLeft: "3px solid #BA7517" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>決済代行会社 入金待ち（POS）</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{unsettledPos.length}件 / 合計 {fmtY(arPos)} — {Object.entries(unsettledPos.reduce((o, s) => { o[s.method] = (o[s.method] || 0) + s.total; return o; }, {})).map(([m, a]) => methodLabel(m) + " " + fmtY(a)).join(" / ")}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>手数料率</span>
                  <input type="number" step="0.1" value={feeRate} onChange={e => setFeeRate(e.target.value)} style={{ ...inp, width: 70, textAlign: "right" }} />
                  <span style={{ fontSize: 12 }}>%</span>
                  <Btn variant="primary" onClick={() => settlePos(unsettledPos.map(s => s.id), (Number(feeRate) || 0) / 100)}>入金確認・一括消込</Btn>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 8 }}>入金額 {fmtY(arPos - Math.round(arPos * (Number(feeRate) || 0) / 100))}（手数料 {fmtY(Math.round(arPos * (Number(feeRate) || 0) / 100))} を支払手数料として自動計上）</div>
            </Card>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            {[["open", "未回収"], ["overdue", "期日超過"], ["paid", "回収済"], ["all", "すべて"]].map(([k, l]) => <Btn key={k} size="sm" variant={arFilter === k ? "primary" : "default"} onClick={() => setArFilter(k)}>{l}</Btn>)}
          </div>
          <Tbl cols={[
            { label: "請求書No", render: r => <span style={{ fontWeight: 500 }}>{r.id}</span> },
            { label: "取引先", key: "name" },
            { label: "請求日", key: "date" },
            { label: "支払期日", render: r => { const od = r.rem > 0 && r.due < today(); return <span style={{ color: od ? "#A32D2D" : "inherit", fontWeight: od ? 600 : 400 }}>{r.due}{od && ` (${dayDiff(today(), r.due)}日超過)`}</span>; } },
            { label: "請求額", render: r => fmtY(r.total) },
            { label: "入金済", render: r => <span style={{ color: "#0F6E56" }}>{fmtY(r.paid)}</span> },
            { label: "残高", render: r => <span style={{ fontWeight: 600 }}>{fmtY(r.rem)}</span> },
            { label: "状態", render: r => r.rem === 0 ? <Badge variant="success">回収済</Badge> : r.due < today() ? <Badge variant="danger">超過</Badge> : r.paid > 0 ? <Badge variant="info">一部入金</Badge> : <Badge variant="warning">未回収</Badge> },
            { label: "操作", render: r => r.rem > 0 ? <div style={{ display: "flex", gap: 6 }}><Btn size="sm" variant="primary" onClick={() => { setPayInv(r.raw); setPayAmt(String(r.rem)); }}>入金登録</Btn>{r.due < today() && <Btn size="sm" onClick={() => sendReminder(r.raw)}><IcSnd /> 督促</Btn>}</div> : <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>—</span> },
          ]} data={arRows} />
          {payInv && (
            <Modal title="入金登録" onClose={() => setPayInv(null)}>
              <div style={{ fontSize: 13, marginBottom: 12 }}>{custName(payInv.cid)} / {payInv.id} / 残高 <b>{fmtY(payInv.total - payInv.paid)}</b></div>
              <Fld label="入金額"><input type="number" value={payAmt} onChange={e => setPayAmt(e.target.value)} style={inp} /></Fld>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14 }}>登録すると消込仕訳（普通預金/売掛金）を自動生成します</div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Btn onClick={() => setPayInv(null)}>キャンセル</Btn>
                <Btn variant="primary" disabled={!(Number(payAmt) > 0)} onClick={() => { registerPay(payInv.id, Math.min(Number(payAmt), payInv.total - payInv.paid)); setPayInv(null); }}>登録</Btn>
              </div>
            </Modal>
          )}
        </>
      )}

      {/* ===== 債務 ===== */}
      {v === "ap" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {[["open", "未払"], ["overdue", "期日超過"], ["paid", "支払済"], ["all", "すべて"]].map(([k, l]) => <Btn key={k} size="sm" variant={apFilter === k ? "primary" : "default"} onClick={() => setApFilter(k)}>{l}</Btn>)}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="success" disabled={!selAp.length} onClick={bulkPay}>選択{selAp.length ? `(${selAp.length}件)` : ""}を一括支払・FB出力</Btn>
              <Btn variant="primary" onClick={() => setShowNewAp(true)}><IcPlus /> 仕入・経費を登録</Btn>
            </div>
          </div>
          <Tbl cols={[
            { label: "", render: r => r.st !== "paid" ? <input type="checkbox" checked={selAp.includes(r.id)} onChange={e => setSelAp(p => e.target.checked ? [...p, r.id] : p.filter(x => x !== r.id))} onClick={e => e.stopPropagation()} /> : null },
            { label: "No", render: r => <span style={{ fontWeight: 500 }}>{r.id}</span> },
            { label: "仕入先", key: "supplier" },
            { label: "摘要", render: r => <span style={{ fontSize: 12 }}>{r.desc || r.cat}</span> },
            { label: "計上日", key: "date" },
            { label: "支払期日", render: r => { const od = r.st !== "paid" && r.due < today(); return <span style={{ color: od ? "#A32D2D" : "inherit", fontWeight: od ? 600 : 400 }}>{r.due}</span>; } },
            { label: "金額(税込)", render: r => fmtY(r.total) },
            { label: "残高", render: r => <span style={{ fontWeight: 600 }}>{fmtY(r.total - r.paid)}</span> },
            { label: "状態", render: r => r.st === "paid" ? <Badge variant="success">支払済</Badge> : r.due < today() ? <Badge variant="danger">超過</Badge> : r.st === "partial" ? <Badge variant="info">一部支払</Badge> : <Badge variant="warning">未払</Badge> },
            { label: "操作", render: r => r.st !== "paid" ? <div style={{ display: "flex", gap: 6 }}><Btn size="sm" variant="primary" onClick={() => { setPayAp(r); setApAmt(String(r.total - r.paid)); }}>支払登録</Btn>{r.paid === 0 && <Btn size="sm" variant="ghost" onClick={() => deletePayable(r.id)}>削除</Btn>}</div> : <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>{r.paidDate || "—"}</span> },
          ]} data={apRows} />
          <Card style={{ background: "var(--bg-secondary)", border: "none" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>自動化フロー</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.8 }}>仕入・経費登録 → 買掛金仕訳（{AP_CATS[0]}等/買掛金）自動生成 → 支払期日をもとに資金繰り予定へ反映 → 一括支払で全銀FBデータ出力 + 消込仕訳（買掛金/普通預金）自動生成</div>
          </Card>
          {showNewAp && (
            <Modal title="仕入・経費の登録" onClose={() => setShowNewAp(false)}>
              <Fld label="仕入先・支払先"><input value={newAp.supplier} onChange={e => setNewAp({ ...newAp, supplier: e.target.value })} placeholder="テクノパーツ株式会社" style={inp} /></Fld>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Fld label="計上日"><input type="date" value={newAp.date} onChange={e => setNewAp({ ...newAp, date: e.target.value })} style={inp} /></Fld>
                <Fld label="支払期日"><input type="date" value={newAp.due} onChange={e => setNewAp({ ...newAp, due: e.target.value })} style={inp} /></Fld>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Fld label="金額（税抜）"><input type="number" value={newAp.amt} onChange={e => setNewAp({ ...newAp, amt: e.target.value })} style={inp} /></Fld>
                <Fld label="勘定科目"><select value={newAp.cat} onChange={e => setNewAp({ ...newAp, cat: e.target.value })} style={inp}>{AP_CATS.map(c => <option key={c}>{c}</option>)}</select></Fld>
              </div>
              <Fld label="摘要"><input value={newAp.desc} onChange={e => setNewAp({ ...newAp, desc: e.target.value })} placeholder="部品仕入 3月分" style={inp} /></Fld>
              {Number(newAp.amt) > 0 && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14 }}>税込 {fmtY(Math.round(Number(newAp.amt) * 1.1))} を買掛金として計上します</div>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Btn onClick={() => setShowNewAp(false)}>キャンセル</Btn>
                <Btn variant="primary" disabled={!newAp.supplier || !(Number(newAp.amt) > 0)} onClick={() => { addPayable({ ...newAp, amt: Number(newAp.amt) }); setShowNewAp(false); setNewAp({ supplier: "", date: today(), due: addDays(today(), 30), amt: "", desc: "", cat: "仕入高" }); }}>登録</Btn>
              </div>
            </Modal>
          )}
          {payAp && (
            <Modal title="支払登録" onClose={() => setPayAp(null)}>
              <div style={{ fontSize: 13, marginBottom: 12 }}>{payAp.supplier} / {payAp.id} / 残高 <b>{fmtY(payAp.total - payAp.paid)}</b></div>
              <Fld label="支払額"><input type="number" value={apAmt} onChange={e => setApAmt(e.target.value)} style={inp} /></Fld>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14 }}>登録すると消込仕訳（買掛金/普通預金）を自動生成します</div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Btn onClick={() => setPayAp(null)}>キャンセル</Btn>
                <Btn variant="primary" disabled={!(Number(apAmt) > 0)} onClick={() => { payPayable(payAp.id, Math.min(Number(apAmt), payAp.total - payAp.paid)); setPayAp(null); }}>登録</Btn>
              </div>
            </Modal>
          )}
        </>
      )}

      {/* ===== 自動消込 ===== */}
      {v === "match" && (
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16, alignItems: "start" }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>銀行入金データ取込</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.6 }}>ネットバンキングの入金明細を「日付,摘要,金額」形式で貼り付けてください。AIが取引先名・金額から売掛金と自動照合します。</div>
            <textarea value={bankText} onChange={e => setBankText(e.target.value)} rows={8} placeholder={"2025-04-10,振込 カ）エービーシーショウジ,1595000\n..."} style={{ ...inp, fontFamily: "monospace", fontSize: 12, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Btn size="sm" onClick={loadSample}>サンプル取込</Btn>
              <Btn size="sm" variant="primary" disabled={!bankText.trim()} onClick={runMatch}><IcZap /> AI照合を実行</Btn>
            </div>
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {!matches && <Card><div style={{ padding: 30, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>入金データを取り込んで照合を実行してください</div></Card>}
            {matches && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                  {[["自動一致", matches.filter(m => m.conf === "high").length, "#0F6E56"], ["一部入金", matches.filter(m => m.conf === "partial").length, P], ["要確認", matches.filter(m => m.conf === "low").length, "#BA7517"], ["未一致", matches.filter(m => m.conf === "none").length, "#A32D2D"]].map(([l, n, c]) => (
                    <Card key={l} style={{ padding: 14 }}><div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{l}</div><div style={{ fontSize: 20, fontWeight: 700, color: c }}>{n}件</div></Card>
                  ))}
                </div>
                <Tbl cols={[
                  { label: "適用", render: (r, i) => r.inv && !bulkDone ? <input type="checkbox" checked={r.apply} onChange={e => setMatches(ms => ms.map((m, k) => k === i ? { ...m, apply: e.target.checked } : m))} /> : null },
                  { label: "入金日", key: "date" },
                  { label: "銀行摘要", render: r => <span style={{ fontSize: 12 }}>{r.desc}</span> },
                  { label: "入金額", render: r => <span style={{ fontWeight: 600 }}>{fmtY(r.amt)}</span> },
                  { label: "照合結果", render: r => confBadge[r.conf] },
                  { label: "対応請求書", render: r => r.inv ? <span style={{ fontSize: 12 }}>{r.inv.id} {custName(r.inv.cid)} <span style={{ color: "var(--text-tertiary)" }}>残{fmtY(r.inv.total - r.inv.paid)}</span></span> : <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>候補なし — 手動で確認</span> },
                ]} data={matches} />
                {bulkDone ? (
                  <div style={{ padding: 12, background: "var(--success-bg)", borderRadius: 8, color: "var(--success)", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}><IcChk /> 消込を実行しました。仕訳（普通預金/売掛金）を自動生成しています。</div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Btn variant="primary" disabled={!matches.some(m => m.apply && m.inv)} onClick={applyMatches}>チェック済 {matches.filter(m => m.apply && m.inv).length}件を一括消込</Btn>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== 資金繰り ===== */}
      {v === "cash" && (
        <>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>資金繰り予測（8週間）</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-secondary)" }}>起点残高（現預金）<input type="number" value={openBal} onChange={e => setOpenBal(e.target.value)} style={{ ...inp, width: 140, textAlign: "right" }} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 8, alignItems: "end", height: 180, marginBottom: 8 }}>
              {weeks.map(w => (
                <div key={w.w} style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", gap: 2 }}>
                  <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: "100%" }}>
                    <div title={"入金 " + fmtY(w.arIn)} style={{ flex: 1, height: (w.arIn / maxFlow * 100) + "%", background: "#0F6E56", borderRadius: "4px 4px 0 0", minHeight: w.arIn ? 3 : 0, transition: "height 0.4s" }} />
                    <div title={"支払 " + fmtY(w.apOut)} style={{ flex: 1, height: (w.apOut / maxFlow * 100) + "%", background: "#A32D2D", borderRadius: "4px 4px 0 0", minHeight: w.apOut ? 3 : 0, transition: "height 0.4s" }} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-tertiary)", textAlign: "center" }}>W{w.w}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--text-secondary)" }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#0F6E56", borderRadius: 2, marginRight: 4 }} />入金予定（売掛・決済代行）</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#A32D2D", borderRadius: 2, marginRight: 4 }} />支払予定（買掛）</span>
            </div>
          </Card>
          <Tbl cols={[
            { label: "週", render: r => <span style={{ fontWeight: 500 }}>W{r.w} <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>{r.from.slice(5)}〜{r.to.slice(5)}</span></span> },
            { label: "入金予定", render: r => <span style={{ color: "#0F6E56" }}>{r.arIn ? "+" + fmtY(r.arIn) : "—"}</span> },
            { label: "支払予定", render: r => <span style={{ color: "#A32D2D" }}>{r.apOut ? "−" + fmtY(r.apOut) : "—"}</span> },
            { label: "純増減", render: r => <span style={{ fontWeight: 600, color: r.net >= 0 ? "#0F6E56" : "#A32D2D" }}>{(r.net >= 0 ? "+" : "") + fmtY(r.net)}</span> },
            { label: "予測残高", render: r => <span style={{ fontWeight: 600, color: r.cum < 0 ? "#A32D2D" : P }}>{fmtY(r.cum)}</span> },
          ]} data={weeks} />
        </>
      )}
    </div>
  );
}
