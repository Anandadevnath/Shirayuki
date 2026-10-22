import { test } from "node:test";
import assert from "node:assert/strict";
import { dedupeCharacters } from "./characters.ts";
import type { CharacterModel, VoiceActorModel } from "../types.ts";

const va = (id: string, name: string): VoiceActorModel => ({
  id,
  slug: id,
  name,
  poster: null,
  language: "Japanese",
  url: null,
});

const char = (over: Partial<CharacterModel>): CharacterModel => ({
  id: "c1",
  slug: null,
  name: "Luffy",
  poster: null,
  role: "Main",
  url: null,
  voiceActor: null,
  ...over,
});

test("collapses multiple VA rows for the same character id", () => {
  const list = [
    char({ voiceActor: va("va1", "Tanaka") }),
    char({ voiceActor: va("va2", "Yamada") }),
    char({ voiceActor: va("va3", "Suzuki") }),
  ];
  const out = dedupeCharacters(list);
  assert.equal(out.length, 1);
  assert.equal(out[0].voiceActor?.name, "Tanaka");
  assert.deepEqual(
    out[0].voiceActors?.map((v) => v.name),
    ["Tanaka", "Yamada", "Suzuki"],
  );
});

test("keeps a single-VA character's voiceActors undefined", () => {
  const out = dedupeCharacters([char({ voiceActor: va("va1", "Tanaka") })]);
  assert.equal(out.length, 1);
  assert.equal(out[0].voiceActors, undefined);
  assert.equal(out[0].voiceActor?.name, "Tanaka");
});

test("does not merge distinct characters that both lack an id", () => {
  const list = [
    char({ id: null, name: "Nami", voiceActor: va("a", "A") }),
    char({ id: null, name: "Zoro", voiceActor: va("b", "B") }),
    char({ id: null, name: "Nami", voiceActor: va("c", "C") }),
  ];
  const out = dedupeCharacters(list);
  // Nami (first) + Zoro only — the later Nami merges into the first by name.
  assert.equal(out.length, 2);
  assert.deepEqual(out.map((c) => c.name), ["Nami", "Zoro"]);
  assert.deepEqual(out[0].voiceActors?.map((v) => v.name), ["A", "C"]);
});

test("preserves first-seen order and drops exact duplicate VA repeats", () => {
  const list = [
    char({ id: "c1", name: "One", voiceActor: va("va1", "Tanaka") }),
    char({ id: "c2", name: "Two", voiceActor: va("va2", "X") }),
    char({ id: "c1", name: "One", voiceActor: va("va1", "Tanaka") }),
  ];
  const out = dedupeCharacters(list);
  assert.deepEqual(out.map((c) => c.id), ["c1", "c2"]);
  assert.deepEqual(out[0].voiceActors?.map((v) => v.id), ["va1"]);
});

test("merges rows with no voice actor without inventing one", () => {
  const list = [
    char({ id: "c1", voiceActor: null }),
    char({ id: "c1", name: "Luffy", voiceActor: null }),
  ];
  const out = dedupeCharacters(list);
  assert.equal(out.length, 1);
  assert.equal(out[0].voiceActors, undefined);
  assert.equal(out[0].voiceActor, null);
});
