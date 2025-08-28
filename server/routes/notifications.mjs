import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import protectUser from '../middlewares/protectUser.mjs';
import protectAdmin from '../middlewares/protectAdmin.mjs';

const router = Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Test endpoint
router.get('/test', (req, res) => {
  console.log('🧪 Test notifications endpoint called');
  res.json({ 
    success: true, 
    message: 'Notifications API is working',
    timestamp: new Date().toISOString()
  });
});

// Create a test notification (development only)
router.post('/create-test/:userId', protectUser, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Create a simple test notification
    const testNotification = {
      user_id: userId,
      trigger_user_id: req.userId,
      type: 'system',
      title: 'Test Notification',
      message: `This is a test notification created at ${new Date().toLocaleTimeString()}`,
      post_id: null,
      read: false,
      created_at: new Date().toISOString()
    };

    console.log('📝 Creating test notification:', testNotification);

    const { data, error } = await supabase
      .from('notifications')
      .insert([testNotification])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating test notification:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create test notification',
        details: error.message 
      });
    }

    console.log('✅ Test notification created:', data);

    res.json({ 
      success: true, 
      data,
      message: 'Test notification created successfully' 
    });
  } catch (error) {
    console.error('❌ Unexpected error creating test notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get notifications for a user
router.get('/:userId', protectUser, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('📩 Fetching notifications for user:', userId);
    console.log('🔐 Request user ID:', req.userId);
    console.log('👤 Request user role:', req.user?.role);
    
    // Verify user owns the notifications or is admin
    if (req.userId !== userId && req.user.role !== 'admin') {
      console.log('❌ Access denied for user:', req.userId, 'trying to access:', userId);
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }

    // First, try a simple query to check if notifications table exists
    console.log('🔍 Checking notifications table...');
    const { data: simpleCheck, error: simpleError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);

    if (simpleError) {
      console.error('❌ Simple notifications query failed:', simpleError);
      return res.status(500).json({ 
        success: false, 
        error: 'Notifications table access failed',
        details: simpleError.message 
      });
    }

    console.log('✅ Notifications table accessible');

    // Try the main query with simpler joins first
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        id,
        user_id,
        trigger_user_id,
        type,
        title,
        message,
        post_id,
        read,
        read_at,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ Error fetching notifications:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch notifications',
        details: error.message 
      });
    }

    console.log(`✅ Found ${notifications?.length || 0} notifications`);

    // Format notifications for client (simplified for now)
    const formattedNotifications = (notifications || []).map(notification => ({
      id: notification.id,
      user_id: notification.user_id,
      trigger_user_id: notification.trigger_user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      post_id: notification.post_id,
      read: notification.read,
      read_at: notification.read_at,
      created_at: notification.created_at
    }));

    res.json({ 
      success: true, 
      data: formattedNotifications,
      meta: {
        total: formattedNotifications.length,
        unread: formattedNotifications.filter(n => !n.read).length
      }
    });
  } catch (error) {
    console.error('❌ Unexpected error in get notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
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
        error: 'Missing required fields: user_id, type, title, message' 
      });
    }

    // Validate notification type
    const validTypes = ['comment', 'like', 'reply', 'mention', 'follow', 'system'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    // Don't create notification for self
    if (user_id === req.userId) {
      return res.json({ 
        success: true, 
        message: 'Notification not created (self-notification)' 
      });
    }

    // Check if similar notification already exists (prevent spam)
    if (type === 'comment' && post_id) {
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user_id)
        .eq('trigger_user_id', trigger_user_id || req.userId)
        .eq('type', type)
        .eq('post_id', post_id)
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Within last 5 minutes
        .limit(1);

      if (existing && existing.length > 0) {
        return res.json({ 
          success: true, 
          message: 'Similar notification already exists' 
        });
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id,
        trigger_user_id: trigger_user_id || req.userId,
        type,
        title: title.trim(),
        message: message.trim(),
        post_id: post_id || null,
        read: false,
        created_at: new Date().toISOString()
      }])
      .select(`
        id,
        user_id,
        trigger_user_id,
        type,
        title,
        message,
        post_id,
        read,
        created_at,
        trigger_user:users!notifications_trigger_user_id_fkey(name, username, profile_pic),
        post:posts(id, title, slug)
      `)
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create notification',
        details: error.message 
      });
    }

    res.status(201).json({ 
      success: true, 
      data,
      message: 'Notification created successfully' 
    });
  } catch (error) {
    console.error('Error in create notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Delete notification (admin or owner only)
router.delete('/:notificationId', protectUser, async (req, res) => {
  try {
    const { notificationId } = req.params;

    // First check if notification exists and get user_id
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

    // Verify user owns the notification or is admin
    if (notification.user_id !== req.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to delete notification',
        details: error.message 
      });
    }

    res.json({ 
      success: true, 
      message: 'Notification deleted successfully' 
    });
  } catch (error) {
    console.error('Error in delete notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Create test notification (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/test/:userId', protectUser, async (req, res) => {
    try {
      const { userId } = req.params;
      const { type = 'system', title = 'Test Notification', message = 'This is a test notification' } = req.body;

      const testNotification = {
        user_id: userId,
        trigger_user_id: req.userId,
        type,
        title,
        message,
        post_id: null,
        read: false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert([testNotification])
        .select(`
          id,
          user_id,
          trigger_user_id,
          type,
          title,
          message,
          post_id,
          read,
          created_at,
          trigger_user:users!notifications_trigger_user_id_fkey(name, username, profile_pic)
        `)
        .single();

      if (error) {
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to create test notification',
          details: error.message 
        });
      }

      res.json({ 
        success: true, 
        data,
        message: 'Test notification created successfully' 
      });
    } catch (error) {
      console.error('Error creating test notification:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      });
    }
  });
}

// Admin: Get all notifications with pagination
router.get('/admin/all', protectAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, read, user_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('notifications')
      .select(`
        id,
        user_id,
        trigger_user_id,
        type,
        title,
        message,
        post_id,
        read,
        read_at,
        created_at,
        user:users!notifications_user_id_fkey(name, username, email),
        trigger_user:users!notifications_trigger_user_id_fkey(name, username),
        post:posts(id, title, slug)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }
    if (read !== undefined) {
      query = query.eq('read', read === 'true');
    }
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error('Error fetching admin notifications:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch notifications',
        details: error.message 
      });
    }

    res.json({ 
      success: true, 
      data: notifications,
      meta: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in admin get all notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Admin: Get notification statistics
router.get('/admin/stats', protectAdmin, async (req, res) => {
  try {
    // Get total notifications
    const { count: totalNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true });

    // Get unread notifications
    const { count: unreadNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false);

    // Get notifications by type
    const { data: typeStats } = await supabase
      .from('notifications')
      .select('type')
      .group('type');

    // Get recent notifications (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday);

    res.json({ 
      success: true, 
      data: {
        total: totalNotifications,
        unread: unreadNotifications,
        read: totalNotifications - unreadNotifications,
        recent24h: recentNotifications,
        byType: typeStats || [],
        readRate: totalNotifications > 0 ? 
          ((totalNotifications - unreadNotifications) / totalNotifications * 100).toFixed(1) + '%' : 
          '0%'
      }
    });
  } catch (error) {
    console.error('Error in admin notification stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

export default router;
