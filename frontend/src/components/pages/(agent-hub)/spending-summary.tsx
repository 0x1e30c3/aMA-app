"use client";

import Image from "next/image";
import { formatEther } from "viem";
import { useTreasuryRead } from "@/hooks/use-treasury";

function formatWstETH(value: bigint | undefined): string {
  if (value === undefined) return "0.0000";
  return Number(formatEther(value)).toFixed(4);
}

export function SpendingSummary() {
  const { principalWstETH, totalSpentWstETH, availableYield, cycleInfo } =
    useTreasuryRead();

  const isLoading =
    principalWstETH.isLoading ||
    totalSpentWstETH.isLoading ||
    availableYield.isLoading ||
    cycleInfo.isLoading;

  const principal = principalWstETH.data as bigint | undefined;
  const spent = totalSpentWstETH.data as bigint | undefined;
  const remaining = availableYield.data as bigint | undefined;

  const cycleData = cycleInfo.data as
    | [bigint, bigint, bigint, bigint]
    | undefined;
  const cycleSpent = cycleData?.[1];
  const cycleLimit = cycleData?.[2];

  const principalNum = principal ? Number(formatEther(principal)) : 0;
  const spentNum = spent ? Number(formatEther(spent)) : 0;
  const remainingNum = remaining ? Number(formatEther(remaining)) : 0;

  const totalBudget = principalNum + remainingNum + spentNum;
  const pctUsed = totalBudget > 0 ? ((spentNum / totalBudget) * 100).toFixed(0) : "0";

  const cycleSpentNum = cycleSpent ? Number(formatEther(cycleSpent)) : 0;
  const cycleLimitNum = cycleLimit ? Number(formatEther(cycleLimit)) : 0;
  const cyclePct =
    cycleLimitNum > 0
      ? ((cycleSpentNum / cycleLimitNum) * 100).toFixed(0)
      : "0";

  if (isLoading) {
    return (
      <div>
        <h2 className="text-base font-semibold text-text-main">
          Monthly Spending
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Budget usage this cycle
        </p>
        <div className="mt-5 flex items-center justify-center py-10">
          <p className="text-sm text-text-secondary">Loading spending data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-text-main">
        Monthly Spending
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Budget usage this cycle
      </p>

      <div className="mt-5 grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-main-bg p-4">
          <p className="text-[11px] uppercase tracking-wider text-text-secondary">
            Principal
          </p>
          <p className="mt-1 flex items-center gap-1 text-lg font-semibold text-text-main">
            {formatWstETH(principal)}
            <Image
              src="/Assets/Images/Logo/wstETH-logo.png"
              alt="wstETH"
              className="rounded-full"
              width={14}
              height={14}
            />
          </p>
        </div>
        <div className="rounded-xl bg-brand-light p-4">
          <p className="text-[11px] uppercase tracking-wider text-text-secondary">
            Total Spent
          </p>
          <p className="mt-1 flex items-center gap-1 text-lg font-semibold text-brand">
            {formatWstETH(spent)}
            <Image
              src="/Assets/Images/Logo/wstETH-logo.png"
              alt="wstETH"
              className="rounded-full"
              width={14}
              height={14}
            />
          </p>
        </div>
        <div className="rounded-xl bg-main-bg p-4">
          <p className="text-[11px] uppercase tracking-wider text-text-secondary">
            Available Yield
          </p>
          <p className="mt-1 flex items-center gap-1 text-lg font-semibold text-text-main">
            {formatWstETH(remaining)}
            <Image
              src="/Assets/Images/Logo/wstETH-logo.png"
              alt="wstETH"
              className="rounded-full"
              width={14}
              height={14}
            />
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Overall usage</span>
          <span>{pctUsed}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full rounded-full bg-border-main">
          <div
            className="h-2 rounded-full bg-brand transition-all"
            style={{ width: `${pctUsed}%` }}
          />
        </div>
      </div>

      {cycleLimitNum > 0 && (
        <div className="mt-5 rounded-xl border border-border-main p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-main">Cycle Limit</p>
            <p className="text-xs text-text-secondary">
              {cycleSpentNum.toFixed(4)} / {cycleLimitNum.toFixed(4)} wstETH
            </p>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-border-main">
            <div
              className={`h-1.5 rounded-full transition-all ${
                Number(cyclePct) > 80 ? "bg-amber-500" : "bg-brand"
              }`}
              style={{ width: `${cyclePct}%` }}
            />
          </div>
          <p className="mt-1.5 text-right text-[10px] text-text-secondary">
            {cyclePct}% of cycle limit used
          </p>
        </div>
      )}
    </div>
  );
}
