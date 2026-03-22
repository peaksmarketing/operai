import './globals.css';

export const metadata = {
  title: 'Operai — 経営のすべてを、ひとつの画面から',
  description: '中小企業向け統合業務プラットフォーム by Peaks Marketing Co., Ltd.',
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
