"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, Plus, ChevronDown, ChevronUp, X } from 'lucide-react';
import { isSameDay } from 'date-fns';
import { Match, Evaluation } from '@/lib/storage';
import { getMatches, deleteMatch } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { deleteUser } from 'firebase/auth';
import MatchCard from '@/components/MatchCard';
import MatchCalendar from '@/components/Calendar';
import RadarChart from '@/components/RadarChart';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [isClient, setIsClient] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  
  // 親アカウント用の状態
  const [isParent, setIsParent] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  
  // UI states
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Date filter for average chart
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1); // default 1 month ago
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // データのフェッチ
  const fetchMatches = async () => {
    if (!user) return;
    setIsLoadingMatches(true);
    
    // admin または parent という文字列がIDに入っていたら親とみなす
    const isParentAccount = user.email?.includes('admin') || user.email?.includes('parent') || false;
    setIsParent(isParentAccount);

    // 親アカウントの場合は指定した子供ID（あるいは全部）を取得。子供の場合は自分のみ。
    const targetUserId = isParentAccount ? selectedChildId : user.uid;
    const filterId = targetUserId === 'all' ? undefined : targetUserId;

    const data = await getMatches(filterId || undefined, isParentAccount && targetUserId === 'all');
    setMatches(data);
    setIsLoadingMatches(false);
  };

  useEffect(() => {
    if (user && !loading) {
      fetchMatches();
    }
  }, [user, loading, selectedChildId]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (window.confirm('このアカウントを削除していいですか？\n※この操作は取り消せません。')) {
      try {
        await deleteUser(user);
        alert('アカウントを削除しました。');
        router.push('/login');
      } catch (error: any) {
        console.error(error);
        if (error.code === 'auth/requires-recent-login') {
          alert('セキュリティのため、アカウントを削除するには一度ログアウトして再ログインしてください。');
        } else {
          alert('アカウントの削除に失敗しました。詳細: ' + error.message);
        }
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('本当にこの振り返りを削除しますか？')) {
      await deleteMatch(id);
      setMatches(prev => prev.filter(m => m.id !== id));
    }
  };

  // 親用の「子供一覧」を生成（全データからuserIdのユニークリストを作る）
  // 実際にはちゃんとしたユーザーテーブルを作るのが定石ですが、今回は簡易的に全マッチから抽出
  const [allChildren, setAllChildren] = useState<{id: string, name: string}[]>([]);
  
  useEffect(() => {
    if (isParent && matches.length > 0 && allChildren.length === 0) {
      // 一度だけ全員のIDと名前のペアを抽出
      const childMap = new Map<string, string>();
      matches.forEach(m => {
        // storageの仕様が変わって userName が無い場合は userId を使う
        childMap.set(m.userId, (m as any).userName || '取得した選手');
      });
      const childrenList = Array.from(childMap.entries()).map(([id, name]) => ({id, name}));
      setAllChildren(childrenList);
    }
  }, [matches, isParent]);

  // Compute filtered average
  let avgEvaluation: Evaluation | null = null;
  const filteredMatchesForAverage = matches.filter(m => {
    const d = new Date(m.date).getTime();
    const startObj = new Date(startDate);
    startObj.setHours(0, 0, 0, 0);
    const endObj = new Date(endDate);
    endObj.setHours(23, 59, 59, 999);
    return d >= startObj.getTime() && d <= endObj.getTime();
  });

  if (filteredMatchesForAverage.length > 0) {
    const sum = { challenge: 0, transition: 0, intelligence: 0, hardwork: 0, mental: 0, captaincy: 0 };
    filteredMatchesForAverage.forEach(m => {
      sum.challenge += m.evaluation.challenge;
      sum.transition += m.evaluation.transition;
      sum.intelligence += m.evaluation.intelligence;
      sum.hardwork += m.evaluation.hardwork;
      sum.mental += m.evaluation.mental;
      sum.captaincy += m.evaluation.captaincy;
    });
    const c = filteredMatchesForAverage.length;
    avgEvaluation = {
      challenge: sum.challenge / c, transition: sum.transition / c,
      intelligence: sum.intelligence / c, hardwork: sum.hardwork / c,
      mental: sum.mental / c, captaincy: sum.captaincy / c,
    };
  }

  if (!isClient || loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return null; // ProtectedRouteが処理する

  const filteredMatchesByDate = selectedDate 
    ? matches.filter(m => isSameDay(new Date(m.date), selectedDate))
    : matches;

  const currentUserName = user.email?.split('@')[0] || "ユーザー";

  return (
    <>
      <header className="page-header flex flex-col items-center gap-2" style={{ padding: '20px 16px' }}>
        <div className="flex justify-between items-center w-full">
            <h1 className="page-title text-xl m-0">SoccerReflex</h1>
            <div className="flex gap-2">
              {/* 誤操作防止のため、ヘッダーからログアウト・削除ボタンを削除 */}
            </div>
        </div>
        
        <div className="flex items-center gap-4 mt-2">
            {!isParent ? (
                <span className="form-label" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {currentUserName} 選手の記録
                </span>
            ) : (
                <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md mb-1">保護者アカウント</span>
                    <select 
                        className="form-input text-lg font-bold" 
                        value={selectedChildId || 'all'} 
                        onChange={(e) => setSelectedChildId(e.target.value === 'all' ? null : e.target.value)}
                    >
                        <option value="all">全員の記録を表示</option>
                        {allChildren.map(c => (
                            <option key={c.id} value={c.id}>{c.name} (ID: {c.id.substring(0,4)}...)</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
      </header>
      
      <main className="main-content" style={{ paddingBottom: '100px' }}>
        <div className="flex flex-col gap-8 max-w-[800px] mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ width: '100%' }}>
            {/* カレンダーコンポーネント（現状のものを流用。userNameは適当な名前に。） */}
            <MatchCalendar 
              matches={matches} 
              userName={isParent ? "選択中" : currentUserName} 
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>

          {isLoadingMatches ? (
             <div className="text-center py-10 opacity-60">データを読み込み中...</div>
          ) : matches.length === 0 ? (
            <div className="glass-panel empty-state">
              <Trophy size={48} className="icon-subtle" />
              <div>
                <h3>まだ振り返り記録がありません</h3>
                {isParent ? (
                    <p className="form-label mt-4">お子様が記録をつけるとここに表示されます。</p>
                ) : (
                    <p className="form-label mt-4">右下のボタンから最初の一歩を記録しましょう！</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="form-label mb-0" style={{fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 700}}>
                    {selectedDate ? `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日の振り返り` : '振り返り一覧'}
                  </h2>
                  {selectedDate && (
                    <button 
                      onClick={() => setSelectedDate(null)}
                      className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-xs font-medium text-slate-600 transition-colors"
                    >
                      解除 <X size={12} />
                    </button>
                  )}
                </div>
                <button 
                  className="btn-icon"
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                >
                  {isHistoryOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </button>
              </div>
              
              {isHistoryOpen && (
                <div className="matches-list flex flex-col gap-4 w-full" style={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredMatchesByDate.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 font-medium">指定された日の記録はありません。</div>
                  ) : (
                    (() => {
                      const sortedMatches = [...filteredMatchesByDate].sort((a, b) => b.createdAt - a.createdAt);
                      const displayedMatches = (showAllHistory || selectedDate) ? sortedMatches : sortedMatches.slice(0, 5);
                      
                      const grouped = displayedMatches.reduce((acc: Record<string, Match[]>, m) => {
                        const d = new Date(m.date);
                        const key = `${d.getFullYear()}年${d.getMonth() + 1}月`;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(m);
                        return acc;
                      }, {});

                      return (
                        <>
                          {Object.entries(grouped)
                            .sort((a, b) => {
                              const parseDate = (s: string) => {
                                const [y, m] = s.replace('年', '-').replace('月', '').split('-');
                                return new Date(parseInt(y), parseInt(m) - 1).getTime();
                              };
                              return parseDate(b[0]) - parseDate(a[0]);
                            })
                            .map(([month, monthMatches]) => (
                              <div key={month} className="mb-4">
                                {!selectedDate && (
                                  <div className="month-group-header">
                                    <span>{month}</span>
                                  </div>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                  {monthMatches.map(m => (
                                    <MatchCard 
                                      key={m.id} 
                                      match={m} 
                                      userName={isParent ? ((m as any).userName || "取得した選手") : currentUserName} 
                                      onDelete={handleDelete} 
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          
                          {!showAllHistory && !selectedDate && matches.length > 5 && (
                            <button 
                              className="btn btn-secondary w-full" 
                              style={{ padding: '12px', fontSize: '0.9rem', marginTop: '8px' }}
                              onClick={() => setShowAllHistory(true)}
                            >
                              以前の記録を表示（残り {matches.length - 5} 件）
                              <ChevronDown size={18} />
                            </button>
                          )}
                          {showAllHistory && !selectedDate && matches.length > 5 && (
                            <button 
                              className="btn btn-secondary w-full" 
                              style={{ padding: '12px', fontSize: '0.9rem', marginTop: '8px' }}
                              onClick={() => setShowAllHistory(false)}
                            >
                              表示を戻す
                              <ChevronUp size={18} />
                            </button>
                          )}
                        </>
                      );
                    })()
                  )}
                </div>
              )}
            </div>
          )}

          <div className="glass-panel">
            <h2 className="form-label mb-4" style={{fontSize: '1rem', color: 'var(--text-main)'}}>期間ごとの平均パフォーマンス</h2>
            <div className="flex gap-2 items-center mb-4">
              <input type="date" className="form-input" style={{flex: 1, padding: '8px', fontSize: '0.875rem'}} value={startDate} onChange={e => setStartDate(e.target.value)} />
              <span>〜</span>
              <input type="date" className="form-input" style={{flex: 1, padding: '8px', fontSize: '0.875rem'}} value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            {avgEvaluation ? (
              <div style={{ height: '400px', width: '100%' }}>
                <RadarChart currentEvaluation={avgEvaluation} averageEvaluation={avgEvaluation} />
              </div>
            ) : (
              <div className="text-center text-muted" style={{padding: '40px 0'}}>この期間のデータはありません</div>
            )}
            
            {/* メニュー：マイグレーション導線 */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <Link href="/migrate" className="text-blue-600 font-medium hover:underline text-sm flex items-center justify-center gap-2">
                <Plus size={16}/> ローカルからのデータ引き継ぎを行う
              </Link>
            </div>
          </div>
        </div>

        {/* 親アカウントのときは新規入力ボタンを隠す */}
        {!isParent && (
            <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100 }}>
            <Link href="/match/new" className="btn btn-primary" style={{
                height: '56px', borderRadius: '28px', padding: '0 20px',
                boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)',
                display: 'flex', alignItems: 'center', gap: '6px'
            }}>
                <Plus size={24} />
                <span style={{ fontWeight: 600, fontSize: '1rem' }}>新規入力</span>
            </Link>
            </div>
        )}
      </main>
    </>
  );
}
