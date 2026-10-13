import { apiFetch, V2 } from "./client";
import * as S from "./schemas";
import * as M from "./mappers";
import type {
  AnimeDetail,
  EpisodesModel,
  HomeModel,
  Paginated,
  AnimeCardModel,
  ScheduleModel,
  ServerCategory,
  ServersModel,
  SourcesModel,
} from "../types";

const HOME_REVALIDATE = 900;
const LIST_REVALIDATE = 900;
const DETAIL_REVALIDATE = 3600;
// Schedule is heavy (scrape deadline ~22s on a cold API cache); the API
// refreshes it internally, so the frontend reuses the cached snapshot and
// only re-fetches when the API's own TTL rolls over.
const SCHEDULE_REVALIDATE = 1800;

// The v2 API does not expose a genre list; the taxonomy is static (mirrors the
// hianime.at sidebar genre chips). Used by the footer + HomeModel.genres.
const GENRES: { name: string; slug: string }[] = [
  ["Action", "action"],
  ["Action & Adventure", "action-adventure"],
  ["Adventure", "adventure"],
  ["Animation", "animation"],
  ["Anthropomorphic", "anthropomorphic"],
  ["Avant Garde", "avant-garde"],
  ["Award Winning", "award-winning"],
  ["Boys Love", "boys-love"],
  ["Cars", "cars"],
  ["CGDCT", "cgdct"],
  ["Childcare", "childcare"],
  ["Combat Sports", "combat-sports"],
  ["Comedy", "comedy"],
  ["Crossdressing", "crossdressing"],
  ["Delinquents", "delinquents"],
  ["Dementia", "dementia"],
  ["Demons", "demons"],
  ["Detective", "detective"],
  ["Drama", "drama"],
  ["Ecchi", "ecchi"],
  ["Educational", "educational"],
  ["Erotica", "erotica"],
  ["Fantasy", "fantasy"],
  ["Gag Humor", "gag-humor"],
  ["Game", "game"],
  ["Girls Love", "girls-love"],
  ["Gore", "gore"],
  ["Gourmet", "gourmet"],
  ["Harem", "harem"],
  ["Hentai", "hentai"],
  ["High Stakes Game", "high-stakes-game"],
  ["Historical", "historical"],
  ["Horror", "horror"],
  ["Idols (Female)", "idols-female"],
  ["Idols (Male)", "idols-male"],
  ["Isekai", "isekai"],
  ["Iyashikei", "iyashikei"],
  ["Josei", "josei"],
  ["Kids", "kids"],
  ["Love Polygon", "love-polygon"],
  ["Love Status Quo", "love-status-quo"],
  ["Magic", "magic"],
  ["Magical Sex Shift", "magical-sex-shift"],
  ["Mahou Shoujo", "mahou-shoujo"],
  ["Martial Arts", "martial-arts"],
  ["Mecha", "mecha"],
  ["Medical", "medical"],
  ["Military", "military"],
  ["Music", "music"],
  ["Mystery", "mystery"],
  ["Mythology", "mythology"],
  ["Organized Crime", "organized-crime"],
  ["Otaku Culture", "otaku-culture"],
  ["Parody", "parody"],
  ["Performing Arts", "performing-arts"],
  ["Pets", "pets"],
  ["Police", "police"],
  ["Psychological", "psychological"],
  ["Racing", "racing"],
  ["Reincarnation", "reincarnation"],
  ["Reverse Harem", "reverse-harem"],
  ["Romance", "romance"],
  ["Samurai", "samurai"],
  ["School", "school"],
  ["Sci-Fi", "sci-fi"],
  ["Sci-Fi & Fantasy", "sci-fi-fantasy"],
  ["Seinen", "seinen"],
  ["Shoujo", "shoujo"],
  ["Shoujo Ai", "shoujo-ai"],
  ["Shounen", "shounen"],
  ["Shounen Ai", "shounen-ai"],
  ["Showbiz", "showbiz"],
  ["Slice of Life", "slice-of-life"],
  ["Space", "space"],
  ["Sports", "sports"],
  ["Strategy Game", "strategy-game"],
  ["Supernatural", "supernatural"],
  ["Super Power", "super-power"],
  ["Survival", "survival"],
  ["Suspense", "suspense"],
  ["Team Sports", "team-sports"],
  ["Thriller", "thriller"],
  ["Time Travel", "time-travel"],
  ["Urban Fantasy", "urban-fantasy"],
  ["Vampire", "vampire"],
  ["Video Game", "video-game"],
  ["Villainess", "villainess"],
  ["Visual Arts", "visual-arts"],
  ["Workplace", "workplace"],
].map(([name, slug]) => ({ name, slug }));

export async function getHome(): Promise<HomeModel> {
  const { data } = await apiFetch(
    // Home is served at the router ROOT (not /home).
    V2,
    S.envelope(S.homeData),
    { revalidate: HOME_REVALIDATE, tags: ["home"] },
  );
  const featured = data.featured ?? {};
  const sections = data.sections ?? {};
  const topViewed = data.topViewed ?? {};
  const feature = (name: string) => featured[name] ?? [];
  const section = (name: string) => sections[name] ?? [];

  return {
    spotlight: data.spotlight.map(M.toSpotlight),
    trending: data.trending.map(M.toCard),
    topAiring: feature("Top Airing").map(M.toCard),
    mostPopular: feature("Most Popular").map(M.toCard),
    mostFavorite: feature("Most Favorite").map(M.toCard),
    latestEpisodes: section("Latest Episode").map(M.toCard),
    newReleases: section("New On HiAnime").map(M.toCard),
    completed: feature("Latest Completed").map(M.toCard),
    upcoming: section("Top Upcoming").map(M.toCard),
    top10: {
      day: (topViewed.day ?? []).map(M.toCard),
      week: (topViewed.week ?? []).map(M.toCard),
      month: (topViewed.month ?? []).map(M.toCard),
    },
    genres: GENRES,
  };
}

/**
 * Lightweight genres-only fetch for chrome (footer). The v2 API has no genre
 * endpoint, so this returns the static taxonomy — kept async for call-site
 * stability (Suspense + safe()).
 */
export async function getGenres(): Promise<{ name: string; slug: string }[]> {
  return GENRES;
}

export async function getAnime(id: string): Promise<AnimeDetail | null> {
  const { data } = await apiFetch(
    `${V2}/anime/${encodeURIComponent(id)}`,
    S.envelope(S.detailData),
    { revalidate: DETAIL_REVALIDATE, tags: [`anime:${id}`] },
  );
  if (M.isEmptyDetail(data)) return null;
  return M.toDetail(data);
}

export async function getEpisodes(id: string): Promise<EpisodesModel> {
  const { data } = await apiFetch(
    `${V2}/anime/${encodeURIComponent(id)}/episodes`,
    S.envelope(S.episodesData),
    { revalidate: DETAIL_REVALIDATE, tags: [`anime:${id}`] },
  );
  return {
    animeId: data.id ?? id,
    totalEpisodes: data.totalEpisodes,
    ranges: [],
    episodes: data.episodes.map((e) => ({
      number: e.episode,
      title: e.title ?? null,
      episodeId: e.episodeId ?? `__ep-${e.episode}`,
      isFiller: false,
    })),
  };
}

async function getList(path: string, tag: string): Promise<Paginated<AnimeCardModel>> {
  const { data } = await apiFetch(path, S.envelope(S.listData), {
    revalidate: LIST_REVALIDATE,
    tags: [tag],
  });
  return {
    results: data.results.map(M.toCard),
    currentPage: data.pagination?.currentPage ?? 1,
    totalPages: data.pagination?.totalPages ?? 1,
    hasNextPage: data.pagination?.hasNextPage ?? false,
  };
}

export function search(q: string, page = 1) {
  return getList(`${V2}/search?q=${encodeURIComponent(q)}&page=${page}`, `search:${q}`);
}

export function getGenre(id: string, page = 1) {
  return getList(`${V2}/genre/${encodeURIComponent(id)}?page=${page}`, `genre:${id}`);
}

export function getCategory(id: string, page = 1) {
  return getList(`${V2}/browse/${encodeURIComponent(id)}?page=${page}`, `category:${id}`);
}

/** A–Z browse. The v2 API has one `/browse/az-list` surface (letters are not
 *  first-class routes), so the letter arg is accepted for call-site stability
 *  but the full alphabetical directory is returned regardless. */
export function getAZ(letter: string, page = 1) {
  return getList(`${V2}/browse/az-list?page=${page}`, `az:${letter}`);
}

export async function getSchedule(): Promise<ScheduleModel> {
  const { data } = await apiFetch(`${V2}/schedule`, S.envelope(S.scheduleData), {
    revalidate: SCHEDULE_REVALIDATE,
    tags: ["schedule"],
  });
  return M.toSchedule(data);
}

export async function suggest(q: string): Promise<AnimeCardModel[]> {
  const { data } = await apiFetch(
    `${V2}/search/suggestion?q=${encodeURIComponent(q)}`,
    S.envelope(S.suggestionData),
    { revalidate: 300, tags: [`suggest:${q}`] },
  );
  return data.suggestions.map(M.toCard);
}

/** Servers + sources are NEVER cached long — links expire. */
export async function getServers(
  episodeId: string,
  ep: number,
): Promise<ServersModel> {
  const path = `${V2}/episode/servers?episodeId=${encodeURIComponent(episodeId)}`;
  const { data } = await apiFetch(path, S.envelope(S.serversData), { noStore: true });

  const map = (arr: { name?: string | null; serverId?: string | null }[], category: ServerCategory) => {
    const seen = new Set<string>();
    return arr
      .filter((s) => (seen.has(s.serverId ?? s.name ?? "") ? false : (seen.add(s.serverId ?? s.name ?? ""), true)))
      .map((s) => ({ name: s.name ?? "Server", nameId: s.serverId ?? s.name ?? "", category }));
  };
  return {
    animeId: episodeId,
    episode: data.episode ?? ep ?? 1,
    sub: map(data.servers?.sub ?? [], "sub"),
    dub: map(data.servers?.dub ?? [], "dub"),
    hsub: [],
  };
}

/** Derive the upstream Referer needed by the CDN from the provider payload.
 *  The API's `sources[].embeddedUrl` carries the exact `ref` its own proxy
 *  uses (e.g. https://megaplay.buzz/); fall back to the embed origin. */
function deriveReferer(data: S.SourcesData): string | null {
  const embedded = data.sources?.[0]?.embeddedUrl;
  if (embedded) {
    try {
      const ref = new URLSearchParams(String(embedded).split("?")[1] ?? "").get("ref");
      if (ref) return ref;
    } catch {
      /* continue */
    }
  }
  const embed = data.embed;
  if (embed) {
    try {
      return new URL(embed).origin + "/";
    } catch {
      /* continue */
    }
  }
  return null;
}

export async function getSources(
  episodeId: string,
  ep: number,
  server: string,
  category: string,
): Promise<SourcesModel | null> {
  const path = `${V2}/episode/sources?episodeId=${encodeURIComponent(
    episodeId,
  )}&server=${encodeURIComponent(server)}&category=${encodeURIComponent(category)}`;
  const { data } = await apiFetch(path, S.envelope(S.sourcesData), { noStore: true });
  if (!data.link) return null;
  return {
    m3u8: data.link,
    referer: deriveReferer(data),
    server: data.server ?? server,
    category: data.category ?? category,
    tracks: data.tracks
      .filter((t): t is typeof t & { file: string } => !!t.file)
      .map((t) => ({
        file: t.file,
        label: t.label ?? "Subtitle",
        default: t.default ?? false,
      })),
    intro: data.intro ?? null,
    outro: data.outro ?? null,
  };
}
