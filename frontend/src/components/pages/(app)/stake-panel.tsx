"use client";

import { useState } from "react";
import Image from "next/image";
import { HiOutlineBolt, HiOutlineCube, HiOutlineChevronRight, HiOutlineInformationCircle, HiOutlineArrowTopRightOnSquare } from "react-icons/hi2";
import { AnimatePresence } from "framer-motion";
import { parseEther, formatEther } from "viem";
import { useAccount, useBalance, useWriteContract, usePublicClient } from "wagmi";
import { toast } from "sonner";
import { LIDO_STETH_ADDRESS, WSTETH_ADDRESS, AGENT_TREASURY_ADDRESS, erc20Abi, wstETHAbi, agentTreasuryConfig } from "@/config/contracts";
import { useStETHBalance } from "@/hooks/use-treasury";
import { useStEthPerToken } from "@/hooks/use-lido";
import { useLidoApr } from "@/hooks/use-lido-apr";
import { useEthPrice } from "@/hooks/use-eth-price";
import { InfoModal, StakeSuccessPopup, WrapSuccessPopup, WrapStepperPopup, type WrapStatus } from "./stake-modals";

type Mode = "stake" | "wrap";

const LIDO_ABI = [{ type: "function", name: "submit", inputs: [{ name: "_referral", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "payable" }] as const;
const ETH_ICON = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor" className="h-3 w-3 text-text-main"><path d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z" /></svg>;

function EtherscanLink({ address, label }: { address: string; label: string }) {
  return (
    <a href={`https://etherscan.io/address/${address}`} target="_blank" rel="noopener noreferrer" className="flex cursor-pointer items-center gap-0.5 font-mono text-[10px] text-brand hover:text-brand-hover">
      {label} <HiOutlineArrowTopRightOnSquare className="h-2.5 w-2.5" />
    </a>
  );
}

function formatUsd(ethAmount: string, ethPrice: number | null): string {
  if (!ethPrice) return "~$ ...";
  const val = Number.parseFloat(ethAmount || "0") * ethPrice;
  return val < 0.01 ? `~$ ${val.toFixed(4)}` : `~$ ${val.toFixed(2)}`;
}

function StakeForm() {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "confirming">("idle");
  const [successData, setSuccessData] = useState<{ ethAmount: string; stETHAmount: string; txHash: string } | null>(null);
  const { isConnected } = useAccount();
  const ethPrice = useEthPrice();
  const { data: ethBalance } = useBalance({ address: useAccount().address ?? undefined });
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const stETHOut = amount ? (Number.parseFloat(amount) * 0.9998).toFixed(6) : "0.000000";
  const balFormatted = ethBalance ? Number.parseFloat(formatEther(ethBalance.value)).toFixed(8) : "0.00000000";

  const handleStake = async () => {
    if (!amount || Number.parseFloat(amount) <= 0 || !publicClient) return;
    try {
      setStatus("pending");
      const hash = await writeContractAsync({ address: LIDO_STETH_ADDRESS, abi: LIDO_ABI, functionName: "submit", args: ["0x0000000000000000000000000000000000000000"], value: parseEther(amount) });
      setStatus("confirming");
      await publicClient.waitForTransactionReceipt({ hash });
      setSuccessData({ ethAmount: amount, stETHAmount: stETHOut, txHash: hash });
      setStatus("idle");
      setAmount("");
    } catch (err: unknown) {
      setStatus("idle");
      toast.error(err instanceof Error ? err.message.split("\n")[0] : "Transaction failed");
    }
  };

  const handleMax = () => {
    if (!ethBalance) return;
    const max = Number.parseFloat(formatEther(ethBalance.value)) - 0.01;
    if (max > 0) setAmount(max.toFixed(6));
  };

  return (
    <>
      <div className="mt-5 rounded-xl bg-main-bg p-4">
        <div className="flex items-center justify-between">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" disabled={status !== "idle"} className="w-full bg-transparent text-3xl font-semibold text-text-main placeholder:text-text-secondary/40 focus:outline-none disabled:opacity-50" />
          <div className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor" className="h-4 w-4 text-text-main"><path d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z" /></svg>
            <span className="text-sm font-semibold text-text-main">ETH</span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
          <span>{formatUsd(amount, ethPrice)}</span>
          <div className="flex items-center gap-2">
            <span>{balFormatted}</span>
            <button type="button" onClick={handleMax} className="cursor-pointer font-semibold text-brand hover:text-brand-hover">MAX</button>
          </div>
        </div>
      </div>

      <div className="my-3 flex items-center gap-1 px-2 text-xs text-text-secondary">1 ETH = 1.0000 stETH (via Lido <Image src="/Assets/Images/Logo/lido-dao-ldo-logo.svg" alt="Lido" width={12} height={12} className="inline rounded-full" />)</div>

      <div className="rounded-xl bg-main-bg p-4">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-semibold text-text-main">{stETHOut}</span>
          <div className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5">
            <Image src="/Assets/Images/Logo/stETH-logo.svg" alt="stETH" width={16} height={16} />
            <span className="text-sm font-semibold text-text-main">stETH</span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
          <span>{formatUsd(stETHOut, ethPrice)}</span>
          <a href={`https://etherscan.io/address/${LIDO_STETH_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand hover:text-brand-hover">Lido: 0xae7a...fE84 <HiOutlineArrowTopRightOnSquare className="h-3 w-3" /></a>
        </div>
      </div>

      <div className="mt-4 space-y-2 px-1 text-xs">
        <div className="flex items-center justify-between"><span className="text-text-secondary">Contract</span><EtherscanLink address={LIDO_STETH_ADDRESS} label="0xae7a...fE84" /></div>
        <div className="flex items-center justify-between"><span className="text-text-secondary">Reward fee</span><span className="text-text-main">10%</span></div>
      </div>

      <div className="mt-5">
        <button type="button" disabled={!isConnected || !amount || Number.parseFloat(amount) <= 0 || status !== "idle"} onClick={handleStake} className="w-full cursor-pointer rounded-xl bg-brand py-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40">
          {!isConnected ? "Connect Wallet" : status === "pending" ? "Confirm in wallet..." : status === "confirming" ? "Confirming onchain..." : "Stake ETH"}
        </button>
      </div>

      <AnimatePresence>{successData && <StakeSuccessPopup data={successData} onClose={() => setSuccessData(null)} />}</AnimatePresence>
    </>
  );
}

function WrapForm() {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<WrapStatus>("idle");
  const [showStepper, setShowStepper] = useState(false);
  const ethPrice = useEthPrice();
  const [successData, setSuccessData] = useState<{ stETHAmount: string; wstETHAmount: string; txHash: string } | null>(null);
  const { isConnected } = useAccount();
  const { balance: stETHBal } = useStETHBalance();
  const { data: rateData } = useStEthPerToken();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const rate = rateData ? Number(formatEther(rateData)) : 1.1494;
  const wstETHOut = amount ? (Number.parseFloat(amount) / rate).toFixed(6) : "0.000000";
  const balFormatted = stETHBal.data ? Number.parseFloat(formatEther(stETHBal.data as bigint)).toFixed(8) : "0.00000000";

  const openStepper = () => {
    if (!amount || Number.parseFloat(amount) <= 0) return;
    setShowStepper(true);
  };

  const executeWrap = async () => {
    if (!amount || Number.parseFloat(amount) <= 0 || !publicClient) return;
    const parsed = parseEther(amount);
    try {
      setStatus("approving-steth");
      await publicClient.waitForTransactionReceipt({ hash: await writeContractAsync({ address: LIDO_STETH_ADDRESS, abi: erc20Abi, functionName: "approve", args: [WSTETH_ADDRESS, parsed] }) });

      setStatus("wrapping");
      await publicClient.waitForTransactionReceipt({ hash: await writeContractAsync({ address: WSTETH_ADDRESS, abi: wstETHAbi, functionName: "wrap", args: [parsed] }) });

      const wstETHParsed = parseEther(wstETHOut);
      setStatus("approving-wsteth");
      await publicClient.waitForTransactionReceipt({ hash: await writeContractAsync({ address: WSTETH_ADDRESS, abi: erc20Abi, functionName: "approve", args: [AGENT_TREASURY_ADDRESS, wstETHParsed] }) });

      setStatus("locking");
      const depositHash = await writeContractAsync({ ...agentTreasuryConfig, functionName: "depositWstETH", args: [wstETHParsed] });
      await publicClient.waitForTransactionReceipt({ hash: depositHash });

      setShowStepper(false);
      setSuccessData({ stETHAmount: amount, wstETHAmount: wstETHOut, txHash: depositHash });
      setStatus("idle");
      setAmount("");
    } catch (err: unknown) {
      setStatus("idle");
      setShowStepper(false);
      toast.error(err instanceof Error ? err.message.split("\n")[0] : "Transaction failed");
    }
  };

  const handleMax = () => { if (stETHBal.data) setAmount(formatEther(stETHBal.data as bigint)); };

  return (
    <>
      <div className="mt-5 rounded-xl bg-main-bg p-4">
        <div className="flex items-center justify-between">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" disabled={status !== "idle"} className="w-full bg-transparent text-3xl font-semibold text-text-main placeholder:text-text-secondary/40 focus:outline-none disabled:opacity-50" />
          <div className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5">
            <Image src="/Assets/Images/Logo/stETH-logo.svg" alt="stETH" width={16} height={16} />
            <span className="text-sm font-semibold text-text-main">stETH</span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
          <span>{formatUsd(amount, ethPrice)}</span>
          <div className="flex items-center gap-2">
            <span>{balFormatted}</span>
            <button type="button" onClick={handleMax} className="cursor-pointer font-semibold text-brand hover:text-brand-hover">MAX</button>
          </div>
        </div>
      </div>

      <div className="my-3 flex items-center justify-center gap-2 text-xs text-text-secondary">
        <Image src="/Assets/Images/Logo/stETH-logo.svg" alt="stETH" width={12} height={12} /> stETH
        <HiOutlineChevronRight className="h-3 w-3" />
        <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="wstETH" width={12} height={12} className="rounded-full" /> wstETH
        <HiOutlineChevronRight className="h-3 w-3" />
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" /></svg>
        Treasury
      </div>

      <div className="rounded-xl bg-main-bg p-4">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-semibold text-text-main">{wstETHOut}</span>
          <div className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5">
            <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="wstETH" width={16} height={16} className="rounded-full" />
            <span className="text-sm font-semibold text-text-main">wstETH</span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
          <span>{formatUsd(wstETHOut, ethPrice ? ethPrice * rate : null)}</span>
          <span>Locked as principal in treasury</span>
        </div>
      </div>

      <div className="mt-4 space-y-2 px-1 text-xs">
        <div className="flex items-center justify-between"><span className="text-text-secondary">Exchange rate</span><span className="text-text-main">1 stETH = ~{(1 / rate).toFixed(4)} wstETH</span></div>
        <div className="flex items-center justify-between"><span className="text-text-secondary">Treasury</span><EtherscanLink address={AGENT_TREASURY_ADDRESS} label="0x783e...E9Aa" /></div>
        <div className="flex items-center justify-between"><span className="text-text-secondary">Steps</span><span className="flex items-center gap-1 text-text-main">Approve <HiOutlineChevronRight className="h-2.5 w-2.5 text-text-secondary" /> Wrap <HiOutlineChevronRight className="h-2.5 w-2.5 text-text-secondary" /> Approve <HiOutlineChevronRight className="h-2.5 w-2.5 text-text-secondary" /> Lock</span></div>
      </div>

      <div className="mt-5">
        <button type="button" disabled={!isConnected || !amount || Number.parseFloat(amount) <= 0 || status !== "idle"} onClick={openStepper} className="w-full cursor-pointer rounded-xl bg-brand py-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40">
          {!isConnected ? "Connect Wallet" : "Wrap & Lock in Treasury"}
        </button>
      </div>

      <AnimatePresence>
        {showStepper && <WrapStepperPopup status={status} onStart={executeWrap} onClose={() => { if (status === "idle") setShowStepper(false); }} />}
        {successData && <WrapSuccessPopup data={successData} onClose={() => setSuccessData(null)} />}
      </AnimatePresence>
    </>
  );
}

function StepRow({ num, label, right }: { num: number; label: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-main-bg px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">{num}</span>
        <span className="text-sm text-text-main">{label}</span>
      </div>
      {right}
    </div>
  );
}

export function StakePanel() {
  const [mode, setMode] = useState<Mode>("stake");
  const [showInfo, setShowInfo] = useState(false);
  const apr = useLidoApr();
  const aprLabel = apr !== null ? `${apr.toFixed(2)}% APR` : "~3% APR";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
      <div className="rounded-2xl border border-border-main bg-surface p-6">
        <div className="flex items-center justify-between">
          <div className="flex rounded-xl bg-main-bg p-1">
            <button type="button" onClick={() => setMode("stake")} className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${mode === "stake" ? "bg-brand text-white" : "text-text-secondary hover:text-text-main"}`}>
              <HiOutlineBolt className="h-4 w-4" /> Stake
            </button>
            <button type="button" onClick={() => setMode("wrap")} className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${mode === "wrap" ? "bg-brand text-white" : "text-text-secondary hover:text-text-main"}`}>
              <HiOutlineCube className="h-4 w-4" /> Wrap
            </button>
          </div>
          <button type="button" onClick={() => setShowInfo(true)} className="cursor-pointer text-text-secondary hover:text-brand"><HiOutlineInformationCircle className="h-5 w-5" /></button>
        </div>
        {mode === "stake" ? <StakeForm /> : <WrapForm />}
      </div>

      <div className="rounded-2xl border border-border-main bg-surface">
        <div className="flex items-center gap-2 border-b border-border-main px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light">
            {mode === "stake" ? <Image src="/Assets/Images/Logo/stETH-logo.svg" alt="stETH" width={20} height={20} /> : <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="wstETH" width={20} height={20} className="rounded-full" />}
          </div>
          <div className="-ml-5 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">{ETH_ICON}</div>
          <span className="ml-1 text-lg font-semibold text-text-main">{mode === "stake" ? "ETH / stETH" : "stETH / wstETH"}</span>
        </div>

        <div className="relative aspect-video w-full overflow-hidden">
          <Image src="/Assets/Images/Background/aMA-bg.webp" alt="aMA" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-brand/1 backdrop-blur-xs" />
          <div className="absolute inset-0 bg-brand/10" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 text-xs font-medium text-gray-600 backdrop-blur-sm">
              Powered by Lido Finance <Image src="/Assets/Images/Logo/lido-dao-ldo-logo.svg" alt="Lido" width={16} height={16} />
            </span>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-base font-semibold text-text-main">{mode === "stake" ? "How Staking Works" : "How Wrapping Works"}</h3>
          <div className="mt-4 space-y-3">
            {mode === "stake" ? (
              <>
                <StepRow num={1} label="Stake ETH via Lido" right={<EtherscanLink address={LIDO_STETH_ADDRESS} label="0xae7a...fE84" />} />
                <StepRow num={2} label="Receive stETH" right={<div className="flex items-center gap-1"><span className="text-xs text-text-secondary">{aprLabel}</span><Image src="/Assets/Images/Logo/stETH-logo.svg" alt="stETH" width={14} height={14} /></div>} />
              </>
            ) : (
              <>
                <StepRow num={1} label="Approve stETH to wstETH" right={<EtherscanLink address={WSTETH_ADDRESS} label="0x7f39...2Ca0" />} />
                <StepRow num={2} label="Wrap stETH to wstETH" right={<Image src="/Assets/Images/Logo/wstETH-logo.png" alt="wstETH" width={14} height={14} className="rounded-full" />} />
                <StepRow num={3} label="Approve wstETH to Treasury" right={<EtherscanLink address={AGENT_TREASURY_ADDRESS} label="0x783e...E9Aa" />} />
                <StepRow num={4} label="Lock wstETH in Treasury" right={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-brand"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" /></svg>} />
              </>
            )}
            <div className="flex items-center justify-center">
              <div className="rounded-full border border-border-main bg-surface px-4 py-2">
                <div className="flex items-center gap-2">
                  <Image src="/Assets/Images/Logo/wstETH-logo.png" alt="wstETH" width={14} height={14} className="rounded-full" />
                  <span className="text-xs font-medium text-text-main">Lido Staking</span>
                </div>
                <p className="mt-0.5 text-center text-[10px] text-text-secondary">{aprLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>{showInfo && <InfoModal onClose={() => setShowInfo(false)} />}</AnimatePresence>
    </div>
  );
}
