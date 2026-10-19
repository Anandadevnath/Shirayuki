#!/usr/bin/env node
/**
 * Post-deploy cache-header verification (SEC-02 / PERF-06).
 *
 * The production regression this guards against was invisible to the build:
 * the code "looked" right but the deployed route shipped `Cache-Control:
 * no-store`. This script asserts the DEPLOYED site actually emits the intended
 * shared-cache policy. It is intentionally NOT part of the PR gate (it needs a
 * live deployment); run it after a deploy, or wire it into a post-deploy job.
 *
 * Usage:
 *   node scripts/verify-cache-headers.mjs [baseUrl]
 *   BASE_URL=https://example.vercel.app node scripts/verify-cache-headers.mjs
 *
 * Exit code 0 = every assertion passed. Non-zero = a mismatch (details printed).
 *
 * NOTE: it issues a small, bounded number of GETs (2 per route) — no flooding.
 */

const base = (process.argv[2] || process.env.BASE_URL || "https://shirayuki-livid.vercel.app").replace(/\/$/, "");

const htmlHeaders = { Accept: "text/html,application/xhtml+xml" };

async function head(path, extraHeaders = {}) {
  const res = await fetch(`${base}${path}`, {
    method: "GET",
    headers: { ...htmlHeaders, ...extraHeaders },
    redirect: "manual",
  });
  return {
    status: res.status,
    cacheControl: res.headers.get("cache-control") ?? "",
    vercelCache: res.headers.get("x-vercel-cache") ?? "",
    age: res.headers.get("age") ?? "",
    vary: res.headers.get("vary") ?? "",
  };
}

const failures = [];
function check(name, cond, detail) {
  if (cond) {
    console.log(`  ✔ ${name}`);
  } else {
    console.log(`  �’ ${name} — ${detail}`);
    failures.push(`${name}: ${detail}`);
  }
}

async function main() {
  console.log(`Verifying cache headers against ${base}\n`);

  // ── Home — MUST be shared-cacheable (s-maxage), not no-store ──
  console.log("GET /");
  const home = await head("/");
  check("home is not no-store", !/no-store/i.test(home.cacheControl), `got "${home.cacheControl}"`);
  check("home has s-maxage", /s-maxage=\d+/.test(home.cacheControl), `got "${home.cacheControl}"`);

  const home2 = await head("/");
  console.log("GET / (repeat)");
  check(
    "home second request is a cache HIT or has age>0",
    home2.vercelCache.toUpperCase() === "HIT" || Number(home2.age) > 0,
    `x-vercel-cache="${home2.vercelCache}" age="${home2.age}"`,
  );

  // ── Watch HTML — dynamic by design (ephemeral token), so no-store is OK ──
  // We only assert it does NOT claim to be shared-cacheable (a lie would be
  // worse than no-store): if it is `public, s-maxage=...` while embedding a
  // per-request token, that is a real problem.
  console.log("GET /watch/<sample>");
  const watch = await head("/watch/one-piece-1/ep-1");
  const watchShared = /s-maxage=\d+/.test(watch.cacheControl) && !/private|no-store/i.test(watch.cacheControl);
  check(
    "watch HTML does not wrongly advertise a shared cache",
    !watchShared,
    `got "${watch.cacheControl}" — a per-request token route must not be publicly cached`,
  );

  // ── Ephemeral API — MUST be no-store ──
  console.log("GET /api/sources (missing params)");
  const sources = await head("/api/sources");
  check(
    "api/sources is no-store",
    /no-store/i.test(sources.cacheControl),
    `got "${sources.cacheControl}"`,
  );

  console.log("");
  if (failures.length) {
    console.error(`FAILED (${failures.length}):`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log("All cache-header assertions passed.");
}

main().catch((e) => {
  console.error("verification error:", e.message);
  process.exit(2);
});
