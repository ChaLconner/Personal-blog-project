import { dbService } from '../config/database.js';
import { createCommentNotification } from '../utils/notificationHelpers.js';

export async function getComments(req, res) {
  try {
    const { postId } = req.query;
    
    if (postId) {
      const comments = await dbService.getCommentsByPostId(parseInt(postId));
      res.json({ 
        success: true, 
        data: comments,
        count: comments.length
      });
    } else {
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
}

const sanitizeText = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
};

const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%239CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

export async function createComment(req, res) {
  try {
    const { post_id, comment_text, name, email, user_id, image } = req.body;
    
    if (!post_id || !comment_text) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: post_id and comment_text"
      });
    }
    
    const commentData = {
      post_id: parseInt(post_id),
      comment_text: sanitizeText(comment_text),
      user_id: req.user?.id || user_id || null,
      name: sanitizeText((req.user && (req.user.name || req.user.username)) || name || 'Anonymous'),
      email: email || null,
      image: (req.user && req.user.profile_pic) || image || DEFAULT_AVATAR
    };
    
    const newComment = await dbService.createComment(commentData);
    try {
      const post = await dbService.getPostById(parseInt(commentData.post_id));
      if (post && post.author && post.id) {
        const postAuthorId = post.author && typeof post.author === 'object' ? post.author.id : post.authorId || post.author || null;
        if (postAuthorId && commentData.user_id && post.id) {
          await createCommentNotification(commentData.user_id, post.id, post.title || post.description || 'your post', postAuthorId);
        }
      }
    } catch (notifErr) {
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
}

export async function deleteComment(req, res) {
  try {
    const commentId = parseInt(req.params.id);
    if (!commentId || isNaN(commentId)) {
      return res.status(400).json({ success: false, error: 'Invalid comment ID' });
    }

    const comment = await dbService.getCommentById ? await dbService.getCommentById(commentId) : null;
    if (comment && comment.user_id && comment.user_id !== req.userId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Cannot delete other users comments' });
    }

    await dbService.deleteComment(commentId);
    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error("❌ Error deleting comment:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete comment"
    });
  }
}
