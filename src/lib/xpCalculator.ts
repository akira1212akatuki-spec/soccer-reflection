import { Match } from './storage';

// ===== 型定義 =====
export type EarnedExps = {
  challenge: number;
  transition: number;
  intelligence: number;
  hardwork: number;
  mental: number;
  captaincy: number;
};

export const EXP_KEYS = ['challenge', 'transition', 'intelligence', 'hardwork', 'mental', 'captaincy'] as const;
export type ExpKey = typeof EXP_KEYS[number];

/** 各項目のキーワード（改善点・感想テキスト内にあるかチェックする） */
const ITEM_KEYWORDS: Record<ExpKey, string[]> = {
  challenge:     ['チャレンジ', '仕掛け', '積極', 'シュート', 'ドリブル'],
  transition:    ['切り替え', 'トランジション', 'オンオフ', '守備', '攻守'],
  intelligence:  ['判断', '首振り', '観る', 'インテリジェンス', 'ポジション', '考え'],
  hardwork:      ['球際', 'ハードワーク', '運動量', '走', 'プレス', '戦う'],
  mental:        ['メンタル', 'ミス後', 'ビハインド', '気持ち', '集中', '諦め'],
  captaincy:     ['声', 'キャプテン', '準備', 'コーチング', 'リーダー', 'チーム'],
};

// ===== レベル計算 =====

/** EXPからレベルを計算: Level = floor(sqrt(exp / 10)) + 1 */
export function calcLevel(exp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, exp) / 10)) + 1;
}

/** レベルに到達するために必要な累計EXP */
export function calcRequiredExpForLevel(level: number): number {
  // Level = floor(sqrt(exp/10)) + 1 を解くと: level-1 = floor(sqrt(exp/10))
  // 最小expは (level-1)^2 * 10
  return (level - 1) * (level - 1) * 10;
}

/** 次のレベルに必要な累計EXP */
export function calcRequiredExpForNextLevel(level: number): number {
  return calcRequiredExpForLevel(level + 1);
}

/** 現在レベル内の進捗EXP（現Lv到達からの上乗せ分） */
export function calcProgressExp(totalExp: number): { current: number; needed: number; progress: number } {
  const level = calcLevel(totalExp);
  const currentLvExp = calcRequiredExpForLevel(level);
  const nextLvExp = calcRequiredExpForNextLevel(level);
  const current = totalExp - currentLvExp;
  const needed = nextLvExp - currentLvExp;
  const progress = Math.min(100, Math.round((current / needed) * 100));
  return { current, needed, progress };
}

// ===== EXP計算 =====

/**
 * 1回の記録で獲得するEXPを計算。
 * 全6項目共通の文章量ボーナス + 各項目の自己評価 + 逆転の分析ボーナス。
 */
export function calcEarnedExps(match: Match): EarnedExps {
  // A. 文章量チェック
  const totalTextLength =
    (match.goodPoints?.length ?? 0) +
    (match.goodPointsDetail?.length ?? 0) +
    (match.badPoints?.length ?? 0) +
    (match.badPointsDetail?.length ?? 0) +
    (match.comment?.length ?? 0);

  let textBonus = 0;
  if (totalTextLength >= 100) {
    textBonus = 50;
  } else if (totalTextLength >= 30) {
    textBonus = 20;
  }

  // 逆転分析ボーナスチェック用テキスト
  const analysisText = `${match.badPoints ?? ''} ${match.badPointsDetail ?? ''} ${match.comment ?? ''}`.toLowerCase();

  const result: EarnedExps = {
    challenge: 0,
    transition: 0,
    intelligence: 0,
    hardwork: 0,
    mental: 0,
    captaincy: 0,
  };

  for (const key of EXP_KEYS) {
    const evalValue = match.evaluation[key] ?? 4;

    // B-通常. 自己評価加算
    let evalBonus = 0;
    if (evalValue <= 2) {
      evalBonus = 10;
    } else if (evalValue <= 5) {
      evalBonus = 20;
    } else {
      evalBonus = 30;
    }

    // B-逆転. キーワード × 低評価ボーナス
    let reverseBonus = 0;
    if (evalValue <= 3) {
      const hasKeyword = ITEM_KEYWORDS[key].some(kw => analysisText.includes(kw));
      if (hasKeyword) {
        reverseBonus = 40;
      }
    }

    result[key] = textBonus + evalBonus + reverseBonus;
  }

  return result;
}

/** totalExps に今回のearnedExpsを加算して新しいtotalExpsを返す */
export function mergeExps(total: EarnedExps, earned: EarnedExps): EarnedExps {
  const merged: EarnedExps = { ...total };
  for (const key of EXP_KEYS) {
    merged[key] = (total[key] ?? 0) + (earned[key] ?? 0);
  }
  return merged;
}

/** 空のEarnedExps（初期値）を生成 */
export function emptyExps(): EarnedExps {
  return { challenge: 0, transition: 0, intelligence: 0, hardwork: 0, mental: 0, captaincy: 0 };
}

/** 2つのEarnedExpsを比較し、レベルアップした項目を返す */
export function detectLevelUps(
  prevExps: EarnedExps,
  nextExps: EarnedExps
): { key: ExpKey; prevLevel: number; nextLevel: number }[] {
  return EXP_KEYS
    .map(key => ({
      key,
      prevLevel: calcLevel(prevExps[key] ?? 0),
      nextLevel: calcLevel(nextExps[key] ?? 0),
    }))
    .filter(item => item.nextLevel > item.prevLevel);
}

/** 項目の日本語名 */
export const EXP_LABELS: Record<ExpKey, string> = {
  challenge:    'チャレンジ',
  transition:   'トランジション',
  intelligence: 'インテリジェンス',
  hardwork:     'ハードワーク',
  mental:       'メンタル',
  captaincy:    'キャプテンシー',
};
