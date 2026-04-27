"use client";

import React, { useMemo } from 'react';
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

  return (
    <div className="rpg-panel">
      <div className="rpg-title">⚔ PLAYER STATUS ⚔</div>
      <div className="rpg-overall">総合 Lv.{overallLevel}</div>

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
