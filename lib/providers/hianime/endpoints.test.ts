import { test } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

/**
 * Regression guard for the /episode/servers + /episode/sources URL contract.
 *
 * The upstream param has flip-flopped (`episodeId` → `animeEpisodeId`+`ep` →
 * back to bare `episodeId`). The current API accepts ONLY the bare episodeId
 * hash; `animeEpisodeId` 404s, and `animeEpisodeId=<numeric>&ep=<n>` silently
 * resolves a DIFFERENT episode by position. Either form breaks playback
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

// The upstream param has flip-flopped: `episodeId` → `animeEpisodeId`+`ep` →
// back to bare `episodeId`. The current API accepts ONLY the bare episodeId
// hash and 404s on `animeEpisodeId`. Critically, `animeEpisodeId=<numeric>&ep=<n>`
// "succeeds" but resolves the WRONG episode by position — a silent, worse
// failure than the 404. These tests pin the exact-hash contract so a future
// rename cannot silently regress playback again.
//
// Assertions target the path CONSTANTS only (comments may legitimately mention
// the rejected param names).
function pathLines(name: string): string {
  return fnBody(name)
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n");
}

test("getServers queries the bare episodeId hash (never animeEpisodeId)", () => {
  const body = pathLines("getServers");
  assert.match(body, /\/episode\/servers\?episodeId=/, "must use the bare episodeId hash");
  assert.doesNotMatch(body, /animeEpisodeId=/, "animeEpisodeId 404s or misresolves upstream");
  assert.doesNotMatch(body, /&ep=/, "positional ep resolves the wrong episode upstream");
});

test("getSources queries the bare episodeId hash + server + category", () => {
  const body = pathLines("getSources");
  assert.match(body, /\/episode\/sources\?episodeId=/, "must use the bare episodeId hash");
  assert.match(body, /&server=/);
  assert.match(body, /&category=/);
  assert.doesNotMatch(body, /animeEpisodeId=/, "animeEpisodeId 404s or misresolves upstream");
  assert.doesNotMatch(body, /&ep=/, "positional ep resolves the wrong episode upstream");
});

test("apiFetch does not retry deterministic 4xx (404 failover must stay fast)", () => {
  const client = readFileSync(fileURLToPath(new URL("./client.ts", import.meta.url)), "utf8");
  
  // 404 must be routed to the non-retry exit, and the retry loop must
  // rethrow NonRetryError without backoff.
  assert.match(client, /NonRetryError/);
  assert.match(client, /res\.status === 404/);
  assert.match(client, /if \(err instanceof NonRetryError\) throw/);
});
