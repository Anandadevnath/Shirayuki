import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * Cache-header regression guard (SEC-02 / PERF-06).
 *
 * The production bug was that the intended shared-cache directive never reached
 * the edge: `export const dynamic = "force-dynamic"` made Next emit
 * `Cache-Control: no-store` and that won over the `next.config.ts` `headers()`
 * rule. The fix is to express the intent with `export const revalidate = 60`
 * (which makes Next emit the correct `s-maxage`/`swr` itself) for the routes
 * that CAN be edge-cached, and to NOT install a misleading cache rule for the
 * route that legitimately cannot (the watch player, whose `no-store` source
 * fetch forces dynamic rendering).
 *
 * These assertions are source-level and deterministic, so they run in CI
 * without a deployment. A separate script (`scripts/verify-cache-headers.mjs`)
 * performs the live post-deploy check.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

test("home route is edge-cached via revalidate, not force-dynamic", () => {
  const src = read("app/page.tsx");
  assert.match(
    src,
    /export const revalidate = 60/,
    "home must declare revalidate = 60 so Next emits the shared-cache header",
  );
  assert.doesNotMatch(
    src,
    /^export const dynamic = "force-dynamic"/m,
    "home must NOT be force-dynamic (that emits no-store and defeats the cache)",
  );
});

test("watch resume-redirect route stays dynamic (unbounded segment)", () => {
  // Next always renders a route under an unbounded dynamic segment on demand,
  // so a `revalidate` here is a misleading no-op — assert we did NOT add one.
  const src = read("app/watch/[id]/page.tsx");
  assert.doesNotMatch(
    src,
    /^export const revalidate/m,
    "no misleading revalidate on the unbounded /watch/[id] segment",
  );
});

test("watch player route stays dynamic (embeds a per-request token)", () => {
  const src = read("app/watch/[id]/[ep]/page.tsx");
  assert.match(
    src,
    /export const dynamic = "force-dynamic"/,
    "the player route resolves no-store stream sources, so it must stay dynamic",
  );
  assert.doesNotMatch(
    src,
    /^export const revalidate/m,
    "a revalidate on a route with no-store fetches would be a misleading no-op",
  );
});

test("no stale cache headers() rule remains for the home/watch HTML routes", () => {
  const cfg = read("next.config.ts");
  assert.doesNotMatch(
    cfg,
    /source:\s*"\/"/,
    "the ineffective headers() rule for '/' must be removed (middleware/config cannot beat the framework's dynamic no-store)",
  );
  assert.doesNotMatch(
    cfg,
    /source:\s*"\/watch\/:path\*"/,
    "the ineffective headers() rule for '/watch/:path*' must be removed",
  );
});

test("ephemeral source + stream routes keep no-store caching", () => {
  // /api/sources must never be edge-cached (ephemeral tokens).
  const sources = read("app/api/sources/route.ts");
  assert.match(
    sources,
    /no-store/i,
    "/api/sources must set no-store caching",
  );
});
