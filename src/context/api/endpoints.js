export const API_VERSION = "v2";

export const ENDPOINTS = {
  // Home
  HOME: `/api/${API_VERSION}/hianime/home`,

  // A-Z List
  AZ_LIST: (letter = "0-9", page = 1) =>
    `/api/${API_VERSION}/hianime/azlist/${letter}?page=${page}`,

  // Anime
  ANIME_DETAILS: (animeId) => `/api/${API_VERSION}/hianime/anime/${animeId}`,
  ANIME_EPISODES: (animeId) =>
    `/api/${API_VERSION}/hianime/anime/${animeId}/episodes`,

  // Search
  SEARCH: (query, page = 1) =>
    `/api/${API_VERSION}/hianime/search?q=${encodeURIComponent(query)}&page=${page}`,
  SEARCH_ADVANCED: (params) => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append("q", params.q);
    if (params.genres) searchParams.append("genres", params.genres);
    if (params.type) searchParams.append("type", params.type);
    if (params.sort) searchParams.append("sort", params.sort);
    if (params.season) searchParams.append("season", params.season);
    if (params.language) searchParams.append("language", params.language);
    if (params.status) searchParams.append("status", params.status);
    if (params.rated) searchParams.append("rated", params.rated);
    if (params.start_date) searchParams.append("start_date", params.start_date);
    if (params.score) searchParams.append("score", params.score);
    return `/api/${API_VERSION}/hianime/search/advanced?${searchParams.toString()}`;
  },
  SEARCH_SUGGESTION: (query) =>
    `/api/${API_VERSION}/hianime/search/suggestion?q=${encodeURIComponent(query)}`,

  // Browse
  PRODUCER: (producerId, page = 1) =>
    `/api/${API_VERSION}/hianime/producer/${producerId}?page=${page}`,
  GENRE: (genreId, page = 1) =>
    `/api/${API_VERSION}/hianime/genre/${genreId}?page=${page}`,
  CATEGORY: (categoryId, page = 1) =>
    `/api/${API_VERSION}/hianime/category/${categoryId}?page=${page}`,

  // Schedule
  SCHEDULE: (date) => `/api/${API_VERSION}/hianime/schedule?date=${date}`,

  // Episode
  EPISODE_SERVERS: (animeEpisodeId) =>
    `/api/${API_VERSION}/hianime/episode/servers?animeEpisodeId=${animeEpisodeId}`,
  EPISODE_SOURCES: (animeEpisodeId, server = "hd-1", category = "sub") =>
    `/api/${API_VERSION}/hianime/episode/sources?animeEpisodeId=${animeEpisodeId}&server=${server}&category=${category}`,
};
