import axios from 'axios';

// Base API URL - เปลี่ยนเป็น backend server ของคุณ
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Simple cache for storing API responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const ENABLE_CACHE_LOGGING = false; // Set to true for debugging

// Token management
let authToken = localStorage.getItem('authToken');

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor - เพิ่ม authentication token
api.interceptors.request.use(
  (config) => {
    // Only log in development
    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    // Add authentication token if available
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Ignore extension-related errors
    if (error.message?.includes('message channel closed') || 
        error.message?.includes('Extension context invalidated')) {
      console.warn('Browser extension interference detected, ignoring error');
      return Promise.reject(new Error('Network request failed'));
    }
    
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      switch (status) {
        case 404:
          throw new Error(data.message || 'Resource not found');
        case 400:
          throw new Error(data.message || 'Bad request');
        case 500:
          throw new Error(data.message || 'Server error');
        default:
          throw new Error(data.message || `HTTP ${status} error`);
      }
    } else if (error.request) {
      // Network error
      throw new Error('Network error: Unable to connect to server');
    } else {
      // Other error
      throw new Error(error.message || 'Unknown error occurred');
    }
  }
);

// Authentication functions
const auth = {
  setToken: (token) => {
    authToken = token;
    localStorage.setItem('authToken', token);
  },
  
  removeToken: () => {
    authToken = null;
    localStorage.removeItem('authToken');
  },
  
  getToken: () => {
    return authToken || localStorage.getItem('authToken');
  },
  
  isAuthenticated: () => {
    return !!authToken;
  }
};

// Cache helper functions
const getCacheKey = (url, params = {}) => {
  const paramStr = Object.keys(params).length > 0 ? JSON.stringify(params) : '';
  return `${url}_${paramStr}`;
};

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (
    cached &&
    typeof cached.timestamp === 'number' &&
    Date.now() - cached.timestamp < CACHE_DURATION
  ) {
    // Only log if debugging is enabled
    if (ENABLE_CACHE_LOGGING) {
      console.debug(`Cache hit for: ${key}`);
    }
    return cached.data;
  }
  if (cached) {
    cache.delete(key); // Remove expired cache
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  if (ENABLE_CACHE_LOGGING) {
    console.debug(`Cached data for: ${key}`);
  }
};

const clearCache = () => {
  cache.clear();
  if (ENABLE_CACHE_LOGGING) {
    console.debug('Cache cleared');
  }
};

// API service functions
export const blogApi = {
  // Get all blog posts with optional filters (with caching)
  getPosts: async (params = {}) => {
    try {
      // Clean up empty params
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== '')
      );
      
      // Check cache first
      const cacheKey = getCacheKey('/posts', cleanParams);
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      const response = await api.get('/posts', { params: cleanParams });
      
      // Cache the response
      setCachedData(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  // Get single blog post by ID
  getPost: async (id) => {
    try {
      if (!id) throw new Error('Post ID is required');
      const response = await api.get(`/posts/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  // Get all comments with optional post filter
  getComments: async (params = {}) => {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== '')
      );
      
      const response = await api.get('/comments', { params: cleanParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  // Create new comment
  createComment: async (commentData) => {
    try {
      // Validate required fields
      if (!commentData.post_id || !commentData.name || !commentData.comment) {
        throw new Error('Missing required fields: post_id, name, comment');
      }

      // Validate data types
      if (typeof commentData.name !== 'string' || commentData.name.trim().length === 0) {
        throw new Error('Name must be a non-empty string');
      }

      if (typeof commentData.comment !== 'string' || commentData.comment.trim().length === 0) {
        throw new Error('Comment must be a non-empty string');
      }

      const response = await api.post('/comments', {
        ...commentData,
        name: commentData.name.trim(),
        comment: commentData.comment.trim()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },

  // Get all categories (with caching)
  getCategories: async () => {
    try {
      // Check cache first
      const cacheKey = getCacheKey('/categories');
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      const response = await api.get('/categories');
      
      // Cache the response
      setCachedData(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get blog statistics
  getStats: async () => {
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },

  // Search posts
  searchPosts: async (searchTerm, category = null, limit = null) => {
    try {
      const params = {};
      
      if (searchTerm && searchTerm.trim().length > 0) {
        params.search = searchTerm.trim();
      }
      
      if (category && category !== 'all' && category !== null) {
        params.category = category;
      }
      
      if (limit && limit > 0) {
        params.limit = limit;
      }
      
      const response = await api.get('/posts', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error checking server health:', error);
      throw error;
    }
  },

  // Clear cache
  clearCache: () => {
    clearCache();
  },
};

export { auth };
export default blogApi;
