import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { ADDR } from "@/lib/chain";
import { farmAbi } from "@/lib/abis/farm";
import { TOKENS } from "@/lib/tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { Sprout, TrendingUp, Coins, Loader2 } from "lucide-react";

export const Route = createFileRoute("/farm")({
  component: FarmPage,
  head: () => ({
    meta: [
      { title: "Yield Farm — ORVEX" },
      { name: "description", content: "Stake LP tokens and earn ORVX rewards on the LitVM network." },
      { property: "og:title", content: "Yield Farm — ORVEX" },
      { property: "og:description", content: "Stake LP tokens and earn ORVX rewards on LitVM." },
      { property: "og:url", content: "https://orvexdex.lovable.app/farm" },
      { name: "twitter:title", content: "Yield Farm — ORVEX" },
      { name: "twitter:description", content: "Stake LP tokens and earn ORVX rewards on LitVM." },
    ],
    links: [{ rel: "canonical", href: "https://orvexdex.lovable.app/farm" }],
  }),
});

function tokenMeta(addr?: string) {
  if (!addr) return null;
  return TOKENS.find((t) => t.address.toLowerCase() === addr.toLowerCase()) ?? null;
}

function FarmPage() {
  const { address } = useAccount();
  const toast = useToast();

  const poolLength = useReadContract({ address: ADDR.farm, abi: farmAbi, functionName: "poolLength" });
  const rewardToken = useReadContract({ address: ADDR.farm, abi: farmAbi, functionName: "rewardToken" });
  const rewardPerBlock = useReadContract({ address: ADDR.farm, abi: farmAbi, functionName: "rewardPerBlock" });
  const totalAlloc = useReadContract({ address: ADDR.farm, abi: farmAbi, functionName: "totalAllocPoint" });

  const count = Number(poolLength.data ?? 0n);
  const pids = useMemo(() => Array.from({ length: count }, (_, i) => BigInt(i)), [count]);

  const poolCalls = useMemo(
    () => pids.map((pid) => ({ address: ADDR.farm, abi: farmAbi, functionName: "poolInfo" as const, args: [pid] })),
    [pids],
  );
  const pools = useReadContracts({ contracts: poolCalls, query: { enabled: poolCalls.length > 0, refetchInterval: 15000 } });

  const userCalls = useMemo(() => {
    if (!address) return [];
    const out: any[] = [];
    pids.forEach((pid) => {
      out.push({ address: ADDR.farm, abi: farmAbi, functionName: "userInfo", args: [pid, address] });
      out.push({ address: ADDR.farm, abi: farmAbi, functionName: "pendingReward", args: [pid, address] });
    });
    return out;
  }, [pids, address]);
  const userReads = useReadContracts({ contracts: userCalls, query: { enabled: userCalls.length > 0, refetchInterval: 10000 } });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Sprout className="h-5 w-5 text-primary" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Yield Farming</span>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Stake. Earn. Compound.</h1>
        <p className="text-muted-foreground max-w-2xl">
          Deposit supported tokens into the ORVEX MasterChef and earn ORVX every block. Rewards stream from a shared
          emission split by pool allocation.
        </p>
      </header>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={<Coins className="h-4 w-4" />} label="Reward Token" value={rewardToken.data ? short(rewardToken.data as string) : "—"} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Reward / Block" value={rewardPerBlock.data ? `${formatUnits(rewardPerBlock.data as bigint, 18)} ORVX` : "—"} />
        <StatCard icon={<Sprout className="h-4 w-4" />} label="Active Pools" value={`${count}`} />
      </div>

      {count === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No farming pools have been created yet. The admin can add pools via <code>addPool()</code>.
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {pids.map((pid, i) => {
          const info = pools.data?.[i]?.result as
            | readonly [string, bigint, bigint, bigint, bigint]
            | undefined;
          if (!info) return <PoolSkeleton key={i} />;
          const [stakingToken, allocPoint, , , totalStaked] = info;
          const user = userReads.data?.[i * 2]?.result as readonly [bigint, bigint] | undefined;
          const pending = (userReads.data?.[i * 2 + 1]?.result as bigint | undefined) ?? 0n;
          return (
            <PoolCard
              key={pid.toString()}
              pid={pid}
              stakingToken={stakingToken as `0x${string}`}
              allocPoint={allocPoint}
              totalAlloc={(totalAlloc.data as bigint | undefined) ?? 0n}
              totalStaked={totalStaked}
              staked={user?.[0] ?? 0n}
              pending={pending}
              onChange={() => {
                pools.refetch();
                userReads.refetch();
              }}
              toastPush={toast.push}
              userAddress={address}
            />
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="glass">
      <CardContent className="py-5">
        <div className="text-xs text-muted-foreground flex items-center gap-2">{icon}{label}</div>
        <div className="mt-1 font-mono text-lg">{value}</div>
      </CardContent>
    </Card>
  );
}

function PoolSkeleton() {
  return <Card className="h-48 animate-pulse" />;
}

function short(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function PoolCard({
  pid,
  stakingToken,
  allocPoint,
  totalAlloc,
  totalStaked,
  staked,
  pending,
  onChange,
  toastPush,
  userAddress,
}: {
  pid: bigint;
  stakingToken: `0x${string}`;
  allocPoint: bigint;
  totalAlloc: bigint;
  totalStaked: bigint;
  staked: bigint;
  pending: bigint;
  onChange: () => void;
  toastPush: ReturnType<typeof useToast>["push"];
  userAddress?: `0x${string}`;
}) {
  const meta = tokenMeta(stakingToken);
  const symbol = meta?.symbol ?? "LP";
  const decimals = meta?.decimals ?? 18;

  const balance = useReadContract({
    address: stakingToken,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress, refetchInterval: 12000 },
  });
  const allowance = useReadContract({
    address: stakingToken,
    abi: erc20Abi,
    functionName: "allowance",
    args: userAddress ? [userAddress, ADDR.farm] : undefined,
    query: { enabled: !!userAddress, refetchInterval: 12000 },
  });

  const { writeContractAsync, isPending } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const receipt = useWaitForTransactionReceipt({ hash });
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");

  useEffect(() => {
    if (receipt.isSuccess && hash) {
      toastPush({ title: "Transaction confirmed", type: "success", hash });
      setHash(undefined);
      setAmount("");
      balance.refetch();
      allowance.refetch();
      onChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess]);

  const allocPct = totalAlloc > 0n ? (Number(allocPoint) * 100) / Number(totalAlloc) : 0;
  const parsed = (() => {
    try { return amount ? parseUnits(amount, decimals) : 0n; } catch { return 0n; }
  })();
  const needsApprove = mode === "deposit" && parsed > 0n && (allowance.data as bigint | undefined ?? 0n) < parsed;

  async function run(action: "approve" | "deposit" | "withdraw" | "claim" | "emergency") {
    if (!userAddress) {
      toastPush({ title: "Connect wallet first", type: "error" });
      return;
    }
    try {
      let h: `0x${string}`;
      if (action === "approve") {
        h = await writeContractAsync({
          address: stakingToken,
          abi: erc20Abi,
          functionName: "approve",
          args: [ADDR.farm, 2n ** 256n - 1n],
        });
      } else if (action === "deposit") {
        h = await writeContractAsync({ address: ADDR.farm, abi: farmAbi, functionName: "deposit", args: [pid, parsed] });
      } else if (action === "withdraw") {
        h = await writeContractAsync({ address: ADDR.farm, abi: farmAbi, functionName: "withdraw", args: [pid, parsed] });
      } else if (action === "claim") {
        h = await writeContractAsync({ address: ADDR.farm, abi: farmAbi, functionName: "claimReward", args: [pid] });
      } else {
        h = await writeContractAsync({ address: ADDR.farm, abi: farmAbi, functionName: "emergencyWithdraw", args: [pid] });
      }
      setHash(h);
      toastPush({ title: "Transaction submitted", type: "info", hash: h });
    } catch (e: any) {
      toastPush({ title: e?.shortMessage ?? e?.message ?? "Transaction failed", type: "error" });
    }
  }

  return (
    <Card className="glass overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            {meta && <img src={meta.logo} alt={symbol} className="h-6 w-6 rounded-full" />}
            {symbol} Pool
          </CardTitle>
          <div className="text-xs text-muted-foreground mt-1 font-mono">{short(stakingToken)} · pid #{pid.toString()}</div>
        </div>
        <Badge variant="secondary">{allocPct.toFixed(1)}% alloc</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Total Staked" value={`${formatUnits(totalStaked, decimals)} ${symbol}`} />
          <Stat label="Your Stake" value={`${formatUnits(staked, decimals)} ${symbol}`} />
          <Stat label="Wallet" value={`${formatUnits((balance.data as bigint | undefined) ?? 0n, decimals)} ${symbol}`} />
          <Stat label="Pending ORVX" value={`${formatUnits(pending, 18)}`} highlight />
        </div>

        <div className="flex gap-1 p-1 glass rounded-lg">
          <button
            onClick={() => setMode("deposit")}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium ${mode === "deposit" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >Stake</button>
          <button
            onClick={() => setMode("withdraw")}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium ${mode === "withdraw" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >Unstake</button>
        </div>

        <div className="space-y-2">
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          />
          <div className="flex gap-2">
            {needsApprove ? (
              <Button className="flex-1" disabled={isPending || !!hash} onClick={() => run("approve")}>
                {isPending || hash ? <Loader2 className="h-4 w-4 animate-spin" /> : `Approve ${symbol}`}
              </Button>
            ) : (
              <Button
                className="flex-1"
                disabled={isPending || !!hash || parsed <= 0n}
                onClick={() => run(mode)}
              >
                {isPending || hash ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "deposit" ? "Stake" : "Unstake"}
              </Button>
            )}
            <Button variant="secondary" disabled={isPending || !!hash || pending === 0n} onClick={() => run("claim")}>
              Harvest
            </Button>
          </div>
          <Button
            variant="ghost"
            className="w-full text-xs text-destructive hover:text-destructive"
            onClick={() => run("emergency")}
            disabled={isPending || !!hash || staked === 0n}
          >
            Emergency withdraw (forfeits rewards)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-mono text-sm ${highlight ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}