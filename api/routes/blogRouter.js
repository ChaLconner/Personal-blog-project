import express from "express";
import { dbService } from "../config/database.js";

const router = express.Router();

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

// GET /api/blog/categories - Get all categories
router.get("/categories", async (req, res) => {
  try {

    
    // Get categories using the existing dbService
    const categories = await dbService.getCategories();
    

    
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

// GET /api/blog/stats - Get blog statistics
router.get("/stats", async (req, res) => {
  try {

    
    // Get stats using the existing dbService
    const stats = await dbService.getStats();
    

    
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

export default router;
