import { z } from "zod";

/**
 * Schemas for RAW v2 provider responses. Kept permissive on purpose — the API is
 * heavily nullable and shape-drifting. We validate the envelope + the fields we
 * actually consume, and let unknown keys pass through.
 */

const num = z.number().nullable().optional();
const str = z.string().nullable().optional();

/** A card from any browse surface (.flw-item / ranked item / spotlight slide). */
export const rawCard = z
  .object({
    id: str,
    title: str,
    jname: str,
    poster: str,
    banner: str,
    type: str,
    duration: str,
    rank: num,
    quality: str,
    description: str,
    releaseDate: str,
    episodeNumber: num,
    episodes: z
      .object({ total: num, sub: num, dub: num })
      .partial()
      .nullable()
      .optional(),
    url: str,
  })
  .passthrough();
export type RawCard = z.infer<typeof rawCard>;

/** Home payload: keyed buckets instead of the old flat rails. */
export const homeData = z
  .object({
    spotlight: z.array(rawCard).default([]),
    trending: z.array(rawCard).default([]),
    // Record e.g. { "Top Airing": [...], "Most Popular": [...], "Most Favorite": [...], "Latest Completed": [...] }
    featured: z.record(z.array(rawCard)).default({}),
    // Record e.g. { day: [...], week: [...], month: [...] } — ranked top-viewed lists.
    topViewed: z.record(z.array(rawCard)).default({}),
    // Record e.g. { "Latest Episode": [...], "New On HiAnime": [...], "Top Upcoming": [...] }
    sections: z.record(z.array(rawCard)).default({}),
  })
  .passthrough();
export type HomeData = z.infer<typeof homeData>;

export const detailData = z
  .object({
    id: str,
    slug: str,
    title: str,
    jname: str,
    alias: str,
    poster: str,
    description: str,
    type: str,
    rating: num,
    quality: str,
    episodes: z
      .object({ total: num, sub: num, dub: num })
      .partial()
      .nullable()
      .optional(),
    genres: z.array(z.string()).default([]),
    studios: z.array(z.string()).default([]),
    producers: z.array(z.string()).default([]),
    premiered: str,
    aired: str,
    status: str,
    duration: str,
    malScore: num,
    // Sibling titles in the same franchise (prequel / sequel / movie).
    relations: z.array(rawCard).default([]),
  })
  .passthrough();
export type DetailData = z.infer<typeof detailData>;

export const episodesData = z
  .object({
    id: str,
    slug: str,
    title: str,
    totalEpisodes: z.number().default(0),
    episodes: z
      .array(
        z
          .object({
            episode: z.number(),
            episodeId: str,
            title: str,
            url: str,
          })
          .passthrough(),
      )
      .default([]),
  })
  .passthrough();
export type EpisodesData = z.infer<typeof episodesData>;

const rawServer = z
  .object({ name: str, serverId: str, category: str, embed: str, hash: str })
  .passthrough();

export const serversData = z
  .object({
    episodeId: str,
    episode: num,
    servers: z
      .object({ sub: z.array(rawServer).default([]), dub: z.array(rawServer).default([]) })
      .partial(),
  })
  .passthrough();
export type ServersData = z.infer<typeof serversData>;

const rawTrack = z
  .object({
    file: str,
    label: str,
    kind: str,
    default: z.boolean().optional(),
  })
  .passthrough();

const rawSource = z
  .object({
    url: str,
    type: str,
    quality: str,
    proxyM3u8: str,
    embeddedUrl: str,
  })
  .passthrough();

export const sourcesData = z
  .object({
    episodeId: str,
    category: str,
    server: str,
    embed: str,
    streamResolved: z.boolean().optional(),
    reason: str,
    note: str,
    link: str,
    tracks: z.array(rawTrack).default([]),
    intro: z.object({ start: z.number(), end: z.number() }).nullable().optional(),
    outro: z.object({ start: z.number(), end: z.number() }).nullable().optional(),
    sources: z.array(rawSource).default([]),
  })
  .passthrough();
export type SourcesData = z.infer<typeof sourcesData>;

export const paginationData = z
  .object({
    currentPage: z.number().default(1),
    totalPages: z.number().default(1),
    hasNextPage: z.boolean().default(false),
  })
  .partial();

export const listData = z
  .object({
    heading: str,
    pagination: paginationData.optional(),
    results: z.array(rawCard).default([]),
  })
  .passthrough();
export type ListData = z.infer<typeof listData>;

export const suggestionData = z
  .object({
    query: str,
    suggestions: z.array(rawCard).default([]),
  })
  .passthrough();

/** Schedule payload — premiere-derived calendar + airing/upcoming lists.
 *  Self-contained (not reusing rawCard) because schedule items add
 *  detail-page fields (status / aired / premiereDate / weekday / isUpcoming)
 *  that have different nullability than card surfaces. */
const scheduleItem = z
  .object({
    id: str,
    title: str,
    jname: str,
    poster: str,
    type: str,
    status: str,
    aired: str,
    premiereDate: str,
    weekday: str,
    isUpcoming: z.boolean().optional(),
  })
  .passthrough();

export const scheduleData = z
  .object({
    source: str,
    updatedAt: str,
    counted: z
      .object({ airing: z.number(), upcoming: z.number(), premieres: z.number(), tbd: z.number() })
      .partial(),
    week: z
      .array(z.object({ day: str, items: z.array(scheduleItem).default([]) }).passthrough())
      .default([]),
    airing: z.array(scheduleItem).default([]),
    upcoming: z.array(scheduleItem).default([]),
  })
  .passthrough();
export type ScheduleData = z.infer<typeof scheduleData>;

/** Standard envelope: { success, data } */
export const envelope = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ success: z.boolean().optional(), data });
