# Sode no Shirayuki — Rebuild Master Plan

> **Sode no Shirayuki** (袖白雪, "Sleeve White Snow") — Rukia Kuchiki's zanpakutō, described in *Bleach* as the most beautiful in all of Soul Society. White, pure, ice. This is our north star: a premium anime platform with the cold elegance of fresh snow, not another neon clone.

This `docs/` folder is the **single source of truth** for rebuilding the old `Shirayuki-React` SPA into a modern Next.js App Router platform (`Shirayuki-Next`). Read these in order.

| # | Doc | What it covers |
|---|-----|----------------|
| 00 | **overview.md** (this file) | Executive summary, verdict, deliverables index |
| 01 | [react-audit.md](./01-react-audit.md) | Full audit of the old app — keep / fix / kill |
| 02 | [market-research.md](./02-market-research.md) | Community love/hate, competitor teardown, QoL gaps |
| 03 | [api-architecture.md](./03-api-architecture.md) | Scraper API analysis + Next.js consumption strategy |
| 04 | [design-system.md](./04-design-system.md) | Brand, color, type, motion, components |
| 05 | [roadmap.md](./05-roadmap.md) | Folder structure, features, phased build plan, perf/SEO/a11y |

---

## Executive Verdict

The old `Shirayuki-React` app **works and is feature-complete** — but it is a Vite SPA carrying real technical debt that caps its ceiling. The biggest problems are not visual; they are structural:

1. **The video player ships `hls.js` in `package.json` but never imports it.** Playback relies on native HLS, which only Safari supports — meaning the core feature is broken on Chrome/Firefox unless the stream happens to be natively playable. This is the #1 bug.
2. **The HLS source URL is never run through the proxy** even though a proxy env var exists, so cross-origin `m3u8` + `Referer`-gated streams will CORS-fail.
3. **Two parallel video player implementations** (`watch/VideoPlayer.jsx` and `videoPlayer/`) and **five near-identical `AnimeCard` components** and **two `Navbar`s**. Massive duplication.
4. **No global state, no typed API, no schema validation** — the scraper API returns heavily nullable, shape-shifting data and the app hand-parses it with regex in places.
5. **Accessibility is ~Level A at best** — div soup, ~6 ARIA attributes total, no focus management, no `prefers-reduced-motion`.

**Recommendation: do not migrate the code. Migrate the *knowledge*.** Rebuild on Next.js with a typed/validated API layer, one design system, one player, server-rendered data, and the QoL features the old app lacked. Keep the *feature inventory* and the *backend* (auth + watch-progress endpoints already exist and work).

## What makes this version different (the thesis)

The market is full of HiAnime clones. They all look the same and break the same way. Our wedge is **premium polish + retention features done right**, wrapped in a genuine winter/ice identity:

- **One beautiful, consistent design language** (snow/ice/Japanese minimalism) instead of generic dark + purple gradients.
- **A player that actually works everywhere** (hls.js), with skip-intro/outro driven by the timings the API *already returns*, remembered sub/dub + server preference, and seek-bar preview thumbnails.
- **Continue Watching that is trustworthy** — local-first, instant, cross-device, accurate "next up."
- **Filler/canon episode markers** — repeatedly requested, almost never shipped.
- **AniList sync** — the single highest-leverage retention feature in this space.
- **A `⌘K` "Frost" command palette** for instant search & navigation.
- **Fast.** RSC + streaming SSR + edge caching → Lighthouse 95+, not a 200KB-JS SPA that blanks on every navigation.

## Hard constraints discovered

- **Upstream fragility:** the API scrapes `hianime.ad`. HiAnime/Zoro/Aniwatch as a brand **shut down March 2026**; the data source is a mirror and *will* rotate or die. The architecture must treat the provider as swappable (a `providers/` abstraction), cache aggressively, and degrade gracefully.
- **Streaming needs a proxy + `Referer` rewrite.** The `sources` endpoint returns an `m3u8` plus a `referer` that the browser cannot set. A proxy (HLS rewriter) is mandatory, not optional.
- **Data is nullable and inconsistent.** Guessed/invalid anime IDs return all-`null` objects with `success: true`. Every response must be schema-validated before use.

## Deliverables index (mapped to your 20 asks)

| Your ask | Where it's answered |
|---|---|
| 1. Audit of shirayuki-react | [01](./01-react-audit.md) |
| 2. Market research | [02](./02-market-research.md) §1 |
| 3. Reddit/community insight | [02](./02-market-research.md) §1–§3 |
| 4. Competitor analysis | [02](./02-market-research.md) §4 |
| 5. API architecture analysis | [03](./03-api-architecture.md) |
| 6. Design system | [04](./04-design-system.md) |
| 7. Brand identity | [04](./04-design-system.md) §1 |
| 8. Color palette | [04](./04-design-system.md) §2 |
| 9. Typography | [04](./04-design-system.md) §3 |
| 10. Component architecture | [05](./05-roadmap.md) §2 |
| 11. Folder structure | [05](./05-roadmap.md) §1 |
| 12. Database recommendation | [03](./03-api-architecture.md) §6 |
| 13. Feature prioritization | [05](./05-roadmap.md) §3 |
| 14. User flows | [05](./05-roadmap.md) §4 |
| 15. Wireframe recommendations | [05](./05-roadmap.md) §5 |
| 16. Performance strategy | [05](./05-roadmap.md) §6 |
| 17. SEO strategy | [05](./05-roadmap.md) §7 |
| 18. Accessibility strategy | [05](./05-roadmap.md) §8 |
| 19. Unique differentiators | [02](./02-market-research.md) §5 + [05](./05-roadmap.md) §3 |
| 20. Implementation roadmap | [05](./05-roadmap.md) §9 |
