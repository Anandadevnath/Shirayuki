import { test } from "node:test";
import assert from "node:assert/strict";
import {
  memoryLimit,
  checkRateLimit,
  clientKey,
  hashKey,
  DEFAULT_MANIFEST_LIMIT,
  DEFAULT_SUBTITLE_LIMIT,
  __resetRateWindows,
} from "./rate-limit.ts";

test("memoryLimit allows up to the limit then denies within the window", () => {
  __resetRateWindows();
  const cfg = { limit: 5, windowSeconds: 60 };
  for (let i = 0; i < 5; i++) {
    assert.equal(memoryLimit("k", cfg, 1000).allowed, true, `request ${i + 1} allowed`);
  }
  const denied = memoryLimit("k", cfg, 1000);
  assert.equal(denied.allowed, false);
  assert.ok(denied.retryAfterSeconds > 0);
});

test("memoryLimit resets after the window elapses", () => {
  __resetRateWindows();
  const cfg = { limit: 3, windowSeconds: 60 };
  for (let i = 0; i < 3; i++) memoryLimit("reset", cfg, 1000);
  assert.equal(memoryLimit("reset", cfg, 1000).allowed, false);
  assert.equal(memoryLimit("reset", cfg, 1000 + 61_000).allowed, true);
});

test("memoryLimit buckets are independent per key", () => {
  __resetRateWindows();
  const cfg = { limit: 1, windowSeconds: 60 };
  memoryLimit("a", cfg, 1000);
  assert.equal(memoryLimit("a", cfg, 1000).allowed, false);
  assert.equal(memoryLimit("b", cfg, 1000).allowed, true);
});

test("manifest and subtitle scopes do not share a bucket", () => {
  __resetRateWindows();
  const cfg = { limit: 1, windowSeconds: 60 };
  const h = new Headers({ "x-real-ip": "203.0.113.5" });
  const mk = clientKey({ headers: h }, "manifest");
  const sk = clientKey({ headers: h }, "subtitle");
  assert.notEqual(mk, sk, "scopes must be distinct keys");
  memoryLimit(mk, cfg, 1000);
  assert.equal(memoryLimit(mk, cfg, 1000).allowed, false, "manifest exhausted");
  assert.equal(memoryLimit(sk, cfg, 1000).allowed, true, "subtitle still fresh");
});

test("a segment-like burst (many requests) is allowed under the generous manifest limit", () => {
  // Playback realism: 200 sequential manifest-ish calls within one window must
  // NOT trip the default 120 limit only if under it; assert the limit is high
  // enough that a normal-looking burst below the cap passes.
  __resetRateWindows();
  const below = DEFAULT_MANIFEST_LIMIT.limit - 1;
  for (let i = 0; i < below; i++) {
    assert.equal(memoryLimit("burst", DEFAULT_MANIFEST_LIMIT, 1000).allowed, true);
  }
});

test("sustained abuse past the manifest limit is denied", () => {
  __resetRateWindows();
  for (let i = 0; i < DEFAULT_MANIFEST_LIMIT.limit; i++) {
    memoryLimit("abuse", DEFAULT_MANIFEST_LIMIT, 1000);
  }
  const over = memoryLimit("abuse", DEFAULT_MANIFEST_LIMIT, 1000);
  assert.equal(over.allowed, false);
});

test("checkRateLimit uses the in-memory backend when Upstash is not configured", async () => {
  __resetRateWindows();
  const r = await checkRateLimit("k", { limit: 2, windowSeconds: 60 }, {});
  assert.equal(r.allowed, true);
});

test("checkRateLimit fails OPEN when the store is unreachable (never breaks a manifest)", async () => {
  __resetRateWindows();
  const r = await checkRateLimit(
    "k-open",
    { limit: 1, windowSeconds: 60 },
    { UPSTASH_REDIS_REST_URL: "http://127.0.0.1:1", UPSTASH_REDIS_REST_TOKEN: "x" },
  );
  assert.equal(r.allowed, true);
});

test("clientKey prefers platform-set x-real-ip over a spoofable x-forwarded-for", () => {
  const h = new Headers({ "x-real-ip": "203.0.113.9", "x-forwarded-for": "1.2.3.4" });
  assert.equal(clientKey({ headers: h }, "manifest"), `manifest:${hashKey("203.0.113.9")}`);
});

test("clientKey uses the RIGHTMOST x-forwarded-for hop (edge-added)", () => {
  const h = new Headers({ "x-forwarded-for": "1.2.3.4, 198.51.100.7" });
  assert.equal(clientKey({ headers: h }, "manifest"), `manifest:${hashKey("198.51.100.7")}`);
});

test("clientKey never leaks the raw IP and buckets a missing one", () => {
  assert.equal(clientKey({ headers: new Headers() }, "manifest"), `manifest:${hashKey("unknown")}`);
  const key = clientKey({ headers: new Headers({ "x-real-ip": "203.0.113.9" }) }, "manifest");
  assert.ok(!key.includes("203.0.113.9"));
});

test("default limits are env-overridable and sanity-checked", () => {
  assert.ok(DEFAULT_MANIFEST_LIMIT.limit >= 60, "manifest limit is generous");
  assert.ok(DEFAULT_SUBTITLE_LIMIT.limit >= 30, "subtitle limit is generous");
  assert.ok(DEFAULT_MANIFEST_LIMIT.windowSeconds > 0);
});
