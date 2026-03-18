export const metadata = { title: 'Operai — 利用規約', robots: { index: false, follow: false } };

export default function TermsPage() {
  const P = "#2b6876";
  const sectionStyle = { marginBottom: 36 };
  const h2Style = { fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px', paddingBottom: 10, borderBottom: '2px solid #eee' };
  const pStyle = { fontSize: 14, color: '#555', lineHeight: 2, margin: '0 0 10px' };
  const olStyle = { fontSize: 14, color: '#555', lineHeight: 2, paddingLeft: 20, margin: '0 0 10px' };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', fontFamily: "'Noto Sans JP', sans-serif" }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '16px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/"><img src="/logo.svg" alt="Operai" style={{ height: 20 }} /></a>
          <a href="/login" style={{ fontSize: 13, color: P, fontWeight: 600, textDecoration: 'none' }}>ログイン</a>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', margin: '0 0 8px' }}>利用規約</h1>
        <p style={{ fontSize: 13, color: '#999', margin: '0 0 40px' }}>最終更新日: 2025年4月1日</p>

        <div style={sectionStyle}>
          <p style={pStyle}>
            ユーザー（以下「甲」といいます）と Peaks Marketing Co., Ltd.（以下「当社」といいます）は、当社が提供するクラウド型統合業務プラットフォーム「Operai」（以下「本サービス」といいます）の利用に関し、以下のとおり利用規約（以下「本規約」といいます）を定めます。甲は、本サービスの利用をもって本規約に同意したものとみなします。
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>第1条（適用範囲）</h2>
          <ol style={olStyle}>
            <li>本規約は、本サービスを利用するすべてのユーザーに適用されます。</li>
            <li>当社がオンライン上で随時公表する諸規定・ガイドラインは、本規約の一部を構成するものとします。</li>
            <li>当社は、ユーザーへの事前告知のうえ、本規約を改定できるものとし、改定後の規約は当社所定の方法で公表した時点から効力を生じます。</li>
            <li>前項の変更について、本サービス上に30日間掲示した時点で、すべてのユーザーが承諾したものとみなします。</li>
          </ol>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>第2条（アカウント管理）</h2>
          <ol style={olStyle}>
            <li>ユーザーは、自己のID（メールアドレス）およびパスワードの使用・管理について一切の責任を負うものとします。</li>
            <li>当社は、ユーザーのID・パスワードが第三者に使用されたことにより当該ユーザーが被った損害について、ユーザーの故意過失の有無にかかわらず、一切の責任を負いません。</li>
            <li>ユーザーは、アカウントを第三者に譲渡・貸与・共有することはできません。</li>
            <li>当社が提供する会社アカウント・従業員アカウントの権限設定に基づき、各ユーザーは付与された権限の範囲内で本サービスを利用するものとします。</li>
          </ol>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>第3条（サービス内容）</h2>
          <ol style={olStyle}>
            <li>本サービスは、営業・顧客管理（CRM）、在庫・物流管理、会計・財務、人事・労務、請求・入金管理、AI経営参謀、データ連携等の機能を提供するクラウド型統合業務プラットフォームです。</li>
            <li>本サービスにはAI（人工知能）機能が含まれており、売上予測・仕訳自動分類・異常検知・需要予測・回収リスク分析等を提供しますが、AI機能による分析結果は参考情報であり、経営判断の最終責任はユーザーに帰属します。</li>
            <li>当社は、本サービスの機能追加・変更・改善を随時行うことができるものとします。</li>
          </ol>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>第4条（禁止事項）</h2>
          <p style={pStyle}>ユーザーは、以下の行為を行ってはならないものとします。違反が確認された場合、当社はユーザーの利用停止・アカウント削除を行うことができます。</p>
          <ol style={olStyle}>
            <li>本サービスのコンテンツ・情報・画像等の無断複写・転載</li>
            <li>公序良俗に反する行為</li>
            <li>犯罪行為またはこれに結びつく行為</li>
            <li>他のユーザーまたは第三者の権利（財産権、プライバシー権、人格権等）を侵害する行為</li>
            <li>本サービスの運営を妨げる行為、またはサービスの信頼を毀損する行為</li>
            <li>不正アクセス、リバースエンジニアリング、スクレイピング等の技術的な悪用行為</li>
            <li>虚偽の情報を登録する行為</li>
            <li>その他、当社が不適切と判断する行為</li>
          </ol>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>第5条（料金・支払い）</h2>
          <ol style={olStyle}>
            <li>本サービスの利用料金は、当社が別途定める料金表に従うものとします。</li>
            <li>当社は、利用料金を変更する場合、30日以上前にユーザーに通知するものとします。</li>
            <li>支払いに必要な手数料等は、すべてユーザーの負担とします。</li>
            <li>当社は、理由の如何を問わず、受領済みの利用料金については返金しないものとします。ただし、当社の責に帰すべき事由による場合はこの限りではありません。</li>
          </ol>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>第6条（データの取扱い）</h2>
          <ol style={olStyle}>
            <li>ユーザーが本サービスに登録したデータの所有権は、ユーザーに帰属します。</li>
            <li>当社は、本サービスの提供・改善・AI機能の精度向上のため、ユーザーのデータを統計的に処理（個人を特定できない形で匿名化）して利用することがあります。</li>
            <li>当社は、データの保全に最善を尽くしますが、天災・システム障害等の不可抗力によるデータの消失について責任を負いかねます。ユーザーは、重要なデータについて定期的にバックアップを取ることを推奨します。</li>
            <li>サービス解約後のデータについて、当社は解約日から90日間保持した後、完全に削除するものとします。</li>
          </ol>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>第7条（サービスの中断・終了）</h2>
          <ol style={olStyle}>
            <li>当社は、以下の場合、ユーザーへの事前通知なく本サービスの提供を一時中断することがあります。
              <br />（1）システムの保守・点検を行う場合
              <br />（2）火災・停電・通信障害等により提供が困難になった場合
              <br />（3）天災・戦争・テロ等の不可抗力による場合
              <br />（4）その他、運用上または技術上一時中断が必要と判断した場合
            </li>
            <li>当社が本サービスの提供を終了する場合は、終了日の90日以上前にユーザーに通知するものとします。</li>
            <li>ユーザーは、30日前までに当社所定の方法で通知することにより、本サービスの利用を終了することができます。</li>
          </ol>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>第8条（免責事項）</h2>
          <ol style={olStyle}>
            <li>当社は、本サービスの利用により生じたユーザーの直接的・間接的損害について、当社の故意または重過失による場合を除き、一切の責任を負いません。</li>
            <li>当社がユーザーに対し損害賠償責任を負う場合であっても、その累計総額は、当該ユーザーが過去12ヶ月間に当社に支払った利用料金の総額を上限とします。</li>
            <li>AI機能による分析結果・予測・推奨に基づくユーザーの経営判断について、当社は一切の責任を負いません。</li>
            <li>本サービスの利用に伴い、ユーザーとその取引先との間で発生したトラブルについて、当社は一切の責任を負いません。</li>
          </ol>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>第9条（知的財産権）</h2>
          <ol style={olStyle}>
            <li>本サービスに関する一切の知的財産権（著作権、特許権、商標権等）は、当社に帰属します。</li>
            <li>ユーザーは、本サービスを利用する権利のみを有し、本サービスの複製・改変・逆コンパイル等を行うことはできません。</li>
          </ol>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>第10条（秘密保持）</h2>
          <ol style={olStyle}>
            <li>当社およびユーザーは、本サービスの利用を通じて知り得た相手方の秘密情報を、相手方の事前の書面による承諾なく第三者に開示・漏洩しないものとします。</li>
            <li>前項の義務は、本サービスの利用終了後も3年間存続するものとします。</li>
          </ol>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>第11条（準拠法・管轄）</h2>
          <ol style={olStyle}>
            <li>本規約の準拠法は日本法とします。</li>
            <li>本規約に関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</li>
          </ol>
        </div>

        <div style={{ padding: '24px 0', borderTop: '2px solid #eee', marginTop: 48, textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: '0 0 4px' }}>Peaks Marketing Co., Ltd.</p>
          <p style={{ fontSize: 12, color: '#999', margin: 0 }}>制定日: 2025年4月1日</p>
        </div>
      </main>

      <footer style={{ padding: '24px', background: '#1a1a1a', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>© Peaks Marketing Co., Ltd. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
