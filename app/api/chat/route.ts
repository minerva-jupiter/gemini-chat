import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// 環境変数からAPIキーを取得
// const apiKey = process.env.GEMINI_API_KEY;
const apiKey = import.meta.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set");
}
const ai = new GoogleGenAI({ apiKey: apiKey });

// システムプロンプトを定義
const SYSTEM_INSTRUCTION =
  "あなたは、ユーザーの質問に丁寧かつ簡潔に答えるフレンドリーなアシスタントです。回答は日本語で行い、語尾ににゃんをつけてください。";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    // ユーザーのプロンプトをコンテンツとして設定
    const contents = [{ role: "user", parts: [{ text: prompt }] }];

    // API呼び出し
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash", // 使用するモデル
      contents: contents,
      config: {
        // システムプロンプトを 'systemInstruction' として設定
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    // レスポンスをストリーミングするためのカスタムレスポンス
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of responseStream) {
          // テキストチャンクをエンコードしてクライアントに送信
          const text = chunk.text;
          controller.enqueue(new TextEncoder().encode(text));
        }
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 },
    );
  }
}
