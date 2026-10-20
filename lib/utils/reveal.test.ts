import { test } from "node:test";
import assert from "node:assert/strict";
import { revealDelay } from "./reveal.ts";

test("revealDelay emits a valid --reveal-delay in milliseconds", () => {
  const style = revealDelay(180) as Record<string, string>;
  assert.equal(style["--reveal-delay"], "180ms");
});

test("revealDelay treats 0 as an instant (0ms) delay, not a dropped prop", () => {
  // The reveal CSS reads `var(--reveal-delay, 0ms)`; emitting the explicit
  // 0ms keeps the call site's intent visible and the value deterministic.
  const style = revealDelay(0) as Record<string, string>;
  assert.equal(style["--reveal-delay"], "0ms");
});
