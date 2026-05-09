"use client";

import { Header, StakePanel, HeroBanner } from "@/components/pages/(app)";
import { ConfidentialBadge, TreasuryStatus } from "@/components/confidential-ui";
import { USE_CONFIDENTIAL } from "@/config/contracts";

export default function AppPage() {
  return (
    <div className="min-h-screen bg-main-bg">
      <Header />
      <main className="mx-auto max-w-6xl space-y-6 px-8 pb-16 pt-3">
        {USE_CONFIDENTIAL && (
          <div className="flex items-center justify-between rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
                <span className="text-xl">🔐</span>
              </div>
              <div>
                <h3 className="font-semibold text-purple-300">Confidential Mode</h3>
                <p className="text-xs text-white/50">
                  Powered by Zama Protocol — All values encrypted onchain
                </p>
              </div>
            </div>
            <ConfidentialBadge />
          </div>
        )}
        <HeroBanner />
        {USE_CONFIDENTIAL && <TreasuryStatus />}
        <StakePanel />
      </main>
    </div>
  );
}
