import { NextResponse } from "next/server";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env belum terbaca");
  return { url, key };
}

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization") || "";
    const { url, key } = getEnv();

    const res = await fetch(`${url}/rest/v1/websites?select=*&order=created_at.desc`, {
      headers: {
        apikey: key,
        Authorization: token || `Bearer ${key}`,
      },
    });

    const data = await res.json();
    return NextResponse.json({ status: res.status, data });
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization") || "";
    const body = await req.json();
    const { url, key } = getEnv();

    const userRes = await fetch(`${url}/auth/v1/user`, {
      headers: {
        apikey: key,
        Authorization: token,
      },
    });
    const user = await userRes.json();
    if (!user?.id) {
      return NextResponse.json({ error: "Sesi login tidak valid. Masuk ulang." });
    }

    const res = await fetch(`${url}/rest/v1/websites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: token,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        user_id: user.id,
        title: body.title || "Website",
        prompt: body.prompt || "",
        html: body.html,
      }),
    });

    const data = await res.json();
    return NextResponse.json({ status: res.status, data });
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}
