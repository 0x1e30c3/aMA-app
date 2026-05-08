# CLAUDE.md

## Security Rules

- NEVER commit or push files containing secrets, API keys, private keys, or tokens (.env, credentials.json, keystore files, etc.)
- NEVER log, print, or echo secrets in terminal output
- NEVER hardcode private keys, mnemonics, or API keys in source code
- NEVER include MEMORY.md in commits (already in .gitignore)
- Always verify .gitignore covers sensitive files before committing
- If a user pastes a private key or mnemonic, stop them immediately and warn them

## Git Rules

- Always review `git status` and `git diff` before committing
- Never use `git add -A` or `git add .` without checking for sensitive files first
- Never force push without user confirmation
- Never commit node_modules, .next, or build artifacts
- Use Conventional Commits for all commit messages:
  - `feat:` — new feature
  - `fix:` — bug fix
  - `refactor:` — code restructure without behavior change
  - `docs:` — documentation changes
  - `chore:` — tooling, config, dependencies
  - `test:` — adding or updating tests
  - `style:` — formatting, no logic change
  - `ci:` — CI/CD changes
  - `perf:` — performance improvement
  - Include scope when relevant, e.g. `feat(contracts):`, `fix(frontend):`

## Smart Contract Rules

- Never deploy contracts with hardcoded private keys
- Always use environment variables for RPC URLs and deployer keys
- Verify contract addresses before interacting — never hallucinate addresses
- Use SafeERC20 for token interactions
- Be aware that USDC has 6 decimals, not 18

## Project Context

- Monorepo: `frontend/` (Next.js) and `contracts/` (Solidity/Foundry)
- Track: stETH Agent Treasury (Lido Labs Foundation)
- Network: Holesky testnet for development, mainnet for production
