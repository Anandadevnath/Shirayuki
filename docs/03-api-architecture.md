# 03 — Scraper API Analysis & Next.js Consumption Strategy

**Provider:** `https://shirayuki-scrapper-api-v2.vercel.app` — scrapes HiAnime mirror `hianime.ad` (HiAnime/AnimeX + MegaPlay embeds). All responses verified live on 2026-06-16.

> ⚠️ **Provider is fragile.** HiAnime shut down March 2026; `hianime.ad` is a mirror that *will* rotate or die. Design for a **swappable provider** behind one interface, cache aggressively, and never let a provider failure produce a dead-end error.

---

## §1 — Endpoints (all under `/api/v2/hianime`)

| Workflow | Endpoint | Notes |
|---|---|---|
| Home | `GET /home` | spotlight, trending, topAiring, latestEpisodes, top10, mostPopular |
| Search | `GET /search?q=&page=` | `pagination{currentPage,totalPages,hasNextPage}` + `results[]` |
| Suggestions | `GET /search/suggestion?q=` | lightweight, for the search box |
| Advanced search | `GET /search/advanced?q=&genres=&type=&page=` | filters |
| Details | `GET /anime/{id}` | nullable-heavy; invalid id → all-null but `success:true` |
| Episodes | `GET /anime/{id}/episodes` | `totalEpisodes`, `ranges[]`, `episodes[]` |
| Category | `GET /category/{id}?page=` | e.g. `most-popular` (31 pages), `most-favorite`, etc. |
| Genre | `GET /genre/{id}?page=` | |
| Producer | `GET /producer/{id}?page=` | |
| A–Z | `GET /azlist/{letter}?page=` | |
| Schedule | `GET /schedule?date=YYYY-MM-DD&timezone=` | `results[]` w/ `airingTime`, `episodeNumber` |
| **Servers** | `GET /episode/servers?animeEpisodeId={id/ep-N}&ep=N` | `servers{sub[],dub[],hsub[]}`; each `{name,nameId,embed,tab}` |
| **Sources** | `GET /episode/sources?animeEpisodeId=&ep=&server=&category=` | `sources[]{m3u8,referer,...}`, `tracks[]`, `intro{}`, `outro{}`, `malId` |

Plus `anikuro/*` (adult) and the **backend** (`/api/auth/*`, `/api/user/*`, `/api/progress/*`, `/api/profile/pfp*`) — keep for accounts.

## §2 — Real data shapes (verified)

```jsonc
// GET /home → data.spotlight[]
{ "rank":1, "id":"daemons-of-the-shadow-realm", "title":"…", "jname":"…", "ename":"…",
  "description":"…", "poster":"https://cdn.anizara.store/…webp",
  "episodes":{"sub":11,"dub":9}, "type":"TV", "quality":"HD" }

// GET /anime/{id} → data
{ "id":"one-punch-man", "title":"One Punch Man", "jname":"…", "ename":"…",
  "description":"…", "poster":"…", "cover":"…",
  "stats":{"pg":"R","type":"TV","year":2015,"sub":12,"dub":12},
  "info":{ /* japanese, aliases, etc. — keys vary */ },
  "watch":{"href":null,"url":null}, "recommended":[/* cards */] }

// GET /anime/{id}/episodes → data
{ "totalEpisodes":12, "ranges":["001-012"],
  "episodes":[{"number":1,"title":"…","episodeId":"one-punch-man/ep-1","href":"…","url":"…"}] }

// GET /episode/servers → data.servers
{ "sub":[{"name":"HD-1","nameId":"hd-1","embed":"https://vibeplayer.site/…?sub=…vtt","tab":"tab_1"},
         {"name":"HD-2","nameId":"hd-2",…},{"name":"StreamHG","nameId":"streamhg",…}],
  "dub":[], "hsub":[] }

// GET /episode/sources → data
{ "malId":35062,
  "sources":[{"m3u8":"https://vibeplayer.site/public/stream/…/master.m3u8",
              "type":"m3u8","quality":null,
              "referer":"https://vibeplayer.site/…?sub=…vtt",
              "server":"hd-1","category":"sub","embed":"…"}],
  "tracks":[{"file":"https://cdn.anizara.store/subtitles/…vtt","label":"English",
             "kind":"captions","default":true,"forced":false}],
  "intro":{"start":5.555,"end":95.555}, "outro":{"start":1342.913,"end":1449} }
```

**Critical observations**
- `success:true` does **not** mean valid data — invalid ids return all-`null`. **Validate with Zod, treat null fields as "missing," 404 the page when core fields are null.**
- **Older titles often have empty `servers` / no sources** ("No SUB servers available"); currently-airing titles resolve fully. The UI must handle "no playable server" as a first-class state.
- `intro`/`outro` timings come **free** from `sources` → wire skip buttons directly to them.
- `tracks[]` are external `.vtt` on `cdn.anizara.store`; `m3u8` is on rotating embed hosts (`vibeplayer.site`, `bibiemb.xyz`, `otakuhg.site`) → **both need proxying** (CORS + `Referer`).
- Field names drift across endpoints (`name`/`title`, `episodes{sub,dub}` vs flat) → normalize into **one internal model** at the boundary.

## §3 — Streaming workflow

```
/anime/{id}            → details (poster, meta, recommended)
/anime/{id}/episodes   → episode list (number, title, episodeId)
   ↓ user picks episode + sub|dub
/episode/servers       → server list per category (embed URLs)
   ↓ pick preferred server (remembered) else first available
/episode/sources       → m3u8 + tracks + intro/outro
   ↓ rewrite m3u8 + vtt through proxy (Referer preserved)
hls.js                 → attach, restore position, enable skip buttons
```

## §4 — Proxy strategy (mandatory)

The browser cannot send the `Referer` these embeds require, and the hosts are cross-origin. Options, recommended order:

1. **Self-hosted HLS proxy as a Next Route Handler / edge function** (`/api/stream?src=&referer=`) that streams the `m3u8` + segments + rewrites playlist URIs and injects `Referer`. Keeps it first-party, controllable, observable. **Recommended.**
2. Keep the existing external Replit proxy as a **fallback** only (it's a SPOF and untrusted).
3. Proxy `.vtt` subtitles through the same handler (the old app forgot this).

Cache segment/playlist responses at the edge with short TTLs; add a circuit-breaker so a dead embed host fails over to the next server automatically.

## §5 — Next.js consumption strategy

**Server-only, typed, validated, cached.**

```
lib/
  providers/
    types.ts            // internal normalized models (Anime, Episode, Server, Source…)
    provider.ts         // interface every provider implements
    hianime/
      client.ts         // fetch wrapper (base url, timeout, retry, UA)
      schemas.ts        // Zod schemas for RAW responses
      mappers.ts        // raw → normalized model
      index.ts          // implements provider.ts
  api/
    anime.ts            // getHome(), getAnime(id), getEpisodes(id) … (call provider)
    stream.ts           // getServers(), getSources() — never cached long
```

- **All provider calls run on the server** (RSC / Route Handlers / Server Actions). The API key/origin and proxy never touch the client.
- **Zod-validate every raw response**, then map to a normalized model. One model shape used app-wide → kills the old app's field-drift bugs.
- **Caching via Next `fetch` cache + tags:**
  - Home/trending/popular/genre/category/azlist → `revalidate: 600–1800`, tag per surface.
  - Details/episodes → `revalidate: 3600`, `tag: anime:{id}`.
  - **Servers/sources → `cache: 'no-store'`** (links expire; must be fresh).
  - Schedule → `revalidate: 600`.
- **Resilience:** wrap provider calls in retry-with-backoff + timeout; on failure return typed `Result<T>` and render a graceful fallback, never a thrown 500.
- **Edge runtime** for read endpoints/pages where possible; Node runtime for the HLS proxy (streaming).

## §6 — Database / persistence recommendation

We need to store: **users, watch progress, lists/collections, preferences, AniList tokens.** The old backend already does some of this — but for `Shirayuki-Next` own data, recommendation:

- **Local-first first.** Watch progress + prefs live in **IndexedDB** (via `idb-keyval`/Dexie) so Continue Watching is instant and works logged-out. Sync to server in the background.
- **Server store:** **Postgres (Neon/Supabase) + Drizzle ORM.** Serverless, edge-friendly, typed. Tables: `users`, `watch_progress (user, animeId, episodeId, seconds, duration, updatedAt)`, `lists`, `list_items`, `preferences`, `anilist_accounts`.
- **Auth:** **Auth.js (NextAuth)** with credentials (reuse existing backend) **+ AniList OAuth** provider for sync. Session as httpOnly cookie.
- **Cache/rate-limit:** **Upstash Redis** (edge) for hot caches + provider rate-limiting + circuit-breaker state.
- **Conflict resolution:** progress merge is **last-writer-wins by `updatedAt`** per `(user, episode)` — simple and sufficient; no vector clocks needed.

> If you want to ship fast and lean: start **local-first only (IndexedDB) + keep the existing backend** for cross-device sync, and add Postgres/Drizzle when you outgrow it. Don't over-build persistence in Phase 1.

## §7 — TypeScript typing strategy (summary)

1. Zod schema per raw endpoint (`schemas.ts`) → `z.infer` for raw types.
2. Hand-written normalized models (`types.ts`) — stable, app-facing.
3. Mappers raw→normalized; all nullable handling lives here.
4. Components only ever see normalized models. No `any`, no `as`, no regex-on-ids (the old app's sins).
