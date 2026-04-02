import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matchData, question, history, chatHistory } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'APIキーが設定されていません。' },
        { status: 500 }
      );
    }

    const currentScores = matchData.type === 'match' 
      ? (matchData.scores && matchData.scores.length > 0 
          ? matchData.scores.map((s: any, i: number) => `第${i+1}試合: ${s.my}-${s.opponent}`).join(', ')
          : `${matchData.myScore}-${matchData.opponentScore}`)
      : 'なし';

    // 過去のチャット履歴を構築
    const chatHistoryText = chatHistory && chatHistory.length > 0
      ? chatHistory.map((ch: any) => `質問: 「${ch.question}」\n回答: 「${ch.answer}」`).join('\n\n')
      : 'なし';

    // プロンプトの作成
    const prompt = `
あなたは日本代表クラスのプロサッカー選手です。
後輩である選手から、今日のプレーについての質問を受けました。

【今日の試合/練習の記録】
種類: ${matchData.type === 'match' ? '試合' : '練習'}
対象: ${matchData.opponent || matchData.practiceName}
スコア: ${currentScores}
良かった点: ${matchData.goodPoints}
良かったプレーの詳細: ${matchData.goodPointsDetail || 'なし'}
改善点: ${matchData.badPoints}
改善点の詳細: ${matchData.badPointsDetail || 'なし'}
感想: ${matchData.comment}
自己評価: ${JSON.stringify(matchData.evaluation)}
AIコーチからの分析: ${matchData.aiAdvice}

【これまでの会話履歴】
${chatHistoryText}

【選手からの新しい質問】
「${question}」

【アドバイスの指示】
1. あなたは「日本代表クラスの現役サッカー選手」です。親しみやすく、かつプロとしての厳しい視点も持ち合わせた「頼れる先輩」の口調でお話しください。
2. 上記の「これまでの会話履歴」がある場合は、必ずその流れを踏まえて自然につながるように回答してください。同じことを繰り返さず、会話を発展させてください。
3. 質問が技術面（シュート、トラップ、ドリブルなど）に関するものなら、体の使い方や足の置き方、ボールの触り方など、具体的な動作のコツを中学生でもイメージしやすく教えてください。
4. 質問が戦術面（ポジショニング、パスコース、プレスなど）に関するものなら、「どこを見るか」「いつ動くか」「なぜそうするのか」を具体的な場面を例に出して教えてください。
5. 今回の記録（特に良かった点・改善点の詳細）をしっかり踏まえた回答にしてください。
6. 口調は「〜だよ」「〜だね」「〜してみよう」といった、フレンドリーな語りかけにしてください。
7. 文字数は200文字〜300文字程度。

【出力形式】
以下のJSON形式のみで回答してください。
{
  "answer": "アドバイス内容"
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
      return NextResponse.json({ 
        error: 'AIとの通信に失敗しました。',
        details: errorData 
      }, { status: response.status });
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
