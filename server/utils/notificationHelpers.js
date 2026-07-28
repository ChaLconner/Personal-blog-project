import { createClient } from '@supabase/supabase-js';

// Lazy initialization of Supabase client
let supabase = null;

const getSupabaseClient = () => {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }
  return supabase;
};

// Notification types
export const NOTIFICATION_TYPES = {
  NEW_ARTICLE: 'new_article',
  NEW_COMMENT: 'new_comment',
  COMMENT_REPLY: 'comment_reply'
};

// Helper function to create notifications
export const createNotification = async ({
  userId,
  triggerUserId,
  type,
  title,
  message,
  postId = null
}) => {
  try {
    const { data, error } = await getSupabaseClient()
      .from('notifications')
      .insert([{
        user_id: userId,
        trigger_user_id: triggerUserId,
        type,
        title,
        message,
        post_id: postId,
        read: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in createNotification:', error);
    return { success: false, error };
  }
};

// Create notification when a new article is published
export const createNewArticleNotification = async (authorId, postId, postTitle) => {
  try {
    // Get all users except the author to notify them
    const { data: users, error } = await getSupabaseClient()
      .from('users')
      .select('id')
      .neq('id', authorId);

    if (error) {
      console.error('Error fetching users for article notification:', error);
      return;
    }

    if (!users || users.length === 0) {
      return;
    }

    // Create notifications for all users
    const notifications = users.map(user => ({
      user_id: user.id,
      trigger_user_id: authorId,
      type: NOTIFICATION_TYPES.NEW_ARTICLE,
      title: 'Published new article',
      message: `New article "${postTitle}" has been published`,
      post_id: postId,
      read: false
    }));

    const { error: insertError } = await getSupabaseClient()
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      console.error('Error creating article notifications:', insertError);
    } else {
      console.log(`✅ Created ${notifications.length} article notifications for new post: ${postTitle}`);
    }
  } catch (error) {
    console.error('Error in createNewArticleNotification:', error);
  }
};

// Create notification when someone comments on a post
export const createCommentNotification = async (commenterId, postId, postTitle, postAuthorId) => {
  try {
    // Don't notify if author comments on their own post
    if (commenterId === postAuthorId) {
      return;
    }

    // Get commenter's name
    const { data: commenter, error: commenterError } = await getSupabaseClient()
      .from('users')
      .select('name, username')
      .eq('id', commenterId)
      .single();

    if (commenterError) {
      console.error('Error fetching commenter:', commenterError);
      return;
    }

    const commenterName = commenter.name || commenter.username || 'Someone';

    await createNotification({
      userId: postAuthorId,
      triggerUserId: commenterId,
      type: NOTIFICATION_TYPES.NEW_COMMENT,
      title: 'Commented on your article',
      message: `${commenterName} commented on your article "${postTitle}"`,
      postId
    });
    console.log(`✅ Created comment notification for post author: ${postAuthorId}`);
  } catch (error) {
    console.error('Error in createCommentNotification:', error);
  }
};

export default {
  createNotification,
  createNewArticleNotification,
  createCommentNotification,
  NOTIFICATION_TYPES
};
