<!-- ═══════════════════════════════════════════════════════════════════════════════
     SHIRAYUKI · README
     Cold. Calm. Precise.
     ════════════════════════════════════════════════════════════════════════════ -->

<div align="center">

<!-- HERO ──────────────────────────────────────────────────────────────────── -->
<img src="public/logos/readme-mark.png" alt="Shirayuki" width="140" /><br/>
<img src="public/logos/readme-wordmark.png" alt="Shirayuki" width="300" />

<em>❄ 白い雪の姫 — the white-snow princess.</em>

A **dark-first, performance-obsessed** anime streaming client.<br/>
Forged in frost. One player. One card. One nav. No stack traces.

<!-- BADGES ────────────────────────────────────────────────────────────────── -->
<p>
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js-15-000?logo=nextdotjs&style=for-the-badge" />
  <img alt="React 19" src="https://img.shields.io/badge/React-19-149eca?logo=react&style=for-the-badge" />
  <img alt="Tailwind v4" src="https://img.shields.io/badge/Tailwind-v4-38bdf8&logo=tailwindcss&style=for-the-badge" />
  <img alt="TypeScript 5.7" src="https://img.shields.io/badge/TypeScript-5.7_strict-3178c6&logo=typescript&style=for-the-badge" />
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-ready-000?logo=vercel&style=for-the-badge" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-22d3ee?style=for-the-badge" />
</p>

<p>
  <a href="#-quick-start"><b>Quick start</b></a> ·
  <a href="#-deploy-to-vercel"><b>Deploy</b></a> ·
  <a href="#-architecture"><b>Architecture</b></a> ·
  <a href="#-features"><b>Features</b></a> ·
  <a href="#-roadmap"><b>Roadmap</b></a>
</p>

</div>

---

<!-- TABLE OF CONTENTS ───────────────────────────────────────────────────── -->
## 📑 Contents

- [❄ What is Shirayuki?](#-what-is-shirayuki)
- [❄ Quick start](#-quick-start)
- [❄ Deploy to Vercel](#-deploy-to-vercel)
- [❄ Architecture](#-architecture)
- [❄ Performance & resilience](#-performance--resilience)
- [❄ Features](#-features)
- [❄ Project structure](#-project-structure)
- [❄ Design tenets](#-design-tenets)
- [❄ Tech stack](#-tech-stack)
- [❄ Caveats](#-caveats)
- [❄ Roadmap](#-roadmap)
- [❄ Contributing](#-contributing)
- [❄ License](#-license)

---

<!-- WHAT IS THIS ────────────────────────────────────────────────────────── -->
## ❄ What is Shirayuki?

**Shirayuki** is a dark-first, performance-obsessed anime streaming client built
on Next.js 15 (App Router, React Server Components). It replaces a fragmented
legacy app with **one player**, **one card**, **one nav** — and a typed,
validated, swappable data layer that never lets a flaky upstream crash a page.

The aesthetic is deliberate:

> **OKLCH frost tokens** · Geist + Zen Kaku Gothic · drifting snow layer · glass utilities · motion that respects `prefers-reduced-motion`.
> Cold. Calm. Precise.

```text
   ❄  cold                ❄  calm                ❄  precise
   ────────                ────────                ───────────
   dark-first              motion with             one card ·
   OKLCH tokens            restraint               one nav ·
                                                   one player
```

---

<!-- QUICK START ─────────────────────────────────────────────────────────── -->
## ❄ Quick start

**Prerequisites:** Node.js **24.x** (`package.json → engines`) · npm (the repo
ships `package-lock.json`; npm is the supported package manager).

```bash
# 1. install
npm install

# 2. env — SERVER-SIDE ONLY, never prefix with NEXT_PUBLIC_
#    Strict KEY=VALUE form; no trailing slash on the URL.
echo "API_BASE_URL=https://shirayuki-anime-api-ruby.vercel.app" > .env

# 3. dev
npm run dev          # → http://localhost:3000
```

### NPM scripts

| Command             | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Dev server with HMR                                       |
| `npm run build`     | Production build                                          |
| `npm start`         | Serve the production build                                |
| `npm run typecheck` | `tsc --noEmit` — **the real verification gate**           |
| `npm test`          | `node --test` over `lib/**` and `app/**` (not jest/vitest) |

> **`npm run lint` does not work.** It runs `next lint`, but ESLint is not a
> dependency and no config exists, so it hangs on an interactive setup prompt.
> Use `npm run typecheck` (and `npm test`) to verify changes.

Run a single test file:

```bash
node --test lib/api/proxy-guard.test.ts
```

---

<!-- DEPLOY ──────────────────────────────────────────────────────────────── -->
## ❄ Deploy to Vercel

The project is **Vercel-ready out of the box**. `next.config.ts` pins the
deployment region (Singapore by default — change to your nearest), compression,
image optimization, security headers/CSP, and per-route function memory +
duration for the proxies.

**One environment variable is required** in Vercel Project Settings:

| Variable       | Required | Default                                        | Notes                                  |
| -------------- | :------: | ---------------------------------------------- | -------------------------------------- |
| `API_BASE_URL` |    ✅    | `https://shirayuki-anime-api-ruby.vercel.app` | Upstream scraper. See `lib/providers`. |

`API_BASE_URL` must be **strict `KEY=VALUE`** and must **not** have a trailing
slash (the client prepends `/api/v2/...`; a trailing slash double-slashes and
308-redirects). `NODE_ENV` is set by Vercel automatically.

### API routes & caching

| Route               | Purpose                                              | Cache policy |
| ------------------- | ---------------------------------------------------- | ------------ |
| `/api/stream`       | HLS proxy: injects upstream `Referer`, rewrites segment URIs back through itself | `s-maxage=60` + SWR on the rewritten playlist; segments streamed through |
| `/api/subtitle`     | `.vtt` pass-through (CORS wrapper)                   | per upstream |
| `/api/sources`      | Client-side source resolver for the player's mid-playback failover loop | `no-store` (links are short-lived/expiring) |
| `/api/suggest`      | Nav search suggestions                               | SSR Data Cache (revalidate + tags) |
| `/api/search-index` | Tiny deduped catalogue slice for ⌘K palette          | `s-maxage=300` + SWR |

There is **no `/api/schedule` route** — the schedule is fetched server-side in
the page (`app/(browse)/schedule/page.tsx`).

Everything else (home, detail, schedule) is fetched in **React Server
Components** via `lib/api`, wrapped in `Result<T,E>` so a provider failure
renders an empty/error state instead of a stack trace.

### Vercel-specific notes

- **Poster hosts are locked** (`next.config.ts → POSTER_HOSTS` → `images.remotePatterns`).
  Adding a new poster CDN means appending its hostname there (exact +
  `**.` wildcard patterns are generated). Un-allowlisted hosts throw
  `next-image-unconfigured-host` at runtime.
- **`<Image>` `quality` values must be in the allowlist** `[50, 70, 75, 80, 85, 90]`;
  any other value gets a 400 from the optimizer and silently breaks posters.
  Don't remove `75` (the default-quality value).
- **`/watch/*` is `noindex`** by design (`generateMetadata`), and
  `/robots.txt` disallows `/watch/` and `/api/`.
- The Player is loaded **`ssr: false`** via `next/dynamic` in
  `components/player/PlayerLoader.tsx`, so `hls.js` stays out of the initial
  page bundle.
- `/api/stream` and `/api/subtitle` are **SSRF-guarded** by
  `lib/api/proxy-guard.ts` (scheme, public host/IP, DNS re-resolution on every
  redirect hop, plus a bounded fetch timeout). Don't relax it; behaviour is
  covered by `lib/api/proxy-guard.test.ts`.

---

<!-- ARCHITECTURE ────────────────────────────────────────────────────────── -->
## ❄ Architecture — the frozen stream

```
  ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
  │  Upstream    │    │  /api/stream    │    │   Player         │
  │  provider    │──▶ │  HLS proxy      │──▶ │  hls.js client   │
  │  (fragile)   │    │  • inject Ref.  │    │  • quality switch│
  │              │    │  • rewrite URI  │    │  • native fallback│
  └──────────────┘    └─────────────────┘    │  • PiP · shortcuts│
           │                                   └────────┬─────────┘
           │ validated by zod                          │
           ▼                                           ▼
  ┌──────────────┐                            ┌──────────────────┐
  │ lib/providers│ ── normalizes to ──▶       │  Progress store  │
  │ (swappable)  │     AnimeCardModel         │  (local, instant)│
  └──────────────┘                            └──────────────────┘
```

The **HLS proxy** is the keystone — it injects the `Referer` header the
upstream demands and rewrites playlist URIs so the client never has to know
upstream is hostile. `/api/sources` exists only for the player's **mid-playback
failover** (so a dying source can swap servers without a page reload).

---

<!-- PERFORMANCE ─────────────────────────────────────────────────────────── -->
## ❄ Performance & resilience

- **Concurrent server fetches.** Independent requests run in parallel, with a
  **required vs optional** strategy: the home board waits for its required
  `getHome()` payload while the optional schedule streams in its own Suspense
  island; detail/watch start all independent calls together. Genuine sequential
  dependencies (server failover) stay sequential, each with a `withTimeout`
  bound so nothing can hang.
- **Shared request layer** (`lib/api`): typed `Result<T,E>`, request
  deduplication, timeouts via `AbortController`, bounded retries with
  exponential backoff + jitter, `Retry-After` respect, zod validation of every
  upstream response, and graceful fallbacks for malformed data.
- **Caching**: time-based revalidation + tags for catalogue metadata; `no-store`
  for expiring stream URLs; CDN `s-maxage` + SWR for proxy playlists.
- **Skeletons coordinate with content.** Grids and rails render their poster
  frames from the first paint (no opacity‑0 reveal wrapper hiding the
  placeholders); images cross-fade in load-driven via `SmartImage`. The
  Spotlight hero renders its copy immediately (it's text) and only the key art
  waits for its decode, so the hero never lags the rails.
- **Player reliability**: bounded fatal-error recovery (`lib/player/recovery.ts`),
  a startup watchdog, mid-playback server failover with timestamp preservation,
  and a terminal retry surface instead of an infinite "Loading…".
- **Image loading**: above-the-fold hero prioritized; below-the-fold posters
  lazy-loaded; stable aspect ratios (`aspect-[3/4]` cards, full-bleed hero) to
  avoid layout shift.

---

<!-- FEATURES ────────────────────────────────────────────────────────────── -->
## ❄ Features

| Capability                            | Status | Where                              |
| ------------------------------------- | :----: | ---------------------------------- |
| Spotlight + rails + Continue Watching |   ✅   | `components/home/`                 |
| Anime details + JSON-LD               |   ✅   | `app/anime/[id]/`                  |
| Search · Category · Genre · Browse all|   ✅   | `app/(browse)/...`                 |
| Schedule / Season Radar               |   ✅   | `app/(browse)/schedule/`           |
| Watch (HLS player)                    |   ✅   | `app/watch/[id]/[ep]/`             |
| Skip intro / outro                    |   ✅   | wired to `intro`/`outro` timings   |
| Auto-skip (remembered)                |   ✅   | `lib/stores/prefs.ts`              |
| Sub/dub · server · volume · speed     |   ✅   | `lib/stores/prefs.ts`              |
| Keyboard shortcuts · PiP               |   ✅   | `components/player/`               |
| Player recovery + server failover     |   ✅   | `lib/player/recovery.ts` · `/api/sources` |
| HLS proxy (Referer + URI rewrite)     |   ✅   | `app/api/stream/`                  |
| Quality switching + native fallback   |   ✅   | `hls.js`                           |
| Continue Watching (local-first)       |   ✅   | `lib/progress/local.ts`            |
| Watchlist                             |   ✅   | `lib/watchlist/local.ts`           |
| ⌘K command palette                    |   ✅   | `components/search/`               |
| SEO meta · JSON-LD · robots · PWA     |   ✅   | `app/`                             |
| Frost design system                   |   ✅   | `app/globals.css`                  |
| Accounts + cross-device sync          |   🔜   | `docs/05-roadmap.md`               |
| AniList sync                          |   🔜   | Phase 5                            |
| Filler-marker data source             |   🔜   | Phase 6 (UI plumbed; data wired)   |
| Seek-bar preview thumbnails           |   🔜   | Phase 5                            |

---

<!-- PROJECT STRUCTURE ───────────────────────────────────────────────────── -->
## ❄ Project structure

```
shirayuki/
├─ app/                   ← routes (App Router · RSC)
│  ├─ (browse)/           ← grouped: az · category · genre · schedule · search
│  ├─ anime/[id]/         ← detail page (+ JSON-LD)
│  ├─ watch/[id]/[ep]/    ← the player
│  ├─ watchlist/          ← local watchlist page
│  ├─ api/                ← stream · subtitle · sources · suggest · search-index
│  ├─ layout.tsx          ← fonts · theme · snow layer
│  ├─ globals.css         ← OKLCH frost tokens · glass · motion
│  └─ manifest.ts · robots.ts · error.tsx · loading.tsx · not-found.tsx
│
├─ components/
│  ├─ anime/ · common/ · details/ · home/ · layout/ · player/ · schedule/ · search/ · ui/
│  └─  → ONE AnimeCard · ONE Nav · ONE Player (variants, not duplicates)
│
├─ lib/
│  ├─ api/                ← facade · fetch wrapper · retry · dedupe · concurrency · proxy-guard
│  ├─ providers/          ← swappable · Zod-validated · normalized (hianime)
│  ├─ player/             ← bounded recovery policy
│  ├─ progress/           ← local-first Continue Watching
│  ├─ stores/             ← zustand: prefs
│  ├─ subtitle/           ← .vtt helpers
│  ├─ storage/ · utils/ · watchlist/
│  └─ (never crashes a page — Result<T,E> wrapper)
│
├─ public/logos/          ← brand mark · wordmark
└─ docs/                  ← the full plan: 00–05
```

Path alias: `@/*` maps to the repo root (no `src/` directory).

---

<!-- DESIGN TENETS ───────────────────────────────────────────────────────── -->
## ❄ Design tenets

- **One of each.** One card. One nav. One player. Variants, not duplicates.
- **Types first.** Raw upstream is hostile and ephemeral — validate with
  `zod`, normalize to `AnimeCardModel`, then the rest of the app sees a
  clean shape.
- **The page never crashes.** The provider returns `Result<T, E>`; render
  the empty state, never a stack trace.
- **Local-first when possible.** Continue Watching lives in `localStorage`
  and hydrates instantly — no auth required.
- **Motion with restraint.** Drift, fade, settle. Respect
  `prefers-reduced-motion`.
- **Dark-first.** OKLCH frost tokens, never pure `#000`.

---

<!-- TECH STACK ──────────────────────────────────────────────────────────── -->
## ❄ Tech stack

| Layer        | Tech                                                |
| ------------ | --------------------------------------------------- |
| Framework    | Next.js 15 (App Router · RSC · streaming SSR)       |
| Language     | TypeScript 5.7 (strict)                             |
| UI           | React 19 · Tailwind v4                              |
| Motion       | CSS transitions/keyframes · respects `prefers-reduced-motion` |
| Streaming    | `hls.js` + native HLS (Safari) · first-party proxy  |
| State        | `zustand` (prefs) · local-first progress            |
| Validation   | `zod` (raw provider → normalized model)             |
| Icons        | `lucide-react`                                      |
| Theming      | OKLCH frost tokens · custom snow layer              |

---

<!-- CAVEATS ─────────────────────────────────────────────────────────────── -->
## ❄ Caveats (read these)

- The default upstream provider is a `hianime` mirror — **fragile** and serving
  **ephemeral** stream tokens. Sources are fetched `no-store` and played
  immediately. The provider interface is swappable (`lib/providers/`) so a saner
  backend drops in without touching the UI.
- **Never call `lib/providers/hianime` directly from components** — go through
  the `lib/api` facade (its exports are wrapped in React `cache()`, so a page +
  its `generateMetadata` fetch once).
- `/watch/*` is **`noindex`** by design.
- Episode `isFiller` is plumbed through the UI; the data source
  (AnimeFillerList) is the next thing wired in.
- **The site streams content from third-party providers and is intended for
  educational/personal use.** Respect the upstream providers' terms and rate
  limits.

---

<!-- ROADMAP ─────────────────────────────────────────────────────────────── -->
## ❄ Roadmap

| Phase | Theme                                                              |
| :---: | ------------------------------------------------------------------ |
|  0–3  | **Shipped** — design system, data layer, player, browse, watch.   |
|  4   | Accounts · cross-device sync · watchlist server-side              |
|  5   | AniList sync · seek-bar preview thumbs · advanced filters         |
|  6   | Filler markers · character/studio explorers · mood discovery       |

Full plan: [`docs/`](./docs).

---

<!-- CONTRIBUTING ────────────────────────────────────────────────────────── -->
## ❄ Contributing

PRs welcome. Keep it small and focused.

```bash
git checkout -b feat/your-thing
npm install
npm run dev
# make it good
npm run typecheck && npm test
git commit -m "feat: your thing"
git push origin feat/your-thing
```

---

<!-- LICENSE ─────────────────────────────────────────────────────────────── -->
## ❄ License

[MIT](./LICENSE.md) © Shirayuki contributors.

---

<div align="center">

<img src="public/logos/shirayuki2.png" alt="shirayuki" width="64" />

<br/><br/>

<sub><em>white. pure. precise.</em></sub>
<br/>
<sub>Built with ❄ in the cold.</sub>

</div>
