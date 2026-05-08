import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  parseEther,
  formatEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

const AGENT_TREASURY = "0x783e1512bFEa7C8B51A92cB150FEb5A04b91E9Aa";

const treasuryAbi = parseAbi([
  "function spend(address to, uint256 wstETHAmount) external",
  "function getAvailableYield() external view returns (uint256)",
  "function principalWstETH() external view returns (uint256)",
  "function totalSpentWstETH() external view returns (uint256)",
  "function parentAgent() external view returns (address)",
  "function owner() external view returns (address)",
]);

const RPC_URL = process.env.RPC_URL!;
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY!;
const SERVICE_RECIPIENT = process.env.SERVICE_RECIPIENT!;
const SPEND_AMOUNT = parseEther(process.argv[2] ?? "0.0000000001");

const BLUE = "\x1b[34m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function line(label: string, value: string, color = RESET) {
  console.log(`  ${DIM}${label.padEnd(24)}${RESET} ${color}${value}${RESET}`);
}

function divider(title: string) {
  console.log(`\n${BLUE}${"─".repeat(20)} ${title} ${"─".repeat(20)}${RESET}`);
}

async function main() {
  if (!AGENT_PRIVATE_KEY) {
    console.log(`${RED}AGENT_PRIVATE_KEY not set in .env.local${RESET}`);
    process.exit(1);
  }

  if (!SERVICE_RECIPIENT) {
    console.log(`${RED}SERVICE_RECIPIENT not set in .env.local${RESET}`);
    process.exit(1);
  }

  const account = privateKeyToAccount(AGENT_PRIVATE_KEY as `0x${string}`);

  const client = createPublicClient({
    chain: mainnet,
    transport: http(RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http(RPC_URL),
  });

  divider("PRE-SPEND CHECK (onchain)");

  const [availableYield, principal, totalSpent, parentAgent, owner, ethBalance] =
    await Promise.all([
      client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "getAvailableYield" }),
      client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "principalWstETH" }),
      client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "totalSpentWstETH" }),
      client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "parentAgent" }),
      client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "owner" }),
      client.getBalance({ address: account.address }),
    ]);

  line("Contract", AGENT_TREASURY, BLUE);
  line("Owner", owner as string, DIM);
  line("Parent Agent", parentAgent as string, DIM);
  line("Agent Wallet", account.address, DIM);
  line("Agent ETH (gas)", formatEther(ethBalance), ethBalance > BigInt(0) ? GREEN : RED);
  line("Principal (wstETH)", formatEther(principal), BOLD);
  line("Available Yield", formatEther(availableYield), GREEN);
  line("Total Spent (before)", formatEther(totalSpent));
  line("Spend Amount", `${formatEther(SPEND_AMOUNT)} wstETH`, YELLOW);
  line("Recipient", SERVICE_RECIPIENT, DIM);

  if (ethBalance < parseEther("0.001")) {
    console.log(`\n  ${RED}[ERROR] Agent wallet needs ETH for gas${RESET}`);
    console.log(`  ${DIM}Send at least 0.005 ETH to ${account.address}${RESET}\n`);
    process.exit(1);
  }

  if (SPEND_AMOUNT > availableYield) {
    console.log(`\n  ${RED}[ERROR] Insufficient yield${RESET}`);
    console.log(`  ${DIM}Available: ${formatEther(availableYield)} wstETH${RESET}`);
    console.log(`  ${DIM}Requested: ${formatEther(SPEND_AMOUNT)} wstETH${RESET}\n`);
    process.exit(1);
  }

  divider("EXECUTING spend()");
  console.log(`  ${DIM}Submitting transaction...${RESET}`);

  const txHash = await walletClient.writeContract({
    address: AGENT_TREASURY as `0x${string}`,
    abi: treasuryAbi,
    functionName: "spend",
    args: [SERVICE_RECIPIENT as `0x${string}`, SPEND_AMOUNT],
  });

  line("Tx Hash", txHash, CYAN);
  console.log(`  ${DIM}Waiting for confirmation...${RESET}`);

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });

  divider("SPEND CONFIRMED");
  line("Status", receipt.status === "success" ? "SUCCESS" : "REVERTED", receipt.status === "success" ? GREEN : RED);
  line("Block", `${receipt.blockNumber}`, DIM);
  line("Gas Used", `${receipt.gasUsed}`, DIM);
  line("Tx Hash", txHash, CYAN);
  line("Etherscan", `https://etherscan.io/tx/${txHash}`, CYAN);

  const [newYield, newTotalSpent] = await Promise.all([
    client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "getAvailableYield" }),
    client.readContract({ address: AGENT_TREASURY as `0x${string}`, abi: treasuryAbi, functionName: "totalSpentWstETH" }),
  ]);

  divider("POST-SPEND STATE (onchain)");
  line("Amount Spent", `${formatEther(SPEND_AMOUNT)} wstETH`, YELLOW);
  line("Total Spent (after)", formatEther(newTotalSpent), YELLOW);
  line("Remaining Yield", formatEther(newYield), GREEN);
  line("Principal (wstETH)", formatEther(principal), BOLD);
  line("Principal Changed?", "NO — structurally locked", RED);
  console.log();
}

main().catch((err) => {
  console.log(`\n  ${RED}[ERROR] ${err instanceof Error ? err.message.split("\n")[0] : err}${RESET}\n`);
  process.exit(1);
});
