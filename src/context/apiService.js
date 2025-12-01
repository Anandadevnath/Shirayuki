import config from './config.js';

class ShirayukiAPIService {
  
  getMostPopular = async () => {
    return this.apiCall('/most_popular');
  }

  getMostFavorite = async () => {
    return this.apiCall('/most_favorite');
  }

  getTopAiring = async () => {
    return this.apiCall('/top_airing');
  }

  getRecentUpdates = async () => {
    return this.apiCall('/recent_updates');
  }

  getRecentUpdatesDub = async () => {
    return this.apiCall('/recent_updates_dub');
  }

  getTrending = async () => {
    return this.apiCall('/trending');
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
        mode: 'cors', 
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
      const errorMessage = error.name === 'TypeError' && error.message.includes('Failed to fetch')
        ? 'Network error: Unable to connect to API server. Please check your connection or try again later.'
        : error.message;

      console.error('API call failed:', error);
      return {
        error: true,
        message: errorMessage,
        type: error.name || 'NetworkError'
      };
    }
  }

  getHomepage = async () => {
    return this.apiCall('/home');
  }

  getTop10 = async () => {
    return this.apiCall('/top10');
  }

  getWeekly10 = async () => {
    return this.apiCall('/weekly10');
  }

  getMonthly10 = async () => {
    return this.apiCall('/monthly10');
  }

  getSchedule = async () => {
    return this.apiCall('/db-schedule');
  }

  getAZAnimeList = async (page = 1) => {
    return this.apiCall(`/az-all-anime/all/?page=${page}`);
  }

  getAnimeByGenre = async (genre, page = 1) => {
    return this.apiCall(`/genere/${genre}?page=${page}`);
  }

  searchAnime = async (keyword) => {
    return this.apiCall(`/search?keyword=${encodeURIComponent(keyword)}`);
  }

  getSearchSuggestions = async (query) => {
    return this.apiCall(`/search/suggestions?q=${encodeURIComponent(query)}`);
  }

  getEpisodeStream = async (animeId, episode) => {
    if (!animeId) return { error: true, message: 'Missing animeId' };
    let formatted = String(animeId)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/--+/g, '-');
    formatted = encodeURIComponent(formatted);

    const endpoint = `/episode-stream?id=${formatted}&ep=${episode}`;
    console.log('  Endpoint:', endpoint);

    return this.apiCall(endpoint);
  }

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