# 01 — Audit of `Shirayuki-React`

A Vite + React 19 + react-router-dom 7 + Tailwind v4 + shadcn SPA. Feature-complete, visually busy, structurally indebted. Below: what it does, what to keep, what to fix, what to kill.

---

## 1. Feature inventory (everything to carry forward)

**Browsing/discovery**
- Home (spotlight slider, trending, top airing, latest episodes, top-10, most-popular sidebars)
- Anime details (info panel, seasons carousel, related, recommended, characters, promo videos)
- Search (live suggestions w/ 300ms debounce + paginated results)
- A–Z list, Genre, Category (TV/Movie/OVA/ONA/Special/Music), Producer/Studio
- Weekly schedule with date picker + live clock

**Playback**
- HLS streaming, multi-server (sub/dub/hsub/softsub), subtitle tracks, keyboard shortcuts, intro/outro skip (auto + manual), autoplay next, fullscreen, progress bar

**Accounts & progress**
- Register/login/logout, forgot/update password, profile (avatar, username, tagline)
- Watch progress (localStorage + backend sync ~10s), resume-from-position, "Continue Watching" on profile, per-anime watched count, multi-device sync

**Partial / dead**
- "Add to List" button (non-functional), Favorites tab ("Under Construction"), Stats tab ("Under Construction")

> Migration note: the **backend** (`/api/auth/*`, `/api/user/*`, `/api/progress/*`, `/api/profile/pfp*`) already implements auth + cross-device watch progress + avatars. Keep and reuse it.

---

## 2. KEEP (strengths worth preserving)

- **The feature surface itself** — it's a complete anime platform; the IA is reasonable.
- **Route-level lazy loading** (`React.lazy` per page) — good instinct; Next gives this for free.
- **Skip intro/outro UX** with early-warning + auto-skip toggle — good pattern, keep the interaction.
- **Debounced search suggestions** with poster/type/episode previews — good.
- **Local + backend progress dual-write** *concept* (not its implementation) — local-first is correct.
- **Vite build hygiene** — gzip+brotli, manual vendor chunks, terser, bundle visualizer. (Next replaces most of this.)
- **shadcn/ui primitives** — accessible Radix base; port the component choices.

---

## 3. FIX (migrate but redesign)

| Area | Problem | Fix in Next |
|---|---|---|
| **HLS playback** | `hls.js` installed but **never imported**; relies on native HLS (Safari-only) | Use `hls.js` with native-HLS fallback; this is the #1 bug |
| **Proxy** | `addProxy()` exists but is **never applied** to the `m3u8`; `Referer` stripped to domain | Route every stream + subtitle URL through the HLS proxy; preserve `Referer` |
| **API layer** | Hand-rolled `fetch` client, in-memory `Map` cache, regex parsing of IDs, no types | Typed server-side SDK + **Zod validation** + Next fetch cache w/ tags |
| **State** | No global store; 19 props drilled into `VideoPlayer`; each page re-fetches | RSC for server data; Zustand for player/prefs; URL state for filters |
| **Auth tokens** | 3 different keys (`token`/`accessToken`/`jwt`), no refresh, no real logout | One auth module; httpOnly cookie via Route Handler; single source of truth |
| **Progress sync** | Last-write-wins race across devices; silent failures | Timestamp-based merge; local-first w/ background sync; surface failures |
| **Images** | No `srcset`/WebP/sizing; original-size posters | `next/image` + CDN remotePatterns + responsive sizes |
| **Long lists** | 100+ episode grids, no virtualization | Virtualize episode lists + infinite grids |
| **A11y** | Div soup, ~6 ARIA attrs, no focus mgmt, no reduced-motion | Semantic landmarks, focus management, `prefers-reduced-motion`, captions a11y |
| **Schedule** | Hardcoded GMT+6, 1s interval, no refresh | User timezone, sane interval, ISR revalidate |

---

## 4. KILL (remove entirely)

- **Duplicate `VideoPlayer`** — the `videoPlayer/` (logic+ui hooks) vs `watch/VideoPlayer.jsx` split. Build **one** player.
- **Five `AnimeCard`s** (`home/`, `az/`, `category/`, `genre/`, `producer/`) — ~80% identical. Build **one** `<AnimeCard variant=…>`.
- **Two `Navbar`s** (`layout/Navbar.jsx` used, `layout/navbar/Navbar.jsx` dead). One nav.
- **`src/css/*.css`** cyberpunk auth themes (login/register/profile/navbar) — off-brand, animation-heavy, no reduced-motion. Replace with the new design system.
- **In-memory `Map` cache** in the API client — replaced by Next's fetch cache / `unstable_cache`.
- **Dead buttons** — either implement (Add to List, Favorites, Stats) or remove; don't ship "Under Construction."
- **`test.js` Hono proxy + ad-hoc env proxy string parsing** — replace with a proper, single proxy strategy (see [03](./03-api-architecture.md) §4).

---

## 5. Scorecard (old app)

| Dimension | Score | Note |
|---|---|---|
| Functionality | 8/10 | Complete |
| Visual polish | 7/10 | Busy, inconsistent, off-brand |
| Code quality | 5/10 | Heavy duplication |
| Architecture | 4/10 | No types, no state strategy, hand-parsing |
| Performance | 6/10 | Good build, bad images, SPA blanking |
| Accessibility | 3/10 | Level A at best |
| **Core feature (player)** | **3/10** | **Broken on non-Safari without hls.js** |

**Bottom line:** the app is a strong *spec* and a weak *foundation*. Rebuild the foundation; honor the spec.
