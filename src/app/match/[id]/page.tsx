"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Calendar, Swords, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { 
  Match, 
  getStorageMatchById, 
  calculateAverageEvaluation,
  deleteStorageMatch,
  Evaluation 
} from '@/lib/storage';
import RadarChart from '@/components/RadarChart';

function MatchDetailContent() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.id as string;
  
  const [match, setMatch] = useState<Match | null>(null);
  const [average, setAverage] = useState<Evaluation | null>(null);

  useEffect(() => {
    if (matchId) {
      const storedMatch = getStorageMatchById(matchId);
      if (storedMatch) {
        setMatch(storedMatch);
        // Active user logic is implied because match has userId
        const avg = calculateAverageEvaluation(storedMatch.userId);
        setAverage(avg);
      } else {
        router.push('/');
      }
    }
  }, [matchId, router]);

  if (!match) return null;

  const formattedDate = format(new Date(match.date), 'yyyy年MM月dd日 HH:mm');
  const chartAverage = average || match.evaluation;

  let status = '引き分け';
  let statusClass = 'status-draw-large';
  let resultColor = '#64748b'; // Default for draw/practice
  let resultBg = 'rgba(100, 116, 139, 0.1)'; // Default for draw/practice

  if (match.type === 'practice') {
    status = '練習';
    statusClass = 'status-draw-large'; // Use neutral for practice
    resultColor = '#64748b';
    resultBg = 'rgba(100, 116, 139, 0.1)';
  } else if (match.myScore !== undefined && match.opponentScore !== undefined) {
    if (match.myScore > match.opponentScore) {
      status = '勝利';
      statusClass = 'status-win-large';
      resultColor = '#ef4444'; // Red for win
      resultBg = 'rgba(239, 68, 68, 0.1)';
    } else if (match.myScore < match.opponentScore) {
      status = '敗北';
      statusClass = 'status-loss-large';
      resultColor = '#3b82f6'; // Blue for loss
      resultBg = 'rgba(59, 130, 246, 0.1)';
    } else { // Draw
      status = '引き分け';
      statusClass = 'status-draw-large';
      resultColor = '#64748b';
      resultBg = 'rgba(100, 116, 139, 0.1)';
    }
  }

  return (
    <>
      <header className="page-header">
        <button className="btn-icon" onClick={() => router.push('/')}>
          <ChevronLeft size={20} />
        </button>
        <h1 className="page-title">振り返り詳細</h1>
        <div className="flex gap-2">
          <button className="btn-icon" onClick={() => router.push(`/match/edit/${match.id}`)}>
            <Edit size={20} className="icon-subtle" />
          </button>
          <button className="btn-icon" onClick={() => {
            if (window.confirm('この試合の記録を削除してもよろしいですか？')) {
              deleteStorageMatch(match.id);
              router.push('/');
            }
          }}>
            <Trash2 size={20} className="icon-accent" />
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="glass-panel">
          <div className="flex flex-col gap-3 mb-6">
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>
              {formattedDate}
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              flexWrap: 'wrap',
              gap: '12px',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontSize: '1.4rem', 
                  fontWeight: 900, 
                  color: 'var(--text-main)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {match.type === 'practice' ? (match.practiceName || '練習メニュー') : match.opponent}
                </div>
                
                <div style={{ 
                  color: match.type === 'practice' ? '#075985' : 
                         (match.myScore! > match.opponentScore! ? '#166534' : 
                          match.myScore! < match.opponentScore! ? '#991b1b' : '#475569'),
                  fontWeight: 800, 
                  fontSize: '0.85rem',
                  backgroundColor: match.type === 'practice' ? '#e0f2fe' : 
                                  (match.myScore! > match.opponentScore! ? '#dcfce7' : 
                                   match.myScore! < match.opponentScore! ? '#fee2e2' : '#f1f5f9'),
                  padding: '4px 10px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap'
                }}>
                  {status}
                </div>
              </div>
              
              {match.type !== 'practice' && (
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{match.myScore}</span>
                  <span style={{ fontSize: '1.2rem', opacity: 0.3 }}>-</span>
                  <span>{match.opponentScore}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
              <h3 className="form-label mb-2" style={{ color: 'var(--primary-color)' }}>良かった点</h3>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                {match.goodPoints || '未入力'}
              </p>
            </div>
            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
              <h3 className="form-label mb-2" style={{ color: 'var(--accent-color)' }}>改善点</h3>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                {match.badPoints || '未入力'}
              </p>
            </div>
            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
              <h3 className="form-label mb-2" style={{ color: 'var(--text-main)' }}>感想・メモ</h3>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                {match.comment || '未入力'}
              </p>
            </div>
          </div>
        </div>

        {/* レーダーチャートセクション (下に移動) */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h2 className="form-label text-center mb-2" style={{ color: 'var(--text-main)' }}>パフォーマンス分析</h2>
          <RadarChart 
            currentEvaluation={match.evaluation} 
            averageEvaluation={chartAverage} 
            showLegend={true}
          />
        </div>

        {/* AIからの振り返り・考察セクション (プレースホルダー) */}
        <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.25rem' }}>🤖</span>
            <h2 style={{ fontSize: '1rem', color: '#166534', fontWeight: 800, margin: 0 }}>AIからの振り返り・考察</h2>
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#166534', opacity: 0.9 }}>
            （AI連携機能を追加すると、ここに自動分析によるフィードバックが表示されます。現在は枠組みのみの準備となります。）
          </p>
        </div>
      </main>
    </>
  );
}

export default function MatchDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MatchDetailContent />
    </Suspense>
  );
}
