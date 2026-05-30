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
 * 連続入力ボーナス、詳細入力（文字数）ボーナス、全項目入力ボーナスなどを含む。
 */
export function calcEarnedExps(match: Match, weeklyCount: number = 0): EarnedExps {
  // A. 文章量チェック（案C：1.0 + (文字数/1000)*1.5 倍、最大2.5倍）
  const totalTextLength =
    (match.goodPoints?.length ?? 0) +
    (match.goodPointsDetail?.length ?? 0) +
    (match.badPoints?.length ?? 0) +
    (match.badPointsDetail?.length ?? 0) +
    (match.comment?.length ?? 0);

  const textMultiplier = Math.min(2.5, 1.0 + (totalTextLength / 1000) * 1.5);

  // 全項目入力ボーナス（良かった点、改善点、次の目標 が全て入力されている場合）
  const hasAllFields = 
    (match.goodPoints?.trim().length ?? 0) > 0 &&
    (match.badPoints?.trim().length ?? 0) > 0 &&
    (match.comment?.trim().length ?? 0) > 0;
  
  // 各項目に一律+5ポイント（6項目で計30ポイント）
  const allFieldsBonusPerItem = hasAllFields ? 5 : 0;

  // 連続入力ボーナス（週の入力回数に応じた倍率）
  let streakMultiplier = 1.0;
  if (weeklyCount >= 6) {
    streakMultiplier = 2.0;
  } else if (weeklyCount === 5) {
    streakMultiplier = 1.7;
  } else if (weeklyCount === 4) {
    streakMultiplier = 1.5;
  } else if (weeklyCount >= 3) {
    streakMultiplier = 1.2;
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

    // ベースの経験値を算出し、各種倍率をかける
    const baseExp = evalBonus + reverseBonus + allFieldsBonusPerItem;
    result[key] = Math.round(baseExp * textMultiplier * streakMultiplier);
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
