# aMA → Confidential Agent Treasury (Zama Protocol)

## Overview
Mengadaptasi proyek aMA yang sudah ada untuk menggunakan Zama Protocol's Fully Homomorphic Encryption (FHE), sehingga semua data sensitif (saldo, yield, spending) tetap terenkripsi di blockchain sambil tetap dapat di-compute.

## Konsep Utama

### Sebelum (aMA - Public)
```
Human deposits ETH → stETH → wstETH → AgentTreasury (visible)
- Semua saldo terlihat di blockchain
- Semua limit dan budget terlihat
- Semua transaksi terlihat
```

### Sesudah (Confidential Agent Treasury)
```
Human deposits ETH → stETH → wstETH → AgentTreasury (encrypted)
- Saldo principal terenkripsi (euint64)
- Available yield terenkripsi
- Semua limit dan budget terenkripsi
- Hanya owner yang bisa decrypt miliknya
- Hanya agent yang bisa decrypt yield yang tersedia
```

## Tech Stack Baru

### Dari
- Solidity + Foundry (contracts)
- Next.js 16 + wagmi + RainbowKit (frontend)

### Menjadi
- Solidity + FHEVM library (contracts)
- Next.js + FHEVM SDK (frontend)
- Sepolia Testnet (deployment)

## Langkah Migrasi

### Step 1: Clone Zama Templates

#### Contracts (fhevm-hardhat-template)
```bash
git clone https://github.com/zama-ai/fhevm-hardhat-template.git packages/contracts
cd packages/contracts
npm install
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
```

#### Frontend (fhevm-react-template)
```bash
git clone --recursive https://github.com/zama-ai/fhevm-react-template.git packages/frontend
cd packages/frontend
pnpm install
```

### Step 2: Adapt Smart Contracts

#### Kontrak Utama: ConfidentialAgentTreasury.sol

**Data yang perlu di-encrypt:**
```solidity
// Public (visible)
address public owner;
address public agent;
bool public isPaused;

// Encrypted (euint64)
euint64 public principalWstETH;      // Principal yang terkunci
euint64 public availableYield;      // Yield yang bisa di-spent
euint64 public totalSpentWstETH;    // Total yang sudah di-spent
euint64 public perTxCap;             // Batas per transaksi
euint64 public cycleLimit;          // Batas per cycle
mapping(address => euint64) public agentBudgetCaps;  // Budget per sub-agent
```

**Fungsi yang perlu di-modify:**
```solidity
// Deposit - input terenkripsi
function depositWstETH(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
    euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
    principalWstETH = FHE.add(principalWstETH, amount);
    // Calculate yield dari stEthPerToken change
}

// Spend - hanya agent bisa, dengan encrypted amount
function spend(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
    require(msg.sender == agent, "Only agent");
    euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
    
    // Verify cukup yield tersedia
    euint64 remaining = FHE.sub(availableYield, amount);
    
    // Verify tidak exceeds perTxCap
    euint64 isWithinCap = FHE.lt(amount, perTxCap);
    // ... 
    
    availableYield = FHE.sub(availableYield, amount);
    totalSpentWstETH = FHE.add(totalSpentWstETH, amount);
}
```

**Access Control:**
```solidity
// Setelah deposit, owner bisa lihat saldo mereka
function getPrincipalBalance() external view returns (euint64) {
    FHE.allow(principalWstETH, msg.sender);
    return principalWstETH;
}

// Agent bisa lihat available yield
function getAvailableYield() external view returns (euint64) {
    require(msg.sender == agent);
    FHE.allow(availableYield, msg.sender);
    return availableYield;
}
```

### Step 3: Setup Frontend dengan FHEVM SDK

#### Install Dependencies
```bash
cd packages/frontend
pnpm add @zama-fhe/sdk @zama-fhe/react-sdk
```

#### Konfigurasi Encryption/Decryption
```typescript
// lib/fhevm.ts
import { createInstance } from '@zama-fhe/sdk';

const fhevm = createInstance({
  network: 'sepolia', // atau 'localhost'
});
```

#### Contoh: Encrypt Input untuk Deposit
```typescript
// hooks/useConfidentialTreasury.ts
import { fhevm } from '@/lib/fhevm';

async function deposit(amount: bigint, signer: Wallet) {
  const encryptedInput = await fhevm
    .createEncryptedInput(contractAddress, signer.address)
    .add64(amount)
    .encrypt();
  
  await contract.write.depositWstETH([
    encryptedInput.handle,
    encryptedInput.inputProof,
  ]);
}
```

#### Contoh: Decrypt Balance
```typescript
async function getMyBalance(signer: Wallet) {
  const handle = await contract.read.getPrincipalBalance();
  const balance = await fhevm.userDecryptEuint(
    FhevmType.euint64,
    handle,
    contractAddress,
    signer
  );
  return balance;
}
```

### Step 4: Deployment ke Sepolia

```bash
# Deploy contracts
cd packages/contracts
npx hardhat deploy --network sepolia

# Verify di Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Step 5: Update Frontend Config

```typescript
// packages/frontend/packages/nextjs/scaffold.config.ts
const defaultChain = chains.sepolia; // Ganti dari mainnet ke Sepolia

// packages/nextjs/contracts/deployedContracts.ts
// Update dengan contract addresses dari deployment
```

## Perbedaan Kunci

| Aspek | aMA (Lama) | Confidential (Baru) |
|-------|------------|---------------------|
| Saldo Principal | Public (uint256) | Encrypted (euint64) |
| Available Yield | Public (uint256) | Encrypted (euint64) |
| Total Spent | Public (uint256) | Encrypted (euint64) |
| Per-Tx Cap | Public (uint256) | Encrypted (euint64) |
| Cycle Limit | Public (uint256) | Encrypted (euint64) |
| Agent Budget | Public (mapping) | Encrypted (mapping) |
| Access Control | Only owner/agent | ACL via FHE.allow() |

## Timeline

### Hari 1-2: Setup & Contracts
- [ ] Clone templates
- [ ] Setup environment
- [ ] Convert AgentTreasury ke FHE

### Hari 3-4: Frontend Integration
- [ ] Install FHEVM SDK
- [ ] Update hooks untuk encryption/decryption
- [ ] Update UI components

### Hari 5: Testing & Deployment
- [ ] Test di local Hardhat node
- [ ] Deploy ke Sepolia
- [ ] Verify contracts

### Hari 6: Documentation & Demo
- [ ] Write project documentation
- [ ] Record 2-minute video demo
- [ ] Submit ke form

## Referensi

- [Zama Protocol Docs](https://docs.zama.ai/protocol)
- [FHEVM Quick Start](https://docs.zama.org/protocol/solidity-guides/getting-started/quick-start-tutorial)
- [ERC7984 Confidential Token](https://docs.zama.org/protocol/examples/openzeppelin-confidential-contracts/erc7984)
- [fhevm-hardhat-template](https://github.com/zama-ai/fhevm-hardhat-template)
- [fhevm-react-template](https://github.com/zama-ai/fhevm-react-template)

## Catatan Penting

1. **Input Proof**: Setiap input terenkripsi harus disertai ZK proof (inputProof)
2. **ACL**: Setelah operasi, perlu `FHE.allow()` agar user bisa decrypt hasil
3. **Gas**: Operasi FHE lebih mahal dari regular operations
4. **Testing**: Guna test di local, perlu jalankan `npx hardhat node` dengan FHE support
5. **Decryption**: User hanya bisa decrypt data yang mereka punya akses (via allow)

## Deliverables untuk Bounty

1. ✅ dApp Demo yang berfungsi
2. ✅ Smart contract + frontend implementation  
3. ✅ Project documentation (README, architecture docs)
4. ✅ 2-minute video demo (real person, no AI)
5. ✅ Deploy ke Sepolia testnet

## Submission

Kirim ke: https://forms.gle/h2vdBaZ9zwmLVzeu5  
Deadline: May 10th, 23:59 AOE