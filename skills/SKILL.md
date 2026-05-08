---
name: aMA
description: Use when a request involves staking ETH via Lido, wrapping stETH to wstETH, managing AI agent yield-bearing budgets, or interacting with the AgentTreasury smart contract on Ethereum Mainnet.
---

# aMA — AI Agent Treasury Skill

You are an AI agent with access to a yield-bearing operating budget powered by Lido stETH staking. Your principal is locked in the AgentTreasury contract, and you can only spend from accrued yield. All spending is enforced onchain.

---

## What You Can Do

- Stake ETH to receive stETH via Lido
- Wrap stETH to wstETH and lock as principal in AgentTreasury
- Spend yield (wstETH) to pay for AI services (Claude, ChatGPT, Gemini, Perplexity)
- Query your available yield, principal, and spending history
- Manage sub-agent budgets and permissions

---

## Contracts (Ethereum Mainnet)

| Contract | Address |
|----------|---------|
| AgentTreasury | `0x783e1512bFEa7C8B51A92cB150FEb5A04b91E9Aa` |
| Lido stETH | `0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84` |
| wstETH | `0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0` |
| Chainlink ETH/USD | `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419` |

---

## How Yield Works

1. Human deposits ETH → Lido stakes it → receives stETH
2. stETH is wrapped to wstETH (non-rebasing) via Lido wstETH contract
3. wstETH is locked as principal in AgentTreasury
4. Over time, `stEthPerToken()` increases as Lido distributes staking rewards
5. Yield = current stETH value of wstETH - initial value at deposit - total spent
6. Agent can only spend the yield portion — principal is structurally inaccessible

Current APR: fetched from `https://eth-api.lido.fi/v1/protocol/steth/apr/last`

---

## Agent Functions

### Read (no gas, anyone can call)

```solidity
getAvailableYield() → uint256        // Spendable yield in wstETH
getCurrentValue() → uint256          // Current stETH value of all wstETH
principalWstETH() → uint256          // Locked principal
totalSpentWstETH() → uint256         // Cumulative spent
paused() → bool                      // Is spending frozen
getCycleInfo() → (duration, spent, limit, resetAt)
getSubAgentRemaining(address) → uint256
```

### Write (requires active agent role)

```solidity
spend(address to, uint256 wstETHAmount)  // Send yield to whitelisted recipient
```

### Owner-only (admin wallet)

```solidity
setParentAgent(address)
addSubAgent(address, uint256 budgetCap)
pauseSubAgent(address) / resumeSubAgent(address)
setWhitelistEnabled(bool) / setWhitelist(address, bool)
setCapEnabled(bool) / setPerTxCap(uint256)
setRateLimitEnabled(bool) / setCycleLimit(uint256)
pause() / unpause()
withdrawPrincipal(uint256)
```

---

## Spending Rules

All enforced at the smart contract level:

1. **Whitelist** — When enabled, agent can only send to approved addresses
2. **Per-Transaction Cap** — Maximum wstETH per single spend
3. **Cycle Rate Limit** — Maximum total wstETH per cycle (e.g. 30 days)
4. **Sub-Agent Budget** — Each sub-agent has its own cap, resets per cycle
5. **Pause** — Owner can freeze all spending instantly

---

## Deposit Flows

### Stake ETH (anyone)
```
User sends ETH → Lido.submit() → receives stETH
```

### Wrap & Lock (anyone)
```
1. Approve stETH to wstETH contract (0x7f39...)
2. wstETH.wrap(stETHAmount) → receives wstETH
3. Approve wstETH to AgentTreasury (0x783e...)
4. AgentTreasury.depositWstETH(amount) → principal locked
```

### Direct ETH Deposit (anyone)
```
AgentTreasury.depositETH{value: amount}() → auto-stakes + wraps + locks
```

---

## AI Chat Payment Flow (x402)

1. User selects AI model (Claude, ChatGPT, Gemini, Perplexity)
2. User sends message → backend proxies to OpenRouter API
3. AI responds → cost deducted from agent's yield balance
4. Activity logged to localStorage for tracking

API endpoint: `POST /api/chat`
```json
{
  "model": "claude",
  "messages": [{"role": "user", "content": "..."}]
}
```

---

## Data Sources

| Data | Source | Type |
|------|--------|------|
| ETH price | Chainlink ETH/USD (0x5f4e...) | Onchain |
| stETH APR | Lido API (eth-api.lido.fi) | API |
| Principal | AgentTreasury.principalWstETH() | Onchain |
| Yield | AgentTreasury.getAvailableYield() | Onchain |
| Total spent | AgentTreasury.totalSpentWstETH() | Onchain |
| stETH balance | ERC20.balanceOf() | Onchain |
| wstETH rate | wstETH.stEthPerToken() | Onchain |
| ETH balance | Native balance query | Onchain |

---

## Key Principles

1. **Principal is never accessible to the agent** — no function exists
2. **Only yield is spendable** — enforced by smart contract math
3. **All permissions onchain** — whitelist, caps, rate limits
4. **No mocks** — all contracts deployed and verified on Ethereum Mainnet
5. **Non-rebasing** — uses wstETH for clean yield accounting
6. **Public deposits** — anyone can fund the treasury

---

## Resources

### Lido Finance
- [stETH Integration Guide](https://docs.lido.fi/guides/steth-integration-guide) — rebasing drift is the key section
- [wstETH Contract Docs](https://docs.lido.fi/contracts/wsteth)
- [Lido Deployed Contracts](https://docs.lido.fi/deployed-contracts)
- [Lido JS SDK](https://github.com/lidofinance/lido-ethereum-sdk)

### aMA
- [AgentTreasury on Etherscan](https://etherscan.io/address/0x783e1512bFEa7C8B51A92cB150FEb5A04b91E9Aa)
- [GitHub Repository](https://github.com/0xpochita/aMA)
