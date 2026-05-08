"use client";

import { useReadContract } from "wagmi";
import { wstETHAbi, WSTETH_ADDRESS } from "@/config/contracts";

export function useWstETHConversion(wstETHAmount?: bigint) {
  const stETHValue = useReadContract({
    address: WSTETH_ADDRESS,
    abi: wstETHAbi,
    functionName: "getStETHByWstETH",
    args: wstETHAmount ? [wstETHAmount] : undefined,
  });

  return stETHValue;
}

export function useStETHToWstETH(stETHAmount?: bigint) {
  const wstETHValue = useReadContract({
    address: WSTETH_ADDRESS,
    abi: wstETHAbi,
    functionName: "getWstETHByStETH",
    args: stETHAmount ? [stETHAmount] : undefined,
  });

  return wstETHValue;
}

export function useStEthPerToken() {
  const rate = useReadContract({
    address: WSTETH_ADDRESS,
    abi: wstETHAbi,
    functionName: "stEthPerToken",
  });

  return rate;
}
