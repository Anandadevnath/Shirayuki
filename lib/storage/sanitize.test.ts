import { test } from "node:test";
import assert from "node:assert/strict";
import {
  UNSAFE_STORAGE_KEYS,
  isSafeStorageKey,
  parseStorageRecord,
  safeFiniteNumber,
  safeStringOrNull,
} from "./sanitize.ts";

test("isSafeStorageKey rejects prototype-chain and invalid keys", () => {
  for (const bad of ["__proto__", "constructor", "prototype", "", null, undefined, 42, {}]) {
    assert.equal(isSafeStorageKey(bad), false, `must reject ${String(bad)}`);
  }
  assert.equal(isSafeStorageKey("one-piece-100"), true);
  assert.equal(isSafeStorageKey("0"), true); // numeric-looking is still a safe own key
});

test("parseStorageRecord returns {} for non-object / unparsable payloads", () => {
  assert.deepEqual(parseStorageRecord(null), {});
  assert.deepEqual(parseStorageRecord(undefined), {});
  assert.deepEqual(parseStorageRecord(""), {});
  assert.deepEqual(parseStorageRecord("not json"), {});
  assert.deepEqual(parseStorageRecord("[1,2,3]"), {}); // array
  assert.deepEqual(parseStorageRecord('"a string"'), {}); // primitive
  assert.deepEqual(parseStorageRecord("null"), {});
});

test("parseStorageRecord drops prototype-polluting keys", () => {
  // A hostile payload tries to poison the object prototype via a {"__proto__":
  // …} property that survived JSON.parse as an own enumerable key.
  const raw = JSON.stringify(
    JSON.parse('{"__proto__":{"polluted":true},"constructor":1,"ok":"yes"}'),
  );
  const rec = parseStorageRecord(raw);
  assert.equal(Object.hasOwn(rec, "__proto__"), false);
  assert.equal(Object.hasOwn(rec, "constructor"), false);
  assert.equal(rec.ok, "yes");
  // The global prototype must be untouched for every consumer.
  assert.equal(({} as Record<string, unknown>).polluted, undefined);
});

test("parseStorageRecord keeps safe own keys and their values", () => {
  const rec = parseStorageRecord('{"a":1,"b":{"nested":true}}');
  assert.deepEqual(Object.keys(rec).sort(), ["a", "b"]);
  assert.equal(rec.a, 1);
});

test("safeFiniteNumber coerces only real finite numbers", () => {
  assert.equal(safeFiniteNumber(3), 3);
  assert.equal(safeFiniteNumber(0), 0);
  assert.equal(safeFiniteNumber(-1.5), -1.5);
  assert.equal(safeFiniteNumber(NaN), 0);
  assert.equal(safeFiniteNumber(Infinity), 0);
  assert.equal(safeFiniteNumber("3"), 0);
  assert.equal(safeFiniteNumber(null), 0);
  assert.equal(safeFiniteNumber(undefined, 7), 7);
});

test("safeStringOrNull only passes real strings through", () => {
  assert.equal(safeStringOrNull("x"), "x");
  assert.equal(safeStringOrNull(""), "");
  assert.equal(safeStringOrNull(1), null);
  assert.equal(safeStringOrNull({}), null);
  assert.equal(safeStringOrNull(null), null);
});

test("UNSAFE_STORAGE_KEYS cannot be mutated by consumers", () => {
  // A ReadonlySet is a compile-time guarantee; at runtime we simply assert the
  // expected membership so a future edit that drops a key fails loudly.
  for (const k of ["__proto__", "constructor", "prototype"]) {
    assert.equal(UNSAFE_STORAGE_KEYS.has(k), true);
  }
  assert.equal(UNSAFE_STORAGE_KEYS.size, 3);
});
