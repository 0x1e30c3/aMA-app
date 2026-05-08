"use client";

import { useState } from "react";
import { formatEther, parseEther } from "viem";
import { useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { toast } from "sonner";
import { HiOutlineUserCircle, HiOutlineCpuChip, HiOutlinePlusCircle } from "react-icons/hi2";
import { agentTreasuryConfig } from "@/config/contracts";
import { useTreasuryRead } from "@/hooks/use-treasury";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatETH(value: string): string {
  return Number.parseFloat(value || "0").toFixed(4);
}

function ProgressBar({ spent, budget }: { spent: string; budget: string }) {
  const s = Number.parseFloat(spent);
  const b = Number.parseFloat(budget);
  const pct = b > 0 ? Math.min((s / b) * 100, 100) : 0;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[10px] text-text-secondary">
        <span>{formatETH(spent)} / {formatETH(budget)} wstETH</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-border-main">
        <div className="h-1.5 rounded-full bg-brand transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SubAgentCard({ address: agentAddr }: { address: string }) {
  const subAgentInfo = useReadContract({
    ...agentTreasuryConfig,
    functionName: "subAgents",
    args: [agentAddr as `0x${string}`],
  });

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const data = subAgentInfo.data as [bigint, bigint, boolean, boolean] | undefined;
  const budgetCap = data ? formatEther(data[0]) : "0";
  const spent = data ? formatEther(data[1]) : "0";
  const isActive = data ? data[2] : true;
  const isPaused = !isActive;

  const handleToggle = async () => {
    if (!publicClient) return;
    try {
      const fn = isPaused ? "resumeSubAgent" : "pauseSubAgent";
      const hash = await writeContractAsync({
        ...agentTreasuryConfig,
        functionName: fn,
        args: [agentAddr as `0x${string}`],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success(isPaused ? "Sub-agent resumed" : "Sub-agent paused");
      subAgentInfo.refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message.split("\n")[0] : "Transaction failed");
    }
  };

  return (
    <div className={`rounded-xl border p-4 transition-colors ${isPaused ? "border-gray-200 opacity-60" : "border-border-main"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-light text-brand">
            <HiOutlineCpuChip className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-main">Sub-Agent</p>
            <p className="font-mono text-xs text-text-secondary">{truncateAddress(agentAddr)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isPaused ? "bg-gray-100 text-text-secondary" : "bg-brand-light text-brand"}`}>
            {isPaused ? "Paused" : "Active"}
          </span>
          <button
            type="button"
            onClick={handleToggle}
            className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${isPaused
                ? "border-brand bg-brand-light text-brand hover:bg-brand hover:text-white"
                : "border-border-main text-text-secondary hover:border-red-300 hover:text-red-500"
              }`}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>
      <ProgressBar spent={spent} budget={budgetCap} />
    </div>
  );
}

function AddSubAgentForm({ onSuccess }: { onSuccess: () => void }) {
  const [addr, setAddr] = useState("");
  const [budget, setBudget] = useState("");

  const getWhitelist = (): string[] => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("aMA-whitelist") || "[]"); } catch { return []; }
  };
  const whitelistedAddresses = getWhitelist();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const handleAdd = async () => {
    if (!addr || !addr.startsWith("0x") || addr.length !== 42) { toast.error("Enter a valid address"); return; }
    if (!budget || Number.parseFloat(budget) <= 0) { toast.error("Enter a budget cap"); return; }
    if (!publicClient) return;
    try {
      const hash = await writeContractAsync({ ...agentTreasuryConfig, functionName: "addSubAgent", args: [addr as `0x${string}`, parseEther(budget)] });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success("Sub-agent added");
      setAddr("");
      setBudget("");
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message.split("\n")[0] : "Transaction failed");
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-brand/30 p-4">
      <p className="text-sm font-medium text-text-main">Add Sub-Agent</p>
      <div className="mt-3 space-y-2">
        {whitelistedAddresses.length > 0 && (
          <select value={addr} onChange={(e) => setAddr(e.target.value)} className="w-full cursor-pointer appearance-none rounded-lg border border-border-main bg-main-bg px-3 py-2 font-mono text-sm text-text-main focus:border-brand focus:outline-none">
            <option value="">Select from whitelist</option>
            {whitelistedAddresses.map((a) => (
              <option key={a} value={a}>{`${a.slice(0, 6)}...${a.slice(-4)}`}</option>
            ))}
          </select>
        )}
        <input type="text" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Or enter address manually" className="w-full rounded-lg border border-border-main bg-main-bg px-3 py-2 font-mono text-sm text-text-main placeholder:text-text-secondary/50 focus:border-brand focus:outline-none" />
        <div className="flex items-center gap-2">
          <input type="number" step="0.0001" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Budget cap" className="w-full rounded-lg border border-border-main bg-main-bg px-3 py-2 text-sm text-text-main placeholder:text-text-secondary/50 focus:border-brand focus:outline-none" />
          <span className="whitespace-nowrap text-xs text-text-secondary">wstETH</span>
        </div>
        <button type="button" onClick={handleAdd} className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-hover">
          <HiOutlinePlusCircle className="h-4 w-4" /> Add Sub-Agent
        </button>
      </div>
    </div>
  );
}

export function AgentTree() {
  const { parentAgent, subAgents, totalSpentWstETH, principalWstETH } = useTreasuryRead();

  const parentAddr = (parentAgent.data as string) ?? "";
  const subAgentList = (subAgents.data as string[]) ?? [];
  const totalSpent = totalSpentWstETH.data ? formatEther(totalSpentWstETH.data as bigint) : "0";
  const principal = principalWstETH.data ? formatEther(principalWstETH.data as bigint) : "0";

  const isLoading = parentAgent.isLoading || subAgents.isLoading;
  const hasParent = parentAddr && parentAddr !== "0x0000000000000000000000000000000000000000";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-text-main">Agent Hierarchy</h3>
          <p className="mt-1 text-sm text-text-secondary">Loading agent data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-main">Agent Hierarchy</h3>
        <p className="mt-1 text-sm text-text-secondary">Parent agent and sub-agent budget allocation</p>
      </div>

      <div className="rounded-xl border-2 border-brand/20 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
              <HiOutlineUserCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-main">Parent Agent</p>
              <p className="font-mono text-xs text-text-secondary">
                {hasParent ? truncateAddress(parentAddr) : "Not configured"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-text-main">{formatETH(principal)} wstETH</p>
            <p className="text-xs text-text-secondary">Principal</p>
          </div>
        </div>
        <ProgressBar spent={totalSpent} budget={principal} />
      </div>

      {subAgentList.length > 0 && (
        <div className="space-y-2">
          {subAgentList.map((addr) => (
            <div key={addr} className="relative pl-10">
              <div className="absolute left-4 top-0 h-full w-px bg-border-main" />
              <div className="absolute left-4 top-7 h-px w-6 bg-border-main" />
              <SubAgentCard address={addr} />
            </div>
          ))}
        </div>
      )}

      <AddSubAgentForm onSuccess={() => subAgents.refetch()} />
    </div>
  );
}
