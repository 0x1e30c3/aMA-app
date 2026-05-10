"use client";

import { Header, StakePanel, HeroBanner } from "@/components/pages/(app)";
import { ConfidentialBadge, TreasuryStatus } from "@/components/confidential-ui";
import { USE_CONFIDENTIAL } from "@/config/contracts";
import { PiLockKeyFill } from "react-icons/pi";

export default function AppPage() {
  return (
    <div className="min-h-screen bg-main-bg">
      <Header />
      <main className="mx-auto max-w-6xl space-y-6 px-8 pb-16 pt-3">
        {USE_CONFIDENTIAL && (
          <div className="flex items-center justify-between rounded-xl border border-brand/20 bg-brand/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
                <PiLockKeyFill className="h-5 w-5 text-brand" />
              </div>
              <div>
                <h3 className="font-semibold text-text-main">Confidential Mode</h3>
                <p className="text-xs text-slate-500">
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
