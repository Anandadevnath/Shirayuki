<div align="center">

```
                                    *
                              ·         ❄         ·
                          *                   *
                       ·       ❄                      ·
                  *         shirayuki              ❄          *
               ❄     ·  ❄  ·  ❄  ·  ❄  ·  ❄    ·     ❄
                    ╔══════════════════════════════════╗
                    ║   Sode no Shirayuki · v0.1.0     ║
                    ║   ─── snow & ice, dark-first ─── ║
                    ╚══════════════════════════════════╝
               ❄     ·  ❄  ·  ❄  ·  ❄  ·  ❄    ·     ❄
                  *         ·                ❄          *
                       ·        ❄                  ·
                          *                   ·
                              ·         ❄         ·
                                    *
```

### *「 白い雪の姫 」* — *the white-snow princess*

> A premium anime streaming platform, forged in frost.
> Built on the bleeding edge: **Next.js 15 · React 19 · Tailwind v4 · hls.js**.

</div>

❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄

## ✦ What is this?

**Shirayuki** is a dark-first, performance-obsessed anime streaming client. It replaces
a fragmented legacy app with **one player**, **one card**, **one nav** — and a
typed, validated, swappable data layer that never lets a flaky upstream crash a page.

The aesthetic is deliberate: **OKLCH frost tokens**, Geist + Zen Kaku Gothic, a drifting
snow layer, glass utilities, motion that respects `prefers-reduced-motion`. Cold, calm,
precise.

<details>
<summary><b>❄ Stack at a glance</b></summary>

| Layer        | Tech                                                  |
| ------------ | ----------------------------------------------------- |
| Framework    | Next.js 15 (App Router, RSC, streaming SSR)          |
| Language     | TypeScript 5.7 (strict)                               |
| UI           | React 19 · Tailwind v4 · `class-variance-authority`   |
| Motion       | `framer-motion` — respects reduced-motion             |
| Streaming    | `hls.js` + native HLS (Safari) · first-party proxy    |
| State        | `zustand` (prefs) · local-first progress              |
| Validation   | `zod` (raw provider → normalized model)               |
| Icons        | `lucide-react`                                        |
| Theming      | OKLCH frost tokens · custom snow layer                |

</details>

❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄

## ✦ Run

```bash
# 1. install
npm install

# 2. env (server-side only)
echo "API_BASE_URL=https://your-scraper.example" > .env.local

# 3. dev
npm run dev          # → http://localhost:3000

# prod
npm run build && npm start

# sanity
npm run typecheck
npm run lint
```

| Command            | What it does                                  |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Dev server with HMR                           |
| `npm run build`    | Production build                              |
| `npm start`        | Serve the production build                    |
| `npm run lint`     | Next.js + ESLint                              |
| `npm run typecheck`| `tsc --noEmit`                                |

## ✦ Deploy to Vercel

The project is **Vercel-ready out of the box**. `vercel.json` pins the
deployment region (Singapore by default — change to your nearest), framework
detection, and per-route function memory + duration for the HLS proxy
(`/api/stream`) and subtitle proxy (`/api/subtitle`).

**One environment variable is required** in Vercel Project Settings:

| Variable       | Required | Default                                         | Notes                                |
| -------------- | :------: | ----------------------------------------------- | ------------------------------------ |
| `API_BASE_URL` |    ✅    | `https://shirayuki-scrapper-api-v2.vercel.app`  | Upstream scraper. See `lib/providers`. |

`NODE_ENV` is set by Vercel automatically.

### How the proxy works on the edge

- `/api/stream` fetches upstream playlists, rewrites segment URIs back
  through itself, and streams bytes. `Cache-Control: s-maxage=60` lets Vercel's
  CDN serve rewritten playlists to repeat viewers without re-fetching upstream.
- `/api/subtitle` is a thin `.vtt` pass-through (CORS wrapper).
- `/api/suggest`, `/api/search-index`, `/api/schedule` are SSR-cached via
  Next's Data Cache (revalidate + tags), so Vercel's edge serves them warm.

### Vercel-specific notes

- **Image domains are locked** (`next.config.ts → images.remotePatterns`).
  Adding a new poster CDN means appending its hostname to `POSTER_HOSTS`.
- **`/watch/*` is `noindex`** by design (see `app/watch/[id]/[ep]/page.tsx`
  `generateMetadata`) — `/robots.txt` also disallows `/watch/` and `/api/`.
- The Player is **`ssr: false`**-loaded via `next/dynamic` in
  `components/player/PlayerLoader.tsx`, so the watch page never bundles
  `hls.js` into the initial HTML.

❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄

## ✦ Architecture — the frozen stream

```
  ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
  │  Upstream    │    │  /api/stream    │    │   Player (RSC)   │
  │  provider    │──▶ │  HLS proxy      │──▶ │  hls.js client   │
  │  (fragile)   │    │  • inject Ref.  │    │  • quality switch│
  │              │    │  • rewrite URI  │    │  • native fallback│
  └──────────────┘    └─────────────────┘    │  • PiP · shortcuts│
           │                                   └────────┬─────────┘
           │ validated by zod                           │
           ▼                                            ▼
  ┌──────────────┐                            ┌──────────────────┐
  │ lib/providers│ ── normalizes to ──▶       │  Progress store  │
  │ (swappable)  │     AnimeCardModel         │  (local, instant)│
  └──────────────┘                            └──────────────────┘
```

The **HLS proxy** is the keystone — it injects the `Referer` header the upstream
demands and rewrites playlist URIs so the client never has to know upstream is hostile.

❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄

## ✦ Feature matrix

| Capability                          | Status | Where                                 |
| ----------------------------------- | :----: | ------------------------------------- |
| Spotlight + rails + Continue Watching |   ✅   | `components/home/`                    |
| Anime details + JSON-LD             |   ✅   | `app/(browse)/anime/[id]/`            |
| Search · Category · Genre · A–Z     |   ✅   | `app/(browse)/...`                    |
| Schedule / Season Radar             |   ✅   | `app/(browse)/schedule/`              |
| Watch (HLS player)                  |   ✅   | `app/watch/[episodeId]/`              |
| Skip intro / outro                  |   ✅   | wired to `intro`/`outro` timings      |
| Auto-skip (remembered)              |   ✅   | `lib/stores/prefs.ts`                 |
| Sub/dub · server · vol · speed · AP |   ✅   | `lib/stores/prefs.ts`                 |
| Keyboard shortcuts · PiP            |   ✅   | `components/player/`                  |
| HLS proxy (Referer + URI rewrite)   |   ✅   | `app/api/stream/`                     |
| Quality switching + native fallback |   ✅   | `hls.js`                              |
| Continue Watching (local-first)     |   ✅   | `lib/progress/local.ts`               |
| ⌘K command palette                  |   ✅   | —                                     |
| SEO meta · JSON-LD · robots · PWA   |   ✅   | `app/`                                |
| Frost design system                 |   ✅   | `app/globals.css`                     |
| Accounts + cross-device sync        |   🔜   | Phase 4 · `docs/05-roadmap.md`         |
| AniList sync                        |   🔜   | Phase 5                               |
| Filler-marker data source           |   🔜   | Phase 6 (UI plumbed; data wired next)  |
| Seek-bar preview thumbnails         |   🔜   | Phase 5                               |

❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄

## ✦ Project shape

```
shirayuki-next/
├─ app/                   ← routes (App Router · RSC)
│  ├─ (browse)/           ← grouped: anime · search · schedule · …
│  ├─ api/stream/         ← HLS proxy (Referer + URI rewrite)
│  ├─ watch/[episodeId]/  ← the player
│  ├─ layout.tsx          ← fonts · theme · snow layer
│  ├─ globals.css         ← OKLCH frost tokens · glass · motion
│  ├─ manifest.ts · robots.ts
│  └─ error.tsx · loading.tsx · not-found.tsx
│
├─ components/
│  ├─ anime/ · common/ · details/ · home/ · layout/ · player/ · search/ · ui/
│  └─  → ONE AnimeCard · ONE Nav · ONE Player
│
├─ lib/
│  ├─ providers/          ← swappable · Zod-validated · normalized
│  ├─ api/                ← fetch wrapper · cache tags · retry · timeout
│  ├─ progress/           ← local-first Continue Watching
│  ├─ stores/             ← zustand: prefs
│  ├─ utils/ · watchlist/
│  └─ (never crashes a page — Result<T,E> wrapper)
│
└─ docs/                  ← the full plan: 00–05
```

❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄

## ✦ Design tenets

- **One of each.** One card. One nav. One player. Variants, not duplicates.
- **Types first.** Raw upstream is hostile and ephemeral — validate with `zod`,
  normalize to `AnimeCardModel`, then the rest of the app sees a clean shape.
- **The page never crashes.** The provider returns `Result<T, E>`; render the empty
  state, never a stack trace.
- **Local-first when possible.** Continue Watching lives in `localStorage` and
  hydrates instantly — no auth required.
- **Motion with restraint.** Drift, fade, settle. Respect `prefers-reduced-motion`.
- **Dark-first.** OKLCH frost tokens, never pure `#000`.

❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄

## ✦ Caveats (read these)

- The default upstream provider (`hianime.ad` mirror) is **fragile** and serves
  **ephemeral** stream tokens. Sources are fetched `no-store` and played immediately.
  The provider interface is swappable — `lib/providers/` — so a saner backend
  drops in without touching the UI.
- `/watch/*` is **`noindex`** by design.
- Episode `isFiller` is plumbed through the UI; the data source (AnimeFillerList)
  is the next thing wired in.

❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄

## ✦ Roadmap

| Phase | Theme                                                             |
| :---: | ----------------------------------------------------------------- |
|  0–3  | **Shipped** — design system, data layer, player, browse, watch. |
|   4   | Accounts · cross-device sync · watchlist server-side             |
|   5   | AniList sync · seek-bar preview thumbs · advanced filters        |
|   6   | Filler markers · character/studio explorers · mood discovery      |

Full plan: [`docs/`](./docs).

❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄ · ❄

<div align="center">

```
        ·    ❄    ·    ❄    ·    ❄    ·    ❄    ·    ❄    ·
                          ───  white. pure. precise.  ───
        ·    ❄    ·    ❄    ·    ❄    ·    ❄    ·    ❄    ·
```

*Built with ❄ in the cold.*

</div>