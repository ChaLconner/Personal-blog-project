import express from 'express';
import { dbService } from '../config/database.js';

const router = express.Router();

// GET /api/comments - Get comments with optional post filter
router.get('/', async (req, res) => {
  try {
    const { postId } = req.query;
    
    if (postId) {
      // Get comments for specific post
      const comments = await dbService.getCommentsByPostId(parseInt(postId));
      res.json({ 
        success: true, 
        data: comments,
        count: comments.length
      });
    } else {
      // Get all comments
      const comments = await dbService.getAllComments();
      res.json({ 
        success: true, 
        data: comments,
        count: comments.length
      });
    }
    
  } catch (error) {
    console.error("❌ Error fetching comments:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to fetch comments",
      data: []
    });
  }
});

// POST /api/comments - Create new comment
router.post('/', async (req, res) => {
  try {
    const { post_id, comment_text, name, email } = req.body;
    
    // Validate required fields
    if (!post_id || !comment_text) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: post_id and comment_text"
      });
    }
    
    // Create comment data
    const commentData = {
      post_id: parseInt(post_id),
      comment_text: comment_text.trim(),
      name: name || 'Anonymous',
      email: email || null,
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face&auto=format&q=60'
    };
    
    // Create comment using database service
    const newComment = await dbService.createComment(commentData);
    
    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: newComment
    });
    
  } catch (error) {
    console.error("❌ Error creating comment:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create comment"
    });
  }
});

export default router;
