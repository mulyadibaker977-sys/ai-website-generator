import { NextResponse } from "next/server";

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

    const prompt =   `Kamu adalah generator website.
Tugasmu hanya membuat 1 file HTML lengkap, siap dibuka di browser.

Aturan wajib:
- Jawaban HANYA kode HTML.
- Jangan tulis penjelasan, sapaan, atau langkah-langkah.
- Bungkus kode dalam blok markdown: \`\`\`html ... \`\`\`
- Mulai dari <!DOCTYPE html> sampai </html>
- Gunakan Tailwind CSS lewat CDN.
- Website harus responsif untuk HP dan komputer.
- Menu hanya tautan #beranda #layanan #kontak.
- Jangan minta maaf. Jangan tanya balik. Langsung buat website.

Permintaan user:

${lastUserMessage}`;

    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await geminiRes.json();

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({
        reply:
          "Gemini error: " +
          JSON.stringify(data?.error || data, null, 2),
      });
    }

    return NextResponse.json({ reply: text });
  } catch (error) {
    return NextResponse.json({
      reply: "Gagal menghubungi AI: " + String(error),
    });
  }
}
