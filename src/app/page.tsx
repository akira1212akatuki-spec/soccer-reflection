"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Trophy, Plus, LogOut, User as UserIcon, Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { User, getStorageUsers, saveStorageUser, getStorageMatches, Match, deleteStorageUser } from '@/lib/storage';
import MatchCard from '@/components/MatchCard';
import MatchCalendar from '@/components/Calendar';
import RadarChart from '@/components/RadarChart';
import { Evaluation } from '@/lib/storage';

export default function Home() {
  const router = useRouter();
  
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Login states
  const [users, setUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState('');
  
  // Match states
  const [matches, setMatches] = useState<Match[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

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
    const storedUsers = getStorageUsers();
    setUsers(storedUsers);
    
    // Check if user was previously selected in this session (easiest via simple localstate or just asking to pick)
    const activeUserId = localStorage.getItem('active_user_id');
    if (activeUserId) {
      const u = storedUsers.find(u => u.id === activeUserId);
      if (u) {
        handleLogin(u);
      }
    }
  }, []);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    
    const newUser: User = {
      id: uuidv4(),
      name: newUserName.trim()
    };
    saveStorageUser(newUser);
    setUsers([...users, newUser]);
    setNewUserName('');
    handleLogin(newUser);
  };

  const handleLogin = (u: User) => {
    setCurrentUser(u);
    localStorage.setItem('active_user_id', u.id);
    const m = getStorageMatches(u.id);
    setMatches(m);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('active_user_id');
    setMatches([]);
  };

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

  if (!isClient) return null;

  if (!currentUser) {
    return (
      <div className="user-selector">
        <div className="logo-container">
          <Trophy size={40} color="white" />
        </div>
        <div className="text-center mb-6">
          <h1 className="page-title" style={{ fontSize: '2rem' }}>Soccer Reflex</h1>
          <p className="form-label mt-4">試合記録をつける選手を選んでください</p>
        </div>

        <div className="glass-panel" style={{ width: '100%', maxWidth: '350px' }}>
          {users.length > 0 && (
            <div className="mb-6">
              <p className="form-label mb-4">登録済み選手</p>
              <div className="flex" style={{ flexDirection: 'column', gap: '8px' }}>
                {users.map(u => (
                  <div key={u.id} className="flex gap-2 w-full">
                    <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'flex-start' }} onClick={() => handleLogin(u)}>
                      <UserIcon size={18} />
                      {u.name}
                    </button>
                    <button className="btn-icon" onClick={() => {
                      if (window.confirm(`選手「${u.name}」とその記録をすべて削除しますか？`)) {
                        deleteStorageUser(u.id);
                        setUsers(prev => prev.filter(user => user.id !== u.id));
                      }
                    }}>
                      <Trash2 size={18} className="icon-accent" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="form-label mb-4">新しい選手を登録</p>
            <form onSubmit={handleCreateUser} className="flex gap-2">
              <input
                type="text"
                className="form-input flex-1"
                placeholder="選手名"
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '12px 20px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                登録
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="page-header flex flex-col items-center gap-2" style={{ padding: '24px 16px' }}>
        <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.025em' }}>SoccerReflex</h1>
        <div className="flex items-center gap-4 mt-2">
          <span className="form-label" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{currentUser.name}</span>
          <button 
            className="btn-icon" 
            onClick={handleLogout} 
            aria-label="ログアウト"
            style={{ 
              border: '2px solid rgba(0,0,0,0.2)', 
              borderRadius: '8px',
              padding: '6px'
            }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>
      
      <main className="main-content" style={{ paddingBottom: '100px' }}>
        {matches.length === 0 ? (
          <div className="glass-panel empty-state">
            <Trophy size={48} className="icon-subtle" />
            <div>
              <h3>まだ振り返り記録がありません</h3>
              <p className="form-label mt-4">右下のボタンから最初の一歩を記録しましょう！</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8 max-w-[800px] mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* 1. Calendar (No background, full width) */}
            <div style={{ width: '100%' }}>
              <MatchCalendar matches={matches} userName={currentUser.name} />
            </div>
            
            {/* 2. Average Performance */}
            <div className="glass-panel">
              <h2 className="form-label mb-4" style={{fontSize: '1rem', color: 'var(--text-main)'}}>期間ごとの平均パフォーマンス</h2>
              <div className="flex gap-2 items-center mb-4">
                <input type="date" className="form-input" style={{flex: 1, padding: '8px', fontSize: '0.875rem'}} value={startDate} onChange={e => setStartDate(e.target.value)} />
                <span>〜</span>
                <input type="date" className="form-input" style={{flex: 1, padding: '8px', fontSize: '0.875rem'}} value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              {avgEvaluation ? (
                <RadarChart currentEvaluation={avgEvaluation} averageEvaluation={avgEvaluation} />
              ) : (
                <div className="text-center text-muted" style={{padding: '40px 0'}}>この期間のデータはありません</div>
              )}
            </div>

            {/* 3. Review List (Collapsible & Grouped) */}
            <div>
              <div 
                className="flex items-center justify-between mb-2 cursor-pointer"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              >
                <h2 className="form-label mb-0" style={{fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 700}}>振り返り一覧</h2>
                <button className="btn-icon">
                  {isHistoryOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </button>
              </div>
              
              {isHistoryOpen && (
                <div className="matches-list flex flex-col gap-4 w-full" style={{ display: 'flex', flexDirection: 'column' }}>
                  {Object.entries(
                    matches.reduce((acc: Record<string, Match[]>, m) => {
                      const d = new Date(m.date);
                      const key = `${d.getFullYear()}年${d.getMonth() + 1}月`;
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(m);
                      return acc;
                    }, {})
                  )
                  .sort((a, b) => {
                    // Sort YYYY年MM月 string descending
                    const parseDate = (s: string) => {
                      const [y, m] = s.replace('年', '-').replace('月', '').split('-');
                      return new Date(parseInt(y), parseInt(m) - 1).getTime();
                    };
                    return parseDate(b[0]) - parseDate(a[0]);
                  })
                  .map(([month, monthMatches]) => (
                    <div key={month} className="mb-4">
                      <div className="month-group-header">
                        <span>{month}</span>
                        <span style={{fontSize: '0.75rem', fontWeight: 'normal'}}>({monthMatches.length}件)</span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {monthMatches
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map(m => (
                          <MatchCard 
                            key={m.id} 
                            match={m} 
                            userName={currentUser.name} 
                            onDelete={(id) => {
                              import('@/lib/storage').then(mod => {
                                mod.deleteStorageMatch(id);
                                setMatches((prev: Match[]) => prev.filter(match => match.id !== id));
                              });
                            }} 
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
      </main>
    </>
  );
}
