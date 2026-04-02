"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CloudUpload, CheckCircle, AlertCircle } from 'lucide-react';
import { getStorageMatches } from '@/lib/storage';
import { saveMatch } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

export default function MigratePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrateStatus, setMigrateStatus] = useState<null | 'success' | 'error'>(null);
  const [message, setMessage] = useState('');

  const handleMigrate = async () => {
    if (!user) return;
    
    setIsMigrating(true);
    setMigrateStatus(null);
    setMessage('');

    try {
      // 1. LocalStorage から全ユーザーの全データを取得
      // (元々 storage.ts の getStorageMatches() は引数なしで全件取得)
      const matches = getStorageMatches();
      
      if (matches.length === 0) {
        setMigrateStatus('error');
        setMessage('移行するローカルデータが見つかりませんでした。');
        setIsMigrating(false);
        return;
      }

      // 2. 現在のユーザーIDとユーザー名で上書きしてFirestoreに保存
      let successCount = 0;
      for (const m of matches) {
        // 現在ログインしているアカウントへデータを集約する
        // ※ これにより、過去のローカルデータがすべて今のアカウントに紐付く
        const updatedMatch = {
            ...m,
            userId: user.uid,
            userName: user.email?.split('@')[0] || "ユーザー"
        };
        await saveMatch(updatedMatch as any);
        successCount++;
      }

      setMigrateStatus('success');
      setMessage(`${successCount} 件の振り返り記録をクラウドに移行しました。`);
    } catch (err) {
      console.error(err);
      setMigrateStatus('error');
      setMessage('移行中にエラーが発生しました。');
    } finally {
      setIsMigrating(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <>
      <header className="page-header relative z-10 flex items-center justify-between">
        <button type="button" className="btn-icon" onClick={() => router.push('/')}>
          <ChevronLeft size={20} />
        </button>
        <h1 className="page-title m-0 text-base sm:text-lg">クラウド移行ツール</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="main-content flex flex-col items-center justify-center p-4">
        <div className="glass-panel max-w-md w-full p-8 text-center mt-10">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
            <CloudUpload size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">今までのお引越し</h2>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed">
            この機能を使うと、現在このスマホ（ブラウザ）に保存されているローカルの振り返りデータを、今ログインしているアカウント（{user?.email?.split('@')[0]}）のクラウドデータとしてコピーします。
          </p>

          {migrateStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-50 rounded-xl flex items-center gap-3 text-left">
              <CheckCircle className="text-green-500 shrink-0" size={24} />
              <p className="text-sm text-green-800 font-medium">{message}</p>
            </div>
          )}

          {migrateStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl flex items-center gap-3 text-left">
              <AlertCircle className="text-red-500 shrink-0" size={24} />
              <p className="text-sm text-red-800 font-medium">{message}</p>
            </div>
          )}

          <button 
            type="button"
            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md disabled:bg-blue-300"
            onClick={handleMigrate}
            disabled={isMigrating || migrateStatus === 'success'}
          >
            {isMigrating ? (
              'お引越し中...'
            ) : migrateStatus === 'success' ? (
              'お引越し完了'
            ) : (
              'データをクラウドへコピーする'
            )}
          </button>
          
          <button 
            onClick={() => router.push('/')}
            className="mt-4 text-sm text-gray-500 hover:text-gray-800 font-medium"
          >
            トップページへ戻る
          </button>
        </div>
      </main>
    </>
  );
}
