import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import protectUser from '../middlewares/protectUser.mjs';

const router = Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Get notifications for a user
router.get('/:userId', protectUser, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user owns the notifications or is admin
    if (req.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        *,
        trigger_user:users!notifications_trigger_user_id_fkey(name, username),
        post:posts(id, title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch notifications' 
      });
    }

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error in get notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', protectUser, async (req, res) => {
  try {
    const { notificationId } = req.params;

    // First check if notification belongs to user
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }

    // Verify user owns the notification
    if (notification.user_id !== req.userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to mark notification as read' 
      });
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error in mark notification as read:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Mark all notifications as read for a user
router.put('/user/:userId/read-all', protectUser, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user owns the notifications
    if (req.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to mark all notifications as read' 
      });
    }

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error in mark all notifications as read:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Create notification
router.post('/', protectUser, async (req, res) => {
  try {
    const { user_id, trigger_user_id, type, title, message, post_id } = req.body;

    // Validate required fields
    if (!user_id || !type || !title || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id,
        trigger_user_id: trigger_user_id || req.userId,
        type,
        title,
        message,
        post_id: post_id || null,
        read: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create notification' 
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in create notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;
