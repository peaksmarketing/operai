'use client';
import { useState } from 'react';
import { Badge, Card, KPI, Tbl, Btn, PBar, Modal, Fld, inputStyle } from './UI';
import { IcUsers, IcRcpt, IcZap, IcChk, IcPlus, IcX } from './Icons';
import { fmtY, today, uid } from './useAuto';

const P = "#2b6876";
const A = "#534AB7";
const STG = { lead: "リード", qualification: "精査", proposal: "提案", negotiation: "交渉", processing: "処理中", won: "完了", lost: "失注" };
const STGC = { lead: "#888", qualification: "#854F0B", proposal: P, negotiation: A, processing: "#D85A30", won: "#0F6E56", lost: "#993556" };

function ScoreBadge({ score }) {
  const color = score >= 80 ? "#0F6E56" : score >= 60 ? "#BA7517" : "#A32D2D";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 48 }}><PBar value={score} color={color} h={5} /></div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 24 }}>{score}</span>
    </div>
  );
}

/* ─── Customer Detail (360° View) ─── */
function CustomerDetail({ customer, data, setData, onBack }) {
  const c = customer;
  const deals = data.deals.filter(d => d.cid === c.id);
  const invoices = data.invs.filter(i => i.cid === c.id);
  const orders = data.ords.filter(o => o.cid === c.id);
  const activities = (data.activities || []).filter(a => a.cid === c.id).sort((a, b) => b.date.localeCompare(a.date));
  const wonDeals = deals.filter(d => d.stage === "won");
  const openDeals = deals.filter(d => d.stage !== "won" && d.stage !== "lost");
  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paid, 0);

  const [showAddAct, setShowAddAct] = useState(false);
  const [actType, setActType] = useState("call");
  const [actNote, setActNote] = useState("");

  const typeLabel = { call: "電話", email: "メール", meeting: "商談", other: "その他" };
  const typeColor = { call: "#2b6876", email: "#534AB7", meeting: "#0F6E56", other: "#888" };

  const handleAddActivity = () => {
    if (!actNote.trim()) return;
    setData(prev => ({
      ...prev,
      activities: [...(prev.activities || []), {
        id: uid("act"), cid: c.id, date: today(), type: actType, user: "管理者", note: actNote.trim(),
      }],
    }));
    setActNote("");
    setShowAddAct(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Btn variant="ghost" onClick={onBack}>← 顧客一覧に戻る</Btn>

      {/* Header card */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{c.name}</h3>
              <Badge variant={c.st === "active" ? "success" : c.st === "prospect" ? "warning" : "default"}>
                {c.st === "active" ? "アクティブ" : c.st === "prospect" ? "見込み" : "リード"}
              </Badge>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", fontSize: 13, color: "var(--text-secondary)" }}>
              <div>担当者: <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{c.ct}</span></div>
              <div>業種: <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{c.ind}</span></div>
              <div>メール: <span style={{ color: P, fontWeight: 500 }}>{c.em}</span></div>
              <div>電話: <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{c.phone || "—"}</span></div>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "8px 20px", borderLeft: "1px solid var(--border-light)", marginLeft: 20 }}>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>AIスコア</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: c.score >= 80 ? "#0F6E56" : c.score >= 60 ? "#BA7517" : "#A32D2D", lineHeight: 1 }}>{c.score}</div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>/ 100</div>
          </div>
        </div>
      </Card>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <KPI label="累計売上" value={fmtY(c.rev)} icon={<IcRcpt />} color={P} />
        <KPI label="進行中案件" value={openDeals.length + "件"} sub={fmtY(openDeals.reduce((s, d) => s + d.val, 0))} icon={<IcUsers />} color={A} />
        <KPI label="受注実績" value={wonDeals.length + "件"} icon={<IcChk />} color="#0F6E56" />
        <KPI label="請求残高" value={fmtY(totalInvoiced - totalPaid)} sub={totalInvoiced > 0 ? "回収率 " + Math.round(totalPaid / totalInvoiced * 100) + "%" : ""} icon={<IcRcpt />} color={totalInvoiced - totalPaid > 0 ? "#A32D2D" : "#0F6E56"} />
      </div>

      {/* Activity History */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>対応履歴</div>
          <Btn variant="primary" size="sm" onClick={() => setShowAddAct(true)}><IcPlus /> 記録を追加</Btn>
        </div>

        {showAddAct && (
          <div style={{ padding: 16, background: "var(--bg-secondary)", borderRadius: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {Object.entries(typeLabel).map(([k, v]) => (
                <button key={k} onClick={() => setActType(k)}
                  style={{ padding: "6px 14px", borderRadius: 6, border: actType === k ? "2px solid " + typeColor[k] : "1px solid var(--border-light)", background: actType === k ? typeColor[k] + "12" : "#fff", color: actType === k ? typeColor[k] : "var(--text-secondary)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                  {v}
                </button>
              ))}
            </div>
            <textarea
              value={actNote} onChange={e => setActNote(e.target.value)}
              placeholder="対応内容を記録..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
              <Btn size="sm" onClick={() => { setShowAddAct(false); setActNote(""); }}>キャンセル</Btn>
              <Btn variant="primary" size="sm" onClick={handleAddActivity} disabled={!actNote.trim()}>保存</Btn>
            </div>
          </div>
        )}

        {activities.length > 0 ? (
          <div>
            {activities.map(act => (
              <div key={act.id} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--border-light)" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 40 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: (typeColor[act.type] || "#888") + "14", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: typeColor[act.type] || "#888" }}>
                    {(typeLabel[act.type] || "他").charAt(0)}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Badge variant={act.type === "meeting" ? "success" : act.type === "call" ? "info" : act.type === "email" ? "purple" : "default"}>
                      {typeLabel[act.type] || "その他"}
                    </Badge>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{act.date}</span>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>/ {act.user}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6 }}>{act.note}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>対応履歴はまだありません</div>
        )}
      </Card>

      {/* Deals */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>案件一覧</div>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{deals.length}件</span>
        </div>
        {deals.length > 0 ? (
          <Tbl cols={[
            { label: "案件名", render: r => <span style={{ fontWeight: 500 }}>{r.title}</span> },
            { label: "金額", render: r => <span style={{ fontWeight: 600 }}>{fmtY(r.val)}</span> },
            { label: "フェーズ", render: r => <Badge variant={r.stage === "won" ? "success" : r.stage === "lost" ? "danger" : "info"}>{STG[r.stage]}</Badge> },
            { label: "確度", render: r => (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 40 }}><PBar value={r.prob} color={r.prob >= 70 ? "#0F6E56" : r.prob >= 40 ? "#BA7517" : "#A32D2D"} h={4} /></div>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.prob}%</span>
              </div>
            ) },
          ]} data={deals} />
        ) : (
          <div style={{ padding: 20, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>案件データなし</div>
        )}
      </Card>

      {/* Orders & Invoices side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>受注履歴</div>
          {orders.length > 0 ? orders.map(o => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
              <div>
                <span style={{ fontWeight: 500 }}>{o.id}</span>
                <span style={{ color: "var(--text-tertiary)", marginLeft: 8 }}>{o.date}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{fmtY(o.total)}</span>
                <Badge variant={o.st === "confirmed" ? "success" : o.st === "shipped" ? "info" : "warning"}>{o.st === "confirmed" ? "確定" : o.st === "shipped" ? "出荷済" : "未確認"}</Badge>
              </div>
            </div>
          )) : <div style={{ padding: 16, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>受注なし</div>}
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>請求・入金</div>
          {invoices.length > 0 ? invoices.map(inv => (
            <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
              <div>
                <span style={{ fontWeight: 500 }}>{inv.id}</span>
                <span style={{ color: "var(--text-tertiary)", marginLeft: 8 }}>期日 {inv.due}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{fmtY(inv.total)}</span>
                <Badge variant={inv.st === "paid" ? "success" : inv.st === "partial" ? "warning" : "info"}>{inv.st === "paid" ? "入金済" : inv.st === "partial" ? "一部" : "未入金"}</Badge>
              </div>
            </div>
          )) : <div style={{ padding: 16, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>請求なし</div>}
        </Card>
      </div>

      {/* Notes */}
      {c.notes && (
        <Card style={{ borderLeft: "3px solid " + P }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>メモ</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{c.notes}</div>
        </Card>
      )}
    </div>
  );
}

/* ─── Main CRM Module ─── */
export default function CRMModule({ data, setData }) {
  const [view, setView] = useState("cust");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newCust, setNewCust] = useState({ name: "", ct: "", em: "", ind: "", phone: "" });
  const [csvData, setCsvData] = useState(null);
  const [csvError, setCsvError] = useState("");

  // Search filter
  const filtered = data.custs.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.ct.toLowerCase().includes(q) || c.ind.toLowerCase().includes(q);
  });

  // KPIs
  const totalCusts = data.custs.length;
  const activeCusts = data.custs.filter(c => c.st === "active").length;
  const pipelineVal = data.deals.filter(d => d.stage !== "won" && d.stage !== "lost").reduce((s, d) => s + d.val, 0);
  const wonVal = data.deals.filter(d => d.stage === "won").reduce((s, d) => s + d.val, 0);
  const avgScore = Math.round(data.custs.reduce((s, c) => s + c.score, 0) / (totalCusts || 1));

  const handleAddCust = () => {
    if (!newCust.name) return;
    const id = uid("c");
    setData(prev => ({
      ...prev,
      custs: [...prev.custs, { ...newCust, id, rev: 0, score: 50, st: "prospect", notes: "" }],
    }));
    setNewCust({ name: "", ct: "", em: "", ind: "", phone: "" });
    setShowAdd(false);
  };

  if (selected) {
    return <CustomerDetail customer={selected} data={data} setData={setData} onBack={() => setSelected(null)} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>営業・顧客管理</h2>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>顧客情報と案件パイプラインを一元管理</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant={view === "cust" ? "primary" : "default"} size="md" onClick={() => setView("cust")}>顧客一覧</Btn>
          <Btn variant={view === "pipe" ? "primary" : "default"} size="md" onClick={() => setView("pipe")}>パイプライン</Btn>
          <Btn variant={view === "analysis" ? "primary" : "default"} size="md" onClick={() => setView("analysis")}>CRM分析</Btn>
          <Btn variant={view === "ai" ? "primary" : "default"} size="md" onClick={() => setView("ai")}>AI予測</Btn>
          <Btn variant={view === "csv" ? "primary" : "default"} size="md" onClick={() => setView("csv")}>CSV取込</Btn>
          <Btn variant="primary" size="md" onClick={() => setShowAdd(true)}><IcPlus /> 顧客登録</Btn>
        </div>
      </div>

      {/* KPI Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        <KPI label="顧客数" value={totalCusts + "社"} sub={activeCusts + "社アクティブ"} icon={<IcUsers />} color={P} />
        <KPI label="パイプライン" value={fmtY(pipelineVal)} sub={data.deals.filter(d => d.stage !== "won" && d.stage !== "lost").length + "件進行中"} icon={<IcZap />} color={A} />
        <KPI label="受注累計" value={fmtY(wonVal)} icon={<IcChk />} color="#0F6E56" />
        <KPI label="平均AIスコア" value={avgScore + "点"} icon={<IcUsers />} color={avgScore >= 70 ? "#0F6E56" : "#BA7517"} />
      </div>

      {/* Customer List View */}
      {view === "cust" && (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="顧客名・担当者・業種で検索..."
              style={{ ...inputStyle, maxWidth: 320 }}
            />
            {search && <Btn variant="ghost" size="sm" onClick={() => setSearch("")}>クリア</Btn>}
          </div>
          <Tbl cols={[
            { label: "顧客名", render: r => (
              <div>
                <div style={{ fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{r.ind}</div>
              </div>
            ) },
            { label: "担当者", key: "ct" },
            { label: "メール", render: r => <span style={{ color: P }}>{r.em}</span> },
            { label: "累計売上", render: r => <span style={{ fontWeight: 500 }}>{fmtY(r.rev)}</span> },
            { label: "AIスコア", render: r => <ScoreBadge score={r.score} /> },
            { label: "案件", render: r => {
              const cnt = data.deals.filter(d => d.cid === r.id && d.stage !== "won" && d.stage !== "lost").length;
              return cnt > 0 ? <Badge variant="info">{cnt}件進行中</Badge> : <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>—</span>;
            } },
            { label: "状態", render: r => <Badge variant={r.st === "active" ? "success" : r.st === "prospect" ? "warning" : "default"}>{r.st === "active" ? "アクティブ" : r.st === "prospect" ? "見込み" : "リード"}</Badge> },
          ]} data={filtered} onRow={r => setSelected(r)} />
          {filtered.length === 0 && search && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
              「{search}」に一致する顧客が見つかりません
            </div>
          )}
        </>
      )}

      {/* Pipeline View */}
      {view === "pipe" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 }}>
          {["lead", "qualification", "proposal", "negotiation", "processing", "won"].map(stage => {
            const stageDeals = data.deals.filter(d => d.stage === stage);
            const stageTotal = stageDeals.reduce((s, d) => s + d.val, 0);
            return (
              <div key={stage}>
                {/* Column header */}
                <div style={{ marginBottom: 12, padding: "10px 12px", background: STGC[stage] + "10", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: STGC[stage] }}>{STG[stage]}</span>
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)", background: "var(--bg-primary)", padding: "2px 8px", borderRadius: 10 }}>{stageDeals.length}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: STGC[stage], marginTop: 4 }}>{fmtY(stageTotal)}</div>
                </div>
                {/* Deal cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {stageDeals.map(d => {
                    const cust = (data.custs.find(c => c.id === d.cid) || {});
                    return (
                      <Card key={d.id} style={{ padding: 14, borderLeft: "3px solid " + STGC[stage] }}
                        onClick={() => { const c = data.custs.find(x => x.id === d.cid); if (c) { setSelected(c); setView("cust"); } }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{d.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8 }}>{cust.name || "—"}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: STGC[stage] }}>{fmtY(d.val)}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <div style={{ width: 32 }}><PBar value={d.prob} color={d.prob >= 70 ? "#0F6E56" : "#BA7517"} h={4} /></div>
                            <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{d.prob}%</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                  {stageDeals.length === 0 && (
                    <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: "var(--text-tertiary)", border: "1px dashed var(--border-light)", borderRadius: 8 }}>
                      案件なし
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Analysis View */}
      {view === "analysis" && (() => {
        const custByRev = [...data.custs].sort((a, b) => b.rev - a.rev);
        const maxRev = custByRev[0] ? custByRev[0].rev : 1;

        const indMap = {};
        data.custs.forEach(c => { indMap[c.ind] = (indMap[c.ind] || 0) + 1; });
        const indEntries = Object.entries(indMap).sort((a, b) => b[1] - a[1]);
        const indTotal = data.custs.length;

        const stageMap = {};
        data.deals.forEach(d => {
          if (!stageMap[d.stage]) stageMap[d.stage] = { count: 0, val: 0 };
          stageMap[d.stage].count++;
          stageMap[d.stage].val += d.val;
        });
        const dealTotal = data.deals.length;

        const wonCount = data.deals.filter(d => d.stage === "won").length;
        const lostCount = data.deals.filter(d => d.stage === "lost").length;
        const closedCount = wonCount + lostCount;
        const winRate = closedCount > 0 ? Math.round(wonCount / closedCount * 100) : 0;

        const indColors = ["#2b6876", "#534AB7", "#0F6E56", "#854F0B", "#A32D2D", "#888"];

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Summary KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              <KPI label="成約率" value={winRate + "%"} sub={`${wonCount}件成約 / ${closedCount}件完了`} icon={<IcChk />} color="#0F6E56" />
              <KPI label="平均取引額" value={fmtY(Math.round(data.custs.reduce((s, c) => s + c.rev, 0) / (totalCusts || 1)))} icon={<IcRcpt />} color={P} />
              <KPI label="平均AIスコア" value={avgScore + "点"} icon={<IcUsers />} color={avgScore >= 70 ? "#0F6E56" : "#BA7517"} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {/* Customer Revenue Ranking */}
              <Card>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>顧客別売上ランキング</div>
                {custByRev.map((c, i) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border-light)" }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: i < 3 ? P + "18" : "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: i < 3 ? P : "var(--text-tertiary)", flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: P }}>{fmtY(c.rev)}</span>
                      </div>
                      <PBar value={c.rev} max={maxRev} color={P} h={4} />
                    </div>
                  </div>
                ))}
              </Card>

              {/* Industry Distribution */}
              <Card>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>業種別分布</div>
                {indEntries.map(([ind, count], i) => {
                  const pct = Math.round(count / indTotal * 100);
                  const color = indColors[i % indColors.length];
                  return (
                    <div key={ind} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{ind}</span>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{count}社 ({pct}%)</span>
                      </div>
                      <PBar value={pct} max={100} color={color} h={6} />
                    </div>
                  );
                })}

                <div style={{ marginTop: 24, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>パイプライン段階分析</div>
                {["qualification", "proposal", "negotiation", "won"].map(stage => {
                  const s = stageMap[stage] || { count: 0, val: 0 };
                  const pct = dealTotal > 0 ? Math.round(s.count / dealTotal * 100) : 0;
                  return (
                    <div key={stage} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border-light)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: STGC[stage], flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 500, width: 48 }}>{STG[stage]}</span>
                      <div style={{ flex: 1 }}><PBar value={pct} max={100} color={STGC[stage]} h={5} /></div>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", minWidth: 40, textAlign: "right" }}>{s.count}件</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: STGC[stage], minWidth: 90, textAlign: "right" }}>{fmtY(s.val)}</span>
                    </div>
                  );
                })}
              </Card>
            </div>
          </div>
        );
      })()}

      {/* AI Prediction View */}
      {view === "ai" && (() => {
        const openDeals = data.deals.filter(d => d.stage !== "won" && d.stage !== "lost");

        // AI scoring logic based on multiple factors
        const predictDeal = (deal) => {
          const cust = data.custs.find(c => c.id === deal.cid) || {};
          const custDeals = data.deals.filter(d => d.cid === deal.cid);
          const wonCount = custDeals.filter(d => d.stage === "won").length;
          const totalClosed = custDeals.filter(d => d.stage === "won" || d.stage === "lost").length;
          const custWinRate = totalClosed > 0 ? wonCount / totalClosed : 0.5;

          // Stage weight
          const stageWeight = { lead: 0.1, qualification: 0.25, proposal: 0.5, negotiation: 0.75 }[deal.stage] || 0.3;

          // Customer score factor (0-1)
          const scoreFactor = (cust.score || 50) / 100;

          // Revenue history factor
          const revFactor = cust.rev > 30000000 ? 0.9 : cust.rev > 10000000 ? 0.7 : 0.5;

          // Activity recency factor
          const activities = (data.activities || []).filter(a => a.cid === deal.cid);
          const recentActivity = activities.length > 0;
          const activityFactor = recentActivity ? 0.8 : 0.4;

          // Combined AI score
          const aiScore = Math.round(
            (stageWeight * 0.3 + scoreFactor * 0.25 + custWinRate * 0.2 + revFactor * 0.15 + activityFactor * 0.1) * 100
          );

          // Expected value
          const expectedVal = Math.round(deal.val * aiScore / 100);

          // Risk level
          const risk = aiScore >= 65 ? "low" : aiScore >= 40 ? "medium" : "high";

          // Recommended actions
          const actions = [];
          if (deal.stage === "qualification") actions.push("詳細なヒアリングで要件を明確化");
          if (deal.stage === "proposal") actions.push("競合分析を含む提案書を準備");
          if (deal.stage === "negotiation") actions.push("決裁者との直接面談を設定");
          if (!recentActivity) actions.push("2週間以上未接触 — 早急にフォローアップ");
          if (scoreFactor < 0.6) actions.push("関係性の強化が必要 — 定期的な情報提供を");
          if (aiScore >= 70) actions.push("成約確度が高い — クロージングの準備を");
          if (deal.val > 5000000 && deal.stage !== "negotiation") actions.push("高額案件 — 上長同席のプレゼンを検討");

          return { ...deal, aiScore, expectedVal, risk, actions, custName: cust.name || "—", custScore: cust.score || 0 };
        };

        const predictions = openDeals.map(predictDeal).sort((a, b) => b.aiScore - a.aiScore);
        const totalExpected = predictions.reduce((s, p) => s + p.expectedVal, 0);
        const totalPipeline = predictions.reduce((s, p) => s + p.val, 0);
        const avgAiScore = predictions.length > 0 ? Math.round(predictions.reduce((s, p) => s + p.aiScore, 0) / predictions.length) : 0;
        const highProb = predictions.filter(p => p.aiScore >= 65).length;

        const riskColor = { low: "#0F6E56", medium: "#BA7517", high: "#A32D2D" };
        const riskLabel = { low: "低リスク", medium: "中リスク", high: "高リスク" };

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* AI Header */}
            <Card style={{ background: P + "08", border: "1px solid " + P + "20" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: P + "18", display: "flex", alignItems: "center", justifyContent: "center", color: P }}><IcZap /></div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: P }}>AI成約予測エンジン</div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>顧客スコア・案件フェーズ・対応履歴・取引実績から成約確率を算出</div>
                </div>
              </div>
            </Card>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              <KPI label="予測売上" value={fmtY(totalExpected)} sub={`パイプライン ${fmtY(totalPipeline)} の期待値`} icon={<IcRcpt />} color={P} />
              <KPI label="平均成約確率" value={avgAiScore + "%"} icon={<IcZap />} color={avgAiScore >= 60 ? "#0F6E56" : "#BA7517"} />
              <KPI label="高確度案件" value={highProb + "件"} sub={`${predictions.length}件中`} icon={<IcChk />} color="#0F6E56" />
            </div>

            {/* Deal Predictions */}
            {predictions.map(p => (
              <Card key={p.id} style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "flex" }}>
                  {/* Left: Score visual */}
                  <div style={{ width: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, background: riskColor[p.risk] + "08", borderRight: "1px solid var(--border-light)" }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: riskColor[p.risk], lineHeight: 1 }}>{p.aiScore}</div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>AI予測</div>
                    <Badge variant={p.risk === "low" ? "success" : p.risk === "medium" ? "warning" : "danger"}>{riskLabel[p.risk]}</Badge>
                  </div>

                  {/* Right: Details */}
                  <div style={{ flex: 1, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{p.custName} / <Badge variant="info">{STG[p.stage]}</Badge></div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{fmtY(p.val)}</div>
                        <div style={{ fontSize: 12, color: P }}>期待値 {fmtY(p.expectedVal)}</div>
                      </div>
                    </div>

                    {/* Score breakdown */}
                    <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ color: "var(--text-tertiary)" }}>顧客スコア:</span>
                        <span style={{ fontWeight: 600, color: p.custScore >= 70 ? "#0F6E56" : "#BA7517" }}>{p.custScore}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ color: "var(--text-tertiary)" }}>確度:</span>
                        <span style={{ fontWeight: 600 }}>{p.prob}%</span>
                      </div>
                    </div>

                    {/* AI Recommended Actions */}
                    <div style={{ background: "var(--bg-secondary)", borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: A, marginBottom: 6 }}>AI推奨アクション</div>
                      {p.actions.map((a, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
                          <span style={{ color: A, flexShrink: 0, marginTop: 1 }}>→</span>
                          <span>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {predictions.length === 0 && (
              <Card style={{ textAlign: "center", padding: 40, color: "var(--text-tertiary)" }}>
                進行中の案件がありません
              </Card>
            )}
          </div>
        );
      })()}

      {/* CSV Import View */}
      {view === "csv" && (() => {
        const handleFileChange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          setCsvError("");
          setCsvData(null);

          const reader = new FileReader();
          reader.onload = (ev) => {
            try {
              const text = ev.target.result;
              const lines = text.split(/\r?\n/).filter(l => l.trim());
              if (lines.length < 2) { setCsvError("データが2行以上必要です（1行目はヘッダー）"); return; }

              const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
              const nameIdx = headers.findIndex(h => /会社名|顧客名|name|企業名/.test(h));
              if (nameIdx < 0) { setCsvError("「会社名」列が見つかりません。列名を確認してください。"); return; }

              const ctIdx = headers.findIndex(h => /担当|contact|連絡先/.test(h));
              const emIdx = headers.findIndex(h => /メール|email|mail/.test(h));
              const indIdx = headers.findIndex(h => /業種|industry/.test(h));
              const phoneIdx = headers.findIndex(h => /電話|phone|tel/.test(h));

              const rows = [];
              for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
                const name = cols[nameIdx] || "";
                if (!name) continue;
                rows.push({
                  name,
                  ct: ctIdx >= 0 ? (cols[ctIdx] || "") : "",
                  em: emIdx >= 0 ? (cols[emIdx] || "") : "",
                  ind: indIdx >= 0 ? (cols[indIdx] || "") : "",
                  phone: phoneIdx >= 0 ? (cols[phoneIdx] || "") : "",
                  selected: true,
                });
              }
              if (rows.length === 0) { setCsvError("有効なデータ行がありません"); return; }
              setCsvData({ headers, rows, mapping: { nameIdx, ctIdx, emIdx, indIdx, phoneIdx } });
            } catch (err) {
              setCsvError("CSVの解析に失敗しました: " + err.message);
            }
          };
          reader.readAsText(file, "UTF-8");
        };

        const handleBulkRegister = () => {
          if (!csvData) return;
          const toAdd = csvData.rows.filter(r => r.selected);
          if (toAdd.length === 0) return;

          setData(prev => ({
            ...prev,
            custs: [
              ...prev.custs,
              ...toAdd.map(r => ({
                id: uid("c"),
                name: r.name,
                ct: r.ct,
                em: r.em,
                ind: r.ind,
                phone: r.phone,
                rev: 0,
                score: 50,
                st: "prospect",
                notes: "",
              })),
            ],
          }));

          const count = toAdd.length;
          setCsvData(null);
          setCsvError("");
          alert(count + "件の顧客を登録しました");
          setView("cust");
        };

        const toggleRow = (i) => {
          setCsvData(prev => ({
            ...prev,
            rows: prev.rows.map((r, j) => j === i ? { ...r, selected: !r.selected } : r),
          }));
        };

        const toggleAll = () => {
          if (!csvData) return;
          const allSelected = csvData.rows.every(r => r.selected);
          setCsvData(prev => ({
            ...prev,
            rows: prev.rows.map(r => ({ ...r, selected: !allSelected })),
          }));
        };

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Upload area */}
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>CSVファイルから顧客を一括登録</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.7 }}>
                CSVファイルをアップロードして、複数の顧客を一度に登録できます。<br />
                1行目はヘッダー行として認識されます。「会社名」列は必須です。
              </div>

              {/* Template download */}
              <Card style={{ background: "var(--bg-secondary)", padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>CSVテンプレート</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8 }}>以下の列名を含むCSVをご用意ください:</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["会社名（必須）", "担当者名", "メールアドレス", "業種", "電話番号"].map(h => (
                    <span key={h} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: P + "14", color: P }}>{h}</span>
                  ))}
                </div>
                <div style={{ marginTop: 10 }}>
                  <Btn variant="ghost" size="sm" onClick={() => {
                    const csv = "会社名,担当者名,メールアドレス,業種,電話番号\nサンプル株式会社,山田太郎,yamada@sample.co.jp,製造業,03-1234-5678\nテスト商事,鈴木花子,suzuki@test.co.jp,IT,06-9876-5432";
                    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = "顧客テンプレート.csv"; a.click();
                    URL.revokeObjectURL(url);
                  }}>テンプレートをダウンロード</Btn>
                </div>
              </Card>

              {/* File upload */}
              <div style={{ border: "2px dashed var(--border-light)", borderRadius: 10, padding: 32, textAlign: "center", cursor: "pointer", transition: "border-color 0.15s" }}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = P; }}
                onDragLeave={e => { e.currentTarget.style.borderColor = "var(--border-light)"; }}
                onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--border-light)"; const f = e.dataTransfer.files[0]; if (f) handleFileChange({ target: { files: [f] } }); }}>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>CSVファイルをドラッグ＆ドロップ、またはクリックして選択</div>
                <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: "none" }} id="csv-upload" />
                <Btn variant="primary" size="sm" onClick={() => document.getElementById("csv-upload").click()}>ファイルを選択</Btn>
              </div>

              {csvError && (
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "var(--danger-bg)", color: "#A32D2D", fontSize: 13 }}>{csvError}</div>
              )}
            </Card>

            {/* Preview */}
            {csvData && (
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>プレビュー</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{csvData.rows.filter(r => r.selected).length} / {csvData.rows.length}件 選択中</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn size="sm" onClick={toggleAll}>{csvData.rows.every(r => r.selected) ? "全解除" : "全選択"}</Btn>
                    <Btn size="sm" onClick={() => { setCsvData(null); setCsvError(""); }}>クリア</Btn>
                  </div>
                </div>
                <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--border-light)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 500, color: "var(--text-secondary)", fontSize: 11, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-light)", width: 40 }}>登録</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 500, color: "var(--text-secondary)", fontSize: 11, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-light)" }}>会社名</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 500, color: "var(--text-secondary)", fontSize: 11, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-light)" }}>担当者</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 500, color: "var(--text-secondary)", fontSize: 11, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-light)" }}>メール</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 500, color: "var(--text-secondary)", fontSize: 11, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-light)" }}>業種</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 500, color: "var(--text-secondary)", fontSize: 11, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-light)" }}>電話</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.rows.map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border-light)", opacity: r.selected ? 1 : 0.4 }}>
                          <td style={{ padding: "8px 12px", textAlign: "center" }}>
                            <input type="checkbox" checked={r.selected} onChange={() => toggleRow(i)} style={{ accentColor: P }} />
                          </td>
                          <td style={{ padding: "8px 12px", fontWeight: 500 }}>{r.name}</td>
                          <td style={{ padding: "8px 12px" }}>{r.ct || "—"}</td>
                          <td style={{ padding: "8px 12px", color: P }}>{r.em || "—"}</td>
                          <td style={{ padding: "8px 12px" }}>{r.ind || "—"}</td>
                          <td style={{ padding: "8px 12px" }}>{r.phone || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                  <Btn onClick={() => { setCsvData(null); setCsvError(""); }}>キャンセル</Btn>
                  <Btn variant="primary" onClick={handleBulkRegister} disabled={csvData.rows.filter(r => r.selected).length === 0}>
                    {csvData.rows.filter(r => r.selected).length}件を一括登録
                  </Btn>
                </div>
              </Card>
            )}
          </div>
        );
      })()}

      {/* Add Customer Modal */}
      {showAdd && (
        <Modal title="新規顧客登録" onClose={() => setShowAdd(false)}>
          <Fld label="会社名 *">
            <input value={newCust.name} onChange={e => setNewCust({ ...newCust, name: e.target.value })} placeholder="株式会社〇〇" style={inputStyle} />
          </Fld>
          <Fld label="担当者名">
            <input value={newCust.ct} onChange={e => setNewCust({ ...newCust, ct: e.target.value })} placeholder="山田 太郎" style={inputStyle} />
          </Fld>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Fld label="メールアドレス">
              <input value={newCust.em} onChange={e => setNewCust({ ...newCust, em: e.target.value })} placeholder="info@example.co.jp" style={inputStyle} />
            </Fld>
            <Fld label="電話番号">
              <input value={newCust.phone} onChange={e => setNewCust({ ...newCust, phone: e.target.value })} placeholder="03-1234-5678" style={inputStyle} />
            </Fld>
          </div>
          <Fld label="業種">
            <input value={newCust.ind} onChange={e => setNewCust({ ...newCust, ind: e.target.value })} placeholder="製造業、IT、商社など" style={inputStyle} />
          </Fld>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <Btn onClick={() => setShowAdd(false)}>キャンセル</Btn>
            <Btn variant="primary" onClick={handleAddCust} disabled={!newCust.name}>登録</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
