import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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
    const { data, error } = await supabase
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
    const { data: users, error } = await supabase
      .from('users')
      .select('id')
      .neq('id', authorId);

    if (error) {
      console.error('Error fetching users for article notification:', error);
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

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      console.error('Error creating article notifications:', insertError);
    } else {

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
    const { data: commenter, error: commenterError } = await supabase
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


  } catch (error) {
    console.error('Error in createCommentNotification:', error);
  }
};

// Create notification when someone replies to a comment
export const createCommentReplyNotification = async (replierId, originalCommenterId, postId, postTitle) => {
  try {
    // Don't notify if someone replies to their own comment
    if (replierId === originalCommenterId) {
      return;
    }

    // Get replier's name
    const { data: replier, error: replierError } = await supabase
      .from('users')
      .select('name, username')
      .eq('id', replierId)
      .single();

    if (replierError) {
      console.error('Error fetching replier:', replierError);
      return;
    }

    const replierName = replier.name || replier.username || 'Someone';

    await createNotification({
      userId: originalCommenterId,
      triggerUserId: replierId,
      type: NOTIFICATION_TYPES.COMMENT_REPLY,
      title: 'Comment on the article you have commented on',
      message: `${replierName} also commented on the article "${postTitle}" that you commented on`,
      postId
    });


  } catch (error) {
    console.error('Error in createCommentReplyNotification:', error);
  }
};

export default {
  createNotification,
  createNewArticleNotification,
  createCommentNotification,
  createCommentReplyNotification,
  NOTIFICATION_TYPES
};
