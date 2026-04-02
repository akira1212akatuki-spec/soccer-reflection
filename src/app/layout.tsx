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
