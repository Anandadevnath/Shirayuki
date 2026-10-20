import { test } from "node:test";
import assert from "node:assert/strict";
import {
  nextRecovery,
  initialRecovery,
  MAX_NETWORK_RECOVERIES,
  MAX_MEDIA_RECOVERIES,
} from "./recovery.ts";

test("network errors are retried up to the budget then exhaust", () => {
  let state = initialRecovery;
  for (let i = 0; i < MAX_NETWORK_RECOVERIES; i++) {
    const r = nextRecovery(state, "networkError");
    assert.equal(r.action.kind, "network", `attempt ${i + 1} should retry`);
    state = r.state;
  }
  const last = nextRecovery(state, "networkError");
  assert.equal(last.action.kind, "exhausted");
});

test("media errors have their own independent budget", () => {
  let state = initialRecovery;
  for (let i = 0; i < MAX_MEDIA_RECOVERIES; i++) {
    const r = nextRecovery(state, "mediaError");
    assert.equal(r.action.kind, "media");
    state = r.state;
  }
  assert.equal(nextRecovery(state, "mediaError").action.kind, "exhausted");
});

test("a network recovery does not consume media budget and vice versa", () => {
  const a = nextRecovery(initialRecovery, "networkError");
  const b = nextRecovery(a.state, "mediaError");
  assert.equal(b.state.network, 1);
  assert.equal(b.state.media, 1);
});

test("interleaved recoverable errors eventually exhaust (no infinite loop)", () => {
  let state = initialRecovery;
  let guard = 0;
  let exhausted = false;
  while (guard++ < 50) {
    const type = guard % 2 === 0 ? "networkError" : "mediaError";
    const r = nextRecovery(state, type);
    state = r.state;
    if (r.action.kind === "exhausted") {
      exhausted = true;
      break;
    }
  }
  assert.ok(exhausted, "a persistently failing source must terminate");
  assert.ok(guard < 10, "must terminate quickly, not spin");
});

test("unknown fatal error types are immediately terminal", () => {
  const r = nextRecovery(initialRecovery, "otherError");
  assert.equal(r.action.kind, "exhausted");
  assert.deepEqual(r.state, initialRecovery, "terminal verdict must not mutate counters");
});

test("state is not mutated in place", () => {
  const before = { network: 0, media: 0 };
  const snapshot = { ...before };
  nextRecovery(before, "networkError");
  assert.deepEqual(before, snapshot);
});
