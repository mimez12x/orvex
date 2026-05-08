import { createFileRoute, Link } from "@tanstack/react-router";
import { useReadContract, useReadContracts } from "wagmi";
import { useMemo } from "react";
import logo from "@/assets/orvex-logo.png";
import hero from "@/assets/hero-luxury.jpg";
import { ADDR } from "@/lib/chain";
import { factoryAbi } from "@/lib/abis/factory";
import { pairAbi } from "@/lib/abis/pair";
import { TOKENS } from "@/lib/tokens";
import { fmt } from "@/lib/format";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  // Live on-chain stats
  const len = useReadContract({ address: ADDR.factory, abi: factoryAbi, functionName: "allPairsLength", query: { refetchInterval: 20000 } });
  const total = Number((len.data as bigint | undefined) ?? 0n);
  const pairCalls = useMemo(
    () => Array.from({ length: total }, (_, i) => ({ address: ADDR.factory, abi: factoryAbi, functionName: "allPairs" as const, args: [BigInt(i)] as const })),
    [total],
  );
  const pairs = useReadContracts({ contracts: pairCalls, query: { enabled: total > 0 } });
  const pairAddrs = (pairs.data ?? []).map((r) => r.result as `0x${string}` | undefined).filter(Boolean) as `0x${string}`[];
  const supplyCalls = useMemo(
    () => pairAddrs.map((p) => ({ address: p, abi: pairAbi, functionName: "totalSupply" as const })),
    [pairAddrs],
  );
  const supplies = useReadContracts({ contracts: supplyCalls, query: { enabled: pairAddrs.length > 0, refetchInterval: 25000 } });
  const totalLp = useMemo(
    () => (supplies.data ?? []).reduce<bigint>((acc, r) => acc + ((r?.result as bigint | undefined) ?? 0n), 0n),
    [supplies.data],
  );

  return (
    <div className="relative overflow-hidden noise-bg">
      {/* Hero backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <img src={hero} alt="" className="w-full h-[860px] object-cover opacity-40 mix-blend-screen" width={1920} height={1280} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/70 to-background" />
      </div>
      <div className="absolute inset-0 grid-bg opacity-[0.18] pointer-events-none" />

      {/* HERO */}
      <section className="relative max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-28">
        <div className="grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2/60 border border-gold backdrop-blur-md text-[11px] tracking-[0.18em] uppercase mb-7">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-gradient-gold font-semibold">Live</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-foreground/80">LitVM LiteForge Mainnet-grade Testnet</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight leading-[1.02] mb-6">
              The exchange of
              <br />
              <span className="text-gradient-luxe">refined liquidity.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl md:max-w-2xl mb-9">
              ORVEX is a connoisseur-grade AMM crafted on LitVM LiteForge. Smart routing, exact-output trades,
              gas-efficient wraps, and museum-quality UX — every settlement final on-chain.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Link
                to="/swap"
                className="group relative px-7 py-3.5 rounded-xl bg-gradient-luxe text-primary-foreground font-semibold shadow-neon hover:shadow-gold transition-all hover:-translate-y-0.5 shimmer"
              >
                <span className="relative z-10">Launch Trading Desk →</span>
              </Link>
              <Link
                to="/pools"
                className="px-7 py-3.5 rounded-xl glass border-gold font-semibold hover:bg-surface-2 transition"
              >
                Explore Pools
              </Link>
              <Link to="/faucet" className="px-5 py-3.5 text-sm text-muted-foreground hover:text-foreground transition">
                Test tokens →
              </Link>
            </div>

            {/* Live stats strip */}
            <div className="mt-10 inline-flex flex-wrap gap-x-8 gap-y-2 px-5 py-3 rounded-2xl glass-strong border-gold">
              <Stat label="Active Pools" value={total > 0 ? total.toString() : "—"} />
              <Divider />
              <Stat label="LP Issued" value={fmt(totalLp, 18, 2)} />
              <Divider />
              <Stat label="Listed Assets" value={TOKENS.length.toString()} />
              <Divider />
              <Stat label="Chain" value="4441" />
            </div>
          </div>

          <div className="md:col-span-5 relative">
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 rounded-full blur-3xl opacity-60" style={{ background: "var(--gradient-glow)" }} />
              <div className="absolute inset-6 rounded-[2.5rem] glass-strong shadow-elegant noise-bg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img src={logo} alt="ORVEX" className="h-44 w-44 animate-pulse-glow drop-shadow-2xl" />
                </div>
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                  <span>ORVEX · Vault</span>
                  <span className="text-gradient-gold">XXIV</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                  <span>Crafted on-chain</span>
                  <span>∞</span>
                </div>
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-gold text-[10px] font-bold tracking-[0.3em] uppercase text-black shadow-gold">
                Premium AMM
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <section className="relative border-y border-border/60 bg-surface-2/30 backdrop-blur overflow-hidden">
        <div className="flex gap-12 py-4 whitespace-nowrap animate-ticker">
          {[...Array(2)].flatMap((_, j) =>
            TOKENS.map((t) => (
              <div key={`${j}-${t.symbol}`} className="flex items-center gap-3 text-sm">
                <img src={t.logo} alt={t.symbol} className="h-6 w-6 rounded-full" />
                <span className="font-semibold tracking-wider">{t.symbol}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground text-xs">{t.name}</span>
              </div>
            )),
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <div className="text-[11px] tracking-[0.3em] uppercase text-gradient-gold font-semibold mb-3">The Maison</div>
          <h2 className="text-3xl md:text-5xl font-bold">Engineered for the discerning trader</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { title: "Smart Routing", body: "Multi-hop pathfinding via wzkLTC for the deepest liquidity. Always quotes the best execution.", roman: "I" },
            { title: "Exact-Out Trades", body: "Specify the amount you want to receive — we calculate and minimize the input precisely.", roman: "II" },
            { title: "Atomic Wraps", body: "Native zkLTC ↔ wzkLTC in a single tap. Deposit and withdraw without an intermediary.", roman: "III" },
            { title: "Smart Approvals", body: "We check existing allowance and only request signatures when needed. No double prompts.", roman: "IV" },
            { title: "Custom Tokens", body: "Paste any ERC-20 address and trade instantly. Your imports persist locally.", roman: "V" },
            { title: "On-chain Activity", body: "Every swap, mint, and burn streamed from LitVM logs into your portfolio in real time.", roman: "VI" },
          ].map((f) => (
            <div key={f.title} className="group relative glass rounded-3xl p-7 hover:border-gold transition overflow-hidden">
              <div className="absolute top-5 right-6 text-5xl font-extralight text-gradient-gold opacity-30 group-hover:opacity-80 transition">{f.roman}</div>
              <h3 className="text-xl font-bold mb-3 mt-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-luxe opacity-0 group-hover:opacity-100 transition" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-5xl mx-auto px-6 pb-24">
        <div className="relative glass-strong rounded-[2rem] p-10 md:p-14 text-center overflow-hidden border-gold shadow-elegant">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-40" style={{ background: "var(--gradient-luxe)" }} />
          <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full blur-3xl opacity-30" style={{ background: "var(--gradient-gold)" }} />
          <div className="relative">
            <div className="text-[10px] tracking-[0.4em] uppercase text-gradient-gold mb-3">Atelier · MMXXVI</div>
            <h3 className="text-3xl md:text-5xl font-bold mb-4">Your seat at the trading floor awaits.</h3>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">Connect a wallet, claim test tokens, and experience a DEX built like a fine instrument.</p>
            <Link
              to="/swap"
              className="inline-block px-9 py-4 rounded-xl bg-gradient-luxe text-primary-foreground font-bold shadow-neon hover:shadow-gold transition-all hover:-translate-y-0.5"
            >
              Enter the Exchange
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-left">
      <div className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">{label}</div>
      <div className="font-bold text-lg text-gradient-luxe leading-tight">{value}</div>
    </div>
  );
}

function Divider() {
  return <div className="w-px self-stretch bg-border/60" />;
}
