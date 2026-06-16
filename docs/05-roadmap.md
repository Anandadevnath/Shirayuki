# 05 — Architecture, Features & Implementation Roadmap

Next.js (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Motion · RSC + Server Actions.

---

## §1 — Folder structure

```
shirayuki-next/
├─ app/
│  ├─ layout.tsx                 # root: fonts, theme, nav, snow layer, toaster
│  ├─ page.tsx                   # Home (RSC)
│  ├─ (browse)/
│  │  ├─ search/page.tsx         # ?q= ?genre= ?type= (URL state)
│  │  ├─ az/[letter]/page.tsx
│  │  ├─ genre/[id]/page.tsx
│  │  ├─ category/[id]/page.tsx
│  │  ├─ producer/[id]/page.tsx
│  │  └─ schedule/page.tsx       # Season Radar
│  ├─ anime/[id]/page.tsx        # details (RSC, generateMetadata)
│  ├─ watch/[id]/[ep]/page.tsx   # player (RSC shell + client player island)
│  ├─ (account)/
│  │  ├─ profile/page.tsx
│  │  ├─ library/page.tsx        # continue watching, lists, history
│  │  └─ settings/page.tsx
│  ├─ api/
│  │  ├─ stream/route.ts         # HLS proxy (Node runtime, streaming)
│  │  ├─ subtitle/route.ts       # vtt proxy
│  │  ├─ progress/route.ts       # sync endpoints
│  │  └─ auth/[...nextauth]/route.ts
│  ├─ opengraph-image.tsx        # dynamic OG
│  ├─ sitemap.ts  ├─ robots.ts  ├─ manifest.ts
│  ├─ error.tsx   ├─ not-found.tsx  ├─ loading.tsx
├─ components/
│  ├─ ui/                        # shadcn primitives (skinned to tokens)
│  ├─ anime/ AnimeCard.tsx Rail.tsx Badges.tsx
│  ├─ home/ Spotlight.tsx  …
│  ├─ details/ …
│  ├─ player/ Player.tsx Controls.tsx SkipButton.tsx SubtitleSheet.tsx QualityMenu.tsx
│  ├─ search/ CommandPalette.tsx SearchResults.tsx
│  ├─ layout/ Nav.tsx Footer.tsx SnowLayer.tsx
│  └─ common/ EmptyState.tsx ErrorState.tsx
├─ lib/
│  ├─ providers/                 # see doc 03 §5 (swappable provider + Zod)
│  ├─ api/                       # getHome/getAnime/getEpisodes/getServers/getSources
│  ├─ player/ hls.ts skip.ts thumbnails.ts
│  ├─ progress/ local.ts sync.ts  # IndexedDB local-first + bg sync
│  ├─ stores/ player.ts prefs.ts  # Zustand (client-only state)
│  ├─ filler/ aniFiller.ts         # canon/filler markers
│  └─ utils/ cn.ts format.ts
├─ hooks/  styles/globals.css  types/
```

## §2 — Component architecture principles

- **Server Components by default.** Pages and data sections are RSC. Only true interactivity becomes a client island: the **player**, command palette, carousels with controls, forms, settings toggles, the snow layer.
- **Islands, not SPA.** Navigations are server-rendered + streamed; no global client re-fetch waterfall.
- **One of each.** One `AnimeCard` (variants), one `Player`, one `Nav`. (Kills the old app's 5 cards / 2 players / 2 navs.)
- **Data down via props from RSC; client state via Zustand** (player + prefs only) + **URL state** for filters/search/pagination (shareable, back-button correct).
- **Suspense boundaries per section** with skeletons → progressive reveal, no full-page spinner.
- **Error boundaries per route segment** (`error.tsx`) with retry + alternate-server actions.

## §3 — Feature prioritization (MoSCoW + phases)

**P0 — Must (MVP, Phases 1–3)**
Home · Search + suggestions · `⌘K` palette · Anime details · Episode list (virtualized, **filler markers**) · **Working player (hls.js + proxy)** · sub/dub + server switch (remembered) · **skip intro/outro (from API timings)** · autoplay next · **Continue Watching (local-first)** · resume prompt · A–Z/Genre/Category/Producer browse · Schedule · responsive + dark · core a11y · SEO metadata.

**P1 — Should (Phases 4–5)**
Accounts (Auth.js) + cross-device progress sync · Library (history, lists, **custom collections**) · **AniList sync** · seek-bar **preview thumbnails** · PiP + miniplayer · subtitle styling · playback speed memory · advanced search filters · Season Radar (interactive calendar + airing countdowns) · "mark as watched."

**P2 — Could (Phase 6+)**
Mood/vibe discovery · character / studio / VA explorers · MAL sync · achievements · personalized homepage (signals-based rails) · spoiler-safe mode.

**P3 — Won't (now)**
Watch party · offline download · comments/social feed · AI chat discovery. (Revisit after retention proven.)

**Differentiators to land early (cheap, high-love):** filler markers, skip-from-API-timings, remembered prefs, trustworthy Continue Watching, `⌘K`, transparent server fallback. (See [02](./02-market-research.md) §5.)

## §4 — Key user flows

**Discover → Watch**
`Home → click card → /anime/[id] (details) → "Watch now"/episode → /watch/[id]/[ep] → server auto-picked (pref) → sources fetched → proxy-rewrite → hls.js attaches → resume prompt → watch → skip intro → autoplay next → progress saved (local instant + bg sync)`

**Search**
`⌘K anywhere → type → debounced suggestions (posters) → Enter → /search?q= results (filters in URL) → card → details`

**Continue Watching**
`Any return visit → Home top rail "Continue Watching" (from IndexedDB, instant, logged-out OK) → resume exact position → mark complete → next-up surfaces`

**Server failure (the trust flow)**
`Sources fail / segment errors → toast "HD-1 unavailable, switched to HD-2" → auto-failover → if all fail, ErrorState with manual server list + report, never a dead screen`

**Account + sync**
`Sign in (credentials or AniList OAuth) → local progress merges to server (last-writer-wins by updatedAt) → AniList list auto-updates on episode complete`

## §5 — Wireframe recommendations (per page)

- **Home:** glass nav → **Spotlight** hero (full-bleed cover, gradient scrim, title/jname, sub·dub·type chips, "Watch"/"Details", airing pip) → **Continue Watching** rail (if any) → Trending → Top Airing → Latest Episodes → Most Popular → Season Radar peek → Footer. Rails snap-scroll, lazy.
- **Details:** blurred cover backdrop + sharp poster card → title block (display font) + meta chips + score → primary "Watch" / secondary "Add to list" (functional!) → synopsis (clamp + expand) → tabs: Episodes (virtualized, ranges, filler/watched markers) · Related · Recommended · Characters. JSON-LD `TVSeries`.
- **Watch:** player dominant (16:9, `xl` radius, glass controls) → under it: episode strip (next-up emphasized) + sub/dub & server controls → right/below: episode list + recommended. Theater + fullscreen + PiP. Minimal chrome.
- **Search:** sticky search field + filter chips (genre/type/status/sort, all URL-synced) → responsive poster grid → infinite scroll or pagination → empty/typing states.
- **Schedule (Season Radar):** day tabs + user timezone → time-sorted airing rows with **countdown to next episode** → "notify me" (P1). Calm, calendar-like.
- **Library:** Continue Watching · History (filter by title/time, à la Miruro) · Lists/Collections · stats.

## §6 — Performance strategy (target: Lighthouse ≥95, green CWV)

- **RSC + streaming SSR + Suspense** → fast TTFB, progressive paint, tiny client JS. The player and palette are the only heavy islands; lazy-load the player island.
- **`next/image`** for every poster/cover; `remotePatterns` for `cdn.anizara.store` (+ embed thumb hosts); responsive `sizes`, `priority` only on spotlight LCP image, blur placeholders.
- **`next/font`** self-host (Geist + Zen Kaku + mono); `display: swap`; subset → zero CLS, no font flash.
- **Caching (doc 03 §5):** ISR/revalidate for catalog surfaces + tags; `no-store` for sources; Upstash/edge cache for the proxy.
- **Route-level code splitting** (automatic) + dynamic import for player, command palette, charts.
- **hls.js** dynamically imported only on watch pages; prefer native HLS on Safari.
- **Virtualize** long episode lists / infinite grids.
- **Budget:** initial route JS < 130KB gz; LCP < 2.0s mobile; CLS < 0.05; INP < 200ms. Track with bundle analyzer + `@vercel/speed-insights`.
- **Edge runtime** for read pages; **prefetch** on link hover; **PPR** (partial prerender) for details/home shells if stable.

## §7 — SEO strategy

- **Dynamic metadata** per anime/episode via `generateMetadata` (title, description, canonical, OG/Twitter with poster).
- **Dynamic OG images** (`opengraph-image.tsx`) — branded snow frame + poster + title.
- **JSON-LD:** `TVSeries`/`Movie` on details, `VideoObject` + `BreadcrumbList` on watch, `WebSite` + `SearchAction` (sitelinks search box) on home.
- **`sitemap.ts`** (top/trending/seasonal anime, dynamic) + **`robots.ts`** + **`manifest.ts`** (PWA).
- **Semantic URLs** already provided by the API ids (`/anime/one-punch-man`). Stable, human-readable.
- **SSR content** (synopsis, episodes, recommendations) is in the HTML → indexable, unlike the old SPA.
- Pragmatic note: streaming sites have ToS/DMCA exposure — index discovery pages, consider `noindex` on raw watch pages if needed.

## §8 — Accessibility strategy (target WCAG 2.2 AA)

- **Semantic landmarks** (`header/nav/main/aside/footer`), one `h1`/page, ordered headings (old app: div soup → fix).
- **Keyboard:** full nav, visible `:focus-visible` frost ring, focus trap + restore on modals/sheets/palette, `Esc` closes, roving tabindex on rails.
- **Player a11y:** all controls are real buttons with `aria-label`; slider `aria-vals`; captions toggle; skip buttons announced; shortcuts + `?` help overlay; captions support subtitle styling.
- **Media:** every image meaningful `alt` (title), decorative `alt=""`; captions/subtitles first-class.
- **Motion:** **everything** honors `prefers-reduced-motion` (snow off, transitions reduced) — the old app honored none.
- **Forms:** real `<label>`s, `aria-describedby` errors, `aria-live` for async status/toasts.
- **Contrast:** tokens meet AA (snow/base ~14:1, muted ~6:1); never rely on color alone (pair filler/airing markers with icon+text).
- **Testing:** axe + Lighthouse a11y in CI; manual keyboard + screen-reader pass on Home/Details/Watch.

## §9 — Implementation roadmap (phased)

**Phase 0 — Foundation (½ week)**
`create-next-app` (TS, App Router, Tailwind v4) · install shadcn + Motion · wire `@theme` tokens + fonts (doc 04) · base layout, nav, footer, snow layer · CI (lint, typecheck, axe, Lighthouse). *Use the `tailwind-4-docs` + `web-design-guidelines` skills here.*

**Phase 1 — Data + provider (1 week)**
`lib/providers` with Zod schemas + mappers + normalized models · `lib/api` fetchers w/ caching/tags · resilience (retry/timeout/Result) · typed throughout. Unit-test mappers against the real shapes in [03](./03-api-architecture.md) §2.

**Phase 2 — Browse surfaces (1–1.5 weeks)**
Home (spotlight + rails) · Details · Search + suggestions + `⌘K` · A–Z/Genre/Category/Producer · Schedule. RSC + Suspense skeletons. One `AnimeCard`. Mobile-first.

**Phase 3 — The Player (1.5–2 weeks, the crown jewel)**
HLS proxy Route Handler (+ subtitle proxy) · `Player` island: **hls.js** w/ quality switching, native-HLS fallback · server/sub-dub switch + auto-failover · **skip intro/outro from API timings** + auto-skip memory · subtitles + styling · keyboard + `?` overlay · resume prompt · autoplay next · **Continue Watching (IndexedDB) local-first** · **filler markers**. *This phase fixes the old app's #1 and #2 bugs.*

**Phase 4 — Accounts + sync (1 week)**
Auth.js (credentials → existing backend) · progress sync (local↔server, LWW) · Library (history/lists/collections) · functional "Add to list."

**Phase 5 — Premium polish (1–1.5 weeks)**
**AniList OAuth + list sync** · seek-bar **preview thumbnails** · PiP/miniplayer · advanced filters · Season Radar countdowns · OG images, JSON-LD, sitemap · perf pass to 95+ · full a11y pass.

**Phase 6 — Differentiators (ongoing)**
Mood discovery · character/studio/VA explorers · personalized rails · achievements · spoiler-safe mode · (later) watch party, offline.

---

### Definition of done (per feature)
Typed + Zod-validated · RSC where possible · mobile-first responsive · loading/empty/error states · keyboard + reduced-motion · tokens-only styling · no dead buttons. **If it can't be done well, it doesn't ship.**
