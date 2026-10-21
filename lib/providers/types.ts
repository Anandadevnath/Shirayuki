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
  mostFavorite: AnimeCardModel[];
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
  /** Normalised air-date window, e.g. "Apr 8, 2026 to ?" — surfaced
   *  separately from `info` so the page doesn't have to duck-type the
   *  raw provider record. */
  aired: string | null;
  /** Raw MAL score as a string (e.g. "8.42") so the page can render the
   *  "MAL" chip without re-parsing the provider's `info["mal score"]`. */
  malScore: string | null;
  genres: string[];
  studios: string[];
  /** Production companies returned by the provider's detail payload. Kept as
   *  plain names (the detail endpoint has no slugs) — the richer studio /
   *  producer credits with slugs come from the /art bundle (`staff`). */
  producers: string[];
  episodes: EpisodeCount;
  info: Record<string, unknown>;
  recommended: AnimeCardModel[];
  /** Same shape as a card, but represents sibling titles in the provider's
   *  "trending" rail. Kept as cards so the existing Rail component renders
   *  them with zero customisation. */
  trending: AnimeCardModel[];
  /** Sibling seasons in the same franchise. order + isCurrent are display
   *  hints; the consumer (FranchiseTimeline) renders "current" with a frost
   *  chip and orders by the provider-provided `order` field. */
  seasons: SeasonModel[];
}

/** Sibling-season card: prequel / sequel / "part 2" split. */
export interface SeasonModel {
  id: string;
  title: string;
  jname: string | null;
  poster: string | null;
  type: string | null;
  year: string | null;
  episodes: EpisodeCount;
  order: number | null;
  isCurrent: boolean;
  /** true when the entry is a franchise MOVIE interleaved with the seasons. */
  isMovie?: boolean;
  season: number | null;
  part: number | null;
}

export interface EpisodeModel {
  number: number;
  title: string | null;
  episodeId: string; // opaque provider episode id (format drifts — never parse it)
  isFiller?: boolean;
}

export interface EpisodesModel {
  animeId: string;
  totalEpisodes: number;
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

/** One title in the release schedule. `airTime` / `episodeNumber` come from the
 *  real theme "Estimated Schedule" widget payloads; `premiereDate` / `weekday`
 *  are the premiere-derived fields kept from the fallback week. All exhibit
 *  provider nullability, so every display field stays nullable by design. */
export interface ScheduleItem {
  id: string;
  title: string;
  jname: string | null;
  poster: string | null;
  type: string | null;
  status: string | null;
  /** Raw upstream Aired window, e.g. "Sep 7, 2026 to ?". */
  aired: string | null;
  /** ISO "YYYY-MM-DD" of the air date, when known. */
  premiereDate: string | null;
  /** Weekday name (e.g. "Saturday"), alumni of `premiereDate`. */
  weekday: string | null;
  /** Scheduled air time from the theme schedule widget, e.g. "23:30". */
  airTime?: string | null;
  /** Scheduled episode label, e.g. "Episode 2". */
  episodeNumber?: string | null;
  /** True when the title has not premiered yet (Provider "Not yet aired"). */
  isUpcoming: boolean;
}

/** One weekday bucket in the weekly calendar. */
export interface ScheduleWeekday {
  day: string;
  items: ScheduleItem[];
}

export interface ScheduleModel {
  /** Upstream page the schedule was scraped from. */
  source: string | null;
  updatedAt: string | null;
  counted: {
    airing: number;
    upcoming: number;
    /** Upcoming titles with a derivable premiere date. */
    premieres: number;
    /** Upcoming titles without a derivable date (TBD). */
    tbd: number;
  };
  /** Premiere-dated upcoming titles grouped by weekday (Monday..Sunday,
   *  only days that have items). Every item here also appears in `upcoming`. */
  week: ScheduleWeekday[];
  /** Currently-airing titles (no weekday available from upstream). */
  airing: ScheduleItem[];
  /** Upcoming titles, sorted by premiere date (TBD last). */
  upcoming: ScheduleItem[];
}

/* ── art / cast bundle (from /art) ─────────────────────────────────────────── */

/** One franchise poster in the art gallery (detail poster + siblings). */
export interface ArtItem {
  id: string;
  slug: string | null;
  poster: string | null;
  title: string | null;
}

export interface VoiceActorModel {
  id: string | null;
  slug: string | null;
  name: string | null;
  poster: string | null;
  /** dub language, e.g. \"Japanese\". */
  language: string | null;
  url: string | null;
}

export interface CharacterModel {
  id: string | null;
  slug: string | null;
  name: string | null;
  poster: string | null;
  /** billed role on this title, e.g. \"Main\". */
  role: string | null;
  url: string | null;
  /** Primary billed voice actor — kept for backwards compatibility with the
   *  existing cast grid. `voiceActors` (below), when present, is the FULL set
   *  including this one. */
  voiceActor: VoiceActorModel | null;
  /** All voice actors for this character, in provider order. Only set when a
   *  character is billed more than once upstream (multiple Japanese VAs) and
   *  the list has been collapsed by `dedupeCharacters`; for single-VA
   *  characters this stays undefined and `voiceActor` is authoritative. */
  voiceActors?: VoiceActorModel[];
}

/** A studio or production credit from the /art bundle's `artists` / `company`. */
export interface StaffCredit {
  name: string;
  slug: string | null;
  kind: "studio" | "producer";
  url: string | null;
}

/** The full /art bundle — franchise posters, cast and production credits. */
export interface AnimeArtBundle {
  source: string | null;
  anime: {
    id: string | null;
    slug: string | null;
    title: string | null;
    jname: string | null;
    poster: string | null;
    description: string | null;
  };
  art: ArtItem[];
  characters: CharacterModel[];
  charactersTotal: number;
  /** Deduped studio + producer credits (exact name+kind pairs collapsed). */
  staff: StaffCredit[];
  /** The provider's primary company for the title, when returned. */
  company: StaffCredit | null;
}
