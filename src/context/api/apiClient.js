import axios from 'axios';

// Base URL for the Hi-Anime API
// In development, we use the proxy setup in vite.config.js
// In production, we use the full URL
const BASE_URL = import.meta.env.DEV ? '' : 'https://hi-anime-api-one.vercel.app';

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