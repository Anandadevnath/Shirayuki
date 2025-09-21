import apiClient from './apiClient.js';

class HiAnimeAPI {
  /**
   * Get anime home page data
   * @returns {Promise} Home page data
   */
  async getHomePage() {
    try {
      const response = await apiClient.get('/api/v2/hianime/home');
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch home page', error);
    }
  }

  /**
   * Get anime A-Z list
   * @param {string} sortOption - Sort option for the list
   * @param {number} page - Page number (default: 1)
   * @returns {Promise} A-Z list data
   */
  async getAZList(sortOption, page = 1) {
    try {
      const response = await apiClient.get(`/api/v2/hianime/azlist/${sortOption}`, {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch A-Z list', error);
    }
  }

  /**
   * Get anime quick tip info
   * @param {string} animeId - The anime ID
   * @returns {Promise} Quick tip info
   */
  async getAnimeQtip(animeId) {
    try {
      const response = await apiClient.get(`/api/v2/hianime/qtip/${animeId}`);
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch anime qtip info', error);
    }
  }

  /**
   * Get anime detailed info
   * @param {string} animeId - The anime ID
   * @returns {Promise} Anime detailed info
   */
  async getAnimeInfo(animeId) {
    try {
      const response = await apiClient.get(`/api/v2/hianime/anime/${animeId}`);
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch anime info', error);
    }
  }

  /**
   * Search for anime
   * @param {string} query - Search query
   * @param {number} page - Page number (default: 1)
   * @returns {Promise} Search results
   */
  async searchAnime(query, page = 1) {
    try {
      const response = await apiClient.get('/api/v2/hianime/search', {
        params: { q: query, page }
      });
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to search anime', error);
    }
  }

  /**
   * Get search suggestions
   * @param {string} query - Search query for suggestions
   * @returns {Promise} Search suggestions
   */
  async getSearchSuggestions(query) {
    try {
      const response = await apiClient.get('/api/v2/hianime/search/suggestion', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch search suggestions', error);
    }
  }

  /**
   * Get producer animes
   * @param {string} name - Producer name
   * @param {number} page - Page number (default: 1)
   * @returns {Promise} Producer animes
   */
  async getProducerAnimes(name, page = 1) {
    try {
      const response = await apiClient.get(`/api/v2/hianime/producer/${name}`, {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch producer animes', error);
    }
  }

  /**
   * Get genre animes
   * @param {string} name - Genre name
   * @param {number} page - Page number (default: 1)
   * @returns {Promise} Genre animes
   */
  async getGenreAnimes(name, page = 1) {
    try {
      const response = await apiClient.get(`/api/v2/hianime/genre/${name}`, {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch genre animes', error);
    }
  }

  /**
   * Get category animes
   * @param {string} name - Category name
   * @param {number} page - Page number (default: 1)
   * @returns {Promise} Category animes
   */
  async getCategoryAnimes(name, page = 1) {
    try {
      const response = await apiClient.get(`/api/v2/hianime/category/${name}`, {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch category animes', error);
    }
  }

  /**
   * Get estimated schedules
   * @param {string} date - Date for schedule (YYYY-MM-DD format)
   * @returns {Promise} Schedule data
   */
  async getSchedule(date) {
    try {
      const response = await apiClient.get('/api/v2/hianime/schedule', {
        params: { date }
      });
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch schedule', error);
    }
  }

  /**
   * Get anime episodes
   * @param {string} animeId - The anime ID
   * @returns {Promise} Episodes data
   */
  async getAnimeEpisodes(animeId) {
    try {
      const response = await apiClient.get(`/api/v2/hianime/anime/${animeId}/episodes`);
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch anime episodes', error);
    }
  }

  /**
   * Get anime next episode schedule
   * @param {string} animeId - The anime ID
   * @returns {Promise} Next episode schedule
   */
  async getNextEpisodeSchedule(animeId) {
    try {
      const response = await apiClient.get(`/api/v2/hianime/anime/${animeId}/next-episode-schedule`);
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch next episode schedule', error);
    }
  }

  /**
   * Get anime episode servers
   * @param {string} animeEpisodeId - The anime episode ID
   * @returns {Promise} Episode servers
   */
  async getEpisodeServers(animeEpisodeId) {
    try {
      const response = await apiClient.get('/api/v2/hianime/episode/servers', {
        params: { animeEpisodeId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch episode servers', error);
    }
  }

  /**
   * Get anime episode streaming links
   * @param {string} animeEpisodeId - The anime episode ID
   * @param {string} server - Server name (optional)
   * @param {string} category - Category (dub, sub, or raw) (optional)
   * @returns {Promise} Streaming links
   */
  async getEpisodeStreamingLinks(animeEpisodeId, server = null, category = null) {
    try {
      const params = { animeEpisodeId };
      if (server) params.server = server;
      if (category) params.category = category;

      const response = await apiClient.get('/api/v2/hianime/episode/sources', {
        params
      });
      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch episode streaming links', error);
    }
  }

  /**
   * Handle API errors consistently
   * @param {string} message - Error message
   * @param {Error} error - Original error
   * @returns {Error} Formatted error
   */
  handleError(message, error) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
    const statusCode = error.response?.status || 500;
    
    const formattedError = new Error(`${message}: ${errorMessage}`);
    formattedError.statusCode = statusCode;
    formattedError.originalError = error;
    
    return formattedError;
  }
}

// Create and export a singleton instance
const hiAnimeAPI = new HiAnimeAPI();
export default hiAnimeAPI;