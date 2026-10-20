# Plan — Cinematic poster cards for Premieres → Top Upcoming

Scope: **only** the anime cards rendered inside the home page's *Top Upcoming*
section (`app/page.tsx:193` → `components/home/Trending.tsx` `layout="grid"` →
`components/anime/RankedGrid.tsx`). No other section, page, or shared card is
touched.

## Context (verified against the codebase)

- The section renders through `Trending` (`layout="grid"`, `gridVisibleRows={2}`)
  → `RankedGrid` → `AnimeCard` (`variant="poster"`), with an oversized rank
  numeral passed via `badge`.
- `RankedGrid` is used **only** by Top Upcoming (grep confirmed: only
  `Trending.tsx` imports it). `AnimeCard` however is shared by every grid, rail,
  search, `QuickLists`, and `DiscoverColumns` — it must not change behavior.
- **Data model is the hard constraint.** `toCard()` in
  `lib/providers/hianime/mappers.ts:46` returns only `{ id, title, jname,
  poster, type, episodes{sub,dub}, rank, score: null, episodeNumber: null,
  airingTime: null }`. There is **no** `description`, `genres`, `score`,
  `releaseDate`, or `premiereDate` on `AnimeCardModel` for these cards. Upstream
  `rawCard` has `releaseDate`/`rank` in its schema but the mapper drops them.
- Design tokens live in `app/globals.css` (`--color-frost`, `--color-frost-deep`,
  `--color-frost-soft`, `--color-sakura`, `--color-snow`, `--color-muted`,
  `--color-line`, `--color-base`, `--color-surface`, `--color-warning`,
  `--radius-*`, `--shadow-frost`, `--shadow-soft`; `.text-title`, `.text-caption`,
  `.text-label`, `.text-btn`, `.press`, `.glass`). House curve is
  `cubic-bezier(0.16, 1, 0.3, 1)`; `DURATION.base = 0.28s`.
- The existing `AnimeCard` already demonstrates the CSS-only reveal pattern
  (`.group`, `group-hover:`, `group-focus-visible:`, `[@media(pointer:coarse)]:`,
  `motion-reduce:`), so this plan reuses that exact technique — no JS state.

## Decisions (locked)

1. **Overlay content = only real card fields.** Title, format (`type`), episode
   count (`episodes.sub`/`dub`), and a "View Details" CTA. No rating, genres,
   synopsis, or release date — those fields do not exist for these cards and
   must not be invented or fetched.
2. **New scoped component.** Build `UpcomingCard` and use it *only* inside
   `RankedGrid`. `AnimeCard` stays byte-for-byte unchanged (zero risk to other
   surfaces).
3. **Top badge = static "UPCOMING" + rank chip.** No premiere dates (section is
   inherently upcoming; no release field exists). Rank shown as a small chip,
   not the current oversized numeral.
4. **CSS-only interaction.** `:hover` + `:focus-visible` reveal; poster scales
   ~1.05 inside the clipped frame; panel fades/translates up; ~300ms house
   curve. Touch (`pointer: coarse`) rests the essential info visible. Reduced
   motion disables transforms.
5. **CTA = "View Details"** linking to `/anime/{id}` (same destination as today).

## Files

### New: `components/anime/UpcomingCard.tsx`
Server-compatible (no `"use client"`, no hooks) poster card.

Structure (semantic HTML, portrait `aspect-[3/4]`):
- Root `<Link href={`/anime/${anime.id}`}>` with `group` + `snap-start`,
  `focus-visible` ring inherited from the global `:focus-visible` rule.
- Lift wrapper (`transform-gpu`, hover/focus `-translate-y-1.5`, press easing) —
  same transform-only technique as `AnimeCard`, so neighbors never reflow.
- Shadow layers: static `--shadow-soft` + hover `--shadow-frost` cross-faded by
  `opacity` (never a transitioned `box-shadow`).
- Clipped frame: `relative aspect-[3/4] overflow-hidden rounded-[1.25rem]
  bg-surface-2 ring-1 ring-line/80`, plus a hairline frost ring overlay at
  `opacity-0 → 100` on hover/focus (crisp border, not a glow).
- Poster: `SmartImage fill object-cover` (handles missing poster → fallback
  surface; keep the `No image` empty `<div>` path when `poster` is null).
  Wrapped in a `transform-gpu group-hover:scale-[1.05] group-focus-visible:scale-[1.05]`
  div, clipped by the frame.
- Top row: left = "UPCOMING" badge (`text-label`, `bg-base/85`, frost text,
  ring-line); right = rank chip `#N` (`font-display`, small). Both `top-2.5`,
  left/right `2.5`, `z-[1]`.
- Default (resting) bottom: static gradient scrim (`from-base via-base/55
  to-transparent`, bottom 3/5) + `<h3 className="text-title line-clamp-2">`
  title + a compact meta line: format pill + episode count when present.
- Reveal panel (bottom, `absolute inset-x-0 bottom-0 p-3.5`):
  - Deeper scrim layer cross-faded in on hover/focus.
  - Title (same `<h3>`, always visible).
  - Meta list revealed via `translate-y-1 opacity-0 → translate-y-0 opacity-100`
    (GPU-composited; `group-hover`, `group-focus-visible`,
    `[@media(pointer:coarse)]` forces visible, `motion-reduce` flattens).
  - Format row: `TypePill`-style bordered chip (`TV`/`Movie`/`OVA`/`ONA`/
    `Special` from `anime.type`), only when non-null.
  - Episodes row: `EpBadges` (sub/dub) or a plain "N episodes" caption when only
    subtotal exists; omitted when both are null.
  - "View Details" CTA: `press` button-styled span, frost fill, `arrow-right`
    or `info` lucide icon (already installed), `rounded-[var(--radius-btn)]`.
- No play control, no "Watch" wording (unreleased titles are not watchable).
- Transition durations ~300ms with `cubic-bezier(0.16,1,0.3,1)`; `ease-out`
  acceptable to match `AnimeCard`. All transforms clipped inside the frame; card
  outer dimensions are stable (only transform/opacity animate).

Accessibility: `aria-label={anime.title}` on the link is unnecessary (visible
`<h3>` supplies the name); keep the visible heading as the accessible name.
Keyboard focus reveals via `group-focus-visible:` on the same elements.

### Edit: `components/anime/RankedGrid.tsx`
- Replace the `AnimeCard` import/usage with `UpcomingCard`.
- Drop the `badge`/`titleClassName` props that only existed to seat the large
  numeral; pass `rank` (derived: `typeof a.rank === "number" ? a.rank : i + 1`)
  and `items.length` down to `UpcomingCard`.
- Keep the grid track list
  (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`),
  the `useGridColumns` whole-row slice, and `onVisibleCountChange` reporting
  exactly as-is (so "View more/less" keeps working).
- Update the module doc comment (currently says it renders "the SAME AnimeCard
  as every other surface").

### No change
- `components/anime/AnimeCard.tsx`, `components/home/Trending.tsx`,
  `app/page.tsx`, `lib/providers/**`, `app/globals.css` (no new global CSS —
  all styling is scoped Tailwind utilities + existing tokens).

## Edge cases to handle
- Missing poster → keep the `bg-surface-2` fallback box; no broken image.
- `type` null → omit the format chip (no empty chip).
- `episodes.sub`/`dub` both null → omit the episode row.
- Long titles → `line-clamp-2` on the `<h3>`; `[text-wrap:balance]` optional for
  even wrapping.
- Rank > 99 → chip widens gracefully; keep `tabular-nums`.
- No stacking-context leak: shadow/ring layers are `pointer-events-none` and
  inside the lift wrapper; reveal panel stays within the clipped frame.
- No horizontal page overflow: card is a normal grid child; no fixed widths.

## Validation
1. `npm run lint` → `npm run typecheck` → `npm test` → `npm run build`
   (repo-mandated order; CI also runs `bundle:check` + `prerender:check`).
2. Visual, at desktop/tablet/mobile widths, in `npm run dev`:
   - Default: clean artwork, gradient scrim, title + essential meta legible.
   - Hover: poster scales ~1.05 (clipped), panel rises + fades in, no card jump,
     neighboring cards unmoved.
   - Keyboard: Tab to a card → same reveal via `:focus-visible`; focus ring
     visible.
   - Touch (`pointer: coarse`, e.g. device emulation): essential info visible at
     rest; tap navigates (View Details reachable).
   - Reduced motion (`prefers-reduced-motion: reduce`): no transform movement,
     panel content visible.
3. Regression check: confirm other sections' cards (Trending marquee, Discover,
   QuickLists, search) are visually unchanged — they still use `AnimeCard`.
4. Navigate a card → `/anime/{id}` still resolves (ids are slug-ids).
5. Missing-poster / missing-type / missing-episode fixtures render without empty
   chips or blank gaps.

## Out of scope
- No new API requests, no provider/mapper/model changes, no invented metadata.
- No changes to the spotlight, rails, grids, search, or any other home section.
- No global CSS additions.
