# Detail page — add Voice Actors, Ongoing & Trending sections

Plan file: `.kilo/plans/1792583624695-detail-page-voice-actors-ongoing-trending.md`

## Goal

Add three sections to `/anime/[id]` — **Voice Actors**, **Ongoing**, **Trending** — that integrate with the existing cinematic detail page, reusing its card language and section rhythm, without adding latency to non-airing pages.

## Decisions (locked with the user)

1. **Data source for Ongoing & Trending = `getSchedule()`**, already fetched by the page for airing titles. **No `getHome` re-introduction.**
2. **"Trending" = recently-airing titles** derived from the schedule, ordered by recency, excluding the current title (the schedule has no popularity score, so the label must be honest).
3. **Voice Actors is a separate, VA-centric rail** (person-first: VA portrait + name + the character(s) they voice). It does **not** replace the existing `CharacterCarousel` (character-first). Content is genuinely distinct — VA data is currently only a hover line inside the character card.
4. **Placement/order:** Episodes → Characters → **Voice Actors** → Franchise → **Trending** → **Ongoing**. Reuses `.section-stack`; no new layout primitives.
5. **Derivation layer:** VA→characters grouping is a **pure provider-layer helper** (mirrors `lib/providers/hianime/characters.ts` + `dedupeCharacters`, node-testable) surfaced as `AnimeArtBundle.voiceActors`. Ongoing/Trending are **request-scoped slices derived in the page** (mirrors `lib/utils/detail.ts` helpers).
6. **Fetch gating stays airing-only.** Ongoing/Trending render **only when the title is airing** (schedule already fetched). Completed/upcoming titles omit both — no new upstream cost on any page.

## Constraints / repo rules (must hold)

- **Never wrap grid/rail cards in `<Reveal>`** — blanks cards pre-hydration. Use `components/anime/Rail.tsx` (which renders the shared `AnimeCard`) or `RailShell` directly.
- **Reuse one card language**: `components/anime/Rail.tsx` → `AnimeCard`. Do not hand-roll poster cards. Ranked ordering (if used) → `RankedGrid`.
- **Don't block first paint.** The schedule is a heavy scrape (~8s cap in `NextEpisodeSection`). Ongoing/Trending must stream or be awaited only inside the existing airing-gated boundary — never in Phase 1.
- **Touch/reduced-motion**: any hover-reveal rests visible under `[@media(pointer:coarse)]` and flattens under `motion-reduce:` (copy `CharacterCarousel`/`AnimeCard`).
- **Colour**: only semantic tokens (`text-snow/muted/faint/frost`), `bg-frost … on-frost`. No hand-rolled colours. Contrast floors are enforced by `lib/utils/contrast.test.ts`.
- **Types**: components only see `lib/providers/types.ts` models. Raw shapes stay in `lib/providers/hianime/`.
- Keep `getEpisodes(id)` signature unchanged; do not touch watch routes.

## Files to change

**Provider layer (types + mapper + helper + tests)**
- `lib/providers/types.ts` — add `VoiceActorProfileModel`; add `voiceActors: VoiceActorProfileModel[]` to `AnimeArtBundle`.
- `lib/providers/hianime/cast.ts` *(new)* — pure `groupVoiceActors(characters: CharacterModel[]): VoiceActorProfileModel[]`.
- `lib/providers/hianime/cast.test.ts` *(new)* — `node:test` for the grouping (dedupe by VA id, null-id fallback by name, characters list order, empty input).
- `lib/providers/hianime/mappers.ts` — in `toArtBundle`, set `voiceActors: groupVoiceActors(characters)`.

**Schedule-derived rails (pure helper + tests)**
- `lib/utils/detail.ts` — add `recentlyAired(schedule: ScheduleModel, excludeId: string, limit: number): ScheduleItem[]` (and, if needed by the Ongoing rail, `airingNow(schedule, excludeId, limit)`), plus a `scheduleItemToCard`-style adapter if the rail needs `AnimeCardModel`.
- `lib/utils/detail.test.ts` *(new or extend)* — ordering/recency, exclusion of the current id, empty-schedule, null `airTime`/`weekday` handling.

**Components (new)**
- `components/details/VoiceActorRail.tsx` — server component. `RailShell title="Voice Actors" eyebrow="Cast"`; VA cards (portrait + name + `language` + the character name(s) they voice). Hover/focus reveal for the character list, resting visible on touch/reduced-motion.
- `components/details/DiscoveryRail.tsx` *(or reuse `components/anime/Rail.tsx` directly)* — a thin section that renders a schedule-derived list as an `AnimeCard` rail. Prefer reusing `Rail` if the loaders can produce `AnimeCardModel`; only add a new component if the schedule fields need custom presentation (recommended: reuse `Rail`, add the adapter).

**Page**
- `app/anime/[id]/page.tsx` — render the new sections in the locked order; derive Ongoing/Trending only when `airing`; pass the schedule through so the section is NOT re-fetched (see data-flow note).
- `app/anime/[id]/loading.tsx` — add matching skeleton stubs (headers + card rows) for the three sections, holding their dimensions; keep the existing conditional logic (do not pre-draw airing-only sections in a way that shifts layout for non-airing titles — see risk below).

## Data-flow note (the one non-obvious bit)

Today the schedule is fetched **inside** `NextEpisodeSection` (an async island), so the page body never holds it. Ongoing/Trending need the **same schedule**. Two viable shapes — pick during implementation:

- **Recommended:** introduce a single airing-gated async island, e.g. `components/details/DiscoverySections.tsx`, that awaits `withTimeout(getSchedule(), 8_000)` **once** and renders both Ongoing and Trending (and, if desired, keeps `NextEpisodeSection` separate). Wrap it in one `<Suspense fallback={<DiscoverySkeleton/>}>`. This keeps a single schedule fetch (React `cache()` dedupes it with `NextEpisodeSection`'s call within the request) and never blocks paint.
- Alternative: pass the awaited schedule down from a shared parent island that also renders `NextEpisodeSection`, guaranteeing one fetch site.

Do **not** call `getSchedule()` in the page body (Phase 1) — that would block first paint for airing titles.

## Content structure (per section)

- **Voice Actors** — card: square/portrait VA image (from `VoiceActorModel.poster`), VA name (`text-snow`), `language` chip (e.g. "Japanese"), and the character(s) they play (small `text-muted`, hover-revealed like the character VA row). Order: by first appearance in `characters`. Hide the whole section when `voiceActors.length === 0`.
- **Trending** — `Rail` of `AnimeCard`s from `recentlyAired(schedule, id, N)`. Eyebrow e.g. "Airing now". Hide when empty.
- **Ongoing** — `Rail` of `AnimeCard`s from the currently-airing schedule slice (excluding current title). Eyebrow e.g. "Currently airing". Hide when empty. **Do not duplicate** Trending's items: if the two slices overlap, Ongoing should show a broader airing set while Trending stays the recent-episode subset, or drop Ongoing if it would be identical (decide with real data — see validation).

## Failure modes

- Schedule fails/times out → Ongoing + Trending + Next Episode all omit (already the case for Next Episode); page still renders. Non-fatal by design.
- `art` bundle fails → Voice Actors omits (alongside Characters).
- Empty/degenerate schedule (`airing: []`, all null fields) → `recentlyAired` returns `[]` → section hides; no empty rails.
- VA with null `poster`/`name` → fall back to an icon placeholder + "Unknown" (mirror `CharacterCarousel.Portrait`).
- Current title must be **excluded** from all three discovery rails (don't recommend the page you're on).

## Validation

1. `npm run lint` → `npm run typecheck` → `npm test` (new `cast.test.ts` + `detail.test.ts` must pass; existing 95 stay green) → `npm run build`.
2. `npm run bundle:check`, `npm run prerender:check` (must stay green; watch that `/anime/[id]` first-load doesn't regress).
3. `npm run dev` visual checks on:
   - an **airing** title (e.g. `one-piece-1`): all three sections present; Trending/Ongoing exclude the current title; no duplicate rails.
   - a **completed** title (e.g. `bleach-806`): Voice Actors present (art bundle works), Ongoing/Trending **absent**, no layout shift.
   - an **upcoming** title (e.g. `slow-step-7192`): Voice Actors if art exists; discovery rails absent.
4. Confirm **no second schedule fetch**: React `cache()` should dedupe; verify request still ~1 scrape. Confirm first-paint timing for an airing title is unchanged vs. today (schedule stays inside Suspense).
5. Contrast: new text uses tokens with AA floors; no new raw colours.

## Open questions / nice-to-haves (optional, non-blocking)

- Whether **Ongoing** adds real value over **Trending** given both derive from the same schedule — decide after seeing the real slices; if identical, consider dropping Ongoing or narrowing Trending to "latest episodes this week".
- Whether the VA rail should dedupe across `language` (dub VAs) or show Japanese-only (current data is Japanese-only in samples).
- Whether to migrate the existing `CharacterCarousel` VA hover-line into a link to the VA rail (out of scope unless requested).

## Explicitly out of scope

- Fetching `getHome` on the detail page.
- Changing `CharacterCarousel` (character-first) semantics.
- Any new upstream provider endpoint or schema change.
- Watch routes / `CinematicInfo` / `getEpisodes` signature.

## Handoff

Implementation requires source edits and (optional) dev-server runs — switch to an implementation-capable agent (e.g. Frontend Specialist or Code) to execute this plan.
