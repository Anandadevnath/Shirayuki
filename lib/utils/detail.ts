/**
 * Small pure display helpers for the anime detail page. Live in a provider-free
 * module so the server page and the client islands can import them without
 * pulling the provider graph.
 */

import type {
  AnimeCardModel,
  ScheduleItem,
  ScheduleModel,
} from "../providers/types";

/**
 * Status classification used to gate the conditional "Next episode" card and
 * the "Not yet aired" hero treatment. Deliberately string-based: the provider
 * only exposes free text ("Currently Airing", "Finished Airing", "Not yet
 * aired"), so this is the single place that interprets it.
 */
export function isAiringStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  // Finished states contain the substring "airing" ("Finished Airing"), so
  // they must be excluded BEFORE the positive match — otherwise every
  // completed title would be treated as currently airing.
  if (s.includes("finished") || s.includes("not yet") || s.includes("upcoming")) return false;
  return s.includes("airing") || s.includes("ongoing");
}

/** True for a title that has not premiered yet ("Not yet aired" / upcoming). */
export function isUnreleased(status: string | null | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s.includes("not yet") || s.includes("upcoming");
}

/**
 * Derive a 4-digit year from the provider's `aired` window (e.g.
 * "Oct 20, 1999 to ?"). The structured `premiered`/`year` fields are ALWAYS
 * null on this API, so `aired` is the only date source — never fabricate a
 * season or a year that isn't in the string.
 */
export function yearFromAired(aired: string | null | undefined): string | null {
  if (!aired) return null;
  const m = aired.match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : null;
}

/** "24m" / "24 min" → "24 min"; null when absent. */
export function formatDuration(duration: number | null | undefined): string | null {
  if (duration == null || !Number.isFinite(duration) || duration <= 0) return null;
  return `${duration} min`;
}

/* ── schedule-derived discovery rails (Ongoing / Trending) ──────────────────
 * The detail page already fetches `/schedule` for airing titles; these helpers
 * turn that snapshot into the two discovery rails WITHOUT any extra fetch and
 * WITHOUT inventing a popularity score the API does not provide.
 */

const WEEKDAY_INDEX: Record<string, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

/** Sort key that prefers a real weekly slot (`week[]` items carry airTime +
 *  weekday) over bare `airing[]` rows (weekday only), then by weekday order
 *  and air time. Unsortable rows sink to the end, order preserved. */
function scheduleSortKey(i: ScheduleItem): [number, number, string] {
  const day = i.weekday ? WEEKDAY_INDEX[i.weekday.toLowerCase()] : undefined;
  const hasTime = i.airTime != null;
  const hasDay = day !== undefined;
  const tier = hasTime && hasDay ? 0 : hasDay ? 1 : 2;
  return [tier, hasDay ? day : 99, i.airTime ?? ""];
}

/** The full currently-airing set from a schedule snapshot, newest-slot first,
 *  with the current title excluded (never recommend the page you're on). */
export function airingNow(
  schedule: ScheduleModel,
  excludeId: string,
  limit = 20,
): ScheduleItem[] {
  const seen = new Set<string>();
  const pool: ScheduleItem[] = [];
  const add = (i: ScheduleItem) => {
    if (!i.id || i.id === excludeId || seen.has(i.id)) return;
    seen.add(i.id);
    pool.push(i);
  };
  // `week[]` items carry the richest data (airTime + episodeNumber), so seed
  // them first and tag their weekday onto the item for sorting.
  const weekItems: ScheduleItem[] = [];
  for (const w of schedule.week ?? []) {
    for (const i of w.items ?? []) weekItems.push({ ...i, weekday: i.weekday ?? w.day });
  }
  for (const i of weekItems) add(i);
  for (const i of schedule.airing ?? []) add(i);
  return pool.sort((a, b) => cmpKey(a, b)).slice(0, limit);
}

/** Up to `limit` titles airing in the CURRENTLY-next slots — the same pool as
 *  `airingNow`, kept as a distinct helper so the two rails can diverge later
 *  (e.g. Trending = latest episodes only) without re-deriving the pool. */
export function recentlyAired(
  schedule: ScheduleModel,
  excludeId: string,
  limit = 14,
): ScheduleItem[] {
  return airingNow(schedule, excludeId, limit);
}

function cmpKey(a: ScheduleItem, b: ScheduleItem): number {
  const ka = scheduleSortKey(a);
  const kb = scheduleSortKey(b);
  for (let i = 0; i < ka.length; i++) {
    const va = ka[i] as string | number;
    const vb = kb[i] as string | number;
    if (va < vb) return -1;
    if (va > vb) return 1;
  }
  return 0;
}

/** Adapt a schedule row to the shared poster card so discovery rails render
 *  through the same `AnimeCard` as every other surface (one card language). */
export function scheduleItemToCard(i: ScheduleItem): AnimeCardModel {
  return {
    id: i.id,
    title: i.title,
    jname: i.jname,
    poster: i.poster,
    type: i.type,
    episodes: { sub: null, dub: null },
    airingTime: i.airTime ?? i.weekday ?? null,
    episodeNumber: null,
  };
}
