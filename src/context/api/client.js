import { API_BASE_URL, BACKEND_BASE_URL, API_CONFIG } from "./config";

class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; 
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';
    const cacheKey = `${method}:${url}`;

    if (method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return { data: cached.data, error: null };
      }
    }

    let authHeaders = {};
    const token = localStorage.getItem('token');
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...API_CONFIG,
      ...options,
      headers: {
        ...API_CONFIG.headers,
        ...options.headers,
        ...authHeaders,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (method === 'GET') {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return { data, error: null };
    } catch (error) {
      console.error("API Error:", error);
      return { data: null, error: error.message };
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  // Clear cache (useful for forced refreshes)
  clearCache() {
    this.cache.clear();
  }

  // Clear specific cache entry
  clearCacheEntry(endpoint, method = 'GET') {
    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = `${method}:${url}`;
    this.cache.delete(cacheKey);
  }
}

export const apiClient = new ApiClient(API_BASE_URL); 
export const backendClient = new ApiClient(BACKEND_BASE_URL);
export default apiClient;