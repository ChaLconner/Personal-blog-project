import express from "express";
import { dbService } from "../config/database.js";

const router = express.Router();

// GET /api/blog/posts - Get posts with optional filtering
router.get("/posts", async (req, res) => {
  try {
    const { category, limit = 10, offset = 0 } = req.query;
    
    console.log(`📝 Blog posts request: category=${category}, limit=${limit}, offset=${offset}`);
    
    // Create filters object
    const filters = {};
    if (category && category !== 'all') {
      filters.category = category;
    }
    if (limit) {
      filters.limit = parseInt(limit);
    }
    if (offset) {
      filters.offset = parseInt(offset);
    }
    
    // Get posts using the existing dbService
    const posts = await dbService.getAllPosts(filters);
    
    console.log(`✅ Retrieved ${posts.length} posts`);
    
    res.json({ 
      success: true, 
      posts: posts,
      meta: {
        category: category || 'all',
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

// GET /api/blog/categories - Get all categories
router.get("/categories", async (req, res) => {
  try {
    console.log(`📂 Categories request`);
    
    // Get categories using the existing dbService
    const categories = await dbService.getCategories();
    
    console.log(`✅ Retrieved ${categories.length} categories`);
    
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

export default router;
