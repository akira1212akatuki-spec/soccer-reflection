import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { Match } from '@/lib/storage';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CalendarProps {
  matches: Match[];
  userName: string;
}

export default function MatchCalendar({ matches, userName }: CalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "yyyy年 MM月";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div style={{ width: '100%', marginBottom: '24px' }}>
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="btn-icon" style={{ width: 32, height: 32 }}><ChevronLeft size={16} /></button>
        <span style={{ fontWeight: 600 }}>{format(currentDate, dateFormat)}</span>
        <button onClick={nextMonth} className="btn-icon" style={{ width: 32, height: 32 }}><ChevronRight size={16} /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
        {['日', '月', '火', '水', '木', '金', '土'].map(d => (
          <div key={d} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {days.map((day, i) => {
          const dayMatches = matches.filter(m => isSameDay(new Date(m.date), day));
          const hasMatch = dayMatches.length > 0;
          const isCurrentMonth = isSameMonth(day, monthStart);

          return (
            <div 
              key={i} 
              onClick={() => {
                if (hasMatch) {
                  // If multiple, just go to the first one for simplicity, or we could show a list.
                  // For this app, going to the first match on that day is fine.
                  router.push(`/match/${dayMatches[0].id}?user=${encodeURIComponent(userName)}`);
                }
              }}
              style={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                borderRadius: '8px',
                cursor: hasMatch ? 'pointer' : 'default',
                color: isCurrentMonth ? 'var(--text-main)' : 'rgba(0,0,0,0.2)',
                background: hasMatch ? 'var(--primary-glow)' : 'transparent',
                border: hasMatch ? '1px solid var(--primary-color)' : '1px solid transparent',
                fontWeight: hasMatch ? 700 : 400
              }}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
}
