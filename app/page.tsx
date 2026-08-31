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
        "Halo! Saya NusaX5 AI Website Generator. Ketik permintaan website yang ingin kamu buat, contoh: \"Buatkan landing page untuk toko kue\".",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedSites, setSavedSites] = useState<any[]>([]);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  useEffect(() => {
    const saved = localStorage.getItem("awg_user_email");
    if (saved) setUserEmail(saved);
       loadSaved();
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
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signup", email, password }),
      });
      const result = await res.json();
      const data = result.data || result;

      if (result.error || data.error || data.msg) {
        setAuthError(
          result.error || data.error_description || data.msg || data.error || "Gagal daftar"
        );
        return;
      }

      if (data.id || data.user || data.access_token) {
        setAuthError("Pendaftaran berhasil. Silakan klik Masuk.");
      } else {
        setAuthError("Respon daftar: " + JSON.stringify(result));
      }
    } catch {
      setAuthError("Gagal terhubung ke server.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const result = await res.json();
      const data = result.data || result;

      if (!data.access_token) {
        setAuthError(
          result.error || data.error_description || data.msg || "Email atau password salah"
        );
        return;
      }

      localStorage.setItem("awg_user_email", email);
      localStorage.setItem("awg_access_token", data.access_token);
      setUserEmail(email);
      loadSaved();
    } catch {
      setAuthError("Gagal terhubung ke server.");
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
  const handleSave = async () => {
    if (!latestHtml) return;
    const token = localStorage.getItem("awg_access_token");
    if (!token) {
      alert("Sesi login habis. Masuk ulang.");
      return;
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user");

    const res = await fetch("/api/websites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: lastUser?.content?.slice(0, 60) || "Website",
        prompt: lastUser?.content || "",
        html: latestHtml,
      }),
    });

    const result = await res.json();
    if (result.error || result.status >= 400) {
      alert("Gagal menyimpan: " + (result.error || JSON.stringify(result.data)));
      return;
    }
    alert("Website tersimpan di akun kamu.");
  loadSaved();

};

    const loadSaved = async () => {
    const token = localStorage.getItem("awg_access_token");
    if (!token) return;
    const res = await fetch("/api/websites", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await res.json();
    if (Array.isArray(result.data)) setSavedSites(result.data);
  };
    const handleDelete = async (id: string) => {
    const token = localStorage.getItem("awg_access_token");
    if (!token) return;
    if (!confirm("Hapus website ini?")) return;

    const res = await fetch("/api/websites", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });

    const result = await res.json();
    if (result.error) {
      alert("Gagal menghapus");
      return;
    }
    loadSaved();
  };
  if (!userEmail) {
    return (
            <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
            NusaX5
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
            <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">NusaX5</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-200">{userEmail}</span>
          <button onClick={handleLogout} className="text-red-300 hover:text-red-200">
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
                  Unduh HTML                 <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-4 py-2 rounded-full text-sm"
                >
                  Simpan
                </button>
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
                {savedSites.length > 0 && (
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Website tersimpan</h2>
            <div className="space-y-2">
              {savedSites.map((site) => (
                <div key={site.id} className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setMessages((prev) => [
                        ...prev,
                        { role: "assistant", content: site.html },
                      ]);
                    }}
                    className="flex-1 text-left border rounded-xl px-4 py-3 text-sm text-gray-800 hover:bg-gray-50"
                  >
                    {site.title || "Website"}
                  </button>
                  <button
                    onClick={() => handleDelete(site.id)}
                    className="text-red-600 text-sm px-3 py-3"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
                  <div className="border-t bg-slate-900 p-4">
        <div className="max-w-5xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ketik permintaan website kamu di sini..."
            className="flex-1 rounded-full px-4 py-3 text-sm text-gray-800 bg-white"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-blue-400 disabled:opacity-50"
          >
            {loading ? "..." : "Kirim"}
          </button>
        </div>
      </div>
    </main>
  );
}
