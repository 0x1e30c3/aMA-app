"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { formatEther, parseEther } from "viem";
import { useWriteContract, usePublicClient, useReadContract } from "wagmi";
import { toast } from "sonner";
import { agentTreasuryConfig } from "@/config/contracts";
import { useTreasuryRead } from "@/hooks/use-treasury";

function formatETH(value: string): string {
  return Number.parseFloat(value || "0").toFixed(4);
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function CycleCountdown({ targetTimestamp }: { targetTimestamp: number }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Math.floor(targetTimestamp - Date.now() / 1000));
      setRemaining(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp]);

  return (
    <div className="flex items-center justify-between rounded-xl bg-main-bg px-4 py-3">
      <span className="text-sm text-text-secondary">Next cycle reset</span>
      <span className="font-mono text-sm font-semibold text-text-main">
        {formatCountdown(remaining)}
      </span>
    </div>
  );
}

function SubAgentBudgetDisplay({ address }: { address: string }) {
  const remaining = useReadContract({
    ...agentTreasuryConfig,
    functionName: "getSubAgentRemaining",
    args: [address as `0x${string}`],
  });

  const val = remaining.data ? formatEther(remaining.data as bigint) : "0";

  return (
    <span className="flex items-center gap-1.5 text-lg font-semibold text-brand">
      {formatETH(val)} wstETH
      <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="wstETH" className="rounded-full" width={18} height={18} />
    </span>
  );
}

export function AgentActions() {
  const { paused, parentAgent, subAgents, availableYield, cycleInfo } = useTreasuryRead();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("treasury");
  const [txPending, setTxPending] = useState(false);

  const isPaused = (paused.data as boolean) ?? false;
  const parentAddr = (parentAgent.data as string) ?? "";
  const subAgentList = (subAgents.data as string[]) ?? [];
  const yieldAvailable = availableYield.data ? formatEther(availableYield.data as bigint) : "0";
  const cycleData = cycleInfo.data as [bigint, bigint, bigint, bigint] | undefined;
  const resetAt = cycleData ? Number(cycleData[3]) : 0;

  const hasParent = parentAddr && parentAddr !== "0x0000000000000000000000000000000000000000";

  const agents = [
    { id: "treasury", label: "Treasury", role: "Direct Spend", address: "" },
    ...(hasParent ? [{ id: "parent", label: "Parent Agent", role: "Parent", address: parentAddr }] : []),
    ...subAgentList.map((addr, i) => ({
      id: `sub-${i}`,
      label: `Sub-Agent ${i + 1}`,
      role: truncateAddress(addr),
      address: addr,
    })),
  ];

  const selectedAgentData = agents.find((a) => a.id === selectedAgent) ?? agents[0];
  const isTreasuryDirect = selectedAgent === "treasury";

  const handleSpend = async () => {
    if (!publicClient || !amount || Number.parseFloat(amount) <= 0 || !recipient) return;
    if (!recipient.startsWith("0x") || recipient.length !== 42) {
      toast.error("Please enter a valid recipient address");
      return;
    }
    try {
      setTxPending(true);
      const hash = await writeContractAsync({
        ...agentTreasuryConfig,
        functionName: "spend",
        args: [recipient as `0x${string}`, parseEther(amount)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success("Spend transaction confirmed");
      setAmount("");
      setRecipient("");
      availableYield.refetch();
      cycleInfo.refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message.split("\n")[0] : "Transaction failed");
    } finally {
      setTxPending(false);
    }
  };

  const isLoading = paused.isLoading || subAgents.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-main">Trigger Spend</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Send wstETH yield to a whitelisted recipient
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="agent-select" className="mb-1.5 block text-sm font-medium text-text-main">
            Select Agent
          </label>
          <select
            id="agent-select"
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            disabled={isLoading}
            className="w-full cursor-pointer appearance-none rounded-xl border border-border-main bg-main-bg px-4 py-3 text-sm text-text-main focus:border-brand focus:outline-none"
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label} ({a.role})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-brand-light px-5 py-4">
          <div>
            <span className="text-sm font-medium text-text-secondary">
              {isTreasuryDirect ? "Available yield" : "Remaining budget"}
            </span>
            <p className="mt-0.5 text-xs text-text-secondary">{selectedAgentData.role}</p>
          </div>
          {isTreasuryDirect ? (
            <span className="flex items-center gap-1.5 text-lg font-semibold text-brand">
              {formatETH(yieldAvailable)} wstETH
              <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="wstETH" className="rounded-full" width={18} height={18} />
            </span>
          ) : (
            <SubAgentBudgetDisplay address={selectedAgentData.address} />
          )}
        </div>

        <div>
          <label htmlFor="spend-recipient" className="mb-1.5 block text-sm font-medium text-text-main">
            Recipient
          </label>
          <input
            id="spend-recipient"
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            disabled={isPaused || txPending}
            className="w-full rounded-xl border border-border-main bg-main-bg px-4 py-3 font-mono text-sm text-text-main placeholder:text-text-secondary/50 focus:border-brand focus:outline-none disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="spend-amount" className="mb-1.5 block text-sm font-medium text-text-main">
            Amount
          </label>
          <div className="flex items-center gap-2">
            <input
              id="spend-amount"
              type="number"
              step="0.0001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0000"
              disabled={isPaused || txPending}
              className="w-full rounded-xl border border-border-main bg-main-bg px-4 py-3 text-sm text-text-main placeholder:text-text-secondary/50 focus:border-brand focus:outline-none disabled:opacity-50"
            />
            <span className="flex items-center gap-1 whitespace-nowrap text-sm text-text-secondary">
              wstETH
              <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="wstETH" className="rounded-full" width={16} height={16} />
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={isPaused || !amount || !recipient || txPending}
        onClick={handleSpend}
        className="w-full cursor-pointer rounded-xl bg-brand px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPaused ? "Agent Paused" : txPending ? "Confirming..." : "Trigger Spend"}
      </button>

      {resetAt > 0 && <CycleCountdown targetTimestamp={resetAt} />}
    </div>
  );
}
