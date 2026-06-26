import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAccount, useBalance, useReadContract, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { ArrowLeftRight, Droplets, Sprout, Globe2, BarChart3, Wallet, ShieldCheck, Zap, Layers, Sparkles } from "lucide-react";
import heroNeon from "@/assets/orvex-hero-neon.jpg";
import { ADDR } from "@/lib/chain";
import { factoryAbi } from "@/lib/abis/factory";
import { pairAbi } from "@/lib/abis/pair";
import { TOKENS } from "@/lib/tokens";
import { WalletModal } from "@/components/wallet/ConnectButton";
import { findToken } from "@/lib/tokens";
import { usePoolStats, fmtWzk, type PoolMeta } from "@/lib/poolStats";
import { useDexStats } from "@/lib/dexStats";
import { BrandMark } from "@/components/brand/BrandMark";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    links: [
      { rel: "preload", as: "image", href: heroNeon, fetchpriority: "high" } as any,
      { rel: "canonical", href: "https://orvexdex.lovable.app/" },
    ],
    meta: [
      { title: "ORVEX — Premium AMM DEX on LitVM LiteForge" },
      { name: "description", content: "ORVEX is a premium AMM DEX on LitVM LiteForge Testnet. Swap, provide liquidity, and earn — fully on-chain." },
      { property: "og:title", content: "ORVEX — Premium AMM DEX on LitVM LiteForge" },
      { property: "og:description", content: "Swap, provide liquidity, and track your portfolio live on the ORVEX AMM DEX." },
      { property: "og:url", content: "https://orvexdex.lovable.app/" },
      { name: "twitter:title", content: "ORVEX — Premium AMM DEX on LitVM LiteForge" },
      { name: "twitter:description", content: "Swap, provide liquidity, and track your portfolio live on the ORVEX AMM DEX." },
    ],
  }),
});

function Landing() {
  const [walletOpen, setWalletOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();

  // Live on-chain stats
  const len = useReadContract({
    address: ADDR.factory, abi: factoryAbi, functionName: "allPairsLength",
    query: { refetchInterval: 30000 },
  });
  const total = Number((len.data as bigint | undefined) ?? 0n);

  // Build poolMetas (every pair) so we can derive token prices in wzkLTC.
  const pairCalls = useMemo(
    () => Array.from({ length: total }, (_, i) => ({
      address: ADDR.factory as `0x${string}`,
      abi: factoryAbi,
      functionName: "allPairs" as const,
      args: [BigInt(i)] as const,
    })),
    [total],
  );
  const pairsQ = useReadContracts({ contracts: pairCalls, query: { enabled: total > 0 } });
  const pairAddrs = (pairsQ.data ?? [])
    .map((r) => r.result as `0x${string}` | undefined)
    .filter(Boolean) as `0x${string}`[];

  const metaCalls = useMemo(
    () => pairAddrs.flatMap((p) => [
      { address: p, abi: pairAbi, functionName: "token0" as const },
      { address: p, abi: pairAbi, functionName: "token1" as const },
      { address: p, abi: pairAbi, functionName: "getReserves" as const },
    ]),
    [pairAddrs],
  );
  const metaQ = useReadContracts({ contracts: metaCalls, query: { enabled: pairAddrs.length > 0, refetchInterval: 30000 } });
  const poolMetas: PoolMeta[] = useMemo(() => pairAddrs.flatMap((pair, i) => {
    const t0 = metaQ.data?.[i * 3]?.result as `0x${string}` | undefined;
    const t1 = metaQ.data?.[i * 3 + 1]?.result as `0x${string}` | undefined;
    const r = metaQ.data?.[i * 3 + 2]?.result as readonly [bigint, bigint, number] | undefined;
    if (!t0 || !t1 || !r) return [];
    return [{
      pair, token0: t0, token1: t1,
      reserve0: r[0], reserve1: r[1],
      decimals0: findToken(t0)?.decimals ?? 18,
      decimals1: findToken(t1)?.decimals ?? 18,
    }];
  }), [pairAddrs, metaQ.data]);
  const stats = usePoolStats(poolMetas);
  const prices = stats.data?.prices;
  const dex = useDexStats(poolMetas);
  const dexLoading = dex.isLoading || metaQ.isLoading || pairsQ.isLoading;

  // Native balance
  const nativeBal = useBalance({ address, query: { enabled: !!address } });

  // ERC20 balances for showcase holdings
  const erc20s = TOKENS.filter((t) => !t.isNative);
  const balCalls = useMemo(
    () => erc20s.map((t) => ({
      address: t.address,
      abi: [{ type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] }] as const,
      functionName: "balanceOf" as const,
      args: [address ?? "0x0000000000000000000000000000000000000000"] as const,
    })),
    [address, erc20s.length],
  );
  const bals = useReadContracts({ contracts: balCalls as any, query: { enabled: !!address } });

  // Per-token holding with raw bigint + wzkLTC value, sorted by value.
  const ONE = 10n ** 18n;
  const wzkAddr = ADDR.wzkLTC.toLowerCase();
  const holdings = useMemo(() => {
    const toWzk = (raw: bigint, decimals: number, addrLower: string): bigint => {
      if (raw === 0n) return 0n;
      // native zkLTC == wzkLTC for pricing purposes
      const px = prices?.get(addrLower) ?? (addrLower === wzkAddr ? ONE : undefined);
      if (!px) return 0n;
      const norm = decimals === 18 ? raw
        : decimals < 18 ? raw * 10n ** BigInt(18 - decimals)
        : raw / 10n ** BigInt(decimals - 18);
      return (norm * px) / ONE;
    };
    const list = [
      {
        token: TOKENS[0],
        raw: (nativeBal.data?.value ?? 0n),
        valueWzk: toWzk(nativeBal.data?.value ?? 0n, 18, wzkAddr),
      },
      ...erc20s.map((t, i) => {
        const raw = (bals.data?.[i]?.result as bigint | undefined) ?? 0n;
        return { token: t, raw, valueWzk: toWzk(raw, t.decimals, t.address.toLowerCase()) };
      }),
    ];
    return list.sort((a, b) => (a.valueWzk < b.valueWzk ? 1 : a.valueWzk > b.valueWzk ? -1 : 0));
  }, [nativeBal.data, bals.data, erc20s, prices, wzkAddr]);

  const totalValueWzk: bigint = holdings.reduce<bigint>((s, h) => s + h.valueWzk, 0n);

  return (
    <div className="relative">
      {/* Ambient backdrop */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] rounded-full blur-3xl opacity-50 animate-aurora"
          style={{ background: "radial-gradient(closest-side, oklch(0.65 0.27 295 / 0.55), transparent 70%)" }} />
        <div className="absolute top-40 -left-32 w-[600px] h-[600px] rounded-full blur-3xl opacity-40 animate-aurora-2"
          style={{ background: "radial-gradient(closest-side, oklch(0.78 0.18 220 / 0.5), transparent 70%)" }} />
        <div className="absolute top-80 -right-32 w-[700px] h-[700px] rounded-full blur-3xl opacity-30 animate-aurora"
          style={{ background: "radial-gradient(closest-side, oklch(0.84 0.16 85 / 0.35), transparent 70%)" }} />
      </div>

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-16">
        {/* Master frame */}
        <div className="relative rounded-[2.25rem] glass-strong border-gold shadow-elegant noise-bg overflow-hidden animated-border">
          <div className="absolute inset-0 grid-bg opacity-[0.10] pointer-events-none" />

          {/* HERO */}
          <div className="relative grid lg:grid-cols-12 gap-8 p-6 sm:p-10 lg:p-14">
            <div className="lg:col-span-7 relative z-10 animate-rise">
              <BrandMark size="lg" className="mb-7" />

              <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold leading-[1.05] tracking-tight">
                Mastering Crypto & Web3
                <br />
                <span className="text-gradient-luxe">Building the Future of</span>
                <br />
                Decentralized Wealth
              </h1>

              <div className="mt-5 flex items-center gap-2 text-sm">
                <span className="text-gradient-brand font-semibold tracking-wider">Portfolio</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-gradient-brand font-semibold tracking-wider">DeFi</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-gradient-brand font-semibold tracking-wider">Innovation</span>
              </div>

              {/* Portfolio value card */}
              <div className="mt-8 relative max-w-md rounded-2xl p-5 glass-strong border-gold shadow-neon animate-rise" style={{ animationDelay: "120ms" }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground">Total Portfolio Value</div>
                    <div className="mt-1 text-4xl sm:text-5xl font-extrabold text-gradient-luxe">
                      {isConnected ? (
                        <>
                          {fmtWzk(totalValueWzk, 4)}{" "}
                          <span className="text-2xl text-muted-foreground font-bold">wzkLTC</span>
                        </>
                      ) : "1.28M wzkLTC"}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {isConnected ? "Priced via on-chain wzkLTC pools" : "Demo · connect to view live"}
                    </div>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-black font-bold text-sm shadow-[0_0_30px_rgba(52,211,153,0.45)]">
                    +0%
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap gap-3 animate-rise" style={{ animationDelay: "200ms" }}>
                <button
                  onClick={() => { if (isConnected) navigate({ to: "/swap" }); else setWalletOpen(true); }}
                  className="px-6 py-3 rounded-xl bg-gradient-luxe text-primary-foreground font-bold shadow-neon hover:-translate-y-0.5 transition-all"
                >
                  {isConnected ? "Open Trading Desk →" : "Connect Wallet"}
                </button>
                <Link to="/pools" className="px-6 py-3 rounded-xl glass border-gold font-semibold hover:bg-surface-2 transition">
                  Explore Pools
                </Link>
                <Link to="/faucet" className="px-6 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition">
                  Test tokens →
                </Link>
              </div>
            </div>

            {/* Hero visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-square w-full max-w-lg mx-auto animate-rise" style={{ animationDelay: "120ms" }}>
                <div className="absolute inset-0 rounded-[2.5rem] blur-3xl opacity-70 animate-pulse-glow"
                  style={{ background: "radial-gradient(closest-side, oklch(0.65 0.27 295 / 0.7), transparent 70%)" }} />
                <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden shadow-elegant border-gold animated-border">
                  <img
                    src={heroNeon}
                    alt="ORVEX neon emblem"
                    width={1024}
                    height={1024}
                    fetchPriority="high"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-gold text-[10px] font-bold tracking-[0.3em] uppercase text-black shadow-gold">
                  Premium AMM · LitVM
                </div>
              </div>
            </div>
          </div>

          {/* DASHBOARD ROW */}
          <div className="relative grid lg:grid-cols-12 gap-6 px-6 sm:px-10 lg:px-14 pb-10">
            <h2 className="sr-only">Portfolio overview</h2>
            {/* Holdings */}
            <div className="lg:col-span-7 rounded-2xl glass border-gold p-6 card-hover animate-rise" style={{ animationDelay: "240ms" }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold">Holdings</h3>
                <Link to="/portfolio" className="text-xs text-gradient-gold font-semibold tracking-[0.2em] uppercase hover:opacity-80">View all →</Link>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {holdings.slice(0, 5).map((h) => (
                  <div key={h.token.symbol} className="rounded-xl p-3 glass-strong border-gold text-center card-hover">
                    <img src={h.token.logo} alt={`${h.token.symbol} token logo`} className="h-10 w-10 mx-auto rounded-full ring-2 ring-primary/40" />
                    <div className="mt-2 text-sm font-bold">{h.token.symbol}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {isConnected
                        ? `${Number(formatUnits(h.raw, h.token.decimals)).toLocaleString(undefined, { maximumFractionDigits: 3 })}`
                        : h.token.name}
                    </div>
                    {isConnected && h.valueWzk > 0n && (
                      <div className="text-[10px] text-gradient-gold font-mono">{fmtWzk(h.valueWzk, 2)} wzk</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Performance */}
            <div className="lg:col-span-5 rounded-2xl glass border-gold p-6 card-hover animate-rise" style={{ animationDelay: "300ms" }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold">Performance</h3>
                <span className="text-[10px] tracking-[0.2em] uppercase px-2 py-1 rounded-full glass-strong border-gold">Daily</span>
              </div>
              <Sparkline />
              <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>Now</span>
              </div>
            </div>
          </div>

          {/* ON-CHAIN DEX STATS */}
          <div className="relative px-6 sm:px-10 lg:px-14 pb-10">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Live On-chain Metrics</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Aggregated directly from LitVM logs · refreshes every 60s
                </p>
              </div>
              <span className="text-[10px] tracking-[0.2em] uppercase px-2 py-1 rounded-full glass-strong border-gold">
                {dexLoading ? "Syncing…" : "Live"}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatTile label="Pools" value={dex.data ? String(dex.data.pools) : (total ? String(total) : "—")} loading={dexLoading} accent="violet" />
              <StatTile label="Volume 24h" value={dex.data ? `${fmtWzk(dex.data.volume24hWzk, 2)}` : "—"} suffix="wzk" loading={dexLoading} accent="gold" />
              <StatTile label="Swaps 24h" value={dex.data ? dex.data.txs24h.toLocaleString() : "—"} loading={dexLoading} accent="cyan" />
              <StatTile label="Unique Wallets" value={dex.data ? dex.data.uniqueWallets.toLocaleString() : "—"} hint="~24h window" loading={dexLoading} accent="violet" />
              <StatTile label="Active (1h)" value={dex.data ? dex.data.activeWallets1h.toLocaleString() : "—"} hint="last ~1h" loading={dexLoading} accent="cyan" />
              <StatTile label="TVL" value={dex.data ? fmtWzk(dex.data.tvlWzk, 2) : "—"} suffix="wzk" loading={dexLoading} accent="gold" />
            </div>
          </div>

          {/* FEATURED ROW */}
          <div className="relative grid lg:grid-cols-12 gap-6 px-6 sm:px-10 lg:px-14 pb-12">
            <h2 className="sr-only">Featured products</h2>
            <FeaturedCard
              title="Featured Pools"
              subtitle={`${total > 0 ? total : "—"} active markets`}
              accent="violet"
              cta="Open Pools"
              to="/pools"
              delay={360}
            />
            <FeaturedCard
              title="Smart Routing"
              subtitle="Multi-hop best execution via wzkLTC"
              accent="cyan"
              cta="Try a Swap"
              to="/swap"
              delay={420}
            />
            <FeaturedCard
              title="Latest Activity"
              subtitle="Live mints, swaps & burns on-chain"
              accent="gold"
              cta="Open Portfolio"
              to="/portfolio"
              delay={480}
            />
          </div>
        </div>
      </section>

      {/* TICKER */}
      <section className="relative border-y border-border/60 bg-surface-2/30 backdrop-blur overflow-hidden">
        <div className="flex gap-12 py-4 whitespace-nowrap animate-ticker">
          {[...Array(2)].flatMap((_, j) =>
            TOKENS.map((t) => (
              <div key={`${j}-${t.symbol}`} className="flex items-center gap-3 text-sm">
                <img src={t.logo} alt={`${t.symbol} token logo`} className="h-6 w-6 rounded-full" />
                <span className="font-semibold tracking-wider">{t.symbol}</span>
                <span className="text-muted-foreground text-xs">{t.name}</span>
              </div>
            )),
          )}
        </div>
      </section>

      {/* PRODUCT SUITE */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-strong border-gold text-[10px] tracking-[0.3em] uppercase text-gradient-gold font-bold">
            <Sparkles className="h-3 w-3" /> The ORVEX Suite
          </div>
          <h2 className="mt-5 text-3xl sm:text-5xl font-extrabold tracking-tight">
            One protocol. <span className="text-gradient-luxe">Everything DeFi.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            A fully composable on-chain stack built on LitVM LiteForge — trade, earn, build, and
            claim your identity in a single, premium experience.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <ProductCard icon={ArrowLeftRight} to="/swap" title="Atelier Swap" desc="Best-execution routing via wzkLTC across every pool. Sub-second quotes, zero compromise." accent="violet" />
          <ProductCard icon={Droplets} to="/liquidity" title="Liquidity Vaults" desc="Provide depth, mint LP receipts, and earn protocol fees from every swap, on-chain." accent="cyan" />
          <ProductCard icon={Sprout} to="/farm" title="Yield Farming" desc="Stake LP tokens into reward pools and harvest ORVX emissions block by block." accent="gold" />
          <ProductCard icon={Globe2} to="/domains" title=".orvx Domains" desc="Mint your Web3 identity. Commit-reveal registrar with reverse resolution baked in." accent="violet" />
          <ProductCard icon={BarChart3} to="/analytics" title="Live Analytics" desc="Real-time TVL, volume, swaps and wallet activity — aggregated straight from chain logs." accent="cyan" />
          <ProductCard icon={Wallet} to="/portfolio" title="Portfolio Desk" desc="Track holdings, LP positions, farms and history with elegant, gallery-grade visuals." accent="gold" />
        </div>
      </section>

      {/* SUPPORTED TOKENS */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-[2rem] glass-strong border-gold shadow-elegant p-8 sm:p-12 overflow-hidden relative">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-30"
            style={{ background: "radial-gradient(closest-side, oklch(0.84 0.16 85 / 0.6), transparent 70%)" }} />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-30"
            style={{ background: "radial-gradient(closest-side, oklch(0.65 0.27 295 / 0.6), transparent 70%)" }} />
          <div className="relative grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <div className="text-[10px] tracking-[0.3em] uppercase text-gradient-gold font-bold mb-3">Supported Assets</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Trade the assets that <span className="text-gradient-luxe">define crypto.</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every token bridged to LitVM is first-class on ORVEX — deep liquidity, transparent
                pricing, and instant settlement on every market.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full glass border-gold text-xs font-semibold">UniswapV2 forks</span>
                <span className="px-3 py-1 rounded-full glass border-gold text-xs font-semibold">0.3% fee</span>
                <span className="px-3 py-1 rounded-full glass border-gold text-xs font-semibold">EVM-compatible</span>
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {TOKENS.map((t) => (
                  <div key={t.symbol} className="rounded-2xl p-4 glass border-gold card-hover text-center group">
                    <div className="relative inline-flex">
                      <span aria-hidden className="absolute inset-0 rounded-full blur-md opacity-50 group-hover:opacity-90 transition"
                        style={{ background: "radial-gradient(closest-side, oklch(0.65 0.27 295 / 0.7), transparent 70%)" }} />
                      <img src={t.logo} alt={`${t.symbol} logo`} className="relative h-12 w-12 rounded-full ring-2 ring-primary/40" />
                    </div>
                    <div className="mt-3 text-sm font-bold">{t.symbol}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{t.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY ORVEX */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-strong border-gold text-[10px] tracking-[0.3em] uppercase text-gradient-gold font-bold">
            <ShieldCheck className="h-3 w-3" /> Built for Conviction
          </div>
          <h2 className="mt-5 text-3xl sm:text-5xl font-extrabold tracking-tight">
            A protocol forged for <span className="text-gradient-luxe">serious capital.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <PillarCard icon={ShieldCheck} title="Non-custodial by design" desc="No middlemen, no off-chain ledgers. Every trade, mint, and claim is verified on LitVM in real time." />
          <PillarCard icon={Zap} title="LitVM-grade performance" desc="Sub-second confirmation, negligible fees, and zkLTC settlement keep the experience effortless." />
          <PillarCard icon={Layers} title="Composable stack" desc="Swap, LP, farm, and resolve identities — all surfaces share the same audited primitives." />
        </div>

        {/* Final CTA */}
        <div className="mt-16 relative rounded-[2rem] overflow-hidden glass-strong border-gold shadow-elegant animated-border">
          <div className="absolute inset-0 grid-bg opacity-[0.08]" />
          <div className="relative p-10 sm:p-14 text-center">
            <BrandMark size="xl" className="mx-auto justify-center" />
            <h3 className="mt-6 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Step inside the <span className="text-gradient-luxe">ORVEX atelier.</span>
            </h3>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Connect once. Trade everywhere. Claim your .orvx identity and start compounding on the
              most refined DeFi surface on LitVM.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => { if (isConnected) navigate({ to: "/swap" }); else setWalletOpen(true); }}
                className="px-7 py-3 rounded-xl bg-gradient-luxe text-primary-foreground font-bold shadow-neon hover:-translate-y-0.5 transition-all"
              >
                {isConnected ? "Launch Trading Desk →" : "Connect & Begin"}
              </button>
              <Link to="/domains" className="px-7 py-3 rounded-xl glass border-gold font-semibold hover:bg-surface-2 transition">
                Mint your .orvx
              </Link>
              <Link to="/docs" className="px-7 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition">
                Read the docs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <WalletModal open={walletOpen} onClose={() => { setWalletOpen(false); if (isConnected) navigate({ to: "/swap" }); }} />
    </div>
  );
}

function ProductCard({ icon: Icon, to, title, desc, accent }: { icon: any; to: string; title: string; desc: string; accent: "violet" | "cyan" | "gold" }) {
  const glow = accent === "violet"
    ? "oklch(0.65 0.27 295 / 0.5)"
    : accent === "cyan"
    ? "oklch(0.78 0.18 220 / 0.5)"
    : "oklch(0.84 0.16 85 / 0.5)";
  return (
    <Link
      to={to as any}
      className="group relative rounded-2xl p-6 glass-strong border-gold card-hover overflow-hidden block"
    >
      <span aria-hidden className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-50 group-hover:opacity-90 transition"
        style={{ background: `radial-gradient(closest-side, ${glow}, transparent 70%)` }} />
      <div className="relative">
        <div className="h-12 w-12 rounded-xl bg-gradient-luxe inline-flex items-center justify-center shadow-neon">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
        <h3 className="mt-5 text-xl font-bold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
        <div className="mt-5 text-xs font-bold tracking-[0.2em] uppercase text-gradient-gold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
          Open →
        </div>
      </div>
    </Link>
  );
}

function PillarCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-2xl p-6 glass border-gold card-hover">
      <div className="h-11 w-11 rounded-xl glass-strong border-gold inline-flex items-center justify-center">
        <Icon className="h-5 w-5 text-gradient-luxe" style={{ color: "oklch(0.84 0.16 85)" }} />
      </div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function Sparkline() {
  // Decorative deterministic sparkline
  const points = [40, 90, 70, 130, 100, 150, 120, 180, 160, 210, 190, 240, 220, 260];
  const w = 480, h = 140, max = 280;
  const step = w / (points.length - 1);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / max) * h}`).join(" ");
  const area = `${d} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.65 0.27 295)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="oklch(0.65 0.27 295)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="spark-line" x1="0" x2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.18 220)" />
          <stop offset="100%" stopColor="oklch(0.84 0.16 85)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={d} fill="none" stroke="url(#spark-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w} cy={h - (points[points.length - 1] / max) * h} r="5" fill="oklch(0.84 0.16 85)" className="animate-pulse-glow" />
    </svg>
  );
}

function FeaturedCard({ title, subtitle, cta, to, accent, delay }: { title: string; subtitle: string; cta: string; to: string; accent: "violet" | "cyan" | "gold"; delay: number }) {
  const grad = accent === "violet"
    ? "from-[oklch(0.45_0.22_295)] via-[oklch(0.3_0.15_300)] to-[oklch(0.18_0.08_290)]"
    : accent === "cyan"
    ? "from-[oklch(0.45_0.18_220)] via-[oklch(0.28_0.12_240)] to-[oklch(0.18_0.06_270)]"
    : "from-[oklch(0.55_0.16_85)] via-[oklch(0.35_0.12_70)] to-[oklch(0.18_0.05_60)]";
  return (
    <div
      className={`lg:col-span-4 group relative rounded-2xl p-6 overflow-hidden border-gold card-hover bg-gradient-to-br ${grad} shadow-elegant animate-rise`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-50 bg-white/20" />
      <div className="relative">
        <div className="text-[10px] tracking-[0.3em] uppercase text-white/70 mb-2">Featured</div>
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/80">{subtitle}</p>
        <Link
          to={to as any}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/95 text-black text-sm font-bold hover:bg-white transition"
        >
          {cta} →
        </Link>
      </div>
    </div>
  );
}

function StatTile({
  label, value, suffix, hint, loading, accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  hint?: string;
  loading?: boolean;
  accent: "violet" | "cyan" | "gold";
}) {
  const dot = accent === "violet"
    ? "bg-[oklch(0.65_0.27_295)]"
    : accent === "cyan"
    ? "bg-[oklch(0.78_0.18_220)]"
    : "bg-[oklch(0.84_0.16_85)]";
  return (
    <div className="rounded-2xl p-4 glass-strong border-gold card-hover">
      <div className="flex items-center justify-between">
        <div className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground">{label}</div>
        <span className={`h-1.5 w-1.5 rounded-full ${dot} shadow-[0_0_10px_currentColor] animate-pulse-glow`} />
      </div>
      <div className="mt-2 text-2xl font-extrabold text-gradient-luxe">
        {loading ? <span className="inline-block h-6 w-16 rounded bg-surface-2 animate-pulse" /> : value}
        {!loading && suffix && <span className="ml-1 text-xs text-muted-foreground font-bold">{suffix}</span>}
      </div>
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}