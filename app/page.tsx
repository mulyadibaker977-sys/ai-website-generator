"use client";

import { useMemo, useState } from "react";

function extractHtml(text: string) {
  const match = text.match(/```html([\s\S]*?)```/i);
  if (match) return match[1].trim();
  if (text.includes("<html") || text.includes("<!DOCTYPE")) return text;
  return "";
}

function cleanMessage(text: string) {
  const html = extractHtml(text);
  if (!html) return text;

  const withoutCode = text
    .replace(/```html[\s\S]*?```/i, "")
    .replace(/```[\s\S]*?```/g, "")
    .trim();

  return (
    withoutCode ||
    "Website sudah dibuat. Silakan lihat preview di bawah, atau salin kodenya."
  );
}

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Halo! Saya AI Website Generator. Ketik permintaan website yang ingin kamu buat, contoh: \"Buatkan landing page untuk toko kue\".",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const latestHtml = useMemo(() => {
    const lastAi = [...messages].reverse().find((m) => m.role === "assistant");
    return lastAi ? extractHtml(lastAi.content) : "";
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || data.error || "Maaf, terjadi kesalahan.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Gagal terhubung ke AI. Coba lagi sebentar.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!latestHtml) return;
    await navigator.clipboard.writeText(latestHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const handleDownload = () => {
    if (!latestHtml) return;
    const blob = new Blob([latestHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "index.html";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 text-center">
          AI Website Generator
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-5xl mx-auto w-full">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-800 shadow"
              }`}
            >
              {msg.role === "assistant" ? cleanMessage(msg.content) : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-500 shadow rounded-2xl px-4 py-3 text-sm">
              AI sedang membuat website...
            </div>
          </div>
        )}

        {latestHtml && (
          <div className="bg-white rounded-xl shadow p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="font-semibold text-gray-800">Preview Website</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm"
                >
                  {copied ? "Tersalin" : "Salin kode"}
                </button>
                <button
                  onClick={handleDownload}
                  className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm"
                >
                  Unduh HTML
                </button>
              </div>
            </div>
                </button>
            </div>
            <iframe
              title="Website preview"
              className="w-full h-[520px] border rounded-lg bg-white"
              srcDoc={latestHtml}
            />
          </div>
        )}
      </div>

      <div className="border-t bg-white p-4">
        <div className="max-w-5xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ketik permintaan website kamu di sini..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-3 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "..." : "Kirim"}
          </button>
        </div>
      </div>
    </main>
  );
}
