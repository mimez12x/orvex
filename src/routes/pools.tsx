import { createFileRoute } from "@tanstack/react-router";
import { useReadContract, useReadContracts } from "wagmi";
import { ADDR, explorerAddr } from "@/lib/chain";
import { factoryAbi } from "@/lib/abis/factory";
import { pairAbi } from "@/lib/abis/pair";
import { findToken } from "@/lib/tokens";
import { fmt } from "@/lib/format";
import { useMemo } from "react";

export const Route = createFileRoute("/pools")({
  component: PoolsPage,
  head: () => ({ meta: [{ title: "Pools — ORVEX" }] }),
});

function PoolsPage() {
  const len = useReadContract({ address: ADDR.factory, abi: factoryAbi, functionName: "allPairsLength", query: { refetchInterval: 15000 } });
  const total = Number((len.data as bigint | undefined) ?? 0n);

  const pairCalls = useMemo(
    () => Array.from({ length: total }, (_, i) => ({
      address: ADDR.factory as `0x${string}`,
      abi: factoryAbi,
      functionName: "allPairs" as const,
      args: [BigInt(i)] as const,
    })),
    [total],
  );
  const pairs = useReadContracts({ contracts: pairCalls, query: { enabled: total > 0 } });
  const pairAddrs = (pairs.data ?? []).map((r) => r.result as `0x${string}` | undefined).filter(Boolean) as `0x${string}`[];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Pools</h1>
          <p className="text-sm text-muted-foreground">All liquidity pairs on ORVEX • {total} pools</p>
        </div>
      </div>
      <div className="space-y-3">
        {pairAddrs.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
            No pools yet. Be the first to add liquidity.
          </div>
        )}
        {pairAddrs.map((p) => <PoolRow key={p} pair={p} />)}
      </div>
    </div>
  );
}

function PoolRow({ pair }: { pair: `0x${string}` }) {
  const data = useReadContracts({
    contracts: [
      { address: pair, abi: pairAbi, functionName: "token0" },
      { address: pair, abi: pairAbi, functionName: "token1" },
      { address: pair, abi: pairAbi, functionName: "getReserves" },
      { address: pair, abi: pairAbi, functionName: "totalSupply" },
    ],
    query: { refetchInterval: 12000 },
  });
  const [t0, t1, r, ts] = (data.data ?? []).map((d) => d?.result) as [
    `0x${string}` | undefined, `0x${string}` | undefined, [bigint, bigint, number] | undefined, bigint | undefined,
  ];
  const tk0 = t0 ? findToken(t0) : undefined;
  const tk1 = t1 ? findToken(t1) : undefined;

  return (
    <a
      href={explorerAddr(pair)}
      target="_blank" rel="noreferrer"
      className="block glass rounded-2xl p-5 hover:neon-border transition group"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {tk0 && <img src={tk0.logo} alt={tk0.symbol} className="h-9 w-9 rounded-full ring-2 ring-background" />}
            {tk1 && <img src={tk1.logo} alt={tk1.symbol} className="h-9 w-9 rounded-full ring-2 ring-background" />}
          </div>
          <div>
            <div className="font-bold">{tk0?.symbol ?? "?"} / {tk1?.symbol ?? "?"}</div>
            <div className="text-xs text-muted-foreground font-mono">{pair.slice(0, 10)}…{pair.slice(-6)}</div>
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Reserve {tk0?.symbol}</div>
            <div className="font-mono">{fmt(r?.[0], tk0?.decimals ?? 18)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Reserve {tk1?.symbol}</div>
            <div className="font-mono">{fmt(r?.[1], tk1?.decimals ?? 18)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">LP Supply</div>
            <div className="font-mono">{fmt(ts, 18)}</div>
          </div>
        </div>
      </div>
    </a>
  );
}
