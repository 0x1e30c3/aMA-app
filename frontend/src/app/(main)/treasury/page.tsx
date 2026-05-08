"use client";

import {
  Header,
  HeroBanner,
  AgentInfo,
  AgentTree,
  AgentActions,
  PermissionPanel,
  SpendLog,
  DashboardPanel,
} from "@/components/pages/(app)";

export default function TreasuryPage() {
  return (
    <div className="min-h-screen bg-main-bg">
      <Header />
      <main className="mx-auto max-w-6xl space-y-6 px-8 py-6">
        <HeroBanner />
        <DashboardPanel
          panels={{
            actions: <AgentActions />,
            permissions: <PermissionPanel />,
            config: <AgentInfo />,
            hierarchy: <AgentTree />,
            logs: <SpendLog />,
          }}
        />
      </main>
    </div>
  );
}
