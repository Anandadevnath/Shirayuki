import type {
  CharacterModel,
  VoiceActorModel,
  VoiceActorProfileModel,
} from "../types";

/**
 * Person-first view of the cast. The /art bundle returns CHARACTER rows, each
 * carrying one (or more) billed voice actors. This reshapes them into one entry
 * per unique voice actor, listing the character(s) that VA voices on the title.
 *
 * Because a character row can carry MULTIPLE VAs (`voiceActors`, set by
 * `dedupeCharacters` when upstream bills the same character more than once),
 * the per-character VA set is flattened: `voiceActor` plus `voiceActors`
 * deduped, so a VA is never counted twice for the same character.
 *
 * Keying:
 *  - Primary: the VA `id`, when present.
 *  - Fallback: the VA `name`, ONLY when `id` is null — two distinct null-id
 *    VAs must never be merged on a shared/missing name.
 * A VA's `characters` list keeps first-appearance order and never repeats a
 * character (a VA billed twice for one character collapses to one entry).
 *
 * Pure + free of provider imports so it is unit-testable under node:test
 * (mirrors lib/providers/hianime/characters.ts).
 */
export function groupVoiceActors(
  characters: CharacterModel[],
): VoiceActorProfileModel[] {
  const index = new Map<string, number>();
  const out: VoiceActorProfileModel[] = [];

  for (const c of characters) {
    // Flatten this character's VA set: `voiceActor` is authoritative and
    // `voiceActors` (when present) already INCLUDES it, but we dedupe by key
    // so a payload that lists both without overlap still collapses cleanly.
    const vas = collectVas(c);

    for (const va of vas) {
      const key = va.id != null ? `id:${va.id}` : `name:${va.name ?? ""}`;
      const charEntry = { id: c.id, name: c.name, role: c.role };

      const at = index.get(key);
      if (at === undefined) {
        index.set(key, out.length);
        out.push({
          id: va.id,
          slug: va.slug,
          name: va.name,
          poster: va.poster,
          language: va.language,
          url: va.url,
          characters: [charEntry],
        });
        continue;
      }

      const existing = out[at];
      // Never repeat a character for the same VA.
      const already = existing.characters.some(
        (x) => (x.id != null ? x.id === c.id : x.name === c.name),
      );
      if (!already) {
        out[at] = { ...existing, characters: [...existing.characters, charEntry] };
      }
    }
  }

  return out;
}

function collectVas(c: CharacterModel): VoiceActorModel[] {
  const seen = new Set<string>();
  const vas: VoiceActorModel[] = [];
  const add = (va: VoiceActorModel | null | undefined) => {
    if (!va) return;
    const key = va.id != null ? `id:${va.id}` : `name:${va.name ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    vas.push(va);
  };
  // `voiceActor` first (authoritative primary), then the full set.
  add(c.voiceActor);
  for (const va of c.voiceActors ?? []) add(va);
  return vas;
}
