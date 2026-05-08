import { useSyncExternalStore } from "react";

export type TxStatus = "pending" | "success" | "failed";
export type TxRecord = {
  hash: string;
  title: string;
  account: string;
  ts: number;
  status: TxStatus;
};

const KEY = "orvex.txhistory.v1";
const MAX = 50;

let state: TxRecord[] = load();
const listeners = new Set<() => void>();

function load(): TxRecord[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TxRecord[]) : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state.slice(0, MAX)));
  } catch {
    /* noop */
  }
  listeners.forEach((l) => l());
}

export function addTx(rec: { hash: string; title: string; account: string }) {
  if (!rec.hash || !rec.account) return;
  state = [
    { ...rec, ts: Date.now(), status: "pending" as TxStatus },
    ...state.filter((x) => x.hash.toLowerCase() !== rec.hash.toLowerCase()),
  ].slice(0, MAX);
  persist();
}

export function setTxStatus(hash: string, status: TxStatus) {
  let changed = false;
  state = state.map((x) => {
    if (x.hash.toLowerCase() === hash.toLowerCase() && x.status !== status) {
      changed = true;
      return { ...x, status };
    }
    return x;
  });
  if (changed) persist();
}

export function clearTxHistory(account?: string) {
  state = account ? state.filter((x) => x.account.toLowerCase() !== account.toLowerCase()) : [];
  persist();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useTxHistory(account?: string): TxRecord[] {
  const all = useSyncExternalStore(subscribe, () => state, () => state);
  if (!account) return [];
  const a = account.toLowerCase();
  return all.filter((x) => x.account.toLowerCase() === a);
}