import { z } from "zod";

/**
 * Schemas for RAW AnimeX provider responses (animex.one + MegaPlay).
 * AnimeX returns AniList-grade metadata with numeric ids and richer shapes
 * than the legacy hianime provider. Permissive: validate the envelope + the
 * fields we consume, let unknown keys pass.
 */

const num = z.number().nullable().optional();
const str = z.string().nullable().optional();
/** ids are numeric in AnimeX; coerce to string for our app-wide model. */
const id = z.union([z.number(), z.string()]).transform((v) => String(v));

/**
 * Image fields are inconsistent across AnimeX endpoints: a plain URL string on
 * home/search/details, but an object { color, large, extraLarge, medium } on
 * azlist. Normalize both to a single URL string (or null).
 */
const img = z
  .preprocess((v) => {
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      return (o.large ?? o.extraLarge ?? o.medium ?? o.url ?? null) as unknown;
    }
    return v ?? null;
  }, z.string().nullable())
  .optional();

const eps = z
  .object({ sub: num, dub: num })
  .partial()
  .nullable()
  .optional();

export const rawCard = z
  .object({
    id,
    title: str,
    jname: str,
    ename: str,
    romaji: str,
    poster: img,
    banner: img,
    type: str,
    score: num,
    rank: num,
    episodes: eps,
    airingTime: str,
    episodeNumber: num,
  })
  .passthrough();
export type RawCard = z.infer<typeof rawCard>;

export const homeData = z
  .object({
    spotlight: z.array(rawCard).default([]),
    trending: z.array(rawCard).default([]),
    topAiring: z.array(rawCard).default([]),
    topRated: z.array(rawCard).default([]),
    mostPopular: z.array(rawCard).default([]),
    // `seasonal` is an object { season, year, results[] }, not a bare array.
    seasonal: z
      .object({ results: z.array(rawCard).default([]) })
      .passthrough()
      .nullable()
      .optional(),
    upcoming: z.array(rawCard).default([]),
  })
  .passthrough();

const rawDetailAnime = z
  .object({
    id,
    title: str,
    jname: str,
    ename: str,
    romaji: str,
    description: str,
    poster: img,
    banner: img,
    type: str,
    status: str,
    score: num,
    year: num,
    season: str,
    duration: num,
    episodes: eps,
    genres: z.array(z.string()).nullable().optional(),
    studios: z.array(z.unknown()).nullable().optional(),
    isAdult: z.boolean().nullable().optional(),
  })
  .passthrough();

export const detailData = z
  .object({
    anime: rawDetailAnime,
    recommendations: z.array(rawCard).default([]),
    relations: z.array(z.unknown()).default([]),
  })
  .passthrough();

export const episodesData = z
  .object({
    animeId: z.union([z.number(), z.string()]).optional(),
    totalEpisodes: z.number().default(0),
    episodes: z
      .array(
        z
          .object({
            number: z.number(),
            title: str,
            titleJapanese: str,
            episodeId: z.string(),
            filler: z.boolean().optional(),
            recap: z.boolean().optional(),
          })
          .passthrough(),
      )
      .default([]),
  })
  .passthrough();

const rawServer = z
  .object({
    name: z.string(),
    nameId: z.string(),
    server: str,
    available: z
      .object({ sub: z.boolean().optional(), dub: z.boolean().optional() })
      .partial()
      .optional(),
  })
  .passthrough();

export const serversData = z
  .object({
    animeId: z.union([z.number(), z.string()]).optional(),
    episode: z.number().default(0),
    servers: z
      .object({
        sub: z.array(rawServer).default([]),
        dub: z.array(rawServer).default([]),
      })
      .partial(),
    providers: z.array(rawServer).default([]),
  })
  .passthrough();

export const sourcesData = z
  .object({
    sources: z
      .array(
        z
          .object({
            m3u8: z.string(),
            proxyM3u8: str,
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
    total: z.number().optional(),
    perPage: z.number().optional(),
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
            id,
            title: str,
            jname: str,
            ename: str,
            poster: img,
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
