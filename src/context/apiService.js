import config from './config.js';

class ShirayukiAPIService {
  // Recently Updated (SUB)
  getRecentUpdates = async () => {
    return this.apiCall('/recent_updates');
  }

  // Recently Updated (DUB)
  getRecentUpdatesDub = async () => {
    return this.apiCall('/recent_updates_dub');
  }
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || config.API_BASE_URL;
  }

  async apiCall(endpoint, options = {}) {
    try {

      const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

      const defaultOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      const response = await fetch(url, defaultOptions);

      let responseBody = null;
      try {
        responseBody = await response.clone().json();
      } catch (e) {
        responseBody = await response.text();
      }

      if (!response.ok) {
        const errorInfo = {
          message: `HTTP error! status: ${response.status}`,
          status: response.status,
          body: responseBody
        };
        console.error('API call failed:', errorInfo);
        return { error: true, ...errorInfo };
      }

      return responseBody;
    } catch (error) {
      console.error('API call failed:', error);
      return { error: true, message: error.message };
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
    return this.apiCall('/db-schedule');
  }

  // A-Z anime list
  getAZAnimeList = async (page = 1) => {
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

  // suggestion
  getSearchSuggestions = async (query) => {
    return this.apiCall(`/search/suggestions?q=${encodeURIComponent(query)}`);
  }

  // Streaming and details
  getEpisodeStream = async (animeId, episode) => {
    if (!animeId) return { error: true, message: 'Missing animeId' };
    let formatted = String(animeId)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/--+/g, '-');
    formatted = encodeURIComponent(formatted);
    return this.apiCall(`/episode-stream?id=${formatted}&ep=${episode}`);
  }

  // Anime Details
  getAnimeDetails = async (animeTitle) => {
    let formattedTitle = animeTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/--+/g, '-');
    formattedTitle = encodeURIComponent(formattedTitle);
    return this.apiCall(`/anime/${formattedTitle}`);
  }

  setBaseURL = (newBaseURL) => {
    this.baseURL = newBaseURL;
  }

  getBaseURL = () => {
    return this.baseURL;
  }
}

const apiService = new ShirayukiAPIService();

export default apiService;
export const getTop10 = apiService.getTop10;
export const getWeekly10 = apiService.getWeekly10;
export const getMonthly10 = apiService.getMonthly10;
export { ShirayukiAPIService };