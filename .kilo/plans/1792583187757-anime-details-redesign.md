# Anime Details Page — Cinematic Redesign

Route: `app/anime/[id]/page.tsx` · Target: `http://localhost:3000/anime/one-piece-1`
Branch: `kilo/top-upcoming-fixes` (current). Do NOT push to `main`; land via PR.

## Goal

Rework `/anime/[id]` into a deliberate, cinematic, provider-accurate detail page:
immersive artwork-led hero → compact organized info → episode explorer → cast +
staff → franchise timeline → conditional release card. Preserve all working routes
and features. Every section must render from **real hianime API data** or degrade
gracefully. No fabricated trailers, ratings, dates, counts or images.

---

## Ground truth from the live API (verified this session)

Endpoint base: `/api/v2/hianime`. Only hianime is wired (anikoto/animex/reanime
are unwired). Fields actually available (sampled `one-piece-1`, `naruto-677`,
`bleach-806`):

- **`/anime/:id`** → `id, slug, title, jname, alias, poster, description, type,
  rating, quality, episodes{sub,dub,total}, genres[], studios[], producers[],
  premiered, aired, status, duration, malScore, relations[]`.
  - **`premiered` is ALWAYS `null`** → the model's `year`/`season` are always null.
    `aired` (e.g. `"Oct 20, 1999 to ?"`) is the real date source.
  - **`rating` is `0`** for most titles → rating chip usually absent (`>0` guard already exists).
  - **`relations` is ALWAYS `[]`** → the current "Related" rail renders nothing today.
  - **`producers[]` is returned but dropped** by the mapper (`toDetail` never maps it).
  - **No `banner`/`cover`** on detail; `cover` is set to `poster` in the mapper.
  - **No trailer / video / PV field anywhere** in the hianime surface.
- **`/anime/:id/episodes`** → `totalEpisodes`, `episodes[{episode, episodeId, title, url}]`.
  - `title` is literally `"Episode N"`; `episodeId` is the **bare number string**
    (`"1"`, `"2"`…). **No thumbnails, no durations, no air dates, no sub/dub flags per episode.**
  - **No server-side pagination exists** (verified: the episodes schema has no `page`/`limit`/
    `offset`, and the hianime client only adds `page` to search/genre/browse/az). One Piece
    returns all 1180 rows (~128 KB) in a single response. `getEpisodes(id)` is a shared facade
    also used by both watch routes and takes only `id` — extending its signature would risk
    regressions and change the provider contract. **Decision: keep `getEpisodes` unchanged
    (cached, 3600 s), render only 100 rows at a time in the UI.** The 128 KB transfer/memory is a
    backend limitation; document it. If the backend later adds pagination, the explorer can adopt
    it without changing the provider facade.
- **`/anime/:id/seasons`** → `seasons[{id,title,jname,poster,type,episodes,{year,isCurrent,isMovie,season,part,order}}]`.
  - Full ordered franchise incl. **movies** (`isMovie:true`), all `year:null`,
    `season`/`part` mostly null for movies, `order` sequential from 0. For One Piece: 19 entries.
- **`/anime/:id/art`** → `anime{...}`, `art[{id,slug,poster,title}]`,
  `characters[{id,slug,name,poster,role,url,voiceActor{id,slug,name,poster,language,url}}]`,
  `charactersTotal`, `artists[{name,slug,kind:"studio"|"producer",url}]`, `company{name,slug,kind,url,logo,logoColor}`.
  - **`art[]` is NOT a gallery** — it is the poster + one sibling thumbnail (2 items).
  - **`characters[]` contains DUPLICATES**: the same character id appears N times,
    once per voice actor (multiple Japanese VAs). e.g. One Piece has 26 rows for ~13
    characters. Must **dedupe by character id**, aggregating VAs.
  - **`artists[]` and `company` are returned but dropped** by `toArtBundle`.
- **`/schedule`** → `week[{day, items[{id,title,poster,type,airTime,episodeNumber,premiereDate,weekday,...}]}]`,
  `airing[{id,title,poster,type,status,aired,premiereDate,weekday}]`,
  `upcoming[...]`. Airing titles like `one-piece-1` appear in `airing[]` (no `airTime`/`episodeNumber`);
  `week[].items` carry `airTime`+`episodeNumber` but only for that week's scheduled titles.

**Consequences:** the brief's Trailer and Art Gallery sections are **unsupported by
the API**; provider "Related/Recommendations" is **unsupported** (empty relations).
These are omitted and documented (decision confirmed with user).

---

## User-confirmed decisions

1. **Trailer & Art Gallery → OMIT.** No trailer endpoint; `art[]` is not a gallery.
   Document the limitation. No fabricated links, no duplicated-image gallery.
2. **Related Anime → franchise timeline from `/seasons`.** No provider recommendations rail.
3. **Release Schedule → conditional "Next Episode" card** for currently-airing titles,
   matched from `/schedule` (`week[].items` first for `airTime`+`episodeNumber`, else `airing[]`).
   Omit entirely when unmatched / completed / upcoming. No countdown unless a real future timestamp exists.

---

## Current state (what exists)

- `app/anime/[id]/page.tsx` (272 lines): breadcrumb → 2-col glass hero (poster+TiltCard +
  inline title/badges/desc/Watch) + "Anime Info" `<aside>` (dl list) → `section-stack` with
  `SeasonRail`, `CastSection`, `Rail "Related"` (empty), `Rail "Upcoming"` (heavy `getHome()`).
- **Watch routes resolve today**: `/watch/[id]` (`app/watch/[id]/page.tsx`) fetches the episode
  list server-side and client-redirects to the resume/first episode, **`notFound()` when the
  episode list is empty**; `/watch/[id]/[ep]` is the player. So a title with zero episodes (e.g.
  "Not yet aired") has **no valid `/watch/{id}` destination** — the hero must suppress Watch Now
  unless `episodes.length > 0` AND the title is not unreleased.
- **Unused-but-built components in `components/details/`**: `EpisodeList.tsx` (client,
  range pager + search, 100/page), `ArtGallery.tsx` (franchise poster rail), `CinematicInfo.tsx`
  (rich panel — used by the **watch** page, not the detail page).
- `DetailBackdrop.tsx`: fixed full-viewport blurred/desaturated backdrop with stacked scrims.
- Shared: `RailShell`, `SectionHeader`, `AnimeCard`, `Grid`, `Rail`, `SmartImage`, `Skeleton`,
  `States` (Empty/Error), `TiltCard`, `Reveal`, `press`, `.glass`, `.section-stack`, `.frost-eyebrow`.
- Tokens (`app/globals.css` `@theme`): surfaces `base/surface/surface-2/overlay/line`,
  `snow/muted/faint`, `frost/frost-deep/frost-soft`, `success/warning/danger`; radii
  `sm .5/md .875/lg 1.25/xl 1.75/btn .625`; `--space-section 3rem`; type roles
  `.text-page/.text-section/.text-title/.text-desc/.text-meta/.text-caption/.text-label/.text-eyebrow`.
- Nav: single typed config `lib/nav/config.ts` (`assertNavUniqueness()` throws on dupes).
- `lib/api/index.ts` facade (React `cache()`d); `safe()` → `Result<T,E>`; provider only
  through `lib/providers/hianime`. Detail/episodes/seasons/art revalidate 3600s; schedule 1800s.
- Layout: `<main>` is a size container; content column is `max-w-[1460px] px-4 sm:px-6 lg:px-8`.
  A full-bleed child breaks out with `w-[100cqw] left-[calc(50%-50cqw)]` (never `w-screen`).
- Global rules (AGENTS.md): never wrap grid/rail cards in `Reveal` (blank pre-hydration);
  keep Motion limited to pointer/spring/AnimatePresence; gate touch/reduced-motion.

---

## Plan

### 1. Provider/model layer (add data the API already returns; no invention)

- `lib/providers/types.ts`:
  - Add `StaffCredit { name: string; slug: string | null; kind: "studio" | "producer"; url: string | null }`.
  - Add `producers: string[]` to `AnimeDetail`.
  - Add to `AnimeArtBundle`: `staff: StaffCredit[]`, `company: StaffCredit | null`.
  - Add `isAiringLike?: boolean` is NOT needed — derive from `status` string in the UI.
- `lib/providers/hianime/schemas.ts`: extend `artData` with `artists` array (name, slug,
  kind, url) and `company` object; add `producers: z.array(z.string()).default([])` to `detailData`.
- `lib/providers/hianime/mappers.ts`:
  - `toDetail`: map `producers` (filter non-empty strings).
  - `toArtBundle`: map `artists[]` → `staff`, map `company` → `company`. Dedupe `staff` by
    `${kind}:${slug ?? name}` so Toei (studio + producer) appears once per distinct kind, or
    keep both kinds labelled (choose: labels distinguish them; dedupe exact name+kind pairs).
  - **Character dedupe**: add a helper that collapses `CharacterModel[]` by `id` (fallback
    `name`), keeping the first as primary and collecting additional `voiceActors[]` into a
    new optional `CharacterModel.voiceActors?: VoiceActorModel[]` (primary remains `voiceActor`).
    Alternatively dedupe in a small pure util under `lib/utils/` so it is unit-testable and
    keeps mappers thin. **Preferred: pure util** `dedupeCharacters()` in
    `lib/providers/hianime/characters.ts` (leaf module, node:test-importable like `concurrency.ts`),
    called by `toArtBundle`.
- Add tests: `lib/providers/hianime/characters.test.ts` (dedupe: multi-VA collapse, single VA,
  null id fallback to name, keeps order) and extend any mapper test if present. Follow existing
  `*.test.ts` relative-import + explicit-extension convention.

### 2. New shared detail components (consistent card language)

Create under `components/details/` (server components unless interaction demands client):

- **`NextEpisodeCard.tsx`** (server): props `{ item: ScheduleItem | null; animeId }`.
  Shows "Next" eyebrow, episode label (from `episodeNumber` else `Episode {n}` from
  `nextEp`), `airTime`/`weekday`/`premiereDate`, status. Returns `null` when no match.
  Caller (page) computes the match: prefer `schedule.week.flatMap(items).find(i => i.id === id)`,
  else `schedule.airing.find(i => i.id === id)` (airing has no time → show weekday/premiere only).
  Only rendered when status is airing-like **and** a schedule match exists. No countdown unless
  a real future timestamp is derivable from `premiereDate`+`airTime`; otherwise show the date only.
- **`EpisodeExplorer.tsx`** (client): evolves the existing `EpisodeList.tsx` into a richer
  explorer — range selector (ranges of 100) + optional jump, search, **episode cards**
  with number chip + title + a "play" affordance linking to `/watch/{id}/{episodeId}`.
  **Renders only the current 100-item range** — never mounts all 1180. No thumbnail/duration/
  sub-dub per-episode UI (not in API) — omit instead of faking. Keep an empty state via
  `EmptyState`. Section is skipped entirely when the episode list is empty.
- **`CharacterCarousel.tsx`** (client or server + CSS scroll): responsive grid (desktop) /
  horizontal snap rail (mobile) of portrait character cards. Card: portrait (SmartImage,
  `aspect-[3/4]`), name, role chip, and on hover/focus a bottom-up reveal of VA name +
  portrait; on touch the reveal rests visible (`[@media(pointer:coarse)]` pattern already used
  in `AnimeCard`). Multi-VA: show primary, list additional VA names in the reveal. Reduced-motion
  flattens. Deduped list from step 1; hide section when empty.
- **`FranchiseTimeline.tsx`** (server): restyled `SeasonRail` replacement (keep `RailShell`
  rhythm) rendering `SeasonModel[]` ordered by `order`, with a **chronological "watch order"
  timeline** treatment: numbered entries, `isMovie` → movie icon/label, `type` badge,
  `isCurrent` → "Now viewing" pill, sub/dub counts via `EpBadges`. Distinguish sequels/prequels/
  specials/movies **only from `isMovie` + `type` + `order`** — do NOT infer prequel/sequel
  semantics beyond this (API has no relation labels). Preserve `/anime/{id}` links and current
  selection behavior.
- **`DetailsInfo.tsx`** (server): compact, organized info grid replacing the crowded `<aside>` dl.
  Grouped: **Titles** (title, jname, ename/alias), **Release** (type, `aired`, status, season/year
  if present), **Runtime** (duration, episodes sub/dub), **Production** (studios, producers —
  de-emphasized if long), **Genres** (links to `/genre/{slugify}`). Two-column definition grid on
  desktop, single column mobile; only render fields that exist. Merge the old "Anime Info" aside +
  the info spread across the hero into ONE component (no duplicate panels).
- **`HeroSection.tsx`** (server): the new opening. Layout:
  - Uses the **existing single `DetailBackdrop`** — the hero introduces NO second background
    image and NO additional scrim stack (see §4 overlays). Its content sits in normal flow over
    the fixed backdrop; the section itself is transparent so the backdrop's bottom fade meets
    page `base` with no dark band or seam.
  - Content: breadcrumb (Home · type-category · title), then a balanced hero —
    supporting poster (TiltCard, `aspect-[2/3]`, ~200–240px) + copy column:
    title (`text-hero`/`text-display`), original title (jname/alias) if distinct, compact
    **metadata row** (type · year-from-aired · status · duration · MAL score · rating when `>0`),
    genre chips (subtle, interactive → `/genre/*`), concise synopsis with **expandable** text
    (lift the `ReadMore` pattern from `CinematicInfo`), and an **action row**:
    - **Watch Now** (primary, frost) → `/watch/{id}` **only when `episodes.length > 0`** and the
      title is not unreleased (otherwise the route 404s). When known, link the first episode
      directly (`/watch/{id}/{encodeURIComponent(firstEp.episodeId)}`) to skip the redirect hop.
    - **Add to My List** (secondary) — wire `toggleList` from `lib/watchlist/local.ts` (client island; reuse `WATCHLIST_EVENT` sync + `aria-pressed`). Mirrors the watch-page `CinematicInfo` buttons.
    - **Share** (secondary) — reuse the existing clipboard/`navigator.share` + toast pattern.
    - **Trailer** action **omitted** (no trailer).
    - Clear "Not yet aired" treatment for upcoming titles: **no Watch Now**; show premiere/status info instead.
  - Client-only pieces (My List / Share / ReadMore) isolated into a small `HeroActions.tsx`
    client component so the hero stays a server component.

### 3. Page composition (`app/anime/[id]/page.tsx`)

Reorder into a clear beginning → middle → end:

1. **Hero** (`HeroSection` + existing `DetailBackdrop`) — identity first, strongest hierarchy.
2. **Details info + Staff** — ONE compact block (`DetailsInfo`, with a staff sub-block fed by
   `art.staff`/`company`). Placed directly under the hero: 2-col on desktop (info + slim detail
   column), single column on mobile. Combines the old "Anime Info" aside + hero spread; no
   duplicate panels. Staff stays compact (not a dense text panel).
3. **Next episode** (`NextEpisodeCard`) — only when airing + matched. Near the top.
4. **Episodes** (`EpisodeExplorer`) — range selector + paged episode cards (100 at a time).
5. **Characters** (`CharacterCarousel`) — deduped cast, hide when empty.
6. **Franchise** (`FranchiseTimeline`) — ordered seasons + movies, hide when `<2` entries.

**Visual-focus rule (point 5):** the hero gets the strongest hierarchy; episodes, characters and
franchise are the prioritized browsing sections; details/staff stay compact and merged. No long
chain of dense panels — each section is one clear header + one visual unit, with generous spacing
(`--space-section`) and no oversized empty regions.

Remove: the empty "Related" rail (relations always empty), the heavyweight `getHome()`
"Upcoming" rail on the detail page (redundant, not anime-specific, costs a full home scrape).
This drops `getHome` from the page's `Promise.all`.

**Data fetching (point 2 — do NOT block on schedule for non-airing titles):**
- **Phase 1 (parallel):** `getAnime` (required → `notFound` on fail), `getEpisodes`,
  `getAnimeSeasons`, `getAnimeArt` — all independent, one `Promise.all`, each wrapped in `safe()`.
- **Phase 2 (conditional):** only if the resolved `status` is airing-like,
  `await safe(() => withTimeout(getSchedule(), 8_000))`. Completed/upcoming titles never fetch the
  heavy schedule (which can take ~22 s cold), so they render immediately. All optional failures are
  non-fatal (section hidden).

Keep `generateMetadata` (uses `getAnime` only). Keep JSON-LD (`TVSeries`). Update `<script>` block.

### 4. Visual/system details

- **Overlays (point 4)**: `DetailBackdrop` is the SINGLE fixed artwork layer. Audit its four
  stacked scrims (header, primary, left-right, vignette) and consolidate to ≤3 with a controlled
  vertical gradient + vignette that keeps artwork color/detail visible behind the hero and fades
  to solid `base` through the lower third — no abrupt dark band and no seam where the hero meets
  the page. The hero introduces no second `<Image>` background and no extra scrim set. Verify the
  text stays readable against bright artwork and that the transition reads as one continuous fade.
- **Cards**: moderate rounding (`rounded-md`/`rounded-[0.5rem]` to match `AnimeCard`);
  bottom gradient for title readability; compact status/format badges; bottom-up info
  reveal on hover/focus; restrained shadows (`--shadow-soft`/`--shadow-frost`); no thick
  borders or neon glow. Poster cards reuse `AnimeCard` where the surface is a
  grid/rail; character + episode cards get purpose-built markup per the brief's
  "reuse without forcing identical layout".
- **Motion**: default CSS reveal system; any pointer/spring detail via existing Motion
  tokens (`lib/motion/tokens.ts`). Gate with `useMediaQuery`/`useReducedMotion`. Never
  wrap grid/rail cards in `<Reveal>`.
- **Responsive**: desktop wide hero + sidecar + horizontal rails; tablet adjust hero
  columns + avoid cramped metadata wrap; mobile recompose hero (poster above or compact),
  keep actions reachable, touch reveals rest visible, responsive episode/character grids,
  prevent horizontal overflow, no oversized empty hero. Test ~375px and ~1440px.
- **A11y**: semantic `section`/`h2` headings, meaningful `alt` (use titles, not decorative
  when informative; backdrop stays `aria-hidden`), keyboard focus rings (existing global
  `:focus-visible`), `aria-pressed` on toggles, reduced-motion respected.
- **Images**: `SmartImage` for posters/portraits; reserve dimensions via aspect ratios;
  `priority` on the hero poster only; lazy below the fold; backdrop `quality={50}` (keep).

### 5. Loading & states

- Rewrite `app/anime/[id]/loading.tsx` to mirror the NEW order/dimensions exactly
  (breadcrumb → hero poster+copy → info grid → next-episode stub → episode cards →
  character cards → franchise rail). Preserve dimensions to avoid layout shift.
- Empty states via `EmptyState` (no episodes / no cast); error/retry via `ErrorState`
  where a section's own fetch is retryable (episode explorer). Sections hide when the
  API simply has nothing (graceful, not an error box).

### 6. Verification (run before claiming done)

```
npm run lint && npm run typecheck && npm test && npm run build
```
Then `npm run dev` and visually inspect, at minimum:
- `one-piece-1` (airing, 1180 eps, 19 seasons, 26 cast rows → dedup, multi-VA).
- A completed title (e.g. `bleach-806` / `naruto-677` → Date A Live IV) — no next-episode card.
- An upcoming / "Not yet aired" title if reachable via `/schedule` upcoming ids.
- A sparse title (no cast / no seasons) → sections hide gracefully.
Check: no horizontal overflow, no blank pre-hydration cards, focus states, mobile hover-rest,
backdrop readability, watch links resolve. Also `npm run prerender:check` and (if a build exists)
`npm run bundle:check`.

### 7. Risks / watch-outs

- **Episode volume**: the API returns the whole list (no pagination); keep `getEpisodes` cached and
  render only the current 100-item range. Never mount all 1180 nodes. Document the transfer as a
  backend limitation.
- **Schedule latency**: never fetch/await the schedule for non-airing titles; it can take ~22 s
  cold. Conditional Phase-2 fetch only, with an 8 s timeout, failures non-fatal.
- **Watch destination**: `/watch/[id]` 404s when the episode list is empty — suppress Watch Now
  for unreleased / zero-episode titles (verify against an upcoming id from `/schedule`).
- **Character dedupe correctness**: must not merge distinct characters with null ids; fall back
  to name only when id is null. Do NOT wrongly attach a VA to a different character — dedupe
  preserves each character's own VA set.
- **`premiered` always null**: never display a fabricated season/year; derive year from `aired`.
- **Cast pages**: `art.characters` is capped by upstream (`charactersTotal` may exceed returned
  rows) — label counts with `charactersTotal` as today, don't imply completeness.
- **Don't break other pages**: `CinematicInfo` (watch page) stays untouched; if refactoring shared
  bits (ReadMore/toggle buttons), extract into a shared module rather than duplicating.
- **Nav duplication invariant**: adding any nav entry must go through `lib/nav/config.ts`. (This
  task adds none.)

### 8. Explicitly unsupported by API (document in final report)

- Trailer / video / PV — no endpoint or field. Section omitted.
- Art gallery of key visuals/screenshots — `art[]` is poster + 1 thumbnail only. Omitted.
- Provider recommendations / "more like this" — `relations` always `[]`. Omitted.
- Per-episode thumbnails, durations, air dates, per-episode sub/dub flags — not returned.
- Server-side episode pagination — not supported; the full list (up to ~128 KB) is always returned.
- Real episode titles — upstream returns `"Episode N"` only.
- Age rating — `rating` is `0` for sampled titles (guard already hides it).
- Season/year (`premiered`) — always null; only the raw `aired` window exists.
