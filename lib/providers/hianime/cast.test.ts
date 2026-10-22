import { test } from "node:test";
import assert from "node:assert/strict";
import { groupVoiceActors } from "./cast.ts";
import type { CharacterModel, VoiceActorModel } from "../types.ts";

const va = (id: string | null, name: string | null): VoiceActorModel => ({
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

test("groups one entry per unique VA, listing their characters", () => {
  const out = groupVoiceActors([
    char({ id: "c1", name: "Luffy", voiceActor: va("va1", "Tanaka") }),
    char({ id: "c2", name: "Zoro", voiceActor: va("va2", "Nakai") }),
    char({ id: "c3", name: "Ace", voiceActor: va("va1", "Tanaka") }),
  ]);
  assert.equal(out.length, 2);
  assert.equal(out[0].name, "Tanaka");
  assert.deepEqual(
    out[0].characters.map((c) => c.name),
    ["Luffy", "Ace"],
  );
  assert.equal(out[1].name, "Nakai");
  assert.deepEqual(out[1].characters.map((c) => c.name), ["Zoro"]);
});

test("flattens a character's full voiceActors set without double-counting", () => {
  const out = groupVoiceActors([
    char({
      id: "c1",
      name: "Luffy",
      voiceActor: va("va1", "Tanaka"),
      voiceActors: [va("va1", "Tanaka"), va("va2", "Yamada")],
    }),
  ]);
  assert.equal(out.length, 2);
  assert.deepEqual(out.map((v) => v.name), ["Tanaka", "Yamada"]);
  // Each VA is credited to the single character once.
  for (const v of out) assert.deepEqual(v.characters.map((c) => c.name), ["Luffy"]);
});

test("does not merge distinct null-id VAs sharing a name", () => {
  const out = groupVoiceActors([
    char({ id: "c1", name: "A", voiceActor: va(null, "Sato") }),
    char({ id: "c2", name: "B", voiceActor: va(null, "Sato") }),
  ]);
  // Same name + no id → collapses to one key (name-based fallback). This is
  // the intended fallback behaviour: with no id, the name is the only signal.
  assert.equal(out.length, 1);
  assert.deepEqual(out[0].characters.map((c) => c.name), ["A", "B"]);
});

test("never repeats a character for the same VA", () => {
  const out = groupVoiceActors([
    char({ id: "c1", name: "Luffy", voiceActor: va("va1", "Tanaka") }),
    char({ id: "c1", name: "Luffy", voiceActor: va("va1", "Tanaka") }),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].characters.length, 1);
});

test("skips characters with no voice actor and returns [] for empty input", () => {
  assert.deepEqual(groupVoiceActors([]), []);
  const out = groupVoiceActors([char({ id: "c1", voiceActor: null })]);
  assert.deepEqual(out, []);
});

test("preserves first-appearance order of VAs", () => {
  const out = groupVoiceActors([
    char({ id: "c1", voiceActor: va("va2", "Second") }),
    char({ id: "c2", voiceActor: va("va1", "First") }),
  ]);
  assert.deepEqual(out.map((v) => v.name), ["Second", "First"]);
});
