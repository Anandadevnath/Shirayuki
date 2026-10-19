# Shirayuki — Security Audit & Project Health Report

**Audit type:** Read-only security & reliability audit (audit-only; no source changes made)
**Date:** 2026-10-19
**Branch inspected:** `feat/favicon-logo` (HEAD `c7057bb`)
**Working tree at audit start:** clean except untracked `.github/` (the CI workflow file, not yet committed)
**Auditor method:** static code inspection + existing test/typecheck/lint/build tooling only. No attack traffic was sent to production or to upstream streaming providers.

> **Scope note.** Only this `REPORT.md` was created. No application source, config, dependency, test, or workflow file was modified. Every claim below is backed by a file/line reference or a command whose output is recorded in §G.

---

## A. Executive Summary

**Overall assessment: the project is in a good security posture for its threat model, with a small number of real, well-bounded issues and several hardening gaps. The available evidence supports considering it *reasonably secure for a public, unauthenticated, read-mostly streaming front-end* — but not "audit-clean," and not a guarantee.**

The two highest-risk surfaces in an app like this are (1) the first-party media proxies (`/api/stream`, `/api/subtitle`), which are caller-controlled SSRF/open-proxy sinks, and (2) untrusted upstream data flowing into the DOM. Both are handled with deliberate, tested controls:

- The proxy routes funnel every caller-supplied URL — including **every redirect hop** — through `lib/api/proxy-guard.ts`, which rejects non-http(s) schemes, credentials, single-label hosts, blocked suffixes (`.internal`, `.local`, …), and any host that resolves to a private/loopback/link-local/CGNAT/metadata address. This is covered by **13 unit tests** (`lib/api/proxy-guard.test.ts`), including redirect-into-private-space and stalled-upstream cases.
- The one untrusted-data → DOM sink (`JSON-LD` via `dangerouslySetInnerHTML`) is escaped by `lib/utils/jsonld.ts` (escapes `<`, `>`, `&`, U+2028/9), with 4 dedicated tests. No `eval`, `new Function`, `innerHTML`, or `document.write` exists anywhere in `app/`, `components/`, or `lib/`.
- `localStorage` is treated as untrusted everywhere via `lib/storage/sanitize.ts` (prototype-pollution + shape guards), with tests.
- No authentication, sessions, or cookies exist — so entire classes of findings (auth bypass, CSRF, session fixation, cross-user cache leakage) are structurally out of scope, and the app is a fully public, local-first client.

**Most important risks (all Medium or lower — no confirmed Critical/High):**

1. **No rate limiting anywhere in the app.** The SSRF-guarded proxies are still an open relay *by design* (arbitrary public URLs are fetched on the server's behalf). There is no per-IP/per-route throttle, so the deployment can be used to amplify bandwidth and to proxy arbitrary public content at the owner's cost. `proxy-guard.ts` explicitly names platform egress as the only remaining defense (the code was reverted away from a rate-limit helper — see §C/SEC-01).
2. **Unbounded playlist/subtitle response buffering.** `/api/stream` reads HLS playlists with `res.text()` (line 106) and `/api/subtitle` reads the whole VTT body with `res.text()` (line 57) with **no byte cap**. A hostile/compromised upstream could return a multi-GB body and exhaust serverless memory. (Verified: no `readTextWithinLimit`/size guard exists in the current tree.)
3. **DNS rebinding (TOCTOU) window in the SSRF guard** — documented in the guard itself (`proxy-guard.ts:20-23`). `validateProxyUrl` resolves DNS, then `fetch` re-resolves; an attacker controlling DNS can flip a name between public and private between the two events. Partly mitigated by Vercel egress rules, but not closed in code.

**Limitations and unknowns.** This audit is static. Findings that depend on runtime behavior — real HLS playback across providers, actual browser enforcement of the CSP against hls.js/blob URLs, live cache-header behavior at the edge, and the exact upstream identity of the Ruby API — are **not verified** and are flagged as such in §C/§D/§G. The production deployment (`shirayuki-livid.vercel.app`) was **not** probed.

---

## B. Project Overview

### Architecture

- **Framework:** Next.js 15.5.28 (App Router, React Server Components), React 19.2, TypeScript 5.7+ (strict), Tailwind v4, `zod` for upstream validation, `zustand` for client prefs, `hls.js` 1.6 for playback, `motion` v14 for a second animation system. Node `24.x` pinned; npm only (`package-lock.json`).
- **Data flow:** Components only see normalized models in `lib/providers/types.ts`. Raw upstream shapes are validated by zod schemas (`lib/providers/hianime/schemas.ts`) and normalized by mappers (`mappers.ts`). `lib/api/index.ts` is the single facade, wrapping provider calls in React `cache()` so `generateMetadata` + page render fetch once. All calls go through `safe()` → typed `Result`.
- **Routes:** Browse under `app/(browse)/` (az, category, genre, schedule, search); detail `app/anime/[id]/`; player `app/watch/[id]/[ep]/`; local-only `app/watchlist/`. Legal pages `/terms`, `/privacy`, `/dmca`.
- **API routes:** `/api/stream`, `/api/subtitle` (SSRF-guarded proxies), `/api/suggest`, `/api/search-index`, `/api/sources` (client-side mid-playback failover resolver). There is **no `/api/schedule`** (the README mentions one; the schedule is fetched server-side in `app/(browse)/schedule/page.tsx`).
- **No middleware file exists** (`find . -name middleware.ts` → none). Security headers are applied globally via `next.config.ts` `headers()`.

### Streaming architecture (summary; detail in §D)

1. `app/watch/[id]/[ep]/page.tsx` server-resolves servers (`getServers`, `noStore`) and walks candidate servers **sequentially** (`for … of ordered`) calling `getSources` under a 12 s deadline each, taking the first that resolves.
2. The resolved `.m3u8` + `referer` are wrapped as `/api/stream?url=…&referer=…`.
3. `Player.tsx` (loaded `ssr:false` via `PlayerLoader.tsx`) attaches hls.js, or falls back to native HLS on Safari.
4. `/api/stream` fetches upstream with the required `Referer`/`User-Agent`, **rewrites playlist URIs** back through itself, and streams segments/keys/init preserving range semantics.
5. On fatal playback failure, `lib/player/recovery.ts` bounds retries (2 network, 1 media); exhaustion triggers `failoverToNext()` → `/api/sources` (no-store) → swaps source without navigation, preserving timestamp.

### Security controls already present

| Control | Location | Status |
|---|---|---|
| SSRF guard (scheme/host/DNS/redirect-hop) | `lib/api/proxy-guard.ts` | Present, tested (13 tests) |
| Referer sanitization (no CRLF/credentials) | `proxy-guard.ts:172` | Present, tested |
| Bounded redirects (max 3) + per-hop timeout (15 s) | `proxy-guard.ts:33, 201` | Present, tested |
| No wildcard CORS on proxies | `stream/route.ts:18-31`, `subtitle/route.ts:6-17` | Present |
| CSP + security headers (HSTS, nosniff, frame-ancestors, Permissions-Policy) | `next.config.ts:92-146` | Present |
| JSON-LD XSS escaping | `lib/utils/jsonld.ts` | Present, tested (4 tests) |
| localStorage as untrusted (proto-pollution guards) | `lib/storage/sanitize.ts` | Present, tested |
| zod validation + field-drift mappers | `lib/providers/hianime/{schemas,mappers}.ts` | Present |
| Image host allowlist (no `**` wildcard) | `next.config.ts:12-68` | Present |
| `/watch/*` + `/api/*` noindex | `app/robots.ts` | Present |
| CI gates (lint, typecheck, test, build, bundle, prerender) | `.github/workflows/ci.yml` | Present but **untracked** and only triggers on `main`/`master` |

### Areas not inspected / not inspectable

- The upstream Ruby API (`API_BASE_URL`, value redacted) — its own security is out of scope.
- Runtime edge/CDN cache behavior on Vercel (no live probing performed).
- Browser-enforced CSP behavior against real hls.js playback (see §D).
- `headroom-ai` is declared in `package.json` but is a **dead dependency** (zero usage in `app/`, `components/`, `lib/` — confirmed by grep), so it was not analyzed.

---

## C. Security Findings

Severity legend: **Critical / High / Medium / Low / Informational**. "Status": Confirmed (proven by code) · Suspected (code-consistent, unproven at runtime) · Unverified (needs runtime/live testing).

| ID | Severity | Area | Finding | Evidence | Status |
|---|---|---|---|---|---|
| SEC-01 | Medium | Abuse / DoS | No rate limiting on any route, incl. SSRF-guarded proxies that fetch arbitrary public URLs | `grep -rn "rateLimit\|rate-limit" app lib` → only a comment; `proxy-guard.ts:20-23` names platform egress as the last defense | Confirmed |
| SEC-02 | Medium | DoS / resource exhaustion | Unbounded response buffering on playlist and subtitle bodies (`res.text()` with no byte cap) | `app/api/stream/route.ts:106`; `app/api/subtitle/route.ts:57` | Confirmed |
| SEC-03 | Medium | SSRF (residual) | DNS rebinding TOCTOU between `validateProxyUrl` DNS check and the actual `fetch`; connection not pinned to validated IP | `lib/api/proxy-guard.ts:20-23, 113-126, 221` | Suspected (documented by author) |
| SEC-04 | Low | Open proxy / trust | Proxies fetch caller-supplied *public* URLs by design → open relay for third-party content & bandwidth amplification | `app/api/stream/route.ts`, `app/api/subtitle/route.ts`, guard is "open-proxy constraints" not allowlist | Confirmed |
| SEC-05 | Low | Cache / correctness | `/api/stream` caches rewritten playlists `public, s-maxage=60` keyed only on URL; a signed URL is stable within its TTL so this is fine, but the cached body embeds the caller-supplied `referer` in rewritten URIs | `app/api/stream/route.ts:116`, `proxied()` at 33-38 | Confirmed (low impact) |
| SEC-06 | Low | Header hygiene | `Origin` header forwarded to upstream is derived from the *caller-supplied* referer (`new URL(referer).origin`) | `stream/route.ts:77-80`, `subtitle/route.ts:41-44` | Confirmed (sanitized, low impact) |
| SEC-07 | Low | CSP | `img-src … https:` allows images from any HTTPS host (by design, to support rotating CDNs) | `next.config.ts:126` | Confirmed |
| SEC-08 | Low | CSP | `script-src 'self' 'unsafe-inline'` (no nonce/hash) weakens XSS defense-in-depth | `next.config.ts:125` | Confirmed |
| SEC-09 | Low | Supply chain | 5 `high` npm advisories in the dev/lint toolchain (`braces` → `micromatch` → `fast-glob` → `@next/eslint-plugin-next` → `eslint-config-next`), all `dev: true` — not shipped | `npm audit`; package-lock shows all five `dev: true` | Confirmed (dev-only) |
| SEC-10 | Low | CSP / config drift | `next.config.ts` comment (lines 141-144) claims "No `Cache-Control` rules here" and cites route-level `revalidate = 60`; `AGENTS.md` claims a `headers()` rule exists for `/` and `/watch/*`. The config has no such rule; the code is correct but the docs contradict each other | `next.config.ts:141-144` vs `AGENTS.md`; build table shows `/` `Revalidate 1m` | Confirmed (documentation) |
| SEC-11 | Low | CI / process | The CI workflow that gate-keeps lint/typecheck/test/build is **untracked** and only triggers on `main`/`master`, while work happens on feature branches | `.github/workflows/ci.yml:11-12`; `git status` shows `.github/` untracked | Confirmed |
| SEC-12 | Informational | AuthZ | No authentication/authorization/session/cookie layer exists | `grep` for cookies/session/NextAuth → none in app code | Confirmed (by design) |
| SEC-13 | Informational | Headers | `Content-Security-Policy-Report-Only` not used; no `report-to`/`report-uri` | `next.config.ts:118-133` | Confirmed |
| SEC-14 | Informational | Secrets | Only `API_BASE_URL` (server-only) and `DEBUG_API` are read; no `NEXT_PUBLIC_` secrets; `.env` gitignored | `grep process.env` → `API_BASE_URL`, `DEBUG_API`, `NODE_ENV` | Confirmed |

### Detail on the non-trivial findings

**SEC-01 — No rate limiting (Medium, Confirmed).**
`grep -rn "rateLimit\|RATE_LIMIT\|rate-limit" app lib` returns only a comment in `lib/providers/hianime/client.ts:69` about *upstream* rate limiting. No per-IP/per-route throttle exists on `/api/stream`, `/api/subtitle`, `/api/suggest`, `/api/sources`, or `/api/search-index`. Combined with SEC-04 (open relay), any party can drive arbitrary public fetches and bandwidth through the deployment. On Vercel this is bounded by platform protections and function budgets, but within those bounds it is exploitable for cost amplification and to relay third-party content. **Note:** an earlier remediation added a rate-limit helper (`lib/api/proxy-responses.ts`) but commit `8eabdcd revert(stream): restore known-good proxy routes` removed it; that module does not exist in the current tree (verified). This is a deliberate rollback, not an oversight — flag it before re-adding so playback isn't broken.
- *Impact:* bandwidth/cost amplification; open-relay abuse; noisy-neighbor degradation.
- *Attack scenario:* an attacker loops `/api/stream?url=<large public file>` to burn egress, or relays arbitrary content with `Referer` spoofing.
- *Remediation:* add a lightweight per-IP sliding-window limit at the edge (Vercel WAF / middleware) or an in-memory limiter in the routes; keep it *outside* the playlist-rewrite path so VOD segment fetching (many requests per title) is not throttled into stutter.
- *Risk of fixing:* **High** if placed naively — HLS playback issues hundreds of segment requests; a per-request IP limit will break playback. Must be scoped (e.g., manifest requests only) or generous.

**SEC-02 — Unbounded body buffering (Medium, Confirmed).**
`/api/stream` line 106 and `/api/subtitle` line 57 both call `await res.text()` with no size ceiling. A malicious or compromised upstream (or an attacker-supplied public URL that itself returns a huge body) can force the serverless function to buffer an arbitrarily large string into memory.
- *Impact:* memory exhaustion / function crash (DoS), inflated billing.
- *Remediation:* read the body with a bounded reader (cap playlist at e.g. 5–10 MB — playlists are tiny; cap VTT similarly), aborting past the limit with a 502.
- *Risk of fixing:* **Low** for playlists/subtitles (both are text and small); segments are streamed already and must stay streamed.

**SEC-03 — DNS rebinding TOCTOU (Medium, Suspected/document-documented).**
`validateProxyUrl` resolves the hostname (`resolvesToPublic`, cached 60 s) and *then* `fetch` resolves it again independently. An attacker with control of an authoritative DNS answer can return a public IP for the validation lookup and a private IP for the connection. The guard's own header comment acknowledges this and relies on platform egress rules. The 60 s DNS cache slightly *reduces* the window for the cached name but re-introduces staleness.
- *Impact:* reach internal services / cloud metadata from the proxy, if the platform does not block egress.
- *Remediation:* pin the connection to the validated IP (custom `undici` dispatcher/`lookup`), or rely on an egress firewall. This is a defense-in-depth item, not a confirmed exploit.
- *Risk of fixing:* **Medium** — custom dispatchers can break connections to CDNs with virtual hosting / TLS SNI; test against real streams.

**SEC-04 — Open relay by design (Low, Confirmed).**
The guard is explicitly an "open-proxy constraint" model, not a hostname allowlist (`proxy-guard.ts:8-11`), because stream hosts rotate. This is a reasonable design choice, but the consequence is that the deployment will fetch any public URL. Combined with SEC-01 this is the main abuse vector.
- *Remediation:* consider restricting to observed provider/CDN host families if the rotation set turns out to be finite (it is *stated* to be non-finite); otherwise mitigate via rate limiting + egress monitoring.
- *Risk of fixing:* **High** — a closed allowlist has historically broken playback when upstream CDNs rotate (the codebase's comments repeatedly warn about this).

**SEC-05 — Playlist cache embeds caller referer (Low, Confirmed).**
`rewritePlaylist` writes `&referer=<caller-supplied>` into every proxied URI, and the playlist response is `public, s-maxage=60`. Two callers passing the *same* `url` but *different* `referer` share one cache key (the key is the URL) → the first writer's referer is reused for the second within 60 s. In practice the referer is normally derived from the same source, so impact is minor.
- *Remediation (optional):* include a hash of the referer in the cache key, or use `private` caching for playlists.

**SEC-07 / SEC-08 — CSP breadth (Low, Confirmed).**
`img-src 'self' data: blob: https:` and `script-src 'self' 'unsafe-inline'` are deliberate: rotating poster CDNs and Next's inline hydration/flight scripts. `unsafe-inline` script-src is the standard next/image + App Router tradeoff. A nonce-based policy is documented as a future step but conflicts with the shared edge cache (one nonce per cached response). **Do not "fix" this casually** — removing `'unsafe-inline'` breaks hydration, and removing `https:` from img-src breaks posters.

**SEC-10 — Documentation drift (Low, Confirmed).**
`next.config.ts:141-144` says there are no `Cache-Control` rules and points to `revalidate = 60`; `AGENTS.md` states there *is* a `headers()` rule on `/` and `/watch/:path*` with `s-maxage=60, stale-while-revalidate=300`. The **code** uses the route-level `revalidate = 60` (`app/page.tsx:24`) and the build output confirms `Revalidate 1m`. The `AGENTS.md` description is stale. This is a docs issue, not a code defect — but it can mislead a future change.

**SEC-11 — CI not on the branch / not tracked (Low, Confirmed).**
`.github/workflows/ci.yml` runs `lint`, `typecheck`, `test`, `build`, bundle-size and prerender checks — a strong gate — but it is **untracked** (`git status`: `Untracked files: .github/`) and triggers only on `main`/`master`. On the active `feat/favicon-logo` branch (and any PR targeting a non-main base until committed), the gate does not run.

**SEC-12 — No auth (Informational).** The app is fully public and local-first; there are no cookies, sessions, or server-side user data. CSRF/session/authz findings are therefore N/A. Watch list and progress are `localStorage`-only.

**SEC-09 — Dependency advisories (Low, dev-only).** `npm audit` reports 5 `high` advisories, all in the ESLint toolchain (`braces` stack-exhaustion DoS). All five packages are `dev: true` in `package-lock.json`, so none ship in the runtime or client bundle. `npm audit fix --force` would downgrade `eslint-config-next` to 14.x (breaking) — **do not run it**; wait for an upstream bump instead.

### Not considered vulnerabilities (checked, fine)

- **JSON-LD injection** — correctly escaped; tested. ✔
- **XSS sinks** — none: no `eval`, `new Function`, `innerHTML`, `outerHTML`, `document.write` in app code. ✔
- **Prototype pollution via localStorage** — guarded by `lib/storage/sanitize.ts` + per-store shape validation (`lib/progress/local.ts:33-52`). ✔
- **Image SSRF** — `remotePatterns` uses explicit hosts + bounded `**.` subdomain patterns, no bare `**` (`next.config.ts:65-68`). ✔
- **Path traversal** — route params are passed through `encodeURIComponent` into provider URLs; `safeDecode` guards malformed segments (`watch/[id]/[ep]/page.tsx:28-34`). ✔
- **External links** — Footer social links use `rel="noreferrer"` (`Footer.tsx:28`). ✔

---

## D. Streaming Player Assessment

### Architecture (as inspected)

- `Player.tsx` (client, `ssr:false`) imports hls.js dynamically inside the attach effect (line 237), so hls.js stays out of the initial bundle.
- HLS configured with `enableWorker`, `capLevelToPlayerSize`, bounded buffers, and an ABR bandwidth prior (lines 241-263). Native Safari fallback at line 322-325.
- Recovery is bounded via `lib/player/recovery.ts` (2 network / 1 media retries) so a dead source can't loop `startLoad()` forever — **tested** (`recovery.test.ts`, 6 tests).
- A 20 s startup watchdog (`PLAYBACK_STARTUP_BUDGET_MS`, line 55) guarantees the player leaves "Loading…" via failover or terminal error.
- Mid-play failover resolves the next server through `/api/sources` (no-store) and swaps `activeSrc` without navigation, restoring timestamp (`resumeAtRef`).
- Cleanup: the attach effect returns a teardown that calls `hls.destroy()` and clears `hlsRef` (lines 329-334); all listeners/timers I checked have matching cleanups.

### Security / reliability findings

| ID | Severity | Finding | Evidence | Status |
|---|---|---|---|---|
| PLR-01 | Low | Client fetch to `/api/sources` and `/api/subtitle` carry no CSRF/same-origin token — acceptable because there is no auth and no state change; but `/api/sources` is a no-store upstream proxy that can be driven in a loop by a page | `Player.tsx:158`; `sources/route.ts:35` | Confirmed (low) |
| PLR-02 | Low | `failoverToNext` recursion is guarded by `triedRef` + `switchingRef`, so it terminates; but each failed candidate issues a network request serially with no backoff beyond the provider's own retry policy | `Player.tsx:131-186` | Confirmed (bounded) |
| PLR-03 | Informational | Runaway loop risk is mitigated: `nextRecovery` exhausts deterministically and `triedRef` marks each server tried once — no ping-pong | `recovery.ts:42-61`, `Player.tsx:138-150` | Confirmed (healthy) |
| PLR-04 | Unverified | CSP compatibility with real playback: `media-src 'self' blob:` and `connect-src 'self'` assume all HLS traffic goes through `/api/stream` and hls.js's worker uses blob. If hls.js ever fetches a segment/level directly cross-origin, CSP would block it | `next.config.ts:127-131`; `Player.tsx:242` (`enableWorker:true`) | Unverified — needs browser test |

### Potential CSP / proxy / CORS / caching conflicts

- **CSP ↔ hls.js worker**: `enableWorker: true` uses a Web Worker; `worker-src 'self' blob:` is present, which *should* cover it, but the interaction with hls.js's blob worker URL is a **real-browser** question. Not verified here.
- **CSP ↔ native Safari HLS**: Safari ignores `media-src` for native HLS in some versions; `media-src 'self'` is *intended* to allow the same-origin proxy URL, which is correct, but needs device testing.
- **CORS**: proxies deliberately send no `Access-Control-Allow-Origin`; all consumers are same-origin. This is correct and is a security *feature* (not a bug). Do **not** add permissive CORS.
- **Caching**: playlist responses are shared-cached 60 s (SEC-05). Segments are `public, max-age=3600`. Signed URLs rotate, so the practical window is short.

### Flows inspected
Server-side source resolution + failover loop; `/api/stream` playlist rewrite (variant playlists, `#EXT-X-KEY`/`#EXT-X-MAP` `URI="…"` attrs, bare segment lines); range/`206` passthrough; subtitle proxy + `WEBVTT` preamble; hls.js attach/destroy; recovery state machine; startup watchdog; mid-play failover; timestamp restore; native Safari path.

### Browser / provider tests that remain necessary (NOT performed)
1. Real playback on Chrome/Firefox/Safari against at least one live provider — confirm CSP does not block the hls.js worker or any direct fetch.
2. Confirm `media-src`/`connect-src` behavior under native Safari HLS.
3. Confirm the failover loop preserves timestamp on a genuinely dead source.
4. Confirm playlist caching does not serve a stale signed URL past expiry.

### ⚠️ Changes that could break playback (do not make casually)
- Any hostname allowlist tightening on the proxies (breaks when CDNs rotate).
- Adding per-request rate limits (segment floods → stutter).
- Changing/removing `script-src 'unsafe-inline'` (breaks hydration), `media-src`/`connect-src` (breaks HLS), or `worker-src` (breaks the hls worker).
- Altering `rewritePlaylist` or the referer forwarding (streams 403).
- Swapping `force-dynamic` → ISR on `/watch/*` (frozen dead signed URLs).

---

## E. Design and Stability Assessment

Evidence: a parallel read-only code review of layout/CSS/components plus the build output.

**Confirmed defect**
- **DS-01 (Low–Medium) — `components/layout/SnowLayer.tsx:73-81`: duplicate RAF chain on tab re-show.** `onVisibility` schedules `requestAnimationFrame(frame)` on becoming visible **without cancelling any pending frame**; `frame()` self-schedules the next RAF. If visibility toggles, two chains can run against one canvas; the single `raf` variable can only track one chain head, and `running` is re-set on show (reviving orphans). Doubling per-frame paint cost. This is a logic-level defect, reachable on tab visibility change. Not player-related.

**Suspected / minor**
- **DS-02 (Low) — `components/search/CommandPalette.tsx`: `aria-modal="true"` asserted without a focus trap or focus-return.** Unlike `NavDrawer.tsx` (which has a complete trap + restore), Tab can leave the palette into the page behind. The Nav search trigger also lacks `aria-haspopup`/`aria-expanded`. Accessibility gap, not a crash.
- **DS-03 (Informational) — `components/home/Spotlight.tsx:284`: hard `max-h-[1120px]` hero ceiling.** Intentional cap; noted as design intent, no observed clipping.

**Healthy (no action suggested)**
- Hydration: the only pre-hydration DOM write is the inline `data-anim` script, correctly covered by `<html suppressHydrationWarning>` and a `<noscript>` fallback (`app/layout.tsx:116-143`). `useMediaQuery`/`useReducedMotion` seed `false` for SSR parity. `Footer` is a Server Component (no client `Date` drift). No `Date.now()`/`Math.random()` in render paths.
- Listener/timer/RAF/observer cleanup: verified correct across Player, SnowLayer (except DS-01), NavDrawer, CommandPalette, reveal-observer, ScheduleCalendar, Spotlight, LatestEpisodes, TabIndicator.
- Layout/stacking: z-index ladder consistent (Ambient −10 < content < Nav 40 < drawers/palette 50; player 10/20/30); `.shimmer`/`.laser-frame`/`.tilt-card` use `isolation: isolate`; full-bleed hero uses `100cqw` (not `100vw`) — a correct fix for scrollbar overshoot.
- React keys: no missing `key` found across `components/`.
- Accessibility: Player has strong ARIA (slider role, `aria-valuetext`, labelled buttons, `aria-pressed`, menu roles); NavDrawer is a complete modal.

**Performance observations**
- Build: `/` First Load JS ≈ **426 kB**, shared chunk 340 kB (one 217 kB shared chunk). `bundle:check` budget is 470 kB default / 520 kB max — `/` is within budget but not far off. This is on the high side for a first load and worth monitoring (the `motion` + UI surface dominate).
- Route table (from build): `/` static, revalidate 1m; all browse/detail/watch routes dynamic. No prerender errors.

**No redesign recommendations are made** — the design system is deliberate and coherent.

---

## F. Dependency and Configuration Review

### Dependency audit
- `npm audit`: **5 high**, 0 critical/moderate/low. All five (`braces`, `micromatch`, `fast-glob`, `@next/eslint-plugin-next`, `eslint-config-next`) are **`dev: true`** — toolchain only, not shipped. Recommended action: **wait for an upstream bump; do not run `npm audit fix --force`** (it downgrades `eslint-config-next` to 14.x, a breaking change).
- Notable currency gaps (from `npm outdated`): `next` 15.5.28 vs 16.4.2 latest; `react`/`react-dom` 19.2.x vs 19.3.x; `hls.js` 1.6.16 vs 1.7.3; `zod` 3.25 vs 4.6; `typescript` 5.9 vs 7.0. These are not vulnerabilities, but the Next 15→16 and zod 3→4 majors are worth planning. Pinned exact versions in `package.json` for `eslint`/`eslint-config-next` are good for reproducibility.
- `headroom-ai` — dead dependency (zero usage). Optional cleanup in a future task.

### Secret handling
- Only `API_BASE_URL` (server-only; never `NEXT_PUBLIC_`) and `DEBUG_API` are read. No `NEXT_PUBLIC_` variable exists. `.env` is gitignored (`.gitignore` ignores `.env*` except `.env.example`, which does not exist). No secret values were read, printed, or included in this report. **No secret exposure found.**

### Security headers & CSP (from `next.config.ts:92-146`)
- Present: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: SAMEORIGIN`, `frame-ancestors 'self'`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Permissions-Policy` denying camera/mic/geo/payment/usb/serial/browsing-topics, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
- CSP caveats: no nonce (shared-cache tradeoff), `img-src https:` broad, `'unsafe-inline'` script-src required for Next inline bootstrap. `'unsafe-eval'` is added **only in non-production** (dev HMR) — correct (`next.config.ts:35, 125`).
- No `Content-Security-Policy-Report-Only` and no reporting endpoint.

### Rate limiting & caching
- **Rate limiting: none** (SEC-01).
- Caching: home `revalidate = 60` (route-level, confirmed by build `Revalidate 1m`); `/api/suggest` `s-maxage=60, swr=300`; `/api/search-index` `s-maxage=300, swr=600`; playlist `s-maxage=60, swr=300`; segments `max-age=3600`; `/api/sources` `no-store`; subtitles `max-age=86400`. Provider Data Cache: home/list 900 s, detail 3600 s, schedule 1800 s, servers/sources `no-store`.

### Environment variables required for security controls (values redacted)
| Variable | Required? | Scope | Notes |
|---|---|---|---|
| `API_BASE_URL` | Yes (runtime) | server-only | strict `KEY=VALUE`, **no trailing slash**; `.env` gitignored |
| `DEBUG_API` | No | server-only, non-prod only | debug logging flag |
| `NODE_ENV` | platform | server | drives dev-only `'unsafe-eval'` CSP branch |

---

## G. Verification Results

| Check | Command / method | Outcome | Limitations |
|---|---|---|---|
| Unit tests | `npm test` | **56 pass / 0 fail** (suites: 0, node:test) | Note: `AGENTS.md` says 51; actual is 56. Local only |
| Type check | `npm run typecheck` | **clean** (exit 0) | — |
| Lint | `npx eslint .` (non-interactive) | **exit 0, no output** | `npm run lint` also maps to `eslint .` now (ESLint 9.39.5 present) |
| Production build | `npm run build` | **success**, 16/16 static pages, no errors | Used local `.env`; `.next` regenerated (gitignored) |
| Dependency audit | `npm audit` | **5 high** (all `dev:true`), 0 critical | Toolchain only |
| Outdated deps | `npm outdated` | 15 packages behind latest | Informational |
| SSRF guard coverage | `lib/api/proxy-guard.test.ts` | **13 tests pass** incl. redirect-into-private, stall→502 | Mocks; no live-IP rebinding test |
| Recovery coverage | `lib/player/recovery.test.ts` | **6 tests pass** (bounded, no infinite loop) | Pure-function only |
| JSON-LD escaping | `lib/utils/jsonld.test.ts` | **4 tests pass** (script breakout) | — |
| Storage sanitizer | `lib/storage/sanitize.test.ts` | **pass** (proto-pollution, shape) | — |
| Provider URL contract | `lib/providers/hianime/endpoints.test.ts` | **pass** (episodeId hash, no retry on 4xx) | Source-pattern test, not live |
| XSS sink scan | `grep` for eval/innerHTML/Function/write | **none found** | Static |
| Secret scan | `grep` for `NEXT_PUBLIC`/`process.env` | **no leaked secrets**; server vars only | Static |
| Player live playback | — | **NOT verified** | Requires browser + live provider |
| Edge cache headers | — | **NOT verified** | Requires live deployment; `scripts/verify-cache-headers.mjs` exists (post-deploy) |
| Browser CSP enforcement | — | **NOT verified** | Requires real browser |

**Classification:**
- **Verified locally:** tests, typecheck, lint, build, audit, dependency currency, static scans.
- **Verified in a deployed environment:** none.
- **Partially verified:** SSRF guard (unit-tested with mocks; DNS-rebinding residual untested), player recovery (pure logic tested; real hls.js flow untested).
- **Not verified:** live playback, edge cache headers, browser CSP, upstream provider behavior.

---

## H. Prioritized Recommendations

Ordered. Each states benefit, implementation risk, and player/design impact. **None of these are implemented** — this is planning for a separate future task.

### 1. Immediate risks
1. **Commit the CI workflow and broaden its trigger** (SEC-11). *Benefit:* the existing strong gate (lint/types/test/build/bundle/prerender) actually runs on PRs. *Risk:* low. *Player/design impact:* none.
2. **Bound playlist/subtitle body reads** in `/api/stream` and `/api/subtitle` (SEC-02). *Benefit:* removes a memory-exhaustion DoS. *Risk:* low (both bodies are text and small). *Player impact:* **none if the cap is generous** (≥5 MB); segments already stream and must remain streaming.
3. **Correct the `AGENTS.md` cache documentation** (SEC-10). *Benefit:* prevents a future dev from "restoring" a `headers()` rule that no longer exists. *Risk:* none (docs). *Player/design impact:* none.

### 2. Important improvements
4. **Add scoped rate limiting** (SEC-01/SEC-04). *Benefit:* removes open-relay/bandwidth-amplification abuse. *Risk:* **high** if per-request — must exempt/allow segment floods. *Player impact:* **potentially breaking**; design carefully and test playback.
5. **Pin the SSRF-guarded connection to the validated IP** (SEC-03). *Benefit:* closes DNS rebinding. *Risk:* medium (custom dispatcher can break CDN TLS/SNI). *Player impact:* **potentially breaking**; test against real streams.
6. **Fix `SnowLayer.tsx` duplicate RAF** (DS-01). *Benefit:* halve canvas paint cost on visibility toggles. *Risk:* low. *Player/design impact:* none (watch page hides the snow layer).
7. **Add a focus trap + focus-return to `CommandPalette`** (DS-02) to match `NavDrawer`. *Benefit:* correct modal a11y. *Risk:* low. *Player/design impact:* none.

### 3. Optional hardening
8. Add CSP reporting (`report-to`/`report-uri`) and/or a report-only rollout (SEC-13).
9. Move toward nonce/hash script-src if the cache model is ever redesigned (SEC-08) — **do not** do this while `/` is edge-cached.
10. Narrow `img-src https:` if the CDN set can be closed (SEC-07) — **breaks posters if done wrong**.
11. Include referer in the playlist cache key or use `private` (SEC-05).
12. Remove the dead `headroom-ai` dependency and plan Next 16 / zod 4 upgrades.
13. Reduce the `/` first-load bundle (426 kB) toward the shared baseline.

---

## I. Final Risk Assessment

**Confirmed Critical issues:** none.
**Confirmed High issues:** none in shipped code. (The 5 `high` npm advisories are dev-toolchain only.)

**Confirmed Medium issues:** SEC-01 (no rate limiting), SEC-02 (unbounded body buffering). SEC-03 (DNS rebinding) is a suspected/documented residual, Medium.

**Remaining Low / Informational:** open-relay design (SEC-04), playlist cache/referer (SEC-05), derived `Origin` header (SEC-06), CSP breadth (SEC-07/08), dev-only audit advisories (SEC-09), doc drift (SEC-10), CI not on branch (SEC-11), no-auth by design (SEC-12), no CSP reporting (SEC-13), clean secret handling (SEC-14). Design: SnowLayer duplicate RAF (DS-01), CommandPalette a11y (DS-02).

**Unknowns requiring manual testing:** real HLS playback under the current CSP across Chrome/Firefox/Safari; native Safari HLS under `media-src 'self'`; edge cache headers on the live deployment; upstream provider behavior and rotation of stream hosts; the DNS-rebinding residual in the live egress environment.

**Is a safe remediation phase recommended?** **Yes, but scoped.** The project is reasonably secure as-is for its threat model. A remediation phase should start with the *zero-playback-risk* items (commit CI, fix docs, bound text reads, fix SnowLayer) and treat rate limiting and IP-pinning as *separate, carefully tested* changes because they can break streaming.

**Areas that must be protected during any future change (highest preservation priority):**
1. **The streaming player and its flows** — hls.js attach/config, `/api/stream` playlist rewrite + referer forwarding, `/api/subtitle`, `/api/sources` failover, `lib/player/recovery.ts`, the startup watchdog, and timestamp restore. **Do not touch without live playback testing.**
2. **The SSRF guard** (`lib/api/proxy-guard.ts`) and its redirect-hop re-validation — relax nothing.
3. **The CSP + security headers + image allowlist** in `next.config.ts` — removing `'unsafe-inline'` script-src, `media-src`/`connect-src`, `worker-src blob:`, or poster hosts breaks hydration/playback/posters.
4. **The established design system and motion architecture** — CSS reveals + Motion-for-React; no visual changes were requested or made.
5. **Provider URL contract** (`episodeId` hash, no `animeEpisodeId`, no `&ep=`) and the `no-store`/`revalidate` cache semantics.

---

*End of report. No application files were modified; this document is the sole artefact created.*

---

# Remediation Log (2026-10-19)

This section records the follow-up remediation work against the findings above.
Small, independently reviewable commits on `feat/favicon-logo`; each was gated on
lint + typecheck + tests + build before the next.

## What was fixed

### 1. Bounded playlist/subtitle reads — SEC-02 (commit `fa53c8a`)
**Finding:** `/api/stream` read playlists with `res.text()` and `/api/subtitle`
read the whole VTT body with no byte cap → memory-exhaustion DoS from a hostile
upstream.
**Root cause:** the body was fully buffered before any size was known.
**Fix:** new leaf module `lib/api/bounded-body.ts` — a declared-`Content-Length`
pre-check plus a reader that enforces the cap **while reading** and cancels the
upstream once exceeded. Playlists cap at 4 MiB, subtitles at 2 MiB; oversized →
`413`, read error → `502`.
**Critical difference from the reverted attempt:** ONLY the text branches are
bounded. The HLS media segment path still streams `res.body` straight through,
byte-for-byte unchanged — the earlier revert happened because it wrapped the
segment body.
**Files:** `lib/api/bounded-body.ts` (+ test), `app/api/stream/route.ts`,
`app/api/subtitle/route.ts`.
**Tests:** `lib/api/bounded-body.test.ts` (10) — declared-size accept/reject,
unknown-length, mid-read abort of multi-MB bodies, exact-cap boundary, read
failure distinct from over-size.

### 2. Scoped rate limiting — SEC-01 (commit `7ce3739`)
**Why the first attempt was reverted:** it applied a per-REQUEST gate to every
`/api/stream` call, including every HLS **segment**. One episode fires hundreds
of segment requests, so the gate throttled normal viewing and (with Upstash) put
a serial round-trip on the hottest path.
**Fix:** the limiter is applied ONLY to the open relay's **entry points** —
manifest/playlist fetches (inside the `isPlaylist` branch) and `/api/subtitle`.
**The media segment branch has no limiter and still streams `res.body`** — real
playback never touches it. Pluggable fixed window: in-memory per-instance
fallback (always on) + optional distributed Upstash Redis; **fail-open** when the
store is unreachable so a false 429 can never break an episode load. Generous
defaults (120 manifest / 60 s, 60 subtitle / 60 s per client), keyed on the
platform `x-real-ip` (rightmost-XFF fallback), hashed.
**Files:** `lib/api/rate-limit.ts` (+ test), `app/api/stream/route.ts`,
`app/api/subtitle/route.ts`.
**Tests:** `lib/api/rate-limit.test.ts` (12) — window allow/deny/reset,
per-scope isolation, generous-burst-under-limit, sustained-abuse-denied,
fail-open, key derivation.

### 3. DNS rebinding (SSRF) — SEC-03 (commit `89575fb`)
**Finding:** `validateProxyUrl` resolved DNS and `fetch` resolved it again — a
TOCTOU an attacker controlling the DNS answer could flip public→private.
**Fix:** for hostname targets the guarded fetch now resolves once, requires every
address to be public, and connects through a Node `http`/`https` request whose
`lookup` can only return the validated addresses. TLS SNI (`servername`) and the
`Host` header keep the original hostname, so CDN virtual hosting still works; the
media body still streams (segments are not buffered). On any pinned-transport
failure it falls back to the ordinary `fetch` — never less functional, only more
constrained. IP literals skip pinning. Redirect-hop re-validation unchanged.
**Files:** `lib/api/proxy-guard.ts` (+ test).
**Tests:** `proxy-guard.test.ts` 15 pass (added private-resolving hostname
rejection + hostname-validated-before-fetch).

### 4. Playlist cache isolation — SEC-05 (commit `4193aef`)
**Finding:** the rewritten playlist body embeds the caller's `referer` in every
segment URI, but the response was `public, s-maxage=60` keyed only on the URL —
two callers with different referers could share one entry.
**Fix:** a playlist fetched WITH a referer is now `private` (browser may reuse,
shared edge cache may not); without a referer the body is referer-independent and
keeps the shared cache.
**Files:** `app/api/stream/route.ts`, `lib/config/cache-headers.test.ts`.

### 5. CSP review — SEC-04/07/08 (no change)
Reviewed the enforced policy against the player's actual resource use. Verified
by source that hls.js loads media through the same-origin `/api/stream`, the
segment body is fed to MSE (`media-src 'self' blob:`), the hls worker is a blob
URL (`worker-src 'self' blob:`), subtitles are fetched from the same-origin
`/api/subtitle` (not the raw CDN URL — `Player.tsx:770`), and posters use the
allowed `img-src https:`. **No verified change was warranted**, and the report
explicitly warns against removing any of these directives. Left as-is.

### 6. Cleanup — DS-01 / SEC-10 / SEC-11 (commit `4f62fdd`)
- **SnowLayer (DS-01):** `onVisibility` scheduled a new RAF without cancelling
  the pending one, so a chain surviving a hide could run alongside the new one.
  Now cancels before every state change — exactly one loop per canvas.
- **AGENTS.md (SEC-10):** corrected the stale claim that a `headers()` rule
  edge-caches `/` and `/watch/*` (the home route uses `revalidate = 60`;
  `/watch/*` is uncacheable).
- **CI (SEC-11):** trigger on pushes to every branch, not just `main`/`master`.
- **Dev advisories (SEC-09):** `npm audit --omit=dev` → **0 vulnerabilities**.
  The 5 `high`s are the `eslint-config-next` toolchain (dev-only). No
  force-upgrade, per the report's guidance.

## Verification (what was actually run)

| Check | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm test` | **81 pass / 0 fail** (was 56; +25 new) |
| `npm run build` | exit 0 |
| `npm audit --omit=dev` | 0 vulnerabilities |

**End-to-end server-side playback chain** (local production build `next start`,
live provider `hls.dramahot.top`):

| Step | Result |
|---|---|
| Master playlist (with referer) | `200`, `Cache-Control: private, max-age=60…` (SEC-05) |
| Variant playlist | `200`, 53 KB |
| **Media segment** | `200`, 593 KB, valid MPEG-TS (`0x47` sync) — streamed |
| Subtitle `.vtt` | `200`, 20 KB, `text/vtt` |
| SSRF probes (metadata / localhost / file / creds / private / IPv4-mapped) | all `400` |
| Manifest abuse (130 rapid, limit 120) | 120 × `200`, 10 × `429` |
| Segment burst (30 requests, limit 5) | **0 × `429`** — segments never limited |

## Verification limits — NOT claimed

- **Real-browser playback was NOT performed.** No browser is available in this
  environment (Chrome not installed for the integrated browser). The server-side
  chain above proves the proxy/limits/cache/pinning serve manifest, segment and
  subtitle bytes correctly, but does **not** prove hls.js rendering, seeking,
  episode switching, subtitle rendering, or failover in a browser.
- **Edge/CDN cache behaviour on the live deployment was NOT verified** (local
  `next start` only). `scripts/verify-cache-headers.mjs` remains the post-deploy
  check.
- **DNS-rebinding pinning was verified against one live CDN** (TLS/SNI
  preserved); other CDNs with unusual TLS setups were not exercised.
- **`.github/workflows/ci.yml` could not be pushed** — the automation token
  lacks the `workflow` scope; the file is committed locally.

## Remaining / accepted risk

- **Distributed rate limiting is opt-in** — without Upstash env vars the limit
  is per-instance. Code-complete; deployment-complete only with credentials.
- **Open-relay by design (SEC-04)** — mitigated (not closed) by the scoped
  limiter; a hostname allowlist remains infeasible due to CDN rotation.
- **CSP `unsafe-inline` script-src / broad `img-src https:` (SEC-07/08)** —
  deliberate, required for Next hydration and rotating posters.
- **Dev-only npm advisories (SEC-09)** — accepted pending an upstream bump.

