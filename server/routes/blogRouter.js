// Simple in-memory cache for stats and categories
const cache = {
  stats: { value: null, ts: 0 },
  categories: { value: null, ts: 0 },
};
const CACHE_TTL = 60 * 1000; // 1 minute
import express from "express";
import { dbService, getSupabase } from "../config/database.js";

// Get the actual Supabase client
const supabase = getSupabase();

const router = express.Router();

// Middleware to check if user is authenticated
const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  try {
    // Get user from Supabase
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    req.user = data.user;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/blog/posts - Get posts with optional filtering
router.get("/posts", async (req, res) => {
  try {
    const { category, search, limit = 12, offset = 0 } = req.query;
    

    
    // Create filters object
    const filters = {};
    if (category && category !== 'all' && category !== 'null') {
      filters.category = category;
    }
    if (search && search.trim()) {
      filters.search = search.trim();
    }
    if (limit) {
      filters.limit = parseInt(limit);
    }
    if (offset) {
      filters.offset = parseInt(offset);
    }
    
    // Get posts using the existing dbService
    const posts = await dbService.getAllPosts(filters);
    

    
    res.json({ 
      success: true, 
      posts: posts,
      meta: {
        category: category || 'all',
        search: search || null,
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: posts.length
      }
    });
    
  } catch (error) {
    console.error("❌ Error fetching blog posts:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to fetch posts",
      posts: [] 
    });
  }
});

// GET /api/blog/posts/:id - Get single post by ID
router.get("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    

    
    // Get post by ID using the existing dbService
    const post = await dbService.getPostById(parseInt(id));
    
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        error: "Post not found" 
      });
    }
    

    
    res.json({ 
      success: true, 
      post: post 
    });
    
  } catch (error) {
    console.error("❌ Error fetching single post:", error);
    
    if (error.message === "Post not found") {
      return res.status(404).json({ 
        success: false, 
        error: "Post not found" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to fetch post" 
    });
  }
});

// POST /api/blog/posts/:id/like - Like/Unlike a post
router.post("/posts/:id/like", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if post exists
    const post = await dbService.getPostById(parseInt(id));
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        error: "Post not found" 
      });
    }

    // Check if user has already liked this post
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', userId)
      .single();

    let isLiked;
    let action;

    if (existingLike) {
      // Unlike the post
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', id)
        .eq('user_id', userId);
      
      if (deleteError) {
        throw deleteError;
      }
      
      isLiked = false;
      action = "unliked";
    } else {
      // Like the post
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert([{ post_id: id, user_id: userId }]);
      
      if (insertError) {
        throw insertError;
      }
      
      isLiked = true;
      action = "liked";
    }

    // Get updated like count
    const { data: likes, error: countError } = await supabase
      .from('post_likes')
      .select('id', { count: 'exact' })
      .eq('post_id', id);

    if (countError) {
      throw countError;
    }

    res.json({
      success: true,
      message: `Post ${action} successfully`,
      isLiked: isLiked,
      likes_count: likes.length
    });

  } catch (error) {
    console.error("❌ Error liking post:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to like post"
    });
  }
});

// GET /api/blog/posts/:id/like-status - Check if user has liked a post
router.get("/posts/:id/like-status", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if user has liked this post
    const { data: existingLike, error } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', userId)
      .single();

    res.json({
      success: true,
      isLiked: !!existingLike
    });

  } catch (error) {
    console.error("❌ Error checking like status:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to check like status"
    });
  }
});

// POST /api/blog/posts/:id/comment - Add a comment to a post
router.post("/posts/:id/comment", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: "Comment content is required"
      });
    }

    // Check if post exists
    const post = await dbService.getPostById(parseInt(id));
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        error: "Post not found" 
      });
    }

    // Get user info
    const { data: userInfo, error: userError } = await supabase
      .from('users')
      .select('name, profile_pic, username')
      .eq('id', userId)
      .single();

    if (userError) {
      throw userError;
    }

    // Insert comment
    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert([{
        post_id: id,
        user_id: userId,
        content: content.trim(),
        name: userInfo.name || userInfo.username || 'Anonymous',
        image: userInfo.profile_pic || null
      }])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    res.json({
      success: true,
      message: "Comment added successfully",
      comment: newComment
    });

  } catch (error) {
    console.error("❌ Error adding comment:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to add comment"
    });
  }
});

// GET /api/blog/categories - Get all categories
router.get("/categories", async (req, res) => {
  try {

    
    // Get categories using the existing dbService
    const now = Date.now();
    if (cache.categories.value && (now - cache.categories.ts) < CACHE_TTL) {
      return res.json({
        success: true,
        categories: cache.categories.value
      });
    }
    const categories = await dbService.getCategories();
    cache.categories = { value: categories, ts: now };
    res.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch categories",
      categories: []
    });
  }
});

    
// (removed duplicate handler)

// GET /api/blog/stats - Get blog statistics
router.get("/stats", async (req, res) => {
  try {

    
    // Get stats using the existing dbService
    const now = Date.now();
    if (cache.stats.value && (now - cache.stats.ts) < CACHE_TTL) {
      return res.json({
        success: true,
        stats: cache.stats.value
      });
    }
    const stats = await dbService.getStats();
    cache.stats = { value: stats, ts: now };
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error("❌ Error fetching blog stats:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch stats",
      stats: {}
    });
  }
});

    
// (removed duplicate handler)

export default router;
