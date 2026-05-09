"use client";

import { PiLockKeyFill } from "react-icons/pi";
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
        transition-all duration-200 hover:scale-105
        ${mode === "encrypted"
          ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
          : "bg-green-600/20 text-green-300 border border-green-500/30"
        }
      `}
    >
      {mode === "encrypted" ? (
        <>
          <PiLockKeyFill className="h-3.5 w-3.5" />
          <span>FHE Encrypted</span>
          <span className="ml-1 rounded bg-purple-500/30 px-1.5 py-0.5 text-[10px]">
            Click to decrypt
          </span>
        </>
      ) : (
        <>
          <PiLockKeyFill className="h-3.5 w-3.5" />
          <span>FHE Decrypted</span>
          <span className="ml-1 rounded bg-green-500/30 px-1.5 py-0.5 text-[10px]">
            Click to lock
          </span>
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
        <div className="h-4 w-24 rounded bg-white/10" />
      </div>
    );
  }

  if (mode === "decrypted") {
    return (
      <div className="font-mono text-sm font-semibold text-green-400">
        {value}
      </div>
    );
  }

  // Encrypted mode - show truncated handle
  return (
    <div className="flex flex-col">
      <span className="font-mono text-xs text-purple-400">
        {value.slice(0, 18)}...{value.slice(-8)}
      </span>
      <span className="text-[10px] text-white/40">(encrypted)</span>
    </div>
  );
}

export function TreasuryStatus() {
  const { encryptedPrincipal, encryptedYield, encryptedSpent, decryptedValues, mode, isDecrypting } = useConfidentialDemo();

  if (isDecrypting) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-purple-600/20 px-3 py-2 text-sm text-purple-300">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
        <span>Decrypting onchain data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg bg-white/5 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/60">Principal (Encrypted)</span>
        <EncryptedValueDisplay value={mode === "decrypted" ? decryptedValues.principal : encryptedPrincipal} label="principal" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/60">Yield (Encrypted)</span>
        <EncryptedValueDisplay value={mode === "decrypted" ? decryptedValues.yield : encryptedYield} label="yield" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/60">Spent (Encrypted)</span>
        <EncryptedValueDisplay value={mode === "decrypted" ? decryptedValues.spent : encryptedSpent} label="spent" />
      </div>
    </div>
  );
}