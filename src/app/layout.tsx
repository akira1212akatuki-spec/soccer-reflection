import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Soccer Reflection',
  description: '試合振り返りと自己評価を記録し、成長を可視化するアプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
