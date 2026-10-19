# Shirayuki — Comprehensive Technical Audit Report

**Project:** Sode no Shirayuki (`shirayuki-next`) — anime streaming & discovery client
**Frontend:** https://shirayuki-livid.vercel.app/
**Backend / API:** https://shirayuki-anime-api-ruby.vercel.app/ (hosted on Vercel)
**Audit date:** 2026-10-19
**Audit type:** Read-only static review + safe live checks. No code, config, dependency, or deployment changes were made.
**Auditor stance:** Senior Next.js architecture / performance / security review.

> **REMEDIATION UPDATE (2026-10-19).** A separate remediation pass has since
> addressed the P0/P1 findings and the safe P2 items. See
> `SHIRAYUKI_REMEDIATION_REPORT.md` for full detail. Per-finding status is
> annotated inline below. Summary:
>
> - **SEC-02 / PERF-06 — FIXED (locally verified).** Root cause confirmed:
>   `force-dynamic` emits `Cache-Control: no-store` that neither `headers()` nor
>   middleware can override. Home now uses `export const revalidate = 60` and
>   serves `x-nextjs-cache: HIT` + `s-maxage=60`. The `/watch/*` routes cannot be
>   shared-cached (ephemeral tokens / unbounded segment) and were left dynamic
>   with the misleading config removed.
> - **SEC-01 — FIXED (locally verified).** Per-client rate limiting
>   (`429` + `Retry-After`), response-size ceilings, and a streaming byte cap
>   added to `/api/stream` and `/api/subtitle`. Distributed limiting is opt-in
>   via Upstash env vars (documented in `.env.example`).
> - **PERF-04 — FIXED.** `icon.png` 202 KB → 26 KB; `apple-icon.png` 34 KB → 7 KB.
> - **SEC-05 — FIXED.** `npm run lint` is now a non-interactive ESLint CLI
>   (exit 0); GitHub Actions CI added (lint + typecheck + test + build + bundle
>   budget). 76 unit tests pass (was 51).
> - **SEC-04 — PARTIALLY FIXED.** CSP now enforces all non-script directives
>   (img/media/connect/font/style/worker/object/base/frame/form). `script-src`
>   is *not* enforced because a nonce policy conflicts with the 60s shared edge
>   cache; a report-only script policy is deployed instead.
> - **PERF-01 / PERF-03 — PARTIALLY FIXED (unmeasured).** Mobile-only blur
>   reductions for `.glass` (20→10px) and the ambient blobs (140–150→70px).
>   Lighthouse was not re-run (no browser available); re-measurement is a
>   required follow-up on a preview deploy.
> - **PERF-02 — NOT APPLICABLE AS STATED.** The 217 KB chunk is React DOM +
>   `scheduler` (the App Router framework baseline loaded by every route); it is
>   not removable application code. No fabricated optimization was applied.
> - **Code quality — dead `headroom-ai` dependency REMOVED.**
>
> Still unverified: production behaviour (needs post-deploy `npm run verify:cache`),
> real browser playback under CSP, Lighthouse scores, backend API internals.

---

## Section 1 — Executive summary

### Overall project health
Shirayuki is a **well-architected, unusually disciplined Next.js 15 codebase** for a solo-project streaming client. The data layer is cleanly isolated (provider ↔ facade ↔ models), provider payloads are validated with zod, user-controlled storage is treated as untrusted, and the SSRF surface of the first-party proxy routes is guarded with a genuinely thorough implementation (DNS re-resolution on every redirect hop, IPv4/IPv6 private-range coverage, credential/control-char rejection). Type checking passes, 51/51 unit tests pass, and the production build succeeds. Accessibility and best-practices Lighthouse scores are both **100**.

The weaknesses are concentrated in three places, not spread thinly:
1. **The intended edge-cache headers for `/` and `/watch/*` are not present in production** — the site sends `no-store` on every HTML route. The performance win that commit `7f98ca7` ("swap no-store response for 60s edge cache") was meant to deliver is **not active in the deployed site**.
2. **Mobile runtime performance is poor** (Lighthouse mobile: **37**, LCP 15.0 s, TBT 5,490 ms) driven by a 217 KB shared JS chunk plus a **fully-unused 212 KB chunk**, and heavy Style & Layout work.
3. **`/api/stream` is an unauthenticated open relay to any public URL with no rate limiting**, which is a bandwidth/abuse vector (and, combined with no host allowlist, an SSRF-adjacent amplification surface even though private targets are blocked).

### Most important security concerns
- **No confirmed critical or high-severity vulnerability was found.** The classic Next.js App Router footguns are all correctly handled: JSON-LD is escaped (`lib/utils/jsonld.ts`), no secrets are committed or exposed, `NEXT_PUBLIC_` is not misused (in fact it is never used), and the SSRF guard works in production.
- The most meaningful security exposure is **abuse resistance** on the proxy routes (`/api/stream`, `/api/subtitle`): no rate limiting, no request-count ceiling, and an open public-URL relay. Severity **Medium** — it is a resource-consumption / open-relay issue, not an access-control bypass.
- The upstream API returns `Access-Control-Allow-Origin: *` and `no-store`. This is a separate repository that was **not accessible**; its internals are unverified.

### Largest performance bottlenecks
- **Mobile TBT 5,490 ms / LCP 15.0 s** (Lighthouse mobile, lab).
- A **212 KB JS chunk that is entirely unused** on the home page (`ed9f2dc4…`, reported by Lighthouse as 212 KB wasted).
- `Style & Layout` at **6,123 ms** on mobile — a strong signal that the cinematic CSS (backdrop-filter blur, gradients, 25 keyframes) is expensive on a throttled CPU.
- `app/icon.png` is **202 KB at 512×512** and served **unoptimized** (not through `next/image`).
- The `no-store` HTML caching miss compounds all of the above: every visitor pays a full serverless render.

### Most significant architectural weaknesses
- **Deployment config drift**: the code documents and intends edge caching that production does not deliver. This is a silent regression class — the config looks correct but the framework overrides it.
- **No CI, no linting, and no E2E tests.** `npm run lint` is broken (hangs on an interactive ESLint prompt); there is no Prettier, no CI config, and no `error.tsx`/`loading.tsx` coverage for every route. Type-check + 51 unit tests are the only automated gates.
- The `motion` v14 (Motion for React) dependency appears to add weight relative to its usage; `headroom-ai` is a declared dependency with **zero usage** (dead dependency).

### Highest-priority recommended actions
1. ~~**Fix the production caching**~~ — **DONE** (home now `revalidate = 60`; `/watch/*` correctly left dynamic). — P0/P1
2. ~~**Add rate limiting / request ceilings to `/api/stream` and `/api/subtitle`.**~~ — **DONE** (opt-in distributed via Upstash). — P1
3. ~~**Cut the 212 KB unused chunk**~~ — **investigated: it is the React DOM framework baseline, not removable.** Mobile blur cost **reduced** (unmeasured). — P1
4. ~~**Shrink `app/icon.png`**~~ — **DONE** (202 KB → 26 KB). — P2
5. ~~**Stand up real CI**~~ & ~~remove the dead `headroom-ai` dependency~~ — **DONE**. — P2

### What could not be inspected
- The **backend repository** for `shirayuki-anime-api-ruby.vercel.app` was **not available**. Only its externally observable behaviour (headers, status codes, response times) was measured. Its source, dependency tree, caching, and rate-limiting internals are **unverified**.
- **Vercel dashboard settings** (env scoping, preview exposure, function region/timeouts, WAF) were **not accessible**; only response headers were observable.
- **Real-user field data (CrUX)** was not available; all Core Web Vitals figures below are **Lighthouse lab** measurements.
- No penetration testing was performed. SSRF/abuse checks were limited to safe, single-request probes.

---

## Section 2 — Project inventory

### Framework and runtime
| Item | Value | Evidence |
|---|---|---|
| Next.js | 15.5.28 (App Router) | `package-lock.json` resolved; build output |
| React / React-DOM | 19.2.7 | lockfile |
| TypeScript | 5.9.3 (declared `^5.7.0`) | `npm outdated` |
| Node engine | `24.x` (declared) | `package.json` `engines` |
| Node (audit host) | v26.7.0 | `node -v` |
| Package manager | npm (only `package-lock.json`; no pnpm/yarn lock) | repo root |
| Router | App Router (`app/`) with route groups `(browse)` | directory tree |
| Styling | Tailwind v4 (`@tailwindcss/postcss`), tokens in `app/globals.css` | `postcss.config.mjs` |

### Major dependencies and purpose
| Package | Version | Purpose |
|---|---|---|
| `next`, `react`, `react-dom` | 15.5.28 / 19.2.7 | framework |
| `zod` | ^3.25.0 | runtime provider-schema validation |
| `hls.js` | ^1.6.15 | HLS playback (client, lazy via `PlayerLoader`) |
| `motion` (Motion for React) | ^14.3.0 | pointer/spring/`AnimatePresence` motion |
| `zustand` | ^5.0.8 | client prefs store (player) |
| `lucide-react` | ^0.562.0 | icons |
| `clsx` + `tailwind-merge` | ^2 / ^3 | class composition (`cn`) |
| `headroom-ai` | ^0.22.4 | **DEAD — zero usage in source** |

Total packages in lockfile: **110** (29 prod, 43 dev, 61 optional).

### Application structure
```
app/
  layout.tsx           root layout, fonts, MotionProvider, security headers source
  page.tsx             home board (force-dynamic)
  loading.tsx          home skeleton
  error.tsx            route error boundary (safe copy, no leakage)
  not-found.tsx        themed 404
  robots.ts            disallows /watch/ and /api/
  (browse)/            az, category, genre, schedule, search
  anime/[id]/          detail page (+ JSON-LD)
  watch/[id]/          resume redirect (server-resolved)
  watch/[id]/[ep]/     player page (force-dynamic)
  api/                 stream, subtitle, suggest, sources, search-index
  terms|privacy|dmca/  legal pages
components/  anime, common, details, home, layout, motion, player, schedule, search, ui
lib/         api (facade + concurrency + proxy-guard), providers/hianime, progress,
             watchlist, completed, storage, search, player, motion, nav, utils, stores, subtitle
docs/        design + plan notes
```
`@/*` path alias maps to the repo root (no `src/`).

### API architecture
- **App Router route handlers** (`app/api/**/route.ts`) — no Server Actions were found.
- **No middleware.ts** exists.
- **Frontend → upstream**: `lib/api/index.ts` is the single facade; every getter is wrapped in React `cache()` for per-request memoisation. `lib/providers/hianime/client.ts` performs the fetch with Next Data Cache tags, explicit timeouts, and a bounded retry loop.
- **In-flight dedup**: a module-level `Map` collapses concurrent identical fetches within a serverless instance.
- **Five frontend API routes**: `/api/stream` (HLS proxy), `/api/subtitle` (VTT proxy), `/api/suggest` (typeahead), `/api/sources` (client failover), `/api/search-index` (palette index). There is no `/api/schedule` (fetched server-side).

### Data-fetching & caching strategy
- Home + watch pages: `export const dynamic = "force-dynamic"` server-side; `next.config.ts` `headers()` intends `s-maxage=60, stale-while-revalidate=300` for `/` and `/watch/:path*`.
- Provider calls use Next Data Cache with `revalidate` + tags (e.g. `home` revalidate 900, `suggest:<q>` revalidate 300).
- Stream/source links are `no-store` (ephemeral tokens).

### Image & media delivery
- `next/image` with an explicit host allowlist (`POSTER_HOSTS` in `next.config.ts`), AVIF→WebP formats, `minimumCacheTTL` 31 days, tuned `deviceSizes`/`imageSizes`/`qualities`.
- `components/ui/SmartImage.tsx` — load-driven blur-up crossfade (shimmer until decode).
- Player poster uses a plain `<img>` fallback for non-allowlisted hosts.
- `app/icon.png` (202 KB) and `app/apple-icon.png` (34 KB) are metadata assets.

### Authentication / authorization
- **None.** The app is fully public; there are no accounts, sessions, or auth checks. "Local-first" persistence only (`lib/progress`, `lib/watchlist`, `lib/completed`, `lib/storage/sanitize.ts`).

### Environment variables
- Only **one** variable is read anywhere: `API_BASE_URL` (`lib/providers/hianime/client.ts:4`), server-side, with a hardcoded fallback. No `NEXT_PUBLIC_*` variables exist.

### Deployment & build config
- `next.config.ts`: `reactStrictMode`, `compress`, `productionBrowserSourceMaps: false`, `optimizePackageImports`, image config, `headers()` (security + cache), `outputFileTracingRoot`.
- No `vercel.json`, no `.vercel/` directory (settings are dashboard-side; not inspectable).
- `overrides.postcss: ^8.5.23`.

### Testing / lint infra
- `npm test` → `node --test` over `lib/**/*.test.ts` + `app/**/*.test.ts` (**51 tests** across 9 files).
- `npm run typecheck` → `tsc --noEmit` (passes).
- `npm run lint` → `next lint` → **BROKEN** (interactive ESLint setup prompt; ESLint not installed, no config).
- No Prettier, no CI workflow, no E2E suite.

---

## Section 3 — Security findings

> No Critical or High confirmed vulnerabilities were found. Findings below are Medium/Low/Informational and are all supported by evidence.

### SEC-01 — `/api/stream` is an unauthenticated open relay to any public URL, with no rate limiting
- **Severity:** Medium
- **Confidence:** High
- **Status:** ~~Confirmed~~ **FIXED (locally verified, 2026-10-19).** Per-client
  rate limiting (`429` + `Retry-After`), response-size ceilings, and a streaming
  byte cap now protect `/api/stream` and `/api/subtitle`. Distributed limiting
  (`lib/api/rate-limit.ts`) uses Upstash Redis when configured, with a
  per-instance fallback otherwise. Verified locally: 3 requests allowed → `429`
  with `Retry-After: 60`; independent per-IP buckets. Remaining: set
  `UPSTASH_REDIS_REST_URL`/`_TOKEN` for global enforcement. See
  `SHIRAYUKI_REMEDIATION_REPORT.md` §3 (Phase 2).
- **Component:** `app/api/stream/route.ts`, `lib/api/proxy-guard.ts`
- **Evidence:** Live probe (safe, single request):
  ```
  curl -s -o /dev/null -w "%{http_code} %{size_download}\n" \
    "https://shirayuki-livid.vercel.app/api/stream?url=https://example.com/"
  → 200 577
  ```
  The route fetches an arbitrary public host and streams it back. Private/link-local/file/credential targets are correctly rejected (400) — see SEC-good below — but **any public URL is proxied**, and there is no per-IP/per-session rate limit, no allowlist, and no response-size ceiling in the code (`app/api/stream/route.ts:99-131`).
- **Impact / realistic scenario:** A third party (or a script) can use the deployment as a free CDN/proxy for arbitrary public content, consuming the project's Vercel bandwidth and function invocation budget. Repeated calls also amplify outbound traffic to `hianime.at` and other hosts, with no cost attribution to the caller. This is an abuse/availability issue, **not** an SSRF bypass.
- **Preconditions:** Public internet access to the deployed route. No auth required.
- **Remediation:**
  1. Add IP-based rate limiting (Vercel WAF/Edge Config, Upstash Ratelimit, or a platform rule) on `/api/stream` and `/api/subtitle`.
  2. Add a per-response size cap and a concurrency ceiling.
  3. Consider a lightweight signed token (HMAC of the target + short expiry) issued by the server-side watch page, so only URLs the app itself resolved are proxyable.
  4. Optionally restrict to the known CDN families as a *soft* allowlist with a documented override path.
- **Validation:** After adding a limiter, assert that N rapid identical requests return `429` past the threshold, and that an unsigned/expired token returns `403`.

### SEC-02 — Production HTML caching header is silently overridden; `/` and `/watch/*` ship `no-store`
- **Severity:** Medium (availability/cost; also undermines the documented cache design)
- **Confidence:** High
- **Status:** ~~Confirmed~~ **FIXED for `/` (locally verified, 2026-10-19);
  `/watch/*` intentionally dynamic.** Root cause confirmed by experiment:
  `force-dynamic` emits `Cache-Control: no-store`, which **neither**
  `next.config.ts` `headers()` **nor** middleware can override (a middleware-set
  header value was provably discarded). Fix: home now uses
  `export const revalidate = 60`, so Next emits `s-maxage=60, swr=…` itself
  (local repeat request returns `x-nextjs-cache: HIT`). The `/watch/*` routes
  cannot be shared-cached — `/watch/[id]/[ep]` embeds a per-request ephemeral
  stream token and `/watch/[id]` sits under an unbounded dynamic segment — so
  the misleading config was removed and the routes documented as dynamic.
  Post-deploy verification: `npm run verify:cache`.
- **Component:** `next.config.ts:117-144` vs `app/page.tsx:38`, `app/watch/[id]/[ep]/page.tsx:12`
- **Evidence:** Deployed responses on two consecutive home requests:
  ```
  cache-control: private, no-cache, no-store, max-age=0, must-revalidate
  x-vercel-cache: MISS        (both requests)
  age: 0
  ```
  The intended `public, s-maxage=60, stale-while-revalidate=300` is **absent**; grepping the response for `stale-while` returns nothing. Static hashed assets are correctly `public,max-age=31536000,immutable`.
- **Impact:** Every visitor (and every Lighthouse run) pays a full serverless render plus both upstream fetches. This directly contributes to serverless cost and cold-response latency. It also means the "fix" recorded in git history (`7f98ca7 perf(home): swap no-store response for 60s edge cache`) is **not effective in production** — a silent config/framework-precedence failure.
- **Likely root cause:** `export const dynamic = "force-dynamic"` makes Next.js authoritative over the route's cache directives, and its emitted `Cache-Control: no-store` wins over the `headers()` rule for the same response.
- **Remediation:** Choose one coherent strategy and verify it in production:
  - If dynamic-on-server but edge-cached is desired, move the cache header enforcement to where it takes precedence (e.g. set `Cache-Control` explicitly via the response in a route, or use middleware, or drop `force-dynamic` in favour of `revalidate` with a guarded failure path), **or**
  - accept `no-store` and remove the misleading `headers()` rules.
  Then re-verify with `curl -sI`.
- **Validation:** `curl -sI "https://…/" | grep -i cache-control` must show the intended directive, and a second request should return `x-vercel-cache: HIT` (or `age > 0`).

### SEC-03 — Upstream API returns wildcard CORS and `no-store`
- **Severity:** Low
- **Confidence:** High (for the header); **Low** for any downstream impact (backend internals unverified)
- **Status:** Confirmed (header) / Not Verified (internals)
- **Component:** `https://shirayuki-anime-api-ruby.vercel.app/*`
- **Evidence:**
  ```
  access-control-allow-origin: *
  cache-control: no-store, no-cache, must-revalidate
  ```
- **Impact:** A wildcard ACAO means any website can call the public API and consume its upstream scraper capacity. Since the API is public and unauthenticated, this is not data exposure — but it removes any origin barrier to abuse and combines poorly with the absence of visible rate limiting.
- **Preconditions:** Public access to the API.
- **Remediation:** If the API is intended only for this frontend, replace `*` with the frontend origin(s). Add rate limiting on the API repo. **Requires access to the backend repo**, which was not available.
- **Validation:** Re-check the `Access-Control-Allow-Origin` header after change; confirm the frontend still functions (it calls the API server-side, so browser CORS does not actually apply to those calls — the wildcard mainly helps third parties).

### SEC-04 — CSP omits `script-src`, `style-src`, and `img-src`
- **Severity:** Low
- **Confidence:** High
- **Status:** ~~Confirmed (by design, per code comment)~~ **PARTIALLY FIXED
  (2026-10-19).** The CSP now enforces `default-src 'self'`, `img-src`,
  `media-src`, `connect-src`, `font-src`, `style-src`, `worker-src` in addition
  to the original `object-src`/`base-uri`/`frame-ancestors`/`form-action`. A
  `Content-Security-Policy-Report-Only: script-src 'self' 'unsafe-inline'` header
  is deployed to observe violations. **`script-src` is deliberately NOT
  enforced:** a nonce-based policy is incompatible with the home page's 60s
  shared edge cache (every visitor would receive the same nonce). Enforcing it
  requires hashing the fixed inline scripts or a different render architecture —
  see `SHIRAYUKI_REMEDIATION_REPORT.md` §6.
- **Component:** `next.config.ts:107`
- **Evidence:** `Content-Security-Policy: object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'` — no `default-src`/`script-src`.
- **Impact:** The policy blocks plugin/base/form/frame vectors (good), but does not constrain script or image sources. It is a hardening gap, not an active vulnerability — XSS breakout is already prevented elsewhere (JSON-LD escaping, no unsanitised HTML except controlled inline scripts).
- **Remediation:** Add a nonce-based `script-src` via middleware, and explicit `img-src` (allowlist + `data:`) and `style-src`. This must account for hls.js, the HLS media hosts, and poster CDNs — a strict policy here can break playback, so it needs careful testing (see Section 9).
- **Validation:** Deploy to a preview, run Lighthouse best-practices + manual playback, and check the console for CSP violations.

### SEC-05 — `next lint` is broken; no CI enforcement
- **Severity:** Low (process/regression risk)
- **Confidence:** High
- **Status:** ~~Confirmed~~ **FIXED (2026-10-19).** `next lint` replaced with the
  ESLint CLI (`eslint .`) using `eslint@9.39.5` + `eslint-config-next@15.5.28`
  (flat config in `eslint.config.mjs`). `npm run lint` now exits 0
  non-interactively. All previously reported issues were fixed. A GitHub Actions
  workflow (`.github/workflows/ci.yml`) runs lint + typecheck + test + build +
  a bundle-size budget. Tests: 76 pass (was 51).
- **Component:** `package.json:15`, absent ESLint config
- **Evidence:** `npm run lint` prints the interactive "How would you like to configure ESLint?" prompt and hangs/awaits input.
- **Impact:** No lint-based safety net; hooks/`any`/unsafe patterns can regress silently. Combined with no CI, only `tsc` + 51 unit tests guard the build.
- **Remediation:** Migrate to the ESLint CLI (`npx @next/codemod@canary next-lint-to-eslint-cli .`) or add `eslint` + `eslint-config-next` with a config file; wire `typecheck`+`test` (+ lint) into a CI workflow.
- **Validation:** `npm run lint` returns a non-interactive exit code.

### SEC-good — Confirmed effective controls (evidence of absence of common flaws)
- **SSRF guard works in production:** `url` = `http://169.254.169.254/…`, `http://localhost:8080/x`, `file:///etc/passwd`, `https://user:pass@example.com/x` all returned **400** on `/api/stream`; metadata IP returned **400** on `/api/subtitle`. (`lib/api/proxy-guard.ts`)
- **No permissive CORS on the proxies:** `OPTIONS /api/stream` returns 204 with `Access-Control-Allow-Methods/Headers` but **no** `Access-Control-Allow-Origin`.
- **No secrets committed:** a targeted regex scan for `api_key|secret|password|token|bearer` assignments found nothing; `.env` is gitignored (`/.env*` with `!.env.example`), and only `API_BASE_URL` is read.
- **No `NEXT_PUBLIC_` misuse:** the prefix appears nowhere in source.
- **JSON-LD breakout prevented:** `lib/utils/jsonld.ts` escapes `<`, `>`, `&`, U+2028/2029; covered by `lib/utils/jsonld.test.ts`.
- **Untrusted storage hardened:** `lib/storage/sanitize.ts` drops `__proto__`/`constructor`/`prototype` keys and rejects non-object payloads (tested).
- **Error pages safe:** `app/error.tsx` and `app/not-found.tsx` show friendly copy with no stack traces or internal details; `console.error` is the only logging.
- **Security headers present in production:** `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Permissions-Policy`, and the CSP baseline.

---

## Section 4 — Performance findings

> All Core Web Vitals figures are **Lighthouse 13.5.0 lab** measurements against the live production URL on 2026-10-19, using local Chromium. They are **not** field/CrUX data.

### PERF-01 — Mobile Lighthouse performance is poor
- **Route:** `/` (production)
- **Evidence:** Lighthouse mobile: **Performance 37**, LCP 15.0 s, TBT 5,490 ms, FCP 1.7 s, SI 7.3 s, TTI 23.2 s, CLS 0. Desktop: **Performance 62**, LCP 2.7 s, TBT 360 ms, FCP 0.8 s, CLS 0.
- **User-visible impact:** On mid/low-end phones the home page is slow to become interactive; scrolling/interaction is blocked for seconds.
- **Likely root cause:** Large shared JS + heavy style/layout (see PERF-02/03).
- **Optimization:** Cut JS (PERF-02), reduce layout/paint cost (PERF-03), and re-enable HTML edge caching (SEC-02).
- **Expected benefit:** Qualitative: each of the above compounds on TBT/LCP; fixing all three is required for a meaningful gain.
- **Trade-off:** CSP/caching changes need verification against the player.

### PERF-02 — A 212 KB JavaScript chunk is entirely unused on the home page
- **Route/component:** `/` build output; `.next/static/chunks/ed9f2dc4-1b30afa125168b53.js`
- **Status:** ~~Confirmed~~ **NOT APPLICABLE AS STATED (investigated 2026-10-19).**
  Direct inspection of the build shows `ed9f2dc4…js` contains **React DOM +
  `scheduler`** — the App Router client runtime loaded by *every* route — and
  `1255…js` (65.9 KB) is Next's router client runtime. Lighthouse's
  `unused-javascript` heuristic flags React's cold paths, but this is the
  framework baseline, not removable application code. `hls.js` is already
  isolated in its own lazy chunk, `zustand` in a small dedicated chunk, and
  lucide icons are tree-shaken via `optimizePackageImports`. **No
  application-level barrel bloat was found**, so no optimization was applied
  (rather than a speculative one that cannot help).
- **Evidence:** Lighthouse mobile `unused-javascript`: `ed9f2dc4…js` = **212 KB wasted / 212 KB total** (100% unused); `708…js` 34 KB wasted; `1255…js` 32 KB wasted. Build output lists the shared "First Load JS" at 340 KB for every route, with `ed9f2dc4…` at 217 KB reported in the budget table.
- **User-visible impact:** Directly inflates TBT (5,490 ms) and TTI.
- **Likely root cause:** A shared chunk (likely the `motion`/Motion graph and/or lucide/zustand barrel content pulled into the shared First Load bundle) is loaded but not exercised on the home route.
- **Optimization:** Identify the owning module (inspect the chunk source map in a local build), then lazy-load it or move it behind the routes that use it. Verify whether `motion` needs to be in the shared First Load JS or can be code-split to the components that use Motion (`TiltCard`, `TapLink`).
- **Expected benefit:** Qualitative: removing unused KB directly reduces TBT.
- **Trade-off:** Over-splitting can add request waterfalls; measure after change.

### PERF-03 — Heavy `Style & Layout` on mobile (blur/backdrop-filter/gradients)
- **Route/component:** `app/globals.css`, cinematic surfaces (`backdrop-filter`, gradients, 25 keyframes), `SnowLayer` canvas
- **Status:** ~~Confirmed~~ **PARTIALLY FIXED (2026-10-19, unmeasured).**
  Mobile-only (`≤767px`) reductions: `.glass` backdrop blur 20px → 10px, and the
  three ambient blobs 140–150px → 70px blur at 36rem → 22rem. Desktop/tablet
  visuals are unchanged. `SnowLayer` was deliberately left untouched (its
  lifecycle / reduced-motion / idle-throttle safeguards retained) because no
  device evidence justified a change. **Not re-measured** — no browser is
  available in the remediation environment.
- **Evidence:** Lighthouse mobile `mainthread-work-breakdown`: **Other 7,478 ms**, **Style & Layout 6,123 ms**, Rendering 1,761 ms, Script Evaluation 1,569 ms. `app/globals.css` contains ~15 `backdrop-filter`/`blur(` usages and 25 `@keyframes`. Bootup-time attributes 4,957 ms to one chunk and ~7.7 s to `/`.
- **User-visible impact:** Janky scrolling and slow interaction on throttled CPUs, despite `CLS 0`.
- **Likely root cause:** Layered frosted-glass panels and ambient effects force repeated style recalculation/compositing.
- **Optimization:** Audit `backdrop-filter` usage and reduce blur radius on mobile; ensure effects are `transform`/`opacity`-only (the CSS already documents this discipline extensively); gate the heaviest ambient layers behind `@media (pointer:fine)` / viewport size. The `SnowLayer` is already reduced-motion aware and idle-throttled — verify its actual cost on mobile separately.
- **Expected benefit:** Qualitative; Style & Layout is the largest non-script component of TBT.
- **Trade-off:** Reducing blur changes the visual identity — must preserve the Shirayuki aesthetic (see constraints in `DESIGN.md`).

### PERF-04 — `app/icon.png` is 202 KB and served unoptimized
- **Component:** `app/icon.png`
- **Status:** ~~Confirmed~~ **FIXED (2026-10-19).** Re-encoded as 256-colour
  palette PNGs (transparency + artwork preserved; measured mean channel error
  0.89/255). `app/icon.png` **202,660 B → 26,479 B**; `app/apple-icon.png`
  **34,603 B → 7,021 B** (verified via the locally-served bytes). ~203 KB saved
  per visitor.
- **Evidence:** File is **198 KB, 512×512 PNG**; production serves `/icon.png` at **199 KB** (Lighthouse network list). `app/apple-icon.png` is 34 KB (180×180).
- **User-visible impact:** A ~200 KB favicon is downloaded by every visitor; adds to total transfer and competes with the LCP image.
- **Optimization:** Re-export as a smaller, palette-quantised PNG (and/or provide correctly sized icon variants). Next serves `app/icon.png` as-is unless sized appropriately.
- **Expected benefit:** ~180+ KB saved per visitor.
- **Trade-off:** None meaningful.

### PERF-05 — Oversized upstream banner is downloaded on the home page
- **Route/component:** Spotlight hero (upstream `hianime.at` artwork)
- **Evidence:** Lighthouse network list shows a `hianime.at/storage/media/.../black-clover-season-2-1-banne…` request at **243 KB**.
- **User-visible impact:** Large hero payload; if it is the LCP element it delays LCP (mobile LCP 15.0 s).
- **Likely root cause:** Banner source resolution/size; check whether it flows through `next/image` (it should, since `hianime.at` is allowlisted).
- **Optimization:** Confirm the hero uses `<Image>` with an appropriate `sizes` and `quality`, and that AVIF/WebP negotiation is happening. If a plain `<img>` path is used for banners, route it through the optimizer.
- **Expected benefit:** Qualitative reduction of LCP bytes.
- **Trade-off:** Optimizer cost; already mitigated by long `minimumCacheTTL`.

### PERF-06 — HTML routes are not edge-cached in production (compounds all of the above)
- See **SEC-02** (confirmed `no-store` on `/` and `/watch/*`). Every visitor pays a cold render. Classifying here as performance too, because its primary user-visible effect is latency.
- **Optimization:** Resolve the `force-dynamic` vs `headers()` precedence so the intended SWR header is effective.
- **Validation:** `x-vercel-cache: HIT` / `age > 0` on a repeat request.

---

## Section 5 — API and backend findings

### Frontend API routes (audited)
| Route | Methods | Validation | Caching | Notes |
|---|---|---|---|---|
| `/api/stream` | GET, OPTIONS | SSRF guard + referer sanitize | playlist: `s-maxage=60, swr=300`; segment: `max-age=3600` | **Open relay, no rate limit (SEC-01)** |
| `/api/subtitle` | GET, OPTIONS | SSRF guard + referer sanitize | `max-age=86400` | Forces `text/vtt`; body inert |
| `/api/suggest` | GET | `q.length < 2` → empty | `s-maxage=60, swr=300` | Slices to 8 results |
| `/api/sources` | GET | requires `episodeId`+`server`, else 400 | `no-store` | Never returns raw provider payload |
| `/api/search-index` | GET | dedupes by id | `s-maxage=300, swr=600` | Reads cached `getHome` |

### Observable behaviour
- Frontend HTML routes: `cache-control: private, no-cache, no-store, max-age=0, must-revalidate` (**unintended**, SEC-02).
- Hashed static assets: `public,max-age=31536000,immutable` (**correct**).
- Frontend security headers: all present (see SEC-good).

### Upstream API (external, `shirayuki-anime-api-ruby.vercel.app`) — measured only
- `GET /api/v2/hianime` → **200, 1.37 s, 100 KB**.
- `GET /api/v2/hianime/search?q=naruto` → 200, 0.81 s.
- `GET /api/v2/hianime/anime/naruto-1` → 200, 1.02 s.
- `GET /api/v2/hianime/azlist/all` → **404** (endpoint path differs from the frontend's `/browse/:id` usage — the frontend uses `browse`, not `azlist`).
- URL-accepting probes (`/sources`, `/stream`) → **404** (no such external surface exposed).
- Headers: `access-control-allow-origin: *`, `cache-control: no-store, no-cache, must-revalidate`.

### Unverified
- The backend **source repository was not available**: caching strategy, upstream timeouts/retries, rate limiting, concurrency, memory profile, logging, and query patterns are **all unverified**. Response times alone do not establish backend code quality.
- No load testing was performed against production (no authorization / test budget).

### Client-side performance observations
- `lib/providers/hianime/client.ts` implements a 3-attempt retry with jittered backoff, a 15 s/15 s/12 s timeout ladder, `Retry-After` respect (capped 5 s), and non-retry classification for 400/401/403/404 and zod mismatches — solid upstream resilience.
- The watch page walks servers **sequentially** with a 12 s per-attempt deadline (`app/watch/[id]/[ep]/page.tsx`), which is correct (failover is inherently sequential) but bounds the worst-case render time.
- `/api/sources` is `no-store` (correct for ephemeral tokens).

---

## Section 6 — Code quality and architecture

**Strengths**
- Clean layering: `lib/providers/hianime` (schemas → mappers) behind `lib/api` facade; components only see normalized models (`lib/providers/types.ts`).
- Runtime validation with zod on every provider payload; deterministic schema mismatches are not retried.
- Thoughtful concurrency primitives (`safe`, `withTimeout`) isolated in a provider-free module for testability.
- Untrusted-input discipline for `localStorage` (`lib/storage/sanitize.ts`) with tests.
- Extensive, high-signal code comments documenting *why* (e.g. the cache header rationale, SSRF guard residuals, motion trade-offs).
- Accessibility is a real strength: Lighthouse a11y **100**; the drawer uses `role="dialog"`, `aria-modal`, Escape-to-close, and focus management (`components/layout/NavDrawer.tsx`).

**Issues**
1. **Dead dependency:** `headroom-ai` is declared with zero usage — **REMOVED (2026-10-19).**
2. **Broken linting / no CI:** see SEC-05. — **FIXED (2026-10-19).**
3. **Deployment/config drift:** the `headers()` cache rules do not take effect (SEC-02) — a documented intent that silently fails. This class of bug needs a production verification step. — **FIXED for `/` + post-deploy `verify:cache` script added.**
4. **Client-component weight:** 27 `"use client"` files; `Player.tsx` is 1,249 lines and `Spotlight.tsx` 656 lines — large but cohesive. Watch for bundle growth around Motion. — unchanged.
5. **Duplication with drift risk:** `RankedGrid` (grid class string) and `RankedGridSkeleton` mirror the same column tiers in two files; a mismatch would cause skeleton→content layout shift. Low risk today, worth documenting. — unchanged.
6. **No E2E / integration tests** for the critical playback path (failover, SSRF proxy, stream rewrite). — **PARTIALLY ADDRESSED:** pure cores now unit-tested (rate limiter, playlist rewrite, size caps); route-level/E2E still open.
7. `npm outdated` shows several majors behind (`next` 15→16, `react` 19.2→19.3 available, `zod` 3→4, `typescript` 5.9→7.0) — validate before upgrading; zod 4 in particular is a breaking change. — unchanged (no upgrades made).

**Unsafe typing:** none found — no `any`, `as any`, or `<any>` in `app/`, `components/`, or `lib/`.

---

## Section 7 — Metrics and test results

### Commands run (all read-only / safe)
```
node -v ; npm -v                          # v26.7.0 / 11.19.0
npm run typecheck                         # exit 0
npm test                                  # 51 tests, 51 pass, 0 fail
npm run build                             # exit 0  (see bundle table)
npm audit --json                          # 0 vulnerabilities (info/low/mod/high/crit all 0)
npm outdated                              # versions listed in §6
npm run lint                              # BROKEN — interactive prompt (documented)
curl -sI https://shirayuki-livid.vercel.app/            # headers, cache
curl -sI https://shirayuki-livid.vercel.app/watch/one-piece-1/ep-1
curl ... /api/stream?url=...              # SSRF probes (all 400 for private/file/cred)
curl ... /api/subtitle?url=...            # SSRF probe (400 for metadata IP)
lighthouse <prod>/ --preset=desktop --output=json
lighthouse <prod>/ --form-factor=mobile --output=json
```

### Build output (production, local)
```
Route (app)                     Size     First Load JS
/                               12.4 kB  426 kB
/anime/[id]                     214 B    411 kB
/watch/[id]/[ep]                7.17 kB  417 kB
/schedule                       209 B    414 kB
/search, /genre, /category, /az 141 B    410 kB
/watchlist                      3.85 kB  363 kB
Shared First Load JS            340 kB
  chunks/ed9f2dc4…js            217 kB
  chunks/1255…js                65.9 kB
  chunks/4bd1b696…js            54.2 kB
```
`npm run build` output directory: `.next`; total `static/chunks` ≈ **2.8 MB across 53 JS files**.

### Lighthouse 13.5.0 (production, local Chromium, 2026-10-19)
| Category | Desktop | Mobile |
|---|---|---|
| Performance | **62** | **37** |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 92 | 92 |
| LCP | 2.7 s | **15.0 s** |
| CLS | 0 | 0 |
| TBT | 360 ms | **5,490 ms** |
| FCP | 0.8 s | 1.7 s |
| Speed Index | 2.9 s | 7.3 s |
| TTI | 2.8 s | 23.2 s |

**SEO 92** is likely penalised by the `noindex` watch route and/or metadata; not investigated further.

### Dependency scan
- `npm audit`: **0 vulnerabilities** (informational/low/moderate/high/critical all 0). Production deps 29, dev 43, total 110.
- Vulnerability reachability was not separately analysed because there were no advisories to reach.

### Passed / failed / skipped / not run
- **Passed:** typecheck, 51 unit tests, production build, npm audit (clean), SSRF probes, CORS probe, header checks.
- **Failed/Broken:** `npm run lint`.
- **Not run:** E2E/integration tests (none exist); load testing (not authorised); backend source audit (repo unavailable); CrUX/field data (unavailable); Vercel dashboard inspection (no access).

### Limitations
- Lighthouse is a **lab** result on a throttled emulation, not field data; absolute numbers vary by run and network.
- The upstream API's 404s for `/azlist/all` etc. reflect **path differences**, not necessarily missing functionality.

---

## Section 8 — Prioritized remediation roadmap

> **STATUS (2026-10-19):** items 1, 2, 5, 6, 7 and the dead-dependency item are
> **DONE**; item 4 (JS) was **investigated and found not applicable** (framework
> baseline); item 3 was **partially done** (mobile blur reductions, unmeasured);
> item 8 (CSP `script-src`) remains **blocked** by the edge-cache/nonce conflict.

### P0 — Immediate
*(No confirmed critical security or reliability defect requiring immediate hotfix. The items below are the highest-leverage fixes and should start immediately.)*
- **SEC-02 / PERF-06** — ~~Make the `/` and `/watch/*` cache headers actually effective~~ **DONE for `/`**; `/watch/*` documented as intentionally dynamic. Verify with `curl -sI` (or `npm run verify:cache`) post-deploy.

### P1 — High priority
- **SEC-01** — ~~Add rate limiting + size/concurrency ceilings to `/api/stream` and `/api/subtitle`~~ **DONE** (set Upstash env vars for global enforcement).
- **PERF-02** — ~~Eliminate the 212 KB unused JS chunk~~ **N/A: verified to be the React DOM framework baseline.**
- **PERF-01 / PERF-03** — **PARTIALLY DONE** — mobile blur/ambient reductions applied; **re-measure** on a preview.
- **SEC-03** — Constrain upstream API CORS + add rate limiting (still requires backend repo access — **OPEN**).

### P2 — Medium priority
- **PERF-04** — ~~Shrink `app/icon.png`~~ **DONE** (202 KB → 26 KB; 34 KB → 7 KB).
- **SEC-05** — ~~Fix linting and add CI~~ **DONE** (ESLint CLI + GitHub Actions + bundle budget).
- **Code quality** — ~~Remove the dead `headroom-ai` dependency~~ **DONE**.
- **SEC-04** — ~~Add nonce-based `script-src`~~ **PARTIALLY DONE** (all non-script directives enforced; script policy report-only; enforcement blocked by edge cache).
- **Testing** — **PARTIALLY DONE** — 25 unit tests added (rate limiter, playlist rewriting, size caps, cache config); route-level/E2E playback tests remain **OPEN** (needs an alias-resolving harness).

### P3 — Optional polish
- **PERF-05** — ~~Verify hero banner optimization path~~ **VERIFIED correct** (`next/image` + `priority` + server preload). No change needed.
- Address Lighthouse **SEO 92** if the penalty is unintended.
- Document the `RankedGrid`/`RankedGridSkeleton` column-tier coupling.
- Plan dependency upgrades (Next 16, zod 4, TypeScript 7) as a coordinated, tested effort — not piecemeal.

---

## Section 9 — Recommended next steps

Implementation sequence that minimizes regressions:

1. **Instrument before changing.** Add a production-cache assertion (a tiny script or CI step running `curl -sI` against the deployed URL) so SEC-02 cannot silently regress again. Establish a Lighthouse baseline run committed to CI.
2. **Fix caching (SEC-02).** Decide the intended behaviour, implement where Next honours it, and gate with step 1's assertion. Do not change `force-dynamic` blindly — the code comment in `app/page.tsx` explains why ISR was rejected (a flaky upstream baking a bad page).
3. **Add rate limiting (SEC-01).** Start with a platform-level rule (cheapest, no code change), then add an HMAC-signed URL scheme if abuse continues. Test with bounded bursts only.
4. **Cut JS (PERF-02).** Analyze the chunk in a local build, lazy-load the offending module, and re-run Lighthouse after each change. Keep a bundle-size budget in CI.
5. **Reduce style/layout cost (PERF-03).** One surface at a time, verifying the design language is preserved; re-measure TBT after each.
6. **Fix icons (PERF-04)** and remove the dead dependency — trivial, independent.
7. **Stand up CI (SEC-05)** running `typecheck`, `test`, `lint`, `build`, and the production-header assertion.
8. **CSP (SEC-04)** last, behind a preview deploy with manual playback verification, because a strict `script-src` can break hls.js and the player.

Dependencies between fixes:
- SEC-02 verification depends on step 1's assertion tooling.
- SEC-04 depends on a working preview pipeline (step 7 helps).
- PERF-02/PERF-03 measurements should be taken **after** SEC-02 is fixed, otherwise LCP comparisons are confounded by the render-cache miss.

Tests to add before significant refactoring:
- Integration tests for `/api/stream` playlist rewriting + SSRF rejections (the unit tests exist in `lib/api/proxy-guard.test.ts`; add route-level tests).
- A playback failover test harness (source dies → next server → timestamp restored).
- A cache-header regression test in CI.

---

## Section 10 — Audit limitations

**Repositories available**
- **Frontend** (`Shirayuki`, this repo): fully inspected.
- **Backend** (`shirayuki-anime-api-ruby`): **NOT available**. Only externally observable behaviour (headers, status codes, response times) was measured. Its source, dependencies, caching, rate limiting, logging, and error handling are **unverified**.

**Files and routes inspected**
- Config: `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `package.json`, `package-lock.json`, `.gitignore`, `.env` (values redacted).
- App: `app/layout.tsx`, `app/page.tsx`, `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`, `app/robots.ts`, `app/anime/[id]/page.tsx`, `app/watch/[id]/[ep]/page.tsx`, all five `app/api/**/route.ts`.
- Lib: `lib/api/proxy-guard.ts`, `lib/api/index.ts`, `lib/api/concurrency.ts`, `lib/providers/hianime/client.ts`, `lib/providers/hianime/index.ts`, `lib/providers/hianime/mappers.ts`, `lib/providers/hianime/schemas.ts`, `lib/utils/jsonld.ts`, `lib/storage/sanitize.ts`.
- Components: `components/player/Player.tsx`, `components/home/Trending.tsx`, `components/home/Spotlight.tsx`, `components/layout/NavDrawer.tsx`, `components/layout/SnowLayer.tsx`, `components/ui/SmartImage.tsx`, `components/anime/*`.
- Tests: all 9 `*.test.ts` files (listed in §7).

**Commands run:** see §7. All were read-only or safe single-request probes. No mutations, no load tests, no dependency changes, no deployments.

**Live checks performed:** production headers for `/`, `/watch/*`, `/genre/*`, a hashed asset, `/api/stream` (SSRF + relay + CORS), `/api/subtitle` (SSRF), `/api/suggest`, `/api/search-index`, `/api/sources`; upstream API timing for 3 endpoints. Lighthouse desktop + mobile against production.

**Real-user performance data:** **Not available** (no CrUX access). All CWV numbers are Lighthouse lab results.

**Deployment settings:** Vercel **dashboard settings were not accessible**; only response headers were observable. Claims about edge-cache behaviour are based on observed responses, not dashboard configuration.

**Conclusions that remain unverified**
- Backend code quality, caching, and rate limiting (repo unavailable).
- Whether the 212 KB unused chunk is `motion`, a lucide barrel, or another module (needs a local source-map inspection).
- Whether the 243 KB hero banner is a plain `<img>` or `next/image` in the live build (the code path suggests `next/image`, but this was not confirmed against the production network waterfall in detail).
- The exact Vercel plan/region configuration and serverless limits.

**Security testing boundary:** This was a **static review + safe, non-destructive live probing**, not a penetration test. No exploitation, fuzzing, load testing, or destructive operations were performed. The absence of a found vulnerability in a given area is **not** proof of its absence.

---

*End of report.*
