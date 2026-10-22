# Watch-page episode sidebar — add Find / CC / mic / layout controls

## Goal

Add the compact control row from reference image 1 to the **watch-page episode
sidebar** (`/watch/[id]/[ep]`, the right-hand "Episodes" panel — reference image
2): a `Find` search box, a CC (captions) toggle, a mic (SUB/DUB) toggle, and a
list/grid layout toggle. Design-only additions wired to **existing** behavior.

## Current state (verified)

- The sidebar is **inline JSX in a server component**:
  `app/watch/[id]/[ep]/page.tsx:262-306`. It renders a header
  (`Episodes (N)` + `SUB`/`DUB` label) and a scroll container of `<Link>` rows.
  There is no search or toggle today.
- SUB/DUB already works via the URL param `?cat=sub|dub`, built by `swHref()`
  (`app/watch/[id]/[ep]/page.tsx:121-125`); `category` is derived from
  `searchParams.cat` (lines 78-79). Switching navigates to the same episode with
  a new `cat`/`server`.
- Captions live in the shared, persisted zustand store `usePrefs`
  (`lib/stores/prefs.ts`): fields `captions` and `category` already exist. The
  player reads `prefs.captions` / calls `prefs.set({ captions })`
  (`components/player/Player.tsx:217,456,458`). Toggling the store is the same
  mechanism as the player's `C` key.
- Existing glass tokens: `glass` + `watch-glass` (added earlier this session),
  `frost` cyan accent, `frost-soft` cyan tint, `line`, `surface`, `base`,
  `--radius-btn`, `text-eyebrow`/`text-caption`/`text-meta`.
- No dependency on the unrelated `CinematicInfo` redesign; this is scoped to the
  watch page sidebar only.

## Key constraint

A server component cannot hold `useState`/click handlers or read `usePrefs`.
The sidebar must be **extracted into a new client component**. This is the one
architectural change; behavior and data are preserved.

## Decisions (confirmed with user)

- Surface: **watch-page sidebar only** (not `EpisodeExplorer` on `/anime/[id]`).
- Add **all four** controls.
- Wiring (reuse existing behavior — invent nothing):
  - **Find** → filters the episode list by number or title.
  - **CC** → toggles captions via `usePrefs` (`prefs.set({ captions })`); stays
    in sync with the player's captions state.
  - **mic** → switches SUB↔DUB using the existing `?cat=` navigation (a `<Link>`,
    not a custom fetch), preserving the current server via the existing
    `swHref` logic.
  - **list/grid** → local-only visual layout toggle for the rows (rows ↔ a
    2-column grid). Purely presentational.

## Implementation tasks

1. **Create `components/details/EpisodeSidebar.tsx`** (client, `"use client"`).
   - Props: `{ animeId: string; episodes: EpisodeModel[]; currentEpisodeId:
     string; category: "sub" | "dub"; subHref: string; dubHref: string }`.
     Pass the pre-computed SUB/DUB hrefs from the server page (built with the
     existing `swHref("sub"|"dub", preferred?.nameId)`), so no URL logic moves.
   - Local state: `query` (string), `layout` ("list" | "grid").
   - Read `usePrefs` for `captions`; render the CC button with
     `aria-pressed={captions}` and `onClick={() => prefs.set({ captions: !captions })}`.
   - Move the current header + row markup from
     `app/watch/[id]/[ep]/page.tsx:262-306` into this component unchanged, then
     layer the controls on top.
   - Header row: title `Episodes (N)` on the left; the control group on the
     right (`Find` input with a `#`/`Search` icon, CC button, mic button,
     list/grid button). On narrow widths, let the controls wrap below the title
     (`flex-wrap`) so nothing clips.
   - `Find` input: reuse the existing pattern from `EpisodeExplorer.tsx:79-88`
     (`aria-label="Find episode"`, `placeholder="Find episode…"`), restyled to
     the sidebar's compact scale.
   - Mic: render as `<Link href={category === "dub" ? subHref : dubHref}>` with
     `aria-pressed={category === "dub"}`, so it uses the real route change.
   - Filter the list with the same predicate as
     `EpisodeExplorer.tsx:47-49` (number or title contains the query). Show the
     existing "No episodes match" empty state style when filtered to zero.
   - Grid layout class: reuse the current row markup for `list`; for `grid` use a
     `grid grid-cols-2 gap-1.5` container with the same row `<Link>`s
     (truncation stays via `line-clamp-1`).
   - Preserve: `key={e.episodeId}`, the `href`, `aria-current` on the active
     episode, the number badge, filler badge, and active/inactive glass classes
     exactly as they are today.
2. **Edit `app/watch/[id]/[ep]/page.tsx`**: replace the inline `<aside>…</aside>`
   (lines 262-306) with
   `<EpisodeSidebar animeId={id} episodes={episodes} currentEpisodeId={episodeId}
   category={category} subHref={swHref("sub", preferred?.nameId)}
   dubHref={swHref("dub", preferred?.nameId)} />`.
   Keep the surrounding `grid`/layout untouched so height-sync with the player
   is preserved. Remove now-unused imports from `page.tsx` if any become unused
   (e.g. `Link` stays only if still referenced elsewhere — check).
3. **Styling**: use existing tokens. Selected/active CC/mic/layout states use
   `bg-frost-soft text-frost border-frost/50`; inactive use
   `border-white/10 bg-base/40 text-muted hover:text-snow`. Match the `text-eyebrow`
   / small-caption scale already used in the header. No new CSS files; add a rule
   only if a hover/focus affordance needs it, in `app/globals.css` near the
   existing watch-page helpers.
4. **No functional changes** elsewhere: do not touch `swHref`, `getServers`,
   `getEpisodes`, the player, the `?cat=`/`?server=` contract, or the store shape.
   Add no dependency.

## Files

- New: `components/details/EpisodeSidebar.tsx`
- Edit: `app/watch/[id]/[ep]/page.tsx` (swap inline sidebar for the component)
- Possibly edit: `app/globals.css` (only if a scoped hover/focus rule is needed)

## Risks / edge cases

- **Grid/list toggle persistence**: keep it local (not in `usePrefs`) to avoid
  schema changes.
- **Long titles**: rely on `line-clamp-1`; verify in grid mode.
- **Narrow screens**: controls must wrap, not overflow; verify the header still
  fits at ~320px and that the sidebar keeps its `min-h-0` scroll behavior.
- **Captions sync**: the CC button reflects `prefs.captions`; if the player is
  not yet mounted, the store still holds the persisted value — acceptable.
- **SUB/DUB**: only offer the mic toggle when both pools exist
  (`servers.sub.length && servers.dub.length`); otherwise render it disabled or
  omit it, matching the existing server-strip behavior.
- **Height sync**: keep the sidebar's flex/scroll classes so it continues to
  match the player column height.

## Validation

- `npm run lint` → `npm run typecheck` → `npm test` → `npm run build`.
- Manual (needs a browser, currently unavailable in this env — note honestly if
  not run): open a title with many episodes; verify Find filters, CC toggles
  captions in sync with the player's `C` key, mic switches SUB/DUB via `?cat=`
  and preserves the server, list/grid switches layout, the active episode keeps
  its cyan glass state, and the layout holds at desktop/tablet/mobile widths.
- Confirm the diff is limited to presentation + the sidebar extraction; no
  changes to data fetching, routing contracts, or the player.

## Open questions

- None blocking. (Assumed the mic toggle should be hidden/disabled when a title
  has only one category — flag if you want it always visible.)
