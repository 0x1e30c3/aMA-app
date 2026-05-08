"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { formatEther, parseEther } from "viem";
import { useWriteContract, usePublicClient } from "wagmi";
import { toast } from "sonner";
import { HiOutlinePauseCircle, HiOutlinePlayCircle, HiOutlinePencilSquare, HiOutlineArrowUpTray } from "react-icons/hi2";
import { agentTreasuryConfig } from "@/config/contracts";
import { useTreasuryRead } from "@/hooks/use-treasury";

function InfoRow({ label, value, mono, action }: { label: string; value: string; mono?: boolean; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border-main px-5 py-4">
      <span className="text-sm text-text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium text-text-main ${mono ? "font-mono" : ""}`}>{value}</span>
        {action}
      </div>
    </div>
  );
}

function truncateAddress(address: string): string {
  if (!address || address === "0x0000000000000000000000000000000000000000") return "Not set";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "0d 00:00:00";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${d}d ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function BudgetCycle() {
  const { cycleInfo, availableYield } = useTreasuryRead();

  const cycleData = cycleInfo.data as [bigint, bigint, bigint, bigint] | undefined;
  const cycleDuration = cycleData ? Number(cycleData[0]) : 0;
  const cycleSpent = cycleData ? formatEther(cycleData[1]) : "0";
  const cycleLimit = cycleData ? formatEther(cycleData[2]) : "0";
  const resetAt = cycleData ? Number(cycleData[3]) : 0;

  const yieldAvailable = availableYield.data ? formatEther(availableYield.data as bigint) : "0";

  const durationDays = cycleDuration > 0 ? Math.floor(cycleDuration / 86400) : 0;
  const durationLabel = durationDays > 0 ? `${durationDays} days` : "Not set";

  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!resetAt) return;
    const update = () => {
      setRemaining(Math.max(0, Math.floor(resetAt - Date.now() / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [resetAt]);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-text-main">Budget Cycle</h4>
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-border-main px-5 py-4">
          <span className="text-sm text-text-secondary">Cycle duration</span>
          <span className="text-sm font-medium text-text-main">{durationLabel}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-brand/20 bg-brand-light px-5 py-4">
          <span className="text-sm text-text-secondary">Next reset</span>
          <span className="font-mono text-sm font-semibold text-brand">{formatCountdown(remaining)}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border-main px-5 py-4">
          <span className="text-sm text-text-secondary">Cycle spent / limit</span>
          <span className="flex items-center gap-1 text-sm font-medium text-text-main">
            {Number.parseFloat(cycleSpent).toFixed(4)} / {Number.parseFloat(cycleLimit).toFixed(4)} wstETH
            <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="wstETH" width={12} height={12} className="rounded-full" />
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border-main px-5 py-4">
          <span className="text-sm text-text-secondary">Available yield</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-brand">
            {Number.parseFloat(yieldAvailable).toFixed(4)} wstETH
            <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="wstETH" width={12} height={12} className="rounded-full" />
          </span>
        </div>
      </div>
    </div>
  );
}

function OwnerControls() {
  const { paused } = useTreasuryRead();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);

  const isPaused = (paused.data as boolean) ?? false;

  const handlePauseToggle = async () => {
    if (!publicClient) return;
    try {
      const fn = isPaused ? "unpause" : "pause";
      const hash = await writeContractAsync({ ...agentTreasuryConfig, functionName: fn });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success(isPaused ? "Treasury resumed" : "Treasury paused");
      paused.refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message.split("\n")[0] : "Transaction failed");
    }
  };

  const handleWithdraw = async () => {
    if (!publicClient || !withdrawAmount || Number.parseFloat(withdrawAmount) <= 0) {
      toast.error("Enter a valid withdrawal amount");
      return;
    }
    try {
      const hash = await writeContractAsync({
        ...agentTreasuryConfig,
        functionName: "withdrawPrincipal",
        args: [parseEther(withdrawAmount)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success("Principal withdrawn successfully");
      setWithdrawAmount("");
      setShowWithdraw(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message.split("\n")[0] : "Transaction failed");
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-text-main">Owner Controls</h4>
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-border-main px-5 py-4">
          <div>
            <p className="text-sm text-text-main">Global Pause</p>
            <p className="text-xs text-text-secondary">Freeze all agent spending</p>
          </div>
          <button
            type="button"
            onClick={handlePauseToggle}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${isPaused
                ? "border-brand bg-brand-light text-brand hover:bg-brand hover:text-white"
                : "border-red-200 text-red-500 hover:bg-red-50"
              }`}
          >
            {isPaused ? (
              <><HiOutlinePlayCircle className="h-4 w-4" /> Resume</>
            ) : (
              <><HiOutlinePauseCircle className="h-4 w-4" /> Pause All</>
            )}
          </button>
        </div>
        <div className="rounded-xl border border-border-main px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-main">Withdraw Principal</p>
              <p className="text-xs text-text-secondary">Withdraw locked wstETH (owner only)</p>
            </div>
            <button
              type="button"
              onClick={() => setShowWithdraw(!showWithdraw)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border-main px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand hover:text-brand"
            >
              <HiOutlineArrowUpTray className="h-4 w-4" />
              Withdraw
            </button>
          </div>
          {showWithdraw && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                step="0.0001"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount in wstETH"
                className="w-full rounded-lg border border-border-main bg-main-bg px-3 py-2 text-sm text-text-main placeholder:text-text-secondary/50 focus:border-brand focus:outline-none"
              />
              <button
                type="button"
                onClick={handleWithdraw}
                className="cursor-pointer whitespace-nowrap rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AgentInfo() {
  const { owner, parentAgent, paused } = useTreasuryRead();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [showSetAgent, setShowSetAgent] = useState(false);
  const [agentInput, setAgentInput] = useState("");

  const getWhitelist = (): string[] => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("aMA-whitelist") || "[]"); } catch { return []; }
  };
  const whitelistedAddresses = getWhitelist();

  const ownerAddr = (owner.data as string) ?? "";
  const parentAddr = (parentAgent.data as string) ?? "";

  const handleSetAgent = async () => {
    if (!agentInput || !agentInput.startsWith("0x") || agentInput.length !== 42 || !publicClient) {
      toast.error("Enter a valid address");
      return;
    }
    try {
      const hash = await writeContractAsync({ ...agentTreasuryConfig, functionName: "setParentAgent", args: [agentInput as `0x${string}`] });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success("Parent agent updated");
      setShowSetAgent(false);
      setAgentInput("");
      parentAgent.refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message.split("\n")[0] : "Transaction failed");
    }
  };
  const isPaused = (paused.data as boolean) ?? false;

  const isLoading = owner.isLoading || parentAgent.isLoading || paused.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-text-main">Agent Configuration</h3>
          <p className="mt-1 text-sm text-text-secondary">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-main">Agent Configuration</h3>
        <p className="mt-1 text-sm text-text-secondary">Manage agent, budget, and owner controls</p>
      </div>
      <div className="space-y-3">
        <div className="rounded-xl border border-border-main px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Parent Agent</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium text-text-main">{truncateAddress(parentAddr)}</span>
              <button type="button" onClick={() => setShowSetAgent(!showSetAgent)} className="cursor-pointer text-text-secondary transition-colors hover:text-brand">
                <HiOutlinePencilSquare className="h-4 w-4" />
              </button>
            </div>
          </div>
          {showSetAgent && (
            <div className="mt-3 space-y-2">
              {whitelistedAddresses.length > 0 && (
                <select value={agentInput} onChange={(e) => setAgentInput(e.target.value)} className="w-full cursor-pointer appearance-none rounded-lg border border-border-main bg-main-bg px-3 py-2 font-mono text-sm text-text-main focus:border-brand focus:outline-none">
                  <option value="">Select from whitelist</option>
                  {whitelistedAddresses.map((a) => (
                    <option key={a} value={a}>{`${a.slice(0, 6)}...${a.slice(-4)}`}</option>
                  ))}
                </select>
              )}
              <div className="flex items-center gap-2">
                <input type="text" value={agentInput} onChange={(e) => setAgentInput(e.target.value)} placeholder="Or enter address manually" className="w-full rounded-lg border border-border-main bg-main-bg px-3 py-2 font-mono text-sm text-text-main placeholder:text-text-secondary/50 focus:border-brand focus:outline-none" />
                <button type="button" onClick={handleSetAgent} className="cursor-pointer whitespace-nowrap rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover">Set</button>
              </div>
            </div>
          )}
        </div>
        <InfoRow label="Owner Address" value={truncateAddress(ownerAddr)} mono />
        <div className="flex items-center justify-between rounded-xl border border-border-main px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${isPaused ? "bg-gray-400" : "bg-brand"}`} />
            <span className="text-sm text-text-secondary">Agent Status</span>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isPaused ? "bg-gray-100 text-text-secondary" : "bg-brand-light text-brand"}`}>
            {isPaused ? "Paused" : "Active"}
          </span>
        </div>
      </div>

      <div className="border-t border-border-main pt-6">
        <BudgetCycle />
      </div>

      <div className="border-t border-border-main pt-6">
        <OwnerControls />
      </div>
    </div>
  );
}
