import { createClient } from "@supabase/supabase-js";
import process from "process";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load server/.env if environment variables are not yet present
if (!process.env.SUPABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
}

// Lazy initialization of Supabase clients
let supabase = null;
let supabaseAuth = null;

const getSupabaseClients = () => {
  if (!supabase || !supabaseAuth) {
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

    if (supabaseServiceKey === supabaseAnonKey) {
      console.warn('⚠️ WARNING: SUPABASE_SERVICE_KEY is using ANON_KEY! Admin operations may fail due to RLS policies.');
    }

    // Service client for admin operations (database queries)
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false // Disable auth persistence for server-side usage
      }
    });

    // Auth client for user authentication operations
    supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false // Disable auth persistence for server-side usage
      }
    });
  }
  
  return { supabase, supabaseAuth };
};

// Export getters that will initialize the clients on first use
const userClientCache = new Map();
const MAX_CACHE_SIZE = 100;

export const getSupabase = (token = null) => {
  const { supabase } = getSupabaseClients();
  if (!token) return supabase;
  
  if (userClientCache.has(token)) {
    return userClientCache.get(token);
  }
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: { persistSession: false }
  });

  if (userClientCache.size >= MAX_CACHE_SIZE) {
    const firstKey = userClientCache.keys().next().value;
    userClientCache.delete(firstKey);
  }
  userClientCache.set(token, client);

  return client;
};
export const getSupabaseAuth = () => getSupabaseClients().supabaseAuth;

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

export const clearCategoriesCache = () => {
  categoriesCache = null;
  categoriesCacheTime = 0;
};

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
          const { data: categoriesData, error: categoriesError } = await getSupabase()
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

      let query = getSupabase()
        .from("posts")
        .select("id, title, description, image, date, content, likes_count, category_id, status_id, author_id")
        .eq("status_id", 2)
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
        const searchTerm = filters.search.trim().replace(/[,().]/g, '');
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      // Apply pagination offset to prevent duplicates
      if (filters.offset !== undefined && filters.offset !== null && filters.offset !== '') {
        const offsetNum = Number(filters.offset);
        const limitNum = Number(filters.limit) || 6;
        query = query.range(offsetNum, offsetNum + limitNum - 1);
      } else if (filters.limit && filters.limit > 0) {
        query = query.limit(Number(filters.limit));
      }

      let selectFields = "id, title, description, image, date, content, likes_count, category_id, status_id, author_id";
      let { data, error } = await query;

      if (error && error.message?.includes("author_id")) {
        // Fallback for databases where author_id column is not yet migrated
        let fallbackQuery = getSupabase()
          .from("posts")
          .select("id, title, description, image, date, content, likes_count, category_id, status_id")
          .eq("status_id", 2)
          .order("date", { ascending: false });

        if (filters.category && filters.category !== 'Highlight') {
          const categoryObj = categories.find(cat => cat.name.toLowerCase() === filters.category.toLowerCase());
          if (categoryObj) fallbackQuery = fallbackQuery.eq('category_id', categoryObj.id);
        }

        if (filters.search && filters.search.trim()) {
          const searchTerm = filters.search.trim().replace(/[,().]/g, '');
          fallbackQuery = fallbackQuery.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
        }

        if (filters.offset !== undefined && filters.offset !== null && filters.offset !== '') {
          const offsetNum = Number(filters.offset);
          const limitNum = Number(filters.limit) || 6;
          fallbackQuery = fallbackQuery.range(offsetNum, offsetNum + limitNum - 1);
        } else if (filters.limit && filters.limit > 0) {
          fallbackQuery = fallbackQuery.limit(Number(filters.limit));
        }

        const fallbackRes = await fallbackQuery;
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (error) {
        handleDatabaseError(error, 'getAllPosts');
      }

      const postsData = data || [];

      // Fetch authors for posts if author_id is present
      const authorIds = [...new Set(postsData.map(p => p.author_id).filter(Boolean))];
      let authorsMap = new Map();
      if (authorIds.length > 0) {
        try {
          const { data: authorsData } = await getSupabase()
            .from("users")
            .select("id, name, username, profile_pic")
            .in("id", authorIds);
          if (Array.isArray(authorsData)) {
            authorsMap = new Map(authorsData.map(u => [u.id, u]));
          }
        } catch (authErr) {
          // Fallback if users table query fails
        }
      }

      // Transform data to match frontend expectations (optimized)
      const transformedData = postsData.map(post => {
        const category = categories.find(cat => cat.id === post.category_id);
        const authorObj = post.author_id ? authorsMap.get(post.author_id) : null;
        
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
            id: authorObj?.id || post.author_id || 1,
            name: authorObj?.name || authorObj?.username || 'Admin',
            image: authorObj?.profile_pic || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face&auto=format&q=60',
            username: authorObj?.username || 'admin'
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

      let { data, error } = await getSupabase()
        .from("posts")
        .select("id, title, description, image, date, content, likes_count, category_id, status_id, author_id")
        .eq("id", id)
        .eq("status_id", 2)
        .single();

      if (error && error.message?.includes("author_id")) {
        const fallbackRes = await getSupabase()
          .from("posts")
          .select("id, title, description, image, date, content, likes_count, category_id, status_id")
          .eq("id", id)
          .eq("status_id", 2)
          .single();
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Post not found");
        }
        throw new Error(`Error fetching post: ${error.message}`);
      }

      // Get categories separately
      let categories = [];
      try {
        const { data: categoriesData } = await getSupabase().from("categories").select("id, name");
        categories = categoriesData || [];
      } catch (catError) {
        // Categories fetch failed for single post
      }

      // Fetch author info if present
      let authorObj = null;
      if (data.author_id) {
        try {
          const { data: userData } = await getSupabase()
            .from("users")
            .select("id, name, username, profile_pic")
            .eq("id", data.author_id)
            .single();
          authorObj = userData;
        } catch (uErr) {
          // Fallback if user not found
        }
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
          id: authorObj?.id || data.author_id || 1,
          name: authorObj?.name || authorObj?.username || 'Admin User',
          image: authorObj?.profile_pic || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face&auto=format&q=60',
          username: authorObj?.username || 'admin'
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

      const { data, error } = await getSupabase()
        .from("posts")
        .insert([postData])
        .select()
        .single();

      if (error) {
        throw new Error(`Error creating post: ${error.message}`);
      }

      // Best-effort: create notifications for new article publication.
      // If postData contains an author id, use it; otherwise skip notification to avoid guessing.
      try {
        // Import notification helpers only when needed to avoid circular dependency
        const { createNewArticleNotification } = await import('../utils/notificationHelpers.js');
        
        const authorId = postData.author_id || postData.authorId || postData.user_id || null;
        // Only trigger if we have a numeric authorId and post is published
        if (authorId) {
          // Fire-and-forget; don't await to avoid blocking
          createNewArticleNotification(authorId, data.id, data.title).catch(err => {
            console.error('Error creating new article notifications (async):', err);
          });
        }
      } catch (notifErr) {
        console.error('Error attempting to create new article notification:', notifErr);
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

      const { data, error } = await getSupabase()
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

      const { error } = await getSupabase().from("posts").delete().eq("id", id);

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

      const { data, error } = await getSupabase()
        .from("comments")
        .select("id, post_id, comment_text, created_at, user_id")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(`Error fetching comments: ${error.message}`);
      }

      // Enrich with user profile (name/avatar) if user_id is present
      const comments = data || [];
      const userIds = [...new Set(comments.map(c => c.user_id).filter(Boolean))];
      let usersMap = new Map();
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await getSupabase()
          .from('users')
          .select('id, name, username, profile_pic')
          .in('id', userIds);

        if (!usersError && Array.isArray(usersData)) {
          usersMap = new Map(usersData.map(u => [u.id, u]));
        }
      }

      // Transform data to match frontend expectations (with user info)
      const transformedData = comments.map(comment => {
        const u = comment.user_id ? usersMap.get(comment.user_id) : null;
        const displayName = (u?.name && u.name.trim()) || (u?.username && u.username.trim()) || 'Anonymous';
        const avatar = (u?.profile_pic && typeof u.profile_pic === 'string' && u.profile_pic.trim())
          || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face&auto=format&q=60';
        return {
          id: comment.id,
          post_id: comment.post_id,
          name: displayName,
          comment: comment.comment_text,
          image: avatar,
          created_at: comment.created_at,
          user: u ? { id: comment.user_id, name: u.name, username: u.username, profile_pic: u.profile_pic } : null,
        };
      });

      return transformedData;
    } catch (error) {
      console.error("Database error in getCommentsByPostId:", error);
      throw error;
    }
  },

  async getAllComments() {
    try {
      const { data, error } = await getSupabase()
        .from("comments")
        .select("id, post_id, comment_text, created_at, user_id")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Error fetching comments: ${error.message}`);
      }

      const comments = data || [];
      const userIds = [...new Set(comments.map(c => c.user_id).filter(Boolean))];
      let usersMap = new Map();
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await getSupabase()
          .from('users')
          .select('id, name, username, profile_pic')
          .in('id', userIds);

        if (!usersError && Array.isArray(usersData)) {
          usersMap = new Map(usersData.map(u => [u.id, u]));
        }
      }

      // Transform data to match frontend expectations (with user info)
      const transformedData = comments.map(comment => {
        const u = comment.user_id ? usersMap.get(comment.user_id) : null;
        const displayName = (u?.name && u.name.trim()) || (u?.username && u.username.trim()) || 'Anonymous';
        const avatar = (u?.profile_pic && typeof u.profile_pic === 'string' && u.profile_pic.trim()) || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face&auto=format&q=60';
        return {
          id: comment.id,
          post_id: comment.post_id,
          name: displayName,
          comment: comment.comment_text,
          image: avatar,
          created_at: comment.created_at,
          user: u ? { id: comment.user_id, name: u.name, username: u.username, profile_pic: u.profile_pic } : null,
        };
      });

      return transformedData;
    } catch (error) {
      console.error("Database error in getAllComments:", error);
      throw error;
    }
  },

  async getCommentById(id) {
    if (!id || isNaN(id) || id <= 0) {
      throw new Error("Invalid comment ID provided");
    }

    const { data, error } = await getSupabase()
      .from("comments")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Error fetching comment: ${error.message}`);
    }

    return data;
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

      const { data, error } = await getSupabase()
        .from("comments")
        .insert([commentToInsert])
        .select("id, post_id, comment_text, created_at, user_id")
        .single();

      if (error) {
        throw new Error(`Error creating comment: ${error.message}`);
      }

    // Enrich with user profile if available
    let displayName = commentData?.name || 'Anonymous';
    let avatar = commentData?.image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face&auto=format&q=60';
      let userObj = null;
      if (data.user_id) {
        const { data: userData } = await getSupabase()
          .from('users')
          .select('id, name, username, profile_pic')
          .eq('id', data.user_id)
          .single();
        if (userData) {
          displayName = (userData.name && userData.name.trim()) || (userData.username && userData.username.trim()) || displayName;
      avatar = (userData.profile_pic && typeof userData.profile_pic === 'string' && userData.profile_pic.trim()) || avatar;
          userObj = { id: userData.id, name: userData.name, username: userData.username, profile_pic: userData.profile_pic };
        }
      }

      // Transform data to match frontend expectations
      const transformedData = {
        id: data.id,
        post_id: data.post_id,
        name: displayName,
        comment: data.comment_text,
        image: avatar,
        created_at: data.created_at,
        user: userObj,
      };

      return transformedData;
    } catch (error) {
      console.error("Database error in createComment:", error);
      throw error;
    }
  },

  async deleteComment(id) {
    try {
      if (!id || isNaN(id) || id <= 0) {
        throw new Error("Invalid comment ID provided");
      }
      const { error } = await getSupabase().from("comments").delete().eq("id", id);
      if (error) {
        throw new Error(`Error deleting comment: ${error.message}`);
      }
      return true;
    } catch (error) {
      console.error("Database error in deleteComment:", error);
      throw error;
    }
  },

  // Categories
  async getCategories() {
    try {
      const { data, error } = await getSupabase()
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
      const { count: totalPosts, error: postsError } = await getSupabase()
        .from("posts")
        .select("*", { count: "exact", head: true });

      if (postsError) {
        throw new Error(`Error fetching posts count: ${postsError.message}`);
      }

      // Get total likes using count from post_likes to avoid memory issues with .reduce()
      const { count: totalLikes, error: likesError } = await getSupabase()
        .from("post_likes")
        .select("id", { count: "exact", head: true });

      if (likesError) {
        throw new Error(`Error fetching likes: ${likesError.message}`);
      }

      // Get total comments
      const { count: totalComments, error: commentsError } = await getSupabase()
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

  // Likes (per-user like tracking)
  async toggleUserLike(postId, userId, action, token = null) {
    try {
      if (!postId || isNaN(postId) || postId <= 0) {
        throw new Error("Invalid post ID provided");
      }
      if (!userId) {
        throw new Error("User ID is required for like action");
      }
      if (!['like', 'unlike'].includes(action)) {
        throw new Error("Invalid action for like toggle");
      }

      const client = getSupabase(token);

      if (action === 'like') {
        const { error: insertError } = await client
          .from("post_likes")
          .insert([{ post_id: postId, user_id: userId }]);
        if (insertError && insertError.code !== '23505' && !insertError.message?.includes('duplicate')) {
          throw new Error(`Error liking post: ${insertError.message}`);
        }
      } else if (action === 'unlike') {
        const { error: deleteError } = await client
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (deleteError) throw new Error(`Error unliking post: ${deleteError.message}`);
      }

      // Update likes_count in posts table
      const { count, error: countError } = await client
        .from("post_likes")
        .select("id", { count: "exact", head: true })
        .eq("post_id", postId);
      if (countError) throw new Error(`Error counting likes: ${countError.message}`);

      const likesCount = count || 0;
      getSupabase()
        .from("posts")
        .update({ likes_count: likesCount })
        .eq("id", postId)
        .then(({ error }) => {
          if (error) console.error("Error background updating likes_count:", error);
        });

      return likesCount;
    } catch (error) {
      console.error("Database error in toggleUserLike:", error);
      throw error;
    }
  },
};

// Also export raw supabase client for advanced queries in routes when needed
export const rawSupabase = getSupabase;
