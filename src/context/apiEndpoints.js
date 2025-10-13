/**
 * Shirayuki Anime Scraper API Endpoints
 * Version: 1.0.0
 * 
 * This file contains all the API endpoints for the Shirayuki Anime application.
 * Import and use these endpoints throughout your application for consistency.
 */

import config from './config.js';

// Base API configuration
export const API_CONFIG = {
  message: "Welcome to Shirayuki Anime Scraper!",
  version: config.API_VERSION,
  baseURL: import.meta.env.VITE_API_BASE_URL || config.API_BASE_URL
};

// API Endpoints
export const API_ENDPOINTS = {
  // Homepage
  HOMEPAGE: "/home",

  // Top Rankings
  TOP_10: "/top10",
  MONTHLY_TOP_10: "/monthly10",
  WEEKLY_TOP_10: "/weekly10",

  // Schedule
  SCHEDULE: "/schedule",

  // Browse
  AZ_ALL_ANIME: "/az-all-anime/all/",
  
  // Genre-based browsing
  GENRE: "/genere/",

  // Search functionality
  SEARCH: "/search",
  SEARCH_SUGGESTIONS: "/search/suggestions",

  // Streaming and Details
  EPISODE_STREAM: "/episode-stream",
  ANIME_DETAILS: "/anime/"
};

// Helper functions for dynamic endpoints
export const buildEndpoint = {
  /**
   * Build A-Z anime list endpoint with pagination
   * @param {number} page - Page number (default: 1)
   * @returns {string} Complete endpoint path
   */
  azAnimeList: (page = 1) => `${API_ENDPOINTS.AZ_ALL_ANIME}?page=${page}`,

  /**
   * Build genre-based anime list endpoint
   * @param {string} genre - Genre name (e.g., "Action", "Romance")
   * @param {number} page - Page number (default: 1)
   * @returns {string} Complete endpoint path
   */
  genreAnime: (genre, page = 1) => `${API_ENDPOINTS.GENRE}${genre}?page=${page}`,

  /**
   * Build search endpoint with keyword
   * @param {string} keyword - Search keyword
   * @returns {string} Complete endpoint path
   */
  searchAnime: (keyword) => `${API_ENDPOINTS.SEARCH}?keyword=${encodeURIComponent(keyword)}`,

  /**
   * Build search suggestions endpoint
   * @param {string} query - Search query for suggestions
   * @returns {string} Complete endpoint path
   */
  searchSuggestions: (query) => `${API_ENDPOINTS.SEARCH_SUGGESTIONS}?q=${encodeURIComponent(query)}`,

  /**
   * Build episode streaming endpoint
   * @param {string} animeId - Anime ID
   * @param {number} episode - Episode number
   * @returns {string} Complete endpoint path
   */
  episodeStream: (animeId, episode) => `${API_ENDPOINTS.EPISODE_STREAM}?id=${animeId}&ep=${episode}`,

  /**
   * Build anime details endpoint
   * @param {string} animeTitle - Anime title slug
   * @returns {string} Complete endpoint path
   */
  animeDetails: (animeTitle) => `${API_ENDPOINTS.ANIME_DETAILS}${animeTitle}`
};

// Complete URL builder (if you need full URLs)
export const buildFullURL = {
  /**
   * Build complete URL for any endpoint
   * @param {string} endpoint - The endpoint path
   * @returns {string} Complete URL
   */
  complete: (endpoint) => `${API_CONFIG.baseURL}${endpoint}`,

  // Convenience methods for full URLs
  azAnimeList: (page = 1) => `${API_CONFIG.baseURL}${buildEndpoint.azAnimeList(page)}`,
  genreAnime: (genre, page = 1) => `${API_CONFIG.baseURL}${buildEndpoint.genreAnime(genre, page)}`,
  searchAnime: (keyword) => `${API_CONFIG.baseURL}${buildEndpoint.searchAnime(keyword)}`,
  searchSuggestions: (query) => `${API_CONFIG.baseURL}${buildEndpoint.searchSuggestions(query)}`,
  episodeStream: (animeId, episode) => `${API_CONFIG.baseURL}${buildEndpoint.episodeStream(animeId, episode)}`,
  animeDetails: (animeTitle) => `${API_CONFIG.baseURL}${buildEndpoint.animeDetails(animeTitle)}`
};

// Example usage patterns (you can remove this section if not needed)
export const USAGE_EXAMPLES = {
  // Static endpoints
  homepage: API_ENDPOINTS.HOMEPAGE,
  top10: API_ENDPOINTS.TOP_10,
  
  // Dynamic endpoints
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