"use client";
import React, { useState, useRef, useEffect } from "react";
import { Send, Trash2 } from "lucide-react";
import styles from "./page.module.css";

export default function Page() {
  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const SYSTEM_INSTRUCTION = `
あなたは、プロフェッショナルで温かみのある心理カウンセラーです。
以下のガイドラインに従って、ユーザーに寄り添ってください：

- 傾聴と共感: ユーザーの感情や状況を否定せず、まずは「それはお辛かったですね」「そう思われるのも無理はありません」と受け止めてください。
- 積極的問いかけ: 解決策を急がず、「その時、どのようなお気持ちでしたか？」のように、ユーザーが自分自身の内面を探索できるような問いかけを行ってください。
- 安全な場所の提供: ユーザーが何を話しても安全であると感じられるよう、穏やかで丁寧な言葉遣い（敬語）を徹底してください。
- リフレーミング: ユーザーが自分を責めている場合、別の視点や、その中にあるポジティブな側面を優しく提示してください。
`; // 固定systemInstruction

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;
    if (!GEMINI_API_KEY) {
      setError("環境変数 NEXT_PUBLIC_GEMINI_API_KEY が設定されていません。");
      return;
    }

    setError(null);
    const userMsg = { role: "user", text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // 過去の履歴をGemini APIの形式（user / model）に変換
      const history = messages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      }));

      const payload: any = {
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          ...history,
          {
            role: "user",
            parts: [{ text: userMsg.text }],
          },
        ],
      };

      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          } as Record<string, string>,
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} - ${text}`);
      }

      const data = await res.json();
      const assistantText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        JSON.stringify(data, null, 2);

      setMessages((m) => [...m, { role: "assistant", text: assistantText }]);
    } catch (e: any) {
      setError(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  function clearConversation() {
    setMessages([]);
  }

  return (
    <div className={styles.chatContainer}>
      <header className={styles.chatHeader}>
        <h1 className={styles.chatTitle}>Gemini Chat</h1>
        <button onClick={clearConversation} className={styles.chatClear}>
          <Trash2 size={16} /> クリア
        </button>
      </header>

      <main ref={listRef} className={styles.chatMessages}>
        {messages.length === 0 && (
          <div className={styles.chatEmpty}>まだ会話がありません。</div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`${styles.messageRow} ${m.role === "user" ? styles.user : styles.assistant}`}
          >
            <div
              className={`${styles.messageBubble} ${m.role === "user" ? styles.user : styles.assistant}`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </main>

      {error && <div className={styles.chatError}>{error}</div>}

      <footer className={styles.chatFooter}>
        <div className={styles.inputBox}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={styles.messageInput}
            placeholder="メッセージを入力..."
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className={styles.sendButton}
          >
            {loading ? "..." : <Send size={18} />}
          </button>
        </div>
      </footer>
    </div>
  );
}
