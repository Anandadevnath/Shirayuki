import type { CharacterModel, VoiceActorModel } from "../types";

/**
 * Collapse the /art cast list, which repeats the SAME character once per
 * billed voice actor (One Piece returns 26 rows for ~13 characters — one row
 * per Japanese VA). The app should show one card per character, so this
 * merges duplicate rows while preserving every distinct VA.
 *
 * Dedupe key:
 *  - Primary: the character `id`, when present. The same character always
 *    shares an id across its VA rows.
 *  - Fallback: the `name`, ONLY when `id` is null. Two distinct null-id
 *    characters must never be merged on a shared/missing name, so the
 *    provider order is preserved and each distinct name gets its own card.
 *
 * The first row for a key becomes the card's primary (its `voiceActor` stays
 * authoritative); subsequent rows contribute their VA to `voiceActors` (which
 * then includes the primary). A character billed once keeps `voiceActors`
 * undefined so single-VA markup is unchanged.
 *
 * Pure + free of provider imports so it is unit-testable under node:test
 * (mirrors lib/api/concurrency.ts).
 */
export function dedupeCharacters(characters: CharacterModel[]): CharacterModel[] {
  const index = new Map<string, number>();
  const out: CharacterModel[] = [];

  for (const c of characters) {
    const key = c.id != null ? `id:${c.id}` : `name:${c.name ?? ""}`;
    const at = index.get(key);

    if (at === undefined) {
      index.set(key, out.length);
      out.push(c);
      continue;
    }

    const existing = out[at];
    if (!c.voiceActor) continue;

    const vas: VoiceActorModel[] = existing.voiceActors
      ? [...existing.voiceActors]
      : existing.voiceActor
        ? [existing.voiceActor]
        : [];
    // Skip an exact repeat of the same VA (some payloads restate a row).
    if (!vas.some((v) => vaKey(v) === vaKey(c.voiceActor!))) {
      vas.push(c.voiceActor);
    }
    out[at] = { ...existing, voiceActors: vas };
  }

  return out;
}

function vaKey(va: VoiceActorModel): string {
  if (va.id != null) return `id:${va.id}`;
  return `name:${va.name ?? ""}`;
}
