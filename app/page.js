'use client';
import { useState, useEffect } from 'react';
import s from './top.module.css';

const P = "#2b6876";

/* SVG Icons for features */
function SvgAutomate() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>; }
function SvgDashboard() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>; }
function SvgAI() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>; }
function SvgInventory() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8l-9-5-9 5v8l9 5 9-5z"/><path d="M3.3 7L12 12l8.7-5"/><line x1="12" y1="22" x2="12" y2="12"/></svg>; }
function SvgBilling() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>; }
function SvgHR() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>; }

const features = [
  { Icon: SvgAutomate, title: "受注から決算まで\n自動でつなぐ", desc: "受注確定→請求書生成→売上仕訳→在庫引当。一つのボタンで4つの処理が同時に走り、転記ミスをゼロにします。" },
  { Icon: SvgDashboard, title: "リアルタイム\n経営ダッシュボード", desc: "売上・キャッシュフロー・在庫・パイプラインの状況をひと目で把握。データに基づく迅速な経営判断を支援します。" },
  { Icon: SvgAI, title: "AI成約予測で\n営業を最適化", desc: "顧客スコア・対応履歴・フェーズを分析し、案件ごとの成約確率と推奨アクションをAIが自動提示します。" },
  { Icon: SvgInventory, title: "在庫・物流を\nリアルタイム管理", desc: "受注と連動した自動引当・出庫処理。低在庫アラートで欠品を防止し、適正在庫を維持します。" },
  { Icon: SvgBilling, title: "請求・入金の\n自動消込", desc: "入金登録と同時に売掛金消込仕訳を自動生成。回収状況をリアルタイムで把握できます。" },
  { Icon: SvgHR, title: "人事・給与も\nワンクリック", desc: "給与計算から仕訳生成まで自動化。社会保険・所得税の計算も含め、経理の負担を大幅に削減します。" },
];

const faqs = [
  { q: "導入の流れを教えてください", a: "お問い合わせ → ヒアリング → ご契約・ご入金 → 弊社にてアカウント（ID・パスワード）を発行 → メールにてお送りいたします。最短即日でご利用開始が可能です。" },
  { q: "導入にどのくらい時間がかかりますか？", a: "アカウント発行後、即日からご利用いただけます。既存データのCSV取込にも対応しているため、スムーズに移行できます。" },
  { q: "ITの専門知識は必要ですか？", a: "必要ありません。Operaiは直感的な操作を前提に設計されており、Excelを使える方であれば問題なくお使いいただけます。" },
  { q: "データのセキュリティは大丈夫ですか？", a: "すべてのデータはSSL/TLS暗号化で保護されています。認証基盤にはSupabaseを採用し、エンタープライズレベルのセキュリティを実現しています。" },
  { q: "他のシステムとの連携は可能ですか？", a: "CSV取込による顧客データの一括登録に対応しています。今後、会計ソフトやCRMとのAPI連携も順次対応予定です。" },
  { q: "デモ環境はありますか？", a: "導入をご検討のお客様には、デモ環境をご用意しております。まずはお問い合わせください。" },
  { q: "解約はいつでもできますか？", a: "はい、いつでも解約可能です。解約手数料はかかりません。月末までのご利用となります。" },
];

const reviews = [
  { name: "和菜七尾 様", text: "Excel管理から脱却したくてOperaiを導入しました。受注から請求書・仕訳が自動生成されるので、経理の二重入力がゼロに。月次決算が3日で終わるようになり、経営判断のスピードが格段に上がりました。" },
  { name: "うしいち 様", text: "以前は営業・在庫・経理がバラバラのシステムで、数字の突き合わせに毎月丸一日かかっていました。Operai導入後はすべてが一画面で見えるので、在庫切れや入金漏れにすぐ気づけるようになりました。" },
];

export default function TopPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className={s.top}>
      {/* Header */}
      <header className={`${s.topHeader} ${scrolled ? s.scrolled : ''}`}>
        <div className={s.topHeaderInner}>
          <a href="/"><img src="/logo.svg" alt="Operai" style={{ height: 28 }} /></a>
          <nav className={s.topNav}>
            <a href="#about">Operaiとは</a>
            <a href="#features">機能</a>
            <a href="#price">料金</a>
            <a href="#faq">よくある質問</a>
            <a href="/login" className={s.topNavLogin}>ログイン</a>
            <a href="https://peaksmarketing.co.jp/company/profile/" target="_blank" rel="noopener" className={s.topNavCTA}>お問い合わせ</a>
          </nav>
          <button className={s.topHamburger} onClick={() => setMobileOpen(true)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`${s.mobileMenu} ${mobileOpen ? s.open : ''}`}>
        <button className={s.mobileClose} onClick={() => setMobileOpen(false)}>×</button>
        <a href="#about" onClick={() => setMobileOpen(false)}>Operaiとは</a>
        <a href="#features" onClick={() => setMobileOpen(false)}>機能</a>
        <a href="#price" onClick={() => setMobileOpen(false)}>料金</a>
        <a href="#faq" onClick={() => setMobileOpen(false)}>よくある質問</a>
        <a href="/login" style={{ color: P, fontWeight: 700 }}>ログイン</a>
        <a href="https://peaksmarketing.co.jp/company/profile/" target="_blank" rel="noopener" style={{ background: P, color: '#fff', padding: '12px 36px', borderRadius: 50 }}>お問い合わせ</a>
      </div>

      {/* Hero */}
      <section className={s.topHero}>
        <div className={s.topHeroInner}>
          <div className={s.topHeroLeft}>
            <img src="/logo.svg" alt="Operai" className={s.topHeroLogo} />
            <h1 className={s.topHeroTitle}>経営のすべてを、<br />AIが自動化</h1>
            <p className={s.topHeroSub}>
              入力だけじゃ終わらない。<br />
              Operaiは、AIが業務データを統合・分析し、<br />
              受注から決算までを自動で実行。<br />
              次のアクションを迷わない、経営の自動運転ツールです。
            </p>
            <div className={s.topHeroLabel}>すべての業務を効率化！</div>
            <div className={s.topHeroBtns}>
              <a href="/login" className={s.topBtnPrimary}>ログイン</a>
              <a href="#features" className={s.topBtnOutline}>機能を見る</a>
            </div>
          </div>
          <div className={s.topHeroRight}>
            <img src="/img/fv_img.png" alt="FV" className={s.topHeroImg} />
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className={s.topAbout}>
        <div className={s.topAboutImg}>
          <img src="/img/image_operai.jpg" alt="Operai とは？" style={{ width: "100%" }} />
        </div>
        <div className={s.topAboutText}>
          <h2>Operaiとは？</h2>
          <p>
            中小企業の経営では「Excelでの二重入力」「部門間のデータ断絶」「転記ミスによる数値のズレ」が日常的に発生しています。
          </p>
          <p style={{ marginTop: 12 }}>
            『Operai』は、これらの悩みを解決するAI業務プラットフォームです。営業・在庫・会計・人事のデータを自動で統合・連携し、受注から決算までの業務フローを自動化。面倒な入力や転記の手間を減らし、経営判断までをスムーズにつなげます。
          </p>
          <p style={{ marginTop: 12 }}>
            「入力する・確認する・判断する」をワンストップで支援する、新しい経営プラットフォームです。
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={s.topFeatures}>
        <div className={s.topFeaturesInner}>
          <div className={s.topSectionTitle}><h2>Operai導入で実現できること</h2></div>
          <div className={s.topSectionSub}>Operaiが実現する、<br />次世代型AI経営プラットフォーム</div>
          <div className={s.topFeaturesGrid}>
            <div className={s.topFeatureRow1}>
              {features.slice(0, 2).map((f, i) => {
                const FIcon = f.Icon;
                return (
                  <div key={i} className={s.topFeatureCard}>
                    <div className={s.topFeatureIcon}><FIcon /></div>
                    <h3 style={{ whiteSpace: 'pre-line' }}>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                );
              })}
            </div>
            <div className={s.topFeatureRow2}>
              {features.slice(2).map((f, i) => {
                const FIcon = f.Icon;
                return (
                  <div key={i} className={s.topFeatureCard}>
                    <div className={s.topFeatureIcon}><FIcon /></div>
                    <h3 style={{ whiteSpace: 'pre-line' }}>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots */}
      <section className={s.topScreenshots}>
        <div className={s.topScreenshotsInner}>
          <div className={s.topSectionTitle}><h2>見やすく、使いやすく。<br />運用のすべてをこの画面で</h2></div>
          <div className={s.topSectionSub}>直感的なUIで、専任ITがいなくても即日運用可能</div>
          <div className={s.topScreenshotsGrid}>
            {[
              { label: "ダッシュボード", img: "/img/ss01.jpg" },
              { label: "ダッシュボード（グラフ）", img: "/img/ss02.jpg" },
              { label: "営業・顧客管理", img: "/img/ss03.jpg" },
              { label: "在庫・物流", img: "/img/ss04.jpg" },
              { label: "会計・財務", img: "/img/ss05.jpg" },
              { label: "請求・入金管理", img: "/img/ss06.jpg" },
            ].map((item, i) => (
              <div key={i} className={s.topScreenshotItem}>
                <img src={item.img} alt={item.label} style={{ width: "100%", borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", display: "block" }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginTop: 10, textAlign: "center" }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="price" className={s.topPricing}>
        <div className={s.topPricingInner}>
          <div className={s.topSectionTitle}><h2>料金</h2></div>
          <div className={s.topSectionSub}>AIが営業・在庫・会計・人事のすべてを自動処理。<br />人がやっていた業務をAIが代行するから、<br />人件費の大幅削減と業務効率化を同時に実現します。</div>
          <div className={s.topPriceCard}>
            <div style={{ fontSize: 13, fontWeight: 600, color: P, marginBottom: 16 }}>標準販売価格（税別・サブスクリプション）</div>
            <div>
              <span className={s.topPriceAmount}>217,500</span>
              <span className={s.topPriceUnit}>円 / 月</span>
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 8 }}>1年間利用料：<span style={{ fontWeight: 700 }}>2,610,000円</span>（税別）</div>
            <div className={s.topPriceNote}>※初期費用はかかりません。</div>
            <div style={{ margin: "20px 0", padding: "16px 20px", background: P + "08", borderRadius: 12, textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: P, marginBottom: 8 }}>AIで人件費を削減</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.8 }}>
                受注処理・請求書発行・仕訳入力・在庫管理・給与計算・売上分析…<br />
                これまで人手で行っていた業務をAIが24時間自動で処理します。<br />
                <span style={{ fontWeight: 600, color: P }}>月1名分のコストで、複数業務を完全自動化。</span>
              </div>
            </div>
            <ul className={s.topPriceFeatures}>
              {["全モジュール利用可能（CRM・在庫・会計・人事・請求）", "AI経営参謀・売上予測・異常検知", "請求書OCR・メール自動生成・議事録AI", "受注→請求→仕訳→在庫引当の完全自動化", "ユーザー数無制限", "メールサポート"].map(f => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <a href="https://peaksmarketing.co.jp/company/profile/" target="_blank" rel="noopener" className={s.topPriceCTA}>導入のお問い合わせ</a>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className={s.topReviews}>
        <div className={s.topReviewsInner}>
          <div className={s.topSectionTitle}><h2>導入企業の口コミ</h2></div>
          <div className={s.topSectionSub} />
          <div className={s.topReviewsGrid}>
            {reviews.map((r, i) => (
              <div key={i} className={s.topReviewCard}>
                <h3>{r.name}</h3>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={s.topFAQ}>
        <div className={s.topFAQInner}>
          <div className={s.topSectionTitle}><h2>よくある質問</h2></div>
          <div className={s.topSectionSub} />
          {faqs.map((item, i) => (
            <div key={i} className={s.topFAQItem}>
              <div className={s.topFAQQ} onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                <h3>{item.q}</h3>
                <span className={`${s.topFAQToggle} ${faqOpen === i ? s.open : ''}`}>+</span>
              </div>
              {faqOpen === i && <div className={s.topFAQA}>{item.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={s.topCTA}>
        <h2>経営のすべてを、<br />AIが自動化</h2>
        <p>まずは無料でOperaiを体験してください</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <a href="https://peaksmarketing.co.jp/company/profile/" target="_blank" rel="noopener" className={s.topCTABtn}>導入のお問い合わせ</a>
          <a href="/login" className={s.topCTABtnOutline}>ログイン</a>
        </div>
      </section>

      {/* Footer */}
      <footer className={s.topFooter}>
        <div className={s.topFooterInner}>
          <div>
            <img src="/logo.svg" alt="Operai" style={{ height: 16, filter: 'brightness(0) invert(1)', opacity: 0.5, marginBottom: 8, display: 'block' }} />
            <div className={s.topFooterCopy}>© Peaks Marketing Co. Ltd. All Rights Reserved.</div>
          </div>
          <div className={s.topFooterLinks}>
            <a href="https://peaksmarketing.co.jp/company/profile/" target="_blank" rel="noopener">会社概要</a>
            <a href="https://peaksmarketing.co.jp/tokushoho/" target="_blank" rel="noopener">特定商取引法</a>
            <a href="https://peaksmarketing.co.jp/privacy/" target="_blank" rel="noopener">プライバシーポリシー</a>
            <a href="https://peaksmarketing.co.jp/security-policy/" target="_blank" rel="noopener">情報セキュリティポリシー</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
