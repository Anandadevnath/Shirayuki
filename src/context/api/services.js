import { apiClient, backendClient } from "./client";
import { ENDPOINTS } from "./endpoints";

// Email Verification
export const sendVerificationEmail = (payload) =>
  backendClient.post(ENDPOINTS.AUTH.SEND_VERIFICATION, payload);

export const verifyEmailCode = (payload) =>
  backendClient.post(ENDPOINTS.AUTH.VERIFY_EMAIL, payload);

// Auth
export const register = (payload) =>
  backendClient.post(ENDPOINTS.AUTH.REGISTER, payload);

export const login = (payload) =>
  backendClient.post(ENDPOINTS.AUTH.LOGIN, payload);

export const forgotPassword = (email) =>
  backendClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });

export const updatePassword = (payload) =>
  backendClient.post(ENDPOINTS.AUTH.UPDATE_PASSWORD, payload);

// User Profile
export const getUserProfile = (userId) =>
  backendClient.get(ENDPOINTS.USER.GET_USER_PROFILE(userId));

export const updateUserProfile = (userId, data) =>
  backendClient.post(ENDPOINTS.USER.UPDATE_USER_PROFILE(userId), data);

export const deleteUserAccount = (userId) =>
  backendClient.post(ENDPOINTS.USER.DELETE_ACCOUNT(userId));

// Profile Pictures
export const getPrebuiltPfps = () =>
  backendClient.get(ENDPOINTS.PROFILE.GET_PREBUILT_PFPS);

export const uploadCustomPfp = (formData) =>
  backendClient.post(ENDPOINTS.PROFILE.UPLOAD_CUSTOM_PFP, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const selectPrebuiltPfp = (payload) =>
  backendClient.post(ENDPOINTS.PROFILE.SELECT_PREBUILT_PFP, payload);

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

// Watch Progress & History
export const getWatchProgress = (userId) =>
  apiClient.get(ENDPOINTS.PROGRESS.WATCH(userId));
