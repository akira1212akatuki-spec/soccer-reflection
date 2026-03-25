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
          <div className="flex flex-col gap-2 mb-6">
            <h2 className="form-label" style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 800 }}>振り返り詳細</h2>
            
            <div style={{ 
              marginTop: '8px',
              padding: '16px', 
              borderRadius: '12px',
              backgroundColor: resultBg,
              border: `1px solid ${resultColor}22`
            }}>
              <div className="flex flex-col">
                <div style={{ color: resultColor, fontWeight: 800, fontSize: '0.875rem', marginBottom: '4px' }}>
                  {status}
                </div>
                {match.type !== 'practice' ? (
                  <div className="flex items-center gap-4">
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-main)' }}>
                      {match.myScore} - {match.opponentScore}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {match.practiceName || '練習メニュー'}
                  </div>
                )}
                {match.type !== 'practice' && (
                  <div className="mt-1 text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                    対戦相手: {match.opponent}
                  </div>
                )}
              </div>
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
          />
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
