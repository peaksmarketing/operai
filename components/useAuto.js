'use client';
import { useState, useEffect, useCallback } from 'react';

const today = () => new Date().toISOString().slice(0, 10);
let _id = 200;
const uid = (p) => `${p}-${String(++_id).padStart(3, "0")}`;
const fmt = (n) => new Intl.NumberFormat("ja-JP").format(n);
const fmtY = (n) => "¥" + fmt(n);

export { today, uid, fmt, fmtY };

export function useAuto(data, setData) {
  const [toasts, setToasts] = useState([]);
  const addT = (t) => setToasts(p => [...p, t]);
  const dismissT = (i) => setToasts(p => p.filter((_, x) => x !== i));

  useEffect(() => {
    if (toasts.length > 0) {
      const t = setTimeout(() => setToasts(p => p.slice(1)), 5000);
      return () => clearTimeout(t);
    }
  }, [toasts]);

  const confirmOrder = useCallback((oid) => {
    setData(prev => {
      const ord = prev.ords.find(o => o.id === oid);
      if (!ord || ord.st === "confirmed" || ord.st === "shipped") return prev;
      const cn = (prev.custs.find(c => c.id === ord.cid) || {}).name || "?";
      const tax = Math.round(ord.total * 0.1);
      const invT = ord.total + tax;
      const invId = uid("i");
      const jeId = uid("j");
      const now = new Date().toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

      const np = prev.prods.map(p => {
        const it = ord.items.find(x => x.pid === p.id);
        return it ? { ...p, stk: Math.max(0, p.stk - it.qty) } : p;
      });
      const ai = ord.items.map(it => {
        const p = prev.prods.find(x => x.id === it.pid);
        return (p ? p.name : "") + "×" + it.qty;
      });
      const lowN = np.filter(p => p.stk <= p.min)
        .filter(p => !prev.notifs.some(n => n.msg.includes(p.name) && !n.read))
        .map(p => ({ id: uid("n"), msg: p.name + " 在庫低下（残" + p.stk + "個）", type: "warning", read: false, date: today() }));

      return {
        ...prev,
        ords: prev.ords.map(o => o.id === oid ? { ...o, st: "confirmed" } : o),
        invs: [...prev.invs, { id: invId, oid, cid: ord.cid, date: today(), due: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10), amt: ord.total, tax, total: invT, st: "sent", paid: 0 }],
        jrnl: [...prev.jrnl, { id: jeId, date: today(), desc: cn + " 売上計上", dr: { acc: "売掛金", amt: ord.total }, cr: { acc: "売上高", amt: ord.total }, auto: true, ref: invId }],
        prods: np,
        alog: [...prev.alog,
          { id: uid("a"), ts: now, trig: "受注確定", act: "請求書自動生成", det: cn + " " + fmtY(invT) },
          { id: uid("a"), ts: now, trig: "請求書発行", act: "売上仕訳自動生成", det: "売掛金/売上高 " + fmtY(ord.total) },
          { id: uid("a"), ts: now, trig: "受注確定", act: "在庫自動引当", det: ai.join(", ") + " 出庫" },
        ],
        notifs: [...prev.notifs, ...lowN, { id: uid("n"), msg: cn + " 受注確定→自動処理完了", type: "success", read: false, date: today() }],
      };
    });
    setTimeout(() => addT({ action: "請求書を自動生成", detail: "受注→請求書発行" }), 300);
    setTimeout(() => addT({ action: "売上仕訳を自動生成", detail: "売掛金/売上高" }), 900);
    setTimeout(() => addT({ action: "在庫を自動引当", detail: "出庫処理を実行" }), 1500);
  }, [setData]);

  const registerPay = useCallback((invId, amount) => {
    setData(prev => {
      const inv = prev.invs.find(i => i.id === invId);
      if (!inv) return prev;
      const cn = (prev.custs.find(c => c.id === inv.cid) || {}).name || "?";
      const jeId = uid("j");
      const now = new Date().toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
      const pa = inv.paid + amount;
      return {
        ...prev,
        invs: prev.invs.map(i => i.id === invId ? { ...i, paid: pa, st: pa >= i.total ? "paid" : "partial" } : i),
        jrnl: [...prev.jrnl, { id: jeId, date: today(), desc: cn + " 入金消込", dr: { acc: "普通預金", amt: amount }, cr: { acc: "売掛金", amt: amount }, auto: true, ref: "pay" }],
        alog: [...prev.alog, { id: uid("a"), ts: now, trig: "入金登録", act: "売掛金消込仕訳", det: "普通預金/売掛金 " + fmtY(amount) }],
        notifs: [...prev.notifs, { id: uid("n"), msg: cn + "から" + fmtY(amount) + "入金→消込仕訳自動生成", type: "success", read: false, date: today() }],
      };
    });
    setTimeout(() => addT({ action: "入金消込仕訳を自動生成", detail: "普通預金/売掛金 " + fmtY(amount) }), 300);
  }, [setData]);

  const confirmPayroll = useCallback(() => {
    setData(prev => {
      const ts = prev.emps.reduce((s, e) => s + e.sal, 0);
      const ti = Math.round(ts * 0.15);
      const j1 = uid("j"), j2 = uid("j");
      const now = new Date().toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
      return {
        ...prev,
        jrnl: [...prev.jrnl,
          { id: j1, date: today(), desc: "給与支払", dr: { acc: "給与手当", amt: ts }, cr: { acc: "普通預金", amt: ts }, auto: true, ref: "payroll" },
          { id: j2, date: today(), desc: "社会保険料", dr: { acc: "法定福利費", amt: ti }, cr: { acc: "未払金", amt: ti }, auto: true, ref: "payroll" },
        ],
        alog: [...prev.alog,
          { id: uid("a"), ts: now, trig: "給与確定", act: "給与仕訳自動生成", det: "給与手当/普通預金 " + fmtY(ts) },
          { id: uid("a"), ts: now, trig: "給与確定", act: "社保仕訳自動生成", det: "法定福利費/未払金 " + fmtY(ti) },
        ],
        notifs: [...prev.notifs, { id: uid("n"), msg: "給与確定→仕訳自動生成（計" + fmtY(ts + ti) + "）", type: "success", read: false, date: today() }],
      };
    });
    setTimeout(() => addT({ action: "給与仕訳を自動生成", detail: "給与手当/普通預金" }), 300);
    setTimeout(() => addT({ action: "社保仕訳を自動生成", detail: "法定福利費/未払金" }), 900);
  }, [setData]);

  // ===== POS: 会計処理 =====
  // sale: { items:[{pid,name,qty,pr}], sub, tax, total, method, received, change, cid? }
  const posCheckout = useCallback((sale) => {
    const saleId = uid("s");
    setData(prev => {
      const now = new Date();
      const ts = now.toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
      const methodLabel = { cash: "現金", card: "クレジット", qr: "QR決済", emoney: "電子マネー" }[sale.method] || sale.method;
      // 現金は「現金」、その他は決済代行会社からの入金待ち＝「未収入金」
      const drAcc = sale.method === "cash" ? "現金" : "未収入金";
      const np = prev.prods.map(p => {
        const it = sale.items.find(x => x.pid === p.id);
        return it ? { ...p, stk: Math.max(0, p.stk - it.qty) } : p;
      });
      const lowN = np.filter(p => p.stk <= p.min)
        .filter(p => !prev.notifs.some(n => n.msg.includes(p.name) && !n.read))
        .map(p => ({ id: uid("n"), msg: p.name + " 在庫低下（残" + p.stk + "個）", type: "warning", read: false, date: today() }));
      const rec = { id: saleId, date: today(), ts, items: sale.items, sub: sale.sub, tax: sale.tax, total: sale.total, method: sale.method, received: sale.received || sale.total, change: sale.change || 0, st: "completed", settled: sale.method === "cash", cid: sale.cid || null, staff: sale.staff || "" };
      return {
        ...prev,
        pos: [...(prev.pos || []), rec],
        prods: np,
        jrnl: [...prev.jrnl,
          { id: uid("j"), date: today(), desc: "POS売上 " + methodLabel + " #" + saleId, dr: { acc: drAcc, amt: sale.sub }, cr: { acc: "売上高", amt: sale.sub }, auto: true, ref: saleId },
          ...(sale.tax > 0 ? [{ id: uid("j"), date: today(), desc: "POS売上 消費税 #" + saleId, dr: { acc: drAcc, amt: sale.tax }, cr: { acc: "仮受消費税", amt: sale.tax }, auto: true, ref: saleId }] : []),
        ],
        alog: [...prev.alog,
          { id: uid("a"), ts, trig: "POS会計", act: "売上仕訳自動生成", det: drAcc + "/売上高 " + fmtY(sale.sub) },
          { id: uid("a"), ts, trig: "POS会計", act: "在庫自動引落", det: sale.items.map(i => i.name + "×" + i.qty).join(", ") },
          ...(sale.method !== "cash" ? [{ id: uid("a"), ts, trig: "POS会計", act: "決済代行債権を登録", det: methodLabel + " " + fmtY(sale.total) + " 入金待ち" }] : []),
        ],
        notifs: [...prev.notifs, ...lowN],
      };
    });
    setTimeout(() => addT({ action: "売上仕訳を自動生成", detail: sale.method === "cash" ? "現金/売上高" : "未収入金/売上高" }), 300);
    setTimeout(() => addT({ action: "在庫を自動引落", detail: sale.items.length + "品目を出庫" }), 900);
    return saleId;
  }, [setData]);

  // POS: 返品・返金
  const posRefund = useCallback((saleId) => {
    setData(prev => {
      const s = (prev.pos || []).find(x => x.id === saleId);
      if (!s || s.st === "refunded") return prev;
      const ts = new Date().toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
      const crAcc = s.method === "cash" ? "現金" : s.settled ? "普通預金" : "未収入金";
      return {
        ...prev,
        pos: prev.pos.map(x => x.id === saleId ? { ...x, st: "refunded" } : x),
        prods: prev.prods.map(p => { const it = s.items.find(x => x.pid === p.id); return it ? { ...p, stk: p.stk + it.qty } : p; }),
        jrnl: [...prev.jrnl, { id: uid("j"), date: today(), desc: "POS返品 #" + saleId, dr: { acc: "売上高", amt: s.total }, cr: { acc: crAcc, amt: s.total }, auto: true, ref: saleId }],
        alog: [...prev.alog, { id: uid("a"), ts, trig: "POS返品", act: "返品仕訳・在庫戻し", det: "売上高/" + crAcc + " " + fmtY(s.total) }],
      };
    });
    setTimeout(() => addT({ action: "返品仕訳を自動生成", detail: "在庫を戻しました" }), 300);
  }, [setData]);

  // 決済代行会社からの入金確認（未収入金→普通預金、手数料計上）
  const settlePos = useCallback((saleIds, feeRate = 0.033) => {
    setData(prev => {
      const targets = (prev.pos || []).filter(s => saleIds.includes(s.id) && !s.settled && s.st !== "refunded");
      if (!targets.length) return prev;
      const gross = targets.reduce((s, x) => s + x.total, 0);
      const fee = Math.round(gross * feeRate);
      const ts = new Date().toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
      return {
        ...prev,
        pos: prev.pos.map(s => saleIds.includes(s.id) ? { ...s, settled: true, settledDate: today() } : s),
        jrnl: [...prev.jrnl,
          { id: uid("j"), date: today(), desc: "決済代行入金 " + targets.length + "件", dr: { acc: "普通預金", amt: gross - fee }, cr: { acc: "未収入金", amt: gross - fee }, auto: true, ref: "settle" },
          { id: uid("j"), date: today(), desc: "決済手数料", dr: { acc: "支払手数料", amt: fee }, cr: { acc: "未収入金", amt: fee }, auto: true, ref: "settle" },
        ],
        alog: [...prev.alog, { id: uid("a"), ts, trig: "決済代行入金", act: "未収入金消込・手数料計上", det: fmtY(gross) + "（手数料" + fmtY(fee) + "）" }],
        notifs: [...prev.notifs, { id: uid("n"), msg: "決済代行入金 " + fmtY(gross - fee) + " 消込完了", type: "success", read: false, date: today() }],
      };
    });
    setTimeout(() => addT({ action: "決済代行入金を消込", detail: "普通預金/未収入金 + 支払手数料" }), 300);
  }, [setData]);

  // ===== 買掛金（債務） =====
  const addPayable = useCallback((p) => {
    const id = uid("ap");
    setData(prev => {
      const ts = new Date().toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
      const tax = Math.round(p.amt * 0.1);
      const total = p.amt + tax;
      return {
        ...prev,
        payables: [...(prev.payables || []), { id, supplier: p.supplier, date: p.date || today(), due: p.due, amt: p.amt, tax, total, paid: 0, st: "unpaid", desc: p.desc || "", cat: p.cat || "仕入高" }],
        jrnl: [...prev.jrnl, { id: uid("j"), date: p.date || today(), desc: p.supplier + " " + (p.desc || "仕入計上"), dr: { acc: p.cat || "仕入高", amt: total }, cr: { acc: "買掛金", amt: total }, auto: true, ref: id }],
        alog: [...prev.alog, { id: uid("a"), ts, trig: "仕入計上", act: "買掛金仕訳自動生成", det: (p.cat || "仕入高") + "/買掛金 " + fmtY(total) }],
      };
    });
    setTimeout(() => addT({ action: "買掛金仕訳を自動生成", detail: "仕入高/買掛金" }), 300);
    return id;
  }, [setData]);

  const payPayable = useCallback((id, amount) => {
    setData(prev => {
      const p = (prev.payables || []).find(x => x.id === id);
      if (!p) return prev;
      const pa = p.paid + amount;
      const ts = new Date().toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
      return {
        ...prev,
        payables: prev.payables.map(x => x.id === id ? { ...x, paid: pa, st: pa >= x.total ? "paid" : "partial", paidDate: pa >= x.total ? today() : x.paidDate } : x),
        jrnl: [...prev.jrnl, { id: uid("j"), date: today(), desc: p.supplier + " 支払", dr: { acc: "買掛金", amt: amount }, cr: { acc: "普通預金", amt: amount }, auto: true, ref: id }],
        alog: [...prev.alog, { id: uid("a"), ts, trig: "支払登録", act: "買掛金消込仕訳", det: "買掛金/普通預金 " + fmtY(amount) }],
        notifs: [...prev.notifs, { id: uid("n"), msg: p.supplier + "へ" + fmtY(amount) + "支払→消込仕訳自動生成", type: "success", read: false, date: today() }],
      };
    });
    setTimeout(() => addT({ action: "支払消込仕訳を自動生成", detail: "買掛金/普通預金 " + fmtY(amount) }), 300);
  }, [setData]);

  const deletePayable = useCallback((id) => {
    setData(prev => ({ ...prev, payables: (prev.payables || []).filter(x => x.id !== id) }));
  }, [setData]);

  return { toasts, dismissT, confirmOrder, registerPay, confirmPayroll, posCheckout, posRefund, settlePos, addPayable, payPayable, deletePayable };
}
