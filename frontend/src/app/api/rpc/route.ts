import { NextRequest, NextResponse } from "next/server";

const RPC_URL = process.env.RPC_URL;

const ALLOWED_METHODS = new Set([
  "eth_call",
  "eth_getBalance",
  "eth_blockNumber",
  "eth_chainId",
  "eth_getTransactionReceipt",
  "eth_getTransactionByHash",
  "eth_estimateGas",
  "eth_gasPrice",
  "eth_maxPriorityFeePerGas",
  "eth_getBlockByNumber",
  "eth_getCode",
  "eth_getLogs",
  "eth_sendRawTransaction",
  "eth_getTransactionCount",
  "net_version",
]);

const rateLimit = new Map<string, { count: number; reset: number }>();
const MAX_REQUESTS = 60;
const WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now > entry.reset) {
    rateLimit.set(ip, { count: 1, reset: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  if (!RPC_URL) {
    return NextResponse.json({ error: "RPC not configured" }, { status: 500 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const isBatch = Array.isArray(body);
  const requests = (isBatch ? body : [body]) as Record<string, unknown>[];

  for (const r of requests) {
    if (!r || typeof r !== "object" || !("method" in r)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (!ALLOWED_METHODS.has(r.method as string)) {
      return NextResponse.json(
        { error: `Method not allowed: ${r.method}` },
        { status: 403 },
      );
    }
  }

  try {
    const response = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "RPC request failed" }, { status: 502 });
  }
}
