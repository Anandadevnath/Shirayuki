import React, { createContext, useContext, useState, useCallback } from 'react';
import apiService from './apiService.js';

const ShirayukiAPIContext = createContext();

export const useShirayukiAPI = () => {
    const context = useContext(ShirayukiAPIContext);
    if (!context) {
        throw new Error('useShirayukiAPI must be used within a ShirayukiAPIProvider');
    }
    return context;
};

export const ShirayukiAPIProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const makeAPICall = useCallback(async (apiMethod, ...args) => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiMethod(...args);
            return result;
        } catch (err) {
            setError(err.message || 'An error occurred');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const api = {
        // Homepage
        getHomepage: useCallback(() => makeAPICall(apiService.getHomepage), [makeAPICall]),

        // Recently Updated
        getRecentUpdates: useCallback(() => makeAPICall(apiService.getRecentUpdates), [makeAPICall]),
        getRecentUpdatesDub: useCallback(() => makeAPICall(apiService.getRecentUpdatesDub), [makeAPICall]),

        // Trending
        getTrending: useCallback(() => makeAPICall(apiService.getTrending), [makeAPICall]),

        // Top rankings
        getTop10: useCallback(() => makeAPICall(apiService.getTop10), [makeAPICall]),
        getMonthlyTop10: useCallback(() => makeAPICall(apiService.getMonthly10), [makeAPICall]),
        getWeeklyTop10: useCallback(() => makeAPICall(apiService.getWeekly10), [makeAPICall]),

        // Schedule
        getSchedule: useCallback(() => makeAPICall(apiService.getSchedule), [makeAPICall]),

        // A-Z anime list
        getAZAnimeList: useCallback((page) => makeAPICall(apiService.getAZAnimeList, page), [makeAPICall]),

        // Genre-based anime
        getAnimeByGenre: useCallback((genre, page) => makeAPICall(apiService.getAnimeByGenre, genre, page), [makeAPICall]),

        // Search functionality
        searchAnime: useCallback((keyword) => makeAPICall(apiService.searchAnime, keyword), [makeAPICall]),
        getSearchSuggestions: useCallback((query) => makeAPICall(apiService.getSearchSuggestions, query), [makeAPICall]),

        // Streaming and details
        getEpisodeStream: useCallback((animeId, episode) => makeAPICall(apiService.getEpisodeStream, animeId, episode), [makeAPICall]),
        getAnimeDetails: useCallback((animeTitle) => makeAPICall(apiService.getAnimeDetails, animeTitle), [makeAPICall]),

        // Utility
        setBaseURL: apiService.setBaseURL.bind(apiService),
        getBaseURL: apiService.getBaseURL.bind(apiService)
    };

    // Clear error method
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value = {
        ...api,
        loading,
        error,
        clearError
    };

    return (
        <ShirayukiAPIContext.Provider value={value}>
            {children}
        </ShirayukiAPIContext.Provider>
    );
};

export default ShirayukiAPIContext;