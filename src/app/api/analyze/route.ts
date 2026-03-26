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

    // 過去の傾向を要約（直近5件程度）
    const historySummary = history && history.length > 0
      ? history.slice(0, 5).map((h: any) => `- ${h.date}: ${h.type === 'match' ? h.opponent : h.practiceName} (評価: ${JSON.stringify(h.evaluation)})`).join('\n')
      : 'なし';

    // プロンプトの作成
    const prompt = `
あなたは世界トップクラスのプロサッカーコーチです。
提供された「今回の記録」を分析し、さらに「過去の振り返り履歴」と比較して、選手の成長や課題の傾向（癖や改善の兆しなど）をプロの視点で鋭く、かつ【非常に丁寧な敬語（です・ます調）】でアドバイスしてください。

【今回の記録】
種類: ${matchData.type === 'match' ? '試合' : '練習'}
対象: ${matchData.opponent || matchData.practiceName}
日付: ${matchData.date}
良かった点: ${matchData.goodPoints || 'なし'}
改善点: ${matchData.badPoints || 'なし'}
感想: ${matchData.comment || 'なし'}
自己評価: ${JSON.stringify(matchData.evaluation)}

【過去の振り返り履歴（直近5件）】
${historySummary}

【分析・アドバイスの指示】
1. なぜこの記事がプロのコーチからの言葉なのかを感じさせる「専門用語」や「プレーの本質」に触れてください。
2. 過去の履歴と比較して、成長している点や、繰り返し起きている課題を指摘してください。
3. 全体を通して、非常に丁寧な敬語（です・ます調）で回答してください。
4. 文字数は250文字〜300文字程度。
5. 内容に基づき、YouTubeで検索すべき最も重要な練習キーワード（例：シュート、ドリブル、1vs1守備、ヘディング、トラップ、ポジショニングなど）を1つだけ選んでください。

【出力形式】
以下のJSON形式のみで回答してください。余計な説明は不要です。
{
  "advice": "アドバイス内容",
  "keyword": "キーワード"
}
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error details:', JSON.stringify(errorData, null, 2));
      const errorMessage = errorData.error?.message || 'AIとの通信に失敗しました（詳細不明）。';
      return NextResponse.json({ 
        error: `AIとの通信に失敗しました: ${errorMessage}`,
        details: errorData 
      }, { status: response.status });
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
