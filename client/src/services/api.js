import axios from "axios";
import {
  createPersistentCache,
  createRequestCoordinator,
  waitForServiceReady,
} from "./requestResilience.js";

// Resolve API base URL: prefer VITE_API_URL, then localhost:5000 in dev, else relative / origin
export const API_BASE_URL =
  (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) ||
  (import.meta.env.DEV
    ? "http://localhost:5000"
    : window.location.origin);

// Simple cache for storing API responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const PERSISTENT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const SERVICE_READY_DURATION = 10 * 60 * 1000; // Recheck before Render's idle window
const SERVICE_WAKE_TIMEOUT = 90 * 1000;
const SERVICE_CHECK_TIMEOUT = 12 * 1000;
const PUBLIC_REQUEST_TIMEOUT = 15 * 1000;
const ENABLE_CACHE_LOGGING = false; // Set to true for debugging
const publicRequests = createRequestCoordinator();
const persistentCache = createPersistentCache({
  storage: window.localStorage,
  prefix: "blog_public_cache:",
  maxAgeMs: PERSISTENT_CACHE_DURATION,
});
let serviceReadyUntil = 0;

// Token management
let authToken =
  localStorage.getItem("authToken") || localStorage.getItem("token");

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second default timeout
});

// Supabase client is now imported from the shared supabaseClient module

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
    if (axios.isCancel(error) || error?.code === "ERR_CANCELED") {
      return Promise.reject(error);
    }

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
    const isExpectedReadinessRetry =
      error?.config?.url === "/ready" && error?.response?.status === 503;

    // Don't spam console for expected network/timeouts that will be retried
    if (!(isTimeout || isNetworkLevel || isExpectedReadinessRetry)) {
      console.error("API Error:", error.response?.data || error.message);
    }

    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const errorMessage = data?.error || data?.message || data?.details;
      switch (status) {
        case 404:
          throw new Error(errorMessage || "Resource not found");
        case 400: {
          // Provide more detailed error message for 400 errors
          console.error('400 Error Details:', { status, data, url: error.config?.url });
          throw new Error(errorMessage || "Bad request");
        }
        case 401:
          // Clear invalid tokens on 401 errors
          auth.removeToken();
          // Dispatch a custom event to notify the auth context
          window.dispatchEvent(new CustomEvent('auth:token-expired'));
          // Only redirect if not on homepage
          if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/post/')) {
            // Let the component handle the redirect, not the interceptor
          }
          throw new Error(errorMessage || "Unauthorized");
        case 500:
          throw new Error(errorMessage || "Server error");
        default:
          throw new Error(errorMessage || `HTTP ${status} error`);
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
      if (axios.isCancel(err) || err?.code === "ERR_CANCELED") {
        throw err;
      }

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
    localStorage.removeItem("token");
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

  checkEmail: async (email) => {
    try {
      const response = await api.post("/auth/check-email", { email });
      return response.data;
    } catch (error) {
      console.error("Error checking email:", error);
      return { success: false, error: error?.message || "Check email failed" };
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.warn("Server logout notification skipped/failed:", error?.message);
    } finally {
      auth.removeToken();
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

const MAX_CACHE_SIZE = 100;

const setCachedData = (key, data) => {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

const clearCache = () => {
  cache.clear();
};

const waitUntilReady = async ({
  signal,
  onStatus,
  force = false,
} = {}) => {
  if (!force && Date.now() < serviceReadyUntil) {
    onStatus?.("ready");
    return { status: "OK", database: "HEALTHY" };
  }

  onStatus?.("waking");
  try {
    const result = await publicRequests.run(
      "service:ready",
      () =>
        waitForServiceReady(
          async ({ timeoutMs }) => {
            const response = await api.get("/ready", { timeout: timeoutMs });
            return response.data;
          },
          {
            timeoutMs: SERVICE_WAKE_TIMEOUT,
            checkTimeoutMs: SERVICE_CHECK_TIMEOUT,
            intervalMs: 1500,
            isReady: (value) =>
              value?.status === "OK" && value?.database === "HEALTHY",
          },
        ),
      { signal },
    );

    serviceReadyUntil = Date.now() + SERVICE_READY_DURATION;
    onStatus?.("ready");
    return result;
  } catch (error) {
    if (
      error?.name === "AbortError" ||
      error?.name === "CanceledError" ||
      error?.code === "ERR_CANCELED"
    ) {
      throw error;
    }

    onStatus?.("failed");
    throw error;
  }
};

const normalizePostParams = (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== null && value !== undefined && value !== ""
    )
  );

  if (!Object.prototype.hasOwnProperty.call(cleanParams, "limit")) {
    cleanParams.limit = 12;
  }

  return cleanParams;
};

const createPostSummaryResponse = (data) => ({
  ...data,
  posts: Array.isArray(data?.posts)
    ? data.posts.map((post) => {
        const summary = { ...post };
        delete summary.content;
        return summary;
      })
    : [],
});

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
          validateStatus: (status) =>
            (status >= 200 && status < 300) || status === 304,
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

  // Check email availability
  checkEmail: async (email) => auth.checkEmail(email),


  // Get all blog posts with optional filters (with caching)
  getPosts: async (params = {}, requestConfig = {}) => {
    try {
      const cleanParams = normalizePostParams(params);

      // Check cache first
      const cacheKey = getCacheKey("/blog/posts", cleanParams);
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      await waitUntilReady({
        signal: requestConfig.signal,
        onStatus: requestConfig.onStatus,
      });

      const response = await publicRequests.run(
        `data:${cacheKey}`,
        () =>
          api.get("/blog/posts", {
            params: cleanParams,
            timeout: requestConfig.timeout ?? PUBLIC_REQUEST_TIMEOUT,
          }),
        { signal: requestConfig.signal },
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
        persistentCache.write(cacheKey, createPostSummaryResponse(response.data));
      }

      return response.data;
    } catch (error) {
      if (axios.isCancel(error) || error?.code === "ERR_CANCELED") {
        throw error;
      }

      serviceReadyUntil = 0;
      console.error("❌ Error fetching posts:", error.message);
      throw error;
    }
  },

  getStalePosts: (params = {}) => {
    const cleanParams = normalizePostParams(params);
    return persistentCache.read(getCacheKey("/blog/posts", cleanParams));
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

  // Delete comment by ID
  deleteComment: async (id) => {
    try {
      if (!id) throw new Error("Comment ID is required");
      const response = await api.delete(`/comments/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  },

  // Get all categories (with caching)
  getCategories: async (requestConfig = {}) => {
    try {
      // Check cache first
      const cacheKey = getCacheKey("/blog/categories");
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      await waitUntilReady({
        signal: requestConfig.signal,
        onStatus: requestConfig.onStatus,
      });

      const response = await publicRequests.run(
        `data:${cacheKey}`,
        () =>
          api.get("/blog/categories", {
            timeout: requestConfig.timeout ?? PUBLIC_REQUEST_TIMEOUT,
          }),
        { signal: requestConfig.signal },
      );

      // Cache the response
      setCachedData(cacheKey, response.data);
      persistentCache.write(cacheKey, response.data);

      return response.data;
    } catch (error) {
      if (axios.isCancel(error) || error?.code === "ERR_CANCELED") {
        throw error;
      }

      serviceReadyUntil = 0;
      console.error("Error fetching categories:", error);
      throw error;
    }
  },

  getStaleCategories: () =>
    persistentCache.read(getCacheKey("/blog/categories")),

  waitUntilReady,

  // Health check
  healthCheck: async (requestConfig = {}) => {
    try {
      const data = await waitUntilReady(requestConfig);
      return { success: true, data };
    } catch (error) {
      console.error("❌ Health check failed:", error.message);
      return { success: false, error: error.message };
    }
  },

  clearCache: () => {
    clearCache();
  },

  // File upload functions
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append("imageFile", file);

      const response = await api.post("/upload/image", formData, {
        headers: {
          "Content-Type": undefined,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },

  uploadProfileImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append("imageFile", file);

      const response = await api.post("/upload/profile", formData, {
        headers: {
          "Content-Type": undefined,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error uploading profile image:", error);
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

  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error, "deleting notification");
    }
  },

  clearReadNotifications: async (userId) => {
    try {
      const response = await api.delete(`/notifications/user/${userId}/clear-read`);
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error, "clearing read notifications");
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

    // Admin notifications
    getNotifications: async (params = {}) => {
      try {
        const response = await api.get('/notifications/admin/all', { params });
        return response.data;
      } catch (error) {
        console.error("Error fetching admin notifications:", error);
        throw error;
      }
    },

    getNotificationStats: async () => {
      try {
        const response = await api.get('/notifications/admin/stats');
        return response.data;
      } catch (error) {
        console.error("Error fetching admin notification stats:", error);
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

    delete: async (notificationId) => {
      return blogApi.deleteNotification(notificationId);
    },

    clearRead: async (userId) => {
      return blogApi.clearReadNotifications(userId);
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


  },
};

export { auth };
export default blogApi;
