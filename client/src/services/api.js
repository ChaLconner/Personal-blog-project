import axios from "axios";
import { createClient } from "@supabase/supabase-js";

// Resolve API base URL: prefer VITE_API_URL, then localhost in dev, else Render in prod
const API_BASE_URL =
  (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) ||
  (import.meta.env.DEV
    ? "http://localhost:3001"
    : "https://personal-blog-project-server.onrender.com");

// Simple cache for storing API responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const ENABLE_CACHE_LOGGING = false; // Set to true for debugging

// Token management
let authToken =
  localStorage.getItem("authToken") || localStorage.getItem("token");

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second default timeout
});

// Supabase client for realtime notifications (client-side)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || null;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || null;
const supabaseClient =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// Map of active notification channels by userId
const notificationChannels = new Map();

const subscribeNotifications = async (userId, onInsert) => {
  if (!supabaseClient) {
    console.warn(
      "Supabase client not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
    );
    return null;
  }
  if (!userId) return null;
  if (notificationChannels.has(userId)) return notificationChannels.get(userId);

  // Use Postgres change feed to listen for INSERTs on notifications for this user
  try {
    const channel = supabaseClient
      .channel(`notifications_user_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          try {
            // payload.new contains the inserted row
            if (onInsert && typeof onInsert === "function") {
              onInsert(payload.new);
            }
          } catch (err) {
            console.error("Error in notifications insert handler:", err);
          }
        }
      )
      .subscribe();

    notificationChannels.set(userId, channel);
    return channel;
  } catch (err) {
    console.error("Failed to subscribe to notifications:", err);
    return null;
  }
};

const unsubscribeNotifications = async (userId) => {
  try {
    const channel = notificationChannels.get(userId);
    if (!channel || !supabaseClient) return;
    // Unsubscribe and remove
    await channel.unsubscribe();
    notificationChannels.delete(userId);
  } catch (err) {
    console.error("Failed to unsubscribe notifications:", err);
  }
};

// Request interceptor - เพิ่ม authentication token
api.interceptors.request.use(
  (config) => {
    // Add authentication token if available (always read latest from storage)
    const latestToken =
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      authToken;
    if (latestToken) {
      config.headers.Authorization = `Bearer ${latestToken}`;
      authToken = latestToken;
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
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
    if (
      error.message?.includes("message channel closed") ||
      error.message?.includes("Extension context invalidated")
    ) {
      return Promise.reject(new Error("Network request failed"));
    }
    // Detect axios timeout/errors that have no response so retry logic can handle them
    const isTimeout =
      error?.code === "ECONNABORTED" ||
      /timeout of \d+ms exceeded/.test(error?.message || "");
    const isNetworkLevel = !error?.response;

    // Don't spam console for expected network/timeouts that will be retried
    if (!(isTimeout || isNetworkLevel)) {
      console.error("API Error:", error.response?.data || error.message);
    }

    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      switch (status) {
        case 404:
          throw new Error(data.message || "Resource not found");
        case 400:
          throw new Error(data.message || "Bad request");
        case 500:
          throw new Error(data.message || "Server error");
        default:
          throw new Error(data.message || `HTTP ${status} error`);
      }
    } else if (error.request) {
      // Network error (no response). If this is a timeout we'll let callers/retry-helpers handle it
      if (isTimeout) {
        return Promise.reject(error);
      }
      throw new Error("Network error: Unable to connect to server");
    } else {
      // Other error
      throw new Error(error.message || "Unknown error occurred");
    }
  }
);

// Small helper to retry transient network errors with exponential backoff
const requestWithRetries = async (
  fn,
  { attempts = 3, initialDelay = 500 } = {}
) => {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fn();
      return res;
    } catch (err) {
      lastError = err;
      // If last attempt, rethrow after logging
      if (i === attempts - 1) break;

      // Determine if error is retryable: network-level (no response) or axios timeout
      const isNetworkError = !err || !err.response;
      const isTimeout =
        err?.code === "ECONNABORTED" ||
        /timeout of \d+ms exceeded/.test(err?.message || "");
      if (!(isNetworkError || isTimeout)) {
        // Non-retryable (server responded with error) — rethrow
        throw err;
      }

      // Exponential backoff before retry
      const delay = initialDelay * Math.pow(2, i);
      if (import.meta.env && import.meta.env.DEV) {
        // Only verbose in development
        console.warn(
          `Request failed (attempt ${
            i + 1
          }/${attempts}), retrying in ${delay}ms:`,
          err?.message || err
        );
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  // Final failure — log and throw
  console.error(
    "Request failed after retries:",
    lastError?.message || lastError
  );
  throw lastError;
};

// Authentication functions
const auth = {
  setToken: (token) => {
    authToken = token;
    localStorage.setItem("authToken", token);
    localStorage.setItem("token", token);
  },

  removeToken: () => {
    authToken = null;
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
  },

  getToken: () => {
    return (
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      authToken
    );
  },

  isAuthenticated: () => {
    return !!authToken;
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put("/auth/update-profile", profileData);
      return response.data;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  resetPassword: async (passwordData) => {
    try {
      const response = await api.put("/auth/reset-password", passwordData);
      return response.data;
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error;
    }
  },
};

// Cache helper functions
const getCacheKey = (url, params = {}) => {
  const paramStr = Object.keys(params).length > 0 ? JSON.stringify(params) : "";
  return `${url}_${paramStr}`;
};

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (
    cached &&
    typeof cached.timestamp === "number" &&
    Date.now() - cached.timestamp < CACHE_DURATION
  ) {
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
    timestamp: Date.now(),
  });
};

const clearCache = () => {
  cache.clear();
};

// Per-user persisted metadata for incremental notification fetches
const NOTIF_META_PREFIX = "notif_meta_";

const loadNotifMeta = (userId) => {
  try {
    const raw = localStorage.getItem(`${NOTIF_META_PREFIX}${userId}`);
    if (!raw) return { etag: null, lastChecked: null };
    const parsed = JSON.parse(raw);
    return {
      etag: parsed?.etag || null,
      lastChecked: parsed?.lastChecked || null,
    };
  } catch (err) {
    console.error("Failed to load notification meta for", userId, err);
    return { etag: null, lastChecked: null };
  }
};

const saveNotifMeta = (userId, { etag, lastChecked }) => {
  try {
    const payload = { etag: etag || null, lastChecked: lastChecked || null };
    localStorage.setItem(
      `${NOTIF_META_PREFIX}${userId}`,
      JSON.stringify(payload)
    );
  } catch (err) {
    console.error("Failed to save notification meta for", userId, err);
  }
};

// Centralized error handler for API helpers
const handleApiError = (error, action) => {
  console.error(`❌ Error ${action}:`, error);
  return { success: false, data: [], error: error?.message || "Unknown error" };
};

// Fetch notifications using ETag / If-Modified-Since and incremental params
const fetchNotificationsIncremental = async (userId) => {
  try {
    if (!userId)
      return { success: false, data: [], error: "User ID is required" };

    const { etag: lastETagLocal, lastChecked: lastCheckedLocal } =
      loadNotifMeta(userId);

    const headers = {};
    if (lastETagLocal) headers["If-None-Match"] = lastETagLocal;
    if (lastCheckedLocal)
      headers["If-Modified-Since"] = new Date(lastCheckedLocal).toUTCString();

    const response = await requestWithRetries(
      () =>
        api.get(`/notifications/${userId}`, {
          timeout: 30000,
          headers,
          params: lastCheckedLocal ? { since: lastCheckedLocal } : {},
        }),
      { attempts: 3, initialDelay: 400 }
    );

    // 304 Not Modified means no new notifications
    if (response.status === 304) {
      const now = new Date().toISOString();
      saveNotifMeta(userId, { etag: lastETagLocal, lastChecked: now });
      // Always return data as an array to keep client components safe
      return { success: true, data: [], message: "No notifications" };
    }

    // Update ETag and lastChecked from response
    const newEtag =
      response.headers && response.headers["etag"]
        ? response.headers["etag"]
        : lastETagLocal;
    const now = new Date().toISOString();
    saveNotifMeta(userId, { etag: newEtag, lastChecked: now });

    // Normalize response.data to an array for backwards compatibility
    const payload = response.data;
    if (payload == null) {
      return { success: true, data: [] };
    }

    // If server returned an object with { success, data, ... } unwrap it
    if (
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      Object.prototype.hasOwnProperty.call(payload, "data")
    ) {
      const inner = payload.data;
      return {
        success: !!payload.success,
        data: Array.isArray(inner) ? inner : inner ? [inner] : [],
      };
    }

    // If it's already an array, return as-is; otherwise wrap single item
    return {
      success: true,
      data: Array.isArray(payload) ? payload : [payload],
    };
  } catch (error) {
    return handleApiError(error, "fetching notifications");
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
        throw new Error("All fields are required");
      }

      const response = await api.post("/auth/register", {
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });

      return response.data;
    } catch (error) {
      console.error("Error during registration:", error);
      throw error;
    }
  },

  login: async (credentials) => {
    try {
      const { email, password } = credentials;

      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      // Store the token
      if (response.data.access_token) {
        auth.setToken(response.data.access_token);
      }

      return response.data;
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      auth.removeToken();
      clearCache(); // Clear cache on logout
      return { message: "Logged out successfully" };
    } catch (error) {
      console.error("Error during logout:", error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get("/auth/get-user");
      return response.data;
    } catch (error) {
      console.error("Error fetching current user:", error);
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
        Object.entries(params).filter(
          ([, value]) => value !== null && value !== undefined && value !== ""
        )
      );

      // Add debug logging

      // Provide a safe default limit to avoid fetching extremely large result sets
      if (!Object.prototype.hasOwnProperty.call(cleanParams, "limit")) {
        cleanParams.limit = 12; // default page size for lists
      }

      // Check cache first
      const cacheKey = getCacheKey("/blog/posts", cleanParams);
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Use requestWithRetries for transient network/timeouts and a slightly reduced per-request timeout
      const response = await requestWithRetries(
        () => api.get("/blog/posts", { params: cleanParams, timeout: 15000 }),
        { attempts: 3, initialDelay: 400 }
      );

      // Validate response structure
      if (!response.data) {
        throw new Error("No data received from server");
      }

      if (!response.data.success) {
        // Still try to use the data if posts exist
        if (!response.data.posts) {
          throw new Error(
            response.data.error || "Server returned unsuccessful response"
          );
        }
      }

      // Cache the response only if it's successful
      if (response.data.success) {
        setCachedData(cacheKey, response.data);
      }

      return response.data;
    } catch (error) {
      console.error("❌ Error fetching posts:", error.message);

      // Return fallback data structure instead of throwing
      return {
        success: false,
        posts: [],
        meta: { category: "all", limit: 0, offset: 0, count: 0 },
        error: error.message,
      };
    }
  },

  // Get single blog post by ID
  getPost: async (id) => {
    try {
      if (!id) throw new Error("Post ID is required");
      const response = await api.get(`/blog/posts/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching post:", error);
      throw error;
    }
  },

  // Toggle like/unlike for a post
  toggleLike: async (postId, action) => {
    try {
      if (!postId) throw new Error("Post ID is required");
      if (!["like", "unlike"].includes(action))
        throw new Error("Invalid like action");
      const response = await api.put(`/likes/${postId}/toggle`, { action });
      return response.data;
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  },

  // Check whether current user has liked a post
  hasLiked: async (postId) => {
    try {
      if (!postId) throw new Error("Post ID is required");
      const response = await api.get(`/likes/${postId}/has-liked`);
      return response.data;
    } catch (error) {
      console.error("Error checking hasLiked:", error);
      return { success: false, hasLiked: false, error: error?.message };
    }
  },

  // Get all comments with optional post filter
  getComments: async (params = {}) => {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(
          ([, value]) => value !== null && value !== undefined && value !== ""
        )
      );

      const response = await api.get("/comments", { params: cleanParams });
      return response.data;
    } catch (error) {
      console.error("Error fetching comments:", error);
      throw error;
    }
  },

  // Like/Unlike a post
  likePost: async (postId) => {
    try {
      const response = await api.post(`/blog/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  // Check if user has liked a post
  checkPostLike: async (postId) => {
    try {
      const response = await api.get(`/blog/posts/${postId}/like-status`);
      return response.data;
    } catch (error) {
      console.error('Error checking like status:', error);
      throw error;
    }
  },

  // Add comment to a post
  addComment: async (commentData) => {
    try {
      if (!commentData.postId || !commentData.content) {
        throw new Error('Missing required fields: postId, content');
      }

      const response = await api.post(`/blog/posts/${commentData.postId}/comment`, {
        content: commentData.content
      });
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Create new comment
  createComment: async (commentData) => {
    try {
      // Validate required fields - support both old and new field names
      const commentText = commentData.comment_text || commentData.comment;
      if (!commentData.post_id || !commentText) {
        throw new Error("Missing required fields: post_id, comment");
      }

      // Validate data types
      if (typeof commentText !== "string" || commentText.trim().length === 0) {
        throw new Error("Comment must be a non-empty string");
      }

      // Prepare data for backend - use comment_text field for new schema
      const dataToSend = {
        post_id: commentData.post_id,
        comment_text: commentText.trim(),
        user_id: commentData.user_id || null, // For authenticated users
        name: commentData.name ? commentData.name.trim() : null, // For anonymous comments
        image: commentData.image,
      };

      const response = await api.post("/comments", dataToSend);
      return response.data;
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  },

  // Get all categories (with caching)
  getCategories: async () => {
    try {
      // Check cache first
      const cacheKey = getCacheKey("/categories");
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await api.get("/categories");

      // Cache the response
      setCachedData(cacheKey, response.data);

      return response.data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  },

  // Get blog statistics
  getStats: async () => {
    try {
      const response = await api.get("/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching stats:", error);
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

      if (category && category !== "all" && category !== null) {
        params.category = category;
      }

      if (limit && limit > 0) {
        params.limit = limit;
      }

      const response = await api.get("/blog/posts", { params });
      return response.data;
    } catch (error) {
      console.error("Error searching posts:", error);
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get("/health", { timeout: 5000 });

      return { success: true, data: response.data };
    } catch (error) {
      console.error("❌ Health check failed:", error.message);
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
      formData.append("image", file);

      const response = await api.post("/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },

  uploadImages: async (files) => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });

      const response = await api.post("/upload/images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error uploading images:", error);
      throw error;
    }
  },

  uploadProfileImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append("imageFile", file);

      const response = await api.post("/upload/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error uploading profile image:", error);
      throw error;
    }
  },

  deleteImage: async (filename) => {
    try {
      const response = await api.delete(`/upload/image/${filename}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  },

  // Notification functions (incremental fetch + centralized error handling)
  getNotifications: async (userId) => {
    return fetchNotificationsIncremental(userId);
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error, "marking notification as read");
    }
  },

  markAllNotificationsAsRead: async (userId) => {
    try {
      const response = await api.put(`/notifications/user/${userId}/read-all`);
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error, "marking all notifications as read");
    }
  },

  createNotification: async (notificationData) => {
    try {
      const response = await api.post("/notifications", notificationData);
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error, "creating notification");
    }
  },

  // Admin functions
  admin: {
    // Posts management
    getAllPosts: async (params = {}) => {
      try {
        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(
            ([, value]) => value !== null && value !== undefined && value !== ""
          )
        );
        if (!Object.prototype.hasOwnProperty.call(cleanParams, "limit")) {
          cleanParams.limit = 100; // admin default
        }

        const response = await requestWithRetries(
          () =>
            api.get("/admin/posts", { params: cleanParams, timeout: 30000 }),
          { attempts: 3, initialDelay: 500 }
        );
        return response.data;
      } catch (error) {
        console.error("Error fetching admin posts:", error);
        throw error;
      }
    },

    createPost: async (postData) => {
      try {
        const response = await api.post("/admin/posts", postData);
        clearCache(); // Clear cache after creating post
        return response.data;
      } catch (error) {
        console.error("Error creating post:", error);
        throw error;
      }
    },

    getPost: async (id) => {
      try {
        const response = await api.get(`/admin/posts/${id}`);
        return response.data;
      } catch (error) {
        console.error("Error fetching post:", error);
        throw error;
      }
    },

    updatePost: async (id, postData) => {
      try {
        const response = await api.put(`/admin/posts/${id}`, postData);
        clearCache(); // Clear cache after updating post
        return response.data;
      } catch (error) {
        console.error("Error updating post:", error);
        throw error;
      }
    },

    deletePost: async (id) => {
      try {
        const response = await api.delete(`/admin/posts/${id}`);
        clearCache(); // Clear cache after deleting post
        return response.data;
      } catch (error) {
        console.error("Error deleting post:", error);
        throw error;
      }
    },

    // Comments management
    getAllComments: async (params = {}) => {
      try {
        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(
            ([, value]) => value !== null && value !== undefined && value !== ""
          )
        );
        if (!Object.prototype.hasOwnProperty.call(cleanParams, "limit")) {
          cleanParams.limit = 200; // admin default
        }

        const response = await requestWithRetries(
          () =>
            api.get("/admin/comments", { params: cleanParams, timeout: 30000 }),
          { attempts: 3, initialDelay: 500 }
        );
        return response.data;
      } catch (error) {
        console.error("Error fetching admin comments:", error);
        throw error;
      }
    },

    deleteComment: async (id) => {
      try {
        const response = await api.delete(`/admin/comments/${id}`);
        return response.data;
      } catch (error) {
        console.error("Error deleting comment:", error);
        throw error;
      }
    },

    // Dashboard stats
    getStats: async () => {
      try {
        const response = await api.get("/admin/stats");
        return response.data;
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        throw error;
      }
    },

    // Category management
    getCategories: async () => {
      try {
        const response = await api.get("/admin/categories");
        return response.data;
      } catch (error) {
        console.error("Error fetching admin categories:", error);
        throw error;
      }
    },

    createCategory: async (categoryData) => {
      try {
        const response = await api.post("/admin/categories", categoryData);
        clearCache(); // Clear cache after creating category
        return response.data;
      } catch (error) {
        console.error("Error creating category:", error);
        throw error;
      }
    },

    updateCategory: async (id, categoryData) => {
      try {
        const response = await api.put(`/admin/categories/${id}`, categoryData);
        clearCache(); // Clear cache after updating category
        return response.data;
      } catch (error) {
        console.error("Error updating category:", error);
        throw error;
      }
    },

    deleteCategory: async (id) => {
      try {
        const response = await api.delete(`/admin/categories/${id}`);
        clearCache(); // Clear cache after deleting category
        return response.data;
      } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
      }
    },
  },

  // Notifications management
  notifications: {
    getAll: async (userId) => {
      return blogApi.getNotifications(userId);
    },

    markAsRead: async (notificationId) => {
      return blogApi.markNotificationAsRead(notificationId);
    },

    markAllAsRead: async (userId) => {
      return blogApi.markAllNotificationsAsRead(userId);
    },

    create: async (notificationData) => {
      return blogApi.createNotification(notificationData);
    },

    delete: async (notificationId) => {
      try {
        const response = await api.delete(`/notifications/${notificationId}`);
        return { success: true, data: response.data };
      } catch (error) {
        return handleApiError(error, "deleting notification");
      }
    },

    // Realtime subscription helpers (Supabase)
    subscribe: async (userId, onInsert) => {
      return subscribeNotifications(userId, onInsert);
    },

    unsubscribe: async (userId) => {
      return unsubscribeNotifications(userId);
    },

    // Create test notification (development only)
    createTest: async (userId, testData = {}) => {
      if (import.meta.env.PROD) {
        return { success: false, error: "Not available in production" };
      }

      try {
        const defaultTestData = {
          type: "system",
          title: "Test Notification",
          message:
            "This is a test notification created at " +
            new Date().toLocaleTimeString(),
        };

        const response = await api.post(`/notifications/test/${userId}`, {
          ...defaultTestData,
          ...testData,
        });
        return response.data;
      } catch (error) {
        console.error("Error creating test notification:", error);
        return { success: false, error: error.message };
      }
    },

    // Admin functions
    admin: {
      getAll: async (params = {}) => {
        try {
          const response = await api.get("/notifications/admin/all", {
            params,
          });
          return response.data;
        } catch (error) {
          console.error("Error fetching admin notifications:", error);
          return { success: false, data: [], error: error.message };
        }
      },

      getStats: async () => {
        try {
          const response = await api.get("/notifications/admin/stats");
          return response.data;
        } catch (error) {
          console.error("Error fetching notification stats:", error);
          return { success: false, error: error.message };
        }
      },

      bulkDelete: async (deleteParams) => {
        try {
          const response = await api.delete("/notifications/admin/bulk", {
            data: deleteParams,
          });
          return response.data;
        } catch (error) {
          console.error("Error bulk deleting notifications:", error);
          return { success: false, error: error.message };
        }
      },
    },
  },
};

export { auth };
export default blogApi;
