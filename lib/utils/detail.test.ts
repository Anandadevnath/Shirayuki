import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isAiringStatus,
  isUnreleased,
  yearFromAired,
  formatDuration,
  airingNow,
  recentlyAired,
  scheduleItemToCard,
} from "./detail.ts";
import type { ScheduleItem, ScheduleModel } from "../providers/types.ts";

const item = (over: Partial<ScheduleItem>): ScheduleItem => ({
  id: "x",
  title: "T",
  jname: null,
  poster: null,
  type: null,
  status: null,
  aired: null,
  premiereDate: null,
  weekday: null,
  airTime: null,
  episodeNumber: null,
  isUpcoming: false,
  ...over,
});

const schedule = (over: Partial<ScheduleModel>): ScheduleModel => ({
  source: null,
  updatedAt: null,
  counted: { airing: 0, upcoming: 0, premieres: 0, tbd: 0 },
  week: [],
  airing: [],
  upcoming: [],
  ...over,
});

test("isAiringStatus: finished titles are NOT airing", () => {
  assert.equal(isAiringStatus("Currently Airing"), true);
  assert.equal(isAiringStatus("Ongoing"), true);
  assert.equal(isAiringStatus("Finished Airing"), false);
  assert.equal(isAiringStatus("Not yet aired"), false);
  assert.equal(isAiringStatus(null), false);
});

test("isUnreleased: not-yet-aired / upcoming", () => {
  assert.equal(isUnreleased("Not yet aired"), true);
  assert.equal(isUnreleased("Upcoming"), true);
  assert.equal(isUnreleased("Finished Airing"), false);
});

test("yearFromAired extracts the year, never fabricates one", () => {
  assert.equal(yearFromAired("Oct 20, 1999 to ?"), "1999");
  assert.equal(yearFromAired("Apr 8, 2026 to ?"), "2026");
  assert.equal(yearFromAired("?"), null);
  assert.equal(yearFromAired(null), null);
});

test("formatDuration: positive minutes only", () => {
  assert.equal(formatDuration(24), "24 min");
  assert.equal(formatDuration(0), null);
  assert.equal(formatDuration(null), null);
});

test("airingNow excludes the current title and dedupes", () => {
  const s = schedule({
    week: [{ day: "Monday", items: [item({ id: "self" }), item({ id: "a", airTime: "10:00" })] }],
    airing: [item({ id: "a" }), item({ id: "b" })],
  });
  const out = airingNow(s, "self", 10);
  assert.deepEqual(out.map((i) => i.id), ["a", "b"]);
});

test("airingNow orders weekly-slot rows before weekday-only rows", () => {
  const s = schedule({
    week: [{ day: "Friday", items: [item({ id: "fri", weekday: "Friday", airTime: "20:00" })] }],
    airing: [item({ id: "bare", weekday: "Wednesday" })],
  });
  const out = airingNow(s, "self", 10);
  assert.deepEqual(out.map((i) => i.id), ["fri", "bare"]);
});

test("airingNow respects the limit and empty schedules", () => {
  const s = schedule({
    airing: [item({ id: "a" }), item({ id: "b" }), item({ id: "c" })],
  });
  assert.equal(airingNow(s, "z", 2).length, 2);
  assert.deepEqual(airingNow(schedule({}), "z"), []);
});

test("recentlyAired derives from the same pool", () => {
  const s = schedule({ airing: [item({ id: "a" }), item({ id: "b" })] });
  assert.deepEqual(recentlyAired(s, "self", 10).map((i) => i.id), ["a", "b"]);
});

test("scheduleItemToCard maps to the shared card shape", () => {
  const card = scheduleItemToCard(
    item({ id: "a", title: "X", poster: "p", type: "TV", airTime: "10:00" }),
  );
  assert.equal(card.id, "a");
  assert.equal(card.title, "X");
  assert.equal(card.poster, "p");
  assert.equal(card.type, "TV");
  assert.equal(card.airingTime, "10:00");
});
