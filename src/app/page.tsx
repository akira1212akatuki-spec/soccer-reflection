"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, Plus, ChevronDown, ChevronUp, X, UserMinus, Trash2, LogOut } from 'lucide-react';
import { isSameDay } from 'date-fns';
import { Match, Evaluation } from '@/lib/storage';
import { getMatches, deleteMatch, deleteAllMatchesByUserId, getUserProfile, UserProfile } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { deleteUser } from 'firebase/auth';
import MatchCard from '@/components/MatchCard';
import MatchCalendar from '@/components/Calendar';
import RadarChart from '@/components/RadarChart';
import StatusPanel from '@/components/StatusPanel';
import { EarnedExps, emptyExps } from '@/lib/xpCalculator';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [isClient, setIsClient] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  
  // 親アカウント用の状態
  const [isParent, setIsParent] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [allChildren, setAllChildren] = useState<{id: string, name: string}[]>([]);
  
  // XP / Profile
  const [totalExps, setTotalExps] = useState<EarnedExps>(emptyExps());

  // UI states
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPlayerDataDeleteModal, setShowPlayerDataDeleteModal] = useState(false);

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
    // ストレージから子供選択状態を復旧
    const savedChildId = sessionStorage.getItem('selectedChildId');
    if (savedChildId) {
      setSelectedChildId(savedChildId);
    }
  }, []);

  // 子供選択状態が変更されたら保存
  useEffect(() => {
    if (selectedChildId) {
      sessionStorage.setItem('selectedChildId', selectedChildId);
    } else {
      // 「全員を表示」の場合は削除
      sessionStorage.removeItem('selectedChildId');
    }
  }, [selectedChildId]);

  // データのフェッチ
  const fetchMatches = async () => {
    if (!user) return;
    setIsLoadingMatches(true);
    
    // admin または parent という文字列がIDに入っていたら親とみなす
    const isParentAccount = user.email?.includes('admin') || user.email?.includes('parent') || false;
    setIsParent(isParentAccount);

    // 選手アカウントの場合はプロフィール（EXP）を取得
    if (!isParentAccount) {
      const profile = await getUserProfile(user.uid);
      if (profile?.totalExps) {
        setTotalExps(profile.totalExps);
      }
    }

    // 親アカウントかつ子供リストがまだ空の場合は、全データからリストを構築
    if (isParentAccount && allChildren.length === 0) {
      const allData = await getMatches(undefined, true);
      const childMap = new Map<string, string>();
      allData.forEach(m => {
        childMap.set(m.userId, (m as any).userName || '取得した選手');
      });
      const childrenList = Array.from(childMap.entries()).map(([id, name]) => ({id, name}));
      setAllChildren(childrenList);
    }

    // 親アカウントの場合は指定した子供ID（あるいは全部）を取得。子供の場合は自分のみ。
    const targetUserId = isParentAccount ? selectedChildId : user.uid;
    const filterId = (targetUserId === 'all' || !targetUserId) ? undefined : targetUserId;

    const data = await getMatches(filterId || undefined, isParentAccount && (targetUserId === 'all' || !targetUserId));
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
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!user) return;
    try {
      // 1. まずそのユーザーの全ての試合データを削除する
      await deleteAllMatchesByUserId(user.uid);
      
      // 2. 次にアカウント自体を削除する
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
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('本当にこの振り返りを削除しますか？')) {
      await deleteMatch(id);
      setMatches(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleDeleteAllMatchesForSelectedChild = async () => {
    if (!isParent || !selectedChildId) return;
    setShowPlayerDataDeleteModal(true);
  };

  const confirmDeletePlayerData = async () => {
    if (!isParent || !selectedChildId) return;
    try {
      await deleteAllMatchesByUserId(selectedChildId);
      alert('選手の全データを削除しました。');
      
      // リストを更新
      await fetchMatches();
      // 選択を解除
      setSelectedChildId(null);
      // 子供リストをクリア（再計算を促す）
      setAllChildren([]);
    } catch (error) {
      console.error(error);
      alert('データの削除に失敗しました。');
    } finally {
      setShowPlayerDataDeleteModal(false);
    }
  };

  // 親用の「子供一覧」を生成（全データからuserIdのユニークリストを作る）
  // 実際にはちゃんとしたユーザーテーブルを作るのが定石ですが、今回は簡易的に全マッチから抽出
  // 親用の「子供一覧」を生成
  // 以前は matches から抽出していましたが、現在は fetchMatches 内で全データから抽出し allChildren にセットしています
  // これにより、フィルタリング中でも全員をプルダウンに表示し続けられます

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
              <button 
                className="btn-icon" 
                onClick={handleDeleteAccount} 
                aria-label="アカウント削除"
                title="アカウント削除"
                style={{ padding: '6px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              >
                <UserMinus size={20} />
              </button>
              <button 
                className="btn-icon" 
                onClick={handleLogout} 
                aria-label="ログアウト"
                title="ログアウト"
                style={{ padding: '6px' }}
              >
                <LogOut size={20} />
              </button>
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
                    <div className="flex items-center gap-2">
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
                        
                        {selectedChildId && (
                            <button 
                                className="btn-icon" 
                                onClick={handleDeleteAllMatchesForSelectedChild}
                                title="この選手の全データを削除"
                                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
      </header>

      {/* 選手アカウントのみステータスパネルを表示 */}
      {!isParent && (
        <div style={{ padding: '0 24px', marginBottom: '-8px' }}>
          <StatusPanel totalExps={totalExps} />
        </div>
      )}
      
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
                      解除
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

      {/* アカウント削除確認モーダル */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '24px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '400px', width: '100%', textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', padding: '32px'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', color: '#ef4444'
            }}>
              <Trash2 size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: '#0f172a' }}>
              アカウント削除の確認
            </h3>
            <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '32px', lineHeight: 1.6 }}>
              このアカウントを削除していいですか？<br/>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ef4444' }}>※この操作は取り消せません。</span>
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '12px' }}
                onClick={() => setShowDeleteModal(false)}
              >
                キャンセル
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '12px', backgroundColor: '#ef4444', backgroundImage: 'none', boxShadow: 'none' }}
                onClick={confirmDeleteAccount}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 選手データ一括削除確認モーダル（保護者用） */}
      {showPlayerDataDeleteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '24px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '400px', width: '100%', textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', padding: '32px'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', color: '#ef4444'
            }}>
              <Trash2 size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: '#0f172a' }}>
              選手データの全削除
            </h3>
            <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '32px', lineHeight: 1.6 }}>
              選択した選手の**全ての試合・練習記録**を削除していいですか？<br/>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ef4444' }}>※すでにアカウントがない選手のデータ掃除に利用してください。</span>
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '12px' }}
                onClick={() => setShowPlayerDataDeleteModal(false)}
              >
                キャンセル
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '12px', backgroundColor: '#ef4444', backgroundImage: 'none', boxShadow: 'none' }}
                onClick={confirmDeletePlayerData}
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
