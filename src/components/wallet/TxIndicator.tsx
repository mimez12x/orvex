import { useEffect, useRef, useState } from "react";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useTxHistory, setTxStatus, clearTxHistory, type TxRecord } from "@/lib/txHistory";
import { explorerTx } from "@/lib/chain";

function TxWatcher({ hash }: { hash: `0x${string}` }) {
  const { data, isError } = useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (data) setTxStatus(hash, data.status === "success" ? "success" : "failed");
    else if (isError) setTxStatus(hash, "failed");
  }, [data, isError, hash]);
  return null;
}

function relTime(ts: number) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatusDot({ status }: { status: TxRecord["status"] }) {
  const cls =
    status === "pending"
      ? "bg-amber-400 animate-pulse"
      : status === "success"
        ? "bg-accent"
        : "bg-destructive";
  return <span className={`h-2 w-2 rounded-full ${cls}`} />;
}

export function TxIndicator() {
  const { address } = useAccount();
  const history = useTxHistory(address);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!address) return null;

  const pending = history.filter((x) => x.status === "pending");
  const pendingCount = pending.length;

  return (
    <>
      {/* Hidden watchers keep tx state fresh across pages */}
      {pending.map((p) => (
        <TxWatcher key={p.hash} hash={p.hash as `0x${string}`} />
      ))}

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="h-9 px-3 rounded-xl glass border border-border hover:border-primary/60 transition flex items-center gap-2 text-xs font-medium"
          aria-label="Transactions"
        >
          {pendingCount > 0 ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-300">{pendingCount} pending</span>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">Activity</span>
            </>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-80 max-h-[60vh] overflow-y-auto glass-strong rounded-2xl shadow-neon border border-border z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="font-semibold text-sm">Recent activity</div>
              {history.length > 0 && (
                <button
                  onClick={() => clearTxHistory(address)}
                  className="text-[11px] text-muted-foreground hover:text-destructive"
                >
                  Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No transactions yet. Your swaps and liquidity actions will appear here.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {history.slice(0, 20).map((tx) => (
                  <li key={tx.hash} className="px-4 py-3 hover:bg-surface-2/60 transition">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <StatusDot status={tx.status} />
                        <span className="text-sm font-medium truncate">{tx.title}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{relTime(tx.ts)}</span>
                    </div>
                    <a
                      href={explorerTx(tx.hash)}
                      target="_blank"
                      rel="noreferrer"
                      className="block mt-1 text-[11px] font-mono text-accent hover:underline truncate"
                    >
                      {tx.hash.slice(0, 12)}…{tx.hash.slice(-8)} ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}