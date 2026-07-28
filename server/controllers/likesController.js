import { dbService, rawSupabase } from '../config/database.js';
import { createNotification } from '../utils/notificationHelpers.js';

export async function toggleLike(req, res) {
  try {
    const postId = parseInt(req.params.postId, 10);
    const { action } = req.body || {};
    const userId = req.userId || req.user?.id;
    const token = req.headers.authorization?.split(" ")[1];

    if (!postId || isNaN(postId)) {
      return res.status(400).json({ success: false, error: 'Invalid post id' });
    }
    if (!['like', 'unlike'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in request' });
    }
    const updatedCount = await dbService.toggleUserLike(postId, userId, action, token);
    res.json({ success: true, likes: updatedCount });

    if (action === 'like') {
      setImmediate(() => {
        (async () => {
          try {
            const { data: post } = await rawSupabase(token)
              .from('posts')
              .select('author_id, title, description')
              .eq('id', postId)
              .maybeSingle();

            const postAuthorId = post?.author_id;
            if (postAuthorId && postAuthorId !== userId) {
              await createNotification({
                userId: postAuthorId,
                triggerUserId: userId,
                type: 'like',
                title: 'Liked your article',
                message: `Someone liked your article "${post?.title || post?.description || 'your post'}"`,
                postId: postId
              });
            }
          } catch (notifErr) {
            console.error('Error creating like notification:', notifErr?.message || notifErr);
          }
        })().catch(err => console.error('Unhandled background notification error:', err));
      });
    }
  } catch (error) {
    console.error('❌ Error toggling like:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to toggle like' });
  }
}

export async function getHasLiked(req, res) {
  try {
    const postId = parseInt(req.params.postId, 10);
    const userId = req.userId || req.user?.id;
    const token = req.headers.authorization?.split(" ")[1];

    if (!postId || isNaN(postId)) {
      return res.status(400).json({ success: false, error: 'Invalid post id' });
    }
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in request' });
    }

    const { data, error } = await rawSupabase(token)
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
}
