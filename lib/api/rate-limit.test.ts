import { test } from "node:test";
import assert from "node:assert/strict";
import {
  memoryLimit,
  checkRateLimit,
  clientKey,
  hashKey,
  withinDeclaredSize,
  __resetLimiterState,
} from "./rate-limit.ts";

test("memoryLimit allows up to the limit then denies within the window", () => {
  __resetLimiterState();
  const key = "test:burst";
  for (let i = 0; i < 5; i++) {
    assert.equal(memoryLimit(key, 5, 60, 1000).allowed, true, `request ${i + 1} allowed`);
  }
  const denied = memoryLimit(key, 5, 60, 1000);
  assert.equal(denied.allowed, false);
  assert.equal(denied.remaining, 0);
  assert.ok(denied.retryAfterSeconds > 0);
});

test("memoryLimit resets after the window elapses", () => {
  __resetLimiterState();
  const key = "test:reset";
  for (let i = 0; i < 3; i++) memoryLimit(key, 3, 60, 1000);
  assert.equal(memoryLimit(key, 3, 60, 1000).allowed, false);
  assert.equal(memoryLimit(key, 3, 60, 1000 + 61_000).allowed, true);
});

test("memoryLimit counts are independent per key", () => {
  __resetLimiterState();
  memoryLimit("a", 1, 60, 1000);
  assert.equal(memoryLimit("a", 1, 60, 1000).allowed, false);
  assert.equal(memoryLimit("b", 1, 60, 1000).allowed, true);
});

test("checkRateLimit uses the in-memory backend when Upstash env is absent", async () => {
  __resetLimiterState();
  const r = await checkRateLimit("k", { limit: 2, windowSeconds: 60, denyOnError: false }, {});
  assert.equal(r.allowed, true);
});

test("checkRateLimit fails OPEN when the backend errors and denyOnError is false", async () => {
  __resetLimiterState();
  const r = await checkRateLimit(
    "k-failopen",
    { limit: 1, windowSeconds: 60, denyOnError: false },
    { UPSTASH_REDIS_REST_URL: "http://127.0.0.1:1", UPSTASH_REDIS_REST_TOKEN: "x" },
  );
  assert.equal(r.allowed, true);
});

test("checkRateLimit fails CLOSED when the backend errors and denyOnError is true", async () => {
  __resetLimiterState();
  const r = await checkRateLimit(
    "k-failclosed",
    { limit: 1, windowSeconds: 60, denyOnError: true },
    { UPSTASH_REDIS_REST_URL: "http://127.0.0.1:1", UPSTASH_REDIS_REST_TOKEN: "x" },
  );
  assert.equal(r.allowed, false);
});

test("clientKey prefers the platform-set x-real-ip over a spoofable x-forwarded-for", () => {
  const h = new Headers({ "x-real-ip": "203.0.113.9", "x-forwarded-for": "1.2.3.4" });
  assert.equal(clientKey({ headers: h }, "stream"), `stream:${hashKey("203.0.113.9")}`);
});

test("clientKey uses the RIGHTMOST x-forwarded-for hop (edge-added), not the spoofable leftmost", () => {
  const h = new Headers({ "x-forwarded-for": "1.2.3.4, 198.51.100.7" });
  assert.equal(clientKey({ headers: h }, "stream"), `stream:${hashKey("198.51.100.7")}`);
});

test("clientKey buckets a missing IP and never leaks the raw IP", () => {
  assert.equal(clientKey({ headers: new Headers() }, "stream"), `stream:${hashKey("unknown")}`);
  const key = clientKey({ headers: new Headers({ "x-real-ip": "203.0.113.9" }) }, "stream");
  assert.ok(key.startsWith("stream:") && !key.includes("203.0.113.9"));
});

test("withinDeclaredSize rejects oversized declared Content-Length", () => {
  assert.equal(withinDeclaredSize("100", 1000), true);
  assert.equal(withinDeclaredSize("1000", 1000), true);
  assert.equal(withinDeclaredSize("1001", 1000), false);
  assert.equal(withinDeclaredSize(null, 1000), true);
  assert.equal(withinDeclaredSize("not-a-number", 1000), true);
});
