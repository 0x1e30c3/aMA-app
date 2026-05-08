"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { formatEther } from "viem";
import { useReadContract } from "wagmi";
import {
  HiOutlinePaperAirplane,
  HiOutlineUserCircle,
  HiOutlineCpuChip,
  HiOutlineChevronDown,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";
import { useTreasuryRead } from "@/hooks/use-treasury";
import {
  agentTreasuryConfig,
} from "@/config/contracts";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  cost?: string;
  txHash?: string;
  timestamp: number;
}

interface AgentOption {
  id: string;
  address: string;
  label: string;
  isParent: boolean;
}

const COST_PER_REQUEST = "0.0000000001";

const MODELS = [
  {
    id: "claude",
    name: "Claude",
    logo: "/Assets/Images/Logo/claude-logo.png",
    costPerReq: COST_PER_REQUEST,
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    logo: "/Assets/Images/Logo/chatgpt-logo.webp",
    costPerReq: COST_PER_REQUEST,
  },
  {
    id: "gemini",
    name: "Gemini",
    logo: "/Assets/Images/Logo/gemini-logo.jpeg",
    costPerReq: COST_PER_REQUEST,
  },
  {
    id: "perplexity",
    name: "Perplexity",
    logo: "/Assets/Images/Logo/perplexity-logo.png",
    costPerReq: COST_PER_REQUEST,
  },
];

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function AgentSelector({
  selected,
  onSelect,
  agents,
}: {
  selected: string;
  onSelect: (id: string) => void;
  agents: AgentOption[];
}) {
  const [open, setOpen] = useState(false);
  const current = agents.find((a) => a.id === selected) ?? agents[0];

  if (agents.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-[11px] text-text-secondary">No agents configured</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <p className="text-[11px] text-text-secondary">Pay via x402 from</p>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-border-main bg-surface px-2.5 py-1 text-[11px] font-medium text-text-main transition-colors hover:border-brand"
        >
          <span className="text-brand">
            {current?.isParent ? (
              <HiOutlineUserCircle className="h-4 w-4" />
            ) : (
              <HiOutlineCpuChip className="h-4 w-4" />
            )}
          </span>
          <span>{current?.label}</span>
          <HiOutlineChevronDown
            className={`h-3 w-3 text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="absolute bottom-full left-0 z-50 mb-1 w-56 overflow-hidden rounded-xl border border-border-main bg-surface shadow-lg">
            {agents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => {
                  onSelect(agent.id);
                  setOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors ${selected === agent.id
                    ? "bg-brand-light font-medium text-brand"
                    : "text-text-main hover:bg-main-bg"
                  }`}
              >
                <span
                  className={
                    selected === agent.id
                      ? "text-brand"
                      : "text-text-secondary"
                  }
                >
                  {agent.isParent ? (
                    <HiOutlineUserCircle className="h-4 w-4" />
                  ) : (
                    <HiOutlineCpuChip className="h-4 w-4" />
                  )}
                </span>
                <span>{agent.label}</span>
                {selected === agent.id && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="ml-auto h-3.5 w-3.5 text-brand"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ModelLogo({ model }: { model: string }) {
  const m = MODELS.find((mod) => mod.id === model);
  if (!m) return null;
  return (
    <Image
      src={m.logo}
      alt={m.name}
      width={18}
      height={18}
      className="rounded-full object-cover"
    />
  );
}

function ActiveAgentCard({
  agent,
  agents,
}: {
  agent: AgentOption | undefined;
  agents: AgentOption[];
}) {
  const currentAgent = agent ?? agents[0];

  const { availableYield } = useTreasuryRead();

  const subAgentRemaining = useReadContract({
    ...agentTreasuryConfig,
    functionName: "getSubAgentRemaining",
    args: currentAgent && !currentAgent.isParent
      ? [currentAgent.address as `0x${string}`]
      : undefined,
    query: {
      enabled: !!currentAgent && !currentAgent.isParent,
    },
  });

  if (!currentAgent) {
    return (
      <div className="rounded-xl border border-border-main bg-main-bg px-4 py-3">
        <p className="text-xs text-text-secondary">No agent selected</p>
      </div>
    );
  }

  const isParent = currentAgent.isParent;
  let budgetDisplay = "0.0000";

  if (isParent && availableYield.data !== undefined) {
    budgetDisplay = Number(formatEther(availableYield.data as bigint)).toFixed(4);
  } else if (!isParent && subAgentRemaining.data !== undefined) {
    budgetDisplay = Number(formatEther(subAgentRemaining.data as bigint)).toFixed(4);
  }

  const isLoadingBudget = isParent
    ? availableYield.isLoading
    : subAgentRemaining.isLoading;

  return (
    <div className="rounded-xl border border-brand/20 bg-brand-light px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-text-secondary">
        Active Agent
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-brand">
          {isParent ? (
            <HiOutlineUserCircle className="h-4 w-4" />
          ) : (
            <HiOutlineCpuChip className="h-4 w-4" />
          )}
        </span>
        <span className="text-sm font-semibold text-text-main">
          {currentAgent.label}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-1">
        <span className="text-xs text-text-secondary">Remaining budget:</span>
        <span className="flex items-center gap-1 text-xs font-semibold text-brand">
          {isLoadingBudget ? "..." : budgetDisplay} wstETH
          <Image
            src="/Assets/Images/Logo/wstETH-logo.png"
            alt="wstETH"
            className="rounded-full"
            width={12}
            height={12}
          />
        </span>
      </div>
    </div>
  );
}

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("claude");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { parentAgent, subAgents } = useTreasuryRead();

  const agents = useMemo<AgentOption[]>(() => {
    const list: AgentOption[] = [];

    if (parentAgent.data && parentAgent.data !== "0x0000000000000000000000000000000000000000") {
      list.push({
        id: "parent",
        address: parentAgent.data as string,
        label: `Parent (${truncateAddress(parentAgent.data as string)})`,
        isParent: true,
      });
    }

    if (subAgents.data && Array.isArray(subAgents.data)) {
      (subAgents.data as string[]).forEach((addr, i) => {
        list.push({
          id: `sub-${i}`,
          address: addr,
          label: `Sub-Agent ${i + 1} (${truncateAddress(addr)})`,
          isParent: false,
        });
      });
    }

    return list;
  }, [parentAgent.data, subAgents.data]);

  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0].id);
    }
  }, [agents, selectedAgent]);

  const currentAgent = agents.find((a) => a.id === selectedAgent);
  const currentModel = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const apiMessages = [...messages, userMessage]
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel, messages: apiMessages }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get response");
      }

      const data = await res.json();

      const onchainSpend = data.onchainSpend as {
        amount: string;
        ledgerId: string;
        verified: boolean;
      } | null;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content,
        model: data.model,
        cost: onchainSpend?.amount ?? currentModel.costPerReq,
        txHash: onchainSpend?.verified ? onchainSpend.ledgerId : undefined,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (onchainSpend?.verified) {
        toast.success("Yield verified onchain — payment deducted");
      }

      const activity = {
        id: assistantMessage.id,
        type: "chat",
        model: selectedModel,
        modelName: currentModel.name,
        cost: onchainSpend?.amount ?? currentModel.costPerReq,
        txHash: onchainSpend?.verified ? onchainSpend.ledgerId : undefined,
        timestamp: Date.now(),
        preview: trimmed.slice(0, 60),
      };
      try {
        const stored = JSON.parse(
          localStorage.getItem("aMA-activity") || "[]",
        );
        stored.unshift(activity);
        localStorage.setItem(
          "aMA-activity",
          JSON.stringify(stored.slice(0, 50)),
        );
      } catch { }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, selectedModel, currentModel.costPerReq]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const agentsLoading = parentAgent.isLoading || subAgents.isLoading;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-main">
            Chat with AI
          </h2>
          <div className="mt-1 flex items-center gap-1 text-sm text-text-secondary">
            <span>Paid with</span>
            <Image
              src="/Assets/Images/Logo/wstETH-logo.png"
              alt="wstETH"
              className="rounded-full"
              width={14}
              height={14}
            />
            <span>wstETH yield</span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-text-secondary">
            <span>~{currentModel.costPerReq} wstETH</span>
            <Image
              src="/Assets/Images/Logo/wstETH-logo.png"
              alt="wstETH"
              className="rounded-full"
              width={12}
              height={12}
            />
            <span>/ request</span>
          </p>
        </div>
        {agentsLoading ? (
          <div className="rounded-xl border border-border-main bg-main-bg px-4 py-3">
            <p className="text-xs text-text-secondary">Loading agents...</p>
          </div>
        ) : (
          <ActiveAgentCard agent={currentAgent} agents={agents} />
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        {MODELS.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => setSelectedModel(model.id)}
            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${selectedModel === model.id
                ? "border-brand bg-brand-light text-brand"
                : "border-border-main text-text-secondary hover:border-brand/30"
              }`}
          >
            <Image
              src={model.logo}
              alt={model.name}
              width={20}
              height={20}
              className="rounded-full object-cover"
            />
            {model.name}
          </button>
        ))}
      </div>

      <div
        ref={scrollRef}
        className="mt-4 h-[400px] overflow-y-auto rounded-xl border border-border-main bg-main-bg p-4"
      >
        <div className="space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex h-full flex-col items-center justify-center py-36">
              <HiOutlineChatBubbleLeftRight className="h-8 w-8 text-text-secondary/30" />
              <p className="mt-5 text-sm text-text-secondary">
                Start a conversation with {currentModel.name}
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && msg.model && (
                <div className="mt-1 shrink-0">
                  <ModelLogo model={msg.model} />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user"
                    ? "bg-brand text-white"
                    : "border border-border-main bg-surface"
                  }`}
              >
                <p
                  className={`whitespace-pre-line text-sm leading-relaxed ${msg.role === "user" ? "text-white" : "text-text-main"}`}
                >
                  {msg.content}
                </p>
                {msg.cost && (
                  <div className="mt-2 flex items-center gap-1 border-t border-border-main/20 pt-2">
                    <Image
                      src="/Assets/Images/Logo/wstETH-logo.png"
                      alt="wstETH"
                      className="rounded-full"
                      width={10}
                      height={10}
                    />
                    <span
                      className={`text-[10px] ${msg.role === "user" ? "text-white/60" : "text-text-secondary"}`}
                    >
                      {msg.cost} wstETH
                    </span>
                    {msg.txHash ? (
                      <span className="rounded-full bg-brand-light px-1.5 py-0.5 text-[9px] font-semibold text-brand">
                        yield verified
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] ${msg.role === "user" ? "text-white/60" : "text-text-secondary"}`}
                      >
                        (offchain)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="mt-1 shrink-0">
                <ModelLogo model={selectedModel} />
              </div>
              <div className="rounded-2xl border border-border-main bg-surface px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand [animation-delay:150ms]" />
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${currentModel.name} anything...`}
            disabled={isLoading}
            className="w-full rounded-xl border border-border-main bg-surface py-3 pl-4 pr-12 text-sm text-text-main placeholder:text-text-secondary/50 focus:border-brand focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            disabled={!input.trim() || isLoading}
            onClick={sendMessage}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg bg-brand p-2 text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <HiOutlinePaperAirplane className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between px-1">
        <AgentSelector
          selected={selectedAgent}
          onSelect={setSelectedAgent}
          agents={agents}
        />
        <p className="flex items-center gap-1 text-[11px] text-text-secondary">
          <Image
            src="/Assets/Images/Logo/wstETH-logo.png"
            alt="wstETH"
            className="rounded-full"
            width={10}
            height={10}
          />
          Paid from yield balance
        </p>
      </div>
    </div>
  );
}
