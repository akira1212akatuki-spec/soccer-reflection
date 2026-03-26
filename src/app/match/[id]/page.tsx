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
  getStorageMatches,
  saveStorageMatch,
  Evaluation 
} from '@/lib/storage';
import RadarChart from '@/components/RadarChart';

function MatchDetailContent() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.id as string;
  
  const [match, setMatch] = useState<Match | null>(null);
  const [average, setAverage] = useState<Evaluation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiKeyword, setAiKeyword] = useState<string | null>(null);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);

  // 検索用キーワードマッピング (ID管理から、より確実な検索ワード管理へ移行)
  const youtubeSearchKeywords: Record<string, string> = {
    'シュート': 'シュート練習 決定力向上',
    'ドリブル': 'ドリブル 抜き技 基礎',
    '1vs1守備': 'サッカー 守備 1vs1 コツ',
    'トラップ': 'サッカー トラップ 基礎',
    'ポジショニング': 'サッカー ポジショニング 動き直し',
    '体力・スタミナ': 'サッカー スタミナ トレーニング',
    'ヘディング': 'サッカー ヘディング 競り合い',
    'パス': 'サッカー パス 精度 向上',
    'ディフェンス': 'サッカー 守備 基礎',
    '1vs1': 'サッカー 1vs1 攻撃 守備'
  };

  const handleAnalyze = async () => {
    if (!match) return;
    setIsAnalyzing(true);
    setErrorHeader(null);
    try {
      // 過去の履歴（今回の試合を除く）を取得して渡す
      const history = getStorageMatches(match.userId).filter(m => m.id !== match.id);
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchData: match, history })
      });
      const data = await response.json();
      if (data.error) {
        setErrorHeader(data.error);
      } else {
        setAiAdvice(data.advice);
        setAiKeyword(data.keyword);
        
        // 分析結果を保存
        const updatedMatch: Match = {
          ...match,
          aiAdvice: data.advice,
          aiKeyword: data.keyword
        };
        saveStorageMatch(updatedMatch);
        setMatch(updatedMatch);
      }
    } catch (err) {
      console.error(err);
      setErrorHeader('AI分析中にエラーが発生しました。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (matchId) {
      const storedMatch = getStorageMatchById(matchId);
      if (storedMatch) {
        setMatch(storedMatch);
        if (storedMatch.aiAdvice) setAiAdvice(storedMatch.aiAdvice);
        if (storedMatch.aiKeyword) setAiKeyword(storedMatch.aiKeyword);
        
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            {/* 1段目: 日付 */}
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>
              {formattedDate}
            </div>

            {/* 2段目: 対戦相手 */}
            <div style={{ 
              fontSize: '1.6rem', 
              fontWeight: 900, 
              color: 'var(--text-main)',
              lineHeight: 1.2
            }}>
              {match.type === 'practice' ? (match.practiceName || '練習メニュー') : match.opponent}
            </div>

            {/* 3段目: 勝敗と点数 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                color: match.type === 'practice' ? '#075985' : 
                       (match.myScore! > match.opponentScore! ? '#166534' : 
                        match.myScore! < match.opponentScore! ? '#991b1b' : '#475569'),
                fontWeight: 800, 
                fontSize: '0.9rem',
                backgroundColor: match.type === 'practice' ? '#e0f2fe' : 
                                (match.myScore! > match.opponentScore! ? '#dcfce7' : 
                                 match.myScore! < match.opponentScore! ? '#fee2e2' : '#f1f5f9'),
                padding: '4px 12px',
                borderRadius: '6px'
              }}>
                {status}
              </div>
              
              {match.type !== 'practice' && (
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{match.myScore}</span>
                  <span style={{ fontSize: '1.5rem', opacity: 0.3 }}>-</span>
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
        <div className="glass-panel" style={{ padding: '24px 16px' }}>
          <h2 className="form-label text-center mb-4" style={{ color: 'var(--text-main)', fontSize: '1.25rem' }}>パフォーマンス分析</h2>
          <div style={{ height: '450px', width: '100%' }}>
            <RadarChart 
              currentEvaluation={match.evaluation} 
              averageEvaluation={chartAverage} 
              showLegend={true}
            />
          </div>
        </div>

        {/* AIからの振り返り・考察セクション */}
        <div className="glass-panel" style={{ 
          padding: '24px', 
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
          border: '1px solid #bbf7d0',
          boxShadow: '0 10px 25px -5px rgba(22, 101, 52, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>🤖</span>
              <h2 style={{ fontSize: '1.1rem', color: '#166534', fontWeight: 800, margin: 0 }}>AIプロコーチの分析</h2>
            </div>
            {!aiAdvice && !isAnalyzing && (
              <button 
                className="btn-primary" 
                onClick={handleAnalyze}
                style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
              >
                分析を依頼する
              </button>
            )}
          </div>

          {isAnalyzing ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '8px' }}>コーチが試合内容を分析中...</div>
              <div style={{ width: '30px', height: '30px', border: '3px solid #bbf7d0', borderTopColor: '#166534', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
              <style jsx>{`
                @keyframes spin { to { transform: rotate(360deg); } }
              `}</style>
            </div>
          ) : aiAdvice ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ 
                padding: '16px', 
                background: 'white', 
                borderRadius: '12px', 
                border: '1px solid rgba(22, 101, 52, 0.1)',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                color: '#166534'
              }}>
                {aiAdvice}
              </div>

              {/* YouTube動画提案 */}
              {aiKeyword && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '1.25rem' }}>📺</span>
                      <h3 style={{ fontSize: '0.95rem', color: '#166534', fontWeight: 700, margin: 0 }}>
                        おすすめの練習動画: <span style={{ textDecoration: 'underline' }}>{aiKeyword}</span>
                      </h3>
                    </div>
                    
                    <a 
                      href={`https://www.youtube.com/results?search_query=サッカー+${encodeURIComponent(youtubeSearchKeywords[aiKeyword] || aiKeyword)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        display: 'block', 
                        textDecoration: 'none',
                        position: 'relative', 
                        width: '100%', 
                        background: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url("https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '16px', 
                        overflow: 'hidden',
                        aspectRatio: '16/9',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                        transition: 'transform 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {/* 再生アイコンオーバーレイ */}
                      <div style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white',
                        padding: '20px',
                        textAlign: 'center'
                      }}>
                        <div style={{ 
                          width: '64px', 
                          height: '64px', 
                          background: 'rgba(255,0,0,0.9)', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          marginBottom: '16px',
                          boxShadow: '0 0 20px rgba(255,0,0,0.5)'
                        }}>
                          <div style={{ 
                            width: 0, 
                            height: 0, 
                            borderStyle: 'solid', 
                            borderWidth: '12px 0 12px 20px', 
                            borderColor: 'transparent transparent transparent #ffffff',
                            marginLeft: '4px'
                          }}></div>
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.05em', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                          YouTubeで練習動画を探す
                        </span>
                        <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '8px' }}>
                          「{aiKeyword}」に関する最新の動画を表示します
                        </div>
                      </div>
                    </a>
                  </div>
              )}
            </div>
          ) : errorHeader ? (
             <p style={{ fontSize: '0.9rem', color: '#991b1b', background: '#fee2e2', padding: '12px', borderRadius: '8px' }}>
               {errorHeader}
             </p>
          ) : (
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#166534', opacity: 0.9 }}>
              「分析を依頼する」ボタンを押すと、Gemini AIがプロコーチの視点でアドバイスを生成し、おすすめの練習動画を提案します。
            </p>
          )}

          {aiAdvice && !isAnalyzing && (
            <div style={{ marginTop: '24px', borderTop: '1px solid rgba(22, 101, 52, 0.1)', paddingTop: '16px', textAlign: 'center' }}>
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                style={{ 
                  background: 'transparent',
                  border: '1px solid #166534',
                  color: '#166534',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: isAnalyzing ? 0.5 : 1
                }}
              >
                {isAnalyzing ? '分析中...' : '再分析を依頼する'}
              </button>
            </div>
          )}
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
