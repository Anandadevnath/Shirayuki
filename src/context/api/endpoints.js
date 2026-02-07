export const API_VERSION = "v2";

export const ANIME_ENDPOINTS = {

  // Home 
  HOME: `/api/${API_VERSION}/hianime/home`,
  
  // SCHEDULE
  SCHEDULE: (date) => 
    `/api/${API_VERSION}/hianime/schedule?date=${date}`,

  // A-Z Listing
  AZ_LIST: (letter = "0-9", page = 1) =>
    `/api/${API_VERSION}/hianime/azlist/${letter}?page=${page}`,

  // Anime Details
  ANIME_DETAILS: (animeId) => 
    `/api/${API_VERSION}/hianime/anime/${animeId}`,
  
  // Anime all episode
  ANIME_EPISODES: (animeId) =>
    `/api/${API_VERSION}/hianime/anime/${animeId}/episodes`,

  // Search
  SEARCH: (query, page = 1) =>
    `/api/${API_VERSION}/hianime/search?q=${encodeURIComponent(query)}&page=${page}`,
  
  // Basic Suggestion
  SEARCH_SUGGESTION: (query) =>
    `/api/${API_VERSION}/hianime/search/suggestion?q=${encodeURIComponent(query)}`,
  
  // Advance Suggestion
  SEARCH_ADVANCED: (params) => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append("q", params.q);
    if (params.genres) searchParams.append("genres", params.genres);
    if (params.type) searchParams.append("type", params.type);
    if (params.sort) searchParams.append("sort", params.sort);
    if (params.season) searchParams.append("season", params.season);
    if (params.language) searchParams.append("language", params.language);
    if (params.status) searchParams.append("status", params.status);
    if (params.rated) searchParams.append("rated", params.rated);
    if (params.start_date) searchParams.append("start_date", params.start_date);
    if (params.score) searchParams.append("score", params.score);
    return `/api/${API_VERSION}/hianime/search/advanced?${searchParams.toString()}`;
  },

  // Browse by Category
  PRODUCER: (producerId, page = 1) =>
    `/api/${API_VERSION}/hianime/producer/${producerId}?page=${page}`,
  
  GENRE: (genreId, page = 1) =>
    `/api/${API_VERSION}/hianime/genre/${genreId}?page=${page}`,
  
  CATEGORY: (categoryId, page = 1) =>
    `/api/${API_VERSION}/hianime/category/${categoryId}?page=${page}`,

  // Episode Streaming
  EPISODE_SERVERS: (animeEpisodeId) =>
    `/api/${API_VERSION}/hianime/episode/servers?animeEpisodeId=${animeEpisodeId}`,
  
  // Episode Streaming Source
  EPISODE_SOURCES: (animeEpisodeId, episodeId, ep, server, category = 'sub') => {
    const url = `/api/${API_VERSION}/hianime/episode/sources?animeEpisodeId=${animeEpisodeId}&ep=${ep}&server=${server}&category=${category}`;
    console.log("[ENDPOINTS] Episode Sources URL:", url);
    return url;
  },
};


export const BACKEND_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    UPDATE_PASSWORD: "/api/auth/update-password",
    SEND_VERIFICATION: "/api/auth/send-verification",
    VERIFY_EMAIL: "/api/auth/verify-email",
  },
  
  // User Profile
  USER: {
    GET_PROFILE: (userId) => `/api/user/info/${userId}`,
    UPDATE_PROFILE: (userId) => `/api/user/info/${userId}`,
    DELETE_ACCOUNT: (userId) => `/api/user/${userId}`,
  },
  
  // Profile Pictures
  PROFILE: {
    GET_PREBUILT_PFPS: "/api/profile/pfps",
    UPLOAD_CUSTOM_PFP: "/api/profile/pfp/upload",
    SELECT_PREBUILT_PFP: "/api/profile/pfp/select",
  },
  
  // Watch Progress & History
  PROGRESS: {
    GET_WATCH_PROGRESS: (userId) => `/api/progress/${userId}`,
    UPDATE_WATCH_PROGRESS: (userId) => `/api/progress/${userId}`,
    DELETE_WATCH_PROGRESS: (userId, animeId) => `/api/progress/${userId}/${animeId}`,
  },
};


export const ENDPOINTS = {
  // Anime endpoints
  HOME: ANIME_ENDPOINTS.HOME,
  AZ_LIST: ANIME_ENDPOINTS.AZ_LIST,
  ANIME_DETAILS: ANIME_ENDPOINTS.ANIME_DETAILS,
  ANIME_EPISODES: ANIME_ENDPOINTS.ANIME_EPISODES,
  SEARCH: ANIME_ENDPOINTS.SEARCH,
  SEARCH_ADVANCED: ANIME_ENDPOINTS.SEARCH_ADVANCED,
  SEARCH_SUGGESTION: ANIME_ENDPOINTS.SEARCH_SUGGESTION,
  PRODUCER: ANIME_ENDPOINTS.PRODUCER,
  GENRE: ANIME_ENDPOINTS.GENRE,
  CATEGORY: ANIME_ENDPOINTS.CATEGORY,
  SCHEDULE: ANIME_ENDPOINTS.SCHEDULE,
  EPISODE_SERVERS: ANIME_ENDPOINTS.EPISODE_SERVERS,
  EPISODE_SOURCES: ANIME_ENDPOINTS.EPISODE_SOURCES,
  
  // Backend endpoints
  AUTH: BACKEND_ENDPOINTS.AUTH,
  PROFILE: BACKEND_ENDPOINTS.PROFILE,
  USER: {
    GET_USER_PROFILE: BACKEND_ENDPOINTS.USER.GET_PROFILE,
    UPDATE_USER_PROFILE: BACKEND_ENDPOINTS.USER.UPDATE_PROFILE,
  },
  PROGRESS: {
    WATCH: BACKEND_ENDPOINTS.PROGRESS.GET_WATCH_PROGRESS,
    UPDATE: BACKEND_ENDPOINTS.PROGRESS.UPDATE_WATCH_PROGRESS,
    DELETE: BACKEND_ENDPOINTS.PROGRESS.DELETE_WATCH_PROGRESS,
  },
};