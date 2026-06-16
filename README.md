# Sode no Shirayuki — `shirayuki-next`

A premium anime streaming platform. Next.js App Router · TypeScript · Tailwind CSS v4 · Motion · hls.js. Dark-first "snow & ice" identity. Full plan in [`docs/`](./docs).

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
npm run typecheck
```

Env (`.env.local`): `API_BASE_URL` (the scraper API, server-side only).

## What's built (Phase 0–3 vertical slice)

- **Design system** — OKLCH frost tokens, Geist + Zen Kaku Gothic fonts, snow layer, glass utilities, reduced-motion respected. `app/globals.css`.
- **Typed, validated data layer** — swappable provider behind one interface, **Zod-validated** raw responses → normalized models, Next fetch-cache with tags, retry/timeout, `Result` wrapper so the provider never crashes a page. `lib/providers/`, `lib/api/`.
- **Pages (RSC + streaming SSR):** Home (spotlight, rails, Continue Watching), Anime details (+JSON-LD), Search, Category/Genre/A–Z browse, Schedule (Season Radar), Watch.
- **The player (the old app's broken core, fixed):**
  - First-party **HLS proxy** (`app/api/stream`) that injects `Referer` and rewrites playlist URIs — verified end-to-end.
  - **hls.js** with quality switching + native-HLS (Safari) fallback.
  - **Skip intro/outro** wired to the API's `intro`/`outro` timings; auto-skip remembered.
  - Remembered prefs (sub/dub, server, volume, speed, autoplay) via `lib/stores/prefs.ts`.
  - Keyboard shortcuts, PiP, subtitle proxy, autoplay next, server failover UI.
- **Continue Watching** — local-first (`lib/progress/local.ts`), instant, works logged-out.
- **One** `AnimeCard` (variants) — replaces the old app's five. **One** Nav, **one** player.
- **`⌘K` command palette**, SEO metadata + JSON-LD + robots + manifest.

## Not yet built (next phases — see `docs/05-roadmap.md`)

Accounts + cross-device sync (Phase 4) · AniList sync, seek-bar preview thumbnails, advanced filters (Phase 5) · filler-marker data source, character/studio explorers, mood discovery (Phase 6). Episode `isFiller` is plumbed through the UI; it needs the AnimeFillerList data source wired in.

## Notes

- Upstream provider (`hianime.ad` mirror) is fragile and serves **ephemeral** stream tokens — sources are fetched `no-store` and played immediately. Treat the provider as swappable (`lib/providers/`).
- `/watch/*` is `noindex` by design.
# Shirayuki-V2
