"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Activity {
  id: string;
  type: string;
  model: string;
  modelName: string;
  cost: string;
  txHash?: string;
  timestamp: number;
  preview: string;
}

const MODEL_LOGOS: Record<string, string> = {
  claude: "/Assets/Images/Logo/claude-logo.png",
  chatgpt: "/Assets/Images/Logo/chatgpt-logo.webp",
  gemini: "/Assets/Images/Logo/gemini-logo.jpeg",
  perplexity: "/Assets/Images/Logo/perplexity-logo.png",
};

function formatTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("aMA-activity") || "[]");
      setActivities(stored);
    } catch { }

    const handleStorage = () => {
      try {
        setActivities(JSON.parse(localStorage.getItem("aMA-activity") || "[]"));
      } catch { }
    };
    window.addEventListener("storage", handleStorage);
    const interval = setInterval(handleStorage, 3000);
    return () => { window.removeEventListener("storage", handleStorage); clearInterval(interval); };
  }, []);

  return (
    <div>
      <h2 className="text-base font-semibold text-text-main">Activity Feed</h2>
      <p className="mt-1 text-sm text-text-secondary">Recent AI chat requests</p>
      {activities.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border-main py-12">
          <p className="text-sm text-text-secondary">No activity yet</p>
          <p className="mt-1 text-xs text-text-secondary">Chat with AI to see activity here</p>
        </div>
      ) : (
        <div className="mt-4 space-y-1">
          {activities.slice(0, 20).map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-main-bg">
              <Image src={MODEL_LOGOS[a.model] ?? ""} alt={a.modelName} width={24} height={24} className="shrink-0 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-text-main">{a.modelName}</p>
                <p className="truncate text-[11px] text-text-secondary">{a.preview}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="flex items-center gap-1 text-xs font-medium text-text-main">
                  {a.cost}
                  <Image
                    src="/Assets/Images/Logo/wstETH-logo.png"
                    alt="wstETH"
                    width={10}
                    height={10}
                    className="rounded-full"
                  />
                </p>
                <p className="text-[10px] text-text-secondary">
                  {formatTime(a.timestamp)}
                </p>
                {a.txHash && (
                  <span className="rounded-full bg-brand-light px-1.5 py-0.5 text-[9px] font-semibold text-brand">
                    verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
