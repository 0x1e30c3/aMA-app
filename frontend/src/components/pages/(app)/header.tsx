"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWallet } from "./connect-wallet";

const NAV_ITEMS = [
  { href: "/", label: "Stake" },
  { href: "/agent-hub", label: "Agent Hub" },
  { href: "/treasury", label: "Treasury" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between border-b border-border-main bg-surface px-8 py-3">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/Assets/Images/Logo/logo-transparent.png"
            alt="aMA"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-base font-semibold text-text-main">aMA</span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${isActive
                    ? "bg-brand-light text-brand"
                    : "text-text-secondary hover:text-text-main"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <ConnectWallet />
    </header>
  );
}
