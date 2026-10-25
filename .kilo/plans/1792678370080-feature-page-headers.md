# Feature-Rich Page Headers — Popular, Airing, Schedule, Browse A–Z

## Goal

Give the four routes below a polished, feature-identity header (eyebrow + icon + title +
description + small accent + real metadata), transitioning naturally into the existing
grid. **Design-only**: no route, API, provider, data-shape, sorting, pagination, or
watchlist/player changes. Reuse existing components and tokens.

## Critical facts discovered from the code (read before editing)

1. **Popular and Airing are the SAME route/component.** `/category/most-popular` and
   `/category/top-airing` both render `app/(browse)/category/[id]/page.tsx`, whose header
   is currently just `<PageHeader title={titleize(id)} />` (line 27) — no eyebrow, no lede.
   Per-page copy must be a **typed map keyed by category id** with a graceful fallback.
2. **Browse A–Z has NO alphabet navigation today.** `app/(browse)/az/[letter]/page.tsx`
   renders a single paginated full-catalogue surface; the provider's `getAZ`
   (`lib/providers/hianime/index.ts:214-218`) **ignores the letter** and returns the same
   full directory for every `/az/{letter}`. The footer already links all 27 letters
   (`components/layout/Footer.tsx:12,126-136`). Per user decision: render a **real** letter
   row of `Link`s to the existing `/az/{letter}` routes with the current letter styled
   active — and keep the copy honest ("popularity-sorted full catalogue"). No fake filtering.
3. `PageHeader` lives in `components/common/SectionHeader.tsx` (lines 14-38) and already
   supports `eyebrow` / `title` / `lede` / right-side `children`. Extend it (user decision),
   don't fork a new component.
4. Tokens already exist: `.glass`, `.text-page`, `.text-section`, `.text-label`,
   `.text-eyebrow`, `.text-desc`, `text-frost/muted/faint/snow`, `bg-frost-soft`,
   `border-frost/40`, `--space-header` (grid pages), `--space-section` (schedule).
5. Schedule already has a decent header (`CalendarDays` eyebrow "Release Calendar", title
   "Schedule", a real lede). Align it to the requested copy without touching schedule data.
6. A–Z page already shows a **real** count: `${res.data.totalPages} pages` from the API.
   Never hardcode; keep deriving from `res.data`.

## Ordered tasks

### 1. Extend `PageHeader` (`components/common/SectionHeader.tsx`)
- Add optional props: `icon?: LucideIcon` (or `ReactNode`) and `accent?: "frost" | "live" | "library" | "rank"`
  (default `"frost"`). Render the icon inside the eyebrow line, tinted by accent
  (e.g. frost → `text-frost`, live → a subtle emerald/rose tint already in the palette;
  **add no new colors** — reuse existing tokens; if no semantic color exists, keep `text-frost`
  and differentiate only via icon).
- Keep layout flat (`gap-1.5`, `h1.text-page`, `lede` `max-w-2xl text-desc text-muted`).
- Do **not** wrap in a heavy banner/glass panel (keeps vertical space small — brief §6/§7).
- Backward compatible: existing callers (search, genre, watchlist) pass nothing new and
  render exactly as today.

### 2. Category copy map (Popular + Airing + all linked categories)
- New module `lib/utils/category-copy.ts` (pure, SSR/client-safe like `format.ts`):
  `CATEGORY_HEADERS: Record<string, { eyebrow: string; title: string; lede: string; icon: LucideIcon }>`
  covering the ids the UI links to (from `lib/nav/config.ts` + `Footer.tsx`):
  - `most-popular` → eyebrow "DISCOVER SHIRAYUKI", title "Most Popular Anime",
    lede "Discover fan favorites, all-time classics, and the anime everyone is talking about.", icon `Flame`
  - `top-airing` → eyebrow "THIS SEASON", title "Currently Airing Anime",
    lede "Follow ongoing series, discover seasonal standouts, and find your next weekly watch.", icon `Sparkles`
  - plus `movie`, `tv`, `subbed-anime`, `dubbed-anime`, `new-anime`, `latest-completed`,
    `most-favorite`, `ova`, `ona`, `special` (short eyebrow + one-line lede each).
- Export `categoryHeader(id: string)` returning the map entry or a **fallback**
  `{ title: titleize(id) }` (no eyebrow/lede) so unlisted ids render as today.
- **Airing page**: also render a real link to the existing schedule — add it via
  `PageHeader`'s `children` slot as a `TapLink`/`Link` to `/schedule` labelled
  "View release schedule" (only in the `top-airing` entry). Don't invent live/releasing-today claims.

### 3. Category page (`app/(browse)/category/[id]/page.tsx`)
- Resolve `const h = categoryHeader(id)` and pass `eyebrow`, `title`, `icon`, `lede`, and
  (for `top-airing`) the schedule link as `children`.
- Everything else (safe(), pageNum, Grid, Pagination, empty/error states) stays byte-for-byte.

### 4. Browse A–Z page (`app/(browse)/az/[letter]/page.tsx`)
- Header: eyebrow "THE ANIME LIBRARY", title "Explore the Anime Universe",
  lede "From timeless classics to the latest releases, discover anime by title." (icon
  `Compass`/`Library`), plus accurate metadata: keep the real `totalPages` count line and,
  if easy, add `res.data.results.length`-derived wording — **never hardcode**.
- New client component `components/common/AlphabetNav.tsx` ("use client", uses
  `usePathname` like `Nav.tsx`): renders `all, 0-9, A–Z` as `Link`s to `/az/{letter}`,
  styling the current path segment active via `aria-current="page"`
  (mirror Pagination's active style: `border-frost/50 bg-frost-soft text-frost`).
  Reuse the exact letter list/logic from `Footer.tsx` (consider extracting
  `AZ_LETTERS` + `azLabel` into `lib/utils/format.ts` and importing in both to avoid drift).
- Responsive: `flex flex-wrap` (or the same `no-scrollbar overflow-x-auto` pattern the
  schedule weekday nav uses) so it never overflows on mobile.
- Place `AlphabetNav` between the header and `Grid`; adjust the existing
  `gap-[var(--space-header)]` wrapper so header → letters → count → grid rhythm is even.
- Preserve `basePath`, `currentPage`, `totalPages`, and the `/az/{letter}` route/params exactly.

### 5. Schedule page (`app/(browse)/schedule/page.tsx`)
- Align the header to: eyebrow "WEEKLY ANIME GUIDE", title "Anime Release Schedule",
  lede "Keep track of upcoming episodes and discover what's airing throughout the week."
  (keep the `CalendarDays` icon and the existing "Updated {…}" line).
- **Do NOT touch**: `getSchedule`/`withTimeout`, `WEEK_ORDER` ordering, `ScheduleCalendar`,
  `ScheduleItemRow`, poster→`toCard` mapping, the upcoming/airing sections, or the airing
  "More" link to `/category/top-airing`.
- Optional visual-only polish (only if zero risk): day-tab grouping polish is already good
  (`ScheduleCalendar` weekday tabs show real release counts) — prefer leaving it untouched
  unless a clearly safe spacing tweak is needed.

### 6. Contrast / a11y / reduced-motion
- One `<h1>` per page (already true via `PageHeader`).
- Icon accents are decorative → `aria-hidden`; letter links have accessible labels.
- Visible `focus-visible` outlines (reuse the `focus-visible:outline-frost` pattern).
- No new animations required; if any transition is added, it must be CSS-only and already
  covered by the global `prefers-reduced-motion` rule.

## Files changed (expected)

- `components/common/SectionHeader.tsx` — extend `PageHeader` (icon + accent).
- `lib/utils/category-copy.ts` — NEW copy map + `categoryHeader()`.
- `lib/utils/format.ts` — (optional) export `AZ_LETTERS` / `azLabel` for reuse.
- `components/common/AlphabetNav.tsx` — NEW client letter nav.
- `components/layout/Footer.tsx` — (optional) import the shared letter list.
- `app/(browse)/category/[id]/page.tsx` — use `categoryHeader()`.
- `app/(browse)/az/[letter]/page.tsx` — new header + `AlphabetNav` + count.
- `app/(browse)/schedule/page.tsx` — header copy only.

## Validation (run, don't claim)

1. `npm run lint` → `npm run typecheck` → `npm test` → `npm run build` (CI parity).
2. Manual/route checks: `/category/most-popular`, `/category/top-airing` (incl. `?page=2`),
   `/schedule`, `/az/all`, `/az/a`, `/az/0-9` — header renders, grid unchanged,
   pagination links correct, cards link to `/anime/[id]`.
3. Schedule timezone/premiere-date display unchanged (`formatDate` UTC path untouched).
4. Mobile (< md) + tablet: no horizontal overflow; letter row wraps/scrolls; contrast AA.
5. Confirm no decorative controls: every control added is a real `Link` to a real route.

## Open questions / risks

- **A–Z letters return identical content** (provider limitation). The active-letter
  highlight is real navigation but the result set won't change; the lede copy acknowledges
  this honestly. Risk: user may still expect filtering — copy is the mitigation.
- Accent colors: if the palette lacks a distinct "live" hue, keep the icon in `text-frost`
  and differentiate per-page by icon only (no new color tokens).
