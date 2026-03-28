import React from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Match } from '@/lib/storage';
import { Calendar, ChevronRight, Swords, Trash2, Edit } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  userName: string;
  onDelete?: (id: string) => void;
}

export default function MatchCard({ match, userName, onDelete }: MatchCardProps) {
  const router = useRouter();
  const formattedDate = format(new Date(match.date), 'yyyy/MM/dd HH:mm');
  
  const renderScoreLine = (my: number, opponent: number, showLabel: boolean = true) => {
    let label = null;
    if (showLabel) {
      if (my > opponent) label = <span className="status-label status-win" style={{ fontSize: '0.65rem', padding: '1px 4px' }}>勝利</span>;
      else if (my < opponent) label = <span className="status-label status-loss" style={{ fontSize: '0.65rem', padding: '1px 4px' }}>敗北</span>;
      else label = <span className="status-label status-draw" style={{ fontSize: '0.65rem', padding: '1px 4px' }}>引分</span>;
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', width: '100%' }}>
        {label}
        <div style={{ fontWeight: 700, fontSize: '0.95rem', minWidth: '40px', textAlign: 'center', color: 'var(--text-main)' }}>
          {my}-{opponent}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="match-card-row block group cursor-pointer" 
      onClick={() => router.push(`/match/${match.id}?user=${encodeURIComponent(userName)}`)}
      style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '12px', 
        padding: '12px 16px', 
        width: '100%'
      }}
    >
      <div style={{ flex: '1', minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '2px' }}>
        <span style={{ fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {match.type === 'practice' ? (match.practiceName || '練習') : match.opponent}
        </span>
        {match.type === 'practice' && <span className="status-label status-practice">練習</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
        {match.type !== 'practice' && (
          <>
            {match.scores && match.scores.length > 0 ? (
              match.scores.map((s, idx) => (
                <div key={idx}>
                  {renderScoreLine(s.my, s.opponent)}
                </div>
              ))
            ) : (
              match.myScore !== undefined && match.opponentScore !== undefined && (
                renderScoreLine(match.myScore, match.opponentScore)
              )
            )}
          </>
        )}
      </div>


      <div style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
        {format(new Date(match.date), 'MM/dd')}
      </div>

      <div 
        className="flex items-center gap-1" 
        onClick={e => { e.preventDefault(); e.stopPropagation(); }}
      >
        <button 
          className="p-1.5 rounded-full hover:bg-slate-100 transition-colors" 
          onClick={() => router.push(`/match/edit/${match.id}`)}
        >
          <Edit size={18} className="text-slate-400" />
        </button>
        {onDelete && (
          <button 
            className="p-1.5 rounded-full hover:bg-red-50 transition-colors" 
            onClick={() => {
              if (window.confirm('この記録を一覧から削除しますか？')) {
                onDelete(match.id);
              }
            }}
          >
            <Trash2 size={18} className="text-red-300" />
          </button>
        )}
      </div>
    </div>
  );
}
