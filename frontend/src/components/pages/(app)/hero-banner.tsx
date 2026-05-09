"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { PiPlantFill, PiLockKeyFill, PiLockKey } from "react-icons/pi";
import { formatEther } from "viem";
import { useStETHBalance, useTreasuryRead } from "@/hooks/use-treasury";
import { useLidoApr } from "@/hooks/use-lido-apr";
import { USE_CONFIDENTIAL } from "@/config/contracts";

function formatETH(value: string): string {
  const num = Number.parseFloat(value || "0");
  if (num === 0) return "0.0000";
  if (num < 0.001) return num.toFixed(6);
  return num.toFixed(4);
}

function YieldProgress({ rate }: { rate: number }) {
  const percentage = Math.min(rate * 100, 100);

  return (
    <div className="mt-2 w-full">
      <div className="flex items-center justify-between text-xs text-white/70">
        <span>Yield accumulation</span>
        <span>{percentage.toFixed(1)}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/20">
        <div
          className="h-1.5 rounded-full bg-white transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function LiveYield({ principalWstETH }: { principalWstETH: number }) {
  const [accrued, setAccrued] = useState(0);
  const apr = useLidoApr();

  const yieldPerSecond = apr && principalWstETH > 0
    ? (principalWstETH * (apr / 100)) / (365 * 24 * 3600)
    : 0;

  useEffect(() => {
    if (yieldPerSecond <= 0) return;
    const interval = setInterval(() => setAccrued((prev) => prev + yieldPerSecond * 3), 3000);
    return () => clearInterval(interval);
  }, [yieldPerSecond]);

  const aprLabel = apr !== null ? `${apr.toFixed(2)}%` : "...";
  const yieldDisplay = accrued > 0 ? `+${accrued.toFixed(10)}` : "+0.0000000000";

  return (
    <div className="mt-2 flex items-center justify-between rounded-lg bg-white/10 px-3 py-1.5">
      <div className="flex items-center gap-1.5">
        <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white">{aprLabel}</span>
        <span className="text-[10px] text-white/50">APR</span>
      </div>
      <div className="flex items-center gap-1">
        <PiPlantFill className="h-3 w-3 text-green-400" />
        <span className="font-mono text-[10px] text-white/60">{yieldDisplay}</span>
      </div>
    </div>
  );
}

export function HeroBanner() {
  const { balance: stETHBalanceData } = useStETHBalance();
  const { principalWstETH, availableYield, totalSpentWstETH } = useTreasuryRead();

  const principal = principalWstETH.data ? formatEther(principalWstETH.data as bigint) : "0";
  const yield_ = availableYield.data ? formatEther(availableYield.data as bigint) : "0";
  const spent = totalSpentWstETH.data ? formatEther(totalSpentWstETH.data as bigint) : "0";
  const stETHBalance = stETHBalanceData.data ? formatEther(stETHBalanceData.data as bigint) : "0";
  const totalValue = Number(principal) + Number(yield_) + Number(spent);
  const yieldRate = totalValue > 0 ? Number(yield_) / totalValue : 0;

  return (
    <section className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0">
        <Image
          src="/Assets/Images/Background/aMA-bg.webp"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-brand/80 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 px-8 py-10">
        <p className="text-md font-bold text-white">Treasury Overview</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-md">
            <p className="text-xs text-white/60">stETH Balance</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-lg font-semibold text-white">{formatETH(stETHBalance)}</p>
              <div className="flex items-center gap-1">
                <Image src="/Assets/Images/Logo/stETH-logo.svg" alt="stETH" width={16} height={16} />
                <span className="text-xs font-medium text-white/80">stETH</span>
              </div>
            </div>
            <p className="mt-0.5 text-xs text-white/50">Available to wrap</p>
          </div>

          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 text-white/60"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" /></svg>
              <p className="text-xs text-white/60">Locked Principal</p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-lg font-semibold text-white">{formatETH(principal)}</p>
              <div className="flex items-center gap-1">
                <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="wstETH" className="rounded-full" width={16} height={16} />
                <span className="text-xs font-medium text-white/80">wstETH</span>
              </div>
            </div>
            <p className="mt-0.5 text-xs text-white/50">Inaccessible to agent</p>
          </div>

          <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-3 backdrop-blur-md">
            <p className="text-xs text-white/60">Spendable Yield</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-lg font-semibold text-white">{formatETH(yield_)}</p>
              <div className="flex items-center gap-1">
                <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="wstETH" className="rounded-full" width={16} height={16} />
                <span className="text-xs font-medium text-white/80">wstETH</span>
              </div>
            </div>
            <LiveYield principalWstETH={Number(principal)} />
            <YieldProgress rate={yieldRate} />
          </div>

          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-md">
            <p className="text-xs text-white/60">Total Spent</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-lg font-semibold text-white">{formatETH(spent)}</p>
              <div className="flex items-center gap-1">
                <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="wstETH" className="rounded-full" width={16} height={16} />
                <span className="text-xs font-medium text-white/80">wstETH</span>
              </div>
            </div>
            <p className="mt-0.5 text-xs text-white/50">From yield balance</p>
          </div>
        </div>
      </div>
    </section>
  );
}
