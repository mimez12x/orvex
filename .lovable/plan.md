# ORVEX DEX — Implementation Plan

A premium dark-neon DEX integrated with the already-deployed contracts on **LitVM LiteForge Testnet** (Chain ID 4441). All transactions are real on-chain calls — no simulation.

## Deployed Contracts (already on-chain, will be wired into the frontend)

| Contract | Address |
|---|---|
| Factory (UniswapV2) | `0x42e4E19020aa23947e1BE3260b7e4CCFDd246128` |
| Router02 | `0x03D2D542100fa926de135a08B609c8538E45F6ee` |
| Library | `0x998AEFD25622eCB6D6Fb8eBE87B01dC930d712a0` |
| Multicall | `0x25E7345084F79efC1b296d0c4a1B664191544bC4` |
| WzkLTC (WETH) | `0x3A153e8BcDe02F4Cf6C5eeECD9c83bC0296FFbD3` |
| Faucet | `0x1C9FAFD0A5803d51EB2BEb9D54304cAe574734CF` |
| TRX | `0x8705875084c72C0cDC01c1Ac36A807808c8E5850` |
| XRP | `0xA860Fc63d7C3d5cAf5295dE72AEeb4260D7819D4` |
| ADA | `0x7b277d0387ccDFC395Eae0EFe2321765afAb37c8` |
| ZEC | `0x0177E73214265D1d6f29a273155803Af5Bf47cFa` |
| XMR | `0x05466944d61662225ad19916725975230bb5b2B7` |
| ORVX | `0x66E5cbb0325Ab93B42c16592Be91456cc195E427` |

Network: LitVM LiteForge — RPC `https://liteforge.rpc.caldera.xyz/http`, Explorer `https://liteforge.explorer.caldera.xyz`, native symbol `zkLTC`.

> Note: Smart contracts are already deployed (you provided addresses). I will **not** rewrite/redeploy them — I will integrate the frontend with these. Writing/testing/redeploying a UniswapV2 fork from scratch is out of scope and would be wasted work given working addresses exist.

## Branding

- Name: **ORVEX**
- Logo: uploaded image, copied to `src/assets/orvex-logo.png`
- Palette: `#050508` background, `#0A0A0F` surfaces, neon violet `#7A5CFF` + electric blue `#00E5FF` accents
- Typography: Inter, with display weight for headings
- Token logos: pulled from CoinMarketCap CDN (Litecoin logo for zkLTC/WzkLTC); ORVX uses a custom neon mark
- Wallet logos: official WalletConnect-ecosystem PNGs

## Pages (TanStack Start file routes)

1. `/` — landing/hero with CTA to Swap
2. `/swap` — swap form. Auto-switches button label: **WRAP** (zkLTC→WzkLTC), **UNWRAP** (WzkLTC→zkLTC), **SWAP** otherwise. Uses `deposit()`/`withdraw()` for wrap, Router for swaps.
3. `/liquidity` — add/remove. Approval flow only on first interaction (checks `allowance` first; reuses if already approved).
4. `/pools` — list of all pairs (via Factory `allPairsLength` + `allPairs`), with reserves & TVL via Multicall.
5. `/portfolio` — user LP positions + token balances via Multicall.
6. `/faucet` — claim tokens (per-token + claimAll), shows cooldown, claim count, max claims (3D animated drip card).
7. `/admin` — owner-only faucet admin: setToken, setClaimAmount, setCooldown, setMaxClaims, refill, adminWithdraw, setUserClaimCount.

## Wallet Support

Wagmi + viem with connectors: **MetaMask, OKX Wallet, Rabby, Bitget**. Auto-prompt to add LitVM LiteForge network. Wallet logos shown in the connect modal.

## Technical

- Stack: React + TanStack Start (existing template) + wagmi v2 + viem + @tanstack/react-query
- ABIs in `src/lib/abis/` exactly as you provided
- Addresses + chain config in `src/lib/chain.ts`
- Token registry in `src/lib/tokens.ts` with CMC logo URLs
- Hooks per feature: `useSwap`, `useLiquidity`, `usePools`, `usePortfolio`, `useFaucet`
- All reads batched via Multicall where useful
- Tx UX: pending toast → explorer link on confirm

## Build Order (most-important-first, finished to completion)

1. Chain config, ABIs, token registry, wagmi setup, wallet connect modal
2. Swap (incl. wrap/unwrap routing) — the critical path
3. Liquidity add/remove with smart approval
4. Pools listing (factory enumeration + multicall reserves)
5. Portfolio (balances + LP positions)
6. Faucet page + 3D animated UI
7. Admin page (faucet management)
8. Landing page polish, animations, responsive QA

## Out of Scope (explicit)

- Re-writing/redeploying Solidity (contracts already exist at the addresses you provided)
- The Graph subgraph deployment (will use on-chain RPC + Multicall event reads as the indexing fallback you allowed)
- CI/CD pipeline files (Lovable handles deploys)

Ready to build on approval.