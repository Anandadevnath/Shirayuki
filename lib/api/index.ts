import { cache } from "react";
import * as hianime from "../providers/hianime";

/**
 * Every page consumes the normalized models via THIS facade — the single choke
 * point between the app and the upstream API. Provider-specific schemas,
 * mappers and field-drift live behind `../providers/hianime`; to swap/replace
 * the API, swap that module (and its mappers) and nothing else here needs to
 * move — the normalized types in `../providers/types` stay app-facing.
 */
export type * from "../providers/types";

// `safe` and `withTimeout` live in a provider-free module so they stay
// unit-testable under node:test (this module imports the provider graph, whose
// extensionless bundler imports node cannot resolve). Re-exported here so call
// sites keep a single facade import and the `safe` contract stays single-source.
export { safe, withTimeout } from "./concurrency";

/* ── provider surface (request-scope memoized) ───────────────────────────────
 * React `cache()` dedupes repeated getter calls WITHIN one server request.
 * The detail/watch pages call the same getter in BOTH `generateMetadata` and
 * the page render; without this the upstream fetch / data-cache read runs
 * twice per visit. cache() collapses them into a single in-flight promise
 * (documented App Router pattern for sharing metadata + page fetches).
 */

export const getHome = cache(hianime.getHome);
export const getGenres = cache(hianime.getGenres);
export const getAnime = cache(hianime.getAnime);
export const getEpisodes = cache(hianime.getEpisodes);
export const search = cache(hianime.search);
export const getGenre = cache(hianime.getGenre);
export const getCategory = cache(hianime.getCategory);
export const getAZ = cache(hianime.getAZ);
export const getSchedule = cache(hianime.getSchedule);
export const suggest = cache(hianime.suggest);
export const getServers = cache(hianime.getServers);
export const getSources = cache(hianime.getSources);
export const getAnimeSeasons = cache(hianime.getAnimeSeasons);
export const getAnimeArt = cache(hianime.getAnimeArt);

