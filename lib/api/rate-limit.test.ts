import { test } from "node:test";
import assert from "node:assert/strict";
import {
  memoryLimit,
  checkRateLimit,
  clientKey,
  hashKey,
  withinDeclaredSize,
  __resetMemoryWindows,
  __resetAllowMemo,
  type RateLimiter,
} from "./rate-limit.ts";

test("memoryLimit allows up to the limit then denies within the window", () => {
  __resetMemoryWindows();
  const key = "test:burst";
  for (let i = 0; i < 5; i++) {
    const r = memoryLimit(key, 5, 60, 1000);
    assert.equal(r.allowed, true, `request ${i + 1} should be allowed`);
  }
  const denied = memoryLimit(key, 5, 60, 1000);
  assert.equal(denied.allowed, false);
  assert.equal(denied.remaining, 0);
  assert.ok(denied.retryAfterSeconds > 0);
});

test("memoryLimit resets after the window elapses", () => {
  __resetMemoryWindows();
  const key = "test:reset";
  for (let i = 0; i < 3; i++) memoryLimit(key, 3, 60, 1000);
  assert.equal(memoryLimit(key, 3, 60, 1000).allowed, false);
  // 61s later the window is fresh.
  assert.equal(memoryLimit(key, 3, 60, 1000 + 61_000).allowed, true);
});

test("memoryLimit counts are independent per key", () => {
  __resetMemoryWindows();
  memoryLimit("a", 1, 60, 1000);
  // a is now exhausted, b is fresh.
  assert.equal(memoryLimit("a", 1, 60, 1000).allowed, false);
  assert.equal(memoryLimit("b", 1, 60, 1000).allowed, true);
});

test("checkRateLimit uses the in-memory backend when Upstash env is absent", async () => {
  __resetMemoryWindows();
  const r = await checkRateLimit("k", { limit: 2, windowSeconds: 60, denyOnError: false }, {});
  assert.equal(r.source, "memory");
  assert.equal(r.allowed, true);
});

test("checkRateLimit fails OPEN when the configured backend errors and denyOnError is false", async () => {
  __resetMemoryWindows();
  __resetAllowMemo();
  const r = await checkRateLimit(
    "k-failopen",
    { limit: 1, windowSeconds: 60, denyOnError: false },
    { UPSTASH_REDIS_REST_URL: "http://127.0.0.1:1", UPSTASH_REDIS_REST_TOKEN: "x" },
  );
  // Upstash unreachable → falls back to memory, never denies outright.
  assert.equal(r.allowed, true);
});

test("checkRateLimit fails CLOSED when the backend errors and denyOnError is true", async () => {
  __resetMemoryWindows();
  __resetAllowMemo();
  const r = await checkRateLimit(
    "k-failclosed",
    { limit: 1, windowSeconds: 60, denyOnError: true },
    { UPSTASH_REDIS_REST_URL: "http://127.0.0.1:1", UPSTASH_REDIS_REST_TOKEN: "x" },
  );
  assert.equal(r.allowed, false);
  assert.equal(r.source, "none");
});

test("a pluggable RateLimiter can be satisfied by a fake (interface contract)", async () => {
  const fake: RateLimiter = {
    async limit() {
      return { allowed: false, remaining: 0, retryAfterSeconds: 42, source: "none" };
    },
  };
  const r = await fake.limit("k", 1, 60);
  assert.equal(r.allowed, false);
  assert.equal(r.retryAfterSeconds, 42);
});

test("clientKey prefers the platform-set x-real-ip over a spoofable x-forwarded-for", () => {
  const h = new Headers({
    "x-real-ip": "203.0.113.9",
    "x-forwarded-for": "1.2.3.4",
  });
  const key = clientKey({ headers: h }, "stream");
  assert.equal(key, `stream:${hashKey("203.0.113.9")}`);
});

test("clientKey hashes the IP and is stable + scope-prefixed", () => {
  const mk = (ip: string) => new Headers({ "x-real-ip": ip });
  const a = clientKey({ headers: mk("203.0.113.9") }, "stream");
  const b = clientKey({ headers: mk("203.0.113.9") }, "stream");
  assert.equal(a, b, "same IP + scope → same key");
  assert.ok(a.startsWith("stream:"), "scope is a prefix");
  assert.ok(!a.includes("203.0.113.9"), "raw IP must not appear in the key");
});

test("clientKey uses the RIGHTMOST x-forwarded-for hop (edge-added), not the spoofable leftmost", () => {
  const h = new Headers({ "x-forwarded-for": "1.2.3.4, 198.51.100.7" });
  const key = clientKey({ headers: h }, "stream");
  assert.equal(key, `stream:${hashKey("198.51.100.7")}`);
});

test("clientKey buckets a missing IP into the 'unknown' bucket", () => {
  const key = clientKey({ headers: new Headers() }, "stream");
  assert.equal(key, `stream:${hashKey("unknown")}`);
});

test("withinDeclaredSize rejects oversized declared Content-Length", () => {
  assert.equal(withinDeclaredSize("100", 1000), true);
  assert.equal(withinDeclaredSize("1000", 1000), true);
  assert.equal(withinDeclaredSize("1001", 1000), false);
  assert.equal(withinDeclaredSize(null, 1000), true, "unknown length is allowed (enforced while streaming)");
  assert.equal(withinDeclaredSize("not-a-number", 1000), true);
});
