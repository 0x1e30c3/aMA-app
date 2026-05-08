"use client";

import { Header } from "@/components/pages/(app)";
import {
  SpendingSummary,
  ActiveServices,
  ActivityFeed,
  AiChat,
} from "@/components/pages/(agent-hub)";

export default function AgentHubPage() {
  return (
    <div className="min-h-screen bg-main-bg">
      <Header />
      <main className="mx-auto max-w-6xl px-8 pb-16 pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-main">Agent Hub</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Chat with AI, manage services, and control how your agent spends yield
          </p>
        </div>

        <div className="rounded-2xl border border-border-main bg-surface p-6">
          <AiChat />
        </div>

        <div className="mt-6">
          <div className="rounded-2xl border border-border-main bg-surface p-6">
            <SpendingSummary />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border-main bg-surface p-6">
            <ActiveServices />
          </div>
          <div className="rounded-2xl border border-border-main bg-surface p-6">
            <ActivityFeed />
          </div>
        </div>
      </main>
    </div>
  );
}
