# Brainstorm: stETH Agent Treasury

## The Challenge

Build a contract primitive that lets a human give an AI agent a **yield-bearing operating budget** backed by stETH/wstETH.

- The agent can **never touch the principal**
- The agent can **only spend accrued yield**
- Spending permissions are **enforced at the contract level**

---

## Key Questions to Answer

### 1. How does yield work with wstETH?

- **stETH** = rebasing token (balance grows daily as staking rewards accrue)
- **wstETH** = wrapped stETH, non-rebasing. Value increases over time relative to stETH.
- Example: Deposit 10 stETH → get ~8.7 wstETH. Later, that 8.7 wstETH is worth 10.3 stETH. The 0.3 stETH is yield.
- **Question for you:** Should we work with wstETH internally (simpler math) and let users deposit/withdraw in stETH or ETH?

### 2. How do we separate principal from yield?

**Option A: wstETH Snapshot Approach**
- Record `initialWstETHAmount` at deposit time
- Yield = current value of wstETH in stETH - initial stETH value
- Principal = `initialWstETHAmount` (always locked)
- Agent can only withdraw the difference (yield)

**Option B: stETH Rebasing Approach**
- Record `initialStETHBalance` at deposit time
- Yield = current stETH balance - initial balance
- More intuitive but rebasing adds complexity

> **Recommendation:** Option A (wstETH) is cleaner and what the track suggests.

**Question for you:** Do you prefer Option A or B?

### 3. What permissions should we implement?

The track requires **at least one**. We should implement all three for a stronger submission:

| Permission | Description | Example |
|---|---|---|
| **Recipient Whitelist** | Agent can only send to approved addresses | Only pay to Chainlink oracle, AWS billing address |
| **Per-Transaction Cap** | Max amount per single spend | Agent can't spend more than 0.01 ETH at once |
| **Time Window** | Spending only allowed in certain periods | Agent can spend once per day / only on weekdays |

**Question for you:** Any other permissions you'd like to add? Rate limits (max spend per day/week)?

### 4. Who are the actors?

| Actor | Can Do | Cannot Do |
|---|---|---|
| **Owner (Human)** | Deposit/withdraw principal, set permissions, add/remove whitelist, pause agent | Spend yield (that's the agent's job) |
| **Agent** | Query available yield, spend yield to whitelisted addresses | Touch principal, change permissions, withdraw principal |

**Question for you:** Should there be an "emergency stop" where the owner can freeze all agent spending?

### 5. What does the contract architecture look like?

```
┌─────────────────────────────────────────────┐
│              AgentTreasury.sol               │
├─────────────────────────────────────────────┤
│ Owner (Human)                               │
│   - deposit(wstETH)                         │
│   - withdrawPrincipal()                     │
│   - setAgent(address)                       │
│   - addToWhitelist(address)                 │
│   - removeFromWhitelist(address)            │
│   - setTransactionCap(uint256)              │
│   - setTimeWindow(start, end)               │
│   - pause() / unpause()                     │
├─────────────────────────────────────────────┤
│ Agent                                       │
│   - getAvailableYield() → uint256           │
│   - spend(to, amount)                       │
├─────────────────────────────────────────────┤
│ Internal                                    │
│   - principalWstETH (locked, never moves)   │
│   - yieldBalance (accrued, spendable)       │
│   - permissions (whitelist, cap, window)    │
└─────────────────────────────────────────────┘
```

**Question for you:** Single contract or factory pattern (one treasury per agent)?

### 6. What makes a "strong entry"?

From the track description:
- ✅ Working demo where agent pays for something from yield
- ✅ Principal structurally inaccessible (not just access control — truly locked)
- ✅ Multiple configurable permissions
- ❌ NOT a multisig with staking bolted on

**Bonus ideas for standing out:**
- Factory contract that deploys treasuries for multiple agents
- Frontend dashboard showing principal vs yield in real-time
- Multi-agent support: parent agent allocates yield budgets to sub-agents
- MCP tool so agents can query and spend from natural language

### 7. Target use cases from the track

1. Agent pays for API calls and compute from yield — never touches principal
2. Team gives agent a monthly budget funded entirely by staking rewards
3. Multi-agent system: parent allocates yield budgets to sub-agents

**Question for you:** Which use case should we demo? I suggest #1 (agent paying for something) as it's the most tangible.

---

## Deployment Strategy

- **Development:** Holesky testnet (Lido has stETH/wstETH deployed there)
- **Production:** Ethereum mainnet or any L2 with bridged wstETH

---

## Decisions Needed From You

1. **wstETH vs stETH internally?** (Recommend: wstETH)
2. **Single contract or factory pattern?** (Recommend: factory for stronger submission)
3. **Which permissions to implement?** (Recommend: all three + daily rate limit)
4. **Emergency pause feature?** (Recommend: yes)
5. **Which use case to demo?** (Recommend: agent paying for API calls)
6. **Multi-agent sub-budgets?** (Bonus feature, adds complexity)
7. **Frontend priority?** (Dashboard showing principal vs yield)

---

## Resources

- [stETH Integration Guide](https://docs.lido.fi/guides/steth-integration-guide)
- [wstETH Contract Docs](https://docs.lido.fi/contracts/wst-eth)
- [Lido Deployed Contracts](https://docs.lido.fi/deployed-contracts)
- [Lido JS SDK](https://github.com/lidofinance/lido-ethereum-sdk)
