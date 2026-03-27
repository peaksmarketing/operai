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

  return { toasts, dismissT, confirmOrder, registerPay, confirmPayroll };
}
