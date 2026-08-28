import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum diset" },
        { status: 500 }
      );
    }

    const lastUserMessage =
      [...messages].reverse().find((m: any) => m.role === "user")?.content ||
      "Halo";

    const prompt = `
Kamu adalah asisten AI Website Generator.
Tugasmu membantu user membuat website sederhana.
Jika user meminta website, buatkan HTML lengkap yang rapi dan siap dipakai.
Jawab dalam Bahasa Indonesia, kecuali jika user meminta bahasa lain.

Permintaan user:
${lastUserMessage}
`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Maaf, AI tidak bisa menjawab saat ini.";

    return NextResponse.json({ reply: text });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menghubungi AI" },
      { status: 500 }
    );
  }
}
