"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Calendar, Swords, Trash2, Edit, MessageCircle, Lock, Unlock } from 'lucide-react';
import { format } from 'date-fns';
import { 
  Match, 
  Evaluation 
} from '@/lib/storage';
import {
  getMatchById,
  deleteMatch,
  saveMatch,
  getMatches,
  calculateAverageEvaluationFromFirestore
} from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import RadarChart from '@/components/RadarChart';

function MatchDetailContent() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.id as string;
  const { user } = useAuth();
  
  const [match, setMatch] = useState<Match | null>(null);
  const [average, setAverage] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiKeyword, setAiKeyword] = useState<string | null>(null);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);

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

  useEffect(() => {
    const fetchMatchDetails = async () => {
      setIsLoading(true);
      try {
        if (!user) return;
        const fetchedMatch = await getMatchById(matchId);
        if (fetchedMatch) {
          setMatch(fetchedMatch);
          if (fetchedMatch.aiAdvice) setAiAdvice(fetchedMatch.aiAdvice);
          if (fetchedMatch.aiKeyword) setAiKeyword(fetchedMatch.aiKeyword);
          
          const avg = await calculateAverageEvaluationFromFirestore(fetchedMatch.userId);
          setAverage(avg);
        } else {
          router.push('/');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (matchId) {
      fetchMatchDetails();
    }
  }, [matchId, router, user]);

  const handleAnalyze = async () => {
    if (!match) return;
    setIsAnalyzing(true);
    setErrorHeader(null);
    try {
      const allMatches = await getMatches(match.userId);
      const history = allMatches.filter(m => m.id !== match.id);
      
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
        
        const updatedMatch: Match = {
          ...match,
          aiAdvice: data.advice,
          aiKeyword: data.keyword,
          aiFixed: true
        };
        await saveMatch(updatedMatch);
        setMatch(updatedMatch);
      }
    } catch (err) {
      console.error(err);
      setErrorHeader('AI分析中にエラーが発生しました。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleFix = async () => {
    if (!match) return;
    const updatedMatch: Match = {
      ...match,
      aiFixed: !match.aiFixed
    };
    await saveMatch(updatedMatch);
    setMatch(updatedMatch);
  };

  const handleAskQuestion = async () => {
    if (!match || !question.trim()) return;
    setIsAnswering(true);
    try {
      const allMatches = await getMatches(match.userId);
      const history = allMatches.filter(m => m.id !== match.id);

      const response = await fetch('/api/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          matchData: match, 
          question, 
          history,
          chatHistory: match.aiQuestions || []
        })
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        const newQuestion = {
          question,
          answer: data.answer,
          persona: '日本代表クラス',
          timestamp: Date.now()
        };
        const updatedMatch: Match = {
          ...match,
          aiQuestions: [...(match.aiQuestions || []), newQuestion]
        };
        await saveMatch(updatedMatch);
        setMatch(updatedMatch);
        setQuestion('');
      }
    } catch (err) {
      console.error(err);
      alert('質問の送信中にエラーが発生しました。');
    } finally {
      setIsAnswering(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('この試合の記録を削除してもよろしいですか？')) {
      if (match) {
        await deleteMatch(match.id);
        router.push('/');
      }
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!match) return null;

  // 親アカウントかどうか簡易判定（自分以外のデータを見ている、あるいはemailにadminが含まれる）
  const isParentView = user && (user.uid !== match.userId || user.email?.includes('admin') || user.email?.includes('parent'));

  const formattedDate = format(new Date(match.date), 'yyyy年MM月dd日 HH:mm');
  const chartAverage = average || match.evaluation;

  const renderScoreRow = (my: number, opponent: number, index?: number, total?: number) => {
    let matchStatus = 'DRAW';
    let statusGradient = 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)';
    let statusShadow = 'rgba(148, 163, 184, 0.2)';

    if (my > opponent) {
      matchStatus = 'WIN';
      statusGradient = 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)';
      statusShadow = 'rgba(74, 222, 128, 0.3)';
    } else if (my < opponent) {
      matchStatus = 'LOSS';
      statusGradient = 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)';
      statusShadow = 'rgba(251, 113, 133, 0.3)';
    }

    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '16px 20px', 
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.03)',
        marginBottom: '4px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {total && total > 1 && (
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              MATCH {index! + 1}
            </span>
          )}
          <div style={{ 
            padding: '2px 10px', 
            borderRadius: '20px', 
            background: statusGradient,
            color: 'white',
            fontSize: '0.7rem',
            fontWeight: 900,
            textAlign: 'center',
            width: 'fit-content',
            boxShadow: `0 4px 10px ${statusShadow}`
          }}>
            {matchStatus}
          </div>
        </div>
        
        <div style={{ 
          fontSize: '2.2rem', 
          fontWeight: 900, 
          color: 'var(--text-main)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          fontFamily: "'Inter', sans-serif"
        }}>
          <span style={{ minWidth: '35px', textAlign: 'right' }}>{my}</span>
          <span style={{ fontSize: '1.2rem', opacity: 0.2 }}>:</span>
          <span style={{ minWidth: '35px', textAlign: 'left' }}>{opponent}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <header className="page-header relative z-10">
        <button className="btn-icon" onClick={() => router.push('/')}>
          <ChevronLeft size={20} />
        </button>
        <h1 className="page-title text-base sm:text-lg whitespace-nowrap overflow-hidden text-ellipsis px-2 m-0">振り返り詳細</h1>
        
        {!isParentView ? (
          <div className="flex gap-2">
            <button className="btn-icon" onClick={() => router.push(`/match/edit/${match.id}`)}>
              <Edit size={20} className="icon-subtle" />
            </button>
            <button className="btn-icon" onClick={handleDelete}>
              <Trash2 size={20} className="icon-accent" />
            </button>
          </div>
        ) : (
          <div style={{ width: 40 }} />
        )}
      </header>

      <main className="main-content">
        <div className="glass-panel">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>
              {formattedDate} {match.userName && `(選手: ${match.userName})`}
            </div>

            <div style={{ 
              color: 'var(--text-main)',
              lineHeight: 1.2,
              display: 'flex',
              alignItems: 'baseline',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              {match.type === 'match' ? (
                <>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    対戦チーム
                  </span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>
                    {match.opponent}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>
                  {match.practiceName || '練習メニュー'}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {match.type === 'match' && (
                <>
                  {match.scores && match.scores.length > 0 ? (
                    match.scores.map((s, idx) => (
                      <React.Fragment key={idx}>
                        {renderScoreRow(s.my, s.opponent, idx, match.scores!.length)}
                      </React.Fragment>
                    ))
                  ) : (
                    match.myScore !== undefined && match.opponentScore !== undefined && (
                      renderScoreRow(match.myScore, match.opponentScore)
                    )
                  )}
                </>
              )}
              
              {match.type === 'practice' && (
                <div style={{ 
                  color: '#075985',
                  fontWeight: 800, 
                  fontSize: '0.9rem',
                  backgroundColor: '#e0f2fe',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  width: 'fit-content',
                  boxShadow: '0 4px 12px rgba(7, 89, 133, 0.1)'
                }}>
                  PRACTICE SESSION
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
              {match.goodPointsDetail && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    詳細：良かったプレーは？なぜうまくいったと思う？
                  </h4>
                  <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
                    {match.goodPointsDetail}
                  </p>
                </div>
              )}
            </div>
            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
              <h3 className="form-label mb-2" style={{ color: 'var(--accent-color)' }}>改善点</h3>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                {match.badPoints || '未入力'}
              </p>
              {match.badPointsDetail && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    詳細：次はどうすればよくなる？具体的に何を意識する？
                  </h4>
                  <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
                    {match.badPointsDetail}
                  </p>
                </div>
              )}
            </div>
            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
              <h3 className="form-label mb-2" style={{ color: 'var(--text-main)' }}>感想・メモ</h3>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                {match.comment || '未入力'}
              </p>
            </div>
          </div>
        </div>

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
            {aiAdvice && (
              <button 
                onClick={handleToggleFix}
                className={match.aiFixed ? "text-primary" : "text-muted"}
                title={match.aiFixed ? "分析を固定中" : "分析を固定する"}
              >
                {match.aiFixed ? <Lock size={18} /> : <Unlock size={18} />}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ alignSelf: 'flex-start', background: 'white', padding: '16px', borderRadius: '14px 14px 14px 2px', fontSize: '0.95rem', maxWidth: '90%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid rgba(22, 101, 52, 0.1)', color: '#166534', lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.75rem', marginBottom: '8px', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🤖</span> AIプロコーチの分析
                  </div>
                  {aiAdvice}
                </div>

                {(match.aiQuestions || []).map((q, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ alignSelf: 'flex-end', background: '#dcfce7', padding: '10px 14px', borderRadius: '14px 14px 2px 14px', fontSize: '0.875rem', maxWidth: '85%', border: '1px solid #bbf7d0' }}>
                      {q.question}
                    </div>
                    <div style={{ alignSelf: 'flex-start', background: 'white', padding: '12px 16px', borderRadius: '14px 14px 14px 2px', fontSize: '0.9rem', maxWidth: '90%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid rgba(22, 101, 52, 0.1)', color: '#166534', lineHeight: 1.6 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.75rem', marginBottom: '4px', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>✨</span> 日本代表クラスの選手
                      </div>
                      {q.answer}
                    </div>
                  </div>
                ))}
              </div>

              {!isParentView && (
                  <div style={{ borderTop: '1px solid rgba(22, 101, 52, 0.1)', paddingTop: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ flex: 1, borderRadius: '12px', border: '1px solid #bbf7d0' }}
                        placeholder="コーチにさらに質問する..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                      />
                      <button 
                        className="btn-primary" 
                        style={{ width: 'auto', padding: '0 20px', borderRadius: '12px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                        onClick={handleAskQuestion}
                        disabled={isAnswering || !question.trim()}
                      >
                        {isAnswering ? '分析中...' : 'AIプロコーチからの返信'}
                      </button>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#166534', opacity: 0.7, marginTop: '8px', textAlign: 'center' }}>
                      日本代表プロ選手があなたの質問に答えてくれます
                    </p>
                  </div>
              )}

              {aiKeyword && (
                  <div style={{ marginTop: '8px', borderTop: '1px solid rgba(22, 101, 52, 0.1)', paddingTop: '20px' }}>
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

          {aiAdvice && !isAnalyzing && !match.aiFixed && !isParentView && (
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
