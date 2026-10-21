import type { z } from "zod";
import type {
  ArtData,
  CharacterItemData,
  DetailData,
  ScheduleData,
  rawCard,
  SeasonData,
  StaffCreditData,
} from "./schemas";
import type {
  AnimeCardModel,
  AnimeDetail,
  EpisodeCount,
  ScheduleItem,
  ScheduleModel,
  SeasonModel,
  SpotlightModel,
  AnimeArtBundle,
  CharacterModel,
  StaffCredit,
} from "../types";
import { dedupeCharacters } from "./characters";
import { groupVoiceActors } from "./cast";

type Raw = z.infer<typeof rawCard>;

/**
 * v2 → normalized model mappers. Cards carry only a numeric `id` plus a `url`
 * like https://hianime.at/one-piece-1 — the slug-id ("one-piece-1") is the path
 * the detail page actually serves, so our app ids USE the slug-id (not the bare
 * number). `/anime/<slug>-<id>` is exactly what the API's `/anime/:animeId`
 * resolves, which is why every card link keeps working end-to-end.
 */

function slugId(r: Raw): string | null {
  const u = r.url;
  if (u) {
    const last = String(u).split(/[?#]/)[0].replace(/\/+$/, "").split("/").pop();
    if (last) return last;
  }
  return r.id ?? null;
}

function epCount(r: Raw): EpisodeCount {
  const e = r.episodes ?? {};
  return { sub: e.sub ?? null, dub: e.dub ?? null };
}

export function toCard(r: Raw): AnimeCardModel {
  return {
    id: slugId(r) ?? "",
    title: r.title ?? r.jname ?? "Untitled",
    jname: r.jname ?? null,
    poster: r.poster ?? r.banner ?? null,
    type: r.type ?? null,
    episodes: epCount(r),
    rank: r.rank ?? null,
    score: null,
    episodeNumber: null,
    airingTime: null,
  };
}

export function toSpotlight(r: Raw): SpotlightModel {
  return {
    ...toCard(r),
    description: r.description ?? null,
    quality: r.quality ?? null,
  };
}

function cleanStr(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function toSeasonItem(r: SeasonData): SeasonModel {
  const eps = r.episodes ?? {};
  return {
    id: r.id ?? "",
    title: r.title ?? r.jname ?? "Untitled",
    jname: r.jname ?? null,
    poster: r.poster ?? null,
    type: r.type ?? null,
    year: r.year ?? null,
    episodes: { sub: eps.sub ?? null, dub: eps.dub ?? null },
    order: r.order ?? null,
    isCurrent: r.isCurrent ?? false,
    isMovie: r.isMovie ?? false,
    season: r.season ?? null,
    part: r.part ?? null,
  };
}

export function toDetail(d: DetailData): AnimeDetail {
  const premiered = cleanStr(d.premiered); // e.g. "Winter 1999"
  const season = premiered ? premiered.split(/\s+/)[0] : null;
  const yearRaw = premiered ? (premiered.match(/(\d{4})/) || [])[1] : null;
  const year = yearRaw ? Number(yearRaw) : null;
  const durationRaw = cleanStr(d.duration); // e.g. "24m"
  const duration = durationRaw ? Number.parseInt(durationRaw, 10) || null : null;

  return {
    id: d.id ?? "",
    title: d.title ?? d.jname ?? "Untitled",
    jname: d.jname ?? null,
    ename: d.alias ?? d.jname ?? null,
    description: d.description ?? null,
    poster: d.poster ?? null,
    cover: d.poster ?? null,
    type: d.type ?? null,
    status: cleanStr(d.status),
    year,
    season,
    score: null,
    rating: typeof d.rating === "number" && d.rating > 0 ? String(d.rating) : null,
    duration,
    aired: cleanStr(d.aired),
    malScore: typeof d.malScore === "number" && d.malScore > 0 ? String(d.malScore) : null,
    genres: Array.isArray(d.genres) ? d.genres.filter((s): s is string => !!s) : [],
    studios: Array.isArray(d.studios) ? d.studios.filter((s): s is string => !!s) : [],
    producers: Array.isArray(d.producers) ? d.producers.filter((s): s is string => !!s) : [],
    episodes: {
      sub: d.episodes?.sub ?? null,
      dub: d.episodes?.dub ?? null,
    },
    info: {},
    recommended: (d.relations ?? []).map(toCard),
    trending: [],
    seasons: [],
  };
}

/** A detail payload is "empty" (invalid id) when core fields are all null. */
export function isEmptyDetail(d: { title?: string | null; poster?: string | null }): boolean {
  return !d.title && !d.poster;
}

type RawScheduleItem = ScheduleData["week"][number]["items"][number];

function toScheduleItem(r: RawScheduleItem): ScheduleItem {
  return {
    id: r.id ?? "",
    title: r.title ?? r.jname ?? "Untitled",
    jname: r.jname ?? null,
    poster: r.poster ?? null,
    type: r.type ?? null,
    status: cleanStr(r.status),
    aired: cleanStr(r.aired),
    premiereDate: r.premiereDate ?? null,
    weekday: r.weekday ?? null,
    airTime: cleanStr(r.airTime),
    episodeNumber: cleanStr(r.episodeNumber),
    isUpcoming: r.isUpcoming ?? false,
  };
}

export function toSchedule(d: ScheduleData): ScheduleModel {
  return {
    source: cleanStr(d.source),
    updatedAt: cleanStr(d.updatedAt),
    counted: {
      airing: d.counted?.airing ?? 0,
      upcoming: d.counted?.upcoming ?? 0,
      premieres: d.counted?.premieres ?? 0,
      tbd: d.counted?.tbd ?? 0,
    },
    week: (d.week ?? []).map((w) => ({ day: w.day ?? "", items: (w.items ?? []).map(toScheduleItem) })),
    airing: (d.airing ?? []).map(toScheduleItem),
    upcoming: (d.upcoming ?? []).map(toScheduleItem),
  };
}

/* ── /art bundle mappers ──────────────────────────────────────────────────── */

function toCharacter(r: CharacterItemData): CharacterModel {
  const va = r.voiceActor;
  return {
    id: r.id ?? null,
    slug: r.slug ?? null,
    name: r.name ?? "Unknown",
    poster: r.poster ?? null,
    role: cleanStr(r.role),
    url: r.url ?? null,
    voiceActor: va
      ? {
          id: va.id ?? null,
          slug: va.slug ?? null,
          name: va.name ?? "Unknown",
          poster: va.poster ?? null,
          language: cleanStr(va.language),
          url: va.url ?? null,
        }
      : null,
  };
}

function toStaffCredit(r: StaffCreditData, fallbackKind: "studio" | "producer"): StaffCredit | null {
  const name = cleanStr(r.name);
  if (!name) return null;
  const kind = r.kind === "studio" || r.kind === "producer" ? r.kind : fallbackKind;
  return { name, slug: r.slug ?? null, kind, url: r.url ?? null };
}

export function toArtBundle(d: ArtData): AnimeArtBundle {
  // Collapse the repeated character rows (one per billed VA) into one card per
  // character, collecting each character's full VA set. See dedupeCharacters.
  const characters = dedupeCharacters((d.characters ?? []).map(toCharacter));

  // `artists[]` mixes studios + producers; dedupe exact name+kind pairs so a
  // studio that is also credited as a producer keeps ONE row per role, while
  // two distinct entities sharing a name across kinds (rare) both survive.
  const seen = new Set<string>();
  const staff: StaffCredit[] = [];
  for (const raw of d.artists ?? []) {
    const credit = toStaffCredit(raw, "studio");
    if (!credit) continue;
    const key = `${credit.kind}:${credit.slug ?? credit.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    staff.push(credit);
  }

  const company = d.company ? toStaffCredit(d.company, "producer") : null;

  return {
    source: cleanStr(d.source),
    anime: {
      id: d.anime?.id ?? null,
      slug: d.anime?.slug ?? null,
      title: d.anime?.title ?? null,
      jname: d.anime?.jname ?? null,
      poster: d.anime?.poster ?? null,
      description: cleanStr(d.anime?.description),
    },
    art: (d.art ?? []).map((a) => ({
      id: a.id ?? "",
      slug: a.slug ?? null,
      poster: a.poster ?? null,
      title: a.title ?? null,
    })),
    characters,
    charactersTotal: d.charactersTotal ?? (d.characters?.length ?? 0),
    // Person-first cast view — one entry per unique VA across the deduped
    // character rows (a VA can voice several characters).
    voiceActors: groupVoiceActors(characters),
    staff,
    company,
  };
}
