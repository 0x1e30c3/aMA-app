"use client";

import { Header, StakePanel, HeroBanner } from "@/components/pages/(app)";

export default function AppPage() {
  return (
    <div className="min-h-screen bg-main-bg">
      <Header />
      <main className="mx-auto max-w-6xl space-y-6 px-8 pb-16 pt-3">
        <HeroBanner />
        <StakePanel />
      </main>
    </div>
  );
}
