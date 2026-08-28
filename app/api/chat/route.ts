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

    const prompt = `Kamu adalah asisten AI Website Generator.
Jika user meminta website, buatkan HTML lengkap yang rapi.
Jawab dalam Bahasa Indonesia.

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
