import axios from 'axios';

// Base API URL - change this to your server URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service functions
export const blogApi = {
  // Get all blog posts with optional filters
  getPosts: async (params = {}) => {
    try {
      const response = await api.get('/posts', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  // Get single blog post by ID
  getPost: async (id) => {
    try {
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
      const response = await api.get('/comments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  // Create new comment
  createComment: async (commentData) => {
    try {
      const response = await api.post('/comments', commentData);
      return response.data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },

  // Get all categories
  getCategories: async () => {
    try {
      const response = await api.get('/categories');
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
  searchPosts: async (searchTerm, category = null) => {
    try {
      const params = { search: searchTerm };
      if (category && category !== 'all') {
        params.category = category;
      }
      const response = await api.get('/posts', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  },
};

export default blogApi;
