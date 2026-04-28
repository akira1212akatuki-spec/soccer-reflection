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
    soccerElement: 'まずはボールと友達になろう！'
  },
  { 
    minLevel: 10, 
    name: 'ピヨボール（成長）', 
    image: '/images/evo/lv_2.png',
    description: '少し大きくなったひよこ',
    soccerElement: '少し体つきが変わってきたね。基礎の大切さを忘れないでね'
  },
  { 
    minLevel: 20, 
    name: '中間形態', 
    image: '/images/evo/lv_3.png',
    description: 'ひよことニワトリの間',
    soccerElement: 'おっ、ボールを扱えるようになってきたじゃないか'
  },
  { 
    minLevel: 30, 
    name: 'ニワトリ（初級）', 
    image: '/images/evo/lv_4.png',
    description: '若いニワトリ',
    soccerElement: 'ユニフォームが似合ってきたぞ。試合を意識しろ'
  },
  { 
    minLevel: 40, 
    name: 'ニワトリ（上級）', 
    image: '/images/evo/lv_5.png',
    description: '逞しいニワトリ',
    soccerElement: '戦術を理解し始めたな。チームの核になれ'
  },
  { 
    minLevel: 50, 
    name: 'クジャク', 
    image: '/images/evo/lv_6.png',
    description: '華やかな羽',
    soccerElement: '華麗なプレーで観客を魅了しろ。自信を持て'
  },
  { 
    minLevel: 60, 
    name: 'イーグル（隊長）', 
    image: '/images/evo/lv_7.png',
    description: '鋭い眼光の鷲',
    soccerElement: 'お前がDFラインの要だ。後ろから仲間を鼓舞しろ'
  },
  { 
    minLevel: 70, 
    name: 'イーグル（伝説）', 
    image: '/images/evo/lv_8.png',
    description: '翼を広げた黄金の鷲',
    soccerElement: 'そのカップは努力の証だ。だが満足するのはまだ早い'
  },
  { 
    minLevel: 80, 
    name: 'サンダーバード', 
    image: '/images/evo/lv_9.png',
    description: '電撃を纏う鳥',
    soccerElement: 'そのスピード、まさに稲妻だ。相手を置き去りにしろ'
  },
  { 
    minLevel: 90, 
    name: '鳳凰（ホウオウ）', 
    image: '/images/evo/lv_10.png',
    description: '東洋の神獣',
    soccerElement: '聖域に達したな。お前のプレーはもはや芸術だ'
  },
  { 
    minLevel: 100, 
    name: '不死鳥（究極体）', 
    image: '/images/evo/lv_11.png',
    description: '宇宙・深淵のオーラ',
    soccerElement: '伝説の完成だ。お前が日本のサッカーの未来を創るんだ'
  },
];

export function getEvolutionStage(level: number): EvolutionStage {
  // レベルが高い順にチェックして、最初に条件を満たしたものを返す
  const reversedStages = [...EVOLUTION_STAGES].reverse();
  const stage = reversedStages.find(s => level >= s.minLevel);
  return stage || EVOLUTION_STAGES[0];
}
