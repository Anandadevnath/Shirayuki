# Apply the one-unit card entrance fade to every AnimeCard surface

## Goal

The prior session added `.grid-in` — a single, opacity-only one-shot entrance — to
`components/anime/Grid.tsx`, so the browse grid (category / genre / az / search /
schedule) cross-fades in as ONE unit and masks the per-image optimizer decode burst.

This plan extends the exact same one-unit entrance to **every surface that renders
`<AnimeCard>`**, so cards arrive identically no matter which page shows them.

## Established context (do not re-investigate)

- `.grid-in` already exists in `app/globals.css` (~line 938-946): an opacity-only
  `grid-in` keyframe (0.45s, `both`) plus an explicit
  `@media (prefers-reduced-motion: reduce) { .grid-in { animation: none; } }` guard.
  The global reduced-motion catch-all also flattens it. **No globals.css change is
  needed** unless a new class is introduced (it is not — reuse `.grid-in`).
- `.grid-in` is deliberately opacity-only (no container transform). The `.image-stack`
  comment in globals.css documents that a per-image/container transform made grids
  "shake/flicker" during the decode burst. Do NOT add translate/scale.
- The entrance must stay **additive**: an animation on an already-visible tree, never a
  hidden-until-hydration wrapper (`Reveal`/`data-reveal`). The existing doc comments in
  `Grid.tsx` / `AnimeCard.tsx` / `Rail.tsx` treat "cards visible from frame 0" as a
  contract — preserve that; the fade only adds an opacity animation.
- The whole home board already mounts in a single browser commit (AGENTS.md: "Home
  board reveals as ONE unit"). Adding `.grid-in` to home card containers is consistent
  with that principle: all home fades fire simultaneously, opacity-only and non-gating.
- `.grid-in` must NOT be placed on the shared `components/common/RailShell.tsx` — that
  shell also renders non-poster rails (ArtGallery, FranchiseTimeline,
  CharacterCarousel, VoiceActorRail). Scope the fade to the `Rail` component's own card
  markup only.

## Surfaces that render `<AnimeCard>` (complete list)

| Surface | File | Type | Action |
|---|---|---|---|
| Browse grid | `components/anime/Grid.tsx` | server | **Already done** — no change |
| Detail-page rails | `components/anime/Rail.tsx` | server | add `.grid-in` |
| Home "Top Upcoming" grid | `components/anime/RankedGrid.tsx` | `"use client"` | add `.grid-in` |
| Home "Latest Completed" grid | `components/home/QuickLists.tsx` | server | add `.grid-in` |

(`AnimeCard`'s own `variant="row"` has no grid/grid container and is not in scope.)

## Planned changes

### 1. `components/anime/Rail.tsx`
The rail passes its card wrappers directly as `RailShell` children, so there is no
existing container element to host the class. Add `.grid-in` to **each card wrapper
div** (the `w-[44vw] shrink-0 …` div, `Rail.tsx:26-31`):

- These wrappers mount together in one commit, so the fades fire simultaneously →
  reads as one unit; no stagger. Do NOT add `revealDelay`.
- Do NOT touch `RailShell`. Non-card rails must not inherit the fade.
- Extend the existing comment (lines 21-25) to note the additive entrance, matching
  the `Grid.tsx` wording.

Rationale for per-wrapper vs. a new single wrapper element: wrapping all children in a
new `<div className="grid-in">` would break the flex track geometry (RailShell's track
is `display:flex`; an extra flex-child wrapper changes card snap/gap math). Applying the
class to the existing wrappers is layout-inert.

### 2. `components/anime/RankedGrid.tsx`
Add `.grid-in` to the outer grid `<div ref={ref} …>` (`RankedGrid.tsx:70-80`), merged
via the existing `cn(...)` call alongside the grid classes.

- This is a client component; `.grid-in` is a pure CSS class with no JS gate, so it
  plays on mount identically to the server `Grid` case.
- Keep the column-ladder comment intact.

### 3. `components/home/QuickLists.tsx`
Add `.grid-in` to the poster grid `<div className="grid flex-1 grid-cols-2 …">`
(`QuickLists.tsx:28`). Server component; no other change.

## Out of scope

- `app/globals.css` — no new class/keyframe; reuse `.grid-in`.
- `components/common/RailShell.tsx` — shared by non-card rails; do not edit.
- The `data-reveal`/`Reveal` observer system and the `motion` (Framer) system.
- Skeleton components (already handled in the prior session's `GridSkeleton` change).
- `AnimeCard.tsx` internals, `SmartImage`, `next.config.ts`, data layer, timeouts.

## Risks / notes

- **Double-fade caution:** `AnimeCard` already owns one entrance (SmartImage's
  shimmer→bitmap cross-fade). `.grid-in` is the single *container* fade on top; it must
  stay opacity-only and play once (mount), never replay on cached loads. `.grid-in` has
  no observer and no re-trigger, so this holds — do not convert it to a
  transition/observer-based reveal.
- **No `will-change`:** `.grid-in` (like the other one-shot entrance classes) must not
  add a standing `will-change`; the keyframe self-promotes for its 0.45s run.
- **Reduced motion:** already covered by both the explicit `.grid-in` guard and the
  global catch-all; verify by toggling OS reduce-motion.

## Validation

1. `npm run lint && npm run typecheck && npm test && npm run build` (all must pass).
2. Cold-cache manual check (DevTools "Disable cache" + Fast 3G):
   - `/category/most-popular`, `/genre/*`, `/az/*`, `/search` — grid fades in as one
     block (unchanged from prior session).
   - An anime detail page (`/anime/[id]`) — the discovery rails fade in as one unit,
     cards never blink out, no per-card jitter.
   - Home (`/`) — Latest Completed grid and Top Upcoming grid fade in with the board;
     no section pops in late; mascot/marquee rows unchanged.
3. Toggle OS "reduce motion": every surface renders static and fully visible.
4. Confirm no layout shift and no horizontal-rail geometry change on `/anime/[id]`.

## Open questions

None — scope, home-board inclusion, and rail handling are resolved.
