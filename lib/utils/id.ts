/**
 * AnimeX uses numeric AniList ids (e.g. "21087"). The episode id format is
 * "<animeId>:<ep>" (e.g. "147105:1"). Guarding against non-numeric ids stops
 * doomed 400 calls — e.g. when a stale slug-based id (from the old hianime
 * build) reaches a route.
 */
export const isAnimeId = (id: string): boolean => /^\d+$/.test(id);

export const isEpisodeId = (id: string): boolean => /^\d+:\d+$/.test(id);
