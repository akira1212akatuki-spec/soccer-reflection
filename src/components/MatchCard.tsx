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
  
  const getStatusLabel = () => {
    if (match.type === 'practice') return <span className="status-label status-practice">練習</span>;
    if (match.myScore === undefined || match.opponentScore === undefined) return null;
    if (match.myScore > match.opponentScore) return <span className="status-label status-win">勝利</span>;
    if (match.myScore < match.opponentScore) return <span className="status-label status-loss">敗北</span>;
    return <span className="status-label status-draw">引分</span>;
  };

  return (
    <div 
      className="match-card relative block group cursor-pointer" 
      onClick={() => router.push(`/match/${match.id}?user=${encodeURIComponent(userName)}`)}
    >
      <div className="match-card-header">
        <div className="match-card-opponent" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Swords size={18} className="icon-subtle flex-shrink-0" />
          <span className="opponent-name truncate max-w-[150px]">
            {match.type === 'practice' ? (match.practiceName || '練習') : match.opponent}
          </span>
          {getStatusLabel()}
        </div>
        {match.type !== 'practice' && (
          <div className="match-card-score whitespace-nowrap">{match.myScore} - {match.opponentScore}</div>
        )}
      </div>
      
      <div className="match-card-body">
        <p className="match-comment" style={{marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
          <strong style={{fontSize: '0.75rem', color: 'var(--text-main)'}}>良かった点: </strong>
          {match.goodPoints || 'なし'}
        </p>
      </div>
      
      <div className="match-card-footer flex justify-between items-center w-full">
        <div className="match-date flex items-center gap-1">
          <Calendar size={14} className="icon-subtle" />
          <span>{formattedDate}</span>
        </div>
        
        <div 
          className="flex items-center gap-2 relative z-10" 
          onClick={e => { e.preventDefault(); e.stopPropagation(); }}
        >
          <button 
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" 
            onClick={() => router.push(`/match/edit/${match.id}`)}
          >
            <Edit size={16} className="text-slate-500" />
          </button>
          {onDelete && (
            <button 
              className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" 
              onClick={() => {
                if (window.confirm('この記録を一覧から削除しますか？')) {
                  onDelete(match.id);
                }
              }}
            >
              <Trash2 size={16} className="text-red-500" />
            </button>
          )}
          <ChevronRight size={18} className="icon-accent" style={{ marginLeft: '4px' }} />
        </div>
      </div>
    </div>
  );
}
