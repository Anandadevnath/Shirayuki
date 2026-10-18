# AGENTS.md — Shirayuki

Anime streaming client: Next.js 15 (App Router, RSC), React 19, TypeScript 5.7 strict, Tailwind v4, zod, zustand, hls.js. Deployed to Vercel (Singapore region). npm only — the repo ships `package-lock.json`, no pnpm/yarn lockfile. Node is pinned `24.x` in `package.json` engines.

## Commands

```bash
npm run dev          # http://localhost:3000
npm run typecheck    # tsc --noEmit — the real verification gate
npm test             # node --test "lib/**/*.test.ts" "app/**/*.test.ts"
node --test lib/api/proxy-guard.test.ts   # single file — node:test, NOT jest/vitest
```

- **`npm run lint` does not work.** It runs `next lint`, but ESLint is not in devDependencies and no config exists, so it hangs on an interactive "How would you like to configure ESLint?" prompt. There is also no Prettier and no CI/pre-commit config, so `typecheck` + `test` are the only gates — run both before claiming anything is done.
- Tests execute `.ts` directly (Node 24 native type stripping — no build step or loader), so **test files import relatively with an explicit extension** (`./concurrency.ts`, `./sanitize.ts`). The `@/*` alias and extensionless imports do not resolve under `node --test`. For the same reason, import leaf modules only: `lib/api/index.ts` pulls the provider graph, whose extensionless imports Node cannot resolve — that's why `safe`/`withTimeout` live in `lib/api/concurrency.ts` and are re-exported from the facade.

## Environment

- `API_BASE_URL` (required, server-side only — never `NEXT_PUBLIC_`) points at the upstream scraper. It lives in the gitignored `.env` (`.gitignore` ignores `.env*` except `.env.example`, which does not exist).
- Must be strict `KEY=VALUE` form and **no trailing slash**: the client prepends `/api/v2/...`, so a trailing slash double-slashes and 308-redirects. A bare-URL line is silently ignored by Next's dotenv loader, and the client falls back to a disabled legacy domain.

## Data layer (read before touching fetches)

- Components only ever see the normalized models in `lib/providers/types.ts`. Raw upstream shapes are handled exclusively in `lib/providers/hianime/` (`schemas.ts` zod validation → `mappers.ts` field-drift normalization).
- `lib/api/index.ts` is the single facade for data access. Its exports are wrapped in React `cache()` — use them in both `generateMetadata` and page renders so a visit fetches once. Don't call `lib/providers/hianime` directly from components.
- Data calls go through `safe()` → `Result<T, E>`; render empty states, never let a provider error crash a page. Upstream is a fragile scraper with ephemeral stream tokens (fetched `no-store`).
- To swap providers, replace `lib/providers/hianime` and keep the types/mappers shape — nothing app-side should change.
- Client persistence is local-first, and `localStorage` is treated as untrusted input: `lib/progress/local.ts` (continue-watching), `lib/watchlist/local.ts` (My List), and `lib/completed/local.ts` (completed marker) each read a JSON map through `lib/storage/sanitize.ts` (prototype-pollution + shape guards) and dispatch a `window` event so mounted buttons re-read without prop drilling. Add a new local map by copying one of these three, not by touching `localStorage` directly.

## Config gotchas (`next.config.ts`)

- New poster image host → append to `POSTER_HOSTS` (exact + `**.` wildcard patterns are generated for each entry). Un-allowlisted hosts throw `next-image-unconfigured-host` at runtime; fall back to a plain `<img>` for one-off images (the Player poster does this).
- `<Image>` `quality` values must be in the `qualities` allowlist `[50, 70, 75, 80, 85, 90]`; other values get a 400 from the optimizer and silently break posters. Don't remove 75 (Next's default-quality value, requested by every `<Image>` that omits `quality`).
- `/api/stream` and `/api/subtitle` are SSRF-guarded by `lib/api/proxy-guard.ts` (scheme, public host/IP, DNS re-resolution on every redirect hop, bounded timeout). Don't relax it; behavior is covered by `lib/api/proxy-guard.test.ts`. Both proxy routes deliberately send no permissive CORS headers.
- Security headers and the CSP baseline live in `headers()` — don't strip them when editing config.

## Routes & conventions

- Browse pages live in `app/(browse)/` (az, category, genre, schedule, search); detail is `app/anime/[id]/` (JSON-LD); player is `app/watch/[id]/[ep]/`; `app/watch/[id]/page.tsx` resolves the resume episode server-side then client-redirects; `app/watchlist/` is local-only.
- API routes: `/api/stream`, `/api/subtitle`, `/api/suggest`, `/api/search-index`, and `/api/sources` (client-side source resolver for the player's mid-playback failover). There is **no `/api/schedule`** — the README mentions one, but the schedule is fetched server-side in `app/(browse)/schedule/page.tsx`.
- Design tenet: one AnimeCard, one Nav, one Player — add variants, not duplicate components.
- The Player is loaded `ssr: false` via `components/player/PlayerLoader.tsx`; keep `hls.js` out of the initial page bundle.
- `/watch/*` is `noindex` by design: `app/robots.ts` disallows `/watch/` and `/api/`, and the page metadata reinforces it.
- Dark-first OKLCH frost tokens and motion rules live in `app/globals.css`; respect `prefers-reduced-motion` for new motion. Design tokens and specs: `DESIGN.md`; the full plan is in `docs/`.
- Path alias: `@/*` maps to the repo root (no `src/` dir).
- Most tracked files are not app code: `.agents/`, `.claude/`, `.kilo/` and `skills-lock.json` hold vendored agent skills, and `graphify-out/` is a generated knowledge graph. Don't edit these during feature work.
