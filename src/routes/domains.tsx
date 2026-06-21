import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
} from "wagmi";
import { createPublicClient, encodeAbiParameters, formatEther, http, keccak256, parseEther, stringToBytes, toHex } from "viem";
import { ADDR, litvm } from "@/lib/chain";
import { domainControllerAbi } from "@/lib/abis/domainController";
import { baseRegistrarAbi } from "@/lib/abis/baseRegistrar";
import { publicResolverAbi } from "@/lib/abis/publicResolver";
// import { registryAbi } from "@/lib/abis/registry"; // Tersedia untuk integrasi lanjutan (ENS-like subnode resolver)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useToast } from "@/components/ui/toaster";
import {
  Globe2,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Minus,
  Plus,
  Crown,
  Sparkles,
  ShieldCheck,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/domains")({
  component: DomainsPage,
  head: () => ({
    meta: [
      { title: "Domains — ORVEX Name Service" },
      { name: "description", content: "Mint, manage, and resolve .orvx Web3 domains on the LitVM network." },
      { property: "og:title", content: "Domains — ORVEX Name Service" },
      { property: "og:description", content: "Mint, manage, and resolve .orvx Web3 domains on LitVM." },
      { property: "og:url", content: "https://orvexdex.lovable.app/domains" },
      { name: "twitter:title", content: "Domains — ORVEX Name Service" },
      { name: "twitter:description", content: "Mint, manage, and resolve .orvx Web3 domains on LitVM." },
    ],
    links: [{ rel: "canonical", href: "https://orvexdex.lovable.app/domains" }],
  }),
});

const TLD = ".orvx";
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

// ── Util: sanitasi input domain (huruf kecil, tanpa spasi/karakter khusus) ──
function sanitize(raw: string) {
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
}

// ── Util: tokenId untuk BaseRegistrar = keccak256(label) ──
function labelTokenId(name: string): bigint {
  return BigInt(keccak256(stringToBytes(name)));
}

// ── Util: simpan & ambil "secret" lokal untuk commit-reveal ──
function loadSecret(name: string): `0x${string}` | null {
  if (typeof window === "undefined") return null;
  return (window.localStorage.getItem(`orvex.ns.secret.${name}`) as `0x${string}` | null) ?? null;
}
function saveSecret(name: string, secret: `0x${string}`) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`orvex.ns.secret.${name}`, secret);
}
function loadCommitTs(name: string): number | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(`orvex.ns.commitAt.${name}`);
  return v ? Number(v) : null;
}
function saveCommitTs(name: string, ts: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`orvex.ns.commitAt.${name}`, String(ts));
}
function loadOwned(addr?: string): string[] {
  if (!addr || typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(`orvex.ns.owned.${addr.toLowerCase()}`) ?? "[]");
  } catch {
    return [];
  }
}
function saveOwned(addr: string, names: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`orvex.ns.owned.${addr.toLowerCase()}`, JSON.stringify(Array.from(new Set(names))));
}

function DomainsPage() {
  const { address, isConnected } = useAccount();
  const toast = useToast();

  // ── Header status dompet ───────────────────────────────────────────────
  const reverse = useReadContract({
    address: ADDR.publicResolver,
    abi: publicResolverAbi,
    functionName: "getReverse",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30000 },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header halaman internal */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-primary" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">DEX Name Service</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">Your wallet, finally readable.</h1>
          <p className="text-muted-foreground max-w-2xl">
            Mint a <span className="font-mono text-foreground">{TLD}</span> domain as an NFT, point it to any chain,
            and use it across the ORVEX ecosystem instead of long hex addresses.
          </p>
        </div>
        <div className="glass rounded-xl px-4 py-3 text-sm min-w-[220px]">
          <div className="text-xs text-muted-foreground">Wallet</div>
          {isConnected && address ? (
            <div className="mt-1 space-y-1">
              <div className="font-mono text-xs">{address.slice(0, 6)}…{address.slice(-4)}</div>
              {reverse.data ? (
                <Badge className="bg-gradient-brand text-primary-foreground">{reverse.data as string}{TLD}</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">No primary domain set</span>
              )}
            </div>
          ) : (
            <div className="mt-2"><ConnectButton /></div>
          )}
        </div>
      </header>

      <SearchPanel address={address} toast={toast} />

      <MyDomains address={address} reverseName={(reverse.data as string) || ""} onPrimaryChanged={() => reverse.refetch()} toast={toast} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH & VERIFY
// ─────────────────────────────────────────────────────────────────────────────
function SearchPanel({ address, toast }: { address?: `0x${string}`; toast: ReturnType<typeof useToast> }) {
  const [raw, setRaw] = useState("");
  const [queried, setQueried] = useState<string | null>(null);
  const [duration, setDuration] = useState(1); // tahun

  const name = sanitize(raw);

  // ── Real-time validation ─────────────────────────────────────────────
  const tooShort = name.length > 0 && name.length < 3;
  const valid = name.length >= 3 && name.length <= 32;

  // ── On-chain availability (DomainRegistrarController.isAvailable) ────
  const avail = useReadContract({
    address: ADDR.domainController,
    abi: domainControllerAbi,
    functionName: "isAvailable",
    args: queried ? [queried] : undefined,
    query: { enabled: !!queried },
  });
  // ── Price (DomainRegistrarController.price) — durasi dalam detik ────
  const priceRead = useReadContract({
    address: ADDR.domainController,
    abi: domainControllerAbi,
    functionName: "price",
    args: queried ? [queried, BigInt(duration * SECONDS_PER_YEAR)] : undefined,
    query: { enabled: !!queried },
  });
  // ── Owner & expiry kalau sudah dimiliki (DomainRegistrarController.domains) ──
  const owned = useReadContract({
    address: ADDR.domainController,
    abi: domainControllerAbi,
    functionName: "domains",
    args: queried ? [queried] : undefined,
    query: { enabled: !!queried },
  });

  // ── Commit-reveal delay dari kontrak (untuk timer) ──────────────────
  const commitDelay = useReadContract({
    address: ADDR.domainController,
    abi: domainControllerAbi,
    functionName: "COMMIT_REVEAL_DELAY",
  });

  function handleSearch() {
    // PLACEHOLDER (sudah live): trigger pembacaan `isAvailable`, `price`, dan `domains`
    // dari DomainRegistrarController dengan nama yang sudah disanitasi.
    if (!valid) {
      toast.push({ title: "Nama minimal 3 karakter, hanya a-z 0-9 -", type: "error" });
      return;
    }
    setQueried(name);
  }

  return (
    <section className="space-y-6">
      {/* Search box */}
      <Card className="glass">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row gap-3 items-stretch">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 pr-20 h-12 text-base"
                placeholder="cari nama domain"
                value={raw}
                onChange={(e) => setRaw(sanitize(e.target.value))}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                spellCheck={false}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">{TLD}</span>
            </div>
            <Button size="lg" className="h-12 px-6" onClick={handleSearch} disabled={!valid}>
              <Search className="h-4 w-4" /> Cek Ketersediaan
            </Button>
          </div>
          {tooShort && (
            <div className="mt-2 text-xs text-amber-500">Minimal 3 karakter.</div>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      {queried && (
        <ResultCard
          name={queried}
          available={avail.data as boolean | undefined}
          loading={avail.isLoading || priceRead.isLoading || owned.isLoading}
          price={priceRead.data as bigint | undefined}
          ownerInfo={owned.data as readonly [string, bigint] | undefined}
          duration={duration}
          setDuration={setDuration}
          commitDelay={(commitDelay.data as bigint | undefined) ?? 60n}
          address={address}
          toast={toast}
          onMinted={() => {
            avail.refetch();
            owned.refetch();
          }}
        />
      )}
    </section>
  );
}

function ResultCard({
  name,
  available,
  loading,
  price,
  ownerInfo,
  duration,
  setDuration,
  commitDelay,
  address,
  toast,
  onMinted,
}: {
  name: string;
  available?: boolean;
  loading: boolean;
  price?: bigint;
  ownerInfo?: readonly [string, bigint];
  duration: number;
  setDuration: (n: number) => void;
  commitDelay: bigint;
  address?: `0x${string}`;
  toast: ReturnType<typeof useToast>;
  onMinted: () => void;
}) {
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const { writeContractAsync, isPending } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  // ── Local commit state (untuk countdown reveal) ──
  const [committedAt, setCommittedAt] = useState<number | null>(() => loadCommitTs(name));
  useEffect(() => { setCommittedAt(loadCommitTs(name)); }, [name]);

  // tick untuk countdown
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const waitLeft = committedAt ? Math.max(0, Number(commitDelay) - (now - committedAt)) : 0;

  useEffect(() => {
    if (receipt.isSuccess && hash) {
      toast.push({ title: "Transaction confirmed", type: "success", hash });
      setHash(undefined);
      onMinted();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess]);

  // ── Step 1: COMMIT (anti front-running) ─────────────────────────────
  async function handleCommit() {
    if (!address) { toast.push({ title: "Hubungkan dompet terlebih dahulu", type: "error" }); return; }
    try {
      // generate secret 32 byte (atau pakai yang tersimpan)
      let secret = loadSecret(name);
      if (!secret) {
        const bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);
        secret = toHex(bytes);
        saveSecret(name, secret);
      }
      // hitung commitment off-chain (makeCommitment juga bisa dipakai via read; di sini hash manual sesuai kontrak)
      // makeCommitment(name, registrant, secret) = keccak256(abi.encode(name, registrant, secret))
      // gunakan call ke kontrak (pure) untuk konsistensi
      const commitment = await readMakeCommitment(name, address, secret);
      const h = await writeContractAsync({
        address: ADDR.domainController,
        abi: domainControllerAbi,
        functionName: "commit",
        args: [commitment, name],
      });
      setHash(h);
      saveCommitTs(name, Math.floor(Date.now() / 1000));
      setCommittedAt(Math.floor(Date.now() / 1000));
      toast.push({ title: "Commitment submitted", type: "info", hash: h });
    } catch (e: any) {
      toast.push({ title: e?.shortMessage ?? e?.message ?? "Commit gagal", type: "error" });
    }
  }

  // ── Step 2: REGISTER (reveal + bayar) ───────────────────────────────
  async function handleMint() {
    if (!address) { toast.push({ title: "Hubungkan dompet terlebih dahulu", type: "error" }); return; }
    const secret = loadSecret(name);
    if (!secret) { toast.push({ title: "Secret tidak ditemukan — commit ulang", type: "error" }); return; }
    try {
      const h = await writeContractAsync({
        address: ADDR.domainController,
        abi: domainControllerAbi,
        functionName: "register",
        args: [name, address, BigInt(duration * SECONDS_PER_YEAR), secret],
        value: price ?? 0n,
      });
      setHash(h);
      toast.push({ title: "Mint submitted", type: "info", hash: h });
      // catat ke "my domains" lokal
      const list = loadOwned(address);
      saveOwned(address, [...list, name]);
    } catch (e: any) {
      toast.push({ title: e?.shortMessage ?? e?.message ?? "Mint gagal", type: "error" });
    }
  }

  // ── Tarif estimasi lokal kalau price belum termuat (fallback display) ──
  const estUsd = (() => {
    const perYear = name.length === 3 ? 100 : name.length === 4 ? 50 : 5;
    return perYear * duration;
  })();

  if (loading && available === undefined) {
    return (
      <Card className="glass">
        <CardContent className="py-10 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Memeriksa ketersediaan…
        </CardContent>
      </Card>
    );
  }

  if (available === false) {
    const [own, expires] = ownerInfo ?? ["0x0000000000000000000000000000000000000000", 0n];
    return (
      <Card className="glass border-destructive/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="font-mono">{name}{TLD}</span>
            <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Sudah Dimiliki</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div>
            <span className="text-muted-foreground">Pemilik:</span>{" "}
            <span className="font-mono">{own.slice(0, 6)}…{own.slice(-4)}</span>
          </div>
          {expires > 0n && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" /> Berlaku hingga {new Date(Number(expires) * 1000).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Available
  return (
    <Card className="glass border-emerald-500/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <span className="font-mono">{name}{TLD}</span>
          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Tersedia
          </Badge>
          {name.length === 3 && <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" /> Premium</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Durasi</div>
            <div className="mt-1 flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={() => setDuration(Math.max(1, duration - 1))}><Minus className="h-3 w-3" /></Button>
              <div className="w-16 text-center font-mono">{duration} thn</div>
              <Button size="icon" variant="outline" onClick={() => setDuration(Math.min(5, duration + 1))}><Plus className="h-3 w-3" /></Button>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Harga on-chain</div>
            <div className="mt-1 font-mono text-lg">
              {price !== undefined ? `${formatEther(price)} zkLTC` : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Estimasi tarif</div>
            <div className="mt-1 font-mono text-lg">≈ ${estUsd}</div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card/40 p-3 text-xs text-muted-foreground flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />
          <div>
            Pendaftaran memakai pola <strong>commit → tunggu {Number(commitDelay)}s → register</strong> untuk mencegah
            front-running. Lovable menyimpan secret di browser Anda.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {!committedAt || waitLeft === 0 ? (
            committedAt && waitLeft === 0 ? (
              <Button className="flex-1" disabled={isPending || !!hash || !address} onClick={handleMint}>
                {isPending || hash ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Mint Domain {price !== undefined && `· ${formatEther(price)} zkLTC`}</>}
              </Button>
            ) : (
              <Button className="flex-1" disabled={isPending || !!hash || !address} onClick={handleCommit}>
                {isPending || hash ? <Loader2 className="h-4 w-4 animate-spin" /> : "Step 1 — Commit"}
              </Button>
            )
          ) : (
            <Button className="flex-1" disabled>
              <Loader2 className="h-4 w-4 animate-spin" /> Reveal dalam {waitLeft}s…
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MY DOMAINS
// ─────────────────────────────────────────────────────────────────────────────
function MyDomains({
  address,
  reverseName,
  onPrimaryChanged,
  toast,
}: {
  address?: `0x${string}`;
  reverseName: string;
  onPrimaryChanged: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  // Daftar nama dari cache lokal + event listener DomainRegistered (filtered by owner)
  const [names, setNames] = useState<string[]>(() => loadOwned(address));
  useEffect(() => { setNames(loadOwned(address)); }, [address]);

  useWatchContractEvent({
    address: ADDR.domainController,
    abi: domainControllerAbi,
    eventName: "DomainRegistered",
    onLogs: (logs) => {
      if (!address) return;
      const mine = logs
        .filter((l: any) => (l.args?.owner as string | undefined)?.toLowerCase() === address.toLowerCase())
        .map((l: any) => l.args?.name as string)
        .filter(Boolean);
      if (mine.length) {
        const next = Array.from(new Set([...names, ...mine]));
        saveOwned(address, next);
        setNames(next);
      }
    },
  });

  // Cek expiries & owner on-chain (untuk validasi cache lokal)
  const calls = useMemo(() => {
    const out: any[] = [];
    names.forEach((n) => {
      out.push({ address: ADDR.baseRegistrar, abi: baseRegistrarAbi, functionName: "expiries", args: [labelTokenId(n)] });
      out.push({ address: ADDR.baseRegistrar, abi: baseRegistrarAbi, functionName: "ownerOf", args: [labelTokenId(n)] });
    });
    return out;
  }, [names]);
  const reads = useReadContracts({ contracts: calls, query: { enabled: calls.length > 0, refetchInterval: 30000 } });

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Domain Saya</h2>
          <p className="text-sm text-muted-foreground">NFT domain yang dimiliki dompet ini.</p>
        </div>
      </div>

      {!address && (
        <Card className="glass"><CardContent className="py-8 text-center text-muted-foreground">Hubungkan dompet untuk melihat domain Anda.</CardContent></Card>
      )}
      {address && names.length === 0 && (
        <Card className="glass"><CardContent className="py-8 text-center text-muted-foreground">Belum ada domain. Cari nama di atas dan mint.</CardContent></Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {names.map((n, i) => {
          const expiry = reads.data?.[i * 2]?.result as bigint | undefined;
          const owner = reads.data?.[i * 2 + 1]?.result as string | undefined;
          const isMine = !!owner && !!address && owner.toLowerCase() === address.toLowerCase();
          const isPrimary = reverseName.toLowerCase() === n.toLowerCase();
          return (
            <DomainCard
              key={n}
              name={n}
              expiry={expiry}
              isMine={isMine}
              isPrimary={isPrimary}
              address={address}
              toast={toast}
              onPrimaryChanged={onPrimaryChanged}
            />
          );
        })}
      </div>
    </section>
  );
}

function DomainCard({
  name,
  expiry,
  isMine,
  isPrimary,
  address,
  toast,
  onPrimaryChanged,
}: {
  name: string;
  expiry?: bigint;
  isMine: boolean;
  isPrimary: boolean;
  address?: `0x${string}`;
  toast: ReturnType<typeof useToast>;
  onPrimaryChanged: () => void;
}) {
  const { writeContractAsync, isPending } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const receipt = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (receipt.isSuccess && hash) {
      toast.push({ title: "Primary domain updated", type: "success", hash });
      setHash(undefined);
      onPrimaryChanged();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess]);

  // ── handleSetPrimary: panggil PublicResolver.setReverse(user, name) ──
  async function handleSetPrimary() {
    if (!address) { toast.push({ title: "Hubungkan dompet", type: "error" }); return; }
    try {
      const h = await writeContractAsync({
        address: ADDR.publicResolver,
        abi: publicResolverAbi,
        functionName: "setReverse",
        args: [address, name],
      });
      setHash(h);
      toast.push({ title: "Setting primary…", type: "info", hash: h });
    } catch (e: any) {
      toast.push({ title: e?.shortMessage ?? e?.message ?? "Gagal set primary", type: "error" });
    }
  }

  // ── handleRenew: panggil DomainRegistrarController.renew(name, duration) ──
  async function handleRenew() {
    if (!address) return;
    try {
      const h = await writeContractAsync({
        address: ADDR.domainController,
        abi: domainControllerAbi,
        functionName: "renew",
        args: [name, BigInt(SECONDS_PER_YEAR)],
        value: parseEther("0.01"), // estimasi; UI bisa baca price() dulu di iterasi berikutnya
      });
      setHash(h);
      toast.push({ title: "Renewing…", type: "info", hash: h });
    } catch (e: any) {
      toast.push({ title: e?.shortMessage ?? e?.message ?? "Gagal renew", type: "error" });
    }
  }

  const expDate = expiry && expiry > 0n ? new Date(Number(expiry) * 1000) : null;
  const expired = expDate ? expDate.getTime() < Date.now() : false;

  return (
    <Card className={`glass overflow-hidden ${isPrimary ? "border-primary/50" : ""}`}>
      <div className="h-24 bg-gradient-luxe relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-2xl text-primary-foreground/90 drop-shadow">{name}{TLD}</span>
        </div>
        {isPrimary && (
          <Badge className="absolute top-2 right-2 bg-background/80 text-foreground gap-1">
            <Crown className="h-3 w-3" /> Primary
          </Badge>
        )}
      </div>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Status</span>
          {expDate ? (
            <span className={expired ? "text-destructive" : "text-emerald-400"}>
              {expired ? "Expired" : `Aktif s/d ${expDate.toLocaleDateString()}`}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            variant={isPrimary ? "secondary" : "default"}
            disabled={!isMine || isPending || !!hash || isPrimary}
            onClick={handleSetPrimary}
          >
            {isPending || hash ? <Loader2 className="h-4 w-4 animate-spin" /> : isPrimary ? "Sudah Primary" : "Jadikan Primary"}
          </Button>
          <Button variant="outline" disabled={!isMine || isPending || !!hash} onClick={handleRenew}>
            Renew 1y
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: panggil makeCommitment (pure) via JSON-RPC tanpa hook
// (dipakai sekali sebelum tx commit). Fallback ke hash lokal jika RPC gagal.
// ─────────────────────────────────────────────────────────────────────────────
async function readMakeCommitment(name: string, registrant: `0x${string}`, secret: `0x${string}`): Promise<`0x${string}`> {
  try {
    const client = createPublicClient({ chain: litvm, transport: http() });
    const c = await client.readContract({
      address: ADDR.domainController,
      abi: domainControllerAbi,
      functionName: "makeCommitment",
      args: [name, registrant, secret],
    });
    return c as `0x${string}`;
  } catch {
    // Fallback: hitung lokal sesuai signature umum keccak256(abi.encode(name, registrant, secret))
    const encoded = encodeAbiParameters(
      [{ type: "string" }, { type: "address" }, { type: "bytes32" }],
      [name, registrant, secret],
    );
    return keccak256(encoded);
  }
}