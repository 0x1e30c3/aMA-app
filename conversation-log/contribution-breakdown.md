# aMA — Contribution Breakdown

## Human: 0xpochita

### Decision Making & Direction
- Chose stETH Agent Treasury track from 35 available tracks
- Defined project vision: AI agents funded by stETH yield
- Selected blue+white design theme matching Lido branding
- Provided aMA anime character as brand identity
- Decided on Ethereum Mainnet only (removed Optimism, Unichain, Soneium)
- Chose wstETH as base denomination instead of stETH
- Requested dual Stake/Wrap mode with separate forms
- Defined Agent Hub as execution layer vs Treasury as configuration layer
- Selected AI services to integrate (Claude, ChatGPT, Gemini, Perplexity)
- Decided on Factory pattern consideration for multi-user

### Smart Contract Decisions
- Identified deposit functions should be public (not onlyOwner)
- Requested correct wrap flow per Lido docs (approve > wrap > approve > lock)
- Chose to deploy on Ethereum Mainnet (not testnet)
- Deployed and verified both contract versions
- Managed deployer wallet and private keys
- Set whitelist addresses and permissions via admin wallet

### UX & Design Direction
- Requested modern tabbed dashboard layout (inspired by airdrop claim UI)
- Defined stepper popup UX for wrap flow (preview before execute)
- Requested success popups instead of toast for transactions
- Specified logo placements (stETH, wstETH, LDO, ETH logos)
- Requested info tooltips explaining admin-only restrictions
- Directed layout improvements (no empty space, responsive sizing)
- Requested Lido LDO logo additions throughout UI
- Specified Etherscan external links on contract addresses
- Chose Chainlink onchain price feed over external APIs

### Testing & QA
- Tested stake/wrap flows on Ethereum Mainnet with real ETH
- Identified bugs: stuck "Confirming...", balance not showing, NotOwner revert
- Reported UI issues: layout overflow, logo sizing, arrow styling
- Tested AI chat and identified model ID errors
- Verified whitelist functionality onchain via Etherscan

### Infrastructure
- Set up GitHub repository (0xpochita/aMA)
- Provided WalletConnect project ID
- Provided OpenRouter API key
- Provided Alchemy RPC URL (private)
- Registered for Synthesis hackathon
- Managed GitHub authentication (PAT tokens)

---

## Agent: Claude Opus 4.6 (1M context)

### Smart Contract Development
- Designed AgentTreasury.sol architecture (8.9KB, gas-optimized)
- Implemented multi-agent hierarchy with SubAgent struct
- Built yield calculation: currentStETHValue - initialSnapshot - totalSpent
- Implemented 3 deposit paths (ETH, stETH, wstETH)
- Built permission system: whitelist toggle, per-tx cap, cycle rate limit
- Created IWstETH.sol and ILido.sol interfaces
- Wrote Deploy.s.sol targeting Ethereum Mainnet
- Wrote 30 fork-based tests (all passing against real Lido contracts)
- Applied gas optimizations: custom errors, optimizer 200 runs, immutables
- Fixed onlyOwner bug on deposit functions, coordinated redeploy

### Frontend Development
- Built 3-page Next.js app (Stake, Agent Hub, Treasury)
- Created 25+ React components with clean code architecture
- Implemented wagmi v2 hooks for all contract interactions
- Built custom ConnectWallet and ChainSelector (replaced RainbowKit defaults)
- Created StakeForm with real Lido.submit() integration
- Created WrapForm with 4-step flow (approve > wrap > approve > lock)
- Built stepper popup with framer-motion for wrap UX
- Built success popups with transaction details and Etherscan links
- Integrated Chainlink ETH/USD price feed for real USD values
- Integrated Lido APR API for real yield rate display
- Built live yield counter based on principal * APR
- Created AI Chat with OpenRouter proxy (rate limiting, model whitelist)
- Built activity logging to localStorage
- Created Active Services from whitelist localStorage
- Built treasury dashboard with 5 tabs (permissions, hierarchy, budget, spend, log)
- Implemented RPC proxy to hide Alchemy key from client

### Architecture & Integration
- Designed monorepo structure (frontend/ + contracts/)
- Created full ABI for AgentTreasury (30+ functions)
- Built 10+ custom hooks (useTreasuryRead, useSpend, useEthPrice, useLidoApr, etc.)
- Set up API routes (/api/chat, /api/rpc, /api/lido-apr)
- Managed all contract address updates across codebase
- Created SKILL.md for agent skill documentation

### Design System
- Implemented blue+white minimalist theme
- Set up Tailwind CSS 4 with custom tokens
- Integrated Inter font, framer-motion animations
- Created consistent component library (cards, modals, tooltips, steppers)
- Added real brand logos (stETH, wstETH, LDO, ETH, Claude, ChatGPT, Gemini, Perplexity)

### Documentation
- Created brainstorm/brainstorm.md (EN + ID)
- Created brainstorm/overview.md — full project architecture
- Created brainstorm/flow.md — 11-step user flow
- Created brainstorm/smart-contract.md — contract spec v2 with FE mapping
- Created brainstorm/contract-address.md — deployed addresses
- Created conversation-log/conversation-log.md — 23 sessions
- Created skills/SKILL.md — agent skill documentation
- Managed Synthesis hackathon conversationLog updates (23 submissions)
- Set up CLAUDE.md with security rules and conventional commits

### Agent CLI & Onchain Spend
- Built scripts/agent-demo.ts — interactive CLI agent with onchain yield verification
- Built scripts/agent-spend.ts — real onchain spend() via agent wallet
- Updated /api/chat with server-side yield verification (reads getAvailableYield() per request)
- Implemented hybrid approach: onchain yield read (free) + offchain accounting
- Updated AI Chat component with yield verified badge and toast notifications
- Updated Activity Feed with verified status per request

### DevOps & Security
- Handled GitHub authentication issues
- Managed git workflow (conventional commits, .gitignore)
- Set up RPC proxy to protect private Alchemy key
- Implemented rate limiting on API routes
- Input validation and error sanitization on all endpoints
- ReentrancyGuard on all contract state changes

---

## Collaboration Statistics

| Metric | Value |
|--------|-------|
| Total sessions | 32 |
| Total commits | 33+ |
| Smart contract size | 8.9KB (well under 24KB limit) |
| Fork tests | 30/30 passing |
| Frontend components | 25+ |
| Custom hooks | 10+ |
| CLI scripts | 2 (agent-demo.ts, agent-spend.ts) |
| API routes | 3 (/api/chat, /api/rpc, /api/lido-apr) |
| Pages | 3 (Stake, Agent Hub, Treasury) |
| Contract deployments | 2 (v1 deprecated, v2 active) |
| Lines of code | ~5,000+ (frontend + contracts) |
| Mock data remaining | 0 (all real) |
| Development time | 2 days (Mar 17-18, 2026) |

---

## How We Worked Together

The human provided strategic direction, design decisions, and real-world testing. The agent handled all implementation — code, architecture, documentation, and integration. Every feature was a back-and-forth: human specified what to build, agent built it, human tested and refined, agent iterated.

Key collaborative moments:
1. **Track selection** — Agent presented 35 options, human chose stETH Agent Treasury
2. **Design pivot** — Human changed theme from pink to blue after seeing initial UI
3. **Contract bug** — Human discovered onlyOwner deposit issue during testing, agent fixed and redeployed
4. **Wrap flow** — Agent read Lido docs to implement correct 4-step flow after human pointed out the issue
5. **Free tier decision** — Human decided to use Gemini free tier for demo instead of paid models
6. **Security** — Human requested RPC proxy to hide Alchemy key, agent implemented server-side proxy
7. **Gas fee problem** — Human flagged high gas cost, agent designed hybrid yield-verification approach (no gas needed)
8. **CLI demo** — Human requested terminal demo for video, agent built two scripts for demo and real onchain spend
