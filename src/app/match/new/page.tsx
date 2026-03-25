"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ChevronLeft, Save } from 'lucide-react';
import { saveStorageMatch, Evaluation, User, getStorageUsers } from '@/lib/storage';

function NewMatchForm() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const active = localStorage.getItem('active_user_id');
    if (!active) {
      router.push('/');
    } else {
      setUserId(active);
    }
  }, [router]);

  // Form states
  const [type, setType] = useState<'match' | 'practice'>('match');
  const [opponent, setOpponent] = useState('');
  const [practiceName, setPracticeName] = useState('');
  const [myScore, setMyScore] = useState('');
  const [opponentScore, setOpponentScore] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    // HTML5 datetime-local format: YYYY-MM-DDThh:mm
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [goodPoints, setGoodPoints] = useState('');
  const [badPoints, setBadPoints] = useState('');
  const [comment, setComment] = useState('');

  // Evaluation states
  const [evaluation, setEvaluation] = useState<Evaluation>({
    challenge: 3,
    transition: 3,
    intelligence: 3,
    hardwork: 3,
    mental: 3,
    captaincy: 3,
  });

  const handleSliderChange = (key: keyof Evaluation, value: number) => {
    setEvaluation(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !opponent) return;

    const newMatch = {
      id: uuidv4(),
      userId,
      type,
      opponent: type === 'match' ? opponent : undefined,
      practiceName: type === 'practice' ? practiceName : undefined,
      myScore: type === 'match' && myScore ? parseInt(myScore, 10) : undefined,
      opponentScore: type === 'match' && opponentScore ? parseInt(opponentScore, 10) : undefined,
      date: new Date(date).toISOString(),
      goodPoints,
      badPoints,
      comment,
      evaluation,
      createdAt: Date.now(),
    };

    saveStorageMatch(newMatch);
    router.push('/');
  };

  if (!userId) return null;

  const renderSlider = (key: keyof Evaluation, label: string, desc: string) => (
    <div className="evaluation-item" key={key}>
      <div className="evaluation-header">
        <div style={{display:'flex', flexDirection:'column', gap: '2px'}}>
          <span className="evaluation-label">{label}</span>
          <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{desc}</span>
        </div>
        <span className="evaluation-value">{evaluation[key]}</span>
      </div>
      <input
        type="range"
        min="1"
        max="5"
        step="1"
        value={evaluation[key]}
        onChange={(e) => handleSliderChange(key, parseInt(e.target.value))}
      />
      <div className="flex justify-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>1 (低)</span>
        <span>5 (高)</span>
      </div>
    </div>
  );

  return (
    <>
      <header className="page-header">
        <button className="btn-icon" onClick={() => router.push('/')}>
          <ChevronLeft size={20} />
        </button>
        <h1 className="page-title">新規試合記録</h1>
        <div style={{ width: 40 }} /> {/* Spacer */}
      </header>

      <main className="main-content" style={{ paddingBottom: '40px' }}>
        <form onSubmit={handleSubmit}>
          <div className="glass-panel mb-6">
            <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
              <button 
                type="button"
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === 'match' ? 'bg-white shadow-sm text-primary-color' : 'text-slate-500'}`}
                onClick={() => setType('match')}
              >
                試合
              </button>
              <button 
                type="button"
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === 'practice' ? 'bg-white shadow-sm text-primary-color' : 'text-slate-500'}`}
                onClick={() => setType('practice')}
              >
                練習
              </button>
            </div>

            <h2 className="form-label mb-4" style={{ fontSize: '1rem', color: 'var(--text-main)' }}>基本情報</h2>
            
            {type === 'match' ? (
              <>
                <div className="form-group">
                  <label className="form-label">対戦相手 *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required={type === 'match'}
                    value={opponent} 
                    onChange={e => setOpponent(e.target.value)} 
                    placeholder="例: FC東京" 
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">スコア</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="number" 
                      min="0"
                      className="form-input" 
                      style={{width: '80px', textAlign: 'center'}}
                      value={myScore} 
                      onChange={e => setMyScore(e.target.value)} 
                      placeholder="自" 
                    />
                    <span style={{fontWeight: 'bold', color: 'var(--text-muted)'}}>-</span>
                    <input 
                      type="number" 
                      min="0"
                      className="form-input" 
                      style={{width: '80px', textAlign: 'center'}}
                      value={opponentScore} 
                      onChange={e => setOpponentScore(e.target.value)} 
                      placeholder="相手" 
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="form-group">
                <label className="form-label">練習名（スクールなど） *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required={type === 'practice'}
                  value={practiceName} 
                  onChange={e => setPracticeName(e.target.value)} 
                  placeholder="例: サッカースクール / 個人練習" 
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">試合日時 *</label>
              <input 
                type="datetime-local" 
                className="form-input" 
                required 
                value={date} 
                onChange={e => setDate(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">良かった点</label>
              <textarea 
                className="form-textarea" 
                value={goodPoints} 
                onChange={e => setGoodPoints(e.target.value)} 
                placeholder="良かった点や成功したプレー" 
              />
            </div>
            
            <div className="form-group mb-0">
              <label className="form-label">改善点</label>
              <textarea 
                className="form-textarea" 
                value={badPoints} 
                onChange={e => setBadPoints(e.target.value)} 
                placeholder="次に向けての課題や反省点" 
              />
            </div>

            <div className="form-group mt-4 mb-0">
              <label className="form-label">感想・メモ</label>
              <textarea 
                className="form-textarea" 
                value={comment} 
                onChange={e => setComment(e.target.value)} 
                placeholder="その他の感想やメモ" 
              />
            </div>
          </div>

          <div className="glass-panel mb-6">
            <h2 className="form-label mb-4" style={{ fontSize: '1rem', color: 'var(--text-main)' }}>自己評価 (1〜5点)</h2>
            <div className="evaluation-list">
              {renderSlider('challenge', '1. チャレンジ', '失敗を恐れない姿勢、仕掛け')}
              {renderSlider('transition', '2. トランジション', '攻守の切り替えの早さ')}
              {renderSlider('intelligence', '3. インテリジェンス', '状況判断、事前の首振り')}
              {renderSlider('hardwork', '4. ハードワーク', '球際の強さ、運動量')}
              {renderSlider('mental', '5. メンタル', 'ミス後やビハインド時の振る舞い')}
              {renderSlider('captaincy', '6. キャプテンシー', '周囲への声掛け、試合以外の行動')}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '16px' }}>
            <Save size={20} />
            保存する
          </button>
        </form>
      </main>
    </>
  );
}

export default function NewMatch() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewMatchForm />
    </Suspense>
  );
}
