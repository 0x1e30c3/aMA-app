import {
  createPublicClient,
  http,
  parseAbi,
  parseEther,
  formatEther,
} from "viem";
import { mainnet } from "viem/chains";

const AGENT_TREASURY = "0x783e1512bFEa7C8B51A92cB150FEb5A04b91E9Aa";
const WSTETH = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0";

const treasuryAbi = parseAbi([
  "function getAvailableYield() external view returns (uint256)",
  "function principalWstETH() external view returns (uint256)",
  "function totalSpentWstETH() external view returns (uint256)",
  "function getCurrentValue() external view returns (uint256)",
  "function initialStETHValue() external view returns (uint256)",
  "function parentAgent() external view returns (address)",
  "function owner() external view returns (address)",
  "function paused() external view returns (bool)",
  "function whitelistEnabled() external view returns (bool)",
  "function capEnabled() external view returns (bool)",
  "function perTxCap() external view returns (uint256)",
  "function rateLimitEnabled() external view returns (bool)",
  "function getCycleInfo() external view returns (uint256,uint256,uint256,uint256)",
]);

const erc20Abi = parseAbi([
  "function balanceOf(address) external view returns (uint256)",
]);

const RPC_URL = process.env.RPC_URL!;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const SERVICE_RECIPIENT = process.env.SERVICE_RECIPIENT!;
const COST_PER_REQUEST = parseEther(process.env.COST_PER_REQUEST ?? "0.0000000001");

const client = createPublicClient({
  chain: mainnet,
  transport: http(RPC_URL),
});

let pendingSpend = BigInt(0);
let totalRequests = 0;

const BLUE = "\x1b[34m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function line(label: string, value: string, color = RESET) {
  console.log(`  ${DIM}${label.padEnd(24)}${RESET} ${color}${value}${RESET}`);
}

function divider(title?: string) {
  if (title) {
    console.log(`\n${BLUE}${"─".repeat(20)} ${title} ${"─".repeat(20)}${RESET}`);
  } else {
    console.log(`${DIM}${"─".repeat(56)}${RESET}`);
  }
}

async function readTreasury() {
  const [
    principal,
    initialValue,
    currentValue,
    availableYield,
    totalSpent,
    owner,
    parentAgent,
    paused,
    whitelistEnabled,
    capEnabled,
    perTxCap,
    rateLimitEnabled,
    cycleInfo,
    treasuryWstBalance,
  ] = await Promise.all([
    client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "principalWstETH" }),
    client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "initialStETHValue" }),
    client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "getCurrentValue" }),
    client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "getAvailableYield" }),
    client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "totalSpentWstETH" }),
    client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "owner" }),
    client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "parentAgent" }),
    client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "paused" }),
    client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "whitelistEnabled" }),
    client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "capEnabled" }),
    client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "perTxCap" }),
    client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "rateLimitEnabled" }),
    client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "getCycleInfo" }),
    client.readContract({ address: WSTETH as `0x${string}`, abi: erc20Abi, functionName: "balanceOf", args: [AGENT_TREASURY as `0x${string}`] }),
  ]);

  return {
    principal, initialValue, currentValue, availableYield,
    totalSpent, owner, parentAgent, paused,
    whitelistEnabled, capEnabled, perTxCap, rateLimitEnabled,
    cycleInfo: cycleInfo as [bigint, bigint, bigint, bigint],
    treasuryWstBalance,
  };
}

async function showTreasuryStatus() {
  const t = await readTreasury();

  divider("TREASURY STATUS (onchain)");
  line("Contract", AGENT_TREASURY, BLUE);
  line("Owner", t.owner as string, DIM);
  line("Parent Agent", t.parentAgent as string, DIM);
  line("Status", t.paused ? "PAUSED" : "ACTIVE", t.paused ? RED : GREEN);

  divider("PRINCIPAL & YIELD");
  line("Principal (wstETH)", formatEther(t.principal), BOLD);
  line("Initial stETH Value", formatEther(t.initialValue));
  line("Current stETH Value", formatEther(t.currentValue));
  line("Yield Accrued", formatEther(t.availableYield), GREEN);
  line("Total Spent (onchain)", formatEther(t.totalSpent));
  line("Treasury wstETH Bal.", formatEther(t.treasuryWstBalance));

  divider("PERMISSIONS");
  line("Whitelist", t.whitelistEnabled ? "Enabled" : "Disabled", t.whitelistEnabled ? GREEN : DIM);
  line("Per-Tx Cap", t.capEnabled ? `${formatEther(t.perTxCap)} wstETH` : "Disabled", t.capEnabled ? YELLOW : DIM);
  line("Rate Limit", t.rateLimitEnabled ? "Enabled" : "Disabled", t.rateLimitEnabled ? YELLOW : DIM);

  if (t.rateLimitEnabled) {
    const [duration, spent, limit] = t.cycleInfo;
    line("  Cycle Duration", `${Number(duration) / 86400} days`);
    line("  Cycle Spent/Limit", `${formatEther(spent)} / ${formatEther(limit)} wstETH`);
  }

  return t;
}

async function chatWithAI(prompt: string, model = "gemini") {
  const modelMap: Record<string, string> = {
    claude: "google/gemini-2.0-flash-001",
    chatgpt: "google/gemini-2.0-flash-001",
    gemini: "google/gemini-2.0-flash-001",
    perplexity: "google/gemini-2.0-flash-001",
  };

  divider("AGENT YIELD CHECK");

  const availableYield = await client.readContract({
    address: AGENT_TREASURY as `0x${string}`,
    abi: treasuryAbi,
    functionName: "getAvailableYield",
  });

  const effectiveYield = availableYield > pendingSpend
    ? availableYield - pendingSpend
    : BigInt(0);

  line("Onchain Yield", formatEther(availableYield), GREEN);
  line("Pending Settlement", formatEther(pendingSpend), YELLOW);
  line("Effective Balance", formatEther(effectiveYield), BOLD);
  line("Cost This Request", formatEther(COST_PER_REQUEST), DIM);

  if (COST_PER_REQUEST > effectiveYield) {
    console.log(`\n  ${RED}[DENIED] Insufficient yield balance${RESET}`);
    console.log(`  ${DIM}Agent cannot spend more than available yield.${RESET}`);
    console.log(`  ${DIM}Principal remains locked and untouchable.${RESET}\n`);
    return;
  }

  console.log(`  ${GREEN}[APPROVED] Yield sufficient — serving request${RESET}`);

  divider("AI REQUEST");
  line("Model", model, BLUE);
  line("Prompt", prompt.length > 50 ? prompt.slice(0, 50) + "..." : prompt);
  line("Recipient", SERVICE_RECIPIENT, DIM);

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://aMA.vercel.app",
      "X-Title": "aMA",
    },
    body: JSON.stringify({
      model: modelMap[model] ?? modelMap.gemini,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    console.log(`  ${RED}[ERROR] AI provider returned ${res.status}${RESET}`);
    return;
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    console.log(`  ${RED}[ERROR] Empty response from AI${RESET}`);
    return;
  }

  pendingSpend += COST_PER_REQUEST;
  totalRequests++;

  divider("AI RESPONSE");
  const lines = content.split("\n");
  for (const l of lines.slice(0, 10)) {
    console.log(`  ${l}`);
  }
  if (lines.length > 10) {
    console.log(`  ${DIM}... (${lines.length - 10} more lines)${RESET}`);
  }

  divider("PAYMENT RECEIPT");
  line("Status", "YIELD VERIFIED", GREEN);
  line("Amount Deducted", `${formatEther(COST_PER_REQUEST)} wstETH`, YELLOW);
  line("Pending Settlement", `${formatEther(pendingSpend)} wstETH`, YELLOW);
  line("Remaining Yield", formatEther(effectiveYield - COST_PER_REQUEST), GREEN);
  line("Total Requests", `${totalRequests}`);
  line("Principal Touched", "NEVER", RED);
  console.log();
}

async function interactiveMode() {
  const readline = await import("node:readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, resolve));

  console.log(`\n${BOLD}${BLUE}aMA Agent Demo${RESET}`);
  console.log(`${DIM}Agent pays for AI from yield — principal never touched${RESET}\n`);
  console.log(`${DIM}Commands:${RESET}`);
  console.log(`  ${BOLD}/status${RESET}  — Show treasury status (onchain)`);
  console.log(`  ${BOLD}/ledger${RESET}  — Show spending ledger`);
  console.log(`  ${BOLD}/quit${RESET}    — Exit`);
  console.log(`  ${DIM}Or type any message to chat with AI${RESET}\n`);

  await showTreasuryStatus();
  console.log();

  while (true) {
    const input = await ask(`${BLUE}agent>${RESET} `);
    const trimmed = input.trim();

    if (!trimmed) continue;

    if (trimmed === "/quit" || trimmed === "/exit") {
      console.log(`\n${DIM}Session ended. ${totalRequests} requests served.${RESET}`);
      rl.close();
      process.exit(0);
    }

    if (trimmed === "/status") {
      await showTreasuryStatus();
      console.log();
      continue;
    }

    if (trimmed === "/ledger") {
      divider("SPENDING LEDGER");
      line("Total Requests", `${totalRequests}`);
      line("Total Pending", `${formatEther(pendingSpend)} wstETH`, YELLOW);
      line("Cost Per Request", `${formatEther(COST_PER_REQUEST)} wstETH`, DIM);
      line("Recipient", SERVICE_RECIPIENT, DIM);
      console.log();
      continue;
    }

    await chatWithAI(trimmed);
  }
}

const args = process.argv.slice(2);

if (args[0] === "--status") {
  showTreasuryStatus().then(() => process.exit(0));
} else if (args[0] === "--chat" && args[1]) {
  showTreasuryStatus()
    .then(() => chatWithAI(args.slice(1).join(" ")))
    .then(() => process.exit(0));
} else {
  interactiveMode();
}
