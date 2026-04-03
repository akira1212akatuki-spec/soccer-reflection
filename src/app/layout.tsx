import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const metadata: Metadata = {
  title: 'SoccerReflex',
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
        {/* Vercelツールバーを強制排除するスクリプト */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function removeVercelStuff() {
                  const selectors = [
                    '#vercel-toolbar',
                    'vercel-live-feedback',
                    '.vercel-toolbar',
                    '[data-vercel-toolbar]',
                    '[data-vercel-feedback-button]',
                    'va-toolbar',
                    'vercel-feedback-button',
                    '#__next-vercel-toolbar'
                  ];
                  selectors.forEach(s => {
                    const elements = document.querySelectorAll(s);
                    elements.forEach(el => el.remove());
                  });
                }
                // 初回実行
                removeVercelStuff();
                // 動的な生成に対応するため数回実行
                const interval = setInterval(removeVercelStuff, 1000);
                setTimeout(() => clearInterval(interval), 5000);
              })();
            `
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <div className="app-container">
            <ProtectedRoute>
              {children}
            </ProtectedRoute>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
