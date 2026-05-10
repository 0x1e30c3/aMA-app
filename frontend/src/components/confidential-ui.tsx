"use client";

import { PiLockKeyFill, PiLockKey } from "react-icons/pi";
import { useConfidentialDemo } from "@/hooks/use-confidential-treasury";

export function ConfidentialBadge() {
  const { mode, switchMode, isDecrypting, isConnected } = useConfidentialDemo();

  if (!isConnected) return null;

  return (
    <button
      onClick={switchMode}
      disabled={isDecrypting}
      className={`
        flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium
        transition-all duration-200 hover:bg-brand-light
        ${mode === "encrypted"
          ? "bg-brand/10 text-brand border border-brand/20"
          : "bg-green-50 text-green-700 border border-green-200"
        }
      `}
    >
      {isDecrypting ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      ) : mode === "encrypted" ? (
        <>
          <PiLockKeyFill className="h-3.5 w-3.5" />
          <span>FHE Encrypted</span>
        </>
      ) : (
        <>
          <PiLockKey className="h-3.5 w-3.5" />
          <span>Decrypted</span>
        </>
      )}
    </button>
  );
}

export function EncryptedValueDisplay({ value, label }: { value?: string; label: string }) {
  const { mode } = useConfidentialDemo();

  if (!value) {
    return (
      <div className="animate-pulse">
        <div className="h-4 w-24 rounded bg-slate-200" />
      </div>
    );
  }

  if (mode === "decrypted") {
    return (
      <div className="font-mono text-sm font-semibold text-text-main">
        {value}
      </div>
    );
  }

  // Encrypted mode - show truncated handle
  return (
    <div className="flex flex-col">
      <span className="font-mono text-xs text-brand">
        {value.slice(0, 18)}...{value.slice(-8)}
      </span>
      <span className="text-[10px] text-slate-400">(encrypted)</span>
    </div>
  );
}

export function TreasuryStatus() {
  const { encryptedPrincipal, encryptedYield, encryptedSpent, decryptedValues, mode, isDecrypting } = useConfidentialDemo();

  if (isDecrypting) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <span>Decrypting onchain data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-border-main bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">Principal</span>
        <EncryptedValueDisplay value={mode === "decrypted" ? decryptedValues.principal : encryptedPrincipal} label="principal" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">Available Yield</span>
        <EncryptedValueDisplay value={mode === "decrypted" ? decryptedValues.yield : encryptedYield} label="yield" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">Total Spent</span>
        <EncryptedValueDisplay value={mode === "decrypted" ? decryptedValues.spent : encryptedSpent} label="spent" />
      </div>
    </div>
  );
}