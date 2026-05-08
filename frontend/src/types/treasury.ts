export interface TreasuryData {
  principalWstETH: string;
  principalStETH: string;
  availableYield: string;
  totalSpent: string;
  agentAddress: string;
  ownerAddress: string;
  isPaused: boolean;
  yieldRate: number;
  lastHarvestTimestamp: number;
  nextCycleTimestamp: number;
}

export interface SubAgent {
  address: string;
  allocatedBudget: string;
  spent: string;
  status: "active" | "paused";
}

export interface AgentNode {
  address: string;
  allocatedBudget: string;
  spent: string;
  status: "active" | "paused";
  subAgents: SubAgent[];
}

export interface PermissionConfig {
  whitelist: {
    enabled: boolean;
    addresses: string[];
  };
  transactionCap: {
    enabled: boolean;
    maxAmount: string;
  };
  dailyRateLimit: {
    enabled: boolean;
    maxPerDay: string;
  };
}

export interface SpendRecord {
  id: string;
  agent: string;
  to: string;
  amount: string;
  memo: string;
  timestamp: number;
  txHash: string;
}
