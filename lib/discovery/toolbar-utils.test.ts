import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyDiscoveryFilters,
  compareTitle,
  distinctTypes,
  hasActiveFilters,
  hasRank,
  hasTypeChoice,
  resultCaption,
  sortItems,
} from "./toolbar-utils.ts";
import type { AnimeCardModel } from "../providers/types.ts";

const card = (over: Partial<AnimeCardModel>): AnimeCardModel => ({
  id: over.id ?? "x",
  title: over.title ?? "Untitled",
  jname: null,
  poster: null,
  type: null,
  episodes: { sub: null, dub: null },
  rank: null,
  ...over,
});

const titles = (items: AnimeCardModel[]) => items.map((i) => i.title);

test("distinctTypes: first-seen order, drops blanks and dupes", () => {
  const items = [
    card({ title: "a", type: "TV" }),
    card({ title: "b", type: "Movie" }),
    card({ title: "c", type: "TV" }),
    card({ title: "d", type: null }),
    card({ title: "e", type: "  " }),
  ];
  assert.deepEqual(distinctTypes(items), ["TV", "Movie"]);
});

test("hasTypeChoice: only true when the page mixes types", () => {
  assert.equal(hasTypeChoice(["TV", "Movie"]), true);
  assert.equal(hasTypeChoice(["TV"]), false);
  assert.equal(hasTypeChoice([]), false);
});

test("hasRank: true when at least one card carries a rank", () => {
  assert.equal(hasRank([card({ rank: null }), card({ rank: 3 })]), true);
  assert.equal(hasRank([card({ rank: null })]), false);
});

test("applyDiscoveryFilters: empty query + empty type is a passthrough", () => {
  const items = [card({ id: "1" }), card({ id: "2" })];
  const out = applyDiscoveryFilters(items, { query: "", type: [] });
  assert.equal(out, items, "returns the same array reference when inactive");
  assert.equal(applyDiscoveryFilters(items, { query: "   ", type: [] }), items);
});

test("applyDiscoveryFilters: title match is case-insensitive", () => {
  const items = [
    card({ id: "1", title: "Naruto Shippuden" }),
    card({ id: "2", title: "Bleach" }),
  ];
  assert.deepEqual(
    titles(applyDiscoveryFilters(items, { query: "NARUTO", type: [] })),
    ["Naruto Shippuden"],
  );
  assert.deepEqual(
    titles(applyDiscoveryFilters(items, { query: "  bleach ", type: [] })),
    ["Bleach"],
  );
});

test("applyDiscoveryFilters: type filter is exact and combines with query", () => {
  const items = [
    card({ id: "1", title: "One Piece", type: "TV" }),
    card({ id: "2", title: "One Punch", type: "OVA" }),
    card({ id: "3", title: "Bleach", type: "TV" }),
  ];
  assert.deepEqual(
    titles(applyDiscoveryFilters(items, { query: "", type: ["TV"] })),
    ["One Piece", "Bleach"],
  );
  assert.deepEqual(
    titles(applyDiscoveryFilters(items, { query: "one", type: ["TV"] })),
    ["One Piece"],
  );
  assert.deepEqual(applyDiscoveryFilters(items, { query: "one", type: ["Movie"] }), []);
});

test("applyDiscoveryFilters: multiple types union", () => {
  const items = [
    card({ id: "1", title: "One Piece", type: "TV" }),
    card({ id: "2", title: "One Punch", type: "OVA" }),
    card({ id: "3", title: "Bleach", type: "TV" }),
    card({ id: "4", title: "Akira", type: "Movie" }),
  ];
  assert.deepEqual(
    titles(applyDiscoveryFilters(items, { query: "", type: ["TV", "OVA"] })),
    ["One Piece", "One Punch", "Bleach"],
  );
});

test("applyDiscoveryFilters: type match is case-insensitive (canonical menu vs upstream)", () => {
  const items = [
    card({ id: "1", title: "One Piece", type: "TV" }),
    card({ id: "2", title: "Akira", type: "MOVIE" }),
  ];
  // The menu offers "Movie" (canonical), the upstream card type is "MOVIE".
  assert.deepEqual(
    titles(applyDiscoveryFilters(items, { query: "", type: ["Movie"] })),
    ["Akira"],
  );
  assert.deepEqual(
    titles(applyDiscoveryFilters(items, { query: "", type: ["movie"] })),
    ["Akira"],
  );
});

test("hasActiveFilters: whitespace query alone is not active", () => {
  assert.equal(hasActiveFilters({ query: "", type: [] }), false);
  assert.equal(hasActiveFilters({ query: "  ", type: [] }), false);
  assert.equal(hasActiveFilters({ query: "a", type: [] }), true);
  assert.equal(hasActiveFilters({ query: "", type: ["TV"] }), true);
  assert.equal(hasActiveFilters({ query: "", type: ["TV", "OVA"] }), true);
});

test("sortItems: title asc/desc is stable and locale-aware, input untouched", () => {
  const items = [
    card({ id: "1", title: "Étoile" }),
    card({ id: "2", title: "attack" }),
    card({ id: "3", title: "Bleach" }),
  ];
  const asc = sortItems(items, "title-asc");
  assert.deepEqual(titles(asc), ["attack", "Bleach", "Étoile"]);
  const desc = sortItems(items, "title-desc");
  assert.deepEqual(titles(desc), ["Étoile", "Bleach", "attack"]);
  // original order preserved
  assert.deepEqual(titles(items), ["Étoile", "attack", "Bleach"]);
});

test("compareTitle: accent/punctuation insensitive bucketing", () => {
  assert.equal(compareTitle(card({ title: "étoile" }), card({ title: "Etoile" })), 0);
});

test("sortItems: rank ascending with nulls last and title tiebreak", () => {
  const items = [
    card({ id: "1", title: "B", rank: null }),
    card({ id: "2", title: "C", rank: 2 }),
    card({ id: "3", title: "A", rank: 2 }),
    card({ id: "4", title: "D", rank: 1 }),
    card({ id: "5", title: "E", rank: null }),
  ];
  const sorted = sortItems(items, "rank");
  assert.deepEqual(sorted.map((i) => i.id), ["4", "3", "2", "1", "5"]);
  assert.deepEqual(
    sorted.map((i) => i.rank),
    [1, 2, 2, null, null],
  );
});

test("sortItems: 'default' keeps fetched order; unknown falls back to default", () => {
  const items = [card({ title: "b" }), card({ title: "a" })];
  assert.deepEqual(titles(sortItems(items, "default")), ["b", "a"]);
  assert.deepEqual(titles(sortItems(items, "title-asc")), ["a", "b"]);
});

test("resultCaption: unfiltered vs filtered wording", () => {
  assert.equal(resultCaption(24, 24), "24 titles");
  assert.equal(resultCaption(1, 24), "1 of 24 titles on this page");
  assert.equal(resultCaption(0, 24), "0 of 24 titles on this page");
  assert.equal(resultCaption(0, 0), "0 titles");
});
