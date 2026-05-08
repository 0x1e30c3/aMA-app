import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  http,
  parseAbi,
  parseEther,
  formatEther,
} from "viem";
import { mainnet } from "viem/chains";

const MODEL_MAP: Record<string, string> = {
  claude: "google/gemini-2.0-flash-001",
  chatgpt: "google/gemini-2.0-flash-001",
  gemini: "google/gemini-2.0-flash-001",
  perplexity: "google/gemini-2.0-flash-001",
};

const COST_PER_REQUEST = parseEther(
  process.env.COST_PER_REQUEST ?? "0.0000000001",
);

const AGENT_TREASURY = "0x783e1512bFEa7C8B51A92cB150FEb5A04b91E9Aa" as const;

const treasuryAbi = parseAbi([
  "function getAvailableYield() external view returns (uint256)",
  "function totalSpentWstETH() external view returns (uint256)",
]);

const VALID_MODELS = new Set(Object.keys(MODEL_MAP));
const MAX_MESSAGES = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

let pendingSpend = BigInt(0);
const spendLedger: {
  id: string;
  timestamp: number;
  amount: string;
  model: string;
  recipient: string;
}[] = [];

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

async function verifyAndDeductYield(model: string): Promise<{
  approved: boolean;
  amount: string;
  availableYield: string;
  pendingTotal: string;
  ledgerId: string;
} | null> {
  const rpcUrl = process.env.RPC_URL;
  const serviceRecipient = process.env.SERVICE_RECIPIENT;

  if (!rpcUrl || !serviceRecipient) return null;

  try {
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl),
    });

    const availableYield = await publicClient.readContract({
      address: AGENT_TREASURY,
      abi: treasuryAbi,
      functionName: "getAvailableYield",
    });

    const effectiveYield = availableYield > pendingSpend
      ? availableYield - pendingSpend
      : BigInt(0);

    if (COST_PER_REQUEST > effectiveYield) {
      return {
        approved: false,
        amount: formatEther(COST_PER_REQUEST),
        availableYield: formatEther(effectiveYield),
        pendingTotal: formatEther(pendingSpend),
        ledgerId: "",
      };
    }

    pendingSpend += COST_PER_REQUEST;

    const ledgerId = crypto.randomUUID();

    spendLedger.push({
      id: ledgerId,
      timestamp: Date.now(),
      amount: formatEther(COST_PER_REQUEST),
      model,
      recipient: serviceRecipient,
    });

    if (spendLedger.length > 100) {
      spendLedger.splice(0, spendLedger.length - 100);
    }

    return {
      approved: true,
      amount: formatEther(COST_PER_REQUEST),
      availableYield: formatEther(effectiveYield - COST_PER_REQUEST),
      pendingTotal: formatEther(pendingSpend),
      ledgerId,
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { model, messages } = body;

    if (!model || !VALID_MODELS.has(model)) {
      return NextResponse.json(
        { error: "Invalid model selection" },
        { status: 400 },
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages must be a non-empty array" },
        { status: 400 },
      );
    }

    if (messages.length > MAX_MESSAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_MESSAGES} messages allowed` },
        { status: 400 },
      );
    }

    for (const msg of messages) {
      if (
        !msg ||
        typeof msg.role !== "string" ||
        typeof msg.content !== "string" ||
        !["user", "assistant", "system"].includes(msg.role)
      ) {
        return NextResponse.json(
          { error: "Invalid message format" },
          { status: 400 },
        );
      }
    }

    const yieldCheck = await verifyAndDeductYield(model);

    if (yieldCheck && !yieldCheck.approved) {
      return NextResponse.json(
        { error: "Insufficient yield balance for this request" },
        { status: 402 },
      );
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://aMA.vercel.app",
          "X-Title": "aMA",
        },
        body: JSON.stringify({
          model: MODEL_MAP[model],
          messages,
        }),
      },
    );

    if (!response.ok) {
      if (yieldCheck?.approved) {
        pendingSpend -= COST_PER_REQUEST;
        spendLedger.pop();
      }
      return NextResponse.json(
        { error: "Failed to get response from AI provider" },
        { status: 502 },
      );
    }

    const data = await response.json();

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      if (yieldCheck?.approved) {
        pendingSpend -= COST_PER_REQUEST;
        spendLedger.pop();
      }
      return NextResponse.json(
        { error: "Empty response from AI provider" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      content,
      model,
      usage: {
        prompt_tokens: data?.usage?.prompt_tokens ?? 0,
        completion_tokens: data?.usage?.completion_tokens ?? 0,
      },
      onchainSpend: yieldCheck?.approved
        ? {
          amount: yieldCheck.amount,
          ledgerId: yieldCheck.ledgerId,
          availableYield: yieldCheck.availableYield,
          pendingSettlement: yieldCheck.pendingTotal,
          verified: true,
        }
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const rpcUrl = process.env.RPC_URL;

  let onchainYield = "0";

  if (rpcUrl) {
    try {
      const publicClient = createPublicClient({
        chain: mainnet,
        transport: http(rpcUrl),
      });

      const availableYield = await publicClient.readContract({
        address: AGENT_TREASURY,
        abi: treasuryAbi,
        functionName: "getAvailableYield",
      });

      onchainYield = formatEther(availableYield);
    } catch { }
  }

  return NextResponse.json({
    pendingSettlement: formatEther(pendingSpend),
    onchainYield,
    totalRequests: spendLedger.length,
    recentLedger: spendLedger.slice(-20),
  });
}
