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
                    'vercel-live-feedback',
                    'va-toolbar',
                    '#vercel-toolbar',
                    '[data-vercel-toolbar]',
                    '[data-vercel-feedback-button]',
                    '[data-vercel-live-feedback]',
                    'vercel-feedback-button',
                    '#__next-vercel-toolbar'
                  ];
                  
                  // 通常のDOMから削除
                  selectors.forEach(s => {
                    document.querySelectorAll(s).forEach(el => el.remove());
                  });

                  // Shadow DOMの中も探索して削除
                  const allElements = document.querySelectorAll('*');
                  allElements.forEach(el => {
                    if (el.shadowRoot) {
                      selectors.forEach(s => {
                        el.shadowRoot.querySelectorAll(s).forEach(subEl => subEl.remove());
                      });
                    }
                  });
                }

                // 監視を強化
                const observer = new MutationObserver(removeVercelStuff);
                observer.observe(document.documentElement, { childList: true, subtree: true });
                
                removeVercelStuff();
                const interval = setInterval(removeVercelStuff, 500);
                setTimeout(() => {
                  clearInterval(interval);
                  // 5秒後も念のため一度実行
                  removeVercelStuff();
                }, 10000);
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
