/**
 * Local-first "My List" watchlist. Mirrors lib/progress/local.ts: a JSON map in
 * localStorage, SSR-safe. Mutations dispatch a window event so any mounted
 * button can re-read its state without prop drilling.
 */

import { isSafeStorageKey, parseStorageRecord, safeFiniteNumber } from "@/lib/storage/sanitize";

export interface ListEntry {
  id: string;
  title: string;
  poster: string | null;
  type: string | null;
  addedAt: number;
}

const KEY = "shirayuki:watchlist:v1";
export const WATCHLIST_EVENT = "shirayuki:watchlist";

/**
 * Read + sanitize the stored map. localStorage is untrusted input: corrupted
 * JSON, arrays, or non-object entries would otherwise be rendered verbatim
 * and crash React ("Objects are not valid as a React child"). Prototype-
 * polluting keys are dropped by parseStorageRecord().
 */
function read(): Record<string, ListEntry> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = parseStorageRecord(localStorage.getItem(KEY));
    const map: Record<string, ListEntry> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (!v || typeof v !== "object" || Array.isArray(v)) continue;
      const e = v as Partial<ListEntry>;
      if (typeof e.id !== "string" || typeof e.title !== "string") continue;
      map[k] = {
        id: e.id,
        title: e.title,
        poster: typeof e.poster === "string" ? e.poster : null,
        type: typeof e.type === "string" ? e.type : null,
        addedAt: safeFiniteNumber(e.addedAt),
      };
    }
    return map;
  } catch {
    return {};
  }
}

function write(map: Record<string, ListEntry>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(WATCHLIST_EVENT));
  } catch {
    /* quota / private mode */
  }
}

export function isInList(id: string): boolean {
  if (!isSafeStorageKey(id)) return false;
  return !!read()[id];
}

export function listWatchlist(): ListEntry[] {
  return Object.values(read()).sort((a, b) => b.addedAt - a.addedAt);
}

export function removeFromList(id: string) {
  if (!isSafeStorageKey(id)) return;
  const map = read();
  delete map[id];
  write(map);
}

/** Add if absent, remove if present. Returns the new membership state. */
export function toggleList(item: Omit<ListEntry, "addedAt">): boolean {
  // `map[id] = {...}` on a `__proto__` id would reassign the object's
  // prototype instead of creating an entry — refuse it outright.
  if (!isSafeStorageKey(item.id)) return false;
  const map = read();
  if (map[item.id]) {
    delete map[item.id];
    write(map);
    return false;
  }
  map[item.id] = { ...item, addedAt: Date.now() };
  write(map);
  return true;
}
