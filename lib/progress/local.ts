/**
 * Local-first watch progress (the "trustworthy Continue Watching" differentiator).
 * Stored in localStorage now; swap for IndexedDB + server sync in Phase 4.
 */

import { isSafeStorageKey, parseStorageRecord, safeFiniteNumber } from "@/lib/storage/sanitize";

export interface WatchEntry {
  animeId: string;
  title: string;
  poster: string | null;
  episodeId: string; // opaque provider episode id (never parsed)
  episodeNumber: number;
  category: string;
  server: string;
  seconds: number;
  duration: number;
  updatedAt: number;
}

// Active provider is HiAnime, whose anime ids are slugs (e.g. "witch-hat-atelier-18133").
const KEY = "shirayuki:progress:v2";

function read(): Record<string, WatchEntry> {
  if (typeof window === "undefined") return {};
  try {
    // Sanitize every entry: localStorage is untrusted (corrupted JSON, manual
    // edits, stale shapes) and a malformed entry would crash rendering later.
    // Also drop legacy AnimeX entries: their numeric ids can't be resolved by
    // HiAnime, so clicking one lands on the not-found page. HiAnime slugs are
    // never purely numeric, so a numeric key is always a stale entry.
    // parseStorageRecord() also strips prototype-polluting keys.
    const parsed = parseStorageRecord(localStorage.getItem(KEY));
    const clean: Record<string, WatchEntry> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (/^\d+$/.test(k)) continue;
      if (!v || typeof v !== "object" || Array.isArray(v)) continue;
      const e = v as Partial<WatchEntry>;
      if (typeof e.animeId !== "string" || typeof e.episodeId !== "string" || typeof e.title !== "string") continue;
      clean[k] = {
        animeId: e.animeId,
        title: e.title,
        poster: typeof e.poster === "string" ? e.poster : null,
        episodeId: e.episodeId,
        episodeNumber: safeFiniteNumber(e.episodeNumber),
        category: typeof e.category === "string" ? e.category : "",
        server: typeof e.server === "string" ? e.server : "",
        seconds: safeFiniteNumber(e.seconds),
        duration: safeFiniteNumber(e.duration),
        updatedAt: safeFiniteNumber(e.updatedAt),
      };
    }
    return clean;
  } catch {
    return {};
  }
}

function write(map: Record<string, WatchEntry>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode */
  }
}

export function saveProgress(entry: WatchEntry) {
  // `map[entry.animeId]` with an unsafe key would reassign the object's
  // prototype instead of storing an entry (prototype pollution); a numeric
  // key is a stale AnimeX id that HiAnime can never resolve. Refuse both so
  // the write path stays consistent with the sanitizer in read().
  if (!isSafeStorageKey(entry.animeId) || /^\d+$/.test(entry.animeId)) return;
  const map = read();
  map[entry.animeId] = entry;
  write(map);
}

export function getProgress(animeId: string): WatchEntry | null {
  return read()[animeId] ?? null;
}

export function getEpisodeSeconds(episodeId: string): number {
  const map = read();
  for (const e of Object.values(map)) {
    if (e.episodeId === episodeId) return e.seconds;
  }
  return 0;
}

export function listProgress(): WatchEntry[] {
  return Object.values(read())
    .filter((e) => e.duration > 0 && e.seconds / e.duration < 0.97)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function removeProgress(animeId: string) {
  const map = read();
  delete map[animeId];
  write(map);
}
