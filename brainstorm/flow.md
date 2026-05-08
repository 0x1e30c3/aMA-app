# aMA — User Flow

## Step 1: Connect Wallet

User opens aMA and clicks "Connect Wallet" in the header. RainbowKit modal appears with wallet options (MetaMask, WalletConnect, etc.). After connecting, the header shows the user's address and ETH balance on Ethereum Mainnet.

---

## Step 2: Stake ETH or Wrap stETH

**Page: Stake (`/`)**

The Stake page has two modes, selectable via toggle tabs at the top:

### Mode A: Stake (ETH to stETH)
User enters an amount of ETH. The interface shows:
- Exchange rate (1 ETH = 1.0000 stETH) with ETH and stETH logos
- Estimated stETH to receive
- Max transaction cost (~$0.50)
- Reward fee (10%)

User clicks "Stake ETH" and confirms. ETH is sent to Lido, user receives stETH.

### Mode B: Wrap (stETH to wstETH to Treasury)
For users who already have stETH. The interface shows:
- Flow indicator: stETH > wstETH > Treasury
- Exchange rate (1 stETH = ~0.8695 wstETH)
- Output in wstETH, locked as principal in treasury
- Max transaction cost (~$0.10)

User clicks "Wrap & Lock in Treasury". stETH is wrapped to wstETH and deposited into the treasury contract in one transaction.

**After staking/wrapping:** User can see the Treasury Overview banner below showing locked principal (wstETH), spendable yield, and total spent.

---

## Step 3: Deposit wstETH to Agent Treasury

**Page: Stake (`/`) — Wrap mode, or Treasury (`/treasury`)**

User wraps stETH to wstETH and locks it in the treasury. What happens onchain:
- stETH is wrapped to wstETH (non-rebasing)
- The initial wstETH amount is recorded as principal
- Principal is structurally locked — no function exists for the agent to withdraw it
- Over time, wstETH value grows relative to stETH (that growth is the yield)
- Only the yield portion becomes spendable by the agent

All treasury balances are denominated in **wstETH**.

---

## Step 4: Configure Agent Permissions

**Page: Treasury (`/treasury`) > Set Permissions tab**

User sets spending rules (first tab in dashboard, following the config flow order):

1. **Recipient Whitelist** — Toggle on, then add addresses of AI services the agent is allowed to pay
2. **Per-Transaction Cap** — Set maximum wstETH per single transaction (e.g. 0.01 wstETH)
3. **Daily Rate Limit** — Set maximum total wstETH per day (e.g. 0.1 wstETH/day)

All three are enforced at the smart contract level.

---

## Step 5: Set Up Agent Hierarchy

**Page: Treasury (`/treasury`) > Setup Hierarchy tab**

User configures sub-agents with dedicated budgets:

- **Parent Agent** — Total budget from yield (e.g. 1.2000 wstETH)
- **Sub-Agent A (Research)** — Allocated 0.4000 wstETH, magnifying glass icon
- **Sub-Agent B (Execution)** — Allocated 0.5000 wstETH, CPU chip icon
- **Sub-Agent C (Integration)** — Allocated 0.3000 wstETH, puzzle piece icon

Each sub-agent has a progress bar (spent vs cap), status badge, and pause/resume button.

---

## Step 6: Review Budget & Cycle

**Page: Treasury (`/treasury`) > Budget & Cycle tab**

User reviews:
- Cycle duration (30 days)
- Next reset countdown timer
- Total yield allocated across all sub-agents (0.8550 wstETH)
- Unallocated yield remaining (0.3450 wstETH)

---

## Step 7: Add AI Services

**Page: Agent Hub (`/agent-hub`)**

User clicks "Add Service" in the Active Services card. A modal (with framer-motion animation) appears with AI services:

- Claude API (Anthropic) — with logo
- ChatGPT API (OpenAI) — with logo
- Gemini API (Google) — with logo
- Perplexity API (Perplexity AI) — with logo

User can also enter a custom recipient address. The service address gets added to the whitelist automatically.

---

## Step 8: Chat with AI (Pay Per Request)

**Page: Agent Hub (`/agent-hub`) > AI Chat**

User selects an AI model and types a message. The flow:

1. User selects model (Claude, ChatGPT, Gemini, or Perplexity) via tab buttons with logos
2. User selects which agent pays via dropdown at bottom (Parent, Sub-Agent A/B/C with role icons)
3. Active Agent card (top right) shows selected agent and remaining wstETH budget
4. User sends message
5. Payment is triggered via x402 HTTP payment protocol
6. Cost (e.g. 0.0003 wstETH) is deducted from the selected agent's yield balance
7. AI response appears with cost displayed (e.g. "0.0003 wstETH via x402")

---

## Step 9: Monitor Spending

**Page: Agent Hub (`/agent-hub`)**

User monitors spending across all services in dashboard cards:

- **Monthly Spending** — Total budget vs spent vs remaining (wstETH), with category breakdown
- **Quick Actions** — Add Service, Pause All, Refresh, Alerts
- **Active Services** — Table with real AI service logos, usage progress bars, revoke buttons
- **Activity Feed** — Real-time timeline with service logos, costs, timestamps

---

## Step 10: Review Transaction History

**Page: Treasury (`/treasury`) > Spend Log tab**

User reviews detailed transaction history:
- Filter by agent role
- Color-coded agent badges (Research=blue, Execution=amber, Integration=green)
- Each transaction shows: recipient label, amount in wstETH with logo, memo, timestamp

---

## Step 11: Adjust and Maintain

User can at any time:
- **Pause agents** — Freeze spending via Quick Actions or per sub-agent in Hierarchy
- **Revoke services** — Remove a service from whitelist in Active Services
- **Adjust caps** — Change per-transaction or daily limits in Set Permissions
- **Reallocate budgets** — Shift yield between sub-agents in Setup Hierarchy
- **Withdraw principal** — Owner can withdraw the locked principal (only owner, never agent)
- **Top up** — Stake more ETH, then wrap & lock more wstETH

---

## Safety Guarantees Throughout

| What | Guarantee |
|------|-----------|
| Principal | Structurally locked in contract, no agent function can access it |
| Spending | Only from yield, enforced onchain |
| Recipients | Only whitelisted addresses, enforced onchain |
| Amounts | Per-tx cap and daily rate limit, enforced onchain |
| Pause | Owner can freeze all agent spending instantly |
| Visibility | Every transaction recorded onchain and visible in Spend Log |

---

## Flow Diagram

```
    STAKE / WRAP              CONFIGURE                    EXECUTE
        |                        |                           |
        v                        v                           v
  +-----------+          +---------------+           +---------------+
  |           |          |               |           |               |
  | ETH       |--stake-> |   Treasury    |--yield--> |  Agent Hub    |
  |  -> stETH |          |               |           |               |
  |  -> wstETH|--wrap--> | 1.Set Perms   |           | - AI Chat     |
  |           |          | 2.Hierarchy   |           | - Services    |
  |           |          | 3.Budget      |           | - Activity    |
  |           |          | 4.Spend       |           | - Spending    |
  |           |          | 5.Log         |           |               |
  +-----------+          +---------------+           +---------------+
        |                       |                          |
        |              principal locked              pay per request
        |              (wstETH)                      via x402 from
        +-------------------+---------------------------wstETH yield
```
