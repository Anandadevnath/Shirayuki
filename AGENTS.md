# AGENTS.md — Shirayuki

Anime streaming client: Next.js 15 (App Router), React 19, TypeScript 5.7 strict, Tailwind v4, zod, zustand, hls.js. Deployed to Vercel (Singapore region). npm only — the repo has `package-lock.json`, no pnpm/yarn lockfile. Node engines pins `24.x` (README says 20.x; stale — trust `package.json`).

## Commands

```bash
npm run dev          # http://localhost:3000
npm run typecheck    # tsc --noEmit — the real verification gate
npm test             # node --test "lib/**/*.test.ts" "app/**/*.test.ts"
node --test <path/to/file.test.ts>   # single test file (node:test, NOT jest/vitest)
```

- **`npm run lint` does not work.** It runs `next lint`, but ESLint is not in devDependencies and no config exists, so it hangs on an interactive "How would you like to configure ESLint?" prompt. Use `npm run typecheck` to verify changes.

## Environment

- `API_BASE_URL` (required, server-side only — never `NEXT_PUBLIC_`) points at the upstream scraper API. Already set in the tracked-locally `.env`.
- **No trailing slash** on `API_BASE_URL`: the client prepends `/api/v2/...`, so `...app/` would double-slash and 308-redirect.
- The value must be strict `KEY=VALUE` form; the bare-URL style Next's dotenv loader ignores falls back to a disabled legacy domain.

## Data layer (read before touching fetches)

- Components only ever see the normalized models in `lib/providers/types.ts`. Raw upstream shapes are handled exclusively in `lib/providers/hianime/` (`schemas.ts` zod validation → `mappers.ts` field-drift normalization).
- `lib/api/index.ts` is the single facade for data access. Its exports are wrapped in React `cache()` — use them in both `generateMetadata` and page renders so a visit fetches once. Don't call `lib/providers/hianime` directly from components.
- Data calls go through `safe()` → `Result<T, E>`; render empty states, never let a provider error crash a page. Upstream is a fragile scraper with ephemeral stream tokens (fetched `no-store`).
- To swap providers, replace `lib/providers/hianime` and keep types/mappers shape — nothing app-side should change.

## Config gotchas (`next.config.ts`)

- New poster image host → append to `POSTER_HOSTS` (exact + `**.` wildcard patterns are generated). Un-allowlisted hosts throw `next-image-unconfigured-host` at runtime; fall back to a plain `<img>` for one-off images (the Player poster does this).
- `<Image>` `quality` values must be in the `qualities` allowlist `[50, 70, 75, 80, 85, 90]`; other values get a 400 from the optimizer and silently break posters. Don't remove 75 (the default-quality value).
- `/api/stream` and `/api/subtitle` are SSRF-guarded by `lib/api/proxy-guard.ts` (scheme, public host/IP, DNS resolution per redirect hop). Don't relax it; its behavior is covered by `lib/api/proxy-guard.test.ts`.
- Security headers and CSP baseline live in `headers()` — don't strip them when editing config.

## Conventions

- Design tenet: one AnimeCard, one Nav, one Player — add variants, not duplicate components.
- The Player is loaded `ssr: false` via `components/player/PlayerLoader.tsx`; keep `hls.js` out of the initial page bundle.
- `/watch/*` is `noindex` by design (robots + `generateMetadata`).
- Dark-first OKLCH frost tokens and motion rules live in `app/globals.css`; respect `prefers-reduced-motion` for new motion. Design tokens and specs: `DESIGN.md`.
- Path alias: `@/*` maps to the repo root (no `src/` dir).
- Routes live in `app/(browse)/` (browse pages) and `app/watch/[id]/[ep]/`; API routes: `/api/stream`, `/api/subtitle`, `/api/suggest`, `/api/search-index` (there is no `/api/schedule` route — the README mentions one, but schedule data is fetched server-side in the page).
