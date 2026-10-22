import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  contrastRatio,
  oklchToRgb,
  composite,
  parseOklch,
  AA_NORMAL,
  AA_LARGE,
} from "./contrast.ts";

// Read the real tokens straight from globals.css so a palette edit that
// regresses contrast fails the suite (this is the guardrail that was missing
// when `muted` / `faint` silently drifted below AA).
const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "..", "..", "app", "globals.css"), "utf8");

function token(name: string): string {
  const m = css.match(new RegExp(`--color-${name}:\\s*([^;]+);`));
  assert.ok(m, `token --color-${name} not found in globals.css`);
  return m![1].trim();
}

function rgb(name: string): [number, number, number] {
  const [l, c, h] = parseOklch(token(name));
  return oklchToRgb(l, c, h);
}

const surfaces = ["base", "surface", "surface-2"] as const;

// Any body-size foreground must clear AA (4.5) on EVERY dark surface it can
// sit on — including surface-2, the lightest step.
test("snow clears AA on every surface", () => {
  for (const s of surfaces) {
    assert.ok(
      contrastRatio(rgb("snow"), rgb(s)) >= AA_NORMAL,
      `snow on ${s} below AA`,
    );
  }
});

test("muted clears AA on every surface", () => {
  for (const s of surfaces) {
    assert.ok(
      contrastRatio(rgb("muted"), rgb(s)) >= AA_NORMAL,
      `muted on ${s} below AA`,
    );
  }
});

test("faint clears AA on every surface", () => {
  for (const s of surfaces) {
    assert.ok(
      contrastRatio(rgb("faint"), rgb(s)) >= AA_NORMAL,
      `faint on ${s} below AA`,
    );
  }
});

// Frost is the single accent used for links/labels on the dark canvas.
test("frost clears AA on base and surface", () => {
  for (const s of ["base", "surface"] as const) {
    assert.ok(
      contrastRatio(rgb("frost"), rgb(s)) >= AA_NORMAL,
      `frost on ${s} below AA`,
    );
  }
});

// The frost-family surfaces carry DARK ink (the .on-frost role). The
// canonical ink is the canvas colour; assert the pair is legible.
test("canvas ink clears AA on frost", () => {
  assert.ok(
    contrastRatio(rgb("base"), rgb("frost")) >= AA_NORMAL,
    "dark ink on frost below AA",
  );
});

// Semantic colours are used for small status text on the dark canvas.
test("semantic colours clear AA on base", () => {
  for (const s of ["warning", "success", "danger", "sakura"] as const) {
    assert.ok(
      contrastRatio(rgb(s), rgb("base")) >= AA_NORMAL,
      `${s} on base below AA`,
    );
  }
});

// Large-text-only tokens only need the 3:1 large threshold, but document the
// floor so a future edit can't silently make them illegible.
test("frost-deep is only legible as large text", () => {
  assert.ok(
    contrastRatio(rgb("frost-deep"), rgb("base")) >= AA_LARGE,
    "frost-deep on base below even the large-text floor",
  );
});

// A foreground guaranteed dark-ish must never be used as body text on the
// dark canvas — this documents the collision that caused the bug.
test("canvas colour is not legible on the canvas (documents the bug)", () => {
  const r = contrastRatio(rgb("base"), rgb("base"));
  assert.ok(r < 1.5, "base-on-base should be near-invisible");
});

// `.glass` is base at 35% alpha over whatever sits behind it. Over a bright
// poster region (a deliberate synthetic worst case — a 35%-opaque panel over a
// mid-grey image), the LOW-emphasis token must still clear the large-text
// floor; the primary meta token must clear AA outright.
test("muted + faint hold up over .glass on a bright poster", () => {
  const brightPoster = oklchToRgb(0.5, 0.02, 250);
  const glassOverPoster = composite(rgb("base"), brightPoster, 0.35);
  assert.ok(
    contrastRatio(rgb("muted"), glassOverPoster) >= AA_NORMAL,
    "muted over glass/poster below AA",
  );
  assert.ok(
    contrastRatio(rgb("faint"), glassOverPoster) >= AA_LARGE,
    "faint over glass/poster below the large-text floor",
  );
});
