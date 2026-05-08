"use client";

import { useState } from "react";
import { parseEther, formatEther } from "viem";
import { useWriteContract, usePublicClient } from "wagmi";
import { toast } from "sonner";
import { HiOutlineInformationCircle } from "react-icons/hi2";
import { agentTreasuryConfig } from "@/config/contracts";
import { useTreasuryRead } from "@/hooks/use-treasury";

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="cursor-pointer text-text-secondary transition-colors hover:text-brand"
      >
        <HiOutlineInformationCircle className="h-3.5 w-3.5" />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl border border-border-main bg-surface px-4 py-3 text-xs text-text-secondary shadow-lg">
          {text}
          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-border-main bg-surface" />
        </div>
      )}
    </div>
  );
}

function Toggle({ enabled, loading, onToggle }: { enabled: boolean; loading?: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={loading}
      className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors disabled:opacity-50 ${enabled ? "bg-brand" : "bg-gray-200"
        }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : "translate-x-0"
          }`}
      />
    </button>
  );
}

function WhitelistControl({
  enabled,
  loading,
  onToggle,
  onAdd,
  onRemove,
}: {
  enabled: boolean;
  loading: boolean;
  onToggle: () => void;
  onAdd: (addr: string) => void;
  onRemove: (addr: string) => void;
}) {
  const [input, setInput] = useState("");
  const storageKey = "aMA-whitelist";

  const getStored = (): string[] => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; }
  };

  const [addresses, setAddresses] = useState<string[]>(getStored);

  const handleAdd = () => {
    if (!input || !input.startsWith("0x") || input.length !== 42) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }
    onAdd(input);
    const updated = [...addresses, input];
    setAddresses(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setInput("");
  };

  const handleRemove = (addr: string) => {
    onRemove(addr);
    const updated = addresses.filter((a) => a !== addr);
    setAddresses(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  return (
    <div className="rounded-xl border border-border-main p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-brand">
              <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-text-main">Recipient Whitelist</p>
              <InfoTooltip text="Only the contract owner (admin) can add or remove whitelisted addresses. When enabled, agents can only send wstETH to approved addresses — preventing unauthorized transfers." />
            </div>
            <p className="text-xs text-text-secondary">Approved addresses only</p>
          </div>
        </div>
        <Toggle enabled={enabled} loading={loading} onToggle={onToggle} />
      </div>
      {enabled && (
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="0x..."
              className="flex-1 rounded-lg border border-border-main bg-main-bg px-3 py-2 font-mono text-sm text-text-main placeholder:text-text-secondary/50 focus:border-brand focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="cursor-pointer rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
            >
              Add
            </button>
          </div>
          {addresses.length === 0 ? (
            <p className="py-2 text-xs text-text-secondary">No addresses whitelisted.</p>
          ) : (
            <ul className="space-y-1.5">
              {addresses.map((addr) => (
                <li key={addr} className="flex items-center justify-between rounded-lg bg-main-bg px-3 py-2">
                  <span className="font-mono text-xs text-text-main">{addr}</span>
                  <button type="button" onClick={() => handleRemove(addr)} className="cursor-pointer text-xs text-text-secondary transition-colors hover:text-text-main">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function CapControl({
  icon,
  label,
  description,
  info,
  placeholder,
  enabled,
  value,
  loading,
  onToggle,
  onSave,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  info: string;
  placeholder: string;
  enabled: boolean;
  value: string;
  loading: boolean;
  onToggle: () => void;
  onSave?: (val: string) => void;
}) {
  const [input, setInput] = useState(value);

  return (
    <div className="rounded-xl border border-border-main p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-text-main">{label}</p>
              <InfoTooltip text={info} />
            </div>
            <p className="text-xs text-text-secondary">{description}</p>
          </div>
        </div>
        <Toggle enabled={enabled} loading={loading} onToggle={onToggle} />
      </div>
      {enabled && (
        <div className="mt-4 flex items-center gap-2">
          <input
            type="number"
            step="0.0001"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-border-main bg-main-bg px-3 py-2 text-sm text-text-main placeholder:text-text-secondary/50 focus:border-brand focus:outline-none"
          />
          <span className="whitespace-nowrap text-sm text-text-secondary">wstETH</span>
          {onSave && (
            <button
              type="button"
              onClick={() => onSave(input)}
              className="cursor-pointer whitespace-nowrap rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
            >
              Save
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function PermissionPanel() {
  const { whitelistEnabled, capEnabled, perTxCap, rateLimitEnabled, cycleInfo } = useTreasuryRead();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [txPending, setTxPending] = useState(false);

  const isWhitelistOn = (whitelistEnabled.data as boolean) ?? false;
  const isCapOn = (capEnabled.data as boolean) ?? false;
  const isRateOn = (rateLimitEnabled.data as boolean) ?? false;
  const capValue = perTxCap.data ? formatEther(perTxCap.data as bigint) : "";
  const cycleData = cycleInfo.data as [bigint, bigint, bigint, bigint] | undefined;
  const cycleLimitValue = cycleData ? formatEther(cycleData[2]) : "";

  const isLoading = whitelistEnabled.isLoading || capEnabled.isLoading || rateLimitEnabled.isLoading;

  const execTx = async (fn: () => Promise<`0x${string}`>, successMsg: string) => {
    if (!publicClient) return;
    try {
      setTxPending(true);
      const hash = await fn();
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success(successMsg);
      whitelistEnabled.refetch();
      capEnabled.refetch();
      perTxCap.refetch();
      rateLimitEnabled.refetch();
      cycleInfo.refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message.split("\n")[0] : "Transaction failed");
    } finally {
      setTxPending(false);
    }
  };

  const toggleWhitelist = () =>
    execTx(
      () => writeContractAsync({ ...agentTreasuryConfig, functionName: "setWhitelistEnabled", args: [!isWhitelistOn] }),
      isWhitelistOn ? "Whitelist disabled" : "Whitelist enabled"
    );

  const toggleCap = () =>
    execTx(
      () => writeContractAsync({ ...agentTreasuryConfig, functionName: "setCapEnabled", args: [!isCapOn] }),
      isCapOn ? "Per-transaction cap disabled" : "Per-transaction cap enabled"
    );

  const toggleRate = () =>
    execTx(
      () => writeContractAsync({ ...agentTreasuryConfig, functionName: "setRateLimitEnabled", args: [!isRateOn] }),
      isRateOn ? "Rate limit disabled" : "Rate limit enabled"
    );

  const handleAddWhitelist = (addr: string) =>
    execTx(
      () => writeContractAsync({ ...agentTreasuryConfig, functionName: "setWhitelist", args: [addr as `0x${string}`, true] }),
      "Address added to whitelist"
    );

  const handleRemoveWhitelist = (addr: string) =>
    execTx(
      () => writeContractAsync({ ...agentTreasuryConfig, functionName: "setWhitelist", args: [addr as `0x${string}`, false] }),
      "Address removed from whitelist"
    );

  const handleSaveCap = (val: string) => {
    if (!val || Number.parseFloat(val) <= 0) {
      toast.error("Enter a valid cap amount");
      return;
    }
    execTx(
      () => writeContractAsync({ ...agentTreasuryConfig, functionName: "setPerTxCap", args: [parseEther(val)] }),
      "Per-transaction cap updated"
    );
  };

  const handleSaveCycleLimit = (val: string) => {
    if (!val || Number.parseFloat(val) <= 0) {
      toast.error("Enter a valid cycle limit");
      return;
    }
    execTx(
      () => writeContractAsync({ ...agentTreasuryConfig, functionName: "setCycleLimit", args: [parseEther(val)] }),
      "Cycle limit updated"
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-text-main">Permission Controls</h3>
          <p className="mt-1 text-sm text-text-secondary">Loading contract state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-main">Permission Controls</h3>
        <p className="mt-1 text-sm text-text-secondary">Configure spending restrictions for the agent</p>
      </div>
      <div className="space-y-3">
        <WhitelistControl
          enabled={isWhitelistOn}
          loading={txPending}
          onToggle={toggleWhitelist}
          onAdd={handleAddWhitelist}
          onRemove={handleRemoveWhitelist}
        />
        <CapControl
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-brand">
              <path fillRule="evenodd" d="M1 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Zm12 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm13-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM1.75 14.5a.75.75 0 0 0 0 1.5c4.417 0 8.693.603 12.749 1.73 1.111.309 2.251-.512 2.251-1.696v-.784a.75.75 0 0 0-1.5 0v.784a.272.272 0 0 1-.35.25A49.043 49.043 0 0 0 1.75 14.5Z" clipRule="evenodd" />
            </svg>
          }
          label="Per-Transaction Cap"
          description="Max amount per spend"
          info="Only the contract owner (admin) can set this cap. When enabled, each agent spend transaction is limited to this maximum wstETH amount — preventing large single transfers."
          placeholder="0.01"
          enabled={isCapOn}
          value={capValue}
          loading={txPending}
          onToggle={toggleCap}
          onSave={handleSaveCap}
        />
        <CapControl
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-brand">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
            </svg>
          }
          label="Cycle Rate Limit"
          description="Max total per cycle"
          info="Only the contract owner (admin) can set this limit. When enabled, total agent spending is capped per cycle (e.g. 30 days). Resets automatically when the cycle expires."
          placeholder="0.1"
          enabled={isRateOn}
          value={cycleLimitValue}
          loading={txPending}
          onToggle={toggleRate}
          onSave={handleSaveCycleLimit}
        />
      </div>
    </div>
  );
}
