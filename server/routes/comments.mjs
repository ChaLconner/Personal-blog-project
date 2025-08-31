import express from 'express';
import { dbService } from '../config/database.js';
import optionalProtectUser from '../middlewares/optionalProtectUser.mjs';
import { createCommentNotification } from '../utils/notificationHelpers.mjs';

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
// Allow optional auth so logged-in users' user_id/name/profile_pic are stored
router.post('/', optionalProtectUser, async (req, res) => {
  try {
  const { post_id, comment_text, name, email, user_id, image } = req.body;
    
    // Validate required fields
    if (!post_id || !comment_text) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: post_id and comment_text"
      });
    }
    
    // Build comment data and prefer authenticated user info when available
    const commentData = {
      post_id: parseInt(post_id),
      comment_text: comment_text.trim(),
      user_id: req.user?.id || user_id || null,
      name: (req.user && (req.user.name || req.user.username)) || name || 'Anonymous',
      email: email || null,
      image: (req.user && req.user.profile_pic) || image || 'https://images.unsplash.com/photo-1472099645785-5658ab4ff4e?w=48&h=48&fit=crop&crop=face&auto=format&q=60'
    };
    
    // Create comment using database service
    const newComment = await dbService.createComment(commentData);
    // Fire notification to post author if applicable
    try {
      // Attempt to fetch post to get author id and title (best-effort)
      const post = await dbService.getPostById(parseInt(commentData.post_id));
      if (post && post.author && post.id) {
        // post.author may be a name string or object depending on schema; try to extract author id if available
        const postAuthorId = post.author && typeof post.author === 'object' ? post.author.id : post.authorId || post.author || null;
        // Only call createCommentNotification if we have a numeric author id
        if (postAuthorId && commentData.user_id && post.id) {
          await createCommentNotification(commentData.user_id, post.id, post.title || post.description || 'your post', postAuthorId);
        }
      }
    } catch (notifErr) {
      // Log but don't block comment creation
      console.error('Error attempting to create comment notification:', notifErr);
    }
    
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
