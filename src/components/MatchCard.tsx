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
      className="match-card-row block group cursor-pointer" 
      onClick={() => router.push(`/match/${match.id}?user=${encodeURIComponent(userName)}`)}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        padding: '12px', 
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        backgroundColor: 'white',
        borderRadius: '8px',
        marginBottom: '4px'
      }}
    >
      <div style={{ flex: '1', minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {match.type === 'practice' ? (match.practiceName || '練習') : match.opponent}
        </span>
        {getStatusLabel()}
      </div>

      {match.type !== 'practice' && (
        <div style={{ fontWeight: 700, fontSize: '0.95rem', minWidth: '45px', textAlign: 'center' }}>
          {match.myScore}-{match.opponentScore}
        </div>
      )}

      <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
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
          <Edit size={16} className="text-slate-400" />
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
            <Trash2 size={16} className="text-red-300" />
          </button>
        )}
      </div>
    </div>
  );
}
