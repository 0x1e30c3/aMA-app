"use client";

import type React from "react";
import Image from "next/image";
import { HiOutlineBolt, HiOutlineCube, HiOutlineXMark, HiOutlineChevronRight, HiOutlineArrowTopRightOnSquare, HiOutlineCheckCircle } from "react-icons/hi2";
import { motion } from "framer-motion";
import { LIDO_STETH_ADDRESS, AGENT_TREASURY_ADDRESS } from "@/config/contracts";

const FADE_IN = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } };
const SLIDE_IN = { initial: { opacity: 0, scale: 0.96, y: 12 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.96, y: 12 }, transition: { duration: 0.25, ease: "easeOut" as const } };

export function InfoModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div {...FADE_IN} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <motion.div {...SLIDE_IN} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border-main bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-main">Stake & Wrap</h3>
          <button type="button" onClick={onClose} className="cursor-pointer text-text-secondary hover:text-text-main"><HiOutlineXMark className="h-5 w-5" /></button>
        </div>
        <div className="mt-5 space-y-4">
          <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border-main p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white"><HiOutlineBolt className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold text-text-main">Stake ETH</p>
                <p className="text-xs text-text-secondary">Calls Lido submit() directly on mainnet</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-text-secondary">
              <li className="flex items-center gap-2"><span className="text-brand">1.</span> Send ETH to Lido contract</li>
              <li className="flex items-center gap-2"><span className="text-brand">2.</span> Receive <Image src="/Assets/Images/Logo/stETH-logo.svg" alt="stETH" width={12} height={12} /> stETH 1:1</li>
              <li className="flex items-center gap-2"><span className="text-brand">3.</span> stETH earns ~3.5% APY automatically</li>
            </ul>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border-main p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white"><HiOutlineCube className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold text-text-main">Wrap & Lock</p>
                <p className="text-xs text-text-secondary">Wrap stETH to wstETH and lock in treasury</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-text-secondary">
              <li className="flex items-center gap-2"><span className="text-brand">1.</span> Approve stETH to wstETH contract</li>
              <li className="flex items-center gap-2"><span className="text-brand">2.</span> Wrap to <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="wstETH" width={12} height={12} className="rounded-full" /> wstETH</li>
              <li className="flex items-center gap-2"><span className="text-brand">3.</span> Lock wstETH as principal in Treasury</li>
            </ul>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center text-[11px] text-text-secondary">
            All transactions interact directly with Lido on Ethereum Mainnet.
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function StakeSuccessPopup({ data, onClose }: { data: { ethAmount: string; stETHAmount: string; txHash: string }; onClose: () => void }) {
  const hash = `${data.txHash.slice(0, 10)}...${data.txHash.slice(-8)}`;
  return (
    <motion.div {...FADE_IN} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <motion.div {...SLIDE_IN} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-border-main bg-surface p-6 shadow-xl">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light"><HiOutlineCheckCircle className="h-7 w-7 text-brand" /></div>
          <h3 className="mt-4 text-lg font-semibold text-text-main">Stake Successful</h3>
        </div>
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-main-bg px-4 py-3">
            <div className="flex items-center gap-2">
              <Image src="/Assets/Images/Logo/eth-logo.svg" alt="ETH" width={20} height={20} className="rounded-full" />
              <div><p className="text-xs text-text-secondary">Sent</p><p className="text-sm font-semibold text-text-main">{data.ethAmount} ETH</p></div>
            </div>
            <HiOutlineChevronRight className="h-4 w-4 text-text-secondary" />
            <div className="flex items-center gap-2">
              <div className="text-right"><p className="text-xs text-text-secondary">Received</p><p className="text-sm font-semibold text-brand">{data.stETHAmount} stETH</p></div>
              <Image src="/Assets/Images/Logo/stETH-logo.svg" alt="stETH" width={20} height={20} />
            </div>
          </div>
          <div className="space-y-2 rounded-xl border border-border-main px-4 py-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Tx hash</span>
              <a href={`https://etherscan.io/tx/${data.txHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-mono text-brand hover:text-brand-hover">{hash} <HiOutlineArrowTopRightOnSquare className="h-3 w-3" /></a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Contract</span>
              <a href={`https://etherscan.io/address/${LIDO_STETH_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-mono text-brand hover:text-brand-hover"><Image src="/Assets/Images/Logo/lido-dao-ldo-logo.svg" alt="Lido" width={14} height={14} className="rounded-full" /> Lido stETH <HiOutlineArrowTopRightOnSquare className="h-3 w-3" /></a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Network</span>
              <span className="flex items-center gap-1.5 text-text-main"><Image src="/Assets/Images/Logo/eth-logo.svg" alt="ETH" width={14} height={14} className="rounded-full" /> Ethereum Mainnet</span>
            </div>
          </div>
        </div>
        <button type="button" onClick={onClose} className="mt-5 w-full cursor-pointer rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-hover">Done</button>
      </motion.div>
    </motion.div>
  );
}

export function WrapSuccessPopup({ data, onClose }: { data: { stETHAmount: string; wstETHAmount: string; txHash: string }; onClose: () => void }) {
  const hash = `${data.txHash.slice(0, 10)}...${data.txHash.slice(-8)}`;
  return (
    <motion.div {...FADE_IN} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <motion.div {...SLIDE_IN} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-border-main bg-surface p-6 shadow-xl">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light"><HiOutlineCheckCircle className="h-7 w-7 text-brand" /></div>
          <h3 className="mt-4 text-lg font-semibold text-text-main">Wrapped & Locked</h3>
        </div>
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-main-bg px-4 py-3">
            <div className="flex items-center gap-2">
              <Image src="/Assets/Images/Logo/stETH-logo.svg" alt="stETH" width={20} height={20} />
              <div><p className="text-xs text-text-secondary">Wrapped</p><p className="text-sm font-semibold text-text-main">{data.stETHAmount} stETH</p></div>
            </div>
            <HiOutlineChevronRight className="h-4 w-4 text-text-secondary" />
            <div className="flex items-center gap-2">
              <div className="text-right"><p className="text-xs text-text-secondary">Locked</p><p className="text-sm font-semibold text-brand">{data.wstETHAmount} wstETH</p></div>
              <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="wstETH" width={20} height={20} className="rounded-full" />
            </div>
          </div>
          <div className="space-y-2 rounded-xl border border-border-main px-4 py-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Tx hash</span>
              <a href={`https://etherscan.io/tx/${data.txHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-mono text-brand hover:text-brand-hover">{hash} <HiOutlineArrowTopRightOnSquare className="h-3 w-3" /></a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Contract</span>
              <a href={`https://etherscan.io/address/${AGENT_TREASURY_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-mono text-brand hover:text-brand-hover"><Image src="/Assets/Images/Logo/lido-dao-ldo-logo.svg" alt="Lido" width={14} height={14} className="rounded-full" /> AgentTreasury <HiOutlineArrowTopRightOnSquare className="h-3 w-3" /></a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Network</span>
              <span className="flex items-center gap-1.5 text-text-main"><Image src="/Assets/Images/Logo/eth-logo.svg" alt="ETH" width={14} height={14} className="rounded-full" /> Ethereum Mainnet</span>
            </div>
          </div>
        </div>
        <button type="button" onClick={onClose} className="mt-5 w-full cursor-pointer rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-hover">Done</button>
      </motion.div>
    </motion.div>
  );
}

export type WrapStatus = "idle" | "approving-steth" | "wrapping" | "approving-wsteth" | "locking";

const WRAP_STEPS: { id: WrapStatus; label: string; desc: React.ReactNode; logo: string; rounded?: boolean }[] = [
  { id: "approving-steth", label: "Approve stETH", logo: "/Assets/Images/Logo/stETH-logo.svg", desc: <>Allow <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="" width={12} height={12} className="inline rounded-full" /> wstETH contract to use your <Image src="/Assets/Images/Logo/stETH-logo.svg" alt="" width={12} height={12} className="inline" /> stETH</> },
  { id: "wrapping", label: "Wrap to wstETH", logo: "/Assets/Images/Logo/wstETH-logo.png", rounded: true, desc: <>Convert <Image src="/Assets/Images/Logo/stETH-logo.svg" alt="" width={12} height={12} className="inline" /> stETH to <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="" width={12} height={12} className="inline rounded-full" /> wstETH via <Image src="/Assets/Images/Logo/lido-dao-ldo-logo.svg" alt="" width={12} height={12} className="inline rounded-full" /> Lido</> },
  { id: "approving-wsteth", label: "Approve wstETH", logo: "/Assets/Images/Logo/wstETH-logo.png", rounded: true, desc: <>Allow Treasury to use your <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="" width={12} height={12} className="inline rounded-full" /> wstETH</> },
  { id: "locking", label: "Lock in Treasury", logo: "/Assets/Images/Logo/wstETH-logo.png", rounded: true, desc: <>Deposit <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="" width={12} height={12} className="inline rounded-full" /> wstETH as locked principal</> },
];

export function WrapStepperPopup({ status, onStart, onClose }: { status: WrapStatus; onStart: () => void; onClose: () => void }) {
  const order: WrapStatus[] = ["approving-steth", "wrapping", "approving-wsteth", "locking"];
  const idx = order.indexOf(status);
  const isPreview = status === "idle";

  return (
    <motion.div {...FADE_IN} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <motion.div {...SLIDE_IN} className="w-full max-w-sm rounded-2xl border border-border-main bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-main">Wrapping & Locking</h3>
            <p className="mt-1 text-sm text-text-secondary">{isPreview ? "Review the steps below, then start" : "Confirm each transaction in your wallet"}</p>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer text-text-secondary hover:text-text-main"><HiOutlineXMark className="h-5 w-5" /></button>
        </div>
        <div className="mt-6">
          {WRAP_STEPS.map((step, i) => {
            const active = step.id === status;
            const done = idx > i && !isPreview;
            return (
              <div key={step.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${done ? "bg-brand text-white" : active ? "border-2 border-brand bg-brand-light text-brand" : "border-2 border-border-main text-text-secondary"}`}>
                    {done ? <HiOutlineCheckCircle className="h-5 w-5" /> : active ? <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand" /> : <span className="text-xs font-semibold">{i + 1}</span>}
                  </div>
                  {i < 3 && <div className={`h-6 w-0.5 ${done ? "bg-brand" : "bg-border-main"}`} />}
                </div>
                <div className="pb-6">
                  <p className={`flex items-center gap-1.5 text-sm font-medium ${active ? "text-brand" : done ? "text-text-main" : "text-text-secondary"}`}>
                    {step.label}
                    {/* <Image src={step.logo} alt="" width={14} height={14} className={step.rounded ? "rounded-full" : ""} /> */}
                  </p>
                  <p className="flex flex-wrap items-center gap-1 text-xs text-text-secondary">{step.desc}</p>
                  {active && !isPreview && <p className="mt-1 text-xs font-medium text-brand">Waiting for confirmation...</p>}
                </div>
              </div>
            );
          })}
        </div>
        {isPreview && (
          <button type="button" onClick={onStart} className="w-full cursor-pointer rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-hover">
            Start Wrapping
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
