/**
 * Normalized, app-facing models. Components ONLY ever see these.
 * All provider field-drift / nullable handling happens in mappers.ts.
 */

export interface EpisodeCount {
  sub: number | null;
  dub: number | null;
}

/** A poster card used across rails, grids, search, spotlight. */
export interface AnimeCardModel {
  id: string;
  title: string;
  jname: string | null;
  poster: string | null;
  banner?: string | null;
  type: string | null;
  episodes: EpisodeCount;
  score?: number | null;
  rank?: number | null;
  /** present on schedule / airing contexts */
  airingTime?: string | null;
  episodeNumber?: number | null;
}

export interface SpotlightModel extends AnimeCardModel {
  description: string | null;
  quality: string | null;
}

export interface GenreModel {
  name: string;
  slug: string;
}

export interface Top10Buckets {
  day: AnimeCardModel[];
  week: AnimeCardModel[];
  month: AnimeCardModel[];
}

export interface HomeModel {
  spotlight: SpotlightModel[];
  trending: AnimeCardModel[];
  topAiring: AnimeCardModel[];
  mostPopular: AnimeCardModel[];
  latestEpisodes: AnimeCardModel[];
  newReleases: AnimeCardModel[];
  completed: AnimeCardModel[];
  upcoming: AnimeCardModel[];
  top10: Top10Buckets;
  genres: GenreModel[];
}

export interface AnimeDetail {
  id: string;
  title: string;
  jname: string | null;
  ename: string | null;
  description: string | null;
  poster: string | null;
  cover: string | null;
  type: string | null;
  status: string | null;
  year: number | null;
  season: string | null;
  score: number | null;
  rating: string | null;
  duration: number | null;
  genres: string[];
  studios: string[];
  episodes: EpisodeCount;
  info: Record<string, unknown>;
  recommended: AnimeCardModel[];
}

export interface EpisodeModel {
  number: number;
  title: string | null;
  episodeId: string; // AnimeX format: "<animeId>:<ep>" e.g. "147105:1"
  isFiller?: boolean;
}

export interface EpisodesModel {
  animeId: string;
  totalEpisodes: number;
  ranges: string[];
  episodes: EpisodeModel[];
}

export type ServerCategory = "sub" | "dub" | "hsub";

export interface ServerModel {
  name: string;
  nameId: string; // AnimeX: "megaplay"
  category: ServerCategory;
}

export interface ServersModel {
  animeId: string;
  episode: number;
  sub: ServerModel[];
  dub: ServerModel[];
  hsub: ServerModel[];
}

export interface SubtitleTrack {
  file: string;
  label: string;
  default: boolean;
}

export interface SkipRange {
  start: number;
  end: number;
}

export interface SourcesModel {
  m3u8: string;
  referer: string | null;
  server: string;
  category: string;
  tracks: SubtitleTrack[];
  intro: SkipRange | null;
  outro: SkipRange | null;
}

export interface Paginated<T> {
  results: T[];
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
}

/** Typed result wrapper so provider failures never throw past the boundary. */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
