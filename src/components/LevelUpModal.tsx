"use client";

import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { EXP_LABELS, ExpKey } from '@/lib/xpCalculator';

interface LevelUpItem {
  key: ExpKey;
  prevLevel: number;
  nextLevel: number;
}

interface LevelUpModalProps {
  levelUps: LevelUpItem[];
  onClose: () => void;
}

export default function LevelUpModal({ levelUps, onClose }: LevelUpModalProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    // confetti 演出
    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ffe066', '#ff9f43', '#7ae7c7', '#ffffff'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ffe066', '#ff9f43', '#7ae7c7', '#ffffff'],
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // 5秒後に自動クローズ
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="levelup-overlay" onClick={onClose}>
      <div className="levelup-box" onClick={e => e.stopPropagation()}>
        <div className="levelup-title">✨ LEVEL UP! ✨</div>
        <div style={{ marginBottom: '16px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
          あなたの努力が実を結びました！
        </div>

        {levelUps.map(item => (
          <div className="levelup-item" key={item.key}>
            ▶ {EXP_LABELS[item.key]}　Lv.{item.prevLevel} → Lv.{item.nextLevel}
          </div>
        ))}

        <button className="levelup-close" onClick={onClose}>
          つづける
        </button>
      </div>
    </div>
  );
}
