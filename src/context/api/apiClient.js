import axios from 'axios';

// Base URL for the Hi-Anime API
// In development, we use the proxy setup in vite.config.js
// In production, you would use the full URL
const BASE_URL = import.meta.env.DEV ? '' : 'https://hi-anime-proxy-1.onrender.com';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding common headers or handling auth
apiClient.interceptors.request.use(
  (config) => {
    // You can add authorization headers here if needed
    // config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors here
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