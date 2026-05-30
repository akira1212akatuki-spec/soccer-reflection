"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Calendar, Trophy, Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getStorageMatches, Match, Evaluation } from '@/lib/storage';
import RadarChart from '@/components/RadarChart';

export default function MonthlyReport() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [monthMatches, setMonthMatches] = useState<Match[]>([]);
  const [avgEvaluation, setAvgEvaluation] = useState<Evaluation | null>(null);
  const [targetMonth, setTargetMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // レポート生成（キャッシュ）
  useEffect(() => {
    if (!user) return;
    
    const fetchReport = async () => {
      setLoading(true);
      const matches = getStorageMatches(user.uid);
      
      // 対象月でフィルタ
      const filtered = matches.filter(m => {
        const d = new Date(m.createdAt);
        const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return mStr === targetMonth;
      });
      
      setMonthMatches(filtered);

      if (filtered.length > 0) {
        // 平均評価の計算
        const sum = { challenge: 0, transition: 0, intelligence: 0, hardwork: 0, mental: 0, captaincy: 0 };
        filtered.forEach(m => {
          sum.challenge += m.evaluation.challenge;
          sum.transition += m.evaluation.transition;
          sum.intelligence += m.evaluation.intelligence;
          sum.hardwork += m.evaluation.hardwork;
          sum.mental += m.evaluation.mental;
          sum.captaincy += m.evaluation.captaincy;
        });
        const count = filtered.length;
        setAvgEvaluation({
          challenge: sum.challenge / count,
          transition: sum.transition / count,
          intelligence: sum.intelligence / count,
          hardwork: sum.hardwork / count,
          mental: sum.mental / count,
          captaincy: sum.captaincy / count,
        });

        // キャッシュ確認
        const cacheKey = `monthly_report_${user.uid}_${targetMonth}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            // 件数が同じならキャッシュを利用
            if (parsed.matchCount === filtered.length) {
              setReportData(parsed);
              setLoading(false);
              return;
            }
          } catch(e) {}
        }

        // APIからレポート生成
        try {
          const res = await fetch('/api/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matches: filtered, userName: user.email?.split('@')[0] || 'ユーザー' })
          });
          const data = await res.json();
          if (!data.error) {
            const reportWithCount = { ...data, matchCount: filtered.length };
            setReportData(reportWithCount);
            localStorage.setItem(cacheKey, JSON.stringify(reportWithCount));
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setReportData({ report: '今月の記録がありません。振り返りを入力してレポートを作成しましょう！', highlightKeyword: '記録なし' });
        setAvgEvaluation(null);
      }
      setLoading(false);
    };

    fetchReport();
  }, [user, targetMonth]);

  if (!user) return null;

  const mvpMatch = reportData?.mvpGameId ? monthMatches.find(m => m.id === reportData.mvpGameId) : null;

  return (
    <>
      <header className="page-header flex items-center justify-between">
        <button className="btn-icon" onClick={() => router.push('/')}>
          <ChevronLeft size={20} />
        </button>
        <h1 className="page-title m-0">月間レポート</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="main-content" style={{ paddingBottom: '40px' }}>
        <div className="flex justify-between items-center mb-6">
          <input 
            type="month" 
            className="form-input" 
            style={{ width: 'auto', background: 'rgba(255,255,255,0.1)' }}
            value={targetMonth}
            onChange={(e) => setTargetMonth(e.target.value)}
          />
          <div className="text-sm text-gray-400">
            {monthMatches.length}回の記録
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-primary" size={40} />
            <span className="ml-3 text-primary font-bold">レポート生成中...</span>
          </div>
        ) : (
          <>
            <div className="glass-panel mb-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(255,107,107,0.15) 0%, rgba(78,205,196,0.15) 100%)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <h2 className="text-lg font-bold mb-2 text-white">今月のハイライト</h2>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] mb-2">
                {reportData?.highlightKeyword}
              </div>
            </div>

            {avgEvaluation && (
              <div className="glass-panel mb-6">
                <h3 className="text-md font-bold mb-4 flex items-center gap-2"><Star size={18} className="text-yellow-400"/> 今月の平均ステータス</h3>
                <div style={{ height: '300px', width: '100%', position: 'relative', left: '-5%' }}>
                  <RadarChart evaluation={avgEvaluation} />
                </div>
              </div>
            )}

            <div className="glass-panel mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
              <h3 className="text-md font-bold mb-4 flex items-center gap-2 relative z-10"><Calendar size={18} className="text-primary"/> AIコーチからの総評</h3>
              <p className="text-sm leading-relaxed text-gray-200 whitespace-pre-wrap relative z-10">
                {reportData?.report}
              </p>
            </div>

            {mvpMatch && (
              <div 
                className="glass-panel mb-6 cursor-pointer hover:bg-white/10 transition-colors relative overflow-hidden"
                onClick={() => router.push(`/match/${mvpMatch.id}`)}
                style={{ border: '1px solid rgba(255,215,0,0.3)' }}
              >
                <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '50px', height: '50px', background: 'gold', transform: 'rotate(45deg)', zIndex: 0, opacity: 0.8 }}></div>
                <h3 className="text-md font-bold mb-3 flex items-center gap-2 relative z-10"><Trophy size={18} className="text-yellow-500"/> 今月のMVP試合</h3>
                <div className="relative z-10">
                  <p className="text-sm font-bold text-white mb-1">
                    {new Date(mvpMatch.date).toLocaleDateString()} vs {mvpMatch.opponent || mvpMatch.practiceName}
                  </p>
                  <p className="text-xs text-gray-400 line-clamp-2">{mvpMatch.goodPoints}</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
