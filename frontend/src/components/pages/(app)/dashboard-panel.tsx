"use client";

import { useState, type ReactNode } from "react";
import { HiOutlineBolt } from "react-icons/hi2";
import { HiOutlineShieldCheck } from "react-icons/hi2";
import { HiOutlineCog6Tooth } from "react-icons/hi2";
import { HiOutlineUserGroup } from "react-icons/hi2";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";

interface Tab {
  id: string;
  label: string;
  icon: ReactNode;
}

const TABS: Tab[] = [
  {
    id: "permissions",
    label: "Set Permissions",
    icon: <HiOutlineShieldCheck className="h-4 w-4" />,
  },
  {
    id: "hierarchy",
    label: "Setup Hierarchy",
    icon: <HiOutlineUserGroup className="h-4 w-4" />,
  },
  {
    id: "config",
    label: "Budget & Cycle",
    icon: <HiOutlineCog6Tooth className="h-4 w-4" />,
  },
  {
    id: "actions",
    label: "Trigger Spend",
    icon: <HiOutlineBolt className="h-4 w-4" />,
  },
  {
    id: "logs",
    label: "Spend Log",
    icon: <HiOutlineClipboardDocumentList className="h-4 w-4" />,
  },
];

interface DashboardPanelProps {
  panels: Record<string, ReactNode>;
}

export function DashboardPanel({ panels }: DashboardPanelProps) {
  const [activeTab, setActiveTab] = useState("permissions");

  return (
    <section className="overflow-hidden rounded-2xl border border-border-main bg-surface">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        <nav className="border-b border-border-main bg-main-bg p-4 lg:border-b-0 lg:border-r lg:p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Dashboard Configuration
          </p>
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand text-white"
                        : "text-text-main hover:bg-brand-light"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-border-main text-text-secondary"
                      }`}
                    >
                      {tab.icon}
                    </span>
                    <span className="hidden whitespace-nowrap lg:inline">{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-h-[400px] p-6 lg:p-8">
          {panels[activeTab]}
        </div>
      </div>
    </section>
  );
}
