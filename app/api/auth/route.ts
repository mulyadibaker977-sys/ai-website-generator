import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { action, email, password } = await req.json();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return NextResponse.json({
        error: "Supabase env belum terbaca di Vercel",
      });
    }

    const path =
      action === "signup"
        ? "/auth/v1/signup"
        : "/auth/v1/token?grant_type=password";

    const res = await fetch(`${url}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    return NextResponse.json({
      status: res.status,
      data,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}
