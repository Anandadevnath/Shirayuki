import { test } from "node:test";
import assert from "node:assert/strict";
import {
  withinDeclaredSize,
  readTextWithinLimit,
  MAX_PLAYLIST_BYTES,
  MAX_SUBTITLE_BYTES,
} from "./bounded-body.ts";

/** Build a one-shot ReadableStream from byte chunks. */
function streamOf(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(c) {
      for (const ch of chunks) c.enqueue(ch);
      c.close();
    },
  });
}

test("withinDeclaredSize accepts bodies at/under the cap", () => {
  assert.equal(withinDeclaredSize("0", 1000), true);
  assert.equal(withinDeclaredSize("999", 1000), true);
  assert.equal(withinDeclaredSize("1000", 1000), true);
});

test("withinDeclaredSize rejects a declared-oversized body", () => {
  assert.equal(withinDeclaredSize("1001", 1000), false);
  assert.equal(withinDeclaredSize(String(MAX_PLAYLIST_BYTES + 1), MAX_PLAYLIST_BYTES), false);
});

test("withinDeclaredSize treats unknown/odd lengths as unknown (allow, cap while reading)", () => {
  assert.equal(withinDeclaredSize(null, 1000), true);
  assert.equal(withinDeclaredSize("", 1000), true);
  assert.equal(withinDeclaredSize("not-a-number", 1000), true);
  assert.equal(withinDeclaredSize("-5", 1000), true);
  assert.equal(withinDeclaredSize("100, 100", 1000), true);
});

test("readTextWithinLimit decodes a body under the cap", async () => {
  const enc = new TextEncoder();
  const r = await readTextWithinLimit(streamOf([enc.encode("hello "), enc.encode("world")]), 100);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.text, "hello world");
});

test("readTextWithinLimit returns an empty string for a null body", async () => {
  const r = await readTextWithinLimit(null, 100);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.text, "");
});

test("readTextWithinLimit aborts once the byte cap is exceeded", async () => {
  const enc = new TextEncoder();
  // 3 chunks of 10 bytes, cap 15 → must fail on the second chunk.
  const r = await readTextWithinLimit(
    streamOf([enc.encode("aaaaaaaaaa"), enc.encode("bbbbbbbbbb"), enc.encode("cccccccccc")]),
    15,
  );
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "too_large");
});

test("readTextWithinLimit aborts a multi-MB body well under the default cap", async () => {
  // Simulate 8 MiB streamed in 1 MiB chunks against the 4 MiB playlist cap.
  const oneMiB = new Uint8Array(1024 * 1024).fill(65);
  const chunks = Array.from({ length: 8 }, () => oneMiB);
  const r = await readTextWithinLimit(streamOf(chunks), MAX_PLAYLIST_BYTES);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "too_large");
});

test("readTextWithinLimit allows a body exactly at the cap", async () => {
  const exact = new Uint8Array(1000).fill(66);
  const r = await readTextWithinLimit(streamOf([exact]), 1000);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.text.length, 1000);
});

test("readTextWithinLimit reports a read failure distinctly from over-size", async () => {
  const failing = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(new Uint8Array([1, 2, 3]));
      c.error(new Error("boom"));
    },
  });
  const r = await readTextWithinLimit(failing, 1000);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "read_failed");
});

test("subtitle cap is smaller than the playlist cap (sanity)", () => {
  assert.ok(MAX_SUBTITLE_BYTES < MAX_PLAYLIST_BYTES);
});
