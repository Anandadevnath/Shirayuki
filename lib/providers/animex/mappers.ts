import type { z } from "zod";
import type { rawCard, detailData } from "./schemas";
import type {
  AnimeCardModel,
  AnimeDetail,
  EpisodeCount,
  SpotlightModel,
} from "../types";

type Raw = z.infer<typeof rawCard>;
type Detail = z.infer<typeof detailData>;

function epCount(e: Raw["episodes"]): EpisodeCount {
  return { sub: e?.sub ?? null, dub: e?.dub ?? null };
}

export function toCard(r: Raw): AnimeCardModel {
  return {
    id: r.id,
    title: r.title ?? r.romaji ?? r.ename ?? "Untitled",
    jname: r.jname ?? r.romaji ?? null,
    poster: r.poster ?? null,
    banner: r.banner ?? null,
    type: r.type ?? null,
    episodes: epCount(r.episodes),
    score: r.score ?? null,
    rank: r.rank ?? null,
    airingTime: r.airingTime ?? null,
    episodeNumber: r.episodeNumber ?? null,
  };
}

export function toSpotlight(r: Raw): SpotlightModel {
  return {
    ...toCard(r),
    description: (r as { description?: string | null }).description ?? null,
    quality: r.type ?? null,
  };
}

/** Studios may be strings or {name} objects. */
function studioNames(studios: unknown[] | null | undefined): string[] {
  if (!studios) return [];
  return studios
    .map((s) => {
      if (typeof s === "string") return s;
      if (s && typeof s === "object" && "name" in s) {
        return String((s as { name: unknown }).name);
      }
      return null;
    })
    .filter((s): s is string => !!s);
}

export function toDetail(d: Detail): AnimeDetail {
  const a = d.anime;
  return {
    id: a.id,
    title: a.title ?? a.romaji ?? a.ename ?? "Untitled",
    jname: a.jname ?? a.romaji ?? null,
    ename: a.ename ?? null,
    description: a.description ?? null,
    poster: a.poster ?? null,
    cover: a.banner ?? a.poster ?? null,
    type: a.type ?? null,
    status: a.status ?? null,
    year: a.year ?? null,
    season: a.season ?? null,
    score: a.score ?? null,
    rating: a.isAdult ? "18+" : null,
    duration: a.duration ?? null,
    genres: a.genres ?? [],
    studios: studioNames(a.studios),
    episodes: epCount(a.episodes),
    info: {},
    recommended: (d.recommendations ?? []).map(toCard),
  };
}

export function isEmptyDetail(d: Detail): boolean {
  return !d.anime?.title && !d.anime?.poster;
}
