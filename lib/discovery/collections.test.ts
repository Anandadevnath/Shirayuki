import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COLLECTIONS,
  DEFAULT_COLLECTION_ID,
  collectionById,
  collectionForBrowseKey,
  collectionPath,
  defaultCollection,
  homeBucket,
  HOME_COLLECTION_KEYS,
} from "./collections.ts";

test("collections: ids are unique", () => {
  const ids = COLLECTIONS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("collections: the default exists and is the canonical most-popular", () => {
  const def = defaultCollection();
  assert.equal(def.id, DEFAULT_COLLECTION_ID);
  assert.equal(def.source, "browse");
  assert.equal(def.key, "most-popular");
});

test("collections: every option has a non-empty label, key and header copy", () => {
  for (const c of COLLECTIONS) {
    assert.ok(c.label.length > 0, `${c.id} label`);
    assert.ok(c.key.length > 0, `${c.id} key`);
    assert.ok(c.title.length > 0, `${c.id} title`);
  }
});

test("collections: Popular, Top Airing and Trending are distinctly mapped", () => {
  const popular = collectionById("popular");
  const airing = collectionById("airing");
  const topAiring = collectionById("top-airing");
  const trending = collectionById("trending");
  assert.equal(popular?.key, "most-popular");
  assert.equal(airing?.key, "top-airing");
  // Top Airing is NOT the same entry as Airing: it comes from the home bucket
  // so it keeps a distinct selection + URL.
  assert.equal(topAiring?.source, "home");
  assert.equal(topAiring?.key, "Top Airing");
  assert.notEqual(airing?.id, topAiring?.id);
  // Trending is NOT a browse id — it comes from the home payload.
  assert.equal(trending?.source, "home");
  assert.equal(trending?.key, "trending");
  // They must not collapse onto the same source.
  assert.notEqual(popular?.key, airing?.key);
});

test("collections: homeBucket maps every home-backed key", () => {
  const home = {
    trending: ["t"],
    topAiring: ["a"],
    latestEpisodes: ["e"],
  };
  assert.deepEqual(homeBucket(home, "trending"), ["t"]);
  assert.deepEqual(homeBucket(home, "Top Airing"), ["a"]);
  assert.deepEqual(homeBucket(home, "Latest Episode"), ["e"]);
  assert.deepEqual(homeBucket(home, "unknown"), []);
});

test("collections: collectionPath gives canonical + shareable URLs", () => {
  assert.equal(collectionPath("all"), "/category/most-popular");
  assert.equal(collectionPath("popular"), "/category/most-popular");
  assert.equal(collectionPath("airing"), "/category/top-airing");
  // Home-backed collections keep the canonical path and carry a param.
  assert.equal(collectionPath("trending"), "/category/most-popular?collection=trending");
  assert.equal(
    collectionPath("latest-episodes"),
    "/category/most-popular?collection=latest-episodes",
  );
});

test("collections: browse keys resolve back to their collection (first wins)", () => {
  assert.equal(collectionForBrowseKey("most-popular")?.id, "all");
  assert.equal(collectionForBrowseKey("most-favorite")?.id, "most-favorite");
  assert.equal(collectionForBrowseKey("nonexistent"), undefined);
});

test("collections: home collection keys are exactly the home-backed buckets", () => {
  assert.deepEqual(
    [...HOME_COLLECTION_KEYS].sort(),
    ["Latest Episode", "Top Airing", "trending"],
  );
});
