"use client";

import React, { useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { getEvolutionStage } from '@/lib/evolution';
import {
  EarnedExps,
  EXP_KEYS,
  EXP_LABELS,
  calcLevel,
  calcProgressExp,
  emptyExps,
} from '@/lib/xpCalculator';

interface StatusPanelProps {
  totalExps: EarnedExps;
}

export default function StatusPanel({ totalExps }: StatusPanelProps) {
  const exps = totalExps ?? emptyExps();

  // 総合Lv = 全項目Lvの平均
  const overallLevel = useMemo(() => {
    const levels = EXP_KEYS.map(k => calcLevel(exps[k] ?? 0));
    const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
    return Math.floor(avg);
  }, [exps]);

  const stage = getEvolutionStage(overallLevel);
  const firedRef = useRef(false);

  useEffect(() => {
    if (overallLevel >= 100 && !firedRef.current) {
      firedRef.current = true;
      
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#DAA520', '#F0E68C']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#DAA520', '#F0E68C']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [overallLevel]);

  return (
    <div className="rpg-panel">
      <div className="rpg-title">⚔ PLAYER STATUS ⚔</div>
      <div className="rpg-overall">総合 Lv.{overallLevel}</div>

      <div className="flex flex-col items-center justify-center my-4 p-4" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,224,102,0.3)' }}>
        <div style={{ width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '12px' }}>
          <img 
            src={stage.image} 
            alt={stage.name} 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} 
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        <div style={{ color: '#ffe066', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '0.05em', marginBottom: '4px' }}>
          {stage.name}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#7ae7c7', textAlign: 'center' }}>
          {stage.soccerElement}
        </div>
      </div>

      {EXP_KEYS.map(key => {
        const exp = exps[key] ?? 0;
        const level = calcLevel(exp);
        const { current, needed, progress } = calcProgressExp(exp);

        return (
          <div className="rpg-row" key={key}>
            <div className="rpg-label-row">
              <span className="rpg-label">{EXP_LABELS[key]}</span>
              <span className="rpg-lv">Lv.{level}</span>
            </div>
            <div className="rpg-bar-wrap">
              <div className="rpg-bar" style={{ width: `${progress}%` }} />
            </div>
            <div className="rpg-exp-text">あと {needed - current} EXP</div>
          </div>
        );
      })}
    </div>
  );
}
