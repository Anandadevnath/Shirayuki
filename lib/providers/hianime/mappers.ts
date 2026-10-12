import type { z } from "zod";
import type { DetailData, rawCard } from "./schemas";
import type {
  AnimeCardModel,
  AnimeDetail,
  EpisodeCount,
  SeasonModel,
  SpotlightModel,
} from "../types";

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

function toSeason(r: Raw): SeasonModel {
  const eps = r.episodes ?? {};
  return {
    id: slugId(r) ?? r.id ?? "",
    title: r.title ?? r.jname ?? "Untitled",
    jname: r.jname ?? null,
    poster: r.poster ?? r.banner ?? null,
    type: r.type ?? null,
    year: r.duration ?? null,
    episodes: { sub: eps.sub ?? null, dub: eps.dub ?? null },
    order: null,
    isCurrent: false,
    season: null,
    part: null,
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
