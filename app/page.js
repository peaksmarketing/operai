'use client';
import { useState } from 'react';

const P = "#2b6876";
const A = "#534AB7";

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <img src="/logo.svg" alt="Operai" style={{ height: 22 }} />
        <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {[["#about", "Operaiとは"], ["#features", "機能"], ["#price", "料金"], ["#faq", "よくある質問"]].map(([href, label]) => (
            <a key={href} href={href} style={{ fontSize: 14, color: "#555", textDecoration: "none", fontWeight: 500 }}>{label}</a>
          ))}
          <a href="/login" style={{ fontSize: 14, color: P, fontWeight: 600, textDecoration: "none" }}>ログイン</a>
          <a href="/login" style={{ fontSize: 14, color: "#fff", background: P, padding: "8px 20px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>無料で始める</a>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section style={{ paddingTop: 140, paddingBottom: 80, textAlign: "center", background: "linear-gradient(180deg, #f0f8f7 0%, #fff 100%)" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
        <img src="/logo.svg" alt="Operai" style={{ height: 40, marginBottom: 32 }} />
        <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.3, margin: "0 0 20px", color: "#1a1a1a", letterSpacing: -1 }}>
          経営のすべてを、<br />ひとつの画面から。
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.8, color: "#777", margin: "0 0 36px", maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
          営業・在庫・会計・人事——バラバラだった業務データを統合。<br />
          AIが自動でつなぎ、リアルタイムに経営を可視化します。
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          <a href="/login" style={{ fontSize: 16, color: "#fff", background: P, padding: "14px 36px", borderRadius: 10, textDecoration: "none", fontWeight: 600, transition: "opacity 0.15s" }}>無料で始める</a>
          <a href="#features" style={{ fontSize: 16, color: P, background: "#fff", padding: "14px 36px", borderRadius: 10, textDecoration: "none", fontWeight: 600, border: "1px solid " + P }}>機能を見る</a>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", margin: "0 0 16px", color: "#1a1a1a" }}>Operaiとは？</h2>
      <div style={{ maxWidth: 760, margin: "0 auto", fontSize: 15, lineHeight: 2, color: "#666", textAlign: "center" }}>
        <p>中小企業の経営では「Excelでの二重入力」「部門間のデータ断絶」「転記ミスによる数値のズレ」が日常的に発生しています。</p>
        <p style={{ marginTop: 16 }}>Operaiは、営業・在庫・会計・人事・請求といったすべての業務モジュールを一つのプラットフォームに統合。受注が入れば請求書・仕訳・在庫引当をAIが自動生成し、手作業ゼロで経営データがリアルタイムに更新されます。</p>
        <p style={{ marginTop: 16 }}>「入力する」から「確認するだけ」へ。Operaiが、中小企業の経営を次のステージに引き上げます。</p>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: "🔗", title: "受注から決算まで、自動でつなぐ", desc: "受注確定→請求書生成→売上仕訳→在庫引当。一つのボタンで4つの処理が同時に走り、転記ミスをゼロにします。" },
    { icon: "📊", title: "リアルタイム経営ダッシュボード", desc: "売上・キャッシュフロー・在庫・パイプラインの状況をひと目で把握。データに基づく迅速な経営判断を支援します。" },
    { icon: "🤖", title: "AI成約予測で営業を最適化", desc: "顧客スコア・対応履歴・フェーズを分析し、案件ごとの成約確率と推奨アクションをAIが自動提示します。" },
    { icon: "📦", title: "在庫・物流をリアルタイム管理", desc: "受注と連動した自動引当・出庫処理。低在庫アラートで欠品を防止し、適正在庫を維持します。" },
    { icon: "💰", title: "請求・入金の自動消込", desc: "入金登録と同時に売掛金消込仕訳を自動生成。回収状況をリアルタイムで把握できます。" },
    { icon: "👥", title: "人事・給与もワンクリック", desc: "給与計算から仕訳生成まで自動化。社会保険・所得税の計算も含め、経理の負担を大幅に削減します。" },
  ];
  return (
    <section id="features" style={{ padding: "80px 24px", background: "#f9f9f8" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", margin: "0 0 8px", color: "#1a1a1a" }}>Operai導入で実現できること</h2>
        <p style={{ fontSize: 15, color: "#999", textAlign: "center", margin: "0 0 48px" }}>すべてのモジュールが連携し、業務を自動化</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {items.map((item, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 32, border: "1px solid #eee", transition: "box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{item.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 10px", color: "#1a1a1a" }}>{item.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: "#888", margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Screenshots() {
  return (
    <section style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 8px", color: "#1a1a1a" }}>見やすく、使いやすく。<br />運用のすべてをこの画面で</h2>
        <p style={{ fontSize: 15, color: "#999", margin: "0 0 48px" }}>直感的なUIで、専任ITがいなくても即日運用可能</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { title: "経営ダッシュボード", desc: "KPI・売上推移・パイプラインを一画面で" },
            { title: "営業・顧客管理", desc: "AIスコアリング付き顧客360°ビュー" },
            { title: "在庫・物流管理", desc: "リアルタイム在庫と自動引当" },
            { title: "会計・財務", desc: "自動仕訳・P/L・B/Sをワンクリックで" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#f5f5f4", borderRadius: 14, padding: 32, textAlign: "left" }}>
              <div style={{ width: "100%", height: 200, background: "linear-gradient(135deg, " + P + "12, " + A + "12)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 14, color: "#999" }}>画面イメージ</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "#1a1a1a" }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: "#999", margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="price" style={{ padding: "80px 24px", background: "#f9f9f8" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 8px", color: "#1a1a1a" }}>料金</h2>
        <p style={{ fontSize: 15, color: "#999", margin: "0 0 40px" }}>まずは使って実感してほしいから、<br />料金はシンプルかつ明瞭に。</p>
        <div style={{ background: "#fff", borderRadius: 16, padding: "48px 40px", border: "2px solid " + P + "30", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: P, marginBottom: 8 }}>スタンダードプラン</div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: "#999" }}>月額</span>
            <span style={{ fontSize: 48, fontWeight: 800, color: "#1a1a1a", letterSpacing: -2 }}>50,000</span>
            <span style={{ fontSize: 16, color: "#999" }}>円（税別）</span>
          </div>
          <div style={{ fontSize: 14, color: "#999", marginBottom: 24 }}>年間利用料：600,000円（税別）</div>
          <div style={{ fontSize: 13, color: "#bbb", marginBottom: 24 }}>※ 初期費用はかかりません</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left", marginBottom: 28 }}>
            {["全モジュール利用可能", "ユーザー数無制限", "AI成約予測・経営分析", "自動仕訳・請求書生成", "データ連携自動化", "メールサポート"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#555" }}>
                <span style={{ color: P, fontWeight: 700 }}>✓</span>
                {f}
              </div>
            ))}
          </div>
          <a href="/login" style={{ display: "block", fontSize: 16, color: "#fff", background: P, padding: "14px 0", borderRadius: 10, textDecoration: "none", fontWeight: 600, textAlign: "center" }}>無料で始める</a>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [openIdx, setOpenIdx] = useState(null);
  const items = [
    { q: "導入にどのくらい時間がかかりますか？", a: "アカウント作成後、即日からご利用いただけます。既存データのCSV取込にも対応しているため、スムーズに移行できます。" },
    { q: "ITの専門知識は必要ですか？", a: "必要ありません。Operaiは直感的な操作を前提に設計されており、Excelを使える方であれば問題なくお使いいただけます。" },
    { q: "データのセキュリティは大丈夫ですか？", a: "すべてのデータはSSL/TLS暗号化で保護されています。認証基盤にはSupabaseを採用し、エンタープライズレベルのセキュリティを実現しています。" },
    { q: "他のシステムとの連携は可能ですか？", a: "Stripe決済連携に対応しています。今後、会計ソフトやCRMとのAPI連携も順次対応予定です。" },
    { q: "無料トライアルはありますか？", a: "はい。デモアカウントで全機能をお試しいただけます。ログイン画面から「デモアカウントで試す」をクリックしてください。" },
    { q: "解約はいつでもできますか？", a: "はい、いつでも解約可能です。解約手数料はかかりません。月末までのご利用となります。" },
  ];
  return (
    <section id="faq" style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", margin: "0 0 40px", color: "#1a1a1a" }}>よくある質問</h2>
        {items.map((item, i) => (
          <div key={i} style={{ borderBottom: "1px solid #eee" }}>
            <div onClick={() => setOpenIdx(openIdx === i ? null : i)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", cursor: "pointer" }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>{item.q}</span>
              <span style={{ fontSize: 20, color: "#ccc", transform: openIdx === i ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
            </div>
            {openIdx === i && (
              <div style={{ padding: "0 0 20px", fontSize: 14, lineHeight: 1.8, color: "#888" }}>{item.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section style={{ padding: "80px 24px", background: `linear-gradient(135deg, ${P}, #1a3d47)`, textAlign: "center" }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: "0 0 12px" }}>経営のすべてを、<br />ひとつの画面から。</h2>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", margin: "0 0 32px" }}>まずは無料でOperaiを体験してください</p>
      <a href="/login" style={{ display: "inline-block", fontSize: 16, color: P, background: "#fff", padding: "14px 40px", borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>無料で始める</a>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ padding: "40px 24px", background: "#1a1a1a", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
      <img src="/logo.svg" alt="Operai" style={{ height: 18, filter: "brightness(0) invert(1)", opacity: 0.5, marginBottom: 16 }} />
      <div style={{ fontSize: 12 }}>&copy; {new Date().getFullYear()} Peaks Marketing Co., Ltd. All rights reserved.</div>
    </footer>
  );
}

export default function TopPage() {
  return (
    <div style={{ fontFamily: "'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif", color: "#1a1a1a" }}>
      <Header />
      <Hero />
      <About />
      <Features />
      <Screenshots />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
