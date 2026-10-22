# Fix category-page loading → content "instant / flicker" swap

## Goal

On `/category/most-popular`, the transition **skeleton → loaded grid** currently reads as
an instant, jarring swap (described as "flickering"), instead of a smooth,
coordinated load. Make the skeleton read as a calm, continuously-alive
placeholder that cross-fades cleanly into the real cards with no hard cut.

## Root cause (verified in code)

Two independent problems stack:

1. **The skeleton's own stagger animation is still mid-flight when data lands.**
   `app/(browse)/loading.tsx` renders `<GridSkeleton count={24} />`.
   `components/ui/Skeleton.tsx:83` (`GridSkeleton`) wraps **each** of the 24
   cards in `className="reveal"` with `style={revealDelay(Math.min(i,11)*45)}`
   — i.e. a 0.6s `reveal-rise` mount animation with up to **~495ms of stagger**,
   applied on top of a `.shimmer-loop` that is already running.
   When `getCategory` resolves, React swaps the entire skeleton tree for the real
   `<Grid>` of 24 `AnimeCard`s in a fast commit. The arriving tree does **not**
   reuse the skeleton's DOM nodes, so the still-animating skeletons are torn out
   and replaced → a hard cut over a moving target = the perceived flicker.
   (Note: this is the *skeleton* `.reveal` on `CardSkeleton`, NOT the
   `Reveal`/`data-reveal` observer system — those are different mechanisms.)

2. **The real cards have no coordinated entrance; they pop in per-image.**
   `AnimeCard` renders its poster through `SmartImage`
   (`components/ui/SmartImage.tsx`). Each poster URL points at the **Next image
   optimizer** and is cold on the first visit, so every `SmartImage` starts in
   `"loading"` (a `.shimmer-loop`) and only cross-fades when its own `onLoad`
   fires — at a different time per card. So even if the swap were clean, 24
   independent shimmer→image cross-fades land in a burst that reads as noise.
   This is the same class of bug already documented for the home board
   (`AnimeCard.tsx` / `Grid.tsx` comments: never double-fade; keep the frame
   visible).

The skeleton geometry itself already matches `Grid` (both 2/3/4/5/6 `grid-cols-*`),
so there is **no layout-shift** problem to solve — only the motion/handoff.

## Constraints / guardrails (from AGENTS.md + code comments)

- Do **not** wrap `AnimeCard`/`Grid` cards in `Reveal`/`data-reveal` — they render
  invisible until hydration (documented "first-load flicker").
- Keep `CardSkeleton` markup geometry in sync with `Grid`/`AnimeCard` (3/4 frame,
  `rounded-[0.5rem]` frame per the corner-radius correction).
- Motion must stay compositor-only (transform/opacity) and honour
  `prefers-reduced-motion`. No permanent `will-change`.
- Do not touch `app/page.tsx` home ISR, `/watch/*` dynamism, or the proxy guards.
- `npm run lint && npm run typecheck && npm test && npm run build` must pass
  before done (81 tests currently).

## Planned changes

### 1. Stop the skeleton from doing a staggered mount animation
`components/ui/Skeleton.tsx` — `GridSkeleton` (and, for consistency, the other
`reveal`-wrapped skeletons that stand in for a grid/rail):

- Remove the per-card `.reveal` + `revealDelay` stagger from the skeleton cards.
  A route-level skeleton is a *placeholder*, not content: it should appear
  immediately and stay alive via `.shimmer-loop` only. The staggered `reveal` is
  what the swap cuts through.
- Keep each `CardSkeleton` at `shimmer-loop` (the shared `Skeleton` primitive
  already applies `shimmer-loop`), so the placeholders keep breathing until data
  arrives.
- Leave `RailSkeleton` / `TrendingSkeleton` decision to the implementer, but the
  same rationale applies wherever a skeleton grid/rail is torn out on swap.

**Result:** the skeleton is a stable, evenly-shimmering grid with no in-flight
transform when the real grid mounts.

### 2. Give the arriving grid one coordinated, gentle cross-in
`components/anime/Grid.tsx` (and, if desired, `Rail.tsx`) — add a single
container-level entrance so the real grid fades in as **one unit** instead of 24
independent pops:

- Wrap the grid container so it cross-fades in (reuse the existing `.enter-fade`
  keyframe in `globals.css`, or add a short opacity-only one-shot). Prefer
  **opacity-only** — no per-card scale/translate (the `image-stack-in` comment in
  `globals.css:717` documents that per-image transforms made grids "shake/flicker").
- The container fade is inert to layout (opacity only), plays once on mount, and
  is automatically a no-op under `prefers-reduced-motion` (extend the reduce block
  if a new class is added).
- This masks the per-image optimizer decode burst behind one calm wrapper fade,
  while each `SmartImage` still owns its own shimmer→bitmap cross-fade.

This mirrors the home board principle: "reveal as ONE unit", never section-by-section.

### 3. (Optional, only if step 1+2 are not enough on a cold cache)
Reduce first-visit double-shimmer in `SmartImage` for the browse grid by letting
the grid container's fade be the single entrance and keeping `SmartImage`'s
`loading` shimmer for slow/uncached bitmaps. Do **not** disable
`SmartImage`'s load-driven crossfade (that is correct behaviour); only ensure we
never stack a wrapper fade on top of a still-loading shimmer in a way that reads
as two flashes. Treat as a follow-up if needed after measuring steps 1+2.

## Files expected to change

- `components/ui/Skeleton.tsx` — drop `.reveal`/`revealDelay` from `GridSkeleton`
  skeleton cards (primary fix).
- `components/anime/Grid.tsx` — one-unit opacity cross-in for the real grid.
- `app/globals.css` — only if a new one-shot class is introduced (prefer reusing
  `.enter-fade`); add/extend the reduced-motion block if so.

Likely **no** change needed to `app/(browse)/loading.tsx` or
`app/(browse)/category/[id]/page.tsx` (the count/layout already match), but the
implementer may confirm `GridSkeleton count={24}` still matches a full page.

## Validation

1. `npm run dev`, open `http://localhost:3000/category/most-popular`.
2. Hard-reload (cold optimizer cache — DevTools "Disable cache" + empty Network
   throttling to "Fast 3G" to exaggerate): the skeleton should shimmer evenly and
   never visibly "snap"; the real grid should fade in as one block.
3. Warm reload (cache warm): no double-fade, no black-hole window, no per-card
   jitter.
4. Repeat for `/genre/*`, `/az/*`, `/search` (they share the same
   `app/(browse)/loading.tsx` + `Grid`), and spot-check the home board is
   unchanged.
5. Toggle OS "reduce motion": skeleton and grid should render static, fully
   visible, with no animation.
6. Run `npm run lint && npm run typecheck && npm test && npm run build`.

## Out of scope

- Changing the data layer, timeouts, or caching.
- The `data-reveal`/`Reveal` viewport system and the `motion` (Framer) system.
- Image optimizer / `next.config.ts` image settings.

## Open question (resolved by default)

Should the entering grid fade be applied to **all** `Grid` consumers (genre, az,
search, category) or only category? **Default: all** — they share the same
skeleton and the fix is generic and cheap. Flag if a narrower blast radius is
preferred.
