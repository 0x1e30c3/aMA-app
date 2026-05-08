"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAccount, useDisconnect, useBalance, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { mainnet } from "wagmi/chains";

const CHAINS = [mainnet];

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function ChainIcon({ chainId }: { chainId: number }) {
  const size = "h-4 w-4";

  if (chainId === mainnet.id) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor" className={`${size} text-text-main`}>
        <path d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z" />
      </svg>
    );
  }

  return <div className={`${size} rounded-full bg-gray-400`} />;
}

function ChainSelector() {
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!chain) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border-main bg-surface px-3 py-2 text-sm font-medium text-text-main transition-colors hover:border-brand"
      >
        <ChainIcon chainId={chain.id} />
        <span>{chain.name}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`h-3.5 w-3.5 text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}>
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border-main bg-surface shadow-lg">
          {CHAINS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                switchChain({ chainId: c.id });
                setOpen(false);
              }}
              className={`flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-left text-sm transition-colors ${
                chain.id === c.id
                  ? "bg-brand-light font-medium text-brand"
                  : "text-text-main hover:bg-main-bg"
              }`}
            >
              <ChainIcon chainId={c.id} />
              <span>{c.name}</span>
              {chain.id === c.id && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="ml-auto h-4 w-4 text-brand">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { data: balance } = useBalance({ address });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!isConnected || !address) {
    return (
      <button
        type="button"
        onClick={openConnectModal}
        className="cursor-pointer rounded-lg bg-brand px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
      >
        Connect Wallet
      </button>
    );
  }

  const formattedBalance = balance
    ? `${Number.parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`
    : "";

  return (
    <div className="flex items-center gap-2">
      <ChainSelector />

      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-border-main bg-surface px-3 py-2 text-sm transition-colors hover:border-brand"
        >
          {formattedBalance && (
            <span className="font-medium text-text-main">{formattedBalance}</span>
          )}
          <span className="rounded-md bg-main-bg px-2 py-0.5 font-mono text-xs text-text-secondary">
            {truncateAddress(address)}
          </span>
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border-main bg-surface shadow-lg">
            <div className="border-b border-border-main px-4 py-3">
              <p className="text-xs text-text-secondary">Connected</p>
              <p className="mt-1 font-mono text-sm text-text-main">{truncateAddress(address)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(address);
                setOpen(false);
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-left text-sm text-text-main transition-colors hover:bg-main-bg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-text-secondary">
                <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
                <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
              </svg>
              Copy address
            </button>
            <button
              type="button"
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 border-t border-border-main px-4 py-3 text-left text-sm text-red-500 transition-colors hover:bg-main-bg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
              </svg>
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
