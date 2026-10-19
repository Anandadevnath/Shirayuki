#!/usr/bin/env node
/**
 * Prerender sanity check for the home route.
 *
 * `app/page.tsx` uses `export const revalidate = 60`, so `/` is prerendered at
 * build time. If the build-time upstream fetch fails, the prerender bakes the
 * `<ErrorState>` ("Something melted") into the static HTML — and CI, building
 * with a dummy API, could not tell a good build from a broken one.
 *
 * This script inspects the generated home HTML and fails if it looks like the
 * error state or the loading skeleton rather than real board content.
 *
 * It runs in CI after `npm run build`. When CI is intentionally built without a
 * live API, pass `--allow-unreachable` to downgrade "error state" to a warning
 * (still fails on a truly empty/blank document).
 *
 * Usage:
 *   node scripts/check-prerender.mjs [--allow-unreachable]
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const NEXT_DIR = ".next";
const CANDIDATES = [
  join(NEXT_DIR, "server", "app", "index.html"),
  join(NEXT_DIR, "server", "app", "index.rsc"),
];

const allowUnreachable = process.argv.includes("--allow-unreachable");

function findHomeHtml() {
  for (const p of CANDIDATES) {
    if (existsSync(p)) return p;
  }
  return null;
}

const SUCCESS_MARKERS = [
  // Real board content the page renders only when the home payload resolved.
  "Browse, discover and watch anime", // the sr-only <h1>
  "section-stack", // the board wrapper class
];
const ERROR_MARKERS = ["Something melted", "We couldn", "t reach the provider"];

function main() {
  const file = findHomeHtml();
  if (!file) {
    // A pure dynamic build (no prerendered home) is acceptable here; the cache
    // test asserts the intended route config separately.
    console.log("Prerender check skipped: no prerendered home HTML found.");
    process.exit(0);
  }

  const html = readFileSync(file, "utf8");

  const hasSuccess = SUCCESS_MARKERS.some((m) => html.includes(m));
  const hasError = ERROR_MARKERS.some((m) => html.includes(m));

  if (hasSuccess && !hasError) {
    console.log(`Prerender check OK: ${file} contains real home content.`);
    process.exit(0);
  }

  if (hasError) {
    const msg = `Prerendered home looks like the ErrorState (upstream unreachable at build): ${file}`;
    if (allowUnreachable) {
      console.warn(`WARN: ${msg}`);
      process.exit(0);
    }
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }

  console.error(`FAIL: prerendered home HTML (${file}) has no recognisable board content.`);
  process.exit(1);
}

main();
