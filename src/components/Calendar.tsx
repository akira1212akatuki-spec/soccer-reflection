import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { Match } from '@/lib/storage';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CalendarProps {
  matches: Match[];
  userName: string;
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
}

export default function MatchCalendar({ matches, userName, selectedDate, onSelectDate }: CalendarProps) {
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
    <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px' }}>
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="btn-icon" style={{ width: 32, height: 32 }}><ChevronLeft size={16} /></button>
        <div className="flex gap-1">
          <select 
            value={currentDate.getFullYear()} 
            onChange={(e) => {
              const newDate = new Date(currentDate);
              newDate.setFullYear(parseInt(e.target.value));
              setCurrentDate(newDate);
            }}
            className="form-input"
            style={{ padding: '2px 8px', fontSize: '0.9rem', width: 'auto', border: 'none', background: 'transparent', fontWeight: 700 }}
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          <select 
            value={currentDate.getMonth()} 
            onChange={(e) => {
              const newDate = new Date(currentDate);
              newDate.setMonth(parseInt(e.target.value));
              setCurrentDate(newDate);
            }}
            className="form-input"
            style={{ padding: '2px 8px', fontSize: '0.9rem', width: 'auto', border: 'none', background: 'transparent', fontWeight: 700 }}
          >
            {Array.from({ length: 12 }, (_, i) => i).map(m => (
              <option key={m} value={m}>{m + 1}月</option>
            ))}
          </select>
        </div>
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
                if (isSameDay(day, selectedDate as Date)) {
                  onSelectDate(null); // Deselect if already selected
                } else {
                  onSelectDate(day);
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
                background: isSameDay(day, selectedDate as Date) ? 'var(--primary-color)' : (hasMatch ? 'var(--primary-glow)' : 'transparent'),
                border: isSameDay(day, selectedDate as Date) ? '1px solid var(--primary-color)' : (hasMatch ? '1px solid var(--primary-color)' : '1px solid transparent'),
                fontWeight: (hasMatch || isSameDay(day, selectedDate as Date)) ? 700 : 400,
                color: isSameDay(day, selectedDate as Date) ? 'white' : (isCurrentMonth ? 'var(--text-main)' : 'rgba(0,0,0,0.2)'),
                transition: 'all 0.2s ease',
                boxShadow: isSameDay(day, selectedDate as Date) ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none',
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
