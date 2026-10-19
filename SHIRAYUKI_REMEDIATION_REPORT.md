# Shirayuki — Remediation Report

**Project:** Sode no Shirayuki (`shirayuki-next`)
**Date:** 2026-10-19
**Basis:** `SHIRAYUKI_TECHNICAL_AUDIT_REPORT.md` (2026-10-19, `f206d12`)
**Scope:** Targeted remediation of confirmed security, caching, performance, and workflow findings. No redesign, no rewrite.

---

## 1. Executive summary

All findings the audit rated **P0/P1** are addressed, plus the P2 items that were safe to complete without external access. Every change was verified locally with the project's own gates (`lint`, `typecheck`, 76 unit tests, production `build`, bundle-size budget) and, where behaviour is observable, with bounded live requests against a local production server.

| Audit finding | Status | Evidence |
|---|---|---|
| **SEC-02 / PERF-06** — `/` ships `no-store`; intended edge cache never took effect | **Fixed (locally verified)** | Home now `x-nextjs-cache: HIT` + `Cache-Control: s-maxage=60, stale-while-revalidate=…` |
| **SEC-01** — `/api/stream` open relay, no rate limit / size cap | **Fixed (locally verified)** | 3 allowed → `429` + `Retry-After: 60`; per-IP buckets isolated |
| **PERF-04** — 202 KB unoptimized favicon | **Fixed** | `app/icon.png` 202,660 → 26,479 B; `apple-icon.png` 34,603 → 7,021 B |
| **SEC-05** — broken `next lint`, no CI | **Fixed** | `npm run lint` exit 0 non-interactive; `.github/workflows/ci.yml` added |
| **SEC-04** — CSP missing `script-src`/`img-src`/etc. | **Fixed** (all directives enforced incl. `script-src 'self' 'unsafe-inline'`) | Header verified; nonce-based tightening remains a future step (see §5a, §6) |
| **PERF-01 / PERF-03** — mobile TBT / Style & Layout cost | **Partially fixed** (measured-intent CSS reductions) | Mobile blur radii reduced; **not** re-measured (no browser) |
| **PERF-02** — “212 KB unused JS chunk” | **Not applicable as stated** (evidence: it is the React DOM framework baseline) | Chunk composition verified; no removable app JS found |
| **Code quality** — dead `headroom-ai` dependency | **Fixed** | Removed; zero usage confirmed |

### Most important outcome
The headline caching bug was a **silent framework-vs-config precedence failure**: `force-dynamic` emits `Cache-Control: no-store` that neither `next.config.ts headers()` nor middleware can override. The fix replaces `force-dynamic` with `export const revalidate = 60` on the home route, so Next emits the correct shared-cache directive itself. This was proven by experiment, not assumption (see §3).

### State of the deliverable
- **Locally verified:** lint, types, tests, build, bundle budget, route smoke tests, cache/security headers, rate-limit behaviour, icon bytes.
- **Not verifiable here:** production/Vercel behaviour, real browser playback, Lighthouse re-runs, real-field Core Web Vitals, backend API internals.
- **Deployment-complete vs code-complete:** the code is complete; distributed rate limiting additionally requires Upstash env vars (documented in `.env.example`), and CSP `script-src` tightening requires a future architectural decision.

---

## 2. Confirmed root causes

### 2.1 Why the home/watch edge cache never worked (SEC-02 / PERF-06)
I tested this directly rather than assuming:

1. **Baseline (production):** `curl -sI https://shirayuki-livid.vercel.app/` →
   `cache-control: private, no-cache, no-store, max-age=0, must-revalidate`, `x-vercel-cache: MISS` on repeat requests. The `next.config.ts` intent (`s-maxage=60, swr=300`) was absent.
2. **Hypothesis A — middleware can override it.** I wrote a middleware setting `Cache-Control`. With the config rule removed, every response still returned the framework `no-store`; a marker value (`x-mw=1`) never appeared. **Middleware `NextResponse.next()` cannot override the framework’s route-level `Cache-Control`.**
3. **Hypothesis B — the config rule exists but is beaten in production.** With a distinguishable marker, the config rule was clearly the effective local writer — yet production still showed `no-store`. So on Vercel the framework’s dynamic-render directive wins over both layers.

**Root cause:** `export const dynamic = "force-dynamic"` makes Next.js authoritative over the response’s cache directive, and it emits `no-store`. The `headers()` rules were therefore dead configuration.

### 2.2 The `/watch` routes cannot be edge-cached (finding refinement)
`/watch/[id]/[ep]` resolves an **ephemeral stream token** per request (`getSources`/`getServers` fetch with `noStore: true`), which opts the route out of static generation. `/watch/[id]` sits under an unbounded dynamic segment with no `generateStaticParams`, so it is always rendered on demand. **Both are dynamic by necessity.** The correct action was to remove the misleading cache config and document this, not to force a cache that would serve stale tokens. (Verified: the build route table shows `/` as `○ … 1m`, `/watch/*` as `ƒ`.)

### 2.3 The “212 KB unused chunk” (PERF-02)
Chunk `ed9f2dc4…js` (217 KB) contains **React DOM + `scheduler`** — the App Router client runtime that every route loads. Chunk `1255…js` (65.9 KB) is Next’s router client runtime. Lighthouse reports React’s cold paths as “unused,” but they are the framework baseline, not removable application code. `hls.js` is already isolated in its own lazy chunk, `zustand` in its own small chunk, and lucide icons are tree-shaken via `optimizePackageImports`. **No application-level barrel bloat exists to remove.** I did not fabricate a fix.

---

## 3. Changes by phase

### Phase 1 — Caching (SEC-02 / PERF-06)
- `app/page.tsx`: `export const dynamic = "force-dynamic"` → `export const revalidate = 60` (long comment explains the short window preserves the “never bake a bad page” safeguard; the provider layer still self-heals via its own `revalidate: 900` data cache + `safe()`).
- `next.config.ts`: removed the two ineffective `Cache-Control` `headers()` rules for `/` and `/watch/:path*`.
- `app/watch/[id]/[ep]/page.tsx`, `app/watch/[id]/page.tsx`: kept dynamic on purpose, with comments explaining why they cannot be shared-cached.
- Result: `/` is static with **Revalidate 1m**; repeat requests return `x-nextjs-cache: HIT`.

### Phase 2 — Proxy hardening (SEC-01)
- **New `lib/api/rate-limit.ts`**: pluggable limiter. Uses **Upstash Redis** (distributed, via REST pipeline — no SDK) when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set; otherwise a **per-instance in-memory** fixed window. Fail-open on backend outage by default (`denyOnError` flips it). Keys are **FNV-1a hashes of the client IP** so raw IPs are never stored. Response-size ceilings (`MAX_SEGMENT_BYTES`, `MAX_PLAYLIST_BYTES`, `MAX_SUBTITLE_BYTES`) + `withinDeclaredSize()` pre-check.
- **New `lib/api/playlist.ts`**: pure `proxied`, `rewritePlaylist`, and `capStream` (streams with a hard byte ceiling, never buffers).
- `app/api/stream/route.ts`, `app/api/subtitle/route.ts`: rate-limit before any upstream work (`429` + `Retry-After`), enforce declared-size and streamed-size ceilings (`413`). All SSRF guards, referer sanitization, redirect-hop validation, and no-permissive-CORS behaviour preserved unchanged.

### Phase 3 — Performance (PERF-01 / PERF-03)
- `app/globals.css`: `@media (max-width: 767px)` reduces `.glass` backdrop blur 20px → 10px.
- `components/layout/Ambient.tsx` + `globals.css`: mobile reduces the three ambient blobs from 140–150px to 70px blur and 36rem → 22rem.
- Desktop/tablet visuals are **byte-for-byte unchanged**; the frost identity is preserved, only the mobile paint cost drops.
- `components/home/Spotlight.tsx` hero **verified** already correct (`next/image`, `fill`, `sizes="100vw"`, `priority`, server-side `fetchPriority="high"` preload) — no change.

### Phase 4 — Lint + CI (SEC-05)
- Installed `eslint@9.39.5` + `eslint-config-next@15.5.28` (devDeps, exact-pinned).
- **New `eslint.config.mjs`** (flat config via `FlatCompat`); `"lint": "next lint"` → `"lint": "eslint ."`.
- Fixed all reported issues (1 error + 8 warnings): removed dead code in `CinematicInfo.tsx`, `SubtitleOverlay.tsx`, `nav/config.ts`; explicit `alt` in `SmartImage.tsx`; `prefer-const` in `subtitle/vtt.ts`; stale eslint-disable in `proxy-guard.ts`.
- **New `.github/workflows/ci.yml`**: install → lint → typecheck → test → build (dummy `API_BASE_URL`) → bundle-size budget. Node 24.x per `engines`.
- **New `scripts/check-bundle-size.mjs`** + `npm run bundle:check` for shared/route JS drift.
- **New `scripts/verify-cache-headers.mjs`** + `npm run verify:cache` for **post-deploy** cache assertions (deliberately not in the PR gate).

### Phase 5 — Icons + dead dependency (PERF-04)
- Re-encoded `app/icon.png` (512×512) and `app/apple-icon.png` (180×180) as 256-colour palette PNGs (transparency + artwork preserved; measured mean channel error 0.89/255). **202 KB → 26 KB** and **34 KB → 7 KB**.
- Removed `headroom-ai` (confirmed zero imports anywhere).

### Phase 6 — CSP (SEC-04)
- `next.config.ts`: enforcing CSP now includes `default-src 'self'`, `img-src 'self' data: blob: https:`, `media-src 'self' blob:`, `connect-src 'self'`, `font-src 'self'`, `style-src 'self' 'unsafe-inline'`, `worker-src 'self' blob:`, plus the original `object-src`/`base-uri`/`frame-ancestors`/`form-action`.
- Added `Content-Security-Policy-Report-Only: script-src 'self' 'unsafe-inline'` to observe script behaviour before enforcing.
- **`script-src` is intentionally not enforced** — see §6.

---

## 4. Before-and-after measurements

### Bundle (production build, local)

| Metric | Before | After |
|---|---|---|
| Shared First Load JS | 340 KB | 340 KB (unchanged — framework baseline) |
| `app/icon.png` transfer | 202,660 B | **26,479 B** |
| `app/apple-icon.png` transfer | 34,603 B | **7,021 B** |

### Caching (local production server, same build pipeline as Vercel)

| Route | Before | After |
|---|---|---|
| `/` (2nd request) | `no-store`, `MISS` | **`s-maxage=60, swr=…`, `x-nextjs-cache: HIT`** |
| `/watch/[id]/[ep]` | `no-store` | `no-store` (intentional — ephemeral token) |

### Rate limiting (local, `PROXY_RATE_LIMIT=3`)

| Request | Before | After |
|---|---|---|
| 1–3 | `200` | `200` |
| 4–5 | `200` | **`429` + `Retry-After: 60`** |
| Different IP | `200` | `200` (independent bucket) |

### Lighthouse
**Not re-measured.** No browser is available in this environment (consistent with the repo’s own noted limitation). The Phase 3 CSS changes are measured-intent reductions geared to Style & Layout / compositing, not verified scores. Re-running Lighthouse mobile/desktop against a deployed preview remains a required follow-up (§7).

---

## 5. Security fixes and remaining risks

### Fixed
- **SEC-01** — Proxy abuse resistance: per-client rate limiting, response-size ceilings, streaming byte cap. SSRF posture unchanged and re-verified (`169.254.169.254`, `localhost`, credentials, `file:` → `400`).
- **SEC-02 / PERF-06** — Cache directives now actually reach the edge (home only, correctly).
- **SEC-05** — Lint + CI gates stand up.

### Improved
- **SEC-04** — CSP constrains scripts, images, media, connections, fonts, styles, workers, objects, base, frames, forms. (`script-src 'self' 'unsafe-inline'` — see the post-review correction below.)

### Remaining / accepted risks
- **`script-src` is `'self' 'unsafe-inline'`, not nonce/hash-based.** A nonce policy is incompatible with the home page's 60s shared edge cache (one nonce per cached response). `'unsafe-inline'` is required because Next.js inlines its hydration/flight bootstrap and the reveal script; omitting `script-src` entirely is *worse* (see the post-review correction below). XSS breakout remains mitigated by escaped JSON-LD and the absence of unsanitized inline HTML, but a strict script policy remains a **future hardening step**.
- **Distributed rate limiting is opt-in.** Without Upstash env vars, the fallback is per-instance and the effective limit scales with instance count. Code-complete; deployment-complete only once Upstash credentials are configured.
- **Limiter fails open** by default. Chosen deliberately so a limiter outage cannot break playback. Flip `PROXY_RATE_LIMIT_DENY_ON_ERROR=1` to fail closed.
- **`style-src 'unsafe-inline'` retained** (Next inlined critical CSS + Motion inline styles). Tightening needs a nonce pipeline, same constraint as `script-src`.
- **Upstream API CORS (`ACAO: *`)** — the backend repo was not available; unchanged and unverifiable here.

---

## 5a. Post-review corrections (2026-10-19)

A `/review uncommitted` pass over this change set found and fixed issues before deployment:

1. **CRITICAL — enforced CSP broke hydration.** The original Phase 6 note claimed `default-src 'self'` was harmless for scripts. It is not: with `script-src` absent, `default-src` becomes the script fallback and blocks **all 134 inline `<script>` tags** in the built home HTML (the `__next_f` flight bootstrap + the `data-anim` reveal script), so the page would render but never hydrate. **Fixed** by declaring `script-src 'self' 'unsafe-inline'` in the enforced policy (and removing the now-redundant report-only twin). The nonce/edge-cache conflict is unchanged and documented above.
2. **CRITICAL — spoofable rate-limit key.** `clientKey` used the **leftmost** `x-forwarded-for` hop, which a caller can forge (Vercel appends its hop), trivially bypassing the SEC-01 limit. **Fixed**: prefer the platform-set `x-real-ip`, and when only XFF is present use the **rightmost** (edge-added) hop. Tests updated; verified locally that rotating the leftmost hop no longer evades the limit.
3. **WARNING — size caps ran after full buffering.** Playlist/subtitle size was checked with `text.length` **after** `await res.text()`, so a chunked (no `Content-Length`) upstream was fully buffered before the cap could reject it. **Fixed** with a shared `readTextWithinLimit()` that enforces the ceiling *during* the read.
4. **WARNING — Upstash round-trip per HLS segment.** Rate limiting added a remote call to the segment hot path. **Fixed** with a 5-second per-key "recently allowed" memo (never memoizes a denial; a key not just allowed still pays the real check).
5. **WARNING — CI blind to a broken home prerender.** Because `/` is now prerendered, a build-time upstream failure would bake `ErrorState` while CI stayed green. **Fixed** with `scripts/check-prerender.mjs` (wired into CI).
6. **Duplication (findings 7–10).** Extracted shared `lib/api/proxy-responses.ts` (`proxyOptions`, `enforceRateLimit`, `SWR_60`/`PLAYLIST_CACHE_CONTROL`) so the two proxy routes cannot drift.

All gates re-run green after the corrections: lint, typecheck, **77/77 tests**, build, bundle budget, prerender check.

---

## 6. CSP design note (script policy)

The audit recommended a nonce-based `script-src`. Investigation showed a hard conflict:

- The home page is served from a **shared 60-second edge cache** (Phase 1’s fix).
- A per-request nonce in a **shared cached** response is either identical for all visitors (defeating the nonce) or requires disabling the cache.

Resolving this needs an architectural decision (e.g. hash-based `script-src` for the two known inline scripts, or a render path that is dynamic but still cheap). I therefore enforced every directive that does **not** need a nonce and shipped a **report-only** script policy so real violations can be observed on a preview before any enforcement. This is the staged approach the brief permits when “the deployment setup cannot support safe nonce-based CSP without major architectural changes.”

---

## 7. CI and test results

### Local gates (final run)
| Gate | Command | Result |
|---|---|---|
| Lint | `npm run lint` | **exit 0** (clean) |
| Types | `npm run typecheck` | **exit 0** |
| Tests | `npm test` | **77 pass / 0 fail** (was 51; +26 new) |
| Build | `npm run build` | **exit 0** |
| Bundle budget | `npm run bundle:check` | **OK** (14 routes, 470 KB budget / 520 KB cap) |
| Prerender check | `npm run prerender:check` | **OK** (home HTML is real board content) |

### New tests added (26)
- `lib/api/rate-limit.test.ts` (12): in-memory window allow/deny/reset/per-key isolation, Upstash failure fail-open/fail-closed, pluggable `RateLimiter` contract, `clientKey` preferring `x-real-ip` and using the rightmost XFF hop, unknown bucket, `withinDeclaredSize`.
- `lib/api/playlist.test.ts` (9): `proxied` URL building, relative/absolute segment rewriting, `URI="…"` attribute rewriting, untouched comments, `capStream` intact-relay / ceiling-error / null-body.
- `lib/config/cache-headers.test.ts` (5): home uses `revalidate` not `force-dynamic`; `/watch/[id]` and `/watch/[id]/[ep]` have no misleading `revalidate`; the ineffective config rules are gone; `/api/sources` is `no-store`.

### Route smoke tests (local production server)
`/`, `/search`, `/genre/action`, `/category/movie`, `/az/a`, `/schedule`, `/watchlist`, `/terms`, `/privacy`, `/dmca`, `/robots.txt`, `/manifest.webmanifest`, `/icon.png`, `/apple-icon.png`, `/watch/one-piece-1`, `/watch/one-piece-1/ep-1`, `/anime/naruto-1` → **all 200**. `/api/suggest`, `/api/search-index` → 200. `/api/stream`, `/api/subtitle` without params → **400** (expected).

---

## 8. Files changed and dependency changes

### Modified
`app/page.tsx`, `app/watch/[id]/page.tsx`, `app/watch/[id]/[ep]/page.tsx`, `app/api/stream/route.ts`, `app/api/subtitle/route.ts`, `app/globals.css`, `components/layout/Ambient.tsx`, `components/ui/SmartImage.tsx`, `components/details/CinematicInfo.tsx`, `components/player/SubtitleOverlay.tsx`, `lib/api/proxy-guard.ts`, `lib/nav/config.ts`, `lib/subtitle/vtt.ts`, `next.config.ts`, `app/icon.png`, `app/apple-icon.png`, `package.json`, `package-lock.json`.

### Added
`lib/api/rate-limit.ts` (+ test), `lib/api/playlist.ts` (+ test), `lib/api/proxy-responses.ts`, `lib/config/cache-headers.test.ts`, `eslint.config.mjs`, `.github/workflows/ci.yml`, `scripts/check-bundle-size.mjs`, `scripts/check-prerender.mjs`, `scripts/verify-cache-headers.mjs`, `.env.example`.

### Dependencies
- **Added (dev):** `eslint@9.39.5`, `eslint-config-next@15.5.28` (exact-pinned).
- **Removed:** `headroom-ai@^0.22.4` (dead).
- **No** other upgrades.

---

## 9. Deployment instructions and required environment variables

1. Deploy the branch; the build requires nothing new (only `API_BASE_URL`, unchanged).
2. **Optional but recommended (SEC-01 distributed limiting):** set
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

   Values are never hardcoded; see `.env.example` (documentation only, no real values). Optionally tune `PROXY_RATE_LIMIT`, `PROXY_RATE_WINDOW_SECONDS`, `PROXY_RATE_LIMIT_DENY_ON_ERROR`.
3. **Post-deploy verification (required):**
   ```bash
   npm run verify:cache   # asserts deployed cache headers
   ```
   Expect: `/` not `no-store` and `s-maxage` present; `/api/sources` `no-store`; `/watch` not wrongly shared-cacheable.
4. **CSP:** the class-based policy is enforced immediately. The report-only script policy should be reviewed on a preview for violations before any future `script-src` enforcement.

---

## 10. Findings that remain unverified

- **Production/Vercel behaviour** of the new cache policy (verified locally only; `npm run verify:cache` closes this post-deploy).
- **Real browser playback** under the new CSP (`connect-src 'self'`, `media-src 'self' blob:`). Code paths were reviewed (player calls `/api/*` same-origin; toggle-to-blob via MSE) but not exercised in a browser. **CSP is the highest-risk change to playback and must be checked on a preview.**
- **Lighthouse mobile/desktop scores** — no browser available; the Phase 3 CSS changes are unmeasured.
- **SnowLayer canvas cost on mobile** — deliberately left untouched (its lifecycle/reduced-motion/idle-throttle safeguards retained) because no device evidence justified a change.
- **Upstream API internals** (`shirayuki-anime-api-ruby`) — repo unavailable; CORS/rate-limiting unchanged.

---

## 11. Recommended next steps

1. Deploy to a preview and run `npm run verify:cache` + a manual playback pass (HLS, sub/dub, failover, subtitles).
2. Re-run Lighthouse mobile/desktop on the preview and compare against the audit baseline (37 / 62).
3. Configure Upstash for globally enforced rate limiting (or a Vercel WAF rule).
4. Decide the `script-src` architecture (hash-based is likely cheapest given the two fixed inline scripts) and promote the report-only policy once violations are reviewed.
5. Consider component-level tests for the proxy routes once a test harness that resolves the `@/` alias is introduced (currently the pure cores are tested directly, per the repo’s `node --test` constraint).

---

*End of remediation report.*
