# Plan: Fix Top Upcoming meta-row overflow (Watch / type wrapping)

## Goal
On the home board's **Top Upcoming** cards, the hover-reveal meta row wraps badly
when the card is narrow: the type pill's label breaks onto two lines
(`MOVIE (1` / `eps)`) and the pill balloons, because the row
(`components/anime/AnimeCard.tsx:217`) is `flex items-center gap-2` with a
variable-length type string and no room for all items on one line.

Screenshot evidence: `Screenshot_20261021_011303.png` — Watch pill + a two-line
`MOVIE (1 eps)` type pill.

Fix **only for Top Upcoming** (confirmed with user): add an opt-in prop to
`AnimeCard` that keeps the row on one line without wrapping, and have
`RankedGrid` opt in. Every other surface keeps its current behaviour.

## Why it broke now
Top Upcoming was switched to the shared `AnimeCard` and then made denser
(`xl:grid-cols-7`) to match Latest Completed's poster size — narrower cards, so
the always-three-item row (Watch + type + optional `ml-auto` score) no longer
fits. Latest Completed's cards are ~1/5 of a half-width panel and its type
strings happen to be short, so it doesn't hit this today.

## Data facts (verified)
- `toCard` (`lib/providers/hianime/mappers.ts:46`) always sets `score: null`
  and `episodeNumber: null` for card lists → upcoming cards render **Watch +
  type only** (no score, no `ml-auto` item). But `anime.type` can still be long,
  e.g. `MOVIE (1 eps)`, `TV (12 eps)`.
- The row is in the **shared** `AnimeCard`, used by QuickLists, Grid, Rail,
  search, etc. — hence the opt-in prop rather than a global change.

## Chosen behaviour (confirmed with user)
- Keep the row on **one line** (`whitespace-nowrap` on the type pill; row must
  not wrap children).
- If the card is too tight, the **score drops out** rather than forcing a wrap.
  (For Top Upcoming there is no score today, so in practice Watch + type simply
  stay on one line; the no-wrap rule also protects any future surface that opts
  in with a score present.)
- Scope: **Top Upcoming only**, via an additive prop. No other surface changes.

## Implementation tasks

### 1. Add an opt-in `revealRowClassName` prop to `AnimeCard`
File: `components/anime/AnimeCard.tsx`

- Add to the props type (alongside `titleClassName` / `topLeftBadge`):
  ```ts
  /** Opt-in refinement for the hover-reveal meta row (Watch / type / score).
   *  Merged AFTER the row's base classes so a caller can keep it single-line
   *  on narrow surfaces without touching the shared default every other grid,
   *  rail and panel relies on. Undefined = unchanged markup. */
  revealRowClassName?: string;
  ```
- Destructure it in the signature.
- Apply it to the row wrapper (`:217`), keeping the base classes intact:
  ```tsx
  className={cn(
    "flex translate-y-1 transform-gpu items-center gap-2 pt-2.5 opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 [@media(pointer:coarse)]:translate-y-0 [@media(pointer:coarse)]:opacity-100 motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100",
    revealRowClassName,
  )}
  ```
- (Only the row wrapper needs the prop; the type pill itself gets `nowrap` from
  the caller's classes below. Do **not** add `whitespace-nowrap` to the base
  type pill — that would change every other surface.)

### 2. Opt in from `RankedGrid`
File: `components/anime/RankedGrid.tsx`

- Pass a single-line, non-wrapping row:
  ```tsx
  <AnimeCard
    key={`${a.id}-${i}`}
    anime={a}
    topLeftBadge={/* existing #N chip */ }
    // Top Upcoming cards are denser than the shared Grid, so the 3-item meta
    // row can run out of width; keep it on ONE line and let the (currently
    // always-absent) score drop rather than wrapping the type label mid-word.
    revealRowClassName="flex-nowrap [&>span]:whitespace-nowrap [&>span]:shrink-0"
  />
  ```
  Notes on the classes:
  - `flex-nowrap` — the row never wraps its children.
  - `[&>span]:whitespace-nowrap` — the Watch pill, type pill and score span each
    stay on one line (the type pill's text is the wrap culprit).
  - `[&>span]:shrink-0` — pills keep intrinsic width instead of squashing.
  - Because upcoming cards have no score, nothing overflows; if a score is ever
    present, the `ml-auto` score is the item that gets clipped first (matches the
    chosen "drop the score when tight" behaviour). If clipping ever proves
    ugly, a follow-up can add `min-w-0 overflow-hidden` to the score span — not
    needed for the current data.
- Keep the `#N` `topLeftBadge` chip as-is.

## Edge cases / risks
- **No global impact:** `revealRowClassName` is undefined for every other
  `AnimeCard` caller, so their markup is byte-identical (same additive pattern as
  `titleClassName` / `topLeftBadge`).
- **Long titles vs. long type:** unaffected — the title stays `line-clamp-2`; the
  fix targets only the meta row.
- **Coarse pointer / reduced motion:** the row's rest-visible and
  reduced-motion classes are untouched; only wrapping changes.
- **Hostile/odd type strings:** `nowrap` prevents mid-word breaks; an extremely
  long type would still overflow the card's right edge (clipped by the frame's
  `overflow-hidden`). Acceptable — upstream type tokens are short format labels;
  if a pathological value appears, add `truncate`/`max-w-full` to the type pill as
  a follow-up.

## Validation
Run in CI order (per AGENTS.md):
```bash
npm run lint
npm run typecheck
npm test
npm run build
```
Manual/visual checks:
- Hover a Top Upcoming card at `lg`/`xl` (7-up): the meta row is a single line —
  **Watch** + type (e.g. `MOVIE (1 eps)`) with no two-line pill.
- Narrow widths (`sm`/`md`, 3-/5-up): still single-line, no mid-word wrap.
- Latest Completed, browse grids/rails, search: **unchanged** (verify by hover
  — their row markup must be identical to before).
- Keyboard focus-visible and `pointer: coarse` (rest-visible) states render the
  row identically.
- `npm run prerender:check` still reports real home content.

## Out of scope
- Changing the shared `AnimeCard` default row behaviour.
- Adding a release-date/"upcoming" data flag to gate the Watch pill (separate
  issue; `toCard` exposes no such field).
- Re-tuning Top Upcoming's column counts (already settled at 2/3/5/6/7).
