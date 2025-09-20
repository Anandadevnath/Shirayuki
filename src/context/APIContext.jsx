import React, { createContext, useContext, useState } from 'react';
import hiAnimeAPI from './api/hiAnimeAPI.js';

const APIContext = createContext();
/**
 * @returns {Object} 
 */
export const useAPI = () => {
  const context = useContext(APIContext);
  if (!context) {
    throw new Error('useAPI must be used within an APIProvider');
  }
  return context;
};

export const APIProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * @param {Function} apiCall
   * @param {...any} args 
   * @returns {Promise} 
   */
  const executeAPI = async (apiCall, ...args) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiCall(...args);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const api = {
    // Home and basic info
    getHomePage: () => executeAPI(hiAnimeAPI.getHomePage.bind(hiAnimeAPI)),
    getAZList: (sortOption, page) => executeAPI(hiAnimeAPI.getAZList.bind(hiAnimeAPI), sortOption, page),
    getAnimeQtip: (animeId) => executeAPI(hiAnimeAPI.getAnimeQtip.bind(hiAnimeAPI), animeId),
    getAnimeInfo: (animeId) => executeAPI(hiAnimeAPI.getAnimeInfo.bind(hiAnimeAPI), animeId),

    // Search
    searchAnime: (query, page) => executeAPI(hiAnimeAPI.searchAnime.bind(hiAnimeAPI), query, page),
    getSearchSuggestions: (query) => executeAPI(hiAnimeAPI.getSearchSuggestions.bind(hiAnimeAPI), query),

    // Categories and filters
    getProducerAnimes: (name, page) => executeAPI(hiAnimeAPI.getProducerAnimes.bind(hiAnimeAPI), name, page),
    getGenreAnimes: (name, page) => executeAPI(hiAnimeAPI.getGenreAnimes.bind(hiAnimeAPI), name, page),
    getCategoryAnimes: (name, page) => executeAPI(hiAnimeAPI.getCategoryAnimes.bind(hiAnimeAPI), name, page),

    // Schedule
    getSchedule: (date) => executeAPI(hiAnimeAPI.getSchedule.bind(hiAnimeAPI), date),

    // Episodes and streaming
    getAnimeEpisodes: (animeId) => executeAPI(hiAnimeAPI.getAnimeEpisodes.bind(hiAnimeAPI), animeId),
    getNextEpisodeSchedule: (animeId) => executeAPI(hiAnimeAPI.getNextEpisodeSchedule.bind(hiAnimeAPI), animeId),
    getEpisodeServers: (animeEpisodeId) => executeAPI(hiAnimeAPI.getEpisodeServers.bind(hiAnimeAPI), animeEpisodeId),
    getEpisodeStreamingLinks: (animeEpisodeId, server, category) => 
      executeAPI(hiAnimeAPI.getEpisodeStreamingLinks.bind(hiAnimeAPI), animeEpisodeId, server, category),
  };

  const contextValue = {
    api,
    isLoading,
    error,
    clearError,
  };

  return (
    <APIContext.Provider value={contextValue}>
      {children}
    </APIContext.Provider>
  );
};