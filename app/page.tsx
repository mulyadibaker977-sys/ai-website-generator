import { NextResponse } from "next/server";

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
];

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: "GEMINI_API_KEY belum terbaca di Vercel." });
    }

    const lastUserMessage =
      [...messages].reverse().find((m: { role: string; content: string }) => m.role === "user")
        ?.content || "Halo";

    const prompt = `Kamu adalah asisten AI Website Generator.
Jika user meminta website, buatkan HTML lengkap yang rapi.
Jawab singkat. Jangan beri penjelasan panjang.
Langsung berikan kode HTML di dalam blok \`\`\`html.

Permintaan user:
${lastUserMessage}`;

    let lastError = "Semua model Gemini sedang sibuk.";

    for (const model of MODELS) {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const data = await geminiRes.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        return NextResponse.json({ reply: text });
      }

      lastError =
        data?.error?.message ||
        JSON.stringify(data?.error || data);
    }

    return NextResponse.json({
      reply: "Gemini sedang sibuk. Coba kirim ulang 10–20 detik lagi. Detail: " + lastError,
    });
  } catch (error) {
    return NextResponse.json({
      reply: "Gagal menghubungi AI: " + String(error),
    });
  }
}
