"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function GeminiSample() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "こんにちは！お話ししましょう。" },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: inputMessage.trim() };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: userMessage.content }),
      });

      if (!res.ok) {
        throw new Error(`APIエラー: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let modelResponseContent = "";

      const tempModelMessage: Message = { role: "model", content: "" };
      setMessages((prev) => [...prev, tempModelMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        modelResponseContent += chunk;

        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessageIndex = newMessages.length - 1;
          if (newMessages[lastMessageIndex].role === "model") {
            newMessages[lastMessageIndex].content = modelResponseContent;
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error("チャットエラー:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "エラーが発生しました。もう一度お試しください。",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <section
        style={{
          flexGrow: 1,
          overflowY: "auto",
          marginBottom: "10px",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              marginBottom: "10px",
              textAlign: msg.role === "user" ? "right" : "left",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: "18px",
                maxWidth: "75%",
                backgroundColor: msg.role === "user" ? "#007bff" : "#e0e0e0",
                color: msg.role === "user" ? "white" : "black",
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </span>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              {msg.role === "user" ? "あなた" : "Gemini"}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ textAlign: "left", marginBottom: "10px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: "18px",
                backgroundColor: "#e0e0e0",
                color: "black",
              }}
            >
              ......
            </span>
          </div>
        )}
      </section>

      <section style={{ display: "flex" }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="メッセージを入力..."
          disabled={isLoading}
          style={{
            flexGrow: 1,
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            marginRight: "10px",
            fontSize: "16px",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!inputMessage.trim() || isLoading}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: "4px",
            backgroundColor:
              !inputMessage.trim() || isLoading ? "#b3d4ff" : "#007bff",
            color: "white",
            cursor:
              !inputMessage.trim() || isLoading ? "not-allowed" : "pointer",
            fontSize: "16px",
          }}
        >
          送信
        </button>
      </section>
    </article>
  );
}
