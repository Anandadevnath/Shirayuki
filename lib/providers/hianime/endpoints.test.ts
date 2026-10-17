import { test } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

/**
 * Regression guard for the 2026-10 provider rename: /episode/servers and
 * /episode/sources now require `animeEpisodeId` (+ `ep`); sending the old
 * bare `episodeId` query param 404s, and that silently killed ALL playback
 * ("No streaming server is available" on every watch page).
 *
 * The provider module uses bundler-style extensionless imports, so node:test
 * can't import it directly — instead these tests pin the URL-construction
 * contract in the SOURCE, which is exactly what must not regress.
 */

const SOURCE = fileURLToPath(new URL("./index.ts", import.meta.url));
const src = readFileSync(SOURCE, "utf8");

/** Extract the getServers/getSources function bodies from index.ts. */
function fnBody(name: string): string {
  const start = src.indexOf(`export async function ${name}<`) >= 0
    ? src.indexOf(`export async function ${name}<`)
    : src.indexOf(`export async function ${name}(`);
  assert.ok(start >= 0, `function ${name} not found in provider index.ts`);
  const next = src.indexOf("export async function", start + 10);
  return next === -1 ? src.slice(start) : src.slice(start, next);
}

test("getServers queries animeEpisodeId + ep (never the removed episodeId param)", () => {
  const body = fnBody("getServers");
  assert.match(body, /\/episode\/servers\?animeEpisodeId=/, "must use animeEpisodeId");
  assert.match(body, /&ep=/, "must pass the episode number");
  assert.doesNotMatch(body, /\?episodeId=/, "bare episodeId param 404s upstream");
});

test("getSources queries animeEpisodeId + ep + server + category", () => {
  const body = fnBody("getSources");
  assert.match(body, /\/episode\/sources\?animeEpisodeId=/, "must use animeEpisodeId");
  assert.match(body, /&ep=/, "must pass the episode number");
  assert.match(body, /&server=/);
  assert.match(body, /&category=/);
  assert.doesNotMatch(body, /\?episodeId=/, "bare episodeId param 404s upstream");
});

test("apiFetch does not retry deterministic 4xx (404 failover must stay fast)", () => {
  const client = readFileSync(fileURLToPath(new URL("./client.ts", import.meta.url)), "utf8");
  
  // 404 must be routed to the non-retry exit, and the retry loop must
  // rethrow NonRetryError without backoff.
  assert.match(client, /NonRetryError/);
  assert.match(client, /res\.status === 404/);
  assert.match(client, /if \(err instanceof NonRetryError\) throw/);
});
