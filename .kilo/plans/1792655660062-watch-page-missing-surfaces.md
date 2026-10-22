# Watch page revamp — bring the 3 missing detail-page surfaces onto `/watch/[id]/[ep]`

## Goal

Add the three features from the request that the watch route genuinely lacks,
reusing the components the detail-page redesign already built. **No new
components, no API/schema/provider changes.**

Scope agreed with the user: *just the 3 missing pieces* (not a visual rewrite,
not a from-scratch rebuild).

## Reality check (what is already done — do not rebuild)

Verified in code; the watch page already has:

- Player 70/30 split + right episode sidebar — `app/watch/[id]/[ep]/page.tsx:126` (`lg:grid-cols-[1fr_360px]`).
- Title + episode strip — `page.tsx:176-182`.
- SUB/DUB toggle + server pills, URL-driven, preserving server across category — `page.tsx:185-246` (`swHref`).
- Synopsis + metadata — `CinematicInfo` (`page.tsx:296`).
- Auto-play + Next episode + Up-Next countdown + `autoPlayNext` toggle — `components/player/Player.tsx:755-758`, `1131-1139`; pref in `lib/stores/prefs.ts:11`.

API claims in the request that **conflict with the code — follow the code**:

- Servers is `/episode/servers?episodeId=<hash>` (bare hash), **not**
  `animeEpisodeId=&ep=`. The latter returns the WRONG episode
  (`lib/providers/hianime/index.ts:243-249`). Do not change `getServers`.
- Sources is `/episode/sources?episodeId=<hash>&server=&category=`. Unchanged.

## The 3 missing pieces

### 1. Blurred "Now Watching" backdrop behind the player
Reuse `components/details/DetailBackdrop.tsx` (fixed full-viewport, blurred,
scrimmed, `aria-hidden`, no `priority`). On the watch page, feed it the current
title's wide art:

- Source: `anime.cover ?? anime.poster`. NOTE `cover` currently maps to `poster`
  (`mappers.ts:110`) — acceptable, same contract as the detail page
  (`app/anime/[id]/page.tsx:83`).
- Render `<DetailBackdrop src={backgroundSrc} />` once at the top of the watch
  page's returned tree, **outside** the two-column grid (it is `position: fixed`
  so placement in flow is irrelevant, but keep it as the first child for parity
  with the detail page).
- Do **not** add a second backdrop or scrim stack. `DetailBackdrop` is the only
  artwork layer.

### 2. Chunked + searchable episode explorer (full width, below the two-column row)
Reuse `components/details/EpisodeExplorer.tsx` unchanged (it already does
`RANGE=100` chunk tabs + whole-list search + 100-node cap). Placement (user
decision): a full-width section **below** the player+sidebar row, above the
franchise rail and `CinematicInfo` — i.e. watch page section order becomes:

1. Row 1: player + sidebar (unchanged)
2. `<EpisodeExplorer animeId={id} episodes={episodes} />` ← NEW
3. `<FranchiseTimeline … />` ← NEW (piece 3)
4. `<CinematicInfo … />` (unchanged)

- Wrap sections 2–4 in the same `section-stack mt-[var(--space-section)]`
  pattern the detail page uses (`app/anime/[id]/page.tsx:117`) so vertical
  rhythm matches.
- Keep the existing sidebar list as-is (quick list). The full-width explorer is
  the searching/chunked surface.
- Only render the explorer when `episodes.length > 0` (parity with
  `app/anime/[id]/page.tsx:118`).

### 3. Franchise / watch-order rail
Reuse `components/details/FranchiseTimeline.tsx`, with one small prop addition so
links target the watch flow.

**Data flow (important):** `AnimeDetail.seasons` is hardcoded to `[]`
(`lib/providers/hianime/mappers.ts:130`) — it is NOT populated. The detail page
fetches seasons separately via `getAnimeSeasons(id)`
(`app/anime/[id]/page.tsx:49-54`). The watch page must do the same:

- Add `safe(() => getAnimeSeasons(id))` to the watch page's existing
  `Promise.all` (`page.tsx:58-62`). It is ISR/Data-Cache backed
  (`revalidate: DETAIL_REVALIDATE`, tag `seasons:${id}`), so it is cheap and
  dedupes with any other call in the request.
- `const seasons = seasonsRes.ok ? seasonsRes.data?.filter(Boolean) ?? [] : [];`
- Render `{seasons.length > 1 && <FranchiseTimeline items={seasons} currentId={id} linkBase="watch" />}`
  — the `> 1` guard matches the detail page (a lone "season" is not a timeline).

**Component change to `FranchiseTimeline.tsx`:**
- Add an optional `linkBase?: "anime" | "watch"` prop, default `"anime"` (so the
  detail-page call site is unchanged).
- Link href becomes `` `/${linkBase ?? "anime"}/${s.id}` ``. On the watch page
  this yields `/watch/{seasonId}`, which is the resume-redirect route
  (`app/watch/[id]/page.tsx`) that server-resolves the episode list and
  `router.replace`s into the player. This is the only correct watch target —
  `SeasonModel` carries no first-episode id (`lib/providers/types.ts:99-113`).
- Update the component's top doc comment to note the `linkBase` switch and that
  season cards carry no episode id, so `/watch/{id}` (resume) is the target.

## Files to change

| File | Change |
|---|---|
| `app/watch/[id]/[ep]/page.tsx` | Import + call `getAnimeSeasons`; render `DetailBackdrop`, `EpisodeExplorer`, `FranchiseTimeline` in the new order. |
| `components/details/FranchiseTimeline.tsx` | Add optional `linkBase?: "anime" \| "watch"` prop (default `"anime"`); update doc comment. |
| `components/ui/Skeleton.tsx` (`WatchSkeleton`) | Add matching skeleton blocks for the new full-width explorer + franchise rail below the existing rows so the skeleton→content swap stays shift-free. |
| `components/details/EpisodeExplorer.tsx` | **No change** (reused as-is). |
| `components/details/DetailBackdrop.tsx` | **No change** (reused as-is). |

## Risks / notes

- **Layout shift on swap.** `WatchSkeleton` currently mirrors only rows 1–2. The
  new sections push `CinematicInfo` down; the skeleton must gain placeholder
  blocks for the explorer (header + range strip + ~10 tiles) and the franchise
  rail (header + poster row) so the swap does not jump. Mirror the existing
  `DiscoverySkeleton`/`RankedGridSkeleton` style in `Skeleton.tsx`.
- **Blurred backdrop + `position: fixed`.** `DetailBackdrop` is `z-[-5]` and
  `fixed`. The route already has `app/template.tsx`'s `.route-in` (opacity-only,
  no transform) — safe, no containing-block re-anchor. Do not add a transform to
  any watch-page ancestor of the fixed layer.
- **Two backdrops risk.** Ensure only `DetailBackdrop` paints artwork; the watch
  page currently has none, so this is additive.
- **`getAnimeSeasons` failure** must degrade gracefully: `safe()` + `?? []` +
  the `> 1` guard → the rail simply doesn't render (same as the detail page).
- **`EpisodeExplorer` needs a client boundary** — it is already `"use client"`;
  the watch page is a server component, which is fine (server → client child).
- **No API/schema/provider edits.** If the upstream seasons/servers shape drifts,
  that is a separate change; the schemas already tolerate it (`seasonsData`/
  `serversData` default their arrays).
- Do **not** touch `prefs.autoPlayNext` / `Player.onEnded` — feature 5 is done.

## Validation

1. `npm run lint && npm run typecheck && npm test && npm run build` (all pass —
   currently 110 tests; none reference these components).
2. Manual (`npm run dev`), on `/watch/{id}/{epId}` for a title with **>1 season**
   and **>100 episodes** (e.g. a long-running shounen):
   - Blurred banner shows the current title's art behind the player; page stays
     legible; no second artwork layer.
   - Full-width explorer below the player shows chunk tabs (1–100, 101–200, …)
     and the search box filters across the whole list; the active episode is not
     required to be highlighted there (it is highlighted in the sidebar).
   - The franchise rail appears, ordered chronologically, "now viewing" flagged
     on the current entry; clicking a sibling goes to `/watch/{siblingId}` and
     lands in the player (via the resume redirect).
   - Sidebar quick list, SUB/DUB toggle, server pills, autoplay/next unchanged.
3. Skeleton parity: hard reload with DevTools "Disable cache" + Fast 3G — the
   skeleton occupies the same height as the loaded content (no jump as the
   explorer + rail arrive).
4. Reduced motion: backdrop and sections render static; no new animation added.
5. A title with exactly 1 season → no franchise rail; a title with 0 episodes →
   no explorer (no empty sections).

## Out of scope

- Any visual redesign of the player chrome, title strip, or server bar.
- `Player.tsx`, `prefs.ts` (feature 5 already done).
- The data layer, providers, schemas, `next.config.ts`, `/watch/*` dynamism.
- Re-highlighting the current episode inside `EpisodeExplorer` (sidebar owns
  that today); revisit only if the user asks.

## Open questions

- None blocking. Placement (full-width explorer) and franchise link target
  (`/watch/{id}`) were resolved with the user.
