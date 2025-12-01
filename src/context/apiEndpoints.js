import config from './config.js';

export const API_CONFIG = {
  message: "Welcome to Shirayuki Anime Scraper!",
  version: config.API_VERSION,
  baseURL: import.meta.env.VITE_API_BASE_URL || config.API_BASE_URL
};

export const API_ENDPOINTS = {
  HOMEPAGE: "/home",
  SCHEDULE: "/db-schedule",
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

export default {
  API_CONFIG,
  API_ENDPOINTS,
  buildEndpoint
};