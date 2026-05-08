import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet } from "wagmi/chains";
import { http } from "wagmi";

export const config = getDefaultConfig({
  appName: "aMA",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
  chains: [mainnet],
  transports: {
    [mainnet.id]: http("/api/rpc"),
  },
  ssr: true,
});
