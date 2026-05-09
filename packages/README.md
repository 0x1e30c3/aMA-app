# Confidential Agent Treasury - Zama Protocol

A yield-bearing operating budget for AI agents with full onchain privacy using Zama Protocol's Fully Homomorphic Encryption (FHE).

## Overview

This project demonstrates how to build confidential smart contracts using Zama's FHEVM. The ConfidentialAgentTreasury contract keeps all financial data encrypted onchain:

- **Principal** (wstETH deposits) - encrypted
- **Available Yield** - encrypted  
- **Total Spent** - encrypted
- **User Balances** - encrypted

Only the owner can decrypt their balance, and only the agent can decrypt available yield.

## Tech Stack

- **Smart Contracts**: Solidity + FHEVM (Zama)
- **Frontend**: Next.js + @zama-fhe/sdk + Wagmi
- **Network**: Sepolia Testnet (for demo)
- **Deployment**: Hardhat

## Project Structure

```
packages/
├── contracts/                    # Smart contracts (Hardhat)
│   ├── contracts/
│   │   └── ConfidentialAgentTreasury.sol
│   ├── deploy/
│   │   └── deploy.ts            # Deployment script
│   └── hardhat.config.ts
│
└── frontend/
    └── packages/
        └── nextjs/               # Next.js frontend
            ├── contracts/
            │   └── ConfidentialAgentTreasury.ts
            └── hooks/
                └── useConfidentialTreasury/  # FHE integration hook
```

## Setup & Deployment

### 1. Contracts

```bash
cd packages/contracts
npm install

# Set environment variables
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY

# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Update contract address in:
# packages/frontend/packages/nextjs/contracts/ConfidentialAgentTreasury.ts
```

### 2. Frontend

```bash
cd packages/frontend
pnpm install
pnpm dev
```

## Key FHE Features

### Encrypted Data Types
```solidity
euint64 public principalWstETH;
euint64 public availableYield;
euint64 public totalSpentWstETH;
mapping(address => euint64) public encryptedBalances;
```

### Access Control
```solidity
function grantAccessToBalance() external {
    euint64 bal = encryptedBalances[msg.sender];
    FHE.allow(bal, msg.sender);  // Grant decryption permission
}
```

### Frontend Encryption/Decryption
```typescript
const { decryptValues, deposit, spend } = useConfidentialTreasury();

// Encrypt input for deposit
await deposit(amount);

// Decrypt user's encrypted balance
await decryptValues();
```

## Documentation

- [Zama Protocol Docs](https://docs.zama.ai/protocol)
- [FHEVM Quick Start](https://docs.zama.org/protocol/solidity-guides/getting-started/quick-start-tutorial)
- [Zama SDK](https://github.com/zama-ai/sdk)

## Submission

- **Demo**: Working dApp with FHE features
- **Deadline**: May 10th, 23:59 AOE
- **Form**: https://forms.gle/h2vdBaZ9zwmLVzeu5
- **Reward**: 1000 cUSDT (5 winners)

## License

BSD-3-Clause-Clear