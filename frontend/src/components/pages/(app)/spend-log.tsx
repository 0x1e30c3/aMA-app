"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { formatEther } from "viem";
import { useTreasuryRead } from "@/hooks/use-treasury";

interface SpendEntry {
  id: string;
  type: string;
  model: string;
  modelName: string;
  cost: string;
  timestamp: number;
  preview: string;
}

const MODEL_LOGOS: Record<string, string> = {
  claude: "/Assets/Images/Logo/claude-logo.png",
  chatgpt: "/Assets/Images/Logo/chatgpt-logo.webp",
  gemini: "/Assets/Images/Logo/gemini-logo.jpeg",
  perplexity: "/Assets/Images/Logo/perplexity-logo.png",
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function SpendLog() {
  const { totalSpentWstETH } = useTreasuryRead();
  const [entries, setEntries] = useState<SpendEntry[]>([]);
  const [filter, setFilter] = useState("");

  const totalSpent = totalSpentWstETH.data
    ? Number.parseFloat(formatEther(totalSpentWstETH.data as bigint)).toFixed(6)
    : "0.000000";

  useEffect(() => {
    try {
      setEntries(JSON.parse(localStorage.getItem("aMA-activity") || "[]"));
    } catch { }
  }, []);

  const filtered = filter
    ? entries.filter((e) => e.modelName.toLowerCase().includes(filter.toLowerCase()))
    : entries;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-main">Spend Log</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-text-secondary">
            Onchain spent: <span className="font-medium text-text-main">{totalSpent}</span>
            <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="wstETH" width={14} height={14} className="rounded-full" /> wstETH
          </p>
        </div>
        {entries.length > 0 && (
          <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by model" className="w-44 rounded-xl border border-border-main bg-main-bg px-3 py-2 text-sm text-text-main placeholder:text-text-secondary/50 focus:border-brand focus:outline-none" />
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border-main">
          <p className="text-sm text-text-secondary">{entries.length === 0 ? "No spend activity yet" : "No matches"}</p>
          <p className="mt-1 text-xs text-text-secondary">AI chat requests will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded-xl border border-border-main px-5 py-4">
              <div className="flex items-center gap-3">
                <Image src={MODEL_LOGOS[entry.model] ?? ""} alt={entry.modelName} width={32} height={32} className="shrink-0 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-medium text-text-main">{entry.modelName}</p>
                  <p className="max-w-xs truncate text-xs text-text-secondary">{entry.preview}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="flex items-center gap-1 text-sm font-medium text-text-main">
                  {entry.cost} <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="wstETH" width={14} height={14} className="rounded-full" /> wstETH
                </p>
                <p className="text-xs text-text-secondary">{formatTime(entry.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
