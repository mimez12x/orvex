# ORVEX DEX

> Premium AMM decentralized exchange built natively on the **LitVM LiteForge Testnet** (Chain ID `4441`). Swap, provide liquidity, mint testnet assets, and track positions — fully on-chain, fully non-custodial.

<p align="center">
  <a href="https://orvexdex.lovable.app"><strong>Live App →</strong></a> ·
  <a href="https://orvexdex.lovable.app/docs"><strong>Documentation →</strong></a> ·
  <a href="https://liteforge.explorer.caldera.xyz"><strong>Explorer →</strong></a>
</p>

---

## Tentang ORVEX

ORVEX adalah **Automated Market Maker (AMM)** berbasis fork UniswapV2 yang dirancang khusus untuk ekosistem **LitVM LiteForge** — zk-rollup ringan dengan native token `zkLTC`. ORVEX menggabungkan **kontrak yang sudah teruji** (UniswapV2 Factory + Router02) dengan **antarmuka premium dark-neon** yang fokus pada kecepatan, transparansi, dan UX kelas institusional.

Setiap aksi — swap, wrap/unwrap, add/remove liquidity, faucet claim — dieksekusi sebagai transaksi nyata di on-chain LitVM dan ditandatangani oleh dompet pengguna. **Tidak ada simulasi, tidak ada custodial layer, tidak ada off-chain order book.**

## Masalah yang Diselesaikan ORVEX

| Masalah di ekosistem testnet/zk-rollup | Solusi ORVEX |
|---|---|
| Tidak ada venue likuiditas untuk aset native zk-rollup baru | AMM penuh dengan factory + router yang sudah ter-deploy |
| Wrap/unwrap zkLTC manual lewat block explorer | Tombol **WRAP / UNWRAP** otomatis di halaman Swap |
| Approval token berulang setiap interaksi | Smart approval — cek `allowance` dulu, hanya prompt jika perlu |
| Sulit dapat token uji untuk testing dApp | Faucet on-chain multi-token dengan cooldown + per-user limit |
| LP tidak punya dashboard untuk memantau posisi | Halaman Portfolio + Pools dengan Multicall batching |
| UX dompet fragmentasi (MetaMask vs OKX vs Rabby vs Bitget) | Wallet picker EIP-6963 dengan auto add-network |
| Tidak ada visibilitas TVL/volume jaringan | Halaman Analytics dengan agregasi on-chain real-time |

## Teknologi

### Smart Contracts (sudah deployed di LitVM LiteForge)
- **UniswapV2 Factory** — `0x42e4E19020aa23947e1BE3260b7e4CCFDd246128`
- **UniswapV2 Router02** — `0x03D2D542100fa926de135a08B609c8538E45F6ee`
- **UniswapV2 Library** — `0x998AEFD25622eCB6D6Fb8eBE87B01dC930d712a0`
- **Multicall3** — `0x25E7345084F79efC1b296d0c4a1B664191544bC4`
- **WzkLTC (WETH9)** — `0x3A153e8BcDe02F4Cf6C5eeECD9c83bC0296FFbD3`
- **Faucet (multi-token)** — `0x1C9FAFD0A5803d51EB2BEb9D54304cAe574734CF`

### Frontend Stack
- **React 19** + **TanStack Start v1** (SSR + file-based routing)
- **Vite 7** build pipeline, deploy ke Cloudflare Workers (Edge)
- **wagmi v2** + **viem** untuk on-chain interaction & signing
- **@tanstack/react-query** untuk caching dan revalidation
- **Tailwind CSS v4** dengan design tokens (OKLCH palette)
- **shadcn/ui** + custom premium dark-neon components
- **EIP-6963** wallet discovery (MetaMask, OKX, Rabby, Bitget)
- **Multicall3** batching untuk reads yang efisien

### Jaringan
| Field | Value |
|---|---|
| Chain Name | LitVM LiteForge Testnet |
| Chain ID | `4441` |
| RPC URL | `https://liteforge.rpc.caldera.xyz/http` |
| Explorer | `https://liteforge.explorer.caldera.xyz` |
| Native Symbol | `zkLTC` |

## Token yang Didukung

| Logo | Symbol | Nama | Address |
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
- Deploy UniswapV2 Factory, Router02, Library, Multicall3 ke LitVM LiteForge
- Deploy WzkLTC (WETH9) untuk wrap/unwrap native token
- Deploy 6 testnet ERC-20 (TRX, XRP, ADA, ZEC, XMR, ORVX)
- Deploy multi-token Faucet dengan cooldown + max-claim per user

### Phase 2 — Core DEX UX ✅
- TanStack Start scaffold + wagmi v2 + viem integration
- Wallet picker EIP-6963 (MetaMask, OKX, Rabby, Bitget) + auto add-network
- Swap engine dengan auto-routing WRAP / UNWRAP / SWAP
- Add / Remove Liquidity dengan smart approval (cek allowance dulu)
- Pools listing via Factory `allPairsLength` + Multicall reserves
- Portfolio: token balances + LP positions via Multicall
- Faucet UI dengan 3D animated drip card
- Premium dark-neon design system (OKLCH tokens, gradient brand)

### Phase 3 — Polish & Discovery ✅
- Analytics page: TVL, volume 24h, top pools, liquidity distribution
- Admin panel untuk faucet owner (setToken, setClaimAmount, refill, dll)
- Brand & Style Guide page (`/brand`)
- Full SEO pipeline (sitemap.xml, robots.txt, llms.txt, canonical, OG/Twitter)
- Activity Feed real-time on-chain events
- Custom token import (per-user)
- Dokumentasi lengkap (`/docs`)

### Phase 4 — Liquidity & Incentives (In Progress)
- Liquidity Mining program (LP staking → ORVX rewards)
- Trading competitions dengan leaderboard
- Referral system on-chain
- Boosted pools (multiplier untuk pasangan tertentu)
- Limit orders (off-chain matching, on-chain settlement)

### Phase 5 — Advanced Trading
- Multi-hop smart router (UI lebih dari 2 hop)
- Concentrated Liquidity (UniswapV3-style pools)
- Price chart per pool (TradingView lightweight charts)
- Slippage protection & MEV-aware routing
- Subgraph deployment (self-hosted graph-node)

### Phase 6 — Governance & DAO
- ORVX → veORVX vote-escrow model
- On-chain governance (proposals + voting)
- Treasury management dengan timelock
- Fee switch (protocol fee ke veORVX holders)
- Gauge weights untuk pengarahan liquidity mining

### Phase 7 — Multi-Chain & Mainnet
- Audit kontrak (eksternal, public report)
- Bug bounty program
- Bridge native ke LitVM Mainnet
- Deployment ke Mainnet LitVM
- Cross-rollup liquidity routing

### Phase 8 — Ecosystem
- SDK publik (`@orvex/sdk`) untuk integrasi pihak ketiga
- Aggregator API (REST + GraphQL)
- Mobile-first PWA + push notifications
- Integrasi fiat on-ramp
- Grants program untuk builders di atas ORVEX

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