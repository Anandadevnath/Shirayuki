import config from './config.js';

class ShirayukiAPIService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || config.API_BASE_URL;
  }

  async apiCall(endpoint, options = {}) {
    try {
      console.log('API Service - baseURL:', this.baseURL);
      console.log('API Service - endpoint:', endpoint);
      
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
      console.log('API Service - final URL:', url);
      
      const defaultOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  // Homepage data
  getHomepage = async () => {
    return this.apiCall('/home');
  }

  // Top rankings
  getTop10 = async () => {
    return this.apiCall('/top10');
  }

  getWeekly10 = async () => {
    return this.apiCall('/weekly10');
  }

  getMonthly10 = async () => {
    return this.apiCall('/monthly10');
  }

  // Schedule
  getSchedule = async () => {
    return this.apiCall('/schedule');
  }

  // A-Z anime list
  getAZAnimeList = async (page = 1) => {
    // We'll use direct endpoints for now since buildEndpoint has dependencies
    return this.apiCall(`/az-all-anime/all/?page=${page}`);
  }

  // Genre-based anime
  getAnimeByGenre = async (genre, page = 1) => {
    return this.apiCall(`/genere/${genre}?page=${page}`);
  }

  // Search functionality
  searchAnime = async (keyword) => {
    return this.apiCall(`/search?keyword=${encodeURIComponent(keyword)}`);
  }

  getSearchSuggestions = async (query) => {
    return this.apiCall(`/search/suggestions?q=${encodeURIComponent(query)}`);
  }

  // Streaming and details
  getEpisodeStream = async (animeId, episode) => {
    return this.apiCall(`/episode-stream?id=${animeId}&ep=${episode}`);
  }

  getAnimeDetails = async (animeTitle) => {
    return this.apiCall(`/anime/${animeTitle}`);
  }

  // Utility methods
  setBaseURL = (newBaseURL) => {
    this.baseURL = newBaseURL;
  }

  getBaseURL = () => {
    return this.baseURL;
  }
}

// Create and export a singleton instance
const apiService = new ShirayukiAPIService();

export default apiService;
// Leaderboard API exports for direct import
export const getTop10 = apiService.getTop10;
export const getWeekly10 = apiService.getWeekly10;
export const getMonthly10 = apiService.getMonthly10;

// Also export the class for custom instances if needed
export { ShirayukiAPIService };