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
        'Halo! Saya NusaX5 AI Website Generator. Ketik permintaan website yang ingin kamu buat, contoh: "Buatkan landing page untuk toko kue".',
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedSites, setSavedSites] = useState<any[]>([]);
  const [activeMenu, setActiveMenu] = useState("Beranda");
  const menus = [
    "Beranda",
    "Buat Proyek",
    "Proyek Saya",
    "Proyek Live",
    "Domain",
    "Pengaturan",
  ];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const showChat = activeMenu === "Beranda" || activeMenu === "Buat Proyek";

  useEffect(() => {
    const saved = localStorage.getItem("awg_user_email");
    if (saved) setUserEmail(saved);
    loadSaved();
  }, []);

  const latestHtml = useMemo(() => {
    const lastAi = [...messages].reverse().find((m) => m.role === "assistant");
    return lastAi ? extractHtml(lastAi.content) : "";
  }, [messages]);

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
    const url = URL.create
