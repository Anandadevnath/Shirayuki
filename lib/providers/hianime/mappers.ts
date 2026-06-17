import type { z } from "zod";
import type { rawCard } from "./schemas";
import type {
  AnimeCardModel,
  AnimeDetail,
  EpisodeCount,
  SpotlightModel,
} from "../types";

type Raw = z.infer<typeof rawCard>;

function epCount(e: Raw["episodes"]): EpisodeCount {
  return { sub: e?.sub ?? null, dub: e?.dub ?? null };
}

export function toCard(r: Raw): AnimeCardModel {
  return {
    id: r.id,
    title: r.title ?? r.name ?? r.ename ?? "Untitled",
    jname: r.jname ?? null,
    poster: r.poster ?? null,
    type: r.type ?? null,
    episodes: epCount(r.episodes),
    rank: r.rank ?? null,
    airingTime: r.airingTime ?? null,
    episodeNumber: r.episodeNumber ?? r.episode ?? null,
  };
}

export function toSpotlight(r: Raw): SpotlightModel {
  return {
    ...toCard(r),
    description: r.description ?? null,
    quality: r.quality ?? null,
  };
}

type Info = Record<string, unknown> | null | undefined;

function infoStr(info: Info, key: string): string | null {
  const v = info?.[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** info.genres/studios/producers are `[{name,…}]`, a CSV string, or null. */
function infoNames(info: Info, key: string): string[] {
  const v = info?.[key];
  if (Array.isArray(v)) {
    return v
      .map((x) =>
        typeof x === "string"
          ? x
          : x && typeof x === "object" && "name" in x
            ? String((x as { name: unknown }).name)
            : null,
      )
      .filter((s): s is string => !!s && s.trim().length > 0);
  }
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

export function toDetail(d: {
  id: string;
  title?: string | null;
  jname?: string | null;
  ename?: string | null;
  description?: string | null;
  poster?: string | null;
  cover?: string | null;
  stats?: {
    pg?: string | null;
    type?: string | null;
    year?: number | null;
    sub?: number | null;
    dub?: number | null;
  } | null;
  info?: Record<string, unknown> | null;
  recommended: Raw[];
}): AnimeDetail {
  const info = d.info ?? {};
  const durationRaw = infoStr(info, "duration"); // e.g. "24"
  const duration = durationRaw ? Number.parseInt(durationRaw, 10) || null : null;
  const premiered = infoStr(info, "premiered"); // e.g. "Winter 1999"
  const season = premiered ? premiered.split(/\s+/)[0] : null;

  return {
    id: d.id,
    title: d.title ?? d.ename ?? "Untitled",
    jname: d.jname ?? null,
    ename: d.ename ?? null,
    description: d.description ?? null,
    poster: d.poster ?? null,
    cover: d.cover ?? d.poster ?? null,
    type: d.stats?.type ?? null,
    status: infoStr(info, "status"),
    year: d.stats?.year ?? null,
    season,
    score: null,
    rating: d.stats?.pg ?? null,
    duration,
    genres: infoNames(info, "genres"),
    studios: infoNames(info, "studios"),
    episodes: { sub: d.stats?.sub ?? null, dub: d.stats?.dub ?? null },
    info: d.info ?? {},
    recommended: (d.recommended ?? []).map(toCard),
  };
}

/** A detail payload is "empty" (invalid id) when core fields are all null. */
export function isEmptyDetail(d: { title?: string | null; poster?: string | null }): boolean {
  return !d.title && !d.poster;
}
