# aMA — Smart Contract Overview (v2)

## Track Requirements (No Mocks)

> Build a contract primitive that lets a human give an AI agent a yield-bearing operating budget backed by stETH, without ever giving the agent access to the principal. Use wstETH as the yield-bearing asset. **No mocks.**

**Must demonstrate:**
1. Principal structurally inaccessible to the agent
2. Spendable yield balance the agent can query and draw from
3. At least one configurable permission (recipient whitelist, per-transaction cap, or time window)

---

## Existing Lido Contracts (DO NOT BUILD)

| Contract | Mainnet Address | Usage |
|----------|----------------|-------|
| **Lido (stETH)** | `0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84` | `submit()` to stake ETH |
| **wstETH** | `0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0` | `wrap()`, `unwrap()`, `getStETHByWstETH()`, `stEthPerToken()` |

### How Yield Works

- wstETH balance stays constant, but value in stETH increases over time
- `stEthPerToken()` returns current rate (always increasing)
- Yield = current wstETH value in stETH - initial value at deposit - already spent

---

## What We Build

### Contract 1: AgentTreasury.sol (Main)

Owner deposits wstETH. Yield accrues. Parent agent and sub-agents spend yield within permissions.

### Storage

```solidity
// Roles
address public owner;
address public parentAgent;

// Principal
uint256 public principalWstETH;
uint256 public initialStETHValue;

// Spending
uint256 public totalSpentWstETH;

// Sub-agents
struct SubAgentConfig {
    string role;              // "Research", "Execution", "Integration"
    uint256 budgetCap;        // Max wstETH this sub-agent can spend per cycle
    uint256 spent;            // wstETH spent this cycle
    bool active;              // Can be individually paused
}
mapping(address => SubAgentConfig) public subAgents;
address[] public subAgentList;

// Permissions
bool public whitelistEnabled;
mapping(address => bool) public whitelist;

bool public capEnabled;
uint256 public perTransactionCap;

bool public rateLimitEnabled;
uint256 public cycleDuration;        // e.g. 30 days
uint256 public cycleRateLimit;       // Max wstETH per cycle
uint256 public cycleSpent;           // Total spent this cycle
uint256 public cycleStartTimestamp;  // When current cycle began

// State
bool public paused;
```

### Owner Functions

```solidity
// === Deposits ===
function depositWstETH(uint256 amount) external onlyOwner
function depositETH() external payable onlyOwner        // auto-stake + wrap
function depositStETH(uint256 amount) external onlyOwner // auto-wrap

// === Withdrawals ===
function withdrawPrincipal(uint256 wstETHAmount) external onlyOwner

// === Agent Management ===
function setParentAgent(address agent) external onlyOwner
function addSubAgent(address agent, string role, uint256 budgetCap) external onlyOwner
function removeSubAgent(address agent) external onlyOwner
function pauseSubAgent(address agent) external onlyOwner
function resumeSubAgent(address agent) external onlyOwner
function setSubAgentBudget(address agent, uint256 newCap) external onlyOwner

// === Permissions ===
function setWhitelistEnabled(bool enabled) external onlyOwner
function addToWhitelist(address recipient) external onlyOwner
function removeFromWhitelist(address recipient) external onlyOwner

function setCapEnabled(bool enabled) external onlyOwner
function setPerTransactionCap(uint256 maxWstETH) external onlyOwner

function setRateLimitEnabled(bool enabled) external onlyOwner
function setCycleDuration(uint256 seconds_) external onlyOwner
function setCycleRateLimit(uint256 maxWstETH) external onlyOwner

// === Emergency ===
function pause() external onlyOwner
function unpause() external onlyOwner
```

### Agent Functions (parent or active sub-agent)

```solidity
// Spend yield to whitelisted recipient
function spend(address to, uint256 wstETHAmount) external onlyActiveAgent

// Query available yield for caller
function getAvailableYield() external view returns (uint256)

// Query sub-agent remaining budget
function getSubAgentBudget(address agent) external view returns (uint256 remaining)
```

### View Functions

```solidity
function getCurrentValue() external view returns (uint256 stETHValue)
function getPrincipalValue() external view returns (uint256 stETHValue)
function getAvailableYield() external view returns (uint256 wstETHAmount)
function getSubAgents() external view returns (address[] memory)
function getCycleInfo() external view returns (
    uint256 duration, uint256 spent, uint256 limit, uint256 resetTimestamp
)
```

### Modifiers

```solidity
modifier onlyOwner()        // msg.sender == owner
modifier onlyActiveAgent()  // msg.sender is parentAgent OR active sub-agent
```

### How `spend()` Works

```
1. Check: not paused
2. Check: caller is parentAgent or active sub-agent
3. Check: if whitelistEnabled → recipient in whitelist
4. Check: if capEnabled → amount <= perTransactionCap
5. Check: if rateLimitEnabled → reset cycle if expired, cycleSpent + amount <= cycleRateLimit
6. Check: amount <= getAvailableYield()
7. If caller is sub-agent → check spent + amount <= budgetCap
8. Transfer wstETH to recipient
9. Update totalSpentWstETH += amount
10. Update cycleSpent += amount
11. If sub-agent → update subAgents[caller].spent += amount
```

### How Principal Stays Locked

- `principalWstETH` tracks total deposited wstETH
- `spend()` can only send yield (value above initial deposit)
- Only `withdrawPrincipal()` can move principal → requires `onlyOwner`
- No function allows any agent to touch principal

### How Yield Is Calculated

```solidity
function getAvailableYield() public view returns (uint256) {
    uint256 currentStETHValue = IWstETH(wstETH).getStETHByWstETH(principalWstETH);
    uint256 yieldStETH = currentStETHValue - initialStETHValue;
    uint256 yieldWstETH = IWstETH(wstETH).getWstETHByStETH(yieldStETH);
    uint256 spendable = yieldWstETH > totalSpentWstETH ? yieldWstETH - totalSpentWstETH : 0;
    return spendable;
}
```

---

## Interfaces

```solidity
// interfaces/IWstETH.sol
interface IWstETH {
    function wrap(uint256 stETHAmount) external returns (uint256);
    function unwrap(uint256 wstETHAmount) external returns (uint256);
    function getStETHByWstETH(uint256 wstETHAmount) external view returns (uint256);
    function getWstETHByStETH(uint256 stETHAmount) external view returns (uint256);
    function stEthPerToken() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

// interfaces/ILido.sol
interface ILido {
    function submit(address referral) external payable returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}
```

---

## FE ↔ Contract Mapping

| FE Component | Contract Function | Unit |
|---|---|---|
| Stake ETH button | `depositETH()` | ETH → auto-stake + wrap |
| Wrap & Lock button | `depositStETH()` | stETH → auto-wrap |
| Treasury Overview — principal | `getPrincipalValue()` | wstETH |
| Treasury Overview — yield | `getAvailableYield()` | wstETH |
| Treasury Overview — spent | `totalSpentWstETH` | wstETH |
| Set Permissions — whitelist toggle | `setWhitelistEnabled()` | bool |
| Set Permissions — add address | `addToWhitelist()` | address |
| Set Permissions — remove address | `removeFromWhitelist()` | address |
| Set Permissions — cap toggle | `setCapEnabled()` | bool |
| Set Permissions — cap amount | `setPerTransactionCap()` | wstETH |
| Set Permissions — rate limit toggle | `setRateLimitEnabled()` | bool |
| Set Permissions — rate limit amount | `setCycleRateLimit()` | wstETH |
| Setup Hierarchy — add sub-agent | `addSubAgent()` | address, role, cap |
| Setup Hierarchy — pause sub-agent | `pauseSubAgent()` | address |
| Setup Hierarchy — resume sub-agent | `resumeSubAgent()` | address |
| Budget & Cycle — cycle duration | `setCycleDuration()` | seconds |
| Budget & Cycle — cycle info | `getCycleInfo()` | view |
| Budget & Cycle — allocated | sum of sub-agent budgetCaps | wstETH |
| Budget & Cycle — unallocated | yield - sum(budgetCaps) | wstETH |
| Trigger Spend — select agent | determines `msg.sender` | — |
| Trigger Spend — spend button | `spend(to, amount)` | wstETH |
| Spend Log | `Spend` event logs | wstETH |
| Agent Hub — AI Chat payment | `spend(to, amount)` via x402 | wstETH |
| Active Services — revoke | `removeFromWhitelist()` | address |
| **Withdraw Principal** (MISSING in FE) | `withdrawPrincipal()` | wstETH |
| **Set Agent** (MISSING in FE) | `setParentAgent()` | address |
| **Pause/Unpause** (MISSING in FE) | `pause()` / `unpause()` | — |

---

## FE Controls to Add

These contract functions exist but have no UI yet:

### 1. Withdraw Principal
Add button in Treasury Overview or Budget & Cycle tab:
```
[Withdraw Principal] → calls withdrawPrincipal(amount)
Only visible to owner
```

### 2. Set Agent Address
Add in Configuration tab:
```
Agent Address: [0x...] [Change] → calls setParentAgent(address)
Only visible to owner
```

### 3. Global Pause/Unpause
Add in Quick Actions or Configuration tab:
```
[Pause All Spending] / [Resume Spending] → calls pause() / unpause()
Only visible to owner
```

---

## Events

```solidity
event Deposited(address indexed owner, uint256 wstETHAmount, uint256 stETHValue);
event PrincipalWithdrawn(address indexed owner, uint256 wstETHAmount);
event AgentSet(address indexed agent);
event SubAgentAdded(address indexed agent, string role, uint256 budgetCap);
event SubAgentRemoved(address indexed agent);
event SubAgentPaused(address indexed agent);
event SubAgentResumed(address indexed agent);
event Spent(address indexed agent, address indexed to, uint256 wstETHAmount);
event WhitelistUpdated(address indexed recipient, bool added);
event PermissionUpdated(string permissionType, uint256 value);
event Paused();
event Unpaused();
event CycleReset(uint256 timestamp);
```

---

## Testing (Fork-based, No Mocks)

```bash
forge test --fork-url https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

### Test Cases

| # | Test | What It Verifies |
|---|------|-----------------|
| 1 | depositETH | ETH → stETH → wstETH, principal recorded |
| 2 | depositStETH | stETH → wstETH, principal snapshot |
| 3 | depositWstETH | Direct wstETH deposit, principal updated |
| 4 | Yield accrual | Fast-forward time, `getAvailableYield()` > 0 |
| 5 | Parent agent spend | Spend yield to whitelisted address, principal untouched |
| 6 | Sub-agent spend | Spend within budget cap |
| 7 | Sub-agent over-budget | Spend above cap reverts |
| 8 | Whitelist on | Spend to non-whitelisted address reverts |
| 9 | Whitelist off | Toggle off, spend to any address works |
| 10 | Per-tx cap | Spend above cap reverts |
| 11 | Cycle rate limit | Spend above cycle limit reverts, resets after cycle |
| 12 | Pause | All agent spending reverts when paused |
| 13 | Sub-agent pause | Paused sub-agent reverts, others still work |
| 14 | Owner withdraw | Owner can withdraw principal |
| 15 | Agent cannot withdraw | No function for agent to touch principal |

---

## File Structure

```
contracts/
├── src/
│   ├── AgentTreasury.sol
│   └── interfaces/
│       ├── IWstETH.sol
│       └── ILido.sol
├── test/
│   └── AgentTreasury.t.sol
├── script/
│   └── Deploy.s.sol
├── foundry.toml
└── remappings.txt
```

---

## Deployment

**Target:** Ethereum Mainnet (strongest submission, real stETH/wstETH)

```bash
forge script script/Deploy.s.sol --rpc-url $ETH_RPC_URL --broadcast --verify
```

---

## Summary

| Component | Status |
|-----------|--------|
| Lido stETH | Deployed, we call `submit()` |
| wstETH | Deployed, we call `wrap()`, `getStETHByWstETH()` |
| **AgentTreasury.sol** | **WE BUILD** — deposits, yield, permissions, multi-agent, spend |
| **IWstETH.sol** | **WE BUILD** — interface |
| **ILido.sol** | **WE BUILD** — interface |
| **AgentTreasury.t.sol** | **WE BUILD** — fork tests |
| **Deploy.s.sol** | **WE BUILD** — deployment |
| **FE missing controls** | **WE ADD** — withdraw, set agent, pause button |
