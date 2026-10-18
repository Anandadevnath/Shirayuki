/**
 * Local-first "completed" marker for a title. Mirrors lib/watchlist/local.ts and
 * lib/progress/local.ts: a JSON map in localStorage, SSR-safe. Mutations dispatch
 * a window event so any mounted button can re-read its state without prop
 * drilling.
 */

import { isSafeStorageKey, parseStorageRecord } from "@/lib/storage/sanitize";

const KEY = "shirayuki:completed:v1";
export const COMPLETED_EVENT = "shirayuki:completed";

/**
 * Read + validate the completed map. localStorage is untrusted input: a
 * non-object payload (array/primitive) or prototype-chain keys must never
 * reach the object lookup/write path. Uses the shared storage sanitizer so
 * this map matches the guarantees in lib/progress and lib/watchlist.
 */
function read(): Record<string, true> {
  const map: Record<string, true> = Object.create(null);
  if (typeof window === "undefined") return map;
  try {
    const parsed = parseStorageRecord(localStorage.getItem(KEY));
    for (const [k, v] of Object.entries(parsed)) {
      if (v === true) map[k] = true;
    }
  } catch {
    /* corrupted JSON → treat as empty */
  }
  return map;
}

export function isCompleted(id: string): boolean {
  if (!isSafeStorageKey(id)) return false;
  return read()[id] === true;
}

export function setCompleted(id: string, done: boolean) {
  if (typeof window === "undefined") return;
  // `map["__proto__"] = true` would reassign the prototype instead of storing
  // an entry — refuse these ids outright.
  if (!isSafeStorageKey(id)) return;
  try {
    const map = read();
    if (done) map[id] = true;
    else delete map[id];
    localStorage.setItem(KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(COMPLETED_EVENT));
  } catch {
    /* quota / private mode */
  }
}
