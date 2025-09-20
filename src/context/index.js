// Export all context providers and hooks for easy importing
export { APIProvider, useAPI } from './APIContext.jsx';

// Export the API service directly for advanced use cases
export { default as hiAnimeAPI } from './api/hiAnimeAPI.js';
export { default as apiClient } from './api/apiClient.js';