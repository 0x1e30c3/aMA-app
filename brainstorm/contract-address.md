# aMA — Contract Addresses (Ethereum Mainnet)

## Our Deployed Contract

| Contract | Address | Network |
|----------|---------|---------|
| **AgentTreasury** | [`0x783e1512bFEa7C8B51A92cB150FEb5A04b91E9Aa`](https://etherscan.io/address/0x783e1512bFEa7C8B51A92cB150FEb5A04b91E9Aa) | Ethereum Mainnet |

Deployed and verified on Etherscan. Source code publicly viewable.

---

## Lido Finance Contracts (Used by AgentTreasury)

| Contract | Address | Usage |
|----------|---------|-------|
| **Lido (stETH)** | [`0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84`](https://etherscan.io/address/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84) | `submit()` to stake ETH and receive stETH |
| **wstETH** | [`0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0`](https://etherscan.io/address/0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0) | `wrap()`, `unwrap()`, `getStETHByWstETH()`, `stEthPerToken()` |

---

## How They Connect

```
User sends ETH
       |
       v
Lido (0xae7a...)
  submit() -> returns stETH
       |
       v
wstETH (0x7f39...)
  wrap() -> converts stETH to wstETH
       |
       v
AgentTreasury (0xf5b4...)
  principalWstETH locked
  yield accrues via stEthPerToken() increase
  agent spends yield via spend()
```

---

## Contract Interactions

### Deposit ETH (auto-stake + wrap)
```
User -> AgentTreasury.depositETH{value: X}()
  -> Lido.submit() -> receives stETH
  -> wstETH.wrap() -> converts to wstETH
  -> records principal + stETH snapshot
```

### Deposit stETH (auto-wrap)
```
User approves stETH to AgentTreasury
User -> AgentTreasury.depositStETH(amount)
  -> wstETH.wrap() -> converts to wstETH
  -> records principal + stETH snapshot
```

### Agent Spend
```
Agent -> AgentTreasury.spend(to, amount)
  -> checks permissions (whitelist, cap, rate limit)
  -> checks amount <= available yield
  -> transfers wstETH to recipient
```

### Yield Calculation
```
AgentTreasury.getAvailableYield()
  -> wstETH.getStETHByWstETH(principalWstETH) = current stETH value
  -> yield = current value - initial snapshot - total spent
```
