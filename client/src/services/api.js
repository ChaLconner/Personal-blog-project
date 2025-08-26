import axios from 'axios';

// Base API URL - เปลี่ยนเป็น backend server ของคุณ
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Simple cache for storing API responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const ENABLE_CACHE_LOGGING = false; // Set to true for debugging

// Token management
let authToken = localStorage.getItem('authToken') || localStorage.getItem('token');

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout (increased from 10s)
});

// Request interceptor - เพิ่ม authentication token
api.interceptors.request.use(
  (config) => {
    // Only log in development
    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    // Add authentication token if available (always read latest from storage)
    const latestToken = localStorage.getItem('authToken') || localStorage.getItem('token') || authToken;
    if (latestToken) {
      config.headers.Authorization = `Bearer ${latestToken}`;
      authToken = latestToken;
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
  localStorage.setItem('token', token);
  },
  
  removeToken: () => {
    authToken = null;
    localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  },
  
  getToken: () => {
  return localStorage.getItem('authToken') || localStorage.getItem('token') || authToken;
  },
  
  isAuthenticated: () => {
    return !!authToken;
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/auth/update-profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  resetPassword: async (passwordData) => {
    try {
      const response = await api.put('/auth/reset-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
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
  // Auth helper functions
  auth,

  // Authentication functions
  register: async (userData) => {
    try {
      const { name, username, email, password } = userData;
      
      if (!name || !username || !email || !password) {
        throw new Error('All fields are required');
      }

      const response = await api.post('/auth/register', {
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password
      });
      
      return response.data;
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  },

  login: async (credentials) => {
    try {
      const { email, password } = credentials;
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const response = await api.post('/auth/login', {
        email: email.trim(),
        password
      });
      
      // Store the token
      if (response.data.access_token) {
        auth.setToken(response.data.access_token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      auth.removeToken();
      clearCache(); // Clear cache on logout
      return { message: 'Logged out successfully' };
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/get-user');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      // Remove invalid token
      auth.removeToken();
      throw error;
    }
  },

  // Get all blog posts with optional filters (with caching)
  getPosts: async (params = {}) => {
    try {
      // Clean up empty params
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== '')
      );
      
      // Add debug logging
      console.log('🔍 BlogAPI getPosts called with params:', cleanParams);
      
      // Check cache first
      const cacheKey = getCacheKey('/blog/posts', cleanParams);
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log('📦 Using cached data for:', cacheKey);
        return cachedData;
      }
      
      console.log('🌐 Making API request to /api/blog/posts with params:', cleanParams);
      const response = await api.get('/blog/posts', { params: cleanParams });
      
      // Validate response structure
      if (!response.data) {
        console.warn('⚠️ No response data received');
        throw new Error('No data received from server');
      }
      
      if (!response.data.success) {
        console.warn('⚠️ Server returned unsuccessful response:', response.data);
        // Still try to use the data if posts exist
        if (!response.data.posts) {
          throw new Error(response.data.error || 'Server returned unsuccessful response');
        }
      }
      
      console.log('✅ API response received:', {
        success: response.data.success,
        postsCount: response.data.posts?.length || 0,
        meta: response.data.meta
      });
      
      // Cache the response only if it's successful
      if (response.data.success) {
        setCachedData(cacheKey, response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching posts:', error.message);
      console.error('Error details:', error.response?.data || error);
      
      // Return fallback data structure instead of throwing
      return {
        success: false,
        posts: [],
        meta: { category: 'all', limit: 0, offset: 0, count: 0 },
        error: error.message
      };
    }
  },

  // Get single blog post by ID
  getPost: async (id) => {
    try {
      if (!id) throw new Error('Post ID is required');
      const response = await api.get(`/blog/posts/${id}`);
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
      // Validate required fields - support both old and new field names
      const commentText = commentData.comment_text || commentData.comment;
      if (!commentData.post_id || !commentText) {
        throw new Error('Missing required fields: post_id, comment');
      }

      // Validate data types
      if (typeof commentText !== 'string' || commentText.trim().length === 0) {
        throw new Error('Comment must be a non-empty string');
      }

      // Prepare data for backend - use comment_text field for new schema
      const dataToSend = {
        post_id: commentData.post_id,
        comment_text: commentText.trim(),
        user_id: commentData.user_id || null, // For authenticated users
        name: commentData.name ? commentData.name.trim() : null, // For anonymous comments
        image: commentData.image
      };

      const response = await api.post('/comments', dataToSend);
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
      
      const response = await api.get('/blog/posts', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      console.log('🏥 Performing health check...');
      const response = await api.get('/health', { timeout: 5000 });
      console.log('✅ Health check passed:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Clear cache
  // Clear cache function
  clearCache: () => {
    clearCache();
  },

  // File upload functions
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  uploadImages: async (files) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await api.post('/upload/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  },

  uploadProfileImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('imageFile', file);

      const response = await api.post('/upload/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  },

  deleteImage: async (filename) => {
    try {
      const response = await api.delete(`/upload/image/${filename}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  // Notification functions
  getNotifications: async (userId) => {
    try {
      const response = await api.get(`/api/notifications/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/api/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  markAllNotificationsAsRead: async (userId) => {
    try {
      const response = await api.put(`/api/notifications/user/${userId}/read-all`);
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  createNotification: async (notificationData) => {
    try {
      const response = await api.post('/api/notifications', notificationData);
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Admin functions
  admin: {
    // Posts management
    getAllPosts: async () => {
      try {
        const response = await api.get('/admin/posts');
        return response.data;
      } catch (error) {
        console.error('Error fetching admin posts:', error);
        throw error;
      }
    },

    createPost: async (postData) => {
      try {
        const response = await api.post('/admin/posts', postData);
        clearCache(); // Clear cache after creating post
        return response.data;
      } catch (error) {
        console.error('Error creating post:', error);
        throw error;
      }
    },

    getPost: async (id) => {
      try {
        const response = await api.get(`/admin/posts/${id}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching post:', error);
        throw error;
      }
    },

    updatePost: async (id, postData) => {
      try {
        const response = await api.put(`/admin/posts/${id}`, postData);
        clearCache(); // Clear cache after updating post
        return response.data;
      } catch (error) {
        console.error('Error updating post:', error);
        throw error;
      }
    },

    deletePost: async (id) => {
      try {
        const response = await api.delete(`/admin/posts/${id}`);
        clearCache(); // Clear cache after deleting post
        return response.data;
      } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
      }
    },

    // Comments management
    getAllComments: async () => {
      try {
        const response = await api.get('/admin/comments');
        return response.data;
      } catch (error) {
        console.error('Error fetching admin comments:', error);
        throw error;
      }
    },

    deleteComment: async (id) => {
      try {
        const response = await api.delete(`/admin/comments/${id}`);
        return response.data;
      } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
      }
    },

    // Dashboard stats
    getStats: async () => {
      try {
        const response = await api.get('/admin/stats');
        return response.data;
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        throw error;
      }
    },

    // Category management
    getCategories: async () => {
      try {
        const response = await api.get('/admin/categories');
        return response.data;
      } catch (error) {
        console.error('Error fetching admin categories:', error);
        throw error;
      }
    },

    createCategory: async (categoryData) => {
      try {
        const response = await api.post('/admin/categories', categoryData);
        clearCache(); // Clear cache after creating category
        return response.data;
      } catch (error) {
        console.error('Error creating category:', error);
        throw error;
      }
    },

    updateCategory: async (id, categoryData) => {
      try {
        const response = await api.put(`/admin/categories/${id}`, categoryData);
        clearCache(); // Clear cache after updating category
        return response.data;
      } catch (error) {
        console.error('Error updating category:', error);
        throw error;
      }
    },

    deleteCategory: async (id) => {
      try {
        const response = await api.delete(`/admin/categories/${id}`);
        clearCache(); // Clear cache after deleting category
        return response.data;
      } catch (error) {
        console.error('Error deleting category:', error);
        throw error;
      }
    }
  }
};

export { auth };
export default blogApi;
