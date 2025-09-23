import axios from 'axios';

// Base URL for the Hi-Anime API
// You can override this in development by setting VITE_API_BASE_URL in a .env file.
// If not set, DEV will use an empty base so the Vite dev server proxy (vite.config.js)
// forwards /api requests to the remote API. In production we use the full remote URL.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : 'https://hi-anime-api-one.vercel.app');

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 404) {
      console.error('Resource not found');
    } else if (error.response?.status >= 500) {
      console.error('Server error');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { BASE_URL };