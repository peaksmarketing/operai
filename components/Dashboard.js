'use client';
import { Badge, Card, KPI, Tbl, PBar } from './UI';
import { IcRcpt, IcUsers, IcChk, IcZap, IcClk, IcPpl, IcBox, IcAlrt } from './Icons';
import { fmtY } from './useAuto';

const P = "#2b6876";
const A = "#534AB7";
const STG = { qualification: "精査", proposal: "提案", negotiation: "交渉" };
const STGC = { qualification: "#854F0B", proposal: P, negotiation: A };
const ORDS = { pending: "未確認", confirmed: "確定", shipped: "出荷済" };

/* Simple bar chart using divs */
function MiniChart({ data, color, labels }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: "100%", borderRadius: "4px 4px 0 0",
            height: max ? Math.max(4, (v / max) * 80) : 4,
            background: color || P,
            opacity: 0.15 + (v / max) * 0.85,
            transition: "height 0.4s ease",
          }} />
          <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{labels ? labels[i] : ""}</span>
        </div>
      ))}
    </div>
  );
}

/* Donut-style ring for collection rate */
function RingChart({ value, max, color, label }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * pct) / 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--border-light)" strokeWidth="8" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color || P} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text x="44" y="44" textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 18, fontWeight: 700, fill: "var(--text-primary)" }}>
          {pct}%
        </text>
      </svg>
      <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

export default function Dashboard({ data, role }) {
  const tR = data.invs.reduce((s, i) => s + i.amt, 0);
  const pR = data.invs.filter(i => i.st === "paid").reduce((s, i) => s + i.paid, 0);
  const invTotal = data.invs.reduce((s, i) => s + i.total, 0);
  const oD = data.deals.filter(d => d.stage !== "won" && d.stage !== "lost");
  const pV = oD.reduce((s, d) => s + d.val, 0);
  const lowStock = data.prods.filter(p => p.stk <= p.min);

  const monthlyData = [280, 320, 290, 350, 410, 380, 450, 420, 480, 520, 490, tR / 10000];
  const monthLabels = ["4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月"];

  /* Employee view */
  if (role === "employee") {
    const e = data.emps[0];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>
            おはようございます、{e.name}さん
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>
            {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
          </p>
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
              <div>
                <div style={{ fontSize: 13 }}>{n.msg}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 3 }}>{n.date}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  /* Company view */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>経営ダッシュボード</h2>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>
            {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })} 時点
          </p>
        </div>
        <Badge variant="info">リアルタイム更新</Badge>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
        <KPI label="月間売上高" value={fmtY(tR)} trend="+12.5% 前月比" trendUp icon={<IcRcpt />} color={P} />
        <KPI label="パイプライン" value={fmtY(pV)} sub={`${oD.length}件の進行中案件`} icon={<IcUsers />} color={A} />
        <KPI label="入金済み" value={fmtY(pR)} sub={`回収率 ${invTotal ? Math.round(pR / invTotal * 100) : 0}%`} icon={<IcChk />} color="#0F6E56" />
        <KPI label="在庫アラート" value={lowStock.length + "件"} sub="要発注商品" icon={lowStock.length > 0 ? <IcAlrt /> : <IcBox />} color={lowStock.length > 0 ? "#A32D2D" : "#0F6E56"} />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        {/* Monthly revenue chart */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>月間売上推移</div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>過去12ヶ月</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: P }}>{fmtY(tR)}</div>
          </div>
          <MiniChart data={monthlyData} color={P} labels={monthLabels} />
        </Card>

        {/* Collection ring */}
        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <RingChart value={pR} max={invTotal} color={P} label="回収率" />
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-tertiary)", textAlign: "center" }}>
            {fmtY(pR)} / {fmtY(invTotal)}
          </div>
        </Card>
      </div>

      {/* Pipeline + Automation row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Pipeline */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>案件パイプライン</div>
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{fmtY(pV)}</span>
          </div>
          {["qualification", "proposal", "negotiation"].map(s => {
            const sd = data.deals.filter(d => d.stage === s);
            const t = sd.reduce((a, d) => a + d.val, 0);
            return (
              <div key={s} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: STGC[s] }} />
                    <span style={{ fontWeight: 500 }}>{STG[s]}</span>
                    <span style={{ color: "var(--text-tertiary)" }}>{sd.length}件</span>
                  </div>
                  <span style={{ fontWeight: 600, color: STGC[s] }}>{fmtY(t)}</span>
                </div>
                <PBar value={t} max={pV || 1} color={STGC[s]} h={8} />
              </div>
            );
          })}
          {/* Deal list */}
          <div style={{ marginTop: 8, borderTop: "1px solid var(--border-light)", paddingTop: 12 }}>
            {oD.slice(0, 3).map(d => {
              const cn = (data.custs.find(c => c.id === d.cid) || {}).name || "";
              return (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", fontSize: 12 }}>
                  <div>
                    <span style={{ fontWeight: 500 }}>{d.title}</span>
                    <span style={{ color: "var(--text-tertiary)", marginLeft: 8 }}>{cn}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: STGC[d.stage] }}>{fmtY(d.val)}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Automation Log */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>自動処理ログ</div>
            <Badge variant="purple">{data.alog.length}件</Badge>
          </div>
          {data.alog.slice(-5).reverse().map(l => {
            const tc = { "受注確定": P, "請求書発行": "#0F6E56", "入金登録": A, "給与確定": "#854F0B" };
            const c = tc[l.trig] || "#888";
            return (
              <div key={l.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border-light)" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: c + "14", display: "flex", alignItems: "center", justifyContent: "center", color: c, flexShrink: 0 }}>
                  <IcZap />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: c, padding: "1px 6px", borderRadius: 4, background: c + "10" }}>{l.trig}</span>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{l.act}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 3 }}>{l.det}</div>
                </div>
                <span style={{ fontSize: 10, color: "var(--text-tertiary)", whiteSpace: "nowrap", flexShrink: 0 }}>{l.ts}</span>
              </div>
            );
          })}
        </Card>
      </div>

      {/* AI Insights */}
      <Card style={{ borderLeft: "3px solid " + A, background: A + "04" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: A + "18", display: "flex", alignItems: "center", justifyContent: "center", color: A }}>
              <IcZap />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: A }}>AI経営参謀のインサイト</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>全モジュールのデータをAIが分析</div>
            </div>
          </div>
          <Badge variant="purple">AI分析</Badge>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { icon: "📊", title: "売上トレンド", desc: "直近3ヶ月で上昇傾向。来月の予測売上は前月比+8%", color: "#0F6E56" },
            { icon: "⚠️", title: "在庫アラート", desc: lowStock.length > 0 ? `${lowStock.length}商品が発注点以下。AI推奨: 即時発注` : "在庫は適正水準です", color: lowStock.length > 0 ? "#BA7517" : "#0F6E56" },
            { icon: "💰", title: "回収リスク", desc: invTotal - pR > 0 ? `未回収${fmtY(invTotal - pR)}。高リスク案件の早期フォローを推奨` : "全額回収済み", color: invTotal - pR > 0 ? "#BA7517" : "#0F6E56" },
          ].map((item, i) => (
            <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.title}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Orders */}
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

      {/* Notifications */}
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
