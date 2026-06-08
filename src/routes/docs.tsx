import { createFileRoute, Link } from "@tanstack/react-router";
import { TOKENS, NATIVE } from "@/lib/tokens";
import { ADDR, litvm } from "@/lib/chain";
import { BrandMark } from "@/components/brand/BrandMark";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
  head: () => ({
    meta: [
      { title: "ORVEX Documentation — Premium AMM DEX on LitVM LiteForge" },
      { name: "description", content: "Dokumentasi lengkap ORVEX: arsitektur AMM, kontrak yang sudah deployed, token yang didukung, panduan swap & liquidity, roadmap pembangunan per phase, dan integrasi developer." },
      { property: "og:title", content: "ORVEX Documentation" },
      { property: "og:description", content: "Panduan lengkap ORVEX DEX di LitVM LiteForge: teknologi, token, roadmap, dan integrasi developer." },
      { property: "og:url", content: "https://orvexdex.lovable.app/docs" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ORVEX Documentation" },
      { name: "twitter:description", content: "Panduan lengkap ORVEX DEX di LitVM LiteForge." },
    ],
    links: [{ rel: "canonical", href: "https://orvexdex.lovable.app/docs" }],
  }),
});

function Section({ id, eyebrow, title, children }: { id: string; eyebrow?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      {eyebrow && (
        <div className="text-[10px] tracking-[0.35em] uppercase text-gradient-gold font-semibold mb-2">{eyebrow}</div>
      )}
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 bg-gradient-brand bg-clip-text text-transparent">{title}</h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl glass-strong border border-border p-5 ${className}`}>{children}</div>;
}

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "problem", label: "Masalah & Solusi" },
  { id: "tech", label: "Teknologi" },
  { id: "network", label: "Jaringan & Kontrak" },
  { id: "tokens", label: "Token yang Didukung" },
  { id: "wallets", label: "Wallet" },
  { id: "swap", label: "Cara Swap" },
  { id: "liquidity", label: "Liquidity" },
  { id: "faucet", label: "Faucet" },
  { id: "developers", label: "Developers" },
  { id: "security", label: "Keamanan" },
  { id: "roadmap", label: "Roadmap" },
  { id: "faq", label: "FAQ" },
];

const ROADMAP: Array<{ phase: string; title: string; status: "done" | "active" | "next"; items: string[] }> = [
  {
    phase: "Phase 1", title: "Foundation", status: "done",
    items: [
      "Deploy UniswapV2 Factory, Router02, Library, Multicall3 ke LitVM LiteForge",
      "Deploy WzkLTC (WETH9) untuk wrap/unwrap native zkLTC",
      "Deploy 6 testnet ERC-20: TRX, XRP, ADA, ZEC, XMR, ORVX",
      "Deploy multi-token Faucet dengan cooldown + max-claim per user",
    ],
  },
  {
    phase: "Phase 2", title: "Core DEX UX", status: "done",
    items: [
      "Scaffold TanStack Start v1 + wagmi v2 + viem",
      "Wallet picker EIP-6963 (MetaMask, OKX, Rabby, Bitget) + auto add-network",
      "Swap engine dengan auto-routing WRAP / UNWRAP / SWAP",
      "Add / Remove Liquidity dengan smart approval (cek allowance dulu)",
      "Pools listing via Factory enumeration + Multicall reserves",
      "Portfolio: token balances + LP positions via Multicall batching",
      "Faucet UI dengan 3D animated drip card",
      "Premium dark-neon design system (OKLCH tokens, gradient brand)",
    ],
  },
  {
    phase: "Phase 3", title: "Polish & Discovery", status: "done",
    items: [
      "Halaman Analytics: TVL, volume 24h, top pools, liquidity distribution",
      "Admin panel untuk faucet owner (setToken, setClaimAmount, refill, dll)",
      "Brand & Style Guide page (/brand)",
      "Full SEO pipeline (sitemap.xml, robots.txt, llms.txt, canonical, OG/Twitter)",
      "Activity Feed on-chain real-time",
      "Custom token import (per-user via localStorage)",
      "Halaman dokumentasi lengkap (/docs)",
    ],
  },
  {
    phase: "Phase 4", title: "Liquidity & Incentives", status: "active",
    items: [
      "Liquidity Mining program (LP staking → ORVX rewards)",
      "Trading competitions dengan leaderboard on-chain",
      "Referral system on-chain",
      "Boosted pools (multiplier untuk pasangan tertentu)",
      "Limit orders (off-chain matching, on-chain settlement)",
    ],
  },
  {
    phase: "Phase 5", title: "Advanced Trading", status: "next",
    items: [
      "Multi-hop smart router (UI > 2 hop)",
      "Concentrated Liquidity (UniswapV3-style pools)",
      "Price chart per pool (TradingView lightweight charts)",
      "Slippage protection & MEV-aware routing",
      "Subgraph deployment (self-hosted graph-node)",
    ],
  },
  {
    phase: "Phase 6", title: "Governance & DAO", status: "next",
    items: [
      "ORVX → veORVX vote-escrow model",
      "On-chain governance (proposals + voting)",
      "Treasury management dengan timelock",
      "Fee switch (protocol fee ke veORVX holders)",
      "Gauge weights untuk pengarahan liquidity mining",
    ],
  },
  {
    phase: "Phase 7", title: "Multi-Chain & Mainnet", status: "next",
    items: [
      "Audit kontrak (eksternal, public report)",
      "Bug bounty program",
      "Bridge native ke LitVM Mainnet",
      "Deployment ke Mainnet LitVM",
      "Cross-rollup liquidity routing",
    ],
  },
  {
    phase: "Phase 8", title: "Ecosystem", status: "next",
    items: [
      "SDK publik @orvex/sdk untuk integrasi pihak ketiga",
      "Aggregator API (REST + GraphQL)",
      "Mobile-first PWA + push notifications",
      "Integrasi fiat on-ramp",
      "Grants program untuk builders di atas ORVEX",
    ],
  },
];

const CONTRACTS: Array<{ name: string; address: string }> = [
  { name: "Factory (UniswapV2)", address: ADDR.factory },
  { name: "Router02", address: ADDR.router },
  { name: "Library", address: ADDR.library },
  { name: "Multicall3", address: ADDR.multicall },
  { name: "WzkLTC (WETH9)", address: ADDR.wzkLTC },
  { name: "Faucet", address: ADDR.faucet },
];

const WALLETS = [
  { name: "MetaMask", logo: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" },
  { name: "OKX Wallet", logo: "https://www.okx.com/cdn/assets/imgs/239/3FB13A8E2EC4C0F8.png" },
  { name: "Rabby Wallet", logo: "https://rabby.io/assets/images/logo-128.png" },
  { name: "Bitget Wallet", logo: "https://web3.bitget.com/favicon.ico" },
];

function StatusBadge({ status }: { status: "done" | "active" | "next" }) {
  const map = {
    done: { label: "Completed", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    active: { label: "In Progress", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse" },
    next: { label: "Upcoming", cls: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  } as const;
  const s = map[status];
  return <span className={`text-[10px] tracking-wider uppercase font-bold px-2.5 py-1 rounded-full border ${s.cls}`}>{s.label}</span>;
}

function DocsPage() {
  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/3 w-[900px] h-[600px] rounded-full blur-3xl opacity-40 animate-aurora"
          style={{ background: "radial-gradient(closest-side, oklch(0.65 0.27 295 / 0.45), transparent 70%)" }} />
        <div className="absolute top-40 -right-32 w-[700px] h-[500px] rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(closest-side, oklch(0.78 0.18 220 / 0.35), transparent 70%)" }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero */}
        <header className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass border border-border mb-6">
            <BrandMark size="sm" />
            <span className="text-[10px] tracking-[0.3em] uppercase text-gradient-gold font-semibold">Documentation</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4">
            ORVEX <span className="bg-gradient-brand bg-clip-text text-transparent">Documentation</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Panduan lengkap tentang ORVEX DEX — premium AMM di LitVM LiteForge Testnet.
            Temukan arsitektur, kontrak yang sudah deployed, token yang didukung, dan roadmap pembangunan per phase.
          </p>
        </header>

        <div className="grid lg:grid-cols-[220px,1fr] gap-10">
          {/* TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="text-[10px] tracking-[0.3em] uppercase text-gradient-gold font-semibold mb-3">On this page</div>
              <nav className="flex flex-col gap-1 text-sm">
                {TOC.map((t) => (
                  <a key={t.id} href={`#${t.id}`} className="text-muted-foreground hover:text-foreground transition py-1 border-l border-border hover:border-primary pl-3">
                    {t.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <main className="space-y-16 min-w-0">
            <Section id="overview" eyebrow="01" title="Overview">
              <p>
                <strong className="text-foreground">ORVEX</strong> adalah Automated Market Maker (AMM) decentralized exchange yang dibangun di atas LitVM LiteForge —
                zk-rollup ringan dengan native token <code className="text-foreground">zkLTC</code>. ORVEX adalah fork UniswapV2 yang sudah teruji,
                dipadukan dengan antarmuka premium dark-neon yang fokus pada kecepatan, transparansi, dan UX kelas institusional.
              </p>
              <p>
                Semua transaksi — swap, wrap/unwrap, add/remove liquidity, faucet claim — dieksekusi sebagai transaksi nyata on-chain
                dan ditandatangani langsung oleh dompet pengguna. <strong className="text-foreground">Tidak ada simulasi, tidak ada custodial layer.</strong>
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mt-4">
                <Card><div className="text-3xl font-extrabold text-gradient-gold">100%</div><div className="text-xs">On-chain & non-custodial</div></Card>
                <Card><div className="text-3xl font-extrabold text-gradient-gold">0.30%</div><div className="text-xs">LP fee per swap</div></Card>
                <Card><div className="text-3xl font-extrabold text-gradient-gold">4441</div><div className="text-xs">LitVM Chain ID</div></Card>
              </div>
            </Section>

            <Section id="problem" eyebrow="02" title="Masalah yang Diselesaikan">
              <p>ORVEX menyelesaikan friksi yang biasanya dihadapi user dan builder di ekosistem zk-rollup baru:</p>
              <div className="grid md:grid-cols-2 gap-3 mt-2">
                {[
                  ["Likuiditas aset native", "AMM penuh dengan factory + router yang sudah deployed."],
                  ["Wrap/Unwrap manual", "Tombol WRAP/UNWRAP otomatis terintegrasi di Swap."],
                  ["Approval berulang", "Smart approval cek allowance dulu — hanya prompt kalau perlu."],
                  ["Sulit dapat token uji", "Faucet on-chain multi-token dengan cooldown & limit per user."],
                  ["LP tanpa dashboard", "Portfolio + Pools dengan batching Multicall3."],
                  ["Fragmentasi wallet", "EIP-6963 picker: MetaMask, OKX, Rabby, Bitget."],
                  ["Tidak ada metrics TVL/Volume", "Halaman Analytics dengan agregasi on-chain real-time."],
                  ["Onboarding jaringan ribet", "Auto add-network ke LitVM LiteForge sekali klik."],
                ].map(([t, d]) => (
                  <Card key={t}>
                    <div className="font-bold text-foreground mb-1">{t}</div>
                    <div className="text-sm">{d}</div>
                  </Card>
                ))}
              </div>
            </Section>

            <Section id="tech" eyebrow="03" title="Teknologi">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <div className="font-bold text-foreground mb-2">Smart Contracts</div>
                  <ul className="text-sm space-y-1 list-disc pl-4">
                    <li>UniswapV2 Factory + Router02 (Solidity)</li>
                    <li>WETH9 fork → WzkLTC untuk native wrap</li>
                    <li>Multicall3 untuk read batching</li>
                    <li>Custom Faucet (cooldown + per-user max claim + owner admin)</li>
                    <li>ERC-20 testnet: TRX, XRP, ADA, ZEC, XMR, ORVX</li>
                  </ul>
                </Card>
                <Card>
                  <div className="font-bold text-foreground mb-2">Frontend</div>
                  <ul className="text-sm space-y-1 list-disc pl-4">
                    <li>React 19 + TanStack Start v1 (SSR + file routing)</li>
                    <li>Vite 7, deploy ke Cloudflare Workers (Edge)</li>
                    <li>wagmi v2 + viem (typed on-chain)</li>
                    <li>@tanstack/react-query (caching & revalidation)</li>
                    <li>Tailwind v4 + shadcn/ui + design tokens OKLCH</li>
                  </ul>
                </Card>
                <Card>
                  <div className="font-bold text-foreground mb-2">Wallet & Signing</div>
                  <ul className="text-sm space-y-1 list-disc pl-4">
                    <li>EIP-6963 multi-provider discovery</li>
                    <li>Auto network add (LitVM LiteForge 4441)</li>
                    <li>Tx signing native dari user wallet</li>
                    <li>Account switching live tanpa reload</li>
                  </ul>
                </Card>
                <Card>
                  <div className="font-bold text-foreground mb-2">Data & Indexing</div>
                  <ul className="text-sm space-y-1 list-disc pl-4">
                    <li>Multicall3 batching untuk reserves & balances</li>
                    <li>Factory enumeration (allPairsLength + allPairs)</li>
                    <li>Event log scanning untuk Activity Feed</li>
                    <li>Subgraph schema siap (deploy via self-hosted node)</li>
                  </ul>
                </Card>
              </div>
            </Section>

            <Section id="network" eyebrow="04" title="Jaringan & Kontrak">
              <Card>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div><div className="text-xs text-muted-foreground">Network</div><div className="font-bold text-foreground">{litvm.name}</div></div>
                  <div><div className="text-xs text-muted-foreground">Chain ID</div><div className="font-bold text-foreground">{litvm.id}</div></div>
                  <div><div className="text-xs text-muted-foreground">RPC</div><code className="text-foreground text-xs break-all">{litvm.rpcUrls.default.http[0]}</code></div>
                  <div><div className="text-xs text-muted-foreground">Explorer</div><a className="text-primary hover:underline text-xs break-all" href={litvm.blockExplorers.default.url} target="_blank" rel="noreferrer">{litvm.blockExplorers.default.url}</a></div>
                </div>
              </Card>
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                {CONTRACTS.map((c) => (
                  <Card key={c.address}>
                    <div className="text-xs text-muted-foreground">{c.name}</div>
                    <a className="font-mono text-xs text-primary hover:underline break-all"
                      href={`${litvm.blockExplorers.default.url}/address/${c.address}`} target="_blank" rel="noreferrer">{c.address}</a>
                  </Card>
                ))}
              </div>
            </Section>

            <Section id="tokens" eyebrow="05" title="Token yang Didukung">
              <p>Berikut token yang aktif di ORVEX. Token ERC-20 testnet bisa diklaim gratis lewat <Link to="/faucet" className="text-primary hover:underline">Faucet</Link>.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                {[NATIVE, ...TOKENS.filter((t) => !t.isNative)].map((t) => (
                  <Card key={t.symbol} className="flex items-center gap-3">
                    <img src={t.logo} alt={`${t.symbol} logo`} width={40} height={40} className="rounded-full ring-1 ring-border" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-foreground">{t.symbol}</div>
                      <div className="text-xs text-muted-foreground truncate">{t.name}</div>
                      {!t.isNative && (
                        <a className="font-mono text-[10px] text-primary hover:underline block truncate"
                          href={`${litvm.blockExplorers.default.url}/address/${t.address}`} target="_blank" rel="noreferrer">{t.address}</a>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </Section>

            <Section id="wallets" eyebrow="06" title="Wallet yang Didukung">
              <p>ORVEX mendeteksi dompet via EIP-6963 sehingga semua extension terpasang tampil otomatis di picker. Switching account live tanpa reload halaman.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                {WALLETS.map((w) => (
                  <Card key={w.name} className="flex flex-col items-center text-center gap-2 py-6">
                    <img src={w.logo} alt={`${w.name} logo`} width={40} height={40} className="rounded-lg" loading="lazy" />
                    <div className="font-bold text-foreground text-sm">{w.name}</div>
                  </Card>
                ))}
              </div>
            </Section>

            <Section id="swap" eyebrow="07" title="Cara Swap">
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>Buka halaman <Link to="/swap" className="text-primary hover:underline">/swap</Link> dan hubungkan dompet.</li>
                <li>Pilih token input & output. Tombol akan otomatis berubah ke <code className="text-foreground">WRAP</code>, <code className="text-foreground">UNWRAP</code>, atau <code className="text-foreground">SWAP</code> tergantung pasangan.</li>
                <li>Masukkan jumlah — quote dihitung real-time via Router <code>getAmountsOut</code>.</li>
                <li>Jika token belum di-approve, ORVEX akan minta approval sekali saja (allowance dipakai ulang).</li>
                <li>Tanda tangan transaksi di dompet. Toast akan menampilkan link explorer setelah konfirmasi.</li>
              </ol>
            </Section>

            <Section id="liquidity" eyebrow="08" title="Add / Remove Liquidity">
              <p>Setiap pool memberi <strong className="text-foreground">0.30% fee</strong> ke LP, didistribusikan secara pro-rata via reserves growth (mekanik UniswapV2 klasik).</p>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>Buka <Link to="/liquidity" className="text-primary hover:underline">/liquidity</Link> dan pilih pasangan.</li>
                <li>Masukkan jumlah salah satu sisi — sisi lain dihitung otomatis dari reserves.</li>
                <li>Smart approval flow cek allowance dulu, hanya prompt jika perlu.</li>
                <li>Konfirmasi <code>addLiquidity</code> (atau <code>addLiquidityETH</code> untuk pasangan native).</li>
                <li>Untuk remove: pilih posisi di <Link to="/portfolio" className="text-primary hover:underline">/portfolio</Link>, pilih persentase, konfirmasi.</li>
              </ol>
            </Section>

            <Section id="faucet" eyebrow="09" title="Faucet">
              <p>
                Klaim token testnet gratis di <Link to="/faucet" className="text-primary hover:underline">/faucet</Link>.
                Faucet menerapkan <strong className="text-foreground">cooldown on-chain</strong> dan <strong className="text-foreground">max claim per user</strong> yang dienforce di kontrak.
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Klaim per-token atau <code>claimAll</code> sekaligus.</li>
                <li>Cooldown & sisa kuota klaim tampil real-time.</li>
                <li>Owner faucet bisa setToken/refill/setClaimAmount via <Link to="/admin" className="text-primary hover:underline">/admin</Link>.</li>
              </ul>
            </Section>

            <Section id="developers" eyebrow="10" title="Untuk Developer">
              <p>ABI ada di <code>src/lib/abis/</code>. Alamat kontrak & chain config ada di <code>src/lib/chain.ts</code>. Token registry di <code>src/lib/tokens.ts</code>.</p>
              <Card>
                <pre className="text-xs overflow-x-auto">{`import { createPublicClient, http } from "viem";

const litvm = {
  id: 4441,
  name: "LitVM LiteForge",
  nativeCurrency: { name: "zkLTC", symbol: "zkLTC", decimals: 18 },
  rpcUrls: { default: { http: ["${litvm.rpcUrls.default.http[0]}"] } },
};

const client = createPublicClient({ chain: litvm, transport: http() });
const factory = "${ADDR.factory}";
const router  = "${ADDR.router}";`}</pre>
              </Card>
            </Section>

            <Section id="security" eyebrow="11" title="Keamanan">
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Non-custodial — private key tidak pernah meninggalkan dompet user.</li>
                <li>Tidak ada upgradeable proxy di kontrak inti (UniswapV2 immutable).</li>
                <li>Faucet cooldown & maxClaims di-enforce di kontrak — bukan client-side.</li>
                <li>Admin functions hanya untuk owner faucet, tidak menyentuh AMM core.</li>
                <li>ORVEX masih testnet — selalu verifikasi alamat kontrak via dokumen ini.</li>
              </ul>
            </Section>

            <Section id="roadmap" eyebrow="12" title="Roadmap Pembangunan">
              <p>Roadmap dipecah per <strong className="text-foreground">phase</strong> (bukan kuartal/tahun) agar fokus pada milestone teknis, bukan kalender.</p>
              <div className="relative mt-4 space-y-4">
                {ROADMAP.map((p) => (
                  <div key={p.phase} className="relative pl-8">
                    <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-gradient-brand shadow-neon" />
                    <div className="absolute left-1.5 top-5 bottom-0 w-px bg-border" />
                    <Card>
                      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                        <div>
                          <div className="text-[10px] tracking-[0.3em] uppercase text-gradient-gold font-semibold">{p.phase}</div>
                          <div className="text-xl font-extrabold text-foreground">{p.title}</div>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {p.items.map((it) => <li key={it}>{it}</li>)}
                      </ul>
                    </Card>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="faq" eyebrow="13" title="FAQ">
              <div className="space-y-3">
                {[
                  ["Apakah ORVEX sudah mainnet?", "Belum. ORVEX berjalan di LitVM LiteForge Testnet (Chain ID 4441). Mainnet ada di Phase 7."],
                  ["Berapa fee swap?", "0.30% per swap, dibagi pro-rata ke LP — sesuai mekanik UniswapV2."],
                  ["Wallet apa saja yang didukung?", "MetaMask, OKX Wallet, Rabby Wallet, Bitget Wallet (semua via EIP-6963)."],
                  ["Bisa import token sendiri?", "Bisa. Halaman swap & liquidity menyediakan import custom token (disimpan per-browser)."],
                  ["Apakah kontrak diaudit?", "Belum. Audit eksternal & bug bounty ada di Phase 7 sebelum mainnet launch."],
                ].map(([q, a]) => (
                  <Card key={q}>
                    <div className="font-bold text-foreground mb-1">{q}</div>
                    <div className="text-sm">{a}</div>
                  </Card>
                ))}
              </div>
            </Section>

            <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-3">
              <Link to="/swap" className="px-5 py-2.5 rounded-full bg-gradient-brand text-primary-foreground font-bold shadow-neon hover:opacity-90 transition">Mulai Swap</Link>
              <Link to="/faucet" className="px-5 py-2.5 rounded-full glass border border-border font-bold hover:border-primary transition">Klaim Faucet</Link>
              <Link to="/brand" className="px-5 py-2.5 rounded-full glass border border-border font-bold hover:border-primary transition">Brand Guide</Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}