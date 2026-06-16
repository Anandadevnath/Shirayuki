import { apiFetch, V2 } from "./client";
import * as S from "./schemas";
import * as M from "./mappers";
import { isAnimeId } from "../../utils/id";
import type {
  AnimeDetail,
  EpisodesModel,
  HomeModel,
  Paginated,
  AnimeCardModel,
  ServerCategory,
  ServersModel,
  SourcesModel,
} from "../types";

const HOME_REVALIDATE = 900;
const LIST_REVALIDATE = 900;
const DETAIL_REVALIDATE = 3600;

export async function getHome(): Promise<HomeModel> {
  const { data } = await apiFetch(`${V2}/home`, S.envelope(S.homeData), {
    revalidate: HOME_REVALIDATE,
    tags: ["home"],
  });
  return {
    spotlight: data.spotlight.map(M.toSpotlight),
    trending: data.trending.map(M.toCard),
    topAiring: data.topAiring.map(M.toCard),
    // AnimeX exposes richer sections than the legacy provider.
    latestEpisodes: (data.seasonal?.results ?? []).map(M.toCard),
    mostPopular: data.mostPopular.map(M.toCard),
    top10: data.topRated.map(M.toCard),
    upcoming: data.upcoming.map(M.toCard),
  };
}

export async function getAnime(id: string): Promise<AnimeDetail | null> {
  // AnimeX requires a numeric id; a slug (e.g. stale hianime data) → 404, not 400.
  if (!isAnimeId(id)) return null;
  const { data } = await apiFetch(
    `${V2}/anime/${encodeURIComponent(id)}`,
    S.envelope(S.detailData),
    { revalidate: DETAIL_REVALIDATE, tags: [`anime:${id}`] },
  );
  if (M.isEmptyDetail(data)) return null;
  return M.toDetail(data);
}

export async function getEpisodes(id: string): Promise<EpisodesModel> {
  if (!isAnimeId(id)) {
    return { animeId: id, totalEpisodes: 0, ranges: [], episodes: [] };
  }
  const { data } = await apiFetch(
    `${V2}/anime/${encodeURIComponent(id)}/episodes`,
    S.envelope(S.episodesData),
    { revalidate: DETAIL_REVALIDATE, tags: [`anime:${id}`] },
  );
  return {
    animeId: data.animeId != null ? String(data.animeId) : id,
    totalEpisodes: data.totalEpisodes,
    ranges: [],
    episodes: data.episodes.map((e) => ({
      number: e.number,
      title: e.title ?? null,
      episodeId: e.episodeId,
      isFiller: e.filler ?? false,
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
  return getList(`${V2}/genre/${id}?page=${page}`, `genre:${id}`);
}

export function getCategory(id: string, page = 1) {
  return getList(`${V2}/category/${id}?page=${page}`, `category:${id}`);
}

export function getProducer(id: string, page = 1) {
  return getList(`${V2}/producer/${id}?page=${page}`, `producer:${id}`);
}

/** AnimeX azlist ignores the letter and returns the full catalogue (~20k). */
export function getAZ(letter: string, page = 1) {
  const seg = letter && letter !== "All" ? encodeURIComponent(letter) : "all";
  return getList(`${V2}/azlist/${seg}?page=${page}`, `az:${seg}`);
}

export async function suggest(q: string): Promise<AnimeCardModel[]> {
  const { data } = await apiFetch(
    `${V2}/search/suggestion?q=${encodeURIComponent(q)}`,
    S.envelope(S.suggestionData),
    { revalidate: 300, tags: [`suggest:${q}`] },
  );
  return data.suggestions.map(M.toCard);
}

export interface ScheduleItem {
  id: string;
  title: string;
  episodeNumber: number | null;
  airingTime: string | null;
  time: string | null;
}

export async function getSchedule(date: string, timezone = "UTC"): Promise<ScheduleItem[]> {
  const { data } = await apiFetch(
    `${V2}/schedule?date=${date}&timezone=${encodeURIComponent(timezone)}`,
    S.envelope(S.scheduleData),
    { revalidate: 600, tags: [`schedule:${date}`] },
  );
  return data.results.map((r) => ({
    id: r.id,
    title: r.title ?? r.ename ?? "Untitled",
    episodeNumber: r.episodeNumber ?? null,
    airingTime: r.airingTime ?? null,
    time: r.time ?? null,
  }));
}

/** Servers + sources are NEVER cached long — links expire. */
export async function getServers(
  animeEpisodeId: string,
  ep: number,
): Promise<ServersModel> {
  const path = `${V2}/episode/servers?animeEpisodeId=${encodeURIComponent(
    animeEpisodeId,
  )}&ep=${ep}`;
  const { data } = await apiFetch(path, S.envelope(S.serversData), { noStore: true });
  const map = (
    arr: { name: string; nameId: string }[],
    category: ServerCategory,
  ) => arr.map((s) => ({ name: s.name, nameId: s.nameId, category }));
  return {
    animeId: data.animeId != null ? String(data.animeId) : "",
    episode: data.episode,
    sub: map(data.servers.sub ?? [], "sub"),
    dub: map(data.servers.dub ?? [], "dub"),
    hsub: [],
  };
}

export async function getSources(
  animeEpisodeId: string,
  ep: number,
  server: string,
  category: string,
): Promise<SourcesModel | null> {
  const path = `${V2}/episode/sources?animeEpisodeId=${encodeURIComponent(
    animeEpisodeId,
  )}&ep=${ep}&server=${server}&category=${category}`;
  const { data } = await apiFetch(path, S.envelope(S.sourcesData), { noStore: true });
  const first = data.sources[0];
  if (!first) return null;
  return {
    m3u8: first.m3u8,
    referer: first.referer ?? null,
    server: first.server ?? server,
    category: first.category ?? category,
    tracks: data.tracks.map((t) => ({
      file: t.file,
      label: t.label ?? "Subtitle",
      default: t.default ?? false,
    })),
    intro: data.intro ?? null,
    outro: data.outro ?? null,
  };
}
