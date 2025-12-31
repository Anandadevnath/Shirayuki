import { apiClient } from "./client";
import { ENDPOINTS } from "./endpoints";

// Home
export const getHome = () => apiClient.get(ENDPOINTS.HOME);

// A-Z List
export const getAZList = (letter = "0-9", page = 1) =>
  apiClient.get(ENDPOINTS.AZ_LIST(letter, page));

// Anime
export const getAnimeDetails = (animeId) =>
  apiClient.get(ENDPOINTS.ANIME_DETAILS(animeId));

export const getAnimeEpisodes = (animeId) =>
  apiClient.get(ENDPOINTS.ANIME_EPISODES(animeId));

// Search
export const searchAnime = (query, page = 1) =>
  apiClient.get(ENDPOINTS.SEARCH(query, page));

export const searchAnimeAdvanced = (params) =>
  apiClient.get(ENDPOINTS.SEARCH_ADVANCED(params));

export const getSearchSuggestions = (query) =>
  apiClient.get(ENDPOINTS.SEARCH_SUGGESTION(query));

// Browse
export const getProducer = (producerId, page = 1) =>
  apiClient.get(ENDPOINTS.PRODUCER(producerId, page));

export const getGenre = (genreId, page = 1) =>
  apiClient.get(ENDPOINTS.GENRE(genreId, page));

export const getCategory = (categoryId, page = 1) =>
  apiClient.get(ENDPOINTS.CATEGORY(categoryId, page));

// Schedule
export const getSchedule = (date) => apiClient.get(ENDPOINTS.SCHEDULE(date));

// Episode
export const getEpisodeServers = (animeEpisodeId) =>
  apiClient.get(ENDPOINTS.EPISODE_SERVERS(animeEpisodeId));

export const getEpisodeSources = (animeEpisodeId, server = "hd-1", category = "sub") =>
  apiClient.get(ENDPOINTS.EPISODE_SOURCES(animeEpisodeId, server, category));
