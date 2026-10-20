# Plan: Make Top Upcoming cards match Latest Completed

## Goal
The home board's **Top Upcoming** section (rendered via `RankedGrid` → bespoke
`UpcomingCard`) should use the **same card design as Latest Completed**
(`QuickLists` → shared `AnimeCard`): poster frame with a screen-wide frost hover
ring, top-left `EpBadges` / top-right EP-or-score marker, and a bottom meta row
with a **Watch** pill, type pill and star score that reveals on hover/focus.

Keep the ranking visible by adding a small **`#N` rank chip in the top-left**
corner of the card. Top Upcoming has no `EpBadges` to displace there, so the chip
takes that slot cleanly.

## Decisions (confirmed with user)
1. **Approach:** render the shared `<AnimeCard>` in `RankedGrid` (exactly like
   `QuickLists`), not the bespoke `UpcomingCard`.
2. **Rank chip:** add a new optional **`topLeftBadge`** prop to `AnimeCard` that
   renders in the top-left corner, mirroring the existing bottom-left `badge`
   prop. `RankedGrid` passes the `#N` chip there. Purely additive — no other
   surface's markup changes.

## Current state (verified)
- `components/anime/RankedGrid.tsx:75` renders `<UpcomingCard anime rank />`.
- `components/anime/UpcomingCard.tsx` is the bespoke cinematic card: `aspect-[3/4]`,
  `rounded-[0.625rem]`, rank chip **top-right**, title + hover-reveal detail panel
  (format/episodes + "View Details"), no Watch pill. It is used **only** by
  `RankedGrid` (grep-confirmed).
- `components/anime/AnimeCard.tsx` (the Latest Completed card) is shared by
  `QuickLists`, `Grid`, rails, search, etc. It already supports:
  - `badge` prop → bottom-left overlay (`:176-178`), and title left-padding
    `pl-14 sm:pl-16` when a badge is present (`:182-185`).
  - `titleClassName`, `style`, `className` pass-throughs.
  - `TiltCard` pointer-tilt frame, `EpBadges` top-left, EP-or-score top-right.
- `AnimeCard` uses `aspect-[3/4]`, `rounded-[1.25rem]`, ring tokens.
- Skeleton `RankedGridSkeleton` (`components/ui/Skeleton.tsx:201`) already uses
  `rounded-[1.25rem] aspect-[3/4]` → **no skeleton change needed** once the grid
  renders `AnimeCard` (it currently silently mismatches `UpcomingCard`'s radius).
- `Trending.tsx` "grid" branch (`:504-544`) owns the Top Upcoming header, the
  `View more` / `Show less` overflow toggle, and passes `items` to `RankedGrid`.
  It needs **no change** for this task.
- Data: `toCard` (`lib/providers/hianime/mappers.ts:46`) always sets
  `score: null` and `episodeNumber: null` for card lists, so `AnimeCard`'s
  top-right marker and star score **self-omit** for upcoming items — no
  fabricated data, and the Watch pill still renders (it is unconditional, as on
  every other `AnimeCard` surface). If a Watch affordance on unreleased titles is
  undesired, that is a **separate** decision (see Open Question).

## Implementation tasks

### 1. Add `topLeftBadge` prop to `AnimeCard`
File: `components/anime/AnimeCard.tsx`

- Add to the props type (after `badge`):
  ```ts
  /** Optional overlay for the TOP-LEFT corner of the poster frame — mirrors
   *  `badge` (bottom-left). Used by RankedGrid to seat the rank chip in the
   *  slot the top-left EpBadges normally occupy. Purely additive: passing
   *  nothing yields the same markup every other surface already renders. */
  topLeftBadge?: React.ReactNode;
  ```
- Destructure `topLeftBadge` in the component signature.
- In the poster `variant` markup, render the top-left overlay. Replace the
  existing unconditional EpBadges block (`:166-169`) so an incoming
  `topLeftBadge` takes precedence (and EpBadges is suppressed when it would
  collide — upcoming cards have empty EpBadges anyway, but keep it correct for
  any future caller):
  ```tsx
  <div className="absolute left-2.5 top-2.5">
    {topLeftBadge ?? <EpBadges sub={anime.episodes.sub} dub={anime.episodes.dub} />}
  </div>
  ```
- Leave `topRight`, the bottom `badge` slot, and all other markup untouched.
- Keep the component `memo`ized; `topLeftBadge` is a plain node prop so memo
  behaviour is unchanged.

**Do NOT** change `AnimeCard`'s default output for existing callers — the only
behavioural delta is that passing `topLeftBadge` hides `EpBadges` in that slot.

### 2. Swap `RankedGrid` to `AnimeCard`
File: `components/anime/RankedGrid.tsx`

- Replace the `UpcomingCard` import with `AnimeCard`:
  ```ts
  import { AnimeCard } from "./AnimeCard";
  ```
- In the render loop (`:73-76`) render `AnimeCard` with the rank chip in the new
  top-left slot:
  ```tsx
  return (
    <AnimeCard
      key={`${a.id}-${i}`}
      anime={a}
      topLeftBadge={
        <span className="font-display rounded-[0.5rem] bg-base/80 px-1.5 py-0.5 text-[10px] font-bold leading-none text-snow tabular-nums ring-1 ring-white/10 backdrop-blur-sm">
          #{rank}
        </span>
      }
    />
  );
  ```
  (Chip styling carried over from the old `UpcomingCard` rank chip so the visual
  language is preserved.)
- Update the file's top doc comment: it currently describes rendering the
  cinematic `UpcomingCard`. Rewrite to state it renders the shared `<AnimeCard>`
  (same card as Latest Completed) with a top-left `#N` rank chip via
  `topLeftBadge`. Keep the note that it is scoped to Top Upcoming and measures
  its own live column count.

### 3. Remove the now-unused `UpcomingCard`
- `components/anime/UpcomingCard.tsx` is untracked and used only by `RankedGrid`
  (grep-confirmed). After task 2 it has **zero importers** → delete the file.
- Verify no other reference remains: `grep -rn "UpcomingCard" components lib app`
  should return nothing.
- `lib/utils/useGridColumns.ts`, `Trending.tsx`, `app/page.tsx`, and the
  skeleton require **no changes**.

## Risks / notes
- **Watch affordance on unreleased titles:** `AnimeCard`'s `Watch` pill is
  unconditional, so Top Upcoming cards will now show "Watch". This mirrors Latest
  Completed exactly (the user's request) but is a semantic change from the old
  card, which deliberately had no playback affordance. See Open Question.
- **Radius change:** cards move from `rounded-[0.625rem]` → `rounded-[1.25rem]`,
  matching Latest Completed and the (already-correct) skeleton.
- **Tilt:** Top Upcoming cards gain the `TiltCard` pointer tilt, consistent with
  every other `AnimeCard` surface. It is gated to fine pointers / non-reduced
  motion inside `TiltCard`, so touch/reduced-motion are unaffected.
- **Hover-release change:** with the swap, the bespoke title-drop / detail-panel
  motion from the previous change is gone for Top Upcoming; the card now uses
  `AnimeCard`'s standard reveal. That is the intended outcome.
- **`View more` toggle:** unaffected — `Trending.tsx` drives it from
  `RankedGrid`'s `onVisibleCountChange`, which is unchanged.

## Validation
Run in CI order (per AGENTS.md):
```bash
npm run lint
npm run typecheck
npm test
npm run build
```
Manual/visual checks:
- Top Upcoming cards render identically to Latest Completed cards (frame radius,
  frost hover ring, bottom Watch/type/score row reveal).
- `#N` chip appears top-left on every upcoming card, numbering 1..N in DOM order.
- `View more` / `Show less` still collapse/expand to whole rows at every
  breakpoint (2→6 columns).
- Hover, keyboard focus-visible, coarse-pointer (rest-visible meta) and
  reduced-motion states behave as on other `AnimeCard` surfaces.
- No `ErrorState`/blank board (`npm run prerender:check`) and no console errors.

## Open question (non-blocking)
`AnimeCard`'s **Watch** pill is unconditional; Top Upcoming items are unreleased,
so the pill is misleading. Options if the user objects:
(a) leave as-is (matches Latest Completed exactly — current plan);
(b) add an optional `hideWatch` / `actionSlot` prop to `AnimeCard` and pass it
    from `RankedGrid`;
(c) replace the pill with a neutral "Details" label for this surface.
`toCard` provides no release-date field on cards, so a true "upcoming" flag is
not available without a data-layer change — out of scope unless requested.
