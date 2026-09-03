'use client';
import { useState, useMemo } from 'react';
import { Badge, Card, KPI, Tbl, Btn, Modal, Fld, inputStyle } from './UI';
import { IcRcpt, IcChk, IcAlrt, IcClk, IcBox, IcPlus, IcX, IcZap } from './Icons';
import { today, uid, fmt, fmtY } from './useAuto';

const P = "#2b6876";
const A = "#534AB7";
const TAX_RATE = 0.1;

export const PAY_METHODS = [
  { id: "cash", label: "現金", acc: "現金" },
  { id: "card", label: "クレジット", acc: "未収入金" },
  { id: "qr", label: "QR決済", acc: "未収入金" },
  { id: "emoney", label: "電子マネー", acc: "未収入金" },
];
export const methodLabel = (m) => (PAY_METHODS.find(x => x.id === m) || {}).label || m;

function IcCart() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>;
}

// ---------- レシート ----------
function Receipt({ sale, company, onClose }) {
  const printReceipt = () => {
    const w = window.open("", "_blank", "width=420,height=640");
    if (!w) return;
    const rows = sale.items.map(i => `<tr><td>${i.name}</td><td style="text-align:right">${i.qty}</td><td style="text-align:right">${fmt(i.pr * i.qty)}</td></tr>`).join("");
    w.document.write(`<html><head><title>レシート ${sale.id}</title><style>body{font-family:'Noto Sans JP',monospace;font-size:12px;width:300px;margin:20px auto}table{width:100%;border-collapse:collapse}td{padding:3px 0}.r{text-align:right}.line{border-top:1px dashed #999;margin:8px 0}h3{text-align:center;margin:0 0 4px}.c{text-align:center;color:#666}</style></head><body>
<h3>${company?.name || "Operai"}</h3><div class="c">${sale.date} ${sale.ts.split(" ")[1] || ""}</div><div class="c">No. ${sale.id}</div><div class="line"></div>
<table>${rows}</table><div class="line"></div>
<table><tr><td>小計</td><td class="r">¥${fmt(sale.sub)}</td></tr><tr><td>消費税(10%)</td><td class="r">¥${fmt(sale.tax)}</td></tr><tr><td><b>合計</b></td><td class="r"><b>¥${fmt(sale.total)}</b></td></tr></table><div class="line"></div>
<table><tr><td>${methodLabel(sale.method)}</td><td class="r">¥${fmt(sale.received)}</td></tr>${sale.method === "cash" ? `<tr><td>お釣り</td><td class="r">¥${fmt(sale.change)}</td></tr>` : ""}</table>
<div class="line"></div><div class="c">ご利用ありがとうございました</div></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 200);
  };
  return (
    <Modal title="会計完了" onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, background: "var(--success-bg)", borderRadius: 8, color: "var(--success)", fontSize: 13, marginBottom: 16 }}>
        <IcChk /> 売上仕訳・在庫引落を自動処理しました
      </div>
      <div style={{ border: "1px dashed var(--border)", borderRadius: 10, padding: 16, fontSize: 13, fontFamily: "monospace, 'Noto Sans JP'" }}>
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{company?.name || "Operai"}</div>
        <div style={{ textAlign: "center", color: "var(--text-tertiary)", fontSize: 11, marginBottom: 10 }}>{sale.date} {sale.ts.split(" ")[1]} / No. {sale.id}</div>
        {sale.items.map((i, k) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
            <span>{i.name} <span style={{ color: "var(--text-tertiary)" }}>×{i.qty}</span></span>
            <span>{fmtY(i.pr * i.qty)}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px dashed var(--border)", margin: "8px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>小計</span><span>{fmtY(sale.sub)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>消費税(10%)</span><span>{fmtY(sale.tax)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, marginTop: 4 }}><span>合計</span><span>{fmtY(sale.total)}</span></div>
        <div style={{ borderTop: "1px dashed var(--border)", margin: "8px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>{methodLabel(sale.method)}</span><span>{fmtY(sale.received)}</span></div>
        {sale.method === "cash" && <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: P }}><span>お釣り</span><span>{fmtY(sale.change)}</span></div>}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
        <Btn onClick={printReceipt}>レシート印刷</Btn>
        <Btn variant="primary" onClick={onClose}>次の会計へ</Btn>
      </div>
    </Modal>
  );
}

// ---------- メイン ----------
export function POSView({ data, setData, posCheckout, posRefund }) {
  const [v, setV] = useState("reg");
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [method, setMethod] = useState("cash");
  const [received, setReceived] = useState("");
  const [cid, setCid] = useState("");
  const [lastSale, setLastSale] = useState(null);
  const [histFilter, setHistFilter] = useState("today");
  const [closeDate, setCloseDate] = useState(today());
  const [prepCash, setPrepCash] = useState("30000");
  const [countedCash, setCountedCash] = useState("");
  const [closedDates, setClosedDates] = useState([]);
  const [confirmRefund, setConfirmRefund] = useState(null);

  const sales = data.pos || [];
  const cats = useMemo(() => ["all", ...Array.from(new Set(data.prods.map(p => p.cat).filter(Boolean)))], [data.prods]);
  const prods = data.prods.filter(p => (cat === "all" || p.cat === cat) && (!search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || "").toLowerCase().includes(search.toLowerCase())));

  const sub = cart.reduce((s, i) => s + i.pr * i.qty, 0);
  const tax = Math.round(sub * TAX_RATE);
  const total = sub + tax;
  const recNum = Number(received) || 0;
  const change = method === "cash" ? Math.max(0, recNum - total) : 0;
  const canPay = cart.length > 0 && (method !== "cash" || recNum >= total);

  const addToCart = (p) => {
    setCart(prev => {
      const ex = prev.find(i => i.pid === p.id);
      const cur = ex ? ex.qty : 0;
      if (cur + 1 > p.stk) return prev;
      return ex ? prev.map(i => i.pid === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { pid: p.id, name: p.name, pr: p.price, qty: 1 }];
    });
  };
  const chgQty = (pid, d) => setCart(prev => prev.map(i => {
    if (i.pid !== pid) return i;
    const p = data.prods.find(x => x.id === pid);
    const q = Math.min(p ? p.stk : 999, Math.max(0, i.qty + d));
    return { ...i, qty: q };
  }).filter(i => i.qty > 0));

  const checkout = () => {
    if (!canPay) return;
    const sale = { items: cart, sub, tax, total, method, received: method === "cash" ? recNum : total, change, cid: cid || null };
    const id = posCheckout(sale);
    const now = new Date();
    setLastSale({ ...sale, id, date: today(), ts: now.toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) });
    setCart([]); setReceived(""); setCid("");
  };

  // ---- 集計 ----
  const todaySales = sales.filter(s => s.date === today() && s.st !== "refunded");
  const todayTotal = todaySales.reduce((s, x) => s + x.total, 0);
  const todayCash = todaySales.filter(s => s.method === "cash").reduce((s, x) => s + x.total, 0);
  const unsettled = sales.filter(s => !s.settled && s.st !== "refunded").reduce((s, x) => s + x.total, 0);

  const histSales = [...sales].reverse().filter(s => histFilter === "all" || s.date === today());

  // ---- レジ締め ----
  const closeSales = sales.filter(s => s.date === closeDate);
  const byMethod = PAY_METHODS.map(m => ({ ...m, cnt: closeSales.filter(s => s.method === m.id && s.st !== "refunded").length, amt: closeSales.filter(s => s.method === m.id && s.st !== "refunded").reduce((a, s) => a + s.total, 0) }));
  const refundAmt = closeSales.filter(s => s.st === "refunded").reduce((a, s) => a + s.total, 0);
  const cashRefund = closeSales.filter(s => s.st === "refunded" && s.method === "cash").reduce((a, s) => a + s.total, 0);
  const expectedCash = (Number(prepCash) || 0) + (byMethod[0].amt) - cashRefund;
  const diff = countedCash === "" ? null : (Number(countedCash) || 0) - expectedCash;
  const isClosed = closedDates.includes(closeDate);

  const closeRegister = () => {
    if (diff === null) return;
    const ts = new Date().toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    const deposit = Math.max(0, (Number(countedCash) || 0) - (Number(prepCash) || 0));
    setData(prev => ({
      ...prev,
      jrnl: [...prev.jrnl,
        ...(diff !== 0 ? [{ id: uid("j"), date: closeDate, desc: "レジ現金過不足", dr: { acc: diff < 0 ? "雑損失" : "現金", amt: Math.abs(diff) }, cr: { acc: diff < 0 ? "現金" : "雑収入", amt: Math.abs(diff) }, auto: true, ref: "close" }] : []),
        ...(deposit > 0 ? [{ id: uid("j"), date: closeDate, desc: "売上金 銀行預入", dr: { acc: "普通預金", amt: deposit }, cr: { acc: "現金", amt: deposit }, auto: true, ref: "close" }] : []),
      ],
      alog: [...prev.alog, { id: uid("a"), ts, trig: "レジ締め", act: "日次精算・預入仕訳", det: closeDate + " 売上" + fmtY(closeSales.filter(s => s.st !== "refunded").reduce((a, s) => a + s.total, 0)) + (diff !== 0 ? " 過不足" + fmtY(diff) : " 差異なし") }],
      notifs: [...prev.notifs, { id: uid("n"), msg: closeDate + " レジ締め完了" + (diff !== 0 ? "（過不足 " + fmtY(diff) + "）" : ""), type: diff !== 0 ? "warning" : "success", read: false, date: today() }],
    }));
    setClosedDates(prev => [...prev, closeDate]);
  };

  const inp = { ...inputStyle };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>POSレジ</h2>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>店頭販売の会計・決済から仕訳・在庫・債権管理まで自動連携</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant={v === "reg" ? "primary" : "default"} onClick={() => setV("reg")}>レジ</Btn>
          <Btn variant={v === "hist" ? "primary" : "default"} onClick={() => setV("hist")}>売上履歴</Btn>
          <Btn variant={v === "close" ? "primary" : "default"} onClick={() => setV("close")}>レジ締め</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        <KPI label="本日売上" value={fmtY(todayTotal)} sub={todaySales.length + "件"} icon={<IcRcpt />} color={P} />
        <KPI label="本日現金売上" value={fmtY(todayCash)} icon={<IcChk />} color="#0F6E56" />
        <KPI label="決済代行 入金待ち" value={fmtY(unsettled)} sub="カード・QR・電子マネー" icon={<IcClk />} color="#BA7517" />
        <KPI label="客単価（本日）" value={todaySales.length ? fmtY(Math.round(todayTotal / todaySales.length)) : "¥0"} icon={<IcCart />} color={A} />
      </div>

      {/* ===== レジ ===== */}
      {v === "reg" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 380px", gap: 16, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="商品名・SKUで検索" style={{ ...inp, width: 240 }} />
              {cats.map(c => <Btn key={c} size="sm" variant={cat === c ? "primary" : "default"} onClick={() => setCat(c)}>{c === "all" ? "すべて" : c}</Btn>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
              {prods.map(p => {
                const inCart = cart.find(i => i.pid === p.id);
                const out = p.stk <= 0 || (inCart && inCart.qty >= p.stk);
                return (
                  <div key={p.id} onClick={() => !out && addToCart(p)}
                    style={{ background: "var(--bg-primary)", border: "1px solid " + (inCart ? P : "var(--border-light)"), borderRadius: 10, padding: 12, cursor: out ? "not-allowed" : "pointer", opacity: out ? 0.45 : 1, transition: "all 0.15s", position: "relative", boxShadow: inCart ? `0 0 0 2px ${P}22` : "none" }}
                    onMouseEnter={e => { if (!out) e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}>
                    {inCart && <div style={{ position: "absolute", top: 8, right: 8, background: P, color: "#fff", borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "1px 7px" }}>{inCart.qty}</div>}
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>{p.cat}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, minHeight: 36, lineHeight: 1.35 }}>{p.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: P }}>{fmtY(p.price)}</span>
                      <span style={{ fontSize: 11, color: p.stk <= p.min ? "#A32D2D" : "var(--text-tertiary)" }}>在庫{p.stk}</span>
                    </div>
                  </div>
                );
              })}
              {prods.length === 0 && <div style={{ gridColumn: "1/-1", padding: 30, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>該当する商品がありません</div>}
            </div>
          </div>

          {/* カート */}
          <Card style={{ position: "sticky", top: 0, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><IcCart /> カート <span style={{ color: "var(--text-tertiary)", fontWeight: 400, fontSize: 12 }}>{cart.reduce((s, i) => s + i.qty, 0)}点</span></span>
              {cart.length > 0 && <Btn size="sm" variant="ghost" onClick={() => setCart([])}>クリア</Btn>}
            </div>
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {cart.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>商品をタップして追加</div>}
              {cart.map(i => (
                <div key={i.pid} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{i.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{fmtY(i.pr)} × {i.qty}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button onClick={() => chgQty(i.pid, -1)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid var(--border-light)", background: "var(--bg-secondary)", cursor: "pointer", fontSize: 14 }}>−</button>
                    <span style={{ width: 24, textAlign: "center", fontWeight: 600 }}>{i.qty}</span>
                    <button onClick={() => chgQty(i.pid, 1)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid var(--border-light)", background: "var(--bg-secondary)", cursor: "pointer", fontSize: 14 }}>+</button>
                  </div>
                  <span style={{ width: 80, textAlign: "right", fontWeight: 600 }}>{fmtY(i.pr * i.qty)}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: 16, background: "var(--bg-secondary)", fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: "var(--text-secondary)" }}>小計</span><span>{fmtY(sub)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: "var(--text-secondary)" }}>消費税 10%</span><span>{fmtY(tax)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 700, color: P, borderTop: "1px solid var(--border)", paddingTop: 8 }}><span>合計</span><span>{fmtY(total)}</span></div>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>支払方法</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {PAY_METHODS.map(m => (
                    <div key={m.id} onClick={() => setMethod(m.id)} style={{ padding: "9px 8px", borderRadius: 8, textAlign: "center", fontSize: 13, fontWeight: method === m.id ? 600 : 400, cursor: "pointer", border: "1px solid " + (method === m.id ? P : "var(--border-light)"), background: method === m.id ? P + "12" : "var(--bg-primary)", color: method === m.id ? P : "var(--text-primary)" }}>{m.label}</div>
                  ))}
                </div>
              </div>
              {method === "cash" && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>お預かり</div>
                  <input type="number" value={received} onChange={e => setReceived(e.target.value)} placeholder="0" style={{ ...inp, fontSize: 18, fontWeight: 600, textAlign: "right" }} />
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    <Btn size="sm" onClick={() => setReceived(String(total))}>ちょうど</Btn>
                    {[1000, 5000, 10000].map(n => <Btn key={n} size="sm" onClick={() => setReceived(String((Number(received) || 0) + n))}>+{fmt(n)}</Btn>)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 14, fontWeight: 600, color: recNum >= total ? "#0F6E56" : "#A32D2D" }}>
                    <span>お釣り</span><span>{recNum >= total ? fmtY(change) : "不足 " + fmtY(total - recNum)}</span>
                  </div>
                </div>
              )}
              {method !== "cash" && (
                <div style={{ fontSize: 12, color: "var(--text-secondary)", padding: 10, background: A + "0c", borderRadius: 8, display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span style={{ color: A, flexShrink: 0 }}><IcZap /></span>
                  <span>決済代行会社からの入金待ちとして「未収入金」に自動登録。入金確認と手数料計上は債権債務管理から一括処理できます。</span>
                </div>
              )}
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>顧客（任意）</div>
                <select value={cid} onChange={e => setCid(e.target.value)} style={inp}>
                  <option value="">一般客</option>
                  {data.custs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <Btn variant="primary" size="lg" disabled={!canPay} onClick={checkout} style={{ justifyContent: "center", fontSize: 15 }}>{fmtY(total)} を会計する</Btn>
            </div>
          </Card>
        </div>
      )}

      {lastSale && <Receipt sale={lastSale} company={data.company} onClose={() => setLastSale(null)} />}

      {/* ===== 売上履歴 ===== */}
      {v === "hist" && (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" variant={histFilter === "today" ? "primary" : "default"} onClick={() => setHistFilter("today")}>本日</Btn>
            <Btn size="sm" variant={histFilter === "all" ? "primary" : "default"} onClick={() => setHistFilter("all")}>すべて</Btn>
          </div>
          <Tbl cols={[
            { label: "No", render: r => <span style={{ fontWeight: 500 }}>{r.id}</span> },
            { label: "日時", render: r => r.date + " " + (r.ts.split(" ")[1] || "") },
            { label: "商品", render: r => <span style={{ fontSize: 12 }}>{r.items.map(i => i.name + "×" + i.qty).join(", ")}</span> },
            { label: "顧客", render: r => { const c = data.custs.find(c => c.id === r.cid); return c ? c.name : <span style={{ color: "var(--text-tertiary)" }}>一般客</span>; } },
            { label: "支払", render: r => <Badge variant={r.method === "cash" ? "success" : "purple"}>{methodLabel(r.method)}</Badge> },
            { label: "合計", render: r => <span style={{ fontWeight: 600 }}>{fmtY(r.total)}</span> },
            { label: "状態", render: r => r.st === "refunded" ? <Badge variant="danger">返品済</Badge> : r.method === "cash" ? <Badge variant="success">完了</Badge> : r.settled ? <Badge variant="success">入金済</Badge> : <Badge variant="warning">入金待ち</Badge> },
            { label: "操作", render: r => r.st !== "refunded" ? <Btn size="sm" onClick={() => setConfirmRefund(r)}>返品</Btn> : <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>—</span> },
          ]} data={histSales} />
          {confirmRefund && (
            <Modal title="返品処理" onClose={() => setConfirmRefund(null)}>
              <div style={{ fontSize: 13, marginBottom: 12 }}>売上 <b>{confirmRefund.id}</b>（{fmtY(confirmRefund.total)}）を返品します。在庫を戻し、返品仕訳を自動生成します。</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>{confirmRefund.items.map(i => i.name + "×" + i.qty).join(", ")}</div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Btn onClick={() => setConfirmRefund(null)}>キャンセル</Btn>
                <Btn variant="danger" onClick={() => { posRefund(confirmRefund.id); setConfirmRefund(null); }}>返品を確定</Btn>
              </div>
            </Modal>
          )}
        </>
      )}

      {/* ===== レジ締め ===== */}
      {v === "close" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>日次売上サマリー</span>
              <input type="date" value={closeDate} onChange={e => { setCloseDate(e.target.value); setCountedCash(""); }} style={{ ...inp, width: 160 }} />
            </div>
            {byMethod.map(m => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
                <span>{m.label} <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>{m.cnt}件</span></span>
                <span style={{ fontWeight: 600 }}>{fmtY(m.amt)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border-light)", fontSize: 13, color: "#A32D2D" }}>
              <span>返品</span><span style={{ fontWeight: 600 }}>−{fmtY(refundAmt)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", fontSize: 15, fontWeight: 700, color: P }}>
              <span>売上合計</span><span>{fmtY(byMethod.reduce((a, m) => a + m.amt, 0))}</span>
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>現金実査・締め処理</div>
            {isClosed ? (
              <div style={{ padding: 14, background: "var(--success-bg)", borderRadius: 8, color: "var(--success)", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}><IcChk /> {closeDate} は締め処理済みです</div>
            ) : (
              <>
                <Fld label="釣銭準備金"><input type="number" value={prepCash} onChange={e => setPrepCash(e.target.value)} style={inp} /></Fld>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: "1px solid var(--border-light)" }}><span>現金売上（返品控除後）</span><span>{fmtY(byMethod[0].amt - cashRefund)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0 14px", fontWeight: 600 }}><span>あるべき現金残高</span><span>{fmtY(expectedCash)}</span></div>
                <Fld label="実査現金額"><input type="number" value={countedCash} onChange={e => setCountedCash(e.target.value)} placeholder="ドロワー内の現金を数えて入力" style={inp} /></Fld>
                {diff !== null && (
                  <div style={{ padding: 12, borderRadius: 8, marginBottom: 14, fontSize: 13, background: diff === 0 ? "var(--success-bg)" : "var(--warning-bg)", color: diff === 0 ? "var(--success)" : "var(--warning)", display: "flex", justifyContent: "space-between" }}>
                    <span>{diff === 0 ? "差異なし" : diff > 0 ? "現金過剰" : "現金不足"}</span><span style={{ fontWeight: 700 }}>{diff === 0 ? "¥0" : (diff > 0 ? "+" : "") + fmtY(diff)}</span>
                  </div>
                )}
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.7 }}>締め処理で自動生成される仕訳:<br />1. 売上金の銀行預入（普通預金/現金）<br />2. 現金過不足がある場合は雑損失・雑収入で計上</div>
                <Btn variant="primary" disabled={diff === null} onClick={closeRegister} style={{ width: "100%", justifyContent: "center" }}>レジ締めを確定</Btn>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
