# Discovery toolbar alignment fix

## Goal

Make the shared discovery filter toolbar (used by the Most Popular Anime page at
`/category/most-popular`, plus `/genre/[id]` and `/az/[letter]`) align all five
controls on **one horizontal row** on desktop, at a consistent **44px** height,
with an even **12px** gap, correct flex geometry, a 44×44 compact toggle group,
and a clean mobile wrap — without changing theme, colors, borders, typography,
or any filtering/sorting/view behavior.

## Current state (verified in code)

- `components/discovery/DiscoveryToolbar.tsx` — row is
  `flex flex-wrap items-center gap-2 sm:gap-3` (8px, then 12px). Search is
  `relative min-w-0 flex-1 basis-56`. All controls use `h-10` (**40px**, not 44).
  The `ViewToggle` is wrapped in `ml-auto`. The `glass rounded-lg p-3` container
  was already removed earlier this session, so the toolbar now sits directly in
  the page's max-width wrapper (requirement 10 already satisfied structurally).
- `components/discovery/ToolbarSelect.tsx` — `<select>` is `h-10 w-full
  appearance-none ... pl-3 pr-9`; chevron is an absolutely-positioned overlay at
  `right-2.5 top-1/2 -translate-y-1/2 size-4`.
- `components/discovery/ViewToggle.tsx` — group `flex shrink-0 items-center
  gap-1`; buttons `grid h-10 w-10 place-items-center` (**40×40**, not 44×44), gap
  is 4px not 12px.
- `components/discovery/DiscoveryBoard.tsx` — owns state and passes
  `view`/`onViewChange`; renders `<Grid>` or a row list. **Do not change its
  logic.**
- `components/ui/Skeleton.tsx` `ToolbarSkeleton` (lines 91–106) still renders a
  `glass rounded-lg p-3 sm:p-4` panel and `h-10` / `size-10` shapes — it no
  longer matches the real toolbar (which has no glass panel and will become
  44px). This must be updated in lockstep to avoid a skeleton→board jump.
- No test asserts toolbar markup, so no test changes are required.
- Tokens (`app/globals.css`): `--radius-btn: 0.625rem`, `--space-header: 1.5rem`,
  gutter via the page wrapper. There is **no** existing control-height token.

## Decisions (confirmed with user)

1. **Mobile wrap:** Row 1 = search at 100% width. Row 2 = Type + Sort sharing the
   row, with the view-toggle group pinned right. (When a filter is active, the
   Clear button also joins row 2, right side, next to the toggle group.)
2. **Desktop toggle position:** Keep the toggle group pinned to the right edge of
   the content container (`margin-left: auto`), with search taking remaining
   space (`flex: 1; min-width: 0`); Type/Sort stay at fixed widths in the 12px
   gap rhythm.
3. **Clear button:** Stays inline in the control row when active; on mobile it
   moves to row 2 (right side). It does not need to be one of the five.

## Implementation tasks

All changes are confined to `components/discovery/` and `components/ui/Skeleton.tsx`.
No changes to `DiscoveryBoard.tsx`, page files, grid, or any data logic.

### 1. `components/discovery/DiscoveryToolbar.tsx` — recreate the container

- Restore a real container in the component (currently only `cn(className)`), so
  it owns its box and is self-consistent with its skeleton. Use:
  `cn("rounded-[var(--radius-lg)] border border-line/60 bg-base/30 p-3 sm:p-4", className)`
  — a subtle panel consistent with the dark theme. If the intent is truly
  borderless (the earlier in-session change removed `glass`), use
  `cn("p-3 sm:p-4", className)` and **update `ToolbarSkeleton` to match exactly**
  (see task 5). Pick one and keep skeleton in sync — the invariant is
  *toolbar box == skeleton box*.
- Row wrapper: `flex flex-wrap items-center gap-3` (uniform **12px** gap at all
  breakpoints — replaces `gap-2 sm:gap-3`).
- Search wrapper: `relative min-w-0 flex-1 basis-full sm:basis-56` so it is
  **full-width on mobile** and flex-grows on desktop. `min-width: 0` is given via
  `min-w-0`.
- Search input: change `h-10` → `h-11` (**44px**) and add `box-border`. Keep
  `pl-9 pr-3`, colors, border, radius, focus ring unchanged.
- Replace the current `ml-auto` wrapper on the toggle with `ml-auto` applied to
  the **toggle group itself** (pass through, or wrap similarly) so it pins right
  on desktop and stays right within row 2 on mobile. Type/Sort keep their
  `min-w-[9.5rem]` / `min-w-[10.5rem]`; add `flex-1 sm:flex-none` so on mobile
  they split row 2 evenly and on desktop revert to fixed widths.
- The `Clear` button: keep inline, `shrink-0`, and give it mobile handling so it
  lands on row 2 (e.g. `order` such that it follows the toggles, or wrap toggles
  + Clear in one right-pinned group). It must not force row 1 to overflow.
- Do **not** touch the count `<p>` copy or the props interface.

### 2. `components/discovery/ToolbarSelect.tsx` — 44px, box-border, centered icon

- `<select>`: `h-10` → `h-11`; add `box-border`; keep `w-full appearance-none
  rounded-[var(--radius-btn)] border border-line bg-base/40 pl-3 pr-9 text-sm
  text-snow` and focus/hover states. Add `leading-none` if needed so the single
  line of text is vertically centered within 44px.
- Chevron: already vertically centered via `top-1/2 -translate-y-1/2`; keep as is
  (confirms requirement 7 — icons do not shift text).

### 3. `components/discovery/ViewToggle.tsx` — 44×44 group, 44×44 buttons

- Group: `flex shrink-0 items-center gap-1` → keep `gap-1` only if a 44px visual
  group is desired; otherwise use `gap-3` to honor the uniform 12px rhythm. Use
  `gap-1.5` (the two buttons are one segmented control, so a tight inner gap is
  intentional; the group as a whole respects the outer 12px row gap).
- Each button: `h-10 w-10` → `h-11 w-11` (**44×44**) and `grid place-items-center`
  (already) so `size-4` icons are centered. Keep active/hover border-bg swaps.

### 4. Container alignment (requirement 10)

No page-level change needed: `app/layout.tsx` (lines 163–166) already imposes
`mx-auto w-full max-w-[1460px] px-4 sm:px-6 lg:px-8`, and the toolbar renders
inside `PageHeader`'s sibling flow in the same column. Verify after the change
that the toolbar's left/right edges match the `<Grid>` below it (both are direct
children of the same wrapper), and that removing/restoring the container does not
introduce a horizontal offset.

### 5. `components/ui/Skeleton.tsx` `ToolbarSkeleton` — match the real toolbar

- Mirror the chosen container (panel or borderless) **exactly**.
- Row wrapper: `flex flex-wrap items-center gap-3`.
- Search placeholder: `h-11 basis-full sm:basis-56 min-w-0 flex-1 rounded-[var(--radius-btn)]`.
- Dropdown placeholders: `h-11` (was `h-10`), keep widths.
- Toggle placeholders: `size-11` (was `size-10`), `gap-1.5`.
- Keep the `ml-auto` position for the toggle placeholders so skeleton and real
  layout wrap identically.

## Failure modes / risks

- **Skeleton mismatch:** if the toolbar container height changes but the skeleton
  is not updated, the skeleton→board swap jumps. Must keep them identical.
- **Row overflow on desktop:** with 44px height and `ml-auto` toggle, a long sort
  label could still fit; verify at md and xl widths that all five controls stay
  on one row (no unexpected wrap). If wrapping occurs at md, consider reducing
  search `basis` or allowing the toggles to drop before the dropdowns.
- **Mobile row 2 ordering:** ensure Type, Sort, and the toggle group (and Clear
  when active) form one tidy row 2 that wraps to row 3 only if the viewport is
  very narrow; test 320px / 375px.
- **`box-border`:** Tailwind v4 sets `border-box` by default, but the requirement
  asks explicitly — adding the utility is harmless and documents intent for the
  fixed-height controls.

## Validation plan

1. `npm run typecheck` — no type changes expected.
2. `npm run lint` — clean.
3. `npm test` — 122 tests must still pass (no test touches markup).
4. `npm run build` — must succeed.
5. Manual, `npm run dev` → `http://localhost:3000/category/most-popular`:
   - Desktop (≥1024px): search + "All types" + "Default order" + grid toggle +
     list toggle on ONE row; all 44px tall; 12px gaps; toggle group flush right.
   - Confirm each control's rendered height is 44px (DevTools).
   - Filter by title → row still aligned; Clear appears inline without breaking
     the row.
   - Toggle grid↔list → view switches, toolbar layout stable.
   - Mobile (375px, and 320px): search full width on row 1; Type + Sort + toggles
     (+ Clear when active) on row 2, toggles right-pinned.
   - Compare toolbar L/R edges against the poster grid below (must match).
   - Reload to exercise the route skeleton → confirm no visible jump when the
     real toolbar replaces `ToolbarSkeleton`.
6. Spot-check `/genre/action` and `/az/all` for the same alignment (shared
   component).

## Out of scope

- `/schedule` (its toolbar was intentionally removed earlier this session).
- `DiscoveryBoard` filtering/sorting/view logic and page data fetching.
- Theme, color, border, typography token changes.
- Any new control (year/season/status) or backend behavior.
