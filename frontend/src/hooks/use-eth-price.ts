"use client";

import { useReadContract } from "wagmi";

const CHAINLINK_ETH_USD = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419" as const;

const aggregatorAbi = [
  {
    type: "function",
    name: "latestRoundData",
    inputs: [],
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
  },
] as const;

export function useEthPrice(): number | null {
  const { data } = useReadContract({
    address: CHAINLINK_ETH_USD,
    abi: aggregatorAbi,
    functionName: "latestRoundData",
  });

  if (!data) return null;
  const answer = data[1];
  return Number(answer) / 1e8;
}
