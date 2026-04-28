export interface EvolutionStage {
  minLevel: number;
  name: string;
  image: string;
  description: string;
  soccerElement: string;
}

export const EVOLUTION_STAGES: EvolutionStage[] = [
  { 
    minLevel: 1, 
    name: 'ピヨボール（初期）', 
    image: '/images/evo/lv_1.png',
    description: '卵の殻に入ったひよこ',
    soccerElement: 'なし（純粋な成長前）'
  },
  { 
    minLevel: 10, 
    name: 'ピヨボール（成長）', 
    image: '/images/evo/lv_2.png',
    description: '少し大きくなったひよこ',
    soccerElement: 'なし（純粋な成長前）'
  },
  { 
    minLevel: 20, 
    name: '中間形態', 
    image: '/images/evo/lv_3.png',
    description: 'ひよことニワトリの間',
    soccerElement: 'ボールを頭に乗せる'
  },
  { 
    minLevel: 30, 
    name: 'ニワトリ（初級）', 
    image: '/images/evo/lv_4.png',
    description: '若いニワトリ',
    soccerElement: 'ユニフォーム、ゴール前'
  },
  { 
    minLevel: 40, 
    name: 'ニワトリ（上級）', 
    image: '/images/evo/lv_5.png',
    description: '逞しいニワトリ',
    soccerElement: '戦術ボード、キャプテンマーク'
  },
  { 
    minLevel: 50, 
    name: 'クジャク', 
    image: '/images/evo/lv_6.png',
    description: '華やかな羽',
    soccerElement: '黄金のボール、優雅なドリブル'
  },
  { 
    minLevel: 60, 
    name: 'イーグル（隊長）', 
    image: '/images/evo/lv_7.png',
    description: '鋭い眼光の鷲',
    soccerElement: '崖の上のピッチ、守備の要'
  },
  { 
    minLevel: 70, 
    name: 'イーグル（伝説）', 
    image: '/images/evo/lv_8.png',
    description: '翼を広げた黄金の鷲',
    soccerElement: '炎のボール、優勝カップ'
  },
  { 
    minLevel: 80, 
    name: 'サンダーバード', 
    image: '/images/evo/lv_9.png',
    description: '電撃を纏う鳥',
    soccerElement: '雷光のシュート'
  },
  { 
    minLevel: 90, 
    name: '鳳凰（ホウオウ）', 
    image: '/images/evo/lv_10.png',
    description: '東洋の神獣',
    soccerElement: '古代の祠、聖なるボール'
  },
  { 
    minLevel: 100, 
    name: '不死鳥（究極体）', 
    image: '/images/evo/lv_11.png',
    description: '宇宙・深淵のオーラ',
    soccerElement: '宇宙フィールド、完全体'
  },
];

export function getEvolutionStage(level: number): EvolutionStage {
  // レベルが高い順にチェックして、最初に条件を満たしたものを返す
  const reversedStages = [...EVOLUTION_STAGES].reverse();
  const stage = reversedStages.find(s => level >= s.minLevel);
  return stage || EVOLUTION_STAGES[0];
}
