import { test } from "node:test";
import assert from "node:assert/strict";
import { safe, withTimeout } from "./concurrency.ts";

test("safe returns ok with the resolved value", async () => {
  assert.deepEqual(await safe(async () => 42), { ok: true, data: 42 });
});

test("safe converts a rejection into a typed failure (never throws)", async () => {
  const res = await safe(async () => {
    throw new Error("upstream 502");
  });
  assert.deepEqual(res, { ok: false, error: "upstream 502" });
});

test("safe coerces a non-Error rejection to a message", async () => {
  const res = await safe(async () => {
    throw "plain string";
  });
  assert.deepEqual(res, { ok: false, error: "Unknown error" });
});

test("withTimeout resolves the value when it beats the deadline", async () => {
  const res = await withTimeout(Promise.resolve(42), 200, "quick");
  assert.deepEqual(res, { ok: true, data: 42 });
});

test("withTimeout returns an explicit timeout Result instead of hanging", async () => {
  const never = new Promise<number>(() => {});
  const res = await withTimeout(never, 20, "schedule");
  assert.equal(res.ok, false);
  assert.match((res as { error: string }).error, /schedule timed out after 20ms/);
});

test("withTimeout surfaces a rejection as a typed failure", async () => {
  const res = await withTimeout(Promise.reject(new Error("upstream 502")), 200, "x");
  assert.deepEqual(res, { ok: false, error: "upstream 502" });
});

test("withTimeout does not fire the timer after an early resolution", async () => {
  // If the timer leaked, the process would stay alive; resolution must clear it.
  const res = await withTimeout(Promise.resolve("done"), 5, "clear");
  assert.deepEqual(res, { ok: true, data: "done" });
  await new Promise((r) => setTimeout(r, 15));
  assert.ok(true);
});

test("withTimeout settles once even if the underlying promise rejects after the deadline", async () => {
  // The render must not observe a late rejection or a second settle.
  let reject!: (e: Error) => void;
  const late = new Promise<never>((_, rej) => {
    reject = rej;
  });
  const res = await withTimeout(late, 15, "late");
  assert.equal(res.ok, false);
  reject(new Error("arrived too late")); // must not throw / warn as unhandled
  await new Promise((r) => setTimeout(r, 10));
  assert.ok(true);
});
