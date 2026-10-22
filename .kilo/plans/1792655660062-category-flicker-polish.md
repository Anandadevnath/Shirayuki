# Category card loading flicker — residual polish

## Problem

`http://localhost:3000/category/top-airing` **does load** (confirmed with the user)
but the skeleton → grid handoff still reads as an instant "pop"/flicker. The
route itself is fine — `getCategory` resolves, `Grid` renders.

## What the user asked for (and the reality check)

The request lists three fixes. Two already exist — implementing them as literally
described would *regress* documented behaviour. The plan below keeps the intent
and corrects the mechanics.

| # | Requested | Actual state | Decision |
|---|---|---|---|
| 1 | `<Image>` `onLoad` fade `opacity-0 → opacity-100 transition-opacity duration-500` | Already implemented, more correctly, in `components/ui/SmartImage.tsx:51-108` — a 4-state (`loading`/`ready`/`cached`/`error`) **load-driven** crossfade. A naive `opacity-0`-until-`onLoad` toggle replays a fade on every **cached** load (the documented "refresh flicker" the `cached` state exists to prevent). | **Do not change `SmartImage`.** Keep the load-driven crossfade. |
| 2 | Skeleton aspect-ratio/dimensions to match the card | `aspect-[3/4]` **already matches** `AnimeCard` (`aspect-[3/4]`, `AnimeCard.tsx:144`). But the skeleton's `rounded-[0.875rem]` is **stale** — the real frame was reduced to `rounded-[0.5rem]` (see memory `animecard_corner_radius`). | **Real fix:** correct the skeleton corner radius to `0.5rem` so the poster box matches exactly. |
| 3 | Fade-in class on the grid container on loading→data | Already implemented as `.grid-in` (globals.css:938-946), opacity-only, wired to `Grid`, `Rail`, `RankedGrid`, `QuickLists`. | **Already satisfied.** Verify; no change unless the residual cause below is confirmed. |

## Root cause of the *residual* flicker (not covered by the 3 requests)

Two stacked, uncoordinated entrances play over the skeleton→grid swap on a
client navigation to `/category/*`:

1. `app/template.tsx` remounts on navigation and plays `.route-in` (260ms fade)
   on the **skeleton** tree (`app/(browse)/loading.tsx`).
2. When `getCategory` resolves, React swaps the whole skeleton subtree for the
   real `<Grid>` in one commit. The skeleton is torn out while its `route-in`
   fade may still be running (a hard cut over a moving target), and the arriving
   grid simultaneously plays `.grid-in`. Two fades at two moments = the pop.

The skeleton grid itself is already stable (no per-card `.reveal`;
`GridSkeleton` comment, `Skeleton.tsx:84-89`), so the remaining motion is
(a) the cut through the skeleton and (b) the radius mismatch that makes the
placeholder box visibly differ from the arriving card.

## Planned changes

### 1. Correct the skeleton corner radius to match the real card (primary, low-risk)
`components/ui/Skeleton.tsx`:
- `CardSkeleton` (line 50): `rounded-[0.875rem]` → `rounded-[0.5rem]`.
- `RankedGridSkeleton` (line 207): `rounded-[0.875rem]` → `rounded-[0.5rem]`.
- Update the `CardSkeleton` header comment (line 40) if it still claims the old
  radius. Keep `aspect-[3/4]` (already correct) and `ring-1 ring-line/80`.

This removes the visible "corner jump" and makes the placeholder frame the exact
same box as the arriving card.

### 2. Make the skeleton→grid handoff one coordinated cross-fade (primary, motion)
The goal: on navigation, the skeleton should stop moving *before* the swap, and
the arriving grid's `.grid-in` should be the single entrance.

- **Stop `template.tsx` from animating the skeleton.** `app/template.tsx`
  currently fades *everything* including `loading.tsx` skeletons. Options
  (pick one, implementer's discretion — prefer A):
  - **A (preferred):** In `app/(browse)/loading.tsx`, wrap the skeleton in a
    wrapper that opts out of the route fade — e.g. render the skeleton without
    relying on `route-in`, or reset/neutralise the fade for the skeleton only.
    Simplest robust form: give the browse `loading.tsx` its own element that
    starts at `opacity: 1` and adds `route-in-none` (a tiny utility that sets
    `animation: none`) so the placeholder is static while it waits.
  - **B:** Scope `.route-in` so it does not apply to the `loading.tsx` subtree
    (e.g. move the fade onto a per-page wrapper instead of the shared
    `template.tsx`). Higher blast radius — only if A is insufficient.
- **Keep `.grid-in` on the arriving `<Grid>`** as the one entrance (already
  present). Do not add a second wrapper fade, do not add `revealDelay`.
- Do **not** add a transform/scale to the container (documented "grid shake",
  globals.css:717-734) and do **not** add a standing `will-change`.

### 3. (Only if still visible after 1+2) Confirm grid item count parity
`app/(browse)/loading.tsx` renders `GridSkeleton count={24}`; the real
`<Grid>` renders `res.data.results.length`. If a category returns fewer/more
than a full viewport of rows, the grid height changes on swap. This is a
*late-page* effect (below the fold) and usually invisible; only address if the
implementer observes a vertical jump. Do not change the fetch layer for this.

## Explicitly out of scope
- `SmartImage.tsx` — the load-driven crossfade is correct; a naive `onLoad`
  `opacity` toggle would regress cached-load behaviour.
- `components/anime/AnimeCard.tsx` internals, `Grid.tsx`, `Rail.tsx`,
  `RankedGrid.tsx`, `QuickLists.tsx` — `.grid-in` is already wired.
- `next.config.ts` image settings, data layer, timeouts, caching, the
  `data-reveal`/`Reveal` observer system, the `motion` (Framer) system.
- `components/common/RailShell.tsx` (shared by non-poster rails).

## Constraints / guardrails
- Motion stays compositor-only (opacity; transform only if unavoidable) and
  honours `prefers-reduced-motion` (`.grid-in` has an explicit guard; the global
  catch-all flattens the rest).
- No permanent `will-change`.
- Preserve the "cards visible from frame 0" contract — never a hidden
  (`opacity: 0` pre-hydration) wrapper.
- Keep skeleton geometry in sync with the real card (`aspect-[3/4]`,
  `rounded-[0.5rem]`, `ring-1 ring-line/80`).

## Files expected to change
- `components/ui/Skeleton.tsx` — corner radius on `CardSkeleton` +
  `RankedGridSkeleton`.
- `app/(browse)/loading.tsx` — make the skeleton static (no route fade).
- `app/globals.css` — only if step 2/3 introduces a small utility class
  (e.g. `animation: none`); prefer reusing existing classes.
- `app/template.tsx` — only if option B is chosen.

## Validation
1. `npm run dev`; hard-reload `http://localhost:3000/category/top-airing`
   (DevTools "Disable cache" + Fast 3G to exaggerate).
   - Skeleton shimmer is steady and never "snaps"; corners match the arriving
     cards; the grid fades in as ONE block with no double flash.
2. Warm reload (cache warm): no re-fade, no black-hole window, no per-card
   jitter.
3. Repeat on `/genre/*`, `/az/*`, `/search` (shared `app/(browse)/loading.tsx`
   + `Grid`), and client-navigate between them (the `template.tsx` path).
4. Spot-check home board and an `/anime/[id]` detail page are unchanged.
5. Toggle OS "reduce motion": skeleton and grid render static and fully visible.
6. `npm run lint && npm run typecheck && npm test && npm run build` all pass.

## Open questions
- None blocking. Step 2 option A vs B is an implementer choice with A preferred.
