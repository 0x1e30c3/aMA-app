"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineWallet } from "react-icons/hi2";

const AVAILABLE_SERVICES = [
  {
    id: "claude",
    name: "Claude API",
    logo: "/Assets/Images/Logo/claude-logo.png",
    description: "Anthropic language model",
  },
  {
    id: "chatgpt",
    name: "ChatGPT API",
    logo: "/Assets/Images/Logo/chatgpt-logo.webp",
    description: "OpenAI language model",
  },
  {
    id: "gemini",
    name: "Gemini API",
    logo: "/Assets/Images/Logo/gemini-logo.jpg",
    description: "Google language model",
  },
  {
    id: "perplexity-new",
    name: "Perplexity API",
    logo: "/Assets/Images/Logo/perplexity-logo.png",
    description: "AI-powered search",
  },
];

interface WhitelistEntry {
  address: string;
  addedAt: number;
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function AddServiceModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border-main bg-surface p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-main">Add Service</h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-text-secondary transition-colors hover:text-text-main"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          Select an AI service to whitelist for agent payments
        </p>

        <div className="mt-5 space-y-2">
          {AVAILABLE_SERVICES.map((service, i) => (
            <motion.button
              key={service.id}
              type="button"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.08 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex w-full cursor-pointer items-center gap-4 rounded-xl border border-border-main p-4 text-left transition-colors hover:border-brand hover:bg-brand-light"
            >
              <Image
                src={service.logo}
                alt={service.name}
                width={40}
                height={40}
                className="rounded-xl object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-main">
                  {service.name}
                </p>
                <p className="text-xs text-text-secondary">
                  {service.description}
                </p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-text-secondary"
              >
                <path
                  fillRule="evenodd"
                  d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="mt-4 rounded-xl border border-dashed border-border-main p-4"
        >
          <p className="text-center text-xs text-text-secondary">
            Or enter a custom recipient address
          </p>
          <input
            type="text"
            placeholder="0x..."
            className="mt-2 w-full rounded-lg border border-border-main bg-main-bg px-3 py-2 font-mono text-sm text-text-main placeholder:text-text-secondary/50 focus:border-brand focus:outline-none"
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function ActiveServices() {
  const [showModal, setShowModal] = useState(false);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("aMA-whitelist");
      if (stored) {
        const parsed = JSON.parse(stored);
        const normalized: WhitelistEntry[] = parsed.map((item: string | WhitelistEntry) =>
          typeof item === "string" ? { address: item, addedAt: Date.now() } : item
        );
        setWhitelist(normalized);
      }
    } catch {
      setWhitelist([]);
    }
  }, []);

  const hasEntries = whitelist.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-main">
            Active Services
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Whitelisted addresses your agent can pay
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="cursor-pointer rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-hover"
        >
          Add Service
        </button>
      </div>

      {hasEntries ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-border-main">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-main bg-main-bg">
                <th className="px-4 py-3 text-xs font-medium text-text-secondary">
                  Address
                </th>
                <th className="px-4 py-3 text-xs font-medium text-text-secondary">
                  Added
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {whitelist.map((entry) => (
                <tr
                  key={entry.address}
                  className="border-b border-border-main last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-light">
                        <HiOutlineWallet className="h-4 w-4 text-brand" />
                      </div>
                      <span className="font-mono text-sm text-text-main">
                        {truncateAddress(entry.address)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {new Date(entry.addedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="cursor-pointer rounded-lg border border-border-main px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-red-300 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-border-main bg-main-bg py-12">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5 text-brand"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>
          <p className="mt-3 text-sm font-medium text-text-main">
            No services whitelisted
          </p>
          <p className="mt-1 max-w-xs text-center text-xs text-text-secondary">
            Add whitelisted addresses to allow agents to make payments
          </p>
        </div>
      )}

      <AnimatePresence>
        {showModal && <AddServiceModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
