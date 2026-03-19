'use client';
import { useState, useRef, useEffect } from 'react';
import { Badge, Card, KPI, Tbl, Btn, PBar, Modal, Fld, inputStyle } from './UI';
import { IcAi, IcZap, IcSnd, IcChk, IcAlrt, IcRcpt, IcCalc, IcBox, IcUsers, IcPpl, IcFlow } from './Icons';
import { fmtY, today } from './useAuto';

const P = "#2b6876", A = "#534AB7";

/* ========================================
   1. AI Chat (independent page with action sidebar)
   ======================================== */
export function AIChatPage({ data }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Operai AIアシスタントです。業務に関するご質問や、データ分析・操作をお手伝いします。\n\n右側のアクションボタンからも直接操作できます。" }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const chatEnd = useRef(null);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const respond = (text) => {
    const tR = data.invs.reduce((s, i) => s + i.amt, 0);
    const unpaid = data.invs.reduce((s, i) => s + (i.total - i.paid), 0);
    const lowStk = data.prods.filter(p => p.stk <= p.min);
    const t = text.toLowerCase();
    let reply = "";
    if (t.includes("売上") || t.includes("分析")) reply = `現在の売上は${fmtY(tR)}です。前月比+12.5%の成長トレンドです。\n\nAI分析: パイプラインに${data.deals.filter(d => d.stage !== "won").length}件の案件があり、期待値は${fmtY(data.deals.filter(d => d.stage !== "won").reduce((s,d) => s + d.val * d.prob / 100, 0))}です。上位案件のクロージングを推奨します。`;
    else if (t.includes("顧客")) reply = `登録顧客: ${data.custs.length}社\nアクティブ: ${data.custs.filter(c => c.st === "active").length}社\n\n平均AIスコア: ${Math.round(data.custs.reduce((s,c) => s + c.score, 0) / data.custs.length)}点\nスコア70以上の優良顧客が${data.custs.filter(c => c.score >= 70).length}社あります。`;
    else if (t.includes("在庫") || t.includes("最適化")) reply = `在庫アラート: ${lowStk.length}件\n${lowStk.map(p => `・${p.name}: 残${p.stk}個（発注点${p.min}）`).join('\n')}\n\nAI推奨: ${lowStk.length > 0 ? '低在庫商品の即時発注を推奨します。' : '在庫は適正水準です。'}`;
    else if (t.includes("キャッシュ") || t.includes("CF") || t.includes("資金")) reply = `現預金: ${fmtY(9000000)}\n売掛金残高: ${fmtY(unpaid)}\n月次支出: 約${fmtY(data.emps.reduce((s,e) => s + e.sal, 0))}\n\nランウェイ: 約6.2ヶ月\n回収率: ${data.invs.reduce((s,i) => s+i.total, 0) ? Math.round(data.invs.reduce((s,i) => s+i.paid, 0) / data.invs.reduce((s,i) => s+i.total, 0) * 100) : 0}%`;
    else if (t.includes("給与")) reply = `従業員: ${data.emps.length}名\n総支給額: ${fmtY(data.emps.reduce((s,e) => s+e.sal, 0))}\n平均給与: ${fmtY(Math.round(data.emps.reduce((s,e) => s+e.sal, 0) / data.emps.length))}\n\n給与確定で仕訳が自動生成されます。`;
    else if (t.includes("経営") || t.includes("改善")) reply = `【AI経営診断】総合評価: B+\n\n強み:\n・売上の安定成長トレンド\n・自動連携による業務効率化\n\n改善点:\n・売掛金回収サイクルの短縮\n・パイプライン成約率の向上\n\n推奨アクション:\n1. 期限超過の請求書フォローアップ\n2. 上位案件の早期クロージング\n3. 低在庫商品の発注`;
    else if (t.includes("請求書") || t.includes("作成")) reply = "請求書作成機能をご利用ください。\n\n受注確定時に自動で請求書が生成されます。手動作成は「請求・入金管理」画面から行えます。";
    else if (t.includes("仕訳")) reply = `仕訳件数: ${data.jrnl.length}件\n自動仕訳率: ${Math.round(data.jrnl.filter(j => j.auto).length / data.jrnl.length * 100)}%\n\n受注確定・入金登録・給与確定時に仕訳が自動生成されます。手動仕訳は「会計・財務」画面から追加できます。`;
    else reply = "ご質問ありがとうございます。\n\n右側の分析アクション・データ入力ボタンから、具体的な操作を実行できます。\n\n例: 「売上を分析して」「在庫の状態は？」「経営改善のアドバイス」など";
    return reply;
  };

  const send = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "ai", text: respond(msg) }]);
      setTyping(false);
    }, 600 + Math.random() * 800);
  };

  const ActionBtn = ({ icon, label, query }) => (
    <div onClick={() => send(query)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "var(--text-secondary)", transition: "0.15s", background: "var(--bg-secondary)" }}
      onMouseEnter={e => { e.currentTarget.style.background = A + "12"; e.currentTarget.style.color = A; }}
      onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
      <span style={{ color: A, display: "flex" }}>{icon}</span>{label}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div><h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>AIチャット</h2>
        <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>自然言語で業務を操作・ファイルD&Dで自動解析</p></div>

      <div style={{ display: "flex", gap: 16 }}>
        {/* Chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Card style={{ flex: 1, padding: 0, display: "flex", flexDirection: "column", minHeight: 420 }}>
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 8, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  {m.role === "ai" && <div style={{ width: 28, height: 28, borderRadius: 8, background: A + "18", display: "flex", alignItems: "center", justifyContent: "center", color: A, flexShrink: 0, fontSize: 12 }}><IcAi /></div>}
                  <div style={{ maxWidth: "70%", padding: "10px 14px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? P : "var(--bg-secondary)", color: m.role === "user" ? "#fff" : "inherit", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{m.text}</div>
                </div>
              ))}
              {typing && <div style={{ display: "flex", gap: 8 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: A + "18", display: "flex", alignItems: "center", justifyContent: "center", color: A, flexShrink: 0 }}><IcAi /></div><div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "var(--bg-secondary)", fontSize: 13 }}>分析中...</div></div>}
              <div ref={chatEnd} />
            </div>
            <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid var(--border-light)" }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="メッセージを入力..." style={{ flex: 1, padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg-secondary)", fontSize: 13, outline: "none" }} />
              <Btn variant="primary" onClick={() => send()} disabled={!input.trim() || typing}><IcSnd /></Btn>
            </div>
          </Card>
        </div>

        {/* Action sidebar */}
        <div style={{ width: 220, display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
          <Card style={{ padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: A, marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}><IcZap /> 分析アクション</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <ActionBtn icon={<IcRcpt />} label="売上分析" query="売上を分析して" />
              <ActionBtn icon={<IcUsers />} label="顧客分析" query="顧客の状態を分析して" />
              <ActionBtn icon={<IcBox />} label="在庫最適化" query="在庫を最適化して" />
              <ActionBtn icon={<IcCalc />} label="キャッシュフロー" query="キャッシュフローを分析" />
              <ActionBtn icon={<IcPpl />} label="給与計算" query="給与の状態を教えて" />
              <ActionBtn icon={<IcFlow />} label="経営改善" query="経営改善のアドバイス" />
            </div>
          </Card>
          <Card style={{ padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: P, marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}><IcZap /> データ入力</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <ActionBtn icon={<IcUsers />} label="顧客登録" query="新規顧客を登録したい" />
              <ActionBtn icon={<IcBox />} label="在庫更新" query="在庫を更新したい" />
              <ActionBtn icon={<IcRcpt />} label="請求書作成" query="請求書を作成したい" />
              <ActionBtn icon={<IcCalc />} label="仕訳作成" query="仕訳を作成して" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ========================================
   2. AI Invoice OCR
   ======================================== */
export function AIOCRPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleProcess = () => {
    if (!file) return;
    setProcessing(true);
    setTimeout(() => {
      setResult({
        vendor: "株式会社サンプル商事",
        invoiceNo: "INV-2025-0342",
        date: "2025-03-15",
        due: "2025-04-15",
        items: [
          { name: "高性能ノートPC ProBook X1", qty: 5, price: 198000, total: 990000 },
          { name: "ワイヤレスマウス M500", qty: 20, price: 3980, total: 79600 },
        ],
        subtotal: 1069600,
        tax: 106960,
        total: 1176560,
        confidence: 94,
      });
      setProcessing(false);
    }, 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div><h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>AI請求書OCR</h2>
        <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>請求書の画像をアップロードするだけで、AIが金額・日付・取引先・明細を自動で読み取りデータ化します</p></div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Upload */}
        <Card>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>画像アップロード</div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 16 }}>JPG, PNG, WEBP対応（16MBまで）</div>
          <div style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: 48, textAlign: "center", cursor: "pointer", transition: "0.2s", background: file ? P + "06" : "transparent" }}
            onClick={() => { const f = { name: "sample_invoice.png", size: "1.2MB" }; setFile(f); setResult(null); }}>
            {file ? (
              <div><div style={{ fontSize: 14, fontWeight: 500, color: P }}>{file.name}</div><div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>{file.size}</div></div>
            ) : (
              <div><div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>📤</div><div style={{ fontSize: 14, color: "var(--text-tertiary)" }}>請求書画像をドロップ</div><div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>または、クリックしてファイルを選択</div></div>
            )}
          </div>
          <Btn variant="primary" size="lg" style={{ width: "100%", marginTop: 16 }} onClick={handleProcess} disabled={!file || processing}>
            <IcZap /> {processing ? "AI解析中..." : "AIで読み取る"}
          </Btn>
        </Card>

        {/* Result */}
        <Card>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>読取結果</div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 16 }}>AIが読み取った請求書情報</div>
          {result ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Badge variant="purple">AI信頼度 {result.confidence}%</Badge>
              {[{ l: "取引先", v: result.vendor }, { l: "請求書番号", v: result.invoiceNo }, { l: "発行日", v: result.date }, { l: "支払期限", v: result.due }].map(r => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--border-light)" }}>
                  <span style={{ color: "var(--text-tertiary)" }}>{r.l}</span><span style={{ fontWeight: 500 }}>{r.v}</span>
                </div>
              ))}
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 8 }}>明細</div>
              {result.items.map((it, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                  <span>{it.name} ×{it.qty}</span><span style={{ fontWeight: 500 }}>{fmtY(it.total)}</span>
                </div>
              ))}
              <div style={{ borderTop: "2px solid var(--border-light)", paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15 }}>
                <span>合計</span><span style={{ color: P }}>{fmtY(result.total)}</span>
              </div>
              <Btn variant="success" style={{ width: "100%", marginTop: 8 }}><IcChk /> 請求書として登録</Btn>
            </div>
          ) : (
            <div style={{ padding: 48, textAlign: "center", color: "var(--text-tertiary)" }}>
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>📄</div>
              <div style={{ fontSize: 13 }}>画像をアップロードしてAI解析を実行</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>結果がここに表示されます</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ========================================
   3. AI Email Generation
   ======================================== */
export function AIMailPage() {
  const [type, setType] = useState("invoice");
  const [form, setForm] = useState({ to: "", invNo: "", amount: "", due: "" });
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);

  const templates = [
    { id: "invoice", label: "請求書送付", desc: "請求書を添付して送付", icon: "📄" },
    { id: "reminder", label: "支払いリマインダー", desc: "丁寧な支払い催促", icon: "⏰" },
    { id: "overdue", label: "支払い督促", desc: "期限超過の督促", icon: "⚠️" },
    { id: "thanks", label: "入金お礼", desc: "入金確認のお礼", icon: "💝" },
    { id: "custom", label: "カスタム", desc: "自由なビジネスメール", icon: "✏️" },
  ];

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      const bodies = {
        invoice: `${form.to || "株式会社サンプル"} 御中\n\nいつもお世話になっております。\n\n下記の通り請求書を送付いたします。\n\n請求書番号: ${form.invNo || "INV-001"}\nご請求金額: ${form.amount || "¥100,000"}（税込）\nお支払期限: ${form.due || "2025年4月30日"}\n\nご不明な点がございましたら、お気軽にご連絡ください。\n\n何卒よろしくお願いいたします。`,
        reminder: `${form.to || "株式会社サンプル"} 御中\n\nいつもお世話になっております。\n\n請求書（${form.invNo || "INV-001"}）のお支払期限（${form.due || "2025年4月30日"}）が近づいておりますので、念のためご連絡差し上げました。\n\nすでにお手続き済みの場合は、本メールをご放念ください。\n\nご確認のほど、よろしくお願いいたします。`,
        overdue: `${form.to || "株式会社サンプル"} 御中\n\nいつもお世話になっております。\n\n請求書（${form.invNo || "INV-001"}）につきまして、お支払期限を過ぎておりますので、ご確認をお願いいたします。\n\nご請求金額: ${form.amount || "¥100,000"}\nお支払期限: ${form.due || "2025年4月30日"}（期限超過）\n\n行き違いの場合はご容赦ください。\nご対応のほど、よろしくお願いいたします。`,
        thanks: `${form.to || "株式会社サンプル"} 御中\n\nいつもお世話になっております。\n\n請求書（${form.invNo || "INV-001"}）のご入金を確認いたしました。\n迅速なお手続き、誠にありがとうございます。\n\n今後ともどうぞよろしくお願いいたします。`,
        custom: `${form.to || "宛先"} 御中\n\nいつもお世話になっております。\n\n（ここにメール本文を入力してください）\n\nよろしくお願いいたします。`,
      };
      setResult(bodies[type]);
      setGenerating(false);
    }, 1000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div><h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>AIメール文面生成</h2>
        <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>請求書送付・督促・お礼など、シーンに合わせたビジネスメールをAIが自動生成します</p></div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>メールタイプ</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {templates.map(t => (
                <div key={t.id} onClick={() => setType(t.id)} style={{ padding: "12px 14px", borderRadius: 10, border: type === t.id ? `2px solid ${A}` : "1px solid var(--border-light)", background: type === t.id ? A + "08" : "transparent", cursor: "pointer", transition: "0.15s" }}>
                  <div style={{ fontSize: 14, marginBottom: 2 }}>{t.icon} <span style={{ fontWeight: 600, color: type === t.id ? A : "inherit" }}>{t.label}</span></div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>コンテキスト情報</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Fld label="宛先（顧客名）"><input value={form.to} onChange={e => setForm({...form, to: e.target.value})} placeholder="例: 株式会社サンプル" style={inputStyle} /></Fld>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Fld label="請求書番号"><input value={form.invNo} onChange={e => setForm({...form, invNo: e.target.value})} placeholder="例: INV-001" style={inputStyle} /></Fld>
                <Fld label="金額"><input value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="例: 100000" style={inputStyle} /></Fld>
              </div>
              <Fld label="支払期限"><input type="date" value={form.due} onChange={e => setForm({...form, due: e.target.value})} style={inputStyle} /></Fld>
            </div>
            <Btn variant="primary" size="lg" style={{ width: "100%", marginTop: 16 }} onClick={generate} disabled={generating}>
              <IcZap /> {generating ? "AI生成中..." : "メール文面を生成"}
            </Btn>
          </Card>
        </div>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>生成結果</span>
            {result && <Badge variant="purple">AI生成</Badge>}
          </div>
          {result ? (
            <div>
              <div style={{ padding: 16, background: "var(--bg-secondary)", borderRadius: 10, fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap", minHeight: 300 }}>{result}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Btn variant="primary" style={{ flex: 1 }} onClick={() => navigator.clipboard?.writeText(result)}>コピー</Btn>
                <Btn style={{ flex: 1 }}>再生成</Btn>
              </div>
            </div>
          ) : (
            <div style={{ padding: 48, textAlign: "center", color: "var(--text-tertiary)" }}>
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>✉️</div>
              <div style={{ fontSize: 13 }}>情報を入力して生成ボタンを押してください</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>結果がここに表示されます</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ========================================
   4. AI Minutes (議事録)
   ======================================== */
export function AIMinutesPage() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [tab, setTab] = useState("new");

  const pastRecords = [
    { id: 1, title: "第3回営業戦略会議", date: "2025-03-10", duration: "45分" },
    { id: 2, title: "Q1レビューミーティング", date: "2025-03-05", duration: "60分" },
  ];

  const handleGenerate = () => {
    if (!title) return;
    setProcessing(true);
    setTimeout(() => {
      setResult({
        title: title || "会議",
        date: today(),
        summary: "本会議では、Q1の営業実績の振り返りと、Q2に向けた戦略の方向性について議論しました。売上目標の達成率は87%で、主にパイプラインの案件クロージングの遅延が影響しています。",
        decisions: ["Q2の売上目標を前期比+15%に設定", "新規顧客開拓のための展示会出展を承認", "CRMデータの精度向上プロジェクトを開始"],
        actions: [
          { person: "田中", task: "展示会のブース設計案を作成", due: "3/25" },
          { person: "佐藤", task: "Q1の経費精算レポートを完成", due: "3/20" },
          { person: "鈴木", task: "上位5社の訪問スケジュール調整", due: "3/22" },
        ],
      });
      setProcessing(false);
    }, 2500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div><h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>AI議事録</h2>
        <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>会議の音声ファイルをアップロードすると、AIが文字起こし・要約・アクションアイテム抽出を自動で行います</p></div>

      <div style={{ display: "flex", gap: 8, marginBottom: 0 }}>
        <Btn variant={tab === "new" ? "primary" : "default"} size="md" onClick={() => setTab("new")}>新規作成</Btn>
        <Btn variant={tab === "history" ? "primary" : "default"} size="md" onClick={() => setTab("history")}>履歴</Btn>
      </div>

      {tab === "new" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>音声ファイル</div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 16 }}>MP3, WAV, M4A対応（16MBまで）</div>
            <Fld label="会議タイトル"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="例: 第3回営業戦略会議" style={inputStyle} /></Fld>
            <div style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: 40, textAlign: "center", cursor: "pointer", marginTop: 12 }}
              onClick={() => setFile({ name: "meeting_20250319.mp3" })}>
              {file ? <div style={{ fontSize: 13, fontWeight: 500, color: P }}>{file.name}</div> : (
                <div><div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>🎙️</div><div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>音声ファイルをドロップ</div></div>
              )}
            </div>
            <Btn variant="primary" size="lg" style={{ width: "100%", marginTop: 16 }} onClick={handleGenerate} disabled={!title || processing}>
              <IcZap /> {processing ? "AI解析中..." : "議事録を作成"}
            </Btn>
          </Card>
          <Card>
            {result ? (
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{result.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 16 }}>{result.date}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>要約</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 16 }}>{result.summary}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>決定事項</div>
                {result.decisions.map((d, i) => <div key={i} style={{ fontSize: 12, padding: "4px 0", display: "flex", gap: 6 }}><span style={{ color: "#0F6E56" }}>✓</span>{d}</div>)}
                <div style={{ fontSize: 13, fontWeight: 600, margin: "16px 0 6px" }}>アクションアイテム</div>
                {result.actions.map((a, i) => (
                  <div key={i} style={{ fontSize: 12, padding: "6px 0", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between" }}>
                    <span><span style={{ fontWeight: 500 }}>{a.person}</span>: {a.task}</span>
                    <span style={{ color: "var(--text-tertiary)" }}>期限: {a.due}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 48, textAlign: "center", color: "var(--text-tertiary)" }}>
                <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>📝</div>
                <div style={{ fontSize: 13 }}>音声ファイルをアップロードして議事録を作成</div>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "history" && (
        <Card>
          <Tbl cols={[
            { label: "タイトル", render: r => <span style={{ fontWeight: 500 }}>{r.title}</span> },
            { label: "日付", key: "date" },
            { label: "所要時間", key: "duration" },
            { label: "操作", render: () => <Btn size="sm">表示</Btn> },
          ]} data={pastRecords} />
        </Card>
      )}
    </div>
  );
}

/* ========================================
   5. AI Daily/Weekly Report
   ======================================== */
export function AIReportPage({ data }) {
  const [tab, setTab] = useState("report");
  const [reportType, setReportType] = useState("daily");
  const [reportDate, setReportDate] = useState(today());
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);

  const tR = data.invs.reduce((s, i) => s + i.amt, 0);

  const generateReport = () => {
    setGenerating(true);
    setTimeout(() => {
      setResult(reportType === "daily"
        ? `【日報】${reportDate}\n\n■ 本日の業務サマリー\n・新規受注: 2件（¥1,200,000）\n・請求書発行: 3件\n・入金確認: 1件（¥1,375,000）\n・在庫アラート: ${data.prods.filter(p => p.stk <= p.min).length}件\n\n■ AI分析\n・売上トレンド: 前月比+12.5%で推移\n・パイプライン: ${data.deals.filter(d => d.stage !== "won").length}件の案件が進行中\n・回収状況: 期限超過なし\n\n■ 明日の推奨アクション\n・ABC商事への提案書提出\n・低在庫商品の発注処理`
        : `【週報】${reportDate}週\n\n■ 今週の実績\n・売上: ${fmtY(tR)}（目標比92%）\n・新規顧客: 3社\n・受注件数: 5件\n・入金件数: 4件\n\n■ 来週の予定\n・グローバル物産との契約交渉\n・月次決算準備\n・在庫棚卸し\n\n■ AI所見\n・売上は目標に対し若干の遅れがありますが、パイプラインは順調です。\n・来週は回収強化月間として、未入金の請求書フォローを推奨します。`
      );
      setGenerating(false);
    }, 1500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div><h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>AIレポート＆予測</h2>
        <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>AIが操作履歴から日報・週報を自動生成し、売上予測やキャッシュフロー分析を提供します</p></div>

      <div style={{ display: "flex", gap: 8 }}>
        {[["report", "日報・週報"], ["forecast", "売上予測"], ["cf", "キャッシュフロー"]].map(([k, l]) => (
          <Btn key={k} variant={tab === k ? "primary" : "default"} size="md" onClick={() => setTab(k)}>{l}</Btn>
        ))}
      </div>

      {tab === "report" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>レポート生成</div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 16 }}>操作履歴から自動作成</div>
            <Fld label="レポートタイプ">
              <select value={reportType} onChange={e => setReportType(e.target.value)} style={inputStyle}>
                <option value="daily">日報</option><option value="weekly">週報</option>
              </select>
            </Fld>
            <Fld label="対象日"><input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} style={inputStyle} /></Fld>
            <Btn variant="primary" size="lg" style={{ width: "100%", marginTop: 16 }} onClick={generateReport} disabled={generating}>
              <IcZap /> {generating ? "AI生成中..." : `${reportType === "daily" ? "日報" : "週報"}を生成`}
            </Btn>
          </Card>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>レポート</div>
            {result ? (
              <div style={{ padding: 16, background: "var(--bg-secondary)", borderRadius: 10, fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{result}</div>
            ) : (
              <div style={{ padding: 48, textAlign: "center", color: "var(--text-tertiary)" }}>
                <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>📋</div>
                <div style={{ fontSize: 13 }}>日付を選択してレポートを生成</div>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "forecast" && (
        <Card>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: A }}><IcAi /></span> AI売上予測</div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 16 }}>過去12ヶ月のデータから3ヶ月先を予測</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120, marginBottom: 8 }}>
            {[280,320,290,350,410,380,450,420,480,520,490,Math.round(tR/10000)].map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{ fontSize: 8, color: "var(--text-tertiary)" }}>{v}</div>
                <div style={{ width: "70%", height: Math.max(4, v/600*100), background: P, borderRadius: "2px 2px 0 0", opacity: 0.3 + v/600*0.7 }} />
                <div style={{ fontSize: 8, color: "var(--text-tertiary)" }}>{["4","5","6","7","8","9","10","11","12","1","2","3"][i]}月</div>
              </div>
            ))}
            <div style={{ width: 1, height: 100, background: A, opacity: 0.3 }} />
            {[540, 560, 580].map((v, i) => (
              <div key={"f"+i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{ fontSize: 8, color: A, fontWeight: 600 }}>{v}</div>
                <div style={{ width: "70%", height: Math.max(4, v/600*100), background: A, borderRadius: "2px 2px 0 0", opacity: 0.5, border: `1px dashed ${A}` }} />
                <div style={{ fontSize: 8, color: A }}>{["4","5","6"][i]}月</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text-tertiary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, background: P, borderRadius: 2 }} /> 実績</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, background: A, borderRadius: 2 }} /> AI予測</span>
          </div>
        </Card>
      )}

      {tab === "cf" && (
        <Card>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: A }}><IcAi /></span> AIキャッシュフロー分析</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            {[
              { l: "現預金", v: fmtY(9000000), color: "#0F6E56" },
              { l: "売掛金", v: fmtY(data.invs.reduce((s,i) => s + (i.total-i.paid), 0)), color: "#BA7517" },
              { l: "月次支出", v: fmtY(data.emps.reduce((s,e) => s + e.sal, 0)), color: "#A32D2D" },
              { l: "ランウェイ", v: "6.2ヶ月", color: "#0F6E56" },
            ].map(r => (
              <div key={r.l} style={{ textAlign: "center", padding: 16, borderRadius: 10, background: r.color + "08" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: r.color }}>{r.v}</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>{r.l}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ========================================
   6. AI Smart Notifications
   ======================================== */
export function AINotifyPage({ data }) {
  const [checked, setChecked] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const analyze = () => {
    setChecked(true);
    const notifs = [];
    const lowStk = data.prods.filter(p => p.stk <= p.min);
    if (lowStk.length > 0) notifs.push({ type: "warning", title: "在庫アラート", msg: `${lowStk.length}商品が発注点以下です。即時発注を推奨します。`, urgency: "高" });
    const unpaid = data.invs.filter(i => i.st !== "paid" && i.due < today());
    if (unpaid.length > 0) notifs.push({ type: "danger", title: "期限超過請求書", msg: `${unpaid.length}件の請求書が支払期限を超過しています。`, urgency: "高" });
    const pipeline = data.deals.filter(d => d.stage === "negotiation");
    if (pipeline.length > 0) notifs.push({ type: "info", title: "交渉中案件", msg: `${pipeline.length}件の案件が交渉段階です。早期クロージングを推奨します。`, urgency: "中" });
    notifs.push({ type: "success", title: "売上トレンド", msg: "直近3ヶ月の売上は上昇トレンドです。前月比+12.5%。", urgency: "低" });
    notifs.push({ type: "info", title: "自動仕訳", msg: `自動仕訳率${Math.round(data.jrnl.filter(j => j.auto).length / data.jrnl.length * 100)}%。手動仕訳のルール化で更に効率化可能です。`, urgency: "低" });
    setNotifications(notifs);
  };

  const urgencyColor = { "高": "#A32D2D", "中": "#BA7517", "低": "#0F6E56" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>AIスマート通知</h2>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>AIが重要度を判定し、緊急度に応じた通知を自動生成します</p></div>
        <Btn variant="primary" onClick={analyze}><IcZap /> 通知をチェック</Btn>
      </div>

      {checked && notifications.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notifications.map((n, i) => (
            <Card key={i} style={{ borderLeft: `3px solid ${urgencyColor[n.urgency]}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Badge variant={n.type === "danger" ? "danger" : n.type === "warning" ? "warning" : n.type === "success" ? "success" : "info"}>{n.urgency}</Badge>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{n.title}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{n.msg}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : checked ? (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#0F6E56" }}>✓ 緊急の通知はありません</div>
        </Card>
      ) : (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>🔔</div>
          <div style={{ fontSize: 14, color: "var(--text-tertiary)" }}>「通知をチェック」ボタンを押してAI分析を開始</div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>AIがデータを分析し、重要な通知を自動生成します</div>
        </Card>
      )}
    </div>
  );
}
