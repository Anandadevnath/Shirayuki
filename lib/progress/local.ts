/**
 * Local-first watch progress (the "trustworthy Continue Watching" differentiator).
 * Stored in localStorage now; swap for IndexedDB + server sync in Phase 4.
 */

export interface WatchEntry {
  animeId: string;
  title: string;
  poster: string | null;
  episodeId: string; // "<animeId>:<ep>" e.g. "147105:1"
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
    const map: Record<string, WatchEntry> = JSON.parse(localStorage.getItem(KEY) || "{}");
    // Drop legacy AnimeX entries: their numeric ids can't be resolved by HiAnime,
    // so clicking one lands on the not-found page. HiAnime slugs are never purely
    // numeric, so a numeric key is always a stale entry.
    const clean: Record<string, WatchEntry> = {};
    for (const [k, v] of Object.entries(map)) {
      if (!/^\d+$/.test(k)) clean[k] = v;
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
