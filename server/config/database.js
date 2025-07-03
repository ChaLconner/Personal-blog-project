import { createClient } from "@supabase/supabase-js";
import process from "process";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration:');
  console.error('SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.error('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');
  throw new Error("Supabase URL and Service Key must be set in environment variables");
}

// Log successful connection (hide sensitive data)
console.log('✅ Supabase configuration loaded successfully');
console.log('📡 Supabase URL:', supabaseUrl);
console.log('🔑 Service Key:', supabaseServiceKey ? '***...***' : 'NOT SET');

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
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
export const dbService = {
  // Blog Posts
  async getAllPosts(filters = {}) {
    try {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply filters
      if (
        filters.category &&
        filters.category !== "all" &&
        filters.category !== null
      ) {
        query = query.eq("category", filters.category);
      }

      if (filters.search && filters.search.trim().length > 0) {
        const searchTerm = filters.search.trim();
        query = query.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`
        );
      }

      if (filters.limit && filters.limit > 0) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        handleDatabaseError(error, 'getAllPosts');
      }

      return data || [];
    } catch (error) {
      handleDatabaseError(error, 'getAllPosts');
    }
  },

  async getPostById(id) {
    try {
      if (!id || isNaN(id) || id <= 0) {
        throw new Error("Invalid post ID provided");
      }

      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Post not found");
        }
        throw new Error(`Error fetching post: ${error.message}`);
      }

      return data;
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
        .from("blog_posts")
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
        .from("blog_posts")
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

      const { error } = await supabase.from("blog_posts").delete().eq("id", id);

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
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(`Error fetching comments: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Database error in getCommentsByPostId:", error);
      throw error;
    }
  },

  async getAllComments() {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Error fetching comments: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Database error in getAllComments:", error);
      throw error;
    }
  },

  async createComment(commentData) {
    try {
      // Validate required fields
      if (!commentData.post_id || !commentData.name || !commentData.comment) {
        throw new Error("Missing required comment fields");
      }

      // Prepare comment data with current timestamp
      const commentToInsert = {
        post_id: commentData.post_id,
        name: commentData.name,
        comment: commentData.comment,
        image: commentData.image || "https://via.placeholder.com/48x48?text=U",
        created_at: commentData.created_at || new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("comments")
        .insert([commentToInsert])
        .select()
        .single();

      if (error) {
        throw new Error(`Error creating comment: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Database error in createComment:", error);
      throw error;
    }
  },

  // Categories
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("category")
        .not("category", "is", null);

      if (error) {
        throw new Error(`Error fetching categories: ${error.message}`);
      }

      // Get unique categories and filter out empty/null values
      const categories = [
        ...new Set(
          (data || [])
            .map((item) => item.category)
            .filter((category) => category && category.trim().length > 0)
        ),
      ];

      return categories;
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
        .from("blog_posts")
        .select("*", { count: "exact", head: true });

      if (postsError) {
        throw new Error(`Error fetching posts count: ${postsError.message}`);
      }

      // Get total likes
      const { data: likesData, error: likesError } = await supabase
        .from("blog_posts")
        .select("likes");

      if (likesError) {
        throw new Error(`Error fetching likes: ${likesError.message}`);
      }

      const totalLikes = (likesData || []).reduce(
        (sum, post) => sum + (post.likes || 0),
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
        categories,
      };
    } catch (error) {
      console.error("Database error in getStats:", error);
      throw error;
    }
  },
};
