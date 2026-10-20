#!/usr/bin/env node
/**
 * Prerender sanity check for the home route. `/` is prerendered at build time
 * (revalidate = 60), so a build-time upstream failure would bake the ErrorState
 * into the static HTML while CI stayed green. Fails if the generated home HTML
 * looks like the error state or is blank. With `--allow-unreachable`, an error
 * state is a warning instead of a failure (for CI builds with a dummy API).
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
