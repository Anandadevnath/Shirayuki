import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { apiFetch } from "./client.ts";

/**
 * In-flight deduplication + retry/backoff contract for the provider client.
 *
 * `globalThis.fetch` is stubbed so no network is touched. The tests pin:
 *  - concurrent identical requests collapse to ONE upstream fetch (stampede
 *    guard), while distinct URLs stay distinct;
 *  - a transient 5xx is retried;
 *  - a deterministic 404/400 is NOT retried (watch failover must stay fast);
 *  - a transient failure past the retry budget surfaces as a thrown Error.
 */

const enc = z.object({ success: z.boolean().optional(), data: z.object({ v: z.number() }) });

function stubFetch(handler: (url: string, init?: RequestInit) => Promise<Response>) {
  const original = globalThis.fetch;
  globalThis.fetch = ((url: string | URL, init?: RequestInit) =>
    handler(String(url), init)) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

test("concurrent identical requests dedupe to a single upstream fetch", async () => {
  let calls = 0;
  const restore = stubFetch(async () => {
    calls++;
    await new Promise((r) => setTimeout(r, 20));
    return json({ success: true, data: { v: 7 } });
  });
  try {
    const [a, b, c] = await Promise.all([
      apiFetch("/api/v2/hianime/same", enc, { noStore: true }),
      apiFetch("/api/v2/hianime/same", enc, { noStore: true }),
      apiFetch("/api/v2/hianime/same", enc, { noStore: true }),
    ]);
    assert.equal(calls, 1, "three identical in-flight calls must share one fetch");
    assert.deepEqual(a, b);
    assert.deepEqual(b, c);
  } finally {
    restore();
  }
});

test("distinct URLs are not deduped together", async () => {
  const seen: string[] = [];
  const restore = stubFetch(async (url) => {
    seen.push(url);
    return json({ success: true, data: { v: url.length } });
  });
  try {
    await Promise.all([
      apiFetch("/api/v2/hianime/a", enc, { noStore: true }),
      apiFetch("/api/v2/hianime/b", enc, { noStore: true }),
    ]);
    assert.equal(seen.length, 2);
  } finally {
    restore();
  }
});

test("a request is not deduped against an already-settled one (map is cleared)", async () => {
  let calls = 0;
  const restore = stubFetch(async () => {
    calls++;
    return json({ success: true, data: { v: 1 } });
  });
  try {
    await apiFetch("/api/v2/hianime/seq", enc, { noStore: true });
    await apiFetch("/api/v2/hianime/seq", enc, { noStore: true });
    assert.equal(calls, 2, "sequential identical calls are separate requests");
  } finally {
    restore();
  }
});

test("a transient 5xx is retried then succeeds", async () => {
  let calls = 0;
  const restore = stubFetch(async () => {
    calls++;
    if (calls === 1) return json({ error: "gate" }, 503);
    return json({ success: true, data: { v: 9 } });
  });
  try {
    const res = await apiFetch("/api/v2/hianime/retry", enc, { noStore: true });
    assert.equal(calls, 2);
    assert.equal(res.data.v, 9);
  } finally {
    restore();
  }
});

test("a deterministic 404 is NOT retried", async () => {
  let calls = 0;
  const restore = stubFetch(async () => {
    calls++;
    return json({ error: "missing" }, 404);
  });
  try {
    await assert.rejects(
      apiFetch("/api/v2/hianime/absent", enc, { noStore: true }),
      /HTTP 404/,
    );
    assert.equal(calls, 1, "404 must exit after a single attempt");
  } finally {
    restore();
  }
});

test("transient failures past the retry budget throw", async () => {
  let calls = 0;
  const restore = stubFetch(async () => {
    calls++;
    return json({ error: "always down" }, 500);
  });
  try {
    await assert.rejects(
      apiFetch("/api/v2/hianime/down", enc, { noStore: true }),
      /HTTP 500/,
    );
    assert.equal(calls, 3, "three bounded attempts, then give up");
  } finally {
    restore();
  }
});

test("Retry-After on a 429 is honored and capped (never retried faster than asked)", async () => {
  let calls = 0;
  const restore = stubFetch(async () => {
    calls++;
    if (calls === 1) {
      return new Response(JSON.stringify({ error: "slow down" }), {
        status: 429,
        headers: { "content-type": "application/json", "retry-after": "0" },
      });
    }
    return json({ success: true, data: { v: 3 } });
  });
  try {
    const start = Date.now();
    const res = await apiFetch("/api/v2/hianime/gate", enc, { noStore: true });
    assert.equal(calls, 2);
    assert.equal(res.data.v, 3);
    // retry-after: 0 → retry immediately, not after the 400ms default backoff.
    assert.ok(Date.now() - start < 350, "Retry-After 0 should skip the default backoff");
  } finally {
    restore();
  }
});

test("a malformed payload fails schema validation and throws", async () => {
  const restore = stubFetch(async () => json({ success: true, data: { wrong: "shape" } }));
  try {
    await assert.rejects(
      apiFetch("/api/v2/hianime/bad", enc, { noStore: true }),
      /Invalid|Expected|required/i,
    );
  } finally {
    restore();
  }
});
