// Simple in-memory cache for stats and categories
const cache = {
  stats: { value: null, ts: 0 },
  categories: { value: null, ts: 0 },
};
const CACHE_TTL = 60 * 1000; // 1 minute
import express from "express";
import { dbService } from "../config/database.js";
import protectUser from "../middlewares/protectUser.js";

const router = express.Router();

// GET /api/blog/posts - Get posts with optional filtering
router.get("/posts", async (req, res) => {
  try {
    let { category, search } = req.query;
    let limit = Math.min(Math.max(1, parseInt(req.query.limit) || 12), 100);
    let offset = Math.max(0, parseInt(req.query.offset) || 0);
    
    // Create filters object
    const filters = {};
    if (category && category !== 'all' && category !== 'null') {
      filters.category = category;
    }
    if (search && search.trim()) {
      const sanitizedSearch = search.trim().replace(/[%_]/g, '\\$&');
      filters.search = sanitizedSearch;
    }
    filters.limit = limit;
    filters.offset = offset;
    
    // Get posts using the existing dbService
    const posts = await dbService.getAllPosts(filters);
    

    
    res.json({ 
      success: true, 
      posts: posts,
      meta: {
        category: category || 'all',
        search: search || null,
        limit: limit,
        offset: offset,
        count: posts.length
      }
    });
    
  } catch (error) {
    console.error("❌ Error fetching blog posts:", error);
    res.status(500).json({ 
      success: false, 
      error: process.env.NODE_ENV === 'development' ? (error.message || "Failed to fetch posts") : "Failed to fetch posts",
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
      error: process.env.NODE_ENV === 'development' ? (error.message || "Failed to fetch post") : "Failed to fetch post"
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
      error: process.env.NODE_ENV === 'development' ? (error.message || "Failed to fetch categories") : "Failed to fetch categories",
      categories: []
    });
  }
});

    
// (removed duplicate handler)



export default router;
