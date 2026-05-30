import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matches, userName } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is not set' }, { status: 500 });
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({ 
        report: '今月の記録がありません。来月はたくさん振り返りを書いてみましょう！', 
        highlightKeyword: '記録なし' 
      });
    }

    // 試合の要約文字列を作成
    const summaries = matches.map((m: any) => `
ID: ${m.id}
日付: ${m.date}
対象: ${m.opponent || m.practiceName}
評価: ${JSON.stringify(m.evaluation)}
良かった点: ${m.goodPoints || 'なし'}
改善点: ${m.badPoints || 'なし'}
次の目標・メモ: ${m.comment || 'なし'}
`).join('\n---\n');

    const prompt = `
あなたは世界トップクラスのプロサッカーコーチです。
選手（名前：${userName || 'あなた'}）の「1ヶ月分の振り返り記録」を分析し、月間レポートを作成してください。
中学生でも理解できる分かりやすい言葉（丁寧な敬語：です・ます調）で語りかけてください。

【今月の記録】
${summaries}

【出力形式】
以下のJSON形式のみで回答してください。Markdownのコードブロック記法（\`\`\`json）は含めず、純粋なJSON文字列のみを出力してください。
{
  "report": "今月の成長ポイントと来月への課題を含めた総評（300字〜400字程度）。〇〇選手、と名前で呼びかけてください。",
  "mvpGameId": "今月の中で最も評価が高かった、あるいは内容が良かった記録のID（なければnull）",
  "highlightKeyword": "今月の頑張りを一言で表すキーワード（例：ハードワークの月、チャレンジ精神など）"
}
`;

    // 最新モデルを優先し、失敗したらフォールバック
    const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
    let response: Response | null = null;
    let lastError: any = null;
    
    for (const modelName of models) {
      try {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        if (response.ok) {
          break;
        }
        lastError = await response.json().catch(() => null);
        response = null;
      } catch (fetchErr) {
        lastError = fetchErr;
        response = null;
      }
    }

    if (!response) {
      return NextResponse.json({ error: 'AIとの通信に失敗しました' }, { status: 503 });
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    const jsonStr = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(jsonStr);

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}
