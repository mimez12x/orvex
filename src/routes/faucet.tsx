import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ADDR } from "@/lib/chain";
import { faucetAbi } from "@/lib/abis/faucet";
import { FAUCET_TOKENS } from "@/lib/tokens";
import { fmt } from "@/lib/format";
import { useToast } from "@/components/ui/toaster";

export const Route = createFileRoute("/faucet")({
  component: FaucetPage,
  head: () => ({ meta: [{ title: "Faucet — ORVEX" }] }),
});

function FaucetPage() {
  const { address } = useAccount();
  const toast = useToast();
  const cooldown = useReadContract({ address: ADDR.faucet, abi: faucetAbi, functionName: "cooldown", query: { refetchInterval: 30000 } });

  const calls = useMemo(() => {
    const out: any[] = [];
    FAUCET_TOKENS.forEach((t) => {
      const idx = t.faucetIndex!;
      out.push({ address: ADDR.faucet, abi: faucetAbi, functionName: "claimAmounts", args: [BigInt(idx)] });
      out.push({ address: ADDR.faucet, abi: faucetAbi, functionName: "maxClaims", args: [BigInt(idx)] });
      if (address) {
        out.push({ address: ADDR.faucet, abi: faucetAbi, functionName: "lastClaimed", args: [address, idx] });
        out.push({ address: ADDR.faucet, abi: faucetAbi, functionName: "userClaimCount", args: [address, idx] });
      }
    });
    return out;
  }, [address]);

  const reads = useReadContracts({ contracts: calls, query: { enabled: calls.length > 0, refetchInterval: 12000 } });

  const { writeContractAsync, isPending } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const receipt = useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (receipt.isSuccess && hash) {
      toast.push({ title: "Claim successful", type: "success", hash });
      setHash(undefined);
      reads.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess]);

  const claim = async (idx: number) => {
    try {
      const h = await writeContractAsync({ address: ADDR.faucet, abi: faucetAbi, functionName: "claim", args: [idx] });
      setHash(h); toast.push({ title: "Claiming…", hash: h });
    } catch (e: any) {
      toast.push({ title: "Claim failed", description: e?.shortMessage || e?.message, type: "error" });
    }
  };

  const claimAll = async () => {
    try {
      const h = await writeContractAsync({ address: ADDR.faucet, abi: faucetAbi, functionName: "claimAll" });
      setHash(h); toast.push({ title: "Claiming all…", hash: h });
    } catch (e: any) {
      toast.push({ title: "Failed", description: e?.shortMessage || e?.message, type: "error" });
    }
  };

  const cd = (cooldown.data as bigint | undefined) ?? 0n;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10 relative">
        <Faucet3D />
        <h1 className="text-4xl md:text-5xl font-extrabold mt-4">Test Token <span className="text-gradient-brand">Faucet</span></h1>
        <p className="text-muted-foreground mt-2">Claim per-token, or grab them all in one transaction.</p>
        <button
          onClick={claimAll}
          disabled={!address || isPending || !!hash}
          className="mt-6 px-7 py-3 rounded-xl bg-gradient-brand text-primary-foreground font-bold shadow-neon disabled:opacity-40"
        >
          {!address ? "Connect wallet" : isPending || hash ? "Confirming…" : "💧 Claim All"}
        </button>
        <div className="text-xs text-muted-foreground mt-2">Cooldown: {Number(cd)}s</div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FAUCET_TOKENS.map((t, i) => {
          const off = (address ? 4 : 2) * i;
          const amt = reads.data?.[off]?.result as bigint | undefined;
          const max = reads.data?.[off + 1]?.result as bigint | undefined;
          const last = address ? (reads.data?.[off + 2]?.result as bigint | undefined) : undefined;
          const userCnt = address ? (reads.data?.[off + 3]?.result as bigint | undefined) : undefined;
          const now = BigInt(Math.floor(Date.now() / 1000));
          const ready = !last || now >= last + cd;
          const wait = ready ? 0 : Number((last! + cd) - now);
          const remaining = max && userCnt !== undefined ? max - userCnt : undefined;
          return (
            <div key={t.address} className="glass rounded-2xl p-5 hover:neon-border transition">
              <div className="flex items-center gap-3 mb-3">
                <img src={t.logo} alt={t.symbol} className="h-12 w-12 rounded-full" />
                <div>
                  <div className="font-bold text-lg">{t.symbol}</div>
                  <div className="text-xs text-muted-foreground">{t.name}</div>
                </div>
              </div>
              <div className="text-sm space-y-1 mb-4">
                <div className="flex justify-between"><span className="text-muted-foreground">Per claim</span><span className="font-mono">{fmt(amt, t.decimals)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Max claims</span><span className="font-mono">{max?.toString() ?? "—"}</span></div>
                {address && (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">Your claims</span><span className="font-mono">{userCnt?.toString() ?? "0"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Remaining</span><span className="font-mono">{remaining?.toString() ?? "—"}</span></div>
                  </>
                )}
              </div>
              <button
                onClick={() => claim(t.faucetIndex!)}
                disabled={!address || isPending || !!hash || !ready}
                className="w-full py-3 rounded-xl bg-surface-2 hover:bg-gradient-brand hover:text-primary-foreground border border-border hover:border-transparent transition font-semibold disabled:opacity-40"
              >
                {!address ? "Connect wallet" : !ready ? `Wait ${wait}s` : "Claim"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Faucet3D() {
  return (
    <div className="relative inline-block" style={{ perspective: "1000px" }}>
      <div className="relative h-32 w-32 mx-auto" style={{ transformStyle: "preserve-3d", transform: "rotateX(15deg) rotateY(-10deg)" }}>
        <div className="absolute inset-0 rounded-3xl bg-gradient-brand shadow-neon animate-pulse-glow" />
        <div className="absolute inset-2 rounded-2xl glass-strong flex items-center justify-center text-5xl">💧</div>
        {[0, 1, 2].map((i) => (
          <div key={i}
            className="absolute left-1/2 top-full -translate-x-1/2 h-3 w-3 rounded-full bg-accent shadow-cyan animate-drip"
            style={{ animationDelay: `${i * 0.8}s` }}
          />
        ))}
      </div>
    </div>
  );
}
