// page.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { Send, Trash2 } from "lucide-react";
import styles from "./page.module.css";

const systemInstruction = "あなたは相手のことを先生と呼び、語尾ににゃんを付けるかわいい生徒です。"

export default function Page() {
  const [apiKey, setApiKey] = useState(
    () => sessionStorage.getItem("GEMINI_API_KEY") || "",
  );
  const [systemInstruction, setSystemInstruction] = useState(
    () => sessionStorage.getItem("GEMINI_SYS_INST") || "",
  );
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(
    () =>
      JSON.parse(sessionStorage.getItem("gemini_chat_messages") || "[]") as {
        role: string;
        text: string;
      }[],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    sessionStorage.setItem("GEMINI_API_KEY", apiKey);
  }, [apiKey]);

  useEffect(() => {
    sessionStorage.setItem("GEMINI_SYS_INST", systemInstruction);
  }, [systemInstruction]);

  useEffect(() => {
    sessionStorage.setItem("gemini_chat_messages", JSON.stringify(messages));
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;
    setError(null);

    const userMsg = { role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    if (!apiKey) {
      setError("API キーを入力してください（セッション保存されます）");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        contents: [
          {
            role: "user",
            parts: [{ text: userMsg.text }],
          },
        ],
      };

      if (systemInstruction.trim()) {
        payload.systemInstruction = {
          role: "system",
          parts: [{ text: systemInstruction }],
        };
      }

      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
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
    sessionStorage.removeItem("gemini_chat_messages");
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
        <div className={styles.apiKeyBox}>
          <input
            type="password"
            className={styles.apiKeyInput}
            placeholder="Gemini APIキーを入力（デモ用）"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
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
