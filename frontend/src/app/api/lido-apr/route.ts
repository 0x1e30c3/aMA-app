import { NextResponse } from "next/server";

let cache: { apr: number; timestamp: number } | null = null;
const CACHE_TTL = 300_000;

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({ apr: cache.apr });
  }

  try {
    const res = await fetch("https://eth-api.lido.fi/v1/protocol/steth/apr/last");
    if (!res.ok) throw new Error("Lido API error");

    const json = await res.json();
    const apr = json?.data?.apr ?? 0;

    cache = { apr, timestamp: Date.now() };
    return NextResponse.json({ apr });
  } catch {
    return NextResponse.json({ apr: cache?.apr ?? 0 }, { status: 200 });
  }
}
