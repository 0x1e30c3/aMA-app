"use client";

import { useReadContract, useWriteContract, useAccount } from "wagmi";
import {
  agentTreasuryConfig,
  erc20Abi,
  wstETHAbi,
  LIDO_STETH_ADDRESS,
  WSTETH_ADDRESS,
  AGENT_TREASURY_ADDRESS,
} from "@/config/contracts";

export function useTreasuryRead() {
  const principalWstETH = useReadContract({
    ...agentTreasuryConfig,
    functionName: "principalWstETH",
  });

  const initialStETHValue = useReadContract({
    ...agentTreasuryConfig,
    functionName: "initialStETHValue",
  });

  const availableYield = useReadContract({
    ...agentTreasuryConfig,
    functionName: "getAvailableYield",
  });

  const currentValue = useReadContract({
    ...agentTreasuryConfig,
    functionName: "getCurrentValue",
  });

  const totalSpentWstETH = useReadContract({
    ...agentTreasuryConfig,
    functionName: "totalSpentWstETH",
  });

  const paused = useReadContract({
    ...agentTreasuryConfig,
    functionName: "paused",
  });

  const owner = useReadContract({
    ...agentTreasuryConfig,
    functionName: "owner",
  });

  const parentAgent = useReadContract({
    ...agentTreasuryConfig,
    functionName: "parentAgent",
  });

  const subAgents = useReadContract({
    ...agentTreasuryConfig,
    functionName: "getSubAgents",
  });

  const cycleInfo = useReadContract({
    ...agentTreasuryConfig,
    functionName: "getCycleInfo",
  });

  const whitelistEnabled = useReadContract({
    ...agentTreasuryConfig,
    functionName: "whitelistEnabled",
  });

  const capEnabled = useReadContract({
    ...agentTreasuryConfig,
    functionName: "capEnabled",
  });

  const perTxCap = useReadContract({
    ...agentTreasuryConfig,
    functionName: "perTxCap",
  });

  const rateLimitEnabled = useReadContract({
    ...agentTreasuryConfig,
    functionName: "rateLimitEnabled",
  });

  return {
    principalWstETH,
    initialStETHValue,
    availableYield,
    currentValue,
    totalSpentWstETH,
    paused,
    owner,
    parentAgent,
    subAgents,
    cycleInfo,
    whitelistEnabled,
    capEnabled,
    perTxCap,
    rateLimitEnabled,
  };
}

export function useStETHBalance() {
  const { address } = useAccount();

  const balance = useReadContract({
    address: LIDO_STETH_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const allowance = useReadContract({
    address: LIDO_STETH_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, AGENT_TREASURY_ADDRESS] : undefined,
  });

  return { balance, allowance };
}

export function useWstETHBalance() {
  const { address } = useAccount();

  const balance = useReadContract({
    address: WSTETH_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const allowance = useReadContract({
    address: WSTETH_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, AGENT_TREASURY_ADDRESS] : undefined,
  });

  return { balance, allowance };
}

export function useWstETHRate() {
  const stEthPerToken = useReadContract({
    address: WSTETH_ADDRESS,
    abi: wstETHAbi,
    functionName: "stEthPerToken",
  });

  return { stEthPerToken };
}

export function useApproveStETH() {
  const { writeContract, ...rest } = useWriteContract();

  const approve = (amount: bigint) => {
    writeContract({
      address: LIDO_STETH_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [AGENT_TREASURY_ADDRESS, amount],
    });
  };

  return { approve, ...rest };
}

export function useApproveWstETH() {
  const { writeContract, ...rest } = useWriteContract();

  const approve = (amount: bigint) => {
    writeContract({
      address: WSTETH_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [AGENT_TREASURY_ADDRESS, amount],
    });
  };

  return { approve, ...rest };
}

export function useDepositETH() {
  const { writeContract, ...rest } = useWriteContract();

  const depositETH = (value: bigint) => {
    writeContract({
      ...agentTreasuryConfig,
      functionName: "depositETH",
      value,
    });
  };

  return { depositETH, ...rest };
}

export function useDepositStETH() {
  const { writeContract, ...rest } = useWriteContract();

  const depositStETH = (amount: bigint) => {
    writeContract({
      ...agentTreasuryConfig,
      functionName: "depositStETH",
      args: [amount],
    });
  };

  return { depositStETH, ...rest };
}

export function useDepositWstETH() {
  const { writeContract, ...rest } = useWriteContract();

  const depositWstETH = (amount: bigint) => {
    writeContract({
      ...agentTreasuryConfig,
      functionName: "depositWstETH",
      args: [amount],
    });
  };

  return { depositWstETH, ...rest };
}

export function useWithdrawPrincipal() {
  const { writeContract, ...rest } = useWriteContract();

  const withdrawPrincipal = (amount: bigint) => {
    writeContract({
      ...agentTreasuryConfig,
      functionName: "withdrawPrincipal",
      args: [amount],
    });
  };

  return { withdrawPrincipal, ...rest };
}

export function useSpend() {
  const { writeContract, ...rest } = useWriteContract();

  const spend = (to: `0x${string}`, amount: bigint) => {
    writeContract({
      ...agentTreasuryConfig,
      functionName: "spend",
      args: [to, amount],
    });
  };

  return { spend, ...rest };
}

export function useTreasuryAdmin() {
  const { writeContract, ...rest } = useWriteContract();

  const setParentAgent = (agent: `0x${string}`) => {
    writeContract({ ...agentTreasuryConfig, functionName: "setParentAgent", args: [agent] });
  };

  const addSubAgent = (agent: `0x${string}`, budgetCap: bigint) => {
    writeContract({ ...agentTreasuryConfig, functionName: "addSubAgent", args: [agent, budgetCap] });
  };

  const pauseSubAgent = (agent: `0x${string}`) => {
    writeContract({ ...agentTreasuryConfig, functionName: "pauseSubAgent", args: [agent] });
  };

  const resumeSubAgent = (agent: `0x${string}`) => {
    writeContract({ ...agentTreasuryConfig, functionName: "resumeSubAgent", args: [agent] });
  };

  const setWhitelistEnabled = (enabled: boolean) => {
    writeContract({ ...agentTreasuryConfig, functionName: "setWhitelistEnabled", args: [enabled] });
  };

  const setWhitelist = (addr: `0x${string}`, allowed: boolean) => {
    writeContract({ ...agentTreasuryConfig, functionName: "setWhitelist", args: [addr, allowed] });
  };

  const setCapEnabled = (enabled: boolean) => {
    writeContract({ ...agentTreasuryConfig, functionName: "setCapEnabled", args: [enabled] });
  };

  const setPerTxCap = (maxWstETH: bigint) => {
    writeContract({ ...agentTreasuryConfig, functionName: "setPerTxCap", args: [maxWstETH] });
  };

  const setRateLimitEnabled = (enabled: boolean) => {
    writeContract({ ...agentTreasuryConfig, functionName: "setRateLimitEnabled", args: [enabled] });
  };

  const setCycleLimit = (maxWstETH: bigint) => {
    writeContract({ ...agentTreasuryConfig, functionName: "setCycleLimit", args: [maxWstETH] });
  };

  const pauseTreasury = () => {
    writeContract({ ...agentTreasuryConfig, functionName: "pause" });
  };

  const unpauseTreasury = () => {
    writeContract({ ...agentTreasuryConfig, functionName: "unpause" });
  };

  return {
    setParentAgent,
    addSubAgent,
    pauseSubAgent,
    resumeSubAgent,
    setWhitelistEnabled,
    setWhitelist,
    setCapEnabled,
    setPerTxCap,
    setRateLimitEnabled,
    setCycleLimit,
    pauseTreasury,
    unpauseTreasury,
    ...rest,
  };
}
