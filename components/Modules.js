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
  const [search, setSearch] = useState("");
  const [selProd, setSelProd] = useState(null);
  const [selOrd, setSelOrd] = useState(null);
  const newTotal = newItems.reduce((s, it) => { const p = data.prods.find(x => x.id === it.pid); return s + (p ? p.price * it.qty : 0); }, 0);

  const filteredProds = data.prods.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q);
  });

  const totalStkValue = data.prods.reduce((s, p) => s + p.cost * p.stk, 0);
  const totalRetailValue = data.prods.reduce((s, p) => s + p.price * p.stk, 0);
  const alertCount = data.prods.filter(p => p.stk <= p.min).length;
  const shippedCount = data.ords.filter(o => o.st === "shipped").length;

  // Warehouse summary
  const whMap = {};
  data.prods.forEach(p => {
    if (!whMap[p.wh]) whMap[p.wh] = { count: 0, stk: 0, value: 0 };
    whMap[p.wh].count++;
    whMap[p.wh].stk += p.stk;
    whMap[p.wh].value += p.cost * p.stk;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>在庫・物流管理</h2>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>商品在庫と受注・出荷を一元管理</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant={v === "prod" ? "primary" : "default"} size="md" onClick={() => setV("prod")}>商品マスタ</Btn>
          <Btn variant={v === "ord" ? "primary" : "default"} size="md" onClick={() => setV("ord")}>受注管理</Btn>
          <Btn variant={v === "wh" ? "primary" : "default"} size="md" onClick={() => setV("wh")}>倉庫別</Btn>
          <Btn variant={v === "alert" ? "primary" : "default"} size="md" onClick={() => setV("alert")}>アラート{alertCount > 0 ? ` (${alertCount})` : ""}</Btn>
          <Btn variant="primary" size="md" onClick={() => setShowNew(true)}><IcPlus /> 新規受注</Btn>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        <KPI label="総SKU" value={data.prods.length + "品目"} icon={<IcBox />} color={P} />
        <KPI label="在庫原価" value={fmtY(totalStkValue)} sub={"売価 " + fmtY(totalRetailValue)} icon={<IcCalc />} color="#0F6E56" />
        <KPI label="要発注アラート" value={alertCount + "件"} icon={<IcAlrt />} color={alertCount > 0 ? "#A32D2D" : "#0F6E56"} />
        <KPI label="出荷済" value={shippedCount + "件"} sub={"全" + data.ords.length + "件中"} icon={<IcChk />} color={A} />
      </div>

      {/* Product Master */}
      {v === "prod" && (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="商品名・SKU・カテゴリで検索..." style={{ ...inputStyle, maxWidth: 320 }} />
            {search && <Btn variant="ghost" size="sm" onClick={() => setSearch("")}>クリア</Btn>}
          </div>
          <Tbl cols={[
            { label: "商品名", render: r => (
              <div style={{ cursor: "pointer" }} onClick={() => setSelProd(r)}>
                <div style={{ fontWeight: 500, color: P }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{r.sku}</div>
              </div>
            ) },
            { label: "カテゴリ", render: r => <Badge variant="default">{r.cat}</Badge> },
            { label: "売価", render: r => fmtY(r.price) },
            { label: "原価", render: r => <span style={{ color: "var(--text-tertiary)" }}>{fmtY(r.cost)}</span> },
            { label: "粗利率", render: r => { const m = Math.round((1 - r.cost / r.price) * 100); return <span style={{ fontWeight: 500, color: m >= 40 ? "#0F6E56" : "#BA7517" }}>{m}%</span>; } },
            { label: "在庫数", render: r => (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 600, color: r.stk <= r.min ? "#A32D2D" : "inherit" }}>{r.stk}</span>
                {r.stk <= r.min && <Badge variant="danger">要発注</Badge>}
                <div style={{ width: 40 }}><PBar value={r.stk} max={Math.max(r.stk, r.min * 3)} color={r.stk <= r.min ? "#A32D2D" : P} h={4} /></div>
              </div>
            ) },
            { label: "発注点", render: r => <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{r.min}</span> },
            { label: "倉庫", key: "wh" },
          ]} data={filteredProds} onRow={r => setSelProd(r)} />
          {filteredProds.length === 0 && search && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>「{search}」に一致する商品がありません</div>
          )}
        </>
      )}

      {/* Orders */}
      {v === "ord" && (
        <>
          <Tbl cols={[
            { label: "受注ID", render: r => <span style={{ fontWeight: 500 }}>{r.id}</span> },
            { label: "顧客", render: r => (data.custs.find(c => c.id === r.cid) || {}).name || "-" },
            { label: "日付", key: "date" },
            { label: "明細", render: r => <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{r.items.length}品目</span> },
            { label: "合計", render: r => <span style={{ fontWeight: 600 }}>{fmtY(r.total)}</span> },
            { label: "状態", render: r => <Badge variant={r.st === "confirmed" ? "success" : r.st === "shipped" ? "info" : "warning"}>{ORDS[r.st]}</Badge> },
            { label: "操作", render: r => r.st === "pending" ? <Btn variant="success" size="sm" onClick={e => { e.stopPropagation(); confirmOrder(r.id); }}><IcZap /> 受注確定</Btn> : r.st === "confirmed" ? <span style={{ color: "#0F6E56", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}><IcChk /> 確定済</span> : <span style={{ color: A, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}><IcChk /> 出荷済</span> },
          ]} data={data.ords} onRow={r => setSelOrd(selOrd?.id === r.id ? null : r)} />

          {/* Order detail expand */}
          {selOrd && (
            <Card style={{ borderLeft: "3px solid " + P }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>受注明細 — {selOrd.id}</div>
                <Btn variant="ghost" size="sm" onClick={() => setSelOrd(null)}>閉じる</Btn>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 13, marginBottom: 12 }}>
                <div><span style={{ color: "var(--text-tertiary)" }}>顧客: </span><span style={{ fontWeight: 500 }}>{(data.custs.find(c => c.id === selOrd.cid) || {}).name}</span></div>
                <div><span style={{ color: "var(--text-tertiary)" }}>日付: </span>{selOrd.date}</div>
                <div><span style={{ color: "var(--text-tertiary)" }}>状態: </span><Badge variant={selOrd.st === "confirmed" ? "success" : selOrd.st === "shipped" ? "info" : "warning"}>{ORDS[selOrd.st]}</Badge></div>
              </div>
              <Tbl cols={[
                { label: "商品", render: r => { const p = data.prods.find(x => x.id === r.pid); return p ? p.name : r.pid; } },
                { label: "SKU", render: r => { const p = data.prods.find(x => x.id === r.pid); return p ? p.sku : "-"; } },
                { label: "数量", render: r => <span style={{ fontWeight: 500 }}>{r.qty}</span> },
                { label: "単価", render: r => fmtY(r.pr) },
                { label: "小計", render: r => <span style={{ fontWeight: 600 }}>{fmtY(r.qty * r.pr)}</span> },
              ]} data={selOrd.items} />
              <div style={{ textAlign: "right", marginTop: 12, fontSize: 16, fontWeight: 700 }}>合計: {fmtY(selOrd.total)}</div>
            </Card>
          )}

          <Card style={{ borderLeft: "3px solid " + A, padding: 14 }}>
            <div style={{ fontSize: 13, color: A, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}><IcZap />「受注確定」で自動実行:</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.8 }}>1. 請求書自動生成（税込・30日払い）<br />2. 売上仕訳自動計上（売掛金/売上高）<br />3. 在庫自動引当・出庫処理</div>
          </Card>
        </>
      )}

      {/* Warehouse View */}
      {v === "wh" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {Object.entries(whMap).map(([wh, info]) => (
              <Card key={wh}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{wh}倉庫</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{info.count}品目 / {info.stk}個</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: P }}>{fmtY(info.value)}</div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>在庫原価</div>
                  </div>
                </div>
                {data.prods.filter(p => p.wh === wh).map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--border-light)", fontSize: 13 }}>
                    <div>
                      <span style={{ fontWeight: 500 }}>{p.name}</span>
                      <span style={{ color: "var(--text-tertiary)", marginLeft: 8, fontSize: 11 }}>{p.sku}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontWeight: 600, color: p.stk <= p.min ? "#A32D2D" : "inherit" }}>{p.stk}個</span>
                      {p.stk <= p.min && <Badge variant="danger">低</Badge>}
                    </div>
                  </div>
                ))}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Alert View */}
      {v === "alert" && (
        <>
          {alertCount > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.prods.filter(p => p.stk <= p.min).map(p => (
                <Card key={p.id} style={{ borderLeft: "3px solid #A32D2D" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</span>
                        <Badge variant="danger">要発注</Badge>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{p.sku} / {p.cat} / {p.wh}倉庫</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "#A32D2D" }}>{p.stk}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-tertiary)" }}>個</span></div>
                      <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>発注点: {p.min}個</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <PBar value={p.stk} max={p.min * 2} color="#A32D2D" h={6} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>
                      <span>現在: {p.stk}個</span>
                      <span>推奨発注数: {p.min * 2 - p.stk}個</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card style={{ textAlign: "center", padding: 40, color: "var(--text-tertiary)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#0F6E56" }}>すべての商品が適正在庫です</div>
            </Card>
          )}
        </>
      )}

      {/* Product Detail Modal */}
      {selProd && (
        <Modal title={selProd.name} onClose={() => setSelProd(null)} wide>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13 }}>
              <div style={{ color: "var(--text-tertiary)", marginBottom: 4 }}>SKU</div>
              <div style={{ fontWeight: 500 }}>{selProd.sku}</div>
            </div>
            <div style={{ fontSize: 13 }}>
              <div style={{ color: "var(--text-tertiary)", marginBottom: 4 }}>カテゴリ</div>
              <div style={{ fontWeight: 500 }}>{selProd.cat}</div>
            </div>
            <div style={{ fontSize: 13 }}>
              <div style={{ color: "var(--text-tertiary)", marginBottom: 4 }}>売価</div>
              <div style={{ fontWeight: 600 }}>{fmtY(selProd.price)}</div>
            </div>
            <div style={{ fontSize: 13 }}>
              <div style={{ color: "var(--text-tertiary)", marginBottom: 4 }}>原価</div>
              <div style={{ fontWeight: 500 }}>{fmtY(selProd.cost)}</div>
            </div>
            <div style={{ fontSize: 13 }}>
              <div style={{ color: "var(--text-tertiary)", marginBottom: 4 }}>粗利率</div>
              <div style={{ fontWeight: 600, color: "#0F6E56" }}>{Math.round((1 - selProd.cost / selProd.price) * 100)}%</div>
            </div>
            <div style={{ fontSize: 13 }}>
              <div style={{ color: "var(--text-tertiary)", marginBottom: 4 }}>倉庫</div>
              <div style={{ fontWeight: 500 }}>{selProd.wh}</div>
            </div>
          </div>
          <Card style={{ background: selProd.stk <= selProd.min ? "#A32D2D08" : "#0F6E5608", borderLeft: "3px solid " + (selProd.stk <= selProd.min ? "#A32D2D" : "#0F6E56") }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>現在庫</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: selProd.stk <= selProd.min ? "#A32D2D" : "#0F6E56" }}>{selProd.stk}<span style={{ fontSize: 14, fontWeight: 400 }}>個</span></div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>発注点</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{selProd.min}個</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>在庫原価</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{fmtY(selProd.cost * selProd.stk)}</div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}><PBar value={selProd.stk} max={selProd.min * 3} color={selProd.stk <= selProd.min ? "#A32D2D" : "#0F6E56"} h={6} /></div>
          </Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 16, marginBottom: 8 }}>この商品の受注履歴</div>
          {(() => {
            const relOrds = data.ords.filter(o => o.items.some(it => it.pid === selProd.id));
            if (relOrds.length === 0) return <div style={{ padding: 16, color: "var(--text-tertiary)", fontSize: 13, textAlign: "center" }}>受注履歴なし</div>;
            return <Tbl cols={[
              { label: "受注ID", key: "id" },
              { label: "顧客", render: r => (data.custs.find(c => c.id === r.cid) || {}).name || "-" },
              { label: "日付", key: "date" },
              { label: "数量", render: r => { const it = r.items.find(x => x.pid === selProd.id); return it ? it.qty + "個" : "-"; } },
              { label: "状態", render: r => <Badge variant={r.st === "confirmed" ? "success" : r.st === "shipped" ? "info" : "warning"}>{ORDS[r.st]}</Badge> },
            ]} data={relOrds} />;
          })()}
        </Modal>
      )}

      {/* New Order Modal */}
      {showNew && (
        <Modal title="新規受注登録" onClose={() => setShowNew(false)} wide>
          <Fld label="顧客"><select value={newCid} onChange={e => setNewCid(e.target.value)} style={inputStyle}>{data.custs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Fld>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>商品明細</div>
          {newItems.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <select value={it.pid} onChange={e => setNewItems(newItems.map((x, j) => j === i ? { ...x, pid: e.target.value } : x))} style={{ ...inputStyle, flex: 2 }}>{data.prods.map(p => <option key={p.id} value={p.id}>{p.name} ({fmtY(p.price)}) 在庫:{p.stk}</option>)}</select>
              <input type="number" min="1" value={it.qty} onChange={e => setNewItems(newItems.map((x, j) => j === i ? { ...x, qty: Number(e.target.value) } : x))} style={{ ...inputStyle, width: 70, flex: "none" }} />
              {newItems.length > 1 && <Btn variant="ghost" size="sm" onClick={() => setNewItems(newItems.filter((_, j) => j !== i))} style={{ color: "#A32D2D" }}>×</Btn>}
            </div>
          ))}
          <Btn variant="ghost" size="sm" onClick={() => setNewItems([...newItems, { pid: data.prods[0].id, qty: 1 }])}><IcPlus /> 商品を追加</Btn>
          <div style={{ borderTop: "1px solid var(--border-light)", marginTop: 16, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>合計: {fmtY(newTotal)}</div>
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
  const [showNew, setShowNew] = useState(false);
  const [newJrnl, setNewJrnl] = useState({ date: today(), desc: "", drAcc: "消耗品費", drAmt: "", crAcc: "現金", crAmt: "" });

  const tS = data.jrnl.filter(j => j.cr.acc === "売上高").reduce((s, j) => s + j.cr.amt, 0);
  const tE = data.jrnl.filter(j => !["売掛金", "普通預金"].includes(j.dr.acc)).reduce((s, j) => s + j.dr.amt, 0);
  const autoCount = data.jrnl.filter(j => j.auto).length;
  const manualCount = data.jrnl.length - autoCount;

  const accounts = ["現金", "普通預金", "売掛金", "棚卸資産", "固定資産", "買掛金", "未払金", "売上高", "売上原価", "給与手当", "法定福利費", "地代家賃", "消耗品費", "通信費", "旅費交通費", "雑費", "資本金", "利益剰余金"];

  // Account summary for trial balance
  const accSummary = {};
  data.jrnl.forEach(j => {
    if (!accSummary[j.dr.acc]) accSummary[j.dr.acc] = { dr: 0, cr: 0 };
    if (!accSummary[j.cr.acc]) accSummary[j.cr.acc] = { dr: 0, cr: 0 };
    accSummary[j.dr.acc].dr += j.dr.amt;
    accSummary[j.cr.acc].cr += j.cr.amt;
  });

  // P/L detailed
  const cogs = 800000;
  const grossProfit = tS - cogs;
  const rent = data.jrnl.filter(j => j.dr.acc === "地代家賃").reduce((s, j) => s + j.dr.amt, 0);
  const supplies = data.jrnl.filter(j => j.dr.acc === "消耗品費").reduce((s, j) => s + j.dr.amt, 0);
  const payroll = data.jrnl.filter(j => j.dr.acc === "給与手当").reduce((s, j) => s + j.dr.amt, 0);
  const welfare = data.jrnl.filter(j => j.dr.acc === "法定福利費").reduce((s, j) => s + j.dr.amt, 0);
  const operatingProfit = grossProfit - tE;

  // B/S values
  const arBalance = data.invs.reduce((s, i) => s + (i.total - i.paid), 0);
  const inventory = data.prods.reduce((s, p) => s + p.cost * p.stk, 0);
  const totalAssets = 500000 + 8500000 + arBalance + inventory + 3000000;
  const totalLiab = 1200000 + 800000 + 3000000 + 5200000;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>会計・財務</h2>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>仕訳帳・財務諸表・勘定科目管理</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["jnl", "仕訳帳"], ["pl", "損益計算書"], ["bs", "貸借対照表"], ["tb", "試算表"]].map(([k, l]) => (
            <Btn key={k} variant={v === k ? "primary" : "default"} size="md" onClick={() => setV(k)}>{l}</Btn>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        <KPI label="売上高" value={fmtY(tS)} icon={<IcRcpt />} color="#0F6E56" trend="+15%" trendUp />
        <KPI label="営業利益" value={fmtY(operatingProfit)} icon={<IcCalc />} color={operatingProfit >= 0 ? "#0F6E56" : "#A32D2D"} />
        <KPI label="自動仕訳" value={autoCount + "件"} sub={"全" + data.jrnl.length + "件中 (" + Math.round(autoCount / data.jrnl.length * 100) + "%)"} icon={<IcZap />} color={A} />
        <KPI label="経費合計" value={fmtY(tE)} icon={<IcAlrt />} color="#BA7517" />
      </div>

      {/* Journal */}
      {v === "jnl" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn variant="primary" size="sm" onClick={() => setShowNew(true)}><IcPlus /> 手動仕訳追加</Btn>
          </div>
          <Tbl cols={[
            { label: "日付", key: "date" },
            { label: "摘要", render: r => <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{r.auto ? <Badge variant="purple">自動</Badge> : <Badge variant="default">手動</Badge>}<span>{r.desc}</span></div> },
            { label: "借方科目", render: r => <span style={{ fontWeight: 500 }}>{r.dr.acc}</span> },
            { label: "借方金額", render: r => fmtY(r.dr.amt) },
            { label: "貸方科目", render: r => <span style={{ fontWeight: 500 }}>{r.cr.acc}</span> },
            { label: "貸方金額", render: r => fmtY(r.cr.amt) },
            { label: "連携元", render: r => r.ref ? <span style={{ fontSize: 11, color: A, display: "flex", alignItems: "center", gap: 4 }}><IcFlow /> {r.ref}</span> : <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>—</span> },
          ]} data={data.jrnl} />
          <Card style={{ borderLeft: "3px solid " + A, padding: 14 }}>
            <div style={{ fontSize: 13, color: A, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}><IcZap /> 自動仕訳ルール</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.8 }}>
              受注確定 → 売掛金/売上高<br/>入金登録 → 普通預金/売掛金<br/>給与確定 → 給与手当/普通預金 + 法定福利費/未払金
            </div>
          </Card>
        </>
      )}

      {/* P/L */}
      {v === "pl" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>損益計算書 (P/L) — 2025年3月度</h3>
            <Badge variant="info">月次</Badge>
          </div>
          {[
            { l: "売上高", a: tS, bold: true, section: true },
            { l: "売上原価", a: cogs, indent: true },
            { l: "売上総利益", a: grossProfit, bold: true, divider: true },
            { l: "販売費及び一般管理費", a: tE, bold: true, section: true },
            ...(rent > 0 ? [{ l: "　地代家賃", a: rent, indent: true, sub: true }] : []),
            ...(supplies > 0 ? [{ l: "　消耗品費", a: supplies, indent: true, sub: true }] : []),
            ...(payroll > 0 ? [{ l: "　給与手当", a: payroll, indent: true, sub: true }] : []),
            ...(welfare > 0 ? [{ l: "　法定福利費", a: welfare, indent: true, sub: true }] : []),
            { l: "営業利益", a: operatingProfit, bold: true, divider: true, highlight: true },
            { l: "経常利益", a: operatingProfit, bold: true },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: r.section ? "10px 0 4px" : "6px 0", borderTop: r.divider ? "2px solid var(--border-light)" : "none", fontWeight: r.bold ? 600 : 400, fontSize: r.sub ? 12 : 14, color: r.highlight ? "#0F6E56" : r.sub ? "var(--text-tertiary)" : "inherit", paddingLeft: r.indent ? 16 : 0 }}>
              <span>{r.l}</span><span>{fmtY(r.a)}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: 12, background: operatingProfit >= 0 ? "#0F6E5608" : "#A32D2D08", borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>営業利益率</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: operatingProfit >= 0 ? "#0F6E56" : "#A32D2D" }}>{tS ? Math.round(operatingProfit / tS * 100) : 0}%</div>
          </div>
        </Card>
      )}

      {/* B/S */}
      {v === "bs" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px", color: P }}>資産の部</h3>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-tertiary)", margin: "8px 0 4px" }}>流動資産</div>
              {[{ l: "現金", a: 500000 }, { l: "普通預金", a: 8500000 }, { l: "売掛金", a: arBalance }, { l: "棚卸資産", a: inventory }].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 6px 12px", fontSize: 13, borderBottom: "1px solid var(--border-light)" }}>
                  <span>{r.l}</span><span style={{ fontWeight: 500 }}>{fmtY(r.a)}</span>
                </div>
              ))}
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-tertiary)", margin: "12px 0 4px" }}>固定資産</div>
              {[{ l: "有形固定資産", a: 3000000 }].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 6px 12px", fontSize: 13, borderBottom: "1px solid var(--border-light)" }}>
                  <span>{r.l}</span><span style={{ fontWeight: 500 }}>{fmtY(r.a)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontWeight: 700, fontSize: 14, borderTop: "2px solid var(--border-light)", marginTop: 8 }}>
                <span>資産合計</span><span style={{ color: P }}>{fmtY(totalAssets)}</span>
              </div>
            </Card>
            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px", color: "#A32D2D" }}>負債・純資産の部</h3>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-tertiary)", margin: "8px 0 4px" }}>流動負債</div>
              {[{ l: "買掛金", a: 1200000 }, { l: "未払金", a: 800000 }].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 6px 12px", fontSize: 13, borderBottom: "1px solid var(--border-light)" }}>
                  <span>{r.l}</span><span style={{ fontWeight: 500 }}>{fmtY(r.a)}</span>
                </div>
              ))}
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-tertiary)", margin: "12px 0 4px" }}>純資産</div>
              {[{ l: "資本金", a: 3000000 }, { l: "利益剰余金", a: 5200000 }].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 6px 12px", fontSize: 13, borderBottom: "1px solid var(--border-light)" }}>
                  <span>{r.l}</span><span style={{ fontWeight: 500 }}>{fmtY(r.a)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontWeight: 700, fontSize: 14, borderTop: "2px solid var(--border-light)", marginTop: 8 }}>
                <span>負債・純資産合計</span><span style={{ color: "#A32D2D" }}>{fmtY(totalLiab)}</span>
              </div>
            </Card>
          </div>
          {totalAssets !== totalLiab && (
            <Card style={{ borderLeft: "3px solid #BA7517", padding: 12 }}>
              <div style={{ fontSize: 13, color: "#BA7517", fontWeight: 500 }}>※ デモデータのため貸借差額が発生しています（実運用時は自動バランス）</div>
            </Card>
          )}
        </>
      )}

      {/* Trial Balance */}
      {v === "tb" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>合計試算表 — 2025年3月度</h3>
            <Badge variant="info">{Object.keys(accSummary).length}科目</Badge>
          </div>
          <Tbl cols={[
            { label: "勘定科目", render: r => <span style={{ fontWeight: 500 }}>{r.acc}</span> },
            { label: "借方合計", render: r => r.dr > 0 ? fmtY(r.dr) : <span style={{ color: "var(--text-tertiary)" }}>—</span> },
            { label: "貸方合計", render: r => r.cr > 0 ? fmtY(r.cr) : <span style={{ color: "var(--text-tertiary)" }}>—</span> },
            { label: "残高", render: r => {
              const bal = r.dr - r.cr;
              return <span style={{ fontWeight: 600, color: bal > 0 ? P : bal < 0 ? "#A32D2D" : "var(--text-tertiary)" }}>{bal >= 0 ? fmtY(bal) : "△" + fmtY(Math.abs(bal))}</span>;
            }},
          ]} data={Object.entries(accSummary).map(([acc, v]) => ({ acc, dr: v.dr, cr: v.cr }))} />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", fontWeight: 700, fontSize: 14, borderTop: "2px solid var(--border-light)", marginTop: 4 }}>
            <span>合計</span>
            <div style={{ display: "flex", gap: 40 }}>
              <span>{fmtY(Object.values(accSummary).reduce((s, v) => s + v.dr, 0))}</span>
              <span>{fmtY(Object.values(accSummary).reduce((s, v) => s + v.cr, 0))}</span>
            </div>
          </div>
        </Card>
      )}

      {/* New Journal Entry Modal */}
      {showNew && (
        <Modal title="手動仕訳追加" onClose={() => setShowNew(false)} wide>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Fld label="日付"><input type="date" value={newJrnl.date} onChange={e => setNewJrnl({ ...newJrnl, date: e.target.value })} style={inputStyle} /></Fld>
            <Fld label="摘要"><input value={newJrnl.desc} onChange={e => setNewJrnl({ ...newJrnl, desc: e.target.value })} placeholder="取引内容" style={inputStyle} /></Fld>
            <Fld label="借方科目"><select value={newJrnl.drAcc} onChange={e => setNewJrnl({ ...newJrnl, drAcc: e.target.value })} style={inputStyle}>{accounts.map(a => <option key={a} value={a}>{a}</option>)}</select></Fld>
            <Fld label="借方金額"><input type="number" value={newJrnl.drAmt} onChange={e => setNewJrnl({ ...newJrnl, drAmt: e.target.value })} placeholder="0" style={inputStyle} /></Fld>
            <Fld label="貸方科目"><select value={newJrnl.crAcc} onChange={e => setNewJrnl({ ...newJrnl, crAcc: e.target.value })} style={inputStyle}>{accounts.map(a => <option key={a} value={a}>{a}</option>)}</select></Fld>
            <Fld label="貸方金額"><input type="number" value={newJrnl.crAmt} onChange={e => setNewJrnl({ ...newJrnl, crAmt: e.target.value || newJrnl.drAmt })} placeholder={newJrnl.drAmt || "0"} style={inputStyle} /></Fld>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Btn onClick={() => setShowNew(false)}>キャンセル</Btn>
            <Btn variant="primary" disabled={!newJrnl.desc || !newJrnl.drAmt} onClick={() => { /* In real app: setData to add journal entry */ setShowNew(false); }}>仕訳を登録</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function HRView({ data, role, confirmPayroll }) {
  const [v, setV] = useState("emp");
  const [clk, setClk] = useState(false);
  const [pd, setPd] = useState(false);
  const [selEmp, setSelEmp] = useState(null);

  const totalSal = data.emps.reduce((s, e) => s + e.sal, 0);
  const totalSocial = Math.round(totalSal * 0.15);
  const totalTax = Math.round(totalSal * 0.05);
  const totalNet = Math.round(totalSal * 0.80);
  const deptMap = {};
  data.emps.forEach(e => { deptMap[e.dept] = (deptMap[e.dept] || 0) + 1; });

  if (role === "employee") {
    const emp = data.emps[0];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>勤怠・給与</h2>
        {/* Clock */}
        <Card style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 52, fontWeight: 700, marginBottom: 4, letterSpacing: -1 }}>{new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</div>
          <div style={{ fontSize: 14, color: "var(--text-tertiary)", marginBottom: 20 }}>{new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</div>
          <Btn variant={clk ? "danger" : "success"} size="lg" style={{ minWidth: 180 }} onClick={() => setClk(!clk)}>{clk ? "退勤打刻" : "出勤打刻"}</Btn>
          {clk && <div style={{ marginTop: 12, color: "#0F6E56", fontWeight: 500, fontSize: 13 }}>勤務中</div>}
        </Card>
        {/* Employee summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <KPI label="今月の勤務時間" value="156h" sub="残業: 12h" icon={<IcClk />} color={P} />
          <KPI label="有給残日数" value={(emp.pl - emp.ul) + "日"} sub={`${emp.pl}日中 ${emp.ul}日使用`} icon={<IcPpl />} color="#0F6E56" />
          <KPI label="今月の給与" value={fmtY(emp.sal)} icon={<IcRcpt />} color={A} />
        </div>
        {/* Pay slip */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>今月の給与明細</div>
          {[
            { l: "基本給", a: emp.sal },
            { l: "通勤手当", a: 15000 },
            { l: "時間外手当", a: 36000 },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, borderBottom: "1px solid var(--border-light)" }}>
              <span>{r.l}</span><span>{fmtY(r.a)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontWeight: 600, borderTop: "2px solid var(--border-light)", marginTop: 4 }}>
            <span>支給額合計</span><span>{fmtY(emp.sal + 51000)}</span>
          </div>
          <div style={{ marginTop: 8 }}>
            {[
              { l: "健康保険料", a: Math.round(emp.sal * 0.05) },
              { l: "厚生年金", a: Math.round(emp.sal * 0.09) },
              { l: "雇用保険", a: Math.round(emp.sal * 0.006) },
              { l: "所得税", a: Math.round(emp.sal * 0.05) },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12, color: "var(--text-tertiary)" }}>
                <span>{r.l}</span><span>-{fmtY(r.a)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontWeight: 700, fontSize: 16, borderTop: "2px solid var(--border-light)", marginTop: 4, color: "#0F6E56" }}>
            <span>差引支給額</span><span>{fmtY(Math.round(emp.sal * 0.80))}</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>人事・労務</h2>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>従業員管理・勤怠・給与計算</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["emp", "従業員一覧"], ["pay", "給与計算"], ["summary", "人件費分析"]].map(([k, l]) => (
            <Btn key={k} variant={v === k ? "primary" : "default"} size="md" onClick={() => setV(k)}>{l}</Btn>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        <KPI label="従業員数" value={data.emps.length + "名"} icon={<IcPpl />} color={P} />
        <KPI label="人件費合計" value={fmtY(totalSal)} sub="月額" icon={<IcCalc />} color={A} />
        <KPI label="平均給与" value={fmtY(Math.round(totalSal / data.emps.length))} icon={<IcRcpt />} color="#0F6E56" />
        <KPI label="有給取得率" value={Math.round(data.emps.reduce((s, e) => s + e.ul, 0) / data.emps.reduce((s, e) => s + e.pl, 0) * 100) + "%"} icon={<IcClk />} color="#BA7517" />
      </div>

      {/* Employee List */}
      {v === "emp" && (
        <>
          <Tbl cols={[
            { label: "氏名", render: r => <div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{r.email}</div></div> },
            { label: "部署", render: r => <Badge variant="default">{r.dept}</Badge> },
            { label: "役職", key: "role" },
            { label: "入社日", key: "hired" },
            { label: "月給", render: r => <span style={{ fontWeight: 600 }}>{fmtY(r.sal)}</span> },
            { label: "有給残", render: r => {
              const remain = r.pl - r.ul;
              return <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 500, color: remain <= 3 ? "#A32D2D" : "inherit" }}>{remain}日</span>
                <PBar value={r.ul} max={r.pl} color={remain <= 3 ? "#A32D2D" : P} h={4} />
              </div>;
            }},
            { label: "状態", render: () => <Badge variant="success">在籍</Badge> },
          ]} data={data.emps} onRow={r => setSelEmp(selEmp?.id === r.id ? null : r)} />

          {selEmp && (
            <Card style={{ borderLeft: "3px solid " + P }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{selEmp.name}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{selEmp.dept} / {selEmp.role}</div>
                </div>
                <Btn variant="ghost" size="sm" onClick={() => setSelEmp(null)}>閉じる</Btn>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {[
                  { l: "メール", v: selEmp.email },
                  { l: "入社日", v: selEmp.hired },
                  { l: "勤続年数", v: Math.floor((new Date() - new Date(selEmp.hired)) / (365.25 * 86400000)) + "年" },
                  { l: "月給", v: fmtY(selEmp.sal) },
                  { l: "年収（推定）", v: fmtY(selEmp.sal * 12 + selEmp.sal * 3) },
                  { l: "有給残 / 付与", v: `${selEmp.pl - selEmp.ul}日 / ${selEmp.pl}日` },
                ].map((r, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 2 }}>{r.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.v}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Payroll */}
      {v === "pay" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>給与計算 — 2025年3月</div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>支給日: 2025年3月25日</div>
            </div>
            <Badge variant="info">{data.emps.length}名</Badge>
          </div>
          <Tbl cols={[
            { label: "氏名", render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
            { label: "部署", render: r => <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{r.dept}</span> },
            { label: "基本給", render: r => fmtY(r.sal) },
            { label: "健保+厚年", render: r => <span style={{ color: "var(--text-tertiary)" }}>{fmtY(Math.round(r.sal * 0.14))}</span> },
            { label: "雇用保険", render: r => <span style={{ color: "var(--text-tertiary)" }}>{fmtY(Math.round(r.sal * 0.006))}</span> },
            { label: "所得税", render: r => <span style={{ color: "var(--text-tertiary)" }}>{fmtY(Math.round(r.sal * 0.05))}</span> },
            { label: "手取り", render: r => <span style={{ fontWeight: 600, color: "#0F6E56" }}>{fmtY(Math.round(r.sal * 0.804))}</span> },
          ]} data={data.emps} />

          {/* Totals */}
          <div style={{ marginTop: 16, borderTop: "2px solid var(--border-light)", paddingTop: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              {[
                { l: "支給総額", a: totalSal, color: P },
                { l: "社会保険料", a: totalSocial, color: "#BA7517" },
                { l: "源泉所得税", a: totalTax, color: "#A32D2D" },
                { l: "差引支給額", a: totalNet, color: "#0F6E56" },
              ].map(r => (
                <div key={r.l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{r.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: r.color }}>{fmtY(r.a)}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Btn>全銀FBデータ出力</Btn>
            <Btn variant="success" onClick={() => { confirmPayroll(); setPd(true); }} disabled={pd}><IcZap /> 給与確定 → 仕訳自動生成</Btn>
          </div>
          {pd && <div style={{ marginTop: 12, padding: 10, background: "var(--success-bg)", borderRadius: 8, fontSize: 12, color: "var(--success)", display: "flex", alignItems: "center", gap: 6 }}><IcChk /> 給与仕訳（給与手当/普通預金）・社会保険仕訳（法定福利費/未払金）を自動生成しました</div>}

          <Card style={{ borderLeft: "3px solid " + A, marginTop: 12, padding: 14 }}>
            <div style={{ fontSize: 13, color: A, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}><IcZap /> 給与確定時の自動処理</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.8 }}>
              1. 給与仕訳を自動生成（給与手当 / 普通預金）<br/>
              2. 社会保険料仕訳を自動生成（法定福利費 / 未払金）<br/>
              3. 全銀FBデータを出力可能
            </div>
          </Card>
        </Card>
      )}

      {/* Summary */}
      {v === "summary" && (
        <>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>部署別人件費</div>
            {Object.entries(deptMap).map(([dept, count]) => {
              const deptSal = data.emps.filter(e => e.dept === dept).reduce((s, e) => s + e.sal, 0);
              return (
                <div key={dept} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{dept}（{count}名）</span>
                    <span style={{ fontWeight: 600 }}>{fmtY(deptSal)}</span>
                  </div>
                  <PBar value={deptSal} max={totalSal} color={P} h={6} />
                </div>
              );
            })}
          </Card>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>給与分布</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 100, paddingBottom: 4 }}>
              {data.emps.map(e => (
                <div key={e.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{fmtY(e.sal)}</div>
                  <div style={{ width: "60%", height: (e.sal / 500000) * 80, background: P, borderRadius: "4px 4px 0 0", minHeight: 8 }} />
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", textAlign: "center" }}>{e.name.split(" ")[0]}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>有給取得状況</div>
            {data.emps.map(e => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border-light)" }}>
                <span style={{ fontSize: 13, fontWeight: 500, minWidth: 80 }}>{e.name}</span>
                <div style={{ flex: 1 }}><PBar value={e.ul} max={e.pl} color={e.pl - e.ul <= 3 ? "#A32D2D" : "#0F6E56"} h={6} /></div>
                <span style={{ fontSize: 12, color: "var(--text-tertiary)", minWidth: 70, textAlign: "right" }}>{e.ul}/{e.pl}日 ({Math.round(e.ul / e.pl * 100)}%)</span>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

export function BillView({ data, registerPay }) {
  const [v, setV] = useState("list");
  const [pt, setPt] = useState(null);
  const [selInv, setSelInv] = useState(null);
  const [filter, setFilter] = useState("all");

  const totalAmt = data.invs.reduce((s, i) => s + i.total, 0);
  const paidAmt = data.invs.reduce((s, i) => s + i.paid, 0);
  const unpaid = totalAmt - paidAmt;
  const overdueCount = data.invs.filter(i => i.st !== "paid" && i.due < today()).length;
  const collectionRate = totalAmt ? Math.round(paidAmt / totalAmt * 100) : 0;

  const filteredInvs = data.invs.filter(i => {
    if (filter === "all") return true;
    if (filter === "unpaid") return i.st !== "paid";
    if (filter === "overdue") return i.st !== "paid" && i.due < today();
    if (filter === "paid") return i.st === "paid";
    return true;
  });

  // Aging analysis
  const aging = { current: 0, d30: 0, d60: 0, d90: 0 };
  const now = new Date();
  data.invs.filter(i => i.st !== "paid").forEach(i => {
    const diff = Math.floor((now - new Date(i.due)) / 86400000);
    const amt = i.total - i.paid;
    if (diff <= 0) aging.current += amt;
    else if (diff <= 30) aging.d30 += amt;
    else if (diff <= 60) aging.d60 += amt;
    else aging.d90 += amt;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>請求・入金管理</h2>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>請求書の発行・入金消込を一元管理</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant={v === "list" ? "primary" : "default"} size="md" onClick={() => setV("list")}>請求一覧</Btn>
          <Btn variant={v === "aging" ? "primary" : "default"} size="md" onClick={() => setV("aging")}>売掛金分析</Btn>
          <Btn variant={v === "cust" ? "primary" : "default"} size="md" onClick={() => setV("cust")}>顧客別</Btn>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        <KPI label="請求総額" value={fmtY(totalAmt)} icon={<IcRcpt />} color={P} />
        <KPI label="入金済" value={fmtY(paidAmt)} sub={`回収率 ${collectionRate}%`} icon={<IcChk />} color="#0F6E56" />
        <KPI label="未回収" value={fmtY(unpaid)} icon={<IcAlrt />} color={unpaid > 0 ? "#A32D2D" : "#0F6E56"} />
        <KPI label="期限超過" value={overdueCount + "件"} icon={<IcClk />} color={overdueCount > 0 ? "#BA7517" : "#0F6E56"} />
      </div>

      {/* Invoice List */}
      {v === "list" && (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            {[["all", "すべて"], ["unpaid", "未回収"], ["overdue", "期限超過"], ["paid", "入金済"]].map(([k, l]) => (
              <Btn key={k} variant={filter === k ? "primary" : "default"} size="sm" onClick={() => setFilter(k)}>{l}{k === "unpaid" ? ` (${data.invs.filter(i => i.st !== "paid").length})` : k === "overdue" ? ` (${overdueCount})` : ""}</Btn>
            ))}
          </div>
          <Tbl cols={[
            { label: "請求書No", render: r => <span style={{ fontWeight: 500 }}>{r.id}</span> },
            { label: "顧客", render: r => { const c = data.custs.find(c => c.id === r.cid); return c ? c.name : "-"; } },
            { label: "発行日", key: "date" },
            { label: "支払期日", render: r => {
              const overdue = r.st !== "paid" && r.due < today();
              return <span style={{ color: overdue ? "#A32D2D" : "inherit", fontWeight: overdue ? 600 : 400 }}>{r.due}{overdue ? " ⚠" : ""}</span>;
            }},
            { label: "税抜", render: r => <span style={{ color: "var(--text-tertiary)" }}>{fmtY(r.amt)}</span> },
            { label: "消費税", render: r => <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>{fmtY(r.tax)}</span> },
            { label: "税込合計", render: r => <span style={{ fontWeight: 600 }}>{fmtY(r.total)}</span> },
            { label: "入金額", render: r => <span style={{ fontWeight: 500, color: r.paid > 0 ? "#0F6E56" : "var(--text-tertiary)" }}>{fmtY(r.paid)}</span> },
            { label: "状態", render: r => {
              const overdue = r.st !== "paid" && r.due < today();
              return <Badge variant={r.st === "paid" ? "success" : overdue ? "danger" : r.st === "partial" ? "warning" : "info"}>
                {r.st === "paid" ? "入金済" : overdue ? "期限超過" : r.st === "partial" ? "一部入金" : "送付済"}
              </Badge>;
            }},
            { label: "操作", render: r => r.st !== "paid" ? (
              <Btn variant="success" size="sm" onClick={e => { e.stopPropagation(); setPt(r); }}><IcZap /> 入金登録</Btn>
            ) : <span style={{ color: "#0F6E56", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}><IcChk /> 完了</span> },
          ]} data={filteredInvs} onRow={r => setSelInv(selInv?.id === r.id ? null : r)} />

          {/* Invoice detail expand */}
          {selInv && (
            <Card style={{ borderLeft: "3px solid " + P }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>請求書詳細 — {selInv.id}</div>
                <Btn variant="ghost" size="sm" onClick={() => setSelInv(null)}>閉じる</Btn>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 13 }}>
                  <div style={{ color: "var(--text-tertiary)", marginBottom: 4 }}>顧客</div>
                  <div style={{ fontWeight: 500 }}>{(data.custs.find(c => c.id === selInv.cid) || {}).name}</div>
                </div>
                <div style={{ fontSize: 13 }}>
                  <div style={{ color: "var(--text-tertiary)", marginBottom: 4 }}>受注ID</div>
                  <div style={{ fontWeight: 500 }}>{selInv.oid}</div>
                </div>
                <div style={{ fontSize: 13 }}>
                  <div style={{ color: "var(--text-tertiary)", marginBottom: 4 }}>状態</div>
                  <Badge variant={selInv.st === "paid" ? "success" : "info"}>{selInv.st === "paid" ? "入金済" : "送付済"}</Badge>
                </div>
              </div>
              {/* Invoice items from linked order */}
              {(() => {
                const ord = data.ords.find(o => o.id === selInv.oid);
                if (!ord) return null;
                return <Tbl cols={[
                  { label: "商品", render: r => { const p = data.prods.find(x => x.id === r.pid); return p ? p.name : r.pid; } },
                  { label: "数量", render: r => <span style={{ fontWeight: 500 }}>{r.qty}</span> },
                  { label: "単価", render: r => fmtY(r.pr) },
                  { label: "小計", render: r => <span style={{ fontWeight: 600 }}>{fmtY(r.qty * r.pr)}</span> },
                ]} data={ord.items} />;
              })()}
              <div style={{ marginTop: 12, borderTop: "1px solid var(--border-light)", paddingTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: "var(--text-tertiary)" }}>小計</span><span>{fmtY(selInv.amt)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: "var(--text-tertiary)" }}>消費税（10%）</span><span>{fmtY(selInv.tax)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, borderTop: "1px solid var(--border-light)", paddingTop: 8 }}>
                  <span>合計</span><span>{fmtY(selInv.total)}</span>
                </div>
                {selInv.paid > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 8, color: "#0F6E56" }}>
                    <span>入金済</span><span style={{ fontWeight: 600 }}>{fmtY(selInv.paid)}</span>
                  </div>
                )}
                {selInv.st !== "paid" && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 4, color: "#A32D2D" }}>
                    <span>未回収残高</span><span style={{ fontWeight: 600 }}>{fmtY(selInv.total - selInv.paid)}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card style={{ borderLeft: "3px solid " + A, padding: 14 }}>
            <div style={{ fontSize: 13, color: A, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}><IcZap /> 自動連携フロー</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.8 }}>
              1. 受注確定 → 請求書を自動生成（税込・支払期限30日）<br/>
              2. 入金登録 → 売掛金消込仕訳を自動生成（普通預金/売掛金）<br/>
              3. 全額入金 → 請求書ステータスを「入金済」に自動更新
            </div>
          </Card>
        </>
      )}

      {/* Aging Analysis */}
      {v === "aging" && (
        <>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>売掛金エイジング分析</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              {[
                { label: "期限内", amount: aging.current, color: "#0F6E56" },
                { label: "1〜30日超過", amount: aging.d30, color: "#BA7517" },
                { label: "31〜60日超過", amount: aging.d60, color: "#D85A30" },
                { label: "60日以上超過", amount: aging.d90, color: "#A32D2D" },
              ].map(a => (
                <div key={a.label} style={{ textAlign: "center", padding: 16, borderRadius: 10, background: a.amount > 0 ? a.color + "08" : "var(--bg-secondary)" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: a.amount > 0 ? a.color : "var(--text-tertiary)" }}>{fmtY(a.amount)}</div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>{a.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: "var(--bg-secondary)" }}>
                {unpaid > 0 && <>
                  {aging.current > 0 && <div style={{ width: `${aging.current / unpaid * 100}%`, background: "#0F6E56" }} />}
                  {aging.d30 > 0 && <div style={{ width: `${aging.d30 / unpaid * 100}%`, background: "#BA7517" }} />}
                  {aging.d60 > 0 && <div style={{ width: `${aging.d60 / unpaid * 100}%`, background: "#D85A30" }} />}
                  {aging.d90 > 0 && <div style={{ width: `${aging.d90 / unpaid * 100}%`, background: "#A32D2D" }} />}
                </>}
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>回収率推移</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 80 }}>
              {[65, 72, 68, 75, 80, collectionRate].map((v, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                  <div style={{ width: "60%", height: v * 0.7, background: i === 5 ? P : P + "40", borderRadius: "4px 4px 0 0" }} />
                  <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{["10月", "11月", "12月", "1月", "2月", "3月"][i]}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>未回収請求書</div>
            {data.invs.filter(i => i.st !== "paid").length > 0 ? (
              <Tbl cols={[
                { label: "請求書", render: r => <span style={{ fontWeight: 500 }}>{r.id}</span> },
                { label: "顧客", render: r => (data.custs.find(c => c.id === r.cid) || {}).name || "-" },
                { label: "期日", render: r => {
                  const overdue = r.due < today();
                  return <span style={{ color: overdue ? "#A32D2D" : "inherit", fontWeight: overdue ? 600 : 400 }}>{r.due}</span>;
                }},
                { label: "未回収額", render: r => <span style={{ fontWeight: 600, color: "#A32D2D" }}>{fmtY(r.total - r.paid)}</span> },
                { label: "操作", render: r => <Btn variant="success" size="sm" onClick={e => { e.stopPropagation(); setPt(r); }}><IcZap /> 入金登録</Btn> },
              ]} data={data.invs.filter(i => i.st !== "paid")} />
            ) : (
              <div style={{ padding: 24, textAlign: "center", color: "#0F6E56", fontSize: 14, fontWeight: 500 }}>✓ すべての請求が回収済みです</div>
            )}
          </Card>
        </>
      )}

      {/* Customer Summary */}
      {v === "cust" && (
        <>
          {(() => {
            const custMap = {};
            data.invs.forEach(inv => {
              if (!custMap[inv.cid]) custMap[inv.cid] = { total: 0, paid: 0, count: 0, unpaidCount: 0 };
              custMap[inv.cid].total += inv.total;
              custMap[inv.cid].paid += inv.paid;
              custMap[inv.cid].count++;
              if (inv.st !== "paid") custMap[inv.cid].unpaidCount++;
            });
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.entries(custMap).map(([cid, info]) => {
                  const cust = data.custs.find(c => c.id === cid);
                  const rate = info.total ? Math.round(info.paid / info.total * 100) : 0;
                  return (
                    <Card key={cid}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{cust ? cust.name : cid}</div>
                          <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>請求書 {info.count}件{info.unpaidCount > 0 ? ` / 未回収 ${info.unpaidCount}件` : ""}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: P }}>{fmtY(info.total)}</div>
                          <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>回収率 {rate}%</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <PBar value={info.paid} max={info.total || 1} color={rate >= 100 ? "#0F6E56" : rate >= 50 ? "#BA7517" : "#A32D2D"} h={6} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>
                          <span>入金済: {fmtY(info.paid)}</span>
                          <span>未回収: {fmtY(info.total - info.paid)}</span>
                        </div>
                      </div>
                      {/* List invoices for this customer */}
                      <div style={{ marginTop: 12 }}>
                        {data.invs.filter(i => i.cid === cid).map(inv => (
                          <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--border-light)", fontSize: 13 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 500 }}>{inv.id}</span>
                              <span style={{ color: "var(--text-tertiary)" }}>{inv.date}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 600 }}>{fmtY(inv.total)}</span>
                              <Badge variant={inv.st === "paid" ? "success" : "info"}>{inv.st === "paid" ? "入金済" : "送付済"}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
        </>
      )}

      {/* Payment Modal */}
      {pt && (
        <Modal title="入金登録" onClose={() => setPt(null)}>
          <Fld label="顧客"><div style={{ fontWeight: 500, fontSize: 14 }}>{(data.custs.find(c => c.id === pt.cid) || {}).name}</div></Fld>
          <Fld label="請求書">{pt.id} — 請求額 {fmtY(pt.total)}</Fld>
          {pt.paid > 0 && <Fld label="既入金額"><span style={{ color: "#0F6E56", fontWeight: 500 }}>{fmtY(pt.paid)}</span></Fld>}
          <Fld label="未回収額"><span style={{ fontWeight: 600, color: "#A32D2D", fontSize: 16 }}>{fmtY(pt.total - pt.paid)}</span></Fld>
          <Card style={{ background: A + "08", borderLeft: "3px solid " + A, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: A, fontWeight: 500 }}><IcZap /> 入金登録時の自動処理</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>入金登録 → 売掛金消込仕訳を自動生成（普通預金/売掛金）</div>
          </Card>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Btn onClick={() => setPt(null)}>キャンセル</Btn>
            <Btn variant="success" onClick={() => { registerPay(pt.id, pt.total - pt.paid); setPt(null); }}><IcZap /> 全額入金を登録</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function AutoLogView({ data }) {
  const [v, setV] = useState("log");
  const [filter, setFilter] = useState("all");
  const tc = { "受注確定": P, "請求書発行": "#0F6E56", "入金登録": A, "給与確定": "#854F0B" };
  const triggers = [...new Set(data.alog.map(l => l.trig))];
  const filtered = filter === "all" ? data.alog : data.alog.filter(l => l.trig === filter);

  const flows = [
    { from: "受注確定", actions: ["請求書自動生成", "売上仕訳自動生成", "在庫自動引当・出庫"], color: P, icon: "📦" },
    { from: "入金登録", actions: ["売掛金消込仕訳"], color: A, icon: "💰" },
    { from: "給与確定", actions: ["給与仕訳自動生成", "社会保険仕訳自動生成"], color: "#854F0B", icon: "💼" },
    { from: "請求書発行", actions: ["売上計上仕訳"], color: "#0F6E56", icon: "📄" },
  ];

  // Stats
  const trigCount = {};
  data.alog.forEach(l => { trigCount[l.trig] = (trigCount[l.trig] || 0) + 1; });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>データ連携</h2>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>モジュール間の自動連携フローとログ</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["log", "連携ログ"], ["flows", "連携フロー"], ["stats", "統計"]].map(([k, l]) => (
            <Btn key={k} variant={v === k ? "primary" : "default"} size="md" onClick={() => setV(k)}>{l}</Btn>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        <KPI label="総連携件数" value={data.alog.length + "件"} icon={<IcFlow />} color={A} />
        <KPI label="受注連携" value={(trigCount["受注確定"] || 0) + "件"} icon={<IcZap />} color={P} />
        <KPI label="入金連携" value={(trigCount["入金登録"] || 0) + "件"} icon={<IcChk />} color="#0F6E56" />
        <KPI label="給与連携" value={(trigCount["給与確定"] || 0) + "件"} icon={<IcPpl />} color="#854F0B" />
      </div>

      {/* Log */}
      {v === "log" && (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant={filter === "all" ? "primary" : "default"} size="sm" onClick={() => setFilter("all")}>すべて ({data.alog.length})</Btn>
            {triggers.map(t => (
              <Btn key={t} variant={filter === t ? "primary" : "default"} size="sm" onClick={() => setFilter(t)}>
                {t} ({data.alog.filter(l => l.trig === t).length})
              </Btn>
            ))}
          </div>
          <Card style={{ padding: 0 }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-light)", fontSize: 13, fontWeight: 500, display: "flex", justifyContent: "space-between" }}>
              <span>タイムライン</span>
              <Badge variant="purple">{filtered.length}件</Badge>
            </div>
            {[...filtered].reverse().map(l => (
              <div key={l.id} style={{ display: "flex", gap: 14, padding: "14px 20px", borderBottom: "1px solid var(--border-light)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: (tc[l.trig] || "#888") + "12", display: "flex", alignItems: "center", justifyContent: "center", color: tc[l.trig] || "#888", flexShrink: 0 }}>
                  <IcZap />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Badge variant={l.trig === "受注確定" ? "info" : l.trig === "入金登録" ? "purple" : l.trig === "給与確定" ? "warning" : "success"}>{l.trig}</Badge>
                    <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>→</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{l.act}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{l.det}</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{l.ts}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Badge variant="success">完了</Badge>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* Flows */}
      {v === "flows" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {flows.map(f => (
            <Card key={f.from} style={{ borderLeft: "3px solid " + f.color }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>{f.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: f.color }}>{f.from}</span>
                <Badge variant="success">有効</Badge>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {f.actions.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: f.color + "08", borderRadius: 8 }}>
                    <span style={{ color: f.color, fontSize: 13 }}>→</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{a}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-tertiary)" }}>自動</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
          <Card style={{ borderLeft: "3px solid " + A, padding: 14 }}>
            <div style={{ fontSize: 13, color: A, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}><IcZap /> 連携の仕組み</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.8 }}>
              各モジュールでトリガーアクション（受注確定、入金登録など）が実行されると、関連する他モジュールの処理が自動で実行されます。すべての連携はログに記録され、トレーサビリティを確保します。
            </div>
          </Card>
        </div>
      )}

      {/* Stats */}
      {v === "stats" && (
        <>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>トリガー別実行回数</div>
            {Object.entries(trigCount).map(([trig, count]) => (
              <div key={trig} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500, color: tc[trig] || "inherit" }}>{trig}</span>
                  <span style={{ fontWeight: 600 }}>{count}件</span>
                </div>
                <PBar value={count} max={Math.max(...Object.values(trigCount))} color={tc[trig] || "#888"} h={6} />
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>連携パフォーマンス</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {[
                { l: "成功率", v: "100%", color: "#0F6E56" },
                { l: "平均処理時間", v: "0.3秒", color: P },
                { l: "エラー件数", v: "0件", color: "#0F6E56" },
              ].map(r => (
                <div key={r.l} style={{ textAlign: "center", padding: 16, borderRadius: 10, background: r.color + "08" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: r.color }}>{r.v}</div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>{r.l}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export function SettView({ data }) {
  const [v, setV] = useState("company");
  const autoRules = [
    { name: "受注確定 → 請求書自動生成", mod: "請求", enabled: true },
    { name: "請求書発行 → 売上仕訳", mod: "会計", enabled: true },
    { name: "受注確定 → 在庫引当・出庫", mod: "在庫", enabled: true },
    { name: "入金登録 → 消込仕訳", mod: "会計", enabled: true },
    { name: "給与確定 → 給与仕訳", mod: "会計", enabled: true },
    { name: "給与確定 → 社保仕訳", mod: "会計", enabled: true },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>設定</h2>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>会社情報・連携ルール・システム設定</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["company", "会社情報"], ["auto", "自動連携"], ["system", "システム"]].map(([k, l]) => (
            <Btn key={k} variant={v === k ? "primary" : "default"} size="md" onClick={() => setV(k)}>{l}</Btn>
          ))}
        </div>
      </div>

      {/* Company */}
      {v === "company" && (
        <>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px" }}>会社基本情報</h3>
            {[
              { l: "会社名", v: data.company.name },
              { l: "プラン", v: "Pro", badge: true },
              { l: "登録日", v: "2024年1月15日" },
              { l: "従業員数", v: data.emps.length + "名" },
              { l: "商品数", v: data.prods.length + "SKU" },
              { l: "顧客数", v: data.custs.length + "社" },
            ].map(r => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
                <span style={{ color: "var(--text-secondary)" }}>{r.l}</span>
                {r.badge ? <Badge variant="purple">{r.v}</Badge> : <span style={{ fontWeight: 500 }}>{r.v}</span>}
              </div>
            ))}
          </Card>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px" }}>会計設定</h3>
            {[
              { l: "会計期間", v: "4月〜3月（3月決算）" },
              { l: "消費税率", v: "10%" },
              { l: "課税方式", v: "税抜経理" },
              { l: "通貨", v: "JPY（日本円）" },
            ].map(r => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
                <span style={{ color: "var(--text-secondary)" }}>{r.l}</span>
                <span style={{ fontWeight: 500 }}>{r.v}</span>
              </div>
            ))}
          </Card>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px" }}>人事設定</h3>
            {[
              { l: "給与支給日", v: "毎月25日" },
              { l: "締め日", v: "毎月末日" },
              { l: "社会保険料率（会社負担）", v: "約15%" },
              { l: "有給付与ルール", v: "法定基準（勤続年数ベース）" },
            ].map(r => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
                <span style={{ color: "var(--text-secondary)" }}>{r.l}</span>
                <span style={{ fontWeight: 500 }}>{r.v}</span>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* Auto Rules */}
      {v === "auto" && (
        <>
          <Card style={{ borderLeft: "3px solid " + A }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>自動連携ルール</h3>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "0 0 16px" }}>有効なルールは、トリガーアクション実行時に自動で処理されます</p>
            {autoRules.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-light)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <IcZap />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>対象: {r.mod}モジュール</div>
                  </div>
                </div>
                <Badge variant="success">有効</Badge>
              </div>
            ))}
          </Card>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px" }}>通知設定</h3>
            {[
              { l: "低在庫アラート", v: true },
              { l: "入金期限超過通知", v: true },
              { l: "給与計算リマインダー", v: true },
              { l: "日次自動連携レポート", v: false },
            ].map(r => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
                <span>{r.l}</span>
                <Badge variant={r.v ? "success" : "default"}>{r.v ? "有効" : "無効"}</Badge>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* System */}
      {v === "system" && (
        <>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px" }}>システム情報</h3>
            {[
              { l: "バージョン", v: "Operai v1.0.0" },
              { l: "環境", v: "本番 (Production)" },
              { l: "ホスティング", v: "Vercel" },
              { l: "データベース", v: "Supabase" },
              { l: "認証", v: "Supabase Auth（Email/Password）" },
            ].map(r => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
                <span style={{ color: "var(--text-secondary)" }}>{r.l}</span>
                <span style={{ fontWeight: 500 }}>{r.v}</span>
              </div>
            ))}
          </Card>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px" }}>セキュリティ</h3>
            {[
              { l: "認証方式", v: "HTTPOnly Cookie", ok: true },
              { l: "セッション管理", v: "ミドルウェアガード", ok: true },
              { l: "ロールベースアクセス", v: "会社/従業員 2ロール", ok: true },
              { l: "二要素認証（2FA）", v: "未対応", ok: false },
              { l: "IP制限", v: "未対応", ok: false },
              { l: "監査ログ", v: "連携ログで代替", ok: true },
            ].map(r => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
                <span style={{ color: "var(--text-secondary)" }}>{r.l}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 500 }}>{r.v}</span>
                  <Badge variant={r.ok ? "success" : "warning"}>{r.ok ? "対応済" : "今後対応"}</Badge>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px" }}>データ管理</h3>
            {[
              { l: "顧客データ", v: data.custs.length + "件" },
              { l: "商品マスタ", v: data.prods.length + "件" },
              { l: "受注データ", v: data.ords.length + "件" },
              { l: "請求書データ", v: data.invs.length + "件" },
              { l: "仕訳データ", v: data.jrnl.length + "件" },
              { l: "連携ログ", v: data.alog.length + "件" },
            ].map(r => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
                <span style={{ color: "var(--text-secondary)" }}>{r.l}</span>
                <span style={{ fontWeight: 500 }}>{r.v}</span>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
