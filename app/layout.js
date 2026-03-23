import './globals.css';

export const metadata = {
  title: 'Operai — 経営のすべてを、ひとつの画面から',
  description: '中小企業向け統合業務プラットフォーム。AIが営業・在庫・会計・人事のすべてを自動処理。人件費削減と業務効率化を同時に実現。',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
