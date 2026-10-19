#!/usr/bin/env node
/**
 * Bundle-size budget check (SEC-05 / PERF-02).
 *
 * Guards against silent growth of First Load JS. It reads the build Next just
 * produced (`.next/app-build-manifest.json`) and, for each page route, computes
 * the GZIP size of the union of the chunks that route loads — which is what the
 * browser actually downloads and what Next prints as "First Load JS".
 *
 * Run AFTER `npm run build`:
 *   node scripts/check-bundle-size.mjs
 *
 * Budgets are set a little above the current baseline so ordinary work does not
 * trip them, but a real regression does. To re-baseline intentionally, raise
 * the numbers here and explain why in the PR.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const NEXT_DIR = ".next";
const MANIFEST = join(NEXT_DIR, "app-build-manifest.json");

// KB budgets for a route's summed gzip chunk weight (the manifest lists every
// chunk the route references; the sum is a stable RELATIVE metric — we use it
// to detect drift, not to mirror Next's exact "First Load JS" label).
// Baseline 2026-10: home ~418 KB, browse pages ~401 KB, static pages ~337 KB.
const BUDGET_KB = {
  default: 470, // any page route
  max: 520, // hard ceiling for any single route
};

const gzipCache = new Map();

function gzipSizeKB(file) {
  if (gzipCache.has(file)) return gzipCache.get(file);
  const rel = file.replace(/^\/?_next\//, "").replace(/^\.next\//, "");
  const abs = join(NEXT_DIR, rel);
  let kb = 0;
  try {
    kb = gzipSync(readFileSync(abs)).length / 1024;
  } catch {
    kb = 0;
  }
  gzipCache.set(file, kb);
  return kb;
}

function main() {
  if (!existsSync(MANIFEST)) {
    console.log("Bundle-size check skipped: no build manifest (run `npm run build` first).");
    process.exit(0);
  }

  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const pages = manifest.pages ?? {};

  const failures = [];
  let checked = 0;

  for (const [route, files] of Object.entries(pages)) {
    // Only the actual page routes, not API routes / build internals.
    if (!route.endsWith("/page")) continue;
    const totalKB = files.reduce((sum, f) => sum + gzipSizeKB(f), 0);
    checked++;
    if (totalKB > BUDGET_KB.max) {
      failures.push(`${route}: ~${totalKB.toFixed(0)} KB gzip exceeds hard cap ${BUDGET_KB.max} KB`);
    } else if (totalKB > BUDGET_KB.default) {
      failures.push(`${route}: ~${totalKB.toFixed(0)} KB gzip exceeds budget ${BUDGET_KB.default} KB`);
    }
  }

  if (!checked) {
    console.log("Bundle-size check skipped: no page routes in manifest.");
    process.exit(0);
  }

  if (failures.length) {
    console.error("Bundle-size budget exceeded:");
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(
    `Bundle-size budget OK (${checked} routes checked, ${BUDGET_KB.default} KB budget / ${BUDGET_KB.max} KB cap, gzip).`,
  );
}

main();
