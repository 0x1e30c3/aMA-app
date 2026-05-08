"use client";

import { HiOutlinePlusCircle, HiOutlinePauseCircle, HiOutlineArrowPath, HiOutlineBellAlert } from "react-icons/hi2";

const ACTIONS = [
  {
    label: "Add Service",
    description: "Whitelist a new API or tool",
    icon: <HiOutlinePlusCircle className="h-5 w-5" />,
    variant: "primary" as const,
  },
  {
    label: "Pause All",
    description: "Stop all agent spending",
    icon: <HiOutlinePauseCircle className="h-5 w-5" />,
    variant: "secondary" as const,
  },
  {
    label: "Refresh",
    description: "Sync yield and caps",
    icon: <HiOutlineArrowPath className="h-5 w-5" />,
    variant: "secondary" as const,
  },
  {
    label: "Alerts",
    description: "Budget notifications",
    icon: <HiOutlineBellAlert className="h-5 w-5" />,
    variant: "secondary" as const,
  },
];

export function QuickActions() {
  return (
    <div>
      <h2 className="text-base font-semibold text-text-main">Quick Actions</h2>
      <div className="mt-4 space-y-2">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
              action.variant === "primary"
                ? "border-brand/20 bg-brand-light hover:border-brand"
                : "border-border-main hover:border-brand/30"
            }`}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              action.variant === "primary" ? "bg-brand text-white" : "bg-main-bg text-text-secondary"
            }`}>
              {action.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-text-main">{action.label}</p>
              <p className="text-[11px] text-text-secondary">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
