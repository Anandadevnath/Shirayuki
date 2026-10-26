import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Minimal browser stubs so the leaf module's `typeof window` / `localStorage`
// reads work under `node --test`. The store is a single-key map, matching the
// real API surface the module uses.
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null; }
  setItem(k: string, v: string) { this.map.set(k, String(v)); }
  removeItem(k: string) { this.map.delete(k); }
  clear() { this.map.clear(); }
}
const storage = new MemoryStorage();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: storage,
  dispatchEvent: () => true,
};
(globalThis as unknown as { localStorage: unknown }).localStorage = storage;

const {
  getStatus, setStatus, removeFromList, isInList, listWatchlist, toggleList,
} = await import("./local.ts");

const item = { id: "jjk-1", title: "Jujutsu Kaisen", poster: null, type: "TV", totalEpisodes: 24 };

beforeEach(() => storage.clear());

test("a title not on the list has no status", () => {
  assert.equal(getStatus("jjk-1"), null);
  assert.equal(isInList("jjk-1"), false);
});

test("setStatus both adds the title and records the status", () => {
  const entry = setStatus(item, "WATCHING");
  assert.equal(entry?.status, "WATCHING");
  assert.equal(getStatus("jjk-1"), "WATCHING");
  assert.equal(isInList("jjk-1"), true);
});

test("each of the five statuses round-trips", () => {
  for (const s of ["WATCHING", "PLANNING", "COMPLETED", "ON_HOLD", "DROPPED"] as const) {
    setStatus(item, s);
    assert.equal(getStatus("jjk-1"), s);
  }
});

test("changing status preserves addedAt (no duplicate entry)", () => {
  setStatus(item, "WATCHING");
  const first = listWatchlist()[0]!.addedAt;
  setStatus(item, "COMPLETED");
  const all = listWatchlist().filter((e) => e.id === "jjk-1");
  assert.equal(all.length, 1, "status change must not create a second entry");
  assert.equal(all[0]!.addedAt, first);
});

test("removeFromList clears membership and status", () => {
  setStatus(item, "PLANNING");
  removeFromList("jjk-1");
  assert.equal(getStatus("jjk-1"), null);
  assert.equal(isInList("jjk-1"), false);
});

test("a prototype-polluting id is refused", () => {
  assert.equal(setStatus({ ...item, id: "__proto__" }, "WATCHING"), null);
  assert.equal(getStatus("__proto__"), null);
});

test("toggleList adds then removes (binary backward-compat path)", () => {
  assert.equal(toggleList(item), true);
  assert.equal(isInList("jjk-1"), true);
  assert.equal(toggleList(item), false);
  assert.equal(isInList("jjk-1"), false);
});

test("corrupted stored JSON is tolerated (treated as empty)", () => {
  storage.setItem("shirayuki:watchlist:v1", "{not json");
  assert.equal(getStatus("jjk-1"), null);
  assert.deepEqual(listWatchlist(), []);
});
