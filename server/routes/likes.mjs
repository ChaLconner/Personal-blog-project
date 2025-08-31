import express from 'express';
import { dbService, supabaseAuth, rawSupabase } from '../config/database.js';
import { createNotification } from '../utils/notificationHelpers.mjs';

const router = express.Router();

// Simple middleware to verify auth token and attach user
async function protectUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;
    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    req.user = data.user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
}

// PUT /likes/:postId/toggle - delta expected in body: { action: 'like' | 'unlike' }
router.put('/:postId/toggle', protectUser, async (req, res) => {
  try {
    const postId = parseInt(req.params.postId, 10);
    const { action } = req.body || {};
    const userId = req.user?.id;
    if (!postId || isNaN(postId)) {
      return res.status(400).json({ success: false, error: 'Invalid post id' });
    }
    if (!['like', 'unlike'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in request' });
    }
    const updatedCount = await dbService.toggleUserLike(postId, userId, action);
    // After a successful like, create a notification for post author (best-effort)
    try {
      if (action === 'like') {
        // Fetch post to get author id
        const post = await dbService.getPostById(postId);
        // post.author may be an object or an id depending on schema; attempt to extract numeric id
        const postAuthorId = post && typeof post.author === 'object' ? post.author.id : post.authorId || post.author || null;
        if (postAuthorId && postAuthorId !== userId) {
          await createNotification({
            userId: postAuthorId,
            triggerUserId: userId,
            type: 'like',
            title: 'Liked your article',
            message: `Someone liked your article "${post.title || post.description || 'your post'}"`,
            postId: postId
          });
        }
      }
    } catch (notifErr) {
      console.error('Error creating like notification:', notifErr);
    }
    return res.json({ success: true, likes: updatedCount });
  } catch (error) {
    console.error('❌ Error toggling like:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to toggle like' });
  }
});

// GET /likes/:postId/has-liked - returns whether current user has liked the post
router.get('/:postId/has-liked', protectUser, async (req, res) => {
  try {
    const postId = parseInt(req.params.postId, 10);
    const userId = req.user?.id;
    if (!postId || isNaN(postId)) {
      return res.status(400).json({ success: false, error: 'Invalid post id' });
    }
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in request' });
    }

  const { data, error } = await rawSupabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking has-liked:', error);
      return res.status(500).json({ success: false, error: error.message || 'Error checking like status' });
    }

    const hasLiked = !!data;
    return res.json({ success: true, hasLiked });
  } catch (error) {
    console.error('❌ Error in has-liked:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal error' });
  }
});

export default router;
