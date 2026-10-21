/**
 * Small pure display helpers for the anime detail page. Live in a provider-free
 * module so the server page and the client islands can import them without
 * pulling the provider graph.
 */

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
