# aMA Agent Instructions

## Monorepo Structure
- `frontend/` - Next.js 16 app (App Router, TypeScript, Tailwind CSS 4)
- `contracts/` - Solidity smart contracts (Foundry)
- Commands must be run from the appropriate subdirectory

## Developer Commands

### Frontend
- Install: `pnpm install` (from frontend/)
- Dev server: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint` (uses biome)
- Format: `pnpm format` (uses biome)

### Smart Contracts
- Install: `forge install` (from contracts/)
- Build: `forge build`
- Test: `forge test --fork-url https://eth.drpc.org -v` (runs against real Lido contracts on Ethereum Mainnet)
- Deploy: `forge script script/Deploy.s.sol:Deploy --rpc-url eth_mainnet --broadcast --verify`

## Key Conventions

### Package Manager
- Always use `pnpm` in frontend/, never npm or yarn
- Foundry is used for contracts (forge, cast, anvil)

### Testing
- All contract tests run against real Lido contracts via fork testing (no mocks)
- Test command must include `--fork-url https://eth.drpc.org -v`
- 30/30 tests passing in contracts/test/

### Environment Variables
- Frontend requires `.env.local` with:
  - `NEXT_PUBLIC_WC_PROJECT_ID`
  - `RPC_URL`
  - `OPENROUTER_API_KEY`
  - For agent scripts: `AGENT_PRIVATE_KEY`, `SERVICE_RECIPIENT`, `COST_PER_REQUEST`

### Agent CLI Scripts
Run from frontend/ after sourcing env:
- Interactive demo: `npx tsx scripts/agent-demo.ts`
- Single chat: `npx tsx scripts/agent-demo.ts --chat "message"`
- Status only: `npx tsx scripts/agent-demo.ts --status`
- Onchain spend: `npx tsx scripts/agent-spend.ts [amount]`

### Frontend-Specific Conventions
- Component location: Page-scoped components must live in `src/components/pages/(scope)`
- Import discipline: All imports must go through index files only; pages never import internal files directly
- State management: Use Zustand for all state and data fetching
- Types: All types/interfaces must live in a dedicated shared types folder
- Performance: Implement lazy loading where applicable; prevent unnecessary re-renders
- UI/UX: Never use emojis, gradients, colorful designs, heavy shadows, or flashy effects
- Design System: Strict Blue + White minimalist theme (Primary: #2563eb, Background: white/light slate, Text: slate dark #0f172a)
- Feedback: Always use sonner toast for feedback; never show raw error messages
- Styling: Use global utility classes; avoid inline styles
- Build: Always run `pnpm run build` after completing tasks (zero errors/warnings required)

### Smart Contract-Specific Conventions
- Security: Never hardcode private keys, mnemonics, or API keys in source code
- Address verification: Always verify contract addresses before interacting; never hallucinate addresses
- Token handling: Use SafeERC20 for token interactions; be aware USDC has 6 decimals (not 18)
- Testing: All tests run against real Lido contracts via fork testing (no mocks)
- Environment: Use environment variables for RPC URLs and deployer keys

### Git & Security Conventions
- Secrets: Never commit/push files containing secrets (.env, credentials.json, keystore files)
- Logging: Never log, print, or echo secrets in terminal output
- Git hygiene: Always review `git status` and `git diff` before committing; never use `git add -A` without checking
- Commits: Use Conventional Commits (feat:, fix:, refactor:, docs:, chore:, test:, style:, ci:, perf:)
- Force push: Never force push without user confirmation
- Artifacts: Never commit node_modules, .next, or build artifacts

### Architecture Notes
- Principal (wstETH) is structurally locked in AgentTreasury - no withdrawal function exists
- Agent can only spend yield (staking rewards) from Lido, not principal
- All spending enforced onchain: whitelists, per-tx caps, cycle limits
- Real-time data sources: Chainlink (ETH price), Lido API (APR), ERC20 (balances)