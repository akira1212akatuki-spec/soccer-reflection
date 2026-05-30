import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matchData, history } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'APIキーが設定されていません。サーバー管理者に連絡してください。' },
        { status: 500 }
      );
    }

    const currentScores = matchData.type === 'match' 
      ? (matchData.scores && matchData.scores.length > 0 
          ? matchData.scores.map((s: any, i: number) => `第${i+1}試合: ${s.my}-${s.opponent}`).join(', ')
          : `${matchData.myScore}-${matchData.opponentScore}`)
      : 'なし';

    // 過去の傾向を要約（直近5件程度）
    const historySummary = history && history.length > 0
      ? history.slice(0, 5).map((h: any) => `- ${h.date}: ${h.type === 'match' ? h.opponent : h.practiceName} (評価: ${JSON.stringify(h.evaluation)})`).join('\n')
      : 'なし';

    // プロンプトの作成
    const prompt = `
あなたは世界トップクラスのプロサッカーコーチです。
提供された「今回の記録」を分析し、さらに「過去の振り返り履歴」と比較して、選手の成長や課題の傾向（癖や改善の兆しなど）をプロの視点で鋭く、かつ【中学生でも理解できる分かりやすい言葉（丁寧な敬語：です・ます調）】でアドバイスしてください。

【重要な前提条件】
・選手の名前は「${matchData.userName || 'あなた'}」です。アドバイスの際は選手名（〇〇選手）で語りかけてください。
・対戦相手（または練習名）は「${matchData.opponent || matchData.practiceName}」です。
・絶対に、対戦相手の名前を選手の名前として混同しないでください。

【今回の記録】
種類: ${matchData.type === 'match' ? '試合' : '練習'}
対象: ${matchData.opponent || matchData.practiceName}
スコア: ${currentScores}
日付: ${matchData.date}
良かった点: ${matchData.goodPoints || 'なし'}
改善点: ${matchData.badPoints || 'なし'}
感想: ${matchData.comment || 'なし'}
自己評価: ${JSON.stringify(matchData.evaluation)}

【過去の振り返り履歴（直近5件）】
${historySummary}


【分析・アドバイスの指示】
1. プロのコーチとしての「専門性」を出しつつも、中学生にも伝わるように専門用語を噛み砕いて説明してください。
2. 過去の履歴と比較して、成長している点や、繰り返し起きている課題を分かりやすく指摘してください。
3. 全体を通して、丁寧な敬語（です・ます調）で回答してください。
4. 文字数は250文字〜300文字程度。
5. 内容に基づき、YouTubeで検索すべき最も重要な練習キーワード（例：シュート、ドリブル、1vs1守備、ヘディング、トラップ、ポジショニングなど）を1つだけ選んでください。

【出力形式】
以下のJSON形式のみで回答してください。余計な説明は不要です。
{
  "advice": "アドバイス内容",
  "keyword": "キーワード"
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
          console.log(`Gemini model used: ${modelName}`);
          break; // 成功したらループを抜ける
        }
        lastError = await response.json().catch(() => null);
        console.warn(`Model ${modelName} failed:`, lastError?.error?.message);
        response = null;
      } catch (fetchErr) {
        console.warn(`Model ${modelName} fetch error:`, fetchErr);
        lastError = fetchErr;
        response = null;
      }
    }

    if (!response) {

      const errorMessage = lastError?.error?.message || lastError?.message || '全モデルへの接続に失敗しました。';
      return NextResponse.json({ 
        error: `AIとの通信に失敗しました: ${errorMessage}` 
      }, { status: 503 });
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // JSONのパース（AIがコードブロックとして返す場合を考慮）
    const jsonStr = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(jsonStr);

    return NextResponse.json(result);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}
