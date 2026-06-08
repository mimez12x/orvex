# ORVEX DEX

> Premium AMM decentralized exchange built natively on the **LitVM LiteForge Testnet** (Chain ID `4441`). Swap, provide liquidity, mint testnet assets, and track positions — fully on-chain, fully non-custodial.

<p align="center">
  <a href="https://orvexdex.lovable.app"><strong>Live App →</strong></a> ·
  <a href="https://orvexdex.lovable.app/docs"><strong>Documentation →</strong></a> ·
  <a href="https://liteforge.explorer.caldera.xyz"><strong>Explorer →</strong></a>
</p>

---

## About ORVEX

ORVEX is an **Automated Market Maker (AMM)** based on a UniswapV2 fork, specifically designed for the **LitVM LiteForge** ecosystem — a lightweight zk-rollup with the native token `zkLTC`. ORVEX combines **battle-tested contracts** (UniswapV2 Factory + Router02) with a **premium dark-neon interface** focused on speed, transparency, and institutional-grade UX.

Every action — swap, wrap/unwrap, add/remove liquidity, faucet claim — is executed as a real on-chain transaction on LitVM and signed by the user's wallet. **No simulations, no custodial layer, no off-chain order book.**

## Problems ORVEX Solves

| Problem in the testnet/zk-rollup ecosystem | ORVEX Solution |
|---|---|
| No liquidity venue for new zk-rollup native assets | Full AMM with factory + router already deployed |
| Manual zkLTC wrap/unwrap via block explorer | **WRAP / UNWRAP** auto buttons on the Swap page |
| Repeated token approval on every interaction | Smart approval — checks `allowance` first, only prompts when needed |
| Hard to get test tokens for dApp testing | On-chain multi-token faucet with cooldown + per-user limit |
| No dashboard for LPs to track positions | Portfolio + Pools pages with Multicall batching |
| Wallet fragmentation UX (MetaMask vs OKX vs Rabby vs Bitget) | EIP-6963 wallet picker with auto add-network |
| No visibility on network TVL/volume | Analytics page with real-time on-chain aggregation |

## Technology

### Smart Contracts (already deployed on LitVM LiteForge)
- **UniswapV2 Factory** — `0x42e4E19020aa23947e1BE3260b7e4CCFDd246128`
- **UniswapV2 Router02** — `0x03D2D542100fa926de135a08B609c8538E45F6ee`
- **UniswapV2 Library** — `0x998AEFD25622eCB6D6Fb8eBE87B01dC930d712a0`
- **Multicall3** — `0x25E7345084F79efC1b296d0c4a1B664191544bC4`
- **WzkLTC (WETH9)** — `0x3A153e8BcDe02F4Cf6C5eeECD9c83bC0296FFbD3`
- **Faucet (multi-token)** — `0x1C9FAFD0A5803d51EB2BEb9D54304cAe574734CF`

### Frontend Stack
- **React 19** + **TanStack Start v1** (SSR + file-based routing)
- **Vite 7** build pipeline, deployed to Cloudflare Workers (Edge)
- **wagmi v2** + **viem** for on-chain interaction & signing
- **@tanstack/react-query** for caching and revalidation
- **Tailwind CSS v4** with design tokens (OKLCH palette)
- **shadcn/ui** + custom premium dark-neon components
- **EIP-6963** wallet discovery (MetaMask, OKX, Rabby, Bitget)
- **Multicall3** batching for efficient reads

### Network
| Field | Value |
|---|---|
| Chain Name | LitVM LiteForge Testnet |
| Chain ID | `4441` |
| RPC URL | `https://liteforge.rpc.caldera.xyz/http` |
| Explorer | `https://liteforge.explorer.caldera.xyz` |
| Native Symbol | `zkLTC` |

## Supported Tokens

| Logo | Symbol | Name | Address |
|---|---|---|---|
| <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/2.png" width="24" /> | **zkLTC** | LitVM zkLTC (native) | — |
| <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/2.png" width="24" /> | **wzkLTC** | Wrapped zkLTC | `0x3A153e8BcDe02F4Cf6C5eeECD9c83bC0296FFbD3` |
| <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png" width="24" /> | **TRX** | TRON | `0x8705875084c72C0cDC01c1Ac36A807808c8E5850` |
| <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/52.png" width="24" /> | **XRP** | XRP | `0xA860Fc63d7C3d5cAf5295dE72AEeb4260D7819D4` |
| <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png" width="24" /> | **ADA** | Cardano | `0x7b277d0387ccDFC395Eae0EFe2321765afAb37c8` |
| <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/1437.png" width="24" /> | **ZEC** | Zcash | `0x0177E73214265D1d6f29a273155803Af5Bf47cFa` |
| <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/328.png" width="24" /> | **XMR** | Monero | `0x05466944d61662225ad19916725975230bb5b2B7` |
| 🟣 | **ORVX** | Orvex Token (governance) | `0x7216EAb89cDbb52D3D8A0e2F305F9Afb5cE122a3` |

## Roadmap

### Phase 1 — Foundation ✅
- Deploy UniswapV2 Factory, Router02, Library, Multicall3 to LitVM LiteForge
- Deploy WzkLTC (WETH9) for native token wrap/unwrap
- Deploy 6 testnet ERC-20s (TRX, XRP, ADA, ZEC, XMR, ORVX)
- Deploy multi-token Faucet with cooldown + max-claim per user

### Phase 2 — Core DEX UX ✅
- TanStack Start scaffold + wagmi v2 + viem integration
- Wallet picker EIP-6963 (MetaMask, OKX, Rabby, Bitget) + auto add-network
- Swap engine with auto-routing WRAP / UNWRAP / SWAP
- Add / Remove Liquidity with smart approval (check allowance first)
- Pools listing via Factory `allPairsLength` + Multicall reserves
- Portfolio: token balances + LP positions via Multicall
- Faucet UI with 3D animated drip card
- Premium dark-neon design system (OKLCH tokens, gradient brand)

### Phase 3 — Polish & Discovery ✅
- Analytics page: TVL, volume 24h, top pools, liquidity distribution
- Admin panel for faucet owner (setToken, setClaimAmount, refill, etc.)
- Brand & Style Guide page (`/brand`)
- Full SEO pipeline (sitemap.xml, robots.txt, llms.txt, canonical, OG/Twitter)
- Activity Feed real-time on-chain events
- Custom token import (per-user)
- Complete documentation (`/docs`)

### Phase 4 — Liquidity & Incentives (In Progress)
- Liquidity Mining program (LP staking → ORVX rewards)
- Trading competitions with leaderboard
- On-chain referral system
- Boosted pools (multiplier for specific pairs)
- Limit orders (off-chain matching, on-chain settlement)

### Phase 5 — Advanced Trading
- Multi-hop smart router (UI for more than 2 hops)
- Concentrated Liquidity (UniswapV3-style pools)
- Price chart per pool (TradingView lightweight charts)
- Slippage protection & MEV-aware routing
- Subgraph deployment (self-hosted graph-node)

### Phase 6 — Governance & DAO
- ORVX → veORVX vote-escrow model
- On-chain governance (proposals + voting)
- Treasury management with timelock
- Fee switch (protocol fee to veORVX holders)
- Gauge weights for liquidity mining direction

### Phase 7 — Multi-Chain & Mainnet
- Contract audit (external, public report)
- Bug bounty program
- Native bridge to LitVM Mainnet
- Deployment to LitVM Mainnet
- Cross-rollup liquidity routing

### Phase 8 — Ecosystem
- Public SDK (`@orvex/sdk`) for third-party integrations
- Aggregator API (REST + GraphQL)
- Mobile-first PWA + push notifications
- Fiat on-ramp integration
- Grants program for builders on top of ORVEX

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Production build
bun run build
```

## License

MIT © ORVEX Labs
