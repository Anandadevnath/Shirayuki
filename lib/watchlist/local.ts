/**
 * Local-first "My List" watchlist. Mirrors lib/progress/local.ts: a JSON map in
 * localStorage, SSR-safe. Mutations dispatch a window event so any mounted
 * button can re-read its state without prop drilling.
 */

export interface ListEntry {
  id: string;
  title: string;
  poster: string | null;
  type: string | null;
  addedAt: number;
}

const KEY = "shirayuki:watchlist:v1";
export const WATCHLIST_EVENT = "shirayuki:watchlist";

function read(): Record<string, ListEntry> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
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
  return !!read()[id];
}

export function listWatchlist(): ListEntry[] {
  return Object.values(read()).sort((a, b) => b.addedAt - a.addedAt);
}

export function removeFromList(id: string) {
  const map = read();
  delete map[id];
  write(map);
}

/** Add if absent, remove if present. Returns the new membership state. */
export function toggleList(item: Omit<ListEntry, "addedAt">): boolean {
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
