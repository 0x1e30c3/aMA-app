import { create } from "zustand";
import type {
  TreasuryData,
  PermissionConfig,
  SpendRecord,
  AgentNode,
} from "@/types/treasury";

type Status = "idle" | "loading" | "success" | "error";

interface TreasuryState {
  treasury: TreasuryData | null;
  permissions: PermissionConfig;
  spendHistory: SpendRecord[];
  agentTree: AgentNode | null;
  status: Status;
  error: string | null;
  setTreasury: (data: TreasuryData) => void;
  setPermissions: (config: PermissionConfig) => void;
  setSpendHistory: (records: SpendRecord[]) => void;
  setAgentTree: (tree: AgentNode) => void;
  setStatus: (status: Status) => void;
  setError: (error: string | null) => void;
}

const defaultPermissions: PermissionConfig = {
  whitelist: { enabled: false, addresses: [] },
  transactionCap: { enabled: false, maxAmount: "" },
  dailyRateLimit: { enabled: false, maxPerDay: "" },
};

export const useTreasuryStore = create<TreasuryState>((set) => ({
  treasury: null,
  permissions: defaultPermissions,
  spendHistory: [],
  agentTree: null,
  status: "idle",
  error: null,
  setTreasury: (data) => set({ treasury: data, status: "success" }),
  setPermissions: (permissions) => set({ permissions }),
  setSpendHistory: (records) => set({ spendHistory: records }),
  setAgentTree: (tree) => set({ agentTree: tree }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: "error" }),
}));
