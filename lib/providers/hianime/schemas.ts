import { z } from "zod";

/**
 * Schemas for RAW provider responses. Kept permissive on purpose — the API is
 * heavily nullable and shape-drifting. We validate the envelope + the fields we
 * actually consume, and let unknown keys pass through.
 */

const num = z.number().nullable().optional();
const str = z.string().nullable().optional();

export const rawCard = z
  .object({
    id: z.string(),
    title: str,
    name: str,
    jname: str,
    ename: str,
    poster: str,
    type: str,
    rank: num,
    quality: str,
    description: str,
    airingTime: str,
    episodeNumber: num,
    episode: num,
    episodes: z
      .object({ sub: num, dub: num })
      .partial()
      .nullable()
      .optional(),
  })
  .passthrough();
export type RawCard = z.infer<typeof rawCard>;

export const homeData = z
  .object({
    spotlight: z.array(rawCard).default([]),
    trending: z.array(rawCard).default([]),
    topAiring: z.array(rawCard).default([]),
    latestEpisodes: z.array(rawCard).default([]),
    mostPopular: z.array(rawCard).default([]),
    // HiAnime returns top10 ranked by period, not a flat array.
    top10: z
      .object({
        day: z.array(rawCard).default([]),
        week: z.array(rawCard).default([]),
        month: z.array(rawCard).default([]),
      })
      .partial()
      .nullable()
      .optional(),
    quickLists: z
      .object({
        newReleases: z.array(rawCard).default([]),
        upcoming: z.array(rawCard).default([]),
        completed: z.array(rawCard).default([]),
      })
      .partial()
      .nullable()
      .optional(),
    genres: z
      .array(
        z.object({ name: z.string(), slug: z.string() }).passthrough(),
      )
      .default([]),
  })
  .passthrough();

/** Season entry — sibling titles in the same franchise (e.g. "Season 2",
 *  "Season 3 part 2"). Field shape is fixed by HiAnime, but permissive here
 *  so an upstream tweak doesn't break parsing. */
export const rawSeason = z
  .object({
    order: z.number().optional(),
    id: z.string(),
    title: str,
    jname: str,
    ename: str,
    href: str,
    url: str,
    poster: str,
    type: str,
    duration: str,
    episode: num,
    episodes: z
      .object({ sub: num, dub: num })
      .partial()
      .nullable()
      .optional(),
    isCurrent: z.boolean().optional(),
    season: z.number().optional(),
    part: z.number().optional(),
  })
  .passthrough();
export type RawSeason = z.infer<typeof rawSeason>;

export const detailData = z
  .object({
    id: z.string(),
    title: str,
    jname: str,
    ename: str,
    description: str,
    poster: str,
    cover: str,
    stats: z
      .object({ pg: str, type: str, year: num, sub: num, dub: num })
      .partial()
      .nullable()
      .optional(),
    info: z.record(z.unknown()).nullable().optional(),
    recommended: z.array(rawCard).default([]),
    // Provider returns the same trending rail embedded on detail pages; keep
    // it default-empty so older responses don't 500.
    trending: z.array(rawCard).default([]),
    // Sibling seasons (prequels / sequels / "part 2" splits).
    seasons: z.array(rawSeason).default([]),
  })
  .passthrough();

export const episodesData = z
  .object({
    animeId: z.string().optional(),
    totalEpisodes: z.number().default(0),
    ranges: z.array(z.string()).default([]),
    episodes: z
      .array(
        z
          .object({
            number: z.number(),
            title: str,
            episodeId: z.string(),
            isFiller: z.boolean().optional(),
          })
          .passthrough(),
      )
      .default([]),
  })
  .passthrough();

const rawServer = z
  .object({ name: z.string(), nameId: z.string() })
  .passthrough();

export const serversData = z
  .object({
    animeId: z.string().optional(),
    episode: z.number().default(0),
    servers: z
      .object({
        sub: z.array(rawServer).default([]),
        dub: z.array(rawServer).default([]),
        hsub: z.array(rawServer).default([]),
      })
      .partial(),
  })
  .passthrough();

export const sourcesData = z
  .object({
    sources: z
      .array(
        z
          .object({
            m3u8: z.string(),
            referer: str,
            server: str,
            category: str,
            quality: str,
          })
          .passthrough(),
      )
      .default([]),
    tracks: z
      .array(
        z
          .object({
            file: z.string(),
            label: str,
            kind: str,
            default: z.boolean().optional(),
          })
          .passthrough(),
      )
      .default([]),
    intro: z.object({ start: z.number(), end: z.number() }).nullable().optional(),
    outro: z.object({ start: z.number(), end: z.number() }).nullable().optional(),
  })
  .passthrough();

export const paginationData = z
  .object({
    currentPage: z.number().default(1),
    totalPages: z.number().default(1),
    hasNextPage: z.boolean().default(false),
  })
  .partial();

export const listData = z
  .object({
    pagination: paginationData.optional(),
    results: z.array(rawCard).default([]),
  })
  .passthrough();

export const suggestionData = z
  .object({
    suggestions: z.array(rawCard).default([]),
  })
  .passthrough();

export const scheduleData = z
  .object({
    date: str,
    results: z
      .array(
        z
          .object({
            id: z.string(),
            title: str,
            jname: str,
            ename: str,
            episodeNumber: num,
            airingTime: str,
            time: str,
          })
          .passthrough(),
      )
      .default([]),
  })
  .passthrough();

/** Standard envelope: { success, data } */
export const envelope = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ success: z.boolean().optional(), data });
