"use client";

import { useEffect, useMemo, useState } from "react";

function extractHtml(text: string) {
  const match =
    text.match(/```html([\s\S]*?)```/i) ||
    text.match(/```([\s\S]*?)```/i);
  if (match) return match[1].trim();
  if (text.includes("<html") || text.includes("<!DOCTYPE")) return text;
  return "";
}

function cleanMessage(text: string) {
  if (text.length > 180 || extractHtml(text)) {
    return "Website sudah siap. Silakan lihat preview di bawah, lalu salin atau unduh kodenya.";
  }
  return text;
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  useEffect(() => {
    const saved = localStorage.getItem("awg_user_email");
    if (saved) setUserEmail(saved);
  }, []);

  const latestHtml = useMemo(() => {
    const lastAi = [...messages].reverse().find((m) => m.role === "assistant");
    return lastAi ? extractHtml(lastAi.content) : "";
  }, [messages]);

  const authRequest = async (path: string, body: object) => {
    const res = await fetch(`${supabaseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const handleSignup = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const data = await authRequest("/auth/v1/signup", { email, password });
      if (data.error || data.msg) {
        setAuthError(data.error_description || data.msg || data.error || "Gagal daftar");
        return;
      }
      const login = await authRequest("/auth/v1/token?grant_type=password", {
        email,
        password,
      });
      if (login.access_token) {
        localStorage.setItem("awg_user_email", email);
        setUserEmail(email);
      } else {
        setAuthError("Pendaftaran berhasil. Silakan klik Masuk.");
      }
    } catch {
      setAuthError("Gagal terhubung ke Supabase.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const data = await authRequest("/auth/v1/token?grant_type=password", {
        email,
        password,
      });
      if (!data.access_token) {
        setAuthError(data.error_description || data.msg || "Email atau password salah");
        return;
      }
      localStorage.setItem("awg_user_email", email);
      localStorage.setItem("awg_access_token", data.access_token);
      setUserEmail(email);
    } catch {
      setAuthError("Gagal terhubung ke Supabase.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("awg_user_email");
    localStorage.removeItem("awg_access_token");
    setUserEmail("");
  };

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
        { role: "assistant", content: data.reply || data.error || "Maaf, terjadi kesalahan." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Gagal terhubung ke AI. Coba lagi sebentar." },
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

  if (!userEmail) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
            AI Website Generator
          </h1>
          <p className="text-sm text-gray-500 text-center mb-6">
            Masuk dulu untuk membuat dan menyimpan website.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full border rounded-full px-4 py-3 text-sm text-gray-800 mb-3"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password minimal 6 karakter"
            className="w-full border rounded-full px-4 py-3 text-sm text-gray-800 mb-4"
          />
          {authError && <p className="text-red-600 text-sm mb-3">{authError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleLogin}
              disabled={authLoading}
              className="flex-1 bg-blue-600 text-white rounded-full py-3 text-sm"
            >
              Masuk
            </button>
            <button
              onClick={handleSignup}
              disabled={authLoading}
              className="flex-1 bg-gray-800 text-white rounded-full py-3 text-sm"
            >
              Daftar
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b px-4 py-3 shadow-sm flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">AI Website Generator</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-600">{userEmail}</span>
          <button onClick={handleLogout} className="text-red-600">
            Keluar
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-5xl mx-auto w-full">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                msg.role === "user" ? "bg-blue-600 text-white" : "bg-white text-gray-800 shadow"
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
                <button onClick={handleCopy} className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm">
                  {copied ? "Tersalin" : "Salin kode"}
                </button>
                <button onClick={handleDownload} className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm">
                  Unduh HTML
                </button>
              </div>
            </div>
            <iframe
              title="Website preview"
              className="w-full h-[520px] border rounded-lg bg-white"
              srcDoc={latestHtml}
              sandbox="allow-scripts allow-forms"
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
            className="flex-1 border border-gray-300 rounded-full px-4 py-3 text-sm text-gray-800 bg-white"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-full text-sm disabled:opacity-50"
          >
            {loading ? "..." : "Kirim"}
          </button>
        </div>
      </div>
    </main>
  );
}
