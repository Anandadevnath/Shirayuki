import config from './config.js';

export const API_CONFIG = {
  message: "Welcome to Shirayuki Anime Scraper!",
  version: config.API_VERSION,
  baseURL: import.meta.env.VITE_API_BASE_URL || config.API_BASE_URL
};

export const API_ENDPOINTS = {

  HOMEPAGE: "/home",
  TOP_10: "/top10",
  MONTHLY_TOP_10: "/monthly10",
  WEEKLY_TOP_10: "/weekly10",
  SCHEDULE: "/schedule",
  AZ_ALL_ANIME: "/az-all-anime/all/",
  GENRE: "/genere/",
  SEARCH: "/search",
  SEARCH_SUGGESTIONS: "/search/suggestions",
  EPISODE_STREAM: "/episode-stream",
  ANIME_DETAILS: "/anime/"
};

export const buildEndpoint = {

  azAnimeList: (page = 1) => `${API_ENDPOINTS.AZ_ALL_ANIME}?page=${page}`,

  genreAnime: (genre, page = 1) => `${API_ENDPOINTS.GENRE}${genre}?page=${page}`,

  searchAnime: (keyword) => `${API_ENDPOINTS.SEARCH}?keyword=${encodeURIComponent(keyword)}`,

  searchSuggestions: (query) => `${API_ENDPOINTS.SEARCH_SUGGESTIONS}?q=${encodeURIComponent(query)}`,

  episodeStream: (animeId, episode) => `${API_ENDPOINTS.EPISODE_STREAM}?id=${animeId}&ep=${episode}`,

  animeDetails: (animeTitle) => `${API_ENDPOINTS.ANIME_DETAILS}${animeTitle}`
};

export const buildFullURL = {

  complete: (endpoint) => `${API_CONFIG.baseURL}${endpoint}`,

  azAnimeList: (page = 1) => `${API_CONFIG.baseURL}${buildEndpoint.azAnimeList(page)}`,
  genreAnime: (genre, page = 1) => `${API_CONFIG.baseURL}${buildEndpoint.genreAnime(genre, page)}`,
  searchAnime: (keyword) => `${API_CONFIG.baseURL}${buildEndpoint.searchAnime(keyword)}`,
  searchSuggestions: (query) => `${API_CONFIG.baseURL}${buildEndpoint.searchSuggestions(query)}`,
  episodeStream: (animeId, episode) => `${API_CONFIG.baseURL}${buildEndpoint.episodeStream(animeId, episode)}`,
  animeDetails: (animeTitle) => `${API_CONFIG.baseURL}${buildEndpoint.animeDetails(animeTitle)}`
};

export const USAGE_EXAMPLES = {
  homepage: API_ENDPOINTS.HOMEPAGE,
  top10: API_ENDPOINTS.TOP_10,

  actionAnime: buildEndpoint.genreAnime("Action", 2),
  searchOnePiece: buildEndpoint.searchAnime("one piece"),
  demonSlayerSuggestions: buildEndpoint.searchSuggestions("demon slayer"),
  onePieceEpisode1: buildEndpoint.episodeStream("one-piece-dub", 1),
  animeDetails: buildEndpoint.animeDetails("sozai-saishuka-no-isekai-ryokouki")
};

export default {
  API_CONFIG,
  API_ENDPOINTS,
  buildEndpoint,
  buildFullURL,
  USAGE_EXAMPLES
};