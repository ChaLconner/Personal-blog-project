import { createClient } from "@supabase/supabase-js";
import process from "process";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Missing Supabase configuration:');
  console.error('SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.error('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');
  console.error('SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'NOT SET');
  throw new Error("Supabase URL, Service Key, and Anonymous Key must be set in environment variables");
}

// Log successful connection (hide sensitive data) - only in development
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Supabase configuration loaded successfully');
  console.log('📡 Supabase URL:', supabaseUrl);
  console.log('🔑 Service Key:', supabaseServiceKey ? '***...***' : 'NOT SET');
  console.log('🔓 Anon Key:', supabaseAnonKey ? '***...***' : 'NOT SET');
}

// Service client for admin operations (database queries)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false // Disable auth persistence for server-side usage
  }
});

// Auth client for user authentication operations
export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // Disable auth persistence for server-side usage
  }
});

// Error handling helper
const handleDatabaseError = (error, operation) => {
  console.error(`Database error in ${operation}:`, error);
  
  // Check if it's a network/connection error
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    throw new Error(`Network error during ${operation}. Please check your connection.`);
  }
  
  // Check if it's a Supabase specific error
  if (error.code) {
    switch (error.code) {
      case 'PGRST116':
        throw new Error('Resource not found');
      case 'PGRST301':
        throw new Error('Invalid request format');
      default:
        throw new Error(`Database error: ${error.message}`);
    }
  }
  
  throw error;
};

// Database service functions
let categoriesCache = null;
let categoriesCacheTime = 0;
const CATEGORIES_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const dbService = {
  // Blog Posts
  async getAllPosts(filters = {}) {
    try {      
      // Get categories with caching to improve performance
      let categories = [];
      const now = Date.now();
      if (categoriesCache && (now - categoriesCacheTime) < CATEGORIES_CACHE_DURATION) {
        categories = categoriesCache;
      } else {
        try {
          const { data: categoriesData, error: categoriesError } = await supabase
            .from("categories")
            .select("id, name");
          
          if (!categoriesError) {
            categories = categoriesData || [];
            categoriesCache = categories;
            categoriesCacheTime = now;
          }
        } catch (catError) {
          // Categories fetch failed, continue without categories
        }
      }

      let query = supabase
        .from("posts")
        .select("id, title, description, image, date, content, likes_count, category_id, status_id")
        .order("date", { ascending: false });

      // Apply category filter
      if (filters.category && filters.category !== 'Highlight') {
        // หา category ID จากชื่อ category
        const categoryObj = categories.find(cat => 
          cat.name.toLowerCase() === filters.category.toLowerCase()
        );
        
        if (categoryObj) {
          query = query.eq('category_id', categoryObj.id);
        } else {
          return [];
        }
      }

      // Apply search filter
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      // Apply pagination offset to prevent duplicates
      if (filters.offset && filters.offset > 0) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 6) - 1);
      } else if (filters.limit && filters.limit > 0) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        handleDatabaseError(error, 'getAllPosts');
      }

      // Transform data to match frontend expectations (optimized)
      const transformedData = (data || []).map(post => {
        const category = categories.find(cat => cat.id === post.category_id);
        
        return {
          id: post.id,
          image: (post.image && post.image.trim() !== '') ? post.image : 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=300&fit=crop&auto=format&q=60',
          category: category?.name || 'General',
          title: post.title || 'Untitled',
          description: post.description || 'No description available',
          content: post.content || 'No content available',
          date: post.date || new Date().toISOString(),
          likes_count: post.likes_count || 0,
          status: 'active',
          author: {
            id: 1,
            name: 'Admin User',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face&auto=format&q=60',
            username: 'admin'
          }
        };
      });

      return transformedData;
    } catch (error) {
      console.error('❌ Error in getAllPosts:', error);
      handleDatabaseError(error, 'getAllPosts');
    }
  },

  async getPostById(id) {
    try {
      if (!id || isNaN(id) || id <= 0) {
        throw new Error("Invalid post ID provided");
      }

      const { data, error } = await supabase
        .from("posts")
        .select("id, title, description, image, date, content, likes_count, category_id, status_id")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Post not found");
        }
        throw new Error(`Error fetching post: ${error.message}`);
      }

      // Get categories separately
      let categories = [];
      try {
        const { data: categoriesData } = await supabase.from("categories").select("id, name");
        categories = categoriesData || [];
      } catch (catError) {
        // Categories fetch failed for single post
      }

      // Transform data to match frontend expectations
      const category = categories.find(cat => cat.id === data.category_id);
      
      const transformedData = {
        id: data.id,
        image: data.image || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop&auto=format&q=60',
        category: category?.name || 'General',
        title: data.title || 'Untitled',
        description: data.description || 'No description available',
        content: data.content || 'No content available',
        date: data.date || new Date().toISOString(),
        likes_count: data.likes_count || 0,
        status: 'active',
        author: {
          id: 1,
          name: 'Admin User',
          image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face&auto=format&q=60',
          username: 'admin'
        }
      };

      return transformedData;
    } catch (error) {
      console.error("Database error in getPostById:", error);
      throw error;
    }
  },

  async createPost(postData) {
    try {
      // Validate required fields
      if (!postData || typeof postData !== "object") {
        throw new Error("Invalid post data provided");
      }

      const { data, error } = await supabase
        .from("posts")
        .insert([postData])
        .select()
        .single();

      if (error) {
        throw new Error(`Error creating post: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Database error in createPost:", error);
      throw error;
    }
  },

  async updatePost(id, postData) {
    try {
      // Validate inputs
      if (!id || isNaN(id) || id <= 0) {
        throw new Error("Invalid post ID provided");
      }

      if (!postData || typeof postData !== "object") {
        throw new Error("Invalid post data provided");
      }

      const { data, error } = await supabase
        .from("posts")
        .update(postData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Post not found");
        }
        throw new Error(`Error updating post: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Database error in updatePost:", error);
      throw error;
    }
  },

  async deletePost(id) {
    try {
      // Validate post ID
      if (!id || isNaN(id) || id <= 0) {
        throw new Error("Invalid post ID provided");
      }

      const { error } = await supabase.from("posts").delete().eq("id", id);

      if (error) {
        throw new Error(`Error deleting post: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error("Database error in deletePost:", error);
      throw error;
    }
  },

  // Comments
  async getCommentsByPostId(postId) {
    try {
      if (!postId || isNaN(postId) || postId <= 0) {
        throw new Error("Invalid post ID provided");
      }

      const { data, error } = await supabase
        .from("comments")
        .select("id, post_id, comment_text, created_at, user_id")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(`Error fetching comments: ${error.message}`);
      }

      // Transform data to match frontend expectations
      const transformedData = (data || []).map(comment => ({
        id: comment.id,
        post_id: comment.post_id,
        name: 'Anonymous',
        comment: comment.comment_text,
        image: 'https://via.placeholder.com/48x48?text=U',
        created_at: comment.created_at,
        user: null
      }));

      return transformedData;
    } catch (error) {
      console.error("Database error in getCommentsByPostId:", error);
      throw error;
    }
  },

  async getAllComments() {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("id, post_id, comment_text, created_at, user_id")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Error fetching comments: ${error.message}`);
      }

      // Transform data to match frontend expectations
      const transformedData = (data || []).map(comment => ({
        id: comment.id,
        post_id: comment.post_id,
        name: 'Anonymous',
        comment: comment.comment_text,
        image: 'https://via.placeholder.com/48x48?text=U',
        created_at: comment.created_at,
        user: null
      }));

      return transformedData;
    } catch (error) {
      console.error("Database error in getAllComments:", error);
      throw error;
    }
  },

  async createComment(commentData) {
    try {
      // Validate required fields
      if (!commentData.post_id || !commentData.comment_text) {
        throw new Error("Missing required comment fields: post_id and comment_text");
      }

      const commentToInsert = {
        post_id: commentData.post_id,
        user_id: commentData.user_id || null,
        comment_text: commentData.comment_text || commentData.comment,
        created_at: commentData.created_at || new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("comments")
        .insert([commentToInsert])
        .select("id, post_id, comment_text, created_at, user_id")
        .single();

      if (error) {
        throw new Error(`Error creating comment: ${error.message}`);
      }

      // Transform data to match frontend expectations
      const transformedData = {
        id: data.id,
        post_id: data.post_id,
        name: commentData.name || 'Anonymous',
        comment: data.comment_text,
        image: commentData.image || 'https://via.placeholder.com/48x48?text=U',
        created_at: data.created_at,
        user: null
      };

      return transformedData;
    } catch (error) {
      console.error("Database error in createComment:", error);
      throw error;
    }
  },

  // Categories
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name");

      if (error) {
        throw new Error(`Error fetching categories: ${error.message}`);
      }

      // Return full category objects with id and name
      return data || [];
    } catch (error) {
      console.error("Database error in getCategories:", error);
      throw error;
    }
  },

  // Stats
  async getStats() {
    try {
      // Get total posts
      const { count: totalPosts, error: postsError } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true });

      if (postsError) {
        throw new Error(`Error fetching posts count: ${postsError.message}`);
      }

      // Get total likes
      const { data: likesData, error: likesError } = await supabase
        .from("posts")
        .select("likes_count");

      if (likesError) {
        throw new Error(`Error fetching likes: ${likesError.message}`);
      }

      const totalLikes = (likesData || []).reduce(
        (sum, post) => sum + (post.likes_count || 0),
        0
      );

      // Get total comments
      const { count: totalComments, error: commentsError } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true });

      if (commentsError) {
        throw new Error(
          `Error fetching comments count: ${commentsError.message}`
        );
      }

      // Get categories
      const categories = await this.getCategories();

      return {
        totalPosts: totalPosts || 0,
        totalLikes: totalLikes || 0,
        totalComments: totalComments || 0,
        totalCategories: categories.length,
        categories: categories.map(cat => cat.name), // Return category names for backward compatibility
      };
    } catch (error) {
      console.error("Database error in getStats:", error);
      throw error;
    }
  },
};
