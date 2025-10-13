/**
 * Shirayuki API Context - Index
 * 
 * Centralized exports for all API-related functionality
 */

// API Configuration and Endpoints
export { 
  API_CONFIG, 
  API_ENDPOINTS, 
  buildEndpoint, 
  buildFullURL, 
  USAGE_EXAMPLES 
} from './apiEndpoints.js';

// API Service
export { default as apiService, ShirayukiAPIService } from './apiService.js';

// React Context
export { 
  default as ShirayukiAPIContext,
  ShirayukiAPIProvider, 
  useShirayukiAPI 
} from './ShirayukiAPIContext.jsx';

// Default export for convenience
export { default } from './ShirayukiAPIContext.jsx';