# aMA — Project Overview

## What is aMA?

aMA is a smart contract primitive that gives AI agents a yield-bearing operating budget backed by wstETH. Humans deposit stETH (which gets wrapped to wstETH), the principal stays locked and inaccessible, while staking yield (~3.5% APY) flows into a spendable balance that agents use to pay for AI services like Claude, ChatGPT, Gemini, and Perplexity — all enforced onchain.

---

## Frontend Architecture

### Pages & User Flow

```
Stake (/)  →  Agent Hub (/agent-hub)  →  Treasury (/treasury)
   │                  │                         │
   │                  │                         │
FUND / WRAP       EXECUTE               CONFIGURE
```

### 1. Stake (`/`)

The entry point. Two modes via toggle tabs:

- **Stake** (bolt icon): Convert ETH to stETH via Lido
- **Wrap** (cube icon): Wrap stETH to wstETH and lock in treasury

**Layout:** Two-column — form (left) + info panel with aMA background (right), followed by Treasury Overview banner.

**Components:**
- `StakePanel` — Mode toggle (Stake/Wrap), ETH or stETH input, exchange rate with token logos, flow indicator (ETH > stETH > wstETH > Treasury), output display
- `HeroBanner` — Treasury Overview with locked principal (wstETH), spendable yield (live accumulation + ~3.5% APY badge + plant icon), total spent

**Stake mode:** ETH input → stETH output, button "Stake ETH"
**Wrap mode:** stETH input → wstETH output (locked in treasury), button "Wrap & Lock in Treasury", flow: stETH > wstETH > Treasury

---

### 2. Agent Hub (`/agent-hub`)

The execution layer. Users chat with AI, manage services, and monitor spending.

**Layout:** Dashboard card layout — AI Chat (full width top), Spending + Quick Actions (2:1 grid), Services + Activity Feed (3:2 grid).

**Components:**

#### AI Chat (`AiChat`)
- Model selector: Claude, ChatGPT, Gemini, Perplexity (with real logos)
- Chat interface with message bubbles
- Each AI response shows cost (e.g. "0.0003 wstETH via x402")
- Active Agent card (top right) — shows which agent is paying and remaining wstETH budget
- Agent selector dropdown (bottom) — choose Parent Agent or Sub-Agent A/B/C (with role icons: user circle, magnifying glass, CPU chip, puzzle piece)
- Payment via x402 HTTP payment protocol from wstETH yield

#### Monthly Spending (`SpendingSummary`)
- Total budget, spent, remaining with wstETH amounts and logos
- Overall usage progress bar
- Category breakdown: Research, Infrastructure, Hosting

#### Quick Actions (`QuickActions`)
- Add Service, Pause All Agents, Refresh Budgets, Set Alerts

#### Active Services (`ActiveServices`)
- Table: service name (with real logo), category, usage progress bar, last used, revoke button
- Services: Perplexity, OpenAI, Claude, Gemini, ChatGPT (with actual brand logos)
- "Add Service" button opens modal with framer-motion animations
- Modal shows AI services with logos + custom address input

#### Activity Feed (`ActivityFeed`)
- Timeline of agent operations with real service logos
- Entries: payments, approvals, alerts, yield harvests
- Each shows service logo, description, wstETH cost, time ago

---

### 3. Treasury (`/treasury`)

The configuration layer. Users set permissions, manage agent hierarchy, and configure budgets.

**Layout:** Treasury Overview banner (full width) + tabbed DashboardPanel.

**Components:**

#### Treasury Overview (`HeroBanner`)
- Background: aMA anime character with blue overlay
- Three glassmorphism cards: Locked Principal (wstETH), Spendable Yield (wstETH), Total Spent (wstETH)
- Live yield indicator: plant icon (react-icons) + incrementing counter
- ~3.5% APY badge

#### Dashboard Panel (`DashboardPanel`)
Tabbed sidebar navigation with react-icons, ordered by configuration flow:

1. **Set Permissions** (`PermissionPanel`) — shield icon
   - Recipient Whitelist — add/remove addresses, enable/disable toggle
   - Per-Transaction Cap — max wstETH per spend
   - Daily Rate Limit — max wstETH per day

2. **Setup Hierarchy** (`AgentTree`) — user group icon
   - Parent agent card with total budget + progress bar (user circle icon)
   - 3 sub-agent cards with react-icons:
     - Sub-Agent A (Research) — magnifying glass icon, active
     - Sub-Agent B (Execution) — CPU chip icon, active
     - Sub-Agent C (Integration) — puzzle piece icon, paused
   - Each card: address, budget cap, spent progress bar, status badge, pause/resume button

3. **Budget & Cycle** (`AgentInfo`) — cog icon
   - Agent address, owner address, status (active/paused)
   - Budget Cycle: 30-day duration, next reset countdown, allocated vs unallocated yield

4. **Trigger Spend** (`AgentActions`) — bolt icon
   - Sub-agent selector dropdown
   - Available yield display per selected agent (wstETH)
   - Recipient + amount inputs
   - "Trigger Spend" button
   - Next cycle reset countdown

5. **Spend Log** (`SpendLog`) — clipboard icon
   - Filterable transaction list
   - Color-coded agent badges (Research=blue, Execution=amber, Integration=green)
   - Recipient labels (e.g. "Claude API", "Gemini API")
   - Amount in wstETH with logo
   - Memo text per transaction

---

## Shared Components

### Header (`Header`)
- aMA logo + brand name
- Navigation: Stake | Agent Hub | Treasury
- Custom wallet: ConnectWallet + ChainSelector (Ethereum Mainnet only)

### ConnectWallet (`ConnectWallet`)
- Not connected: "Connect Wallet" button (opens RainbowKit modal)
- Connected: chain display + account menu (balance, address, copy, disconnect)

---

## Design System

- **Theme:** Blue (#2563eb) + White minimalist
- **Font:** Inter
- **Tokens:** `bg-brand`, `bg-brand-light`, `bg-surface`, `bg-main-bg`, `text-text-main`, `text-text-secondary`, `border-border-main`
- **Token logos:** stETH (stETH-logo.svg), wstETH (wstETH-logo.png, rounded-full), LDO (lido-dao-ldo-logo.svg)
- **AI logos:** Claude, ChatGPT, Gemini, Perplexity (real brand logos)
- **Icons:** react-icons (HiOutline set) for navigation, agent roles, actions
- **Rules:** No gradients, no emojis, no decorative elements. Minimal borders, consistent radius + spacing. Input number spinners disabled globally.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| Web3 | wagmi v2, viem, RainbowKit |
| Animation | framer-motion |
| Icons | react-icons (Heroicons Outline) |
| Toast | sonner |
| Linting | Biome |

---

## How It All Connects

```
Human deposits ETH
       |
       v
  Stake Page (/)
  [Stake tab] ETH -> stETH via Lido
  [Wrap tab]  stETH -> wstETH -> Treasury (locked)
       |
       v
  Treasury (/treasury)
  Configure: permissions, hierarchy, budgets
  All denominated in wstETH
       |
       v
  Agent Hub (/agent-hub)
  Agent chats with AI (Claude, ChatGPT, Gemini, Perplexity)
  Each request paid from wstETH yield via x402
  Agent can only spend to whitelisted addresses
  Within per-tx caps and daily rate limits
  Principal never touched
```

---

## Agent CLI Scripts

### `scripts/agent-demo.ts`
Interactive CLI agent that reads treasury state from the smart contract, verifies yield onchain before each AI request, and tracks spending in a local ledger. Commands: `/status`, `/ledger`, `/quit`.

### `scripts/agent-spend.ts`
Onchain spend script that calls `spend()` on AgentTreasury from the agent wallet. Produces a real Etherscan transaction proving yield was spent without touching principal.

### Server-Side Yield Verification (`/api/chat`)
Every AI chat request reads `getAvailableYield()` from the smart contract (free, no gas). If yield is insufficient, returns HTTP 402. Tracks pending settlements in an offchain ledger.

---

## Key Differentiators

1. **Principal safety** — Structurally locked, not just access-controlled
2. **Yield-only spending** — Agent budget comes from staking rewards, not deposits
3. **wstETH-native** — Non-rebasing token for cleaner yield accounting
4. **Multi-agent hierarchy** — Parent allocates budgets to specialized sub-agents
5. **Pay-per-request** — No subscriptions, no prepaid credits; yield-verified micropayments
6. **Onchain enforcement** — Permissions enforced at smart contract level
7. **Real AI integration** — Claude, ChatGPT, Gemini, Perplexity with actual logos and pricing
8. **CLI agent demo** — Interactive terminal agent proving yield-only spending end-to-end
9. **Hybrid settlement** — Onchain yield verification per request, batched onchain settlement
8. **Dual-mode staking** — Stake ETH or wrap existing stETH directly to treasury
