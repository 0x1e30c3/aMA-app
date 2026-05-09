"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import { CONFIDENTIAL_TREASURY_ADDRESS, USE_CONFIDENTIAL } from "@/config/contracts";

const CONFIDENTIAL_ABI = [
  {
    type: "function",
    name: "principalWstETH",
    inputs: [],
    outputs: [{ name: "", type: "uint64", internalType: "euint64" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "availableYield",
    inputs: [],
    outputs: [{ name: "", type: "uint64", internalType: "euint64" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSpentWstETH",
    inputs: [],
    outputs: [{ name: "", type: "uint64", internalType: "euint64" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "encryptedBalances",
    inputs: [{ name: "arg0", type: "address" }],
    outputs: [{ name: "", type: "uint64", internalType: "euint64" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEncryptedPrincipal",
    inputs: [],
    outputs: [{ name: "", type: "uint64", internalType: "euint64" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEncryptedAvailableYield",
    inputs: [],
    outputs: [{ name: "", type: "uint64", internalType: "euint64" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "grantAccessToBalance",
    inputs: [{ name: "user", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "grantAccessToPrincipal",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "grantAccessToYield",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "depositWstETH",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "spend",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "parentAgent",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "paused",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
] as const;

export function useConfidentialTreasury() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const contractConfig = useMemo(
    () => ({
      address: CONFIDENTIAL_TREASURY_ADDRESS,
      abi: CONFIDENTIAL_ABI,
    }),
    []
  );

  // Read encrypted values
  const principalResult = useReadContract({
    ...contractConfig,
    functionName: "principalWstETH",
    query: { enabled: USE_CONFIDENTIAL && isConnected },
  });

  const yieldResult = useReadContract({
    ...contractConfig,
    functionName: "availableYield",
    query: { enabled: USE_CONFIDENTIAL && isConnected },
  });

  const spentResult = useReadContract({
    ...contractConfig,
    functionName: "totalSpentWstETH",
    query: { enabled: USE_CONFIDENTIAL && isConnected },
  });

  const ownerResult = useReadContract({
    ...contractConfig,
    functionName: "owner",
    query: { enabled: USE_CONFIDENTIAL },
  });

  const pausedResult = useReadContract({
    ...contractConfig,
    functionName: "paused",
    query: { enabled: USE_CONFIDENTIAL },
  });

  // Check if user is owner
  const isOwner = useMemo(() => {
    return ownerResult.data === address;
  }, [ownerResult.data, address]);

  return {
    // Encrypted handles (bytes32)
    encryptedPrincipal: principalResult.data,
    encryptedYield: yieldResult.data,
    encryptedSpent: spentResult.data,
    // Raw values
    owner: ownerResult.data,
    isPaused: pausedResult.data,
    isOwner,
    // Loading states
    isLoading: principalResult.isLoading || yieldResult.isLoading,
    // Contract config
    contractAddress: CONFIDENTIAL_TREASURY_ADDRESS,
    chainId,
    // Config flag
    useConfidential: USE_CONFIDENTIAL,
  };
}

export function useConfidentialDemo() {
  const { address, isConnected } = useAccount();
  const [decryptedValues, setDecryptedValues] = useState<{
    principal?: string;
    yield?: string;
    spent?: string;
  }>({});
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [mode, setMode] = useState<"encrypted" | "decrypted">("encrypted");

  const { encryptedPrincipal, encryptedYield, encryptedSpent, isOwner } =
    useConfidentialTreasury();

  const decryptValues = useCallback(async () => {
    if (!encryptedPrincipal || !encryptedYield || !encryptedSpent) return;

    setIsDecrypting(true);

    // Simulate decryption delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In real implementation, this would use @zama-fhe/react-sdk
    // For demo, we show the handles are different from actual values
    setDecryptedValues({
      principal: "1.5 wstETH",
      yield: "0.025 wstETH",
      spent: "0.001 wstETH",
    });

    setMode("decrypted");
    setIsDecrypting(false);
  }, [encryptedPrincipal, encryptedYield, encryptedSpent]);

  const switchMode = useCallback(() => {
    if (mode === "encrypted") {
      decryptValues();
    } else {
      setMode("encrypted");
      setDecryptedValues({});
    }
  }, [mode, decryptValues]);

  return {
    encryptedPrincipal,
    encryptedYield,
    encryptedSpent,
    decryptedValues,
    isDecrypting,
    mode,
    switchMode,
    isOwner,
    isConnected,
  };
}