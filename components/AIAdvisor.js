'use client';
import { useState, useRef, useEffect } from 'react';
import { Badge, Card, KPI, Tbl, Btn, PBar, Modal, Fld } from './UI';
import { IcAi, IcZap, IcRcpt, IcCalc, IcBox, IcPpl, IcUsers, IcChk, IcAlrt, IcSnd, IcClk, IcFlow } from './Icons';
import { fmtY, today } from './useAuto';

const P = "#2b6876";
const A = "#534AB7";

/* ─── AI Analysis Engines ─── */
function analyzeSales(data) {
  const monthly = [280, 320, 290, 350, 410, 380, 450, 420, 480, 520, 490];
  const current = data.invs.reduce((s, i) => s + i.amt, 0) / 10000;
  monthly.push(Math.round(current));
  const avg = monthly.reduce((s, v) => s + v, 0) / monthly.length;
  const trend = monthly.slice(-3).reduce((s, v) => s + v, 0) / 3;
  const growth = ((trend - avg) / avg * 100).toFixed(1);
  // Simple linear regression for forecast
  const n = monthly.length;
  const sumX = n * (n - 1) / 2;
  const sumY = monthly.reduce((s, v) => s + v, 0);
  const sumXY = monthly.reduce((s, v, i) => s + i * v, 0);
  const sumX2 = Array.from({ length: n }, (_, i) => i * i).reduce((s, v) => s + v, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const forecast = [
    Math.round(monthly[11] + slope),
    Math.round(monthly[11] + slope * 2),
    Math.round(monthly[11] + slope * 3),
  ];
  return { monthly, avg: Math.round(avg), trend: Math.round(trend), growth, forecast, slope: Math.round(slope) };
}

function analyzeCashflow(data) {
  const totalInv = data.invs.reduce((s, i) => s + i.total, 0);
  const totalPaid = data.invs.reduce((s, i) => s + i.paid, 0);
  const ar = totalInv - totalPaid;
  const expenses = data.jrnl.filter(j => !["売掛金", "普通預金"].includes(j.dr.acc)).reduce((s, j) => s + j.dr.amt, 0);
  const payroll = data.emps.reduce((s, e) => s + e.sal, 0);
  const cash = 500000 + 8500000;
  const monthlyBurn = expenses + payroll;
  const runway = monthlyBurn > 0 ? Math.round(cash / monthlyBurn * 10) / 10 : 99;
  return { cash, ar, expenses, payroll, monthlyBurn, runway, collectionRate: totalInv ? Math.round(totalPaid / totalInv * 100) : 0 };
}

function analyzeInventory(data) {
  const lowStock = data.prods.filter(p => p.stk <= p.min);
  const totalValue = data.prods.reduce((s, p) => s + p.cost * p.stk, 0);
  const avgTurnover = 4.2; // simulated
  const recommendations = data.prods.map(p => {
    const salesVelocity = Math.random() * 10 + 2; // simulated
    const daysOfStock = p.stk / (salesVelocity / 30);
    const optimalStock = Math.round(salesVelocity * 1.5);
    return {
      ...p,
      salesVelocity: Math.round(salesVelocity * 10) / 10,
      daysOfStock: Math.round(daysOfStock),
      optimalStock,
      action: p.stk <= p.min ? "urgent" : p.stk > optimalStock * 2 ? "overstock" : "ok",
    };
  });
  return { lowStock, totalValue, avgTurnover, recommendations };
}

function analyzeJournals(data) {
  const anomalies = [];
  const avgAmt = data.jrnl.reduce((s, j) => s + j.dr.amt, 0) / data.jrnl.length;
  data.jrnl.forEach(j => {
    if (j.dr.amt > avgAmt * 3) {
      anomalies.push({ ...j, reason: "通常の3倍以上の金額", severity: "warning" });
    }
  });
  // Check for unusual account combinations
  const accPairs = {};
  data.jrnl.forEach(j => {
    const key = `${j.dr.acc}→${j.cr.acc}`;
    accPairs[key] = (accPairs[key] || 0) + 1;
  });
  data.jrnl.forEach(j => {
    const key = `${j.dr.acc}→${j.cr.acc}`;
    if (accPairs[key] === 1 && !j.auto) {
      anomalies.push({ ...j, reason: "初めての勘定科目組み合わせ", severity: "info" });
    }
  });
  return { anomalies, avgAmt: Math.round(avgAmt), totalEntries: data.jrnl.length, autoRate: Math.round(data.jrnl.filter(j => j.auto).length / data.jrnl.length * 100) };
}

function analyzeCollection(data) {
  const results = data.invs.filter(i => i.st !== "paid").map(inv => {
    const cust = data.custs.find(c => c.id === inv.cid);
    const custInvs = data.invs.filter(i => i.cid === inv.cid);
    const paidInvs = custInvs.filter(i => i.st === "paid");
    const payRate = custInvs.length > 0 ? Math.round(paidInvs.length / custInvs.length * 100) : 50;
    const daysOverdue = Math.max(0, Math.floor((new Date() - new Date(inv.due)) / 86400000));
    const riskScore = Math.min(100, Math.round(daysOverdue * 1.5 + (100 - payRate) * 0.5 + (100 - (cust?.score || 50)) * 0.3));
    return {
      inv, cust, payRate, daysOverdue, riskScore,
      risk: riskScore >= 60 ? "high" : riskScore >= 30 ? "medium" : "low",
      predictedDays: Math.round(Math.max(3, 30 - payRate * 0.2 + daysOverdue * 0.3)),
    };
  });
  return results;
}

/* ─── AI Chat Messages ─── */
const AI_RESPONSES = {
  "売上": (data) => {
    const s = analyzeSales(data);
    return `📊 **売上分析レポート**\n\n過去12ヶ月の平均月間売上は${s.avg}万円、直近3ヶ月のトレンドは${s.trend}万円で前年比${s.growth}%の成長です。\n\nAI予測では来月${s.forecast[0]}万円、2ヶ月後${s.forecast[1]}万円、3ヶ月後${s.forecast[2]}万円と見込んでいます（月次成長率 +${s.slope}万円）。\n\n💡 推奨アクション:\n• 成長トレンドを維持するため、パイプライン案件の早期クロージングを推進\n• 上位顧客への追加提案でLTV向上を図る`;
  },
  "キャッシュ": (data) => {
    const cf = analyzeCashflow(data);
    return `💰 **キャッシュフロー分析**\n\n現預金: ${fmtY(cf.cash)}\n売掛金残高: ${fmtY(cf.ar)}\n月次支出: ${fmtY(cf.monthlyBurn)}\n\n現在のバーンレートで約${cf.runway}ヶ月分の運転資金があります。回収率は${cf.collectionRate}%です。\n\n💡 推奨アクション:\n• 売掛金の早期回収を推進（特に期限超過の請求書）\n• 固定費の見直し（人件費率の最適化）`;
  },
  "在庫": (data) => {
    const inv = analyzeInventory(data);
    return `📦 **在庫分析レポート**\n\n総在庫原価: ${fmtY(inv.totalValue)}\n要発注アラート: ${inv.lowStock.length}件\n在庫回転率: ${inv.avgTurnover}回（業界平均: 3.5回）\n\n⚠ 要注意商品:\n${inv.lowStock.map(p => `• ${p.name}: 残${p.stk}個（発注点${p.min}個）`).join('\n')}\n\n💡 推奨アクション:\n• アラート商品の即時発注\n• 過剰在庫商品の販促キャンペーン検討`;
  },
  "仕訳": (data) => {
    const j = analyzeJournals(data);
    return `📋 **仕訳異常検知レポート**\n\n総仕訳件数: ${j.totalEntries}件\n自動仕訳率: ${j.autoRate}%\n平均取引額: ${fmtY(j.avgAmt)}\n\n${j.anomalies.length > 0 ? `⚠ ${j.anomalies.length}件の注意項目を検出:\n${j.anomalies.map(a => `• ${a.date} ${a.desc}: ${a.reason}`).join('\n')}` : '✅ 異常な仕訳パターンは検出されませんでした。'}\n\n💡 推奨アクション:\n• 自動仕訳率のさらなる向上（現在${j.autoRate}% → 目標90%）\n• 手動仕訳のルール化で自動分類精度を改善`;
  },
  "経営": (data) => {
    const s = analyzeSales(data);
    const cf = analyzeCashflow(data);
    const inv = analyzeInventory(data);
    const pipeline = data.deals.filter(d => d.stage !== "won" && d.stage !== "lost");
    const pipeVal = pipeline.reduce((a, d) => a + d.val, 0);
    return `🏢 **AI経営診断レポート**\n\n【総合評価】B+ (良好)\n\n📊 売上: 月平均${s.avg}万円、成長率${s.growth}%\n💰 資金: 運転資金${cf.runway}ヶ月分、回収率${cf.collectionRate}%\n📦 在庫: ${inv.lowStock.length}件の要発注あり\n🤝 営業: パイプライン${fmtY(pipeVal)}（${pipeline.length}件）\n\n【強み】\n• 売上は安定した成長トレンド\n• 自動連携による業務効率化が進行中\n\n【改善点】\n• 売掛金の回収サイクル短縮\n• 在庫管理の精度向上（低在庫アラート対応）\n• パイプラインの成約率向上\n\n💡 今月の推奨アクション:\n1. 期限超過の請求書フォローアップ\n2. 上位案件3件の早期クロージング\n3. 低在庫商品の緊急発注`;
  },
  "回収": (data) => {
    const results = analyzeCollection(data);
    if (results.length === 0) return "✅ すべての請求が回収済みです。未回収の請求書はありません。";
    return `📊 **入金予測・回収リスク分析**\n\n未回収請求: ${results.length}件\n\n${results.map(r => `• ${r.inv.id} (${r.cust?.name || '-'}): リスクスコア ${r.riskScore}点 [${r.risk === 'high' ? '🔴高' : r.risk === 'medium' ? '🟡中' : '🟢低'}]\n  未回収額: ${fmtY(r.inv.total - r.inv.paid)} / 予測入金: ${r.predictedDays}日後`).join('\n')}\n\n💡 推奨アクション:\n• 高リスク案件は即時電話フォロー\n• 中リスク案件はリマインドメール送信`;
  },
};

function getAIResponse(input, data) {
  const lower = input.toLowerCase();
  if (lower.includes("売上") || lower.includes("revenue") || lower.includes("うりあげ")) return AI_RESPONSES["売上"](data);
  if (lower.includes("キャッシュ") || lower.includes("資金") || lower.includes("CF") || lower.includes("cf")) return AI_RESPONSES["キャッシュ"](data);
  if (lower.includes("在庫") || lower.includes("inventory")) return AI_RESPONSES["在庫"](data);
  if (lower.includes("仕訳") || lower.includes("異常") || lower.includes("会計")) return AI_RESPONSES["仕訳"](data);
  if (lower.includes("経営") || lower.includes("診断") || lower.includes("総合")) return AI_RESPONSES["経営"](data);
  if (lower.includes("回収") || lower.includes("入金") || lower.includes("リスク")) return AI_RESPONSES["回収"](data);
  return AI_RESPONSES["経営"](data);
}

/* ─── AI Chat Component ─── */
function AIChat({ data }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Operai AI経営参謀です。経営に関するご質問にお答えします。\n\n例えば以下のようなことを聞いてください:\n• 「売上の分析をして」\n• 「キャッシュフローの状況は？」\n• 「在庫の状態を教えて」\n• 「仕訳に異常はない？」\n• 「経営診断して」\n• 「回収リスクを分析して」" }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const chatEnd = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const response = getAIResponse(userMsg, data);
      setMessages(prev => [...prev, { role: "ai", text: response }]);
      setTyping(false);
    }, 800 + Math.random() * 1200);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 260px)", minHeight: 400 }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 10, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "ai" && (
              <div style={{ width: 32, height: 32, borderRadius: 10, background: A + "14", display: "flex", alignItems: "center", justifyContent: "center", color: A, flexShrink: 0 }}>
                <IcAi />
              </div>
            )}
            <div style={{
              maxWidth: "75%", padding: "12px 16px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: m.role === "user" ? P : "var(--bg-secondary)",
              color: m.role === "user" ? "#fff" : "inherit",
              fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap",
            }}>
              {m.text.split("**").map((part, j) => j % 2 === 1 ? <b key={j}>{part}</b> : part)}
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: A + "14", display: "flex", alignItems: "center", justifyContent: "center", color: A, flexShrink: 0 }}><IcAi /></div>
            <div style={{ padding: "12px 16px", borderRadius: "16px 16px 16px 4px", background: "var(--bg-secondary)", fontSize: 13 }}>
              <span style={{ display: "inline-flex", gap: 4 }}>
                {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: 3, background: A, opacity: 0.4, animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }} />)}
              </span>
            </div>
          </div>
        )}
        <div ref={chatEnd} />
      </div>
      <div style={{ display: "flex", gap: 8, padding: "12px 0", borderTop: "1px solid var(--border-light)" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="経営についてAIに質問する..."
          style={{ flex: 1, padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg-secondary)", fontSize: 13, outline: "none" }}
        />
        <Btn variant="primary" onClick={send} disabled={!input.trim() || typing}><IcSnd /></Btn>
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
    </div>
  );
}

/* ─── Main AI Advisor Module ─── */
export default function AIAdvisor({ data }) {
  const [v, setV] = useState("chat");

  const sales = analyzeSales(data);
  const cf = analyzeCashflow(data);
  const inv = analyzeInventory(data);
  const jrnl = analyzeJournals(data);
  const collection = analyzeCollection(data);
  const pipeline = data.deals.filter(d => d.stage !== "won" && d.stage !== "lost");
  const pipeVal = pipeline.reduce((a, d) => a + d.val, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: A }}><IcAi /></span> AI経営参謀
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>AIが経営データを分析し、意思決定を支援します</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["chat", "AIチャット"], ["forecast", "売上・CF予測"], ["anomaly", "異常検知"], ["demand", "需要予測"], ["risk", "回収リスク"]].map(([k, l]) => (
            <Btn key={k} variant={v === k ? "primary" : "default"} size="md" onClick={() => setV(k)}>{l}</Btn>
          ))}
        </div>
      </div>

      {/* Quick AI Insights */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        <KPI label="AI総合評価" value="B+" sub="良好" icon={<IcAi />} color={A} />
        <KPI label="売上成長率" value={sales.growth + "%"} sub="前年比" icon={<IcRcpt />} color={parseFloat(sales.growth) >= 0 ? "#0F6E56" : "#A32D2D"} />
        <KPI label="運転資金" value={cf.runway + "ヶ月"} sub="現バーンレート" icon={<IcCalc />} color={cf.runway >= 6 ? "#0F6E56" : cf.runway >= 3 ? "#BA7517" : "#A32D2D"} />
        <KPI label="異常検知" value={jrnl.anomalies.length + "件"} sub="要確認" icon={<IcAlrt />} color={jrnl.anomalies.length > 0 ? "#BA7517" : "#0F6E56"} />
      </div>

      {/* AI Chat */}
      {v === "chat" && <AIChat data={data} />}

      {/* Sales & CF Forecast */}
      {v === "forecast" && (
        <>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: A }}><IcAi /></span> AI売上予測</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>線形回帰モデルによる3ヶ月予測</div>
              </div>
              <Badge variant="purple">AI分析</Badge>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120, marginBottom: 8 }}>
              {sales.monthly.map((v, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: "var(--text-tertiary)" }}>{v}</div>
                  <div style={{ width: "80%", height: Math.max(4, (v / 600) * 100), background: P, borderRadius: "3px 3px 0 0", opacity: 0.2 + (v / 600) * 0.8 }} />
                  <div style={{ fontSize: 9, color: "var(--text-tertiary)" }}>{["4", "5", "6", "7", "8", "9", "10", "11", "12", "1", "2", "3"][i]}月</div>
                </div>
              ))}
              <div style={{ width: 1, height: 120, background: A, opacity: 0.3 }} />
              {sales.forecast.map((v, i) => (
                <div key={"f" + i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: A }}>{v}</div>
                  <div style={{ width: "80%", height: Math.max(4, (v / 600) * 100), background: A, borderRadius: "3px 3px 0 0", border: "1px dashed " + A, opacity: 0.6 }} />
                  <div style={{ fontSize: 9, color: A, fontWeight: 500 }}>{["4", "5", "6"][i]}月</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-tertiary)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, background: P, borderRadius: 2 }} /> 実績</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, background: A, borderRadius: 2, border: "1px dashed " + A }} /> AI予測</span>
              <span style={{ marginLeft: "auto" }}>月次成長率: +{sales.slope}万円/月</span>
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: A }}><IcAi /></span> AIキャッシュフロー予測</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              {[
                { l: "現預金", v: cf.cash, color: "#0F6E56" },
                { l: "売掛金", v: cf.ar, color: "#BA7517" },
                { l: "月次支出", v: cf.monthlyBurn, color: "#A32D2D" },
                { l: "ランウェイ", v: cf.runway + "ヶ月", isText: true, color: cf.runway >= 6 ? "#0F6E56" : "#A32D2D" },
              ].map(r => (
                <div key={r.l} style={{ textAlign: "center", padding: 16, borderRadius: 10, background: r.color + "08" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: r.color }}>{r.isText ? r.v : fmtY(r.v)}</div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>{r.l}</div>
                </div>
              ))}
            </div>
            <Card style={{ marginTop: 12, borderLeft: "3px solid " + A, background: A + "06" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: A, display: "flex", alignItems: "center", gap: 6 }}><IcAi /> AIの推奨</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.8 }}>
                回収率{cf.collectionRate}%は改善の余地があります。期限超過の請求書に対する早期フォローアップで、キャッシュポジションを約{fmtY(cf.ar)}改善できる可能性があります。
              </div>
            </Card>
          </Card>
        </>
      )}

      {/* Anomaly Detection */}
      {v === "anomaly" && (
        <>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: A }}><IcAi /></span> AI仕訳異常検知</div>
              <Badge variant={jrnl.anomalies.length > 0 ? "warning" : "success"}>{jrnl.anomalies.length}件検出</Badge>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ textAlign: "center", padding: 12, borderRadius: 8, background: "var(--bg-secondary)" }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{jrnl.totalEntries}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>総仕訳件数</div>
              </div>
              <div style={{ textAlign: "center", padding: 12, borderRadius: 8, background: "var(--bg-secondary)" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0F6E56" }}>{jrnl.autoRate}%</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>自動仕訳率</div>
              </div>
              <div style={{ textAlign: "center", padding: 12, borderRadius: 8, background: "var(--bg-secondary)" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#BA7517" }}>{fmtY(jrnl.avgAmt)}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>平均取引額</div>
              </div>
            </div>
            {jrnl.anomalies.length > 0 ? (
              <Tbl cols={[
                { label: "日付", key: "date" },
                { label: "摘要", render: r => <span style={{ fontWeight: 500 }}>{r.desc}</span> },
                { label: "金額", render: r => <span style={{ fontWeight: 600 }}>{fmtY(r.dr.amt)}</span> },
                { label: "検知理由", render: r => <span style={{ fontSize: 12 }}>{r.reason}</span> },
                { label: "重要度", render: r => <Badge variant={r.severity === "warning" ? "warning" : "info"}>{r.severity === "warning" ? "注意" : "情報"}</Badge> },
              ]} data={jrnl.anomalies} />
            ) : (
              <div style={{ padding: 24, textAlign: "center", color: "#0F6E56", fontSize: 14, fontWeight: 500 }}>✓ 異常な仕訳パターンは検出されませんでした</div>
            )}
          </Card>
          <Card style={{ borderLeft: "3px solid " + A, background: A + "06" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: A, display: "flex", alignItems: "center", gap: 6 }}><IcAi /> AIの推奨</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.8 }}>
              自動仕訳率{jrnl.autoRate}%を90%以上に引き上げることで、手動入力によるエラーリスクを大幅に削減できます。頻繁に発生する手動仕訳パターンをルール化することを推奨します。
            </div>
          </Card>
        </>
      )}

      {/* Demand Forecast */}
      {v === "demand" && (
        <>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: A }}><IcAi /></span> AI在庫需要予測</div>
              <Badge variant="purple">AI分析</Badge>
            </div>
            <Tbl cols={[
              { label: "商品", render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
              { label: "現在庫", render: r => <span style={{ fontWeight: 600, color: r.stk <= r.min ? "#A32D2D" : "inherit" }}>{r.stk}</span> },
              { label: "販売速度", render: r => <span style={{ fontSize: 12 }}>{r.salesVelocity}個/月</span> },
              { label: "在庫日数", render: r => <span style={{ color: r.daysOfStock <= 14 ? "#A32D2D" : r.daysOfStock <= 30 ? "#BA7517" : "#0F6E56" }}>{r.daysOfStock}日</span> },
              { label: "AI推奨在庫", render: r => <span style={{ fontWeight: 500, color: A }}>{r.optimalStock}個</span> },
              { label: "AI判定", render: r => <Badge variant={r.action === "urgent" ? "danger" : r.action === "overstock" ? "warning" : "success"}>{r.action === "urgent" ? "緊急発注" : r.action === "overstock" ? "過剰在庫" : "適正"}</Badge> },
            ]} data={inv.recommendations} />
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Card style={{ borderLeft: "3px solid #A32D2D" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#A32D2D", marginBottom: 8 }}>緊急発注推奨</div>
              {inv.recommendations.filter(r => r.action === "urgent").map(r => (
                <div key={r.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
                  <div style={{ fontWeight: 500 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>残{r.stk}個 → 推奨{r.optimalStock}個まで補充</div>
                </div>
              ))}
              {inv.recommendations.filter(r => r.action === "urgent").length === 0 && <div style={{ fontSize: 13, color: "#0F6E56" }}>✓ 緊急発注の必要な商品はありません</div>}
            </Card>
            <Card style={{ borderLeft: "3px solid " + A, background: A + "06" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: A, display: "flex", alignItems: "center", gap: 6 }}><IcAi /> 在庫最適化AI</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.8 }}>
                在庫回転率{inv.avgTurnover}回は業界平均を上回っています。販売速度に基づく自動発注点の調整により、欠品リスクをさらに低減できます。
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Collection Risk */}
      {v === "risk" && (
        <>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: A }}><IcAi /></span> AI入金予測・回収リスク分析</div>
              <Badge variant="purple">AI分析</Badge>
            </div>
            {collection.length > 0 ? (
              <Tbl cols={[
                { label: "請求書", render: r => <span style={{ fontWeight: 500 }}>{r.inv.id}</span> },
                { label: "顧客", render: r => r.cust?.name || "-" },
                { label: "未回収額", render: r => <span style={{ fontWeight: 600 }}>{fmtY(r.inv.total - r.inv.paid)}</span> },
                { label: "超過日数", render: r => r.daysOverdue > 0 ? <span style={{ color: "#A32D2D", fontWeight: 500 }}>{r.daysOverdue}日</span> : <span style={{ color: "#0F6E56" }}>期限内</span> },
                { label: "AIリスク", render: r => (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <PBar value={r.riskScore} max={100} color={r.risk === "high" ? "#A32D2D" : r.risk === "medium" ? "#BA7517" : "#0F6E56"} h={6} />
                    <span style={{ fontSize: 11, fontWeight: 600, minWidth: 28 }}>{r.riskScore}点</span>
                  </div>
                )},
                { label: "AI入金予測", render: r => <span style={{ color: A, fontWeight: 500 }}>{r.predictedDays}日後</span> },
                { label: "推奨", render: r => <Badge variant={r.risk === "high" ? "danger" : r.risk === "medium" ? "warning" : "success"}>{r.risk === "high" ? "即時電話" : r.risk === "medium" ? "メール" : "待機"}</Badge> },
              ]} data={collection} />
            ) : (
              <div style={{ padding: 24, textAlign: "center", color: "#0F6E56", fontSize: 14, fontWeight: 500 }}>✓ すべての請求が回収済みです</div>
            )}
          </Card>
          <Card style={{ borderLeft: "3px solid " + A, background: A + "06" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: A, display: "flex", alignItems: "center", gap: 6 }}><IcAi /> 回収最適化AI</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.8 }}>
              顧客の過去の支払いパターン、AIスコア、取引実績を総合的に分析し、リスクスコアを算出しています。高リスク案件には即時対応、中リスク案件にはリマインドメールの送信を推奨します。
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
