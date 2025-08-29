import { supabase } from '../config/database.js';

export async function getAllPosts(req, res) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, title, description, image, author, date, 
      category:categories(name)
    `)
    .eq('status_id', 2) // เฉพาะบทความที่ published
    .order('date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  
  // Transform data to match frontend expectations
  const transformedData = data.map(post => ({
    id: post.id,
    title: post.title,
    description: post.description,
    image: post.image,
    author: post.author || 'Admin', // ใช้ author จาก posts table
    date: post.date,
    category: post.category?.name || 'Uncategorized'
  }));
  
  res.json(transformedData);
}

export async function likePost(req, res) {
  try {
    const { postId } = req.params;
    const userId = req.userId; // From protectUser middleware
    
    if (!postId || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, likes_count')
      .eq('id', postId)
      .eq('status_id', 2)
      .single();

    if (postError || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user already liked this post
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (likeCheckError && likeCheckError.code !== 'PGRST116') {
      throw likeCheckError;
    }

    let newLikesCount;
    let isLiked;

    if (existingLike) {
      // Unlike: Remove like record
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Decrease likes count
      newLikesCount = Math.max(0, (post.likes_count || 0) - 1);
      isLiked = false;
    } else {
      // Like: Add like record
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: userId,
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Increase likes count
      newLikesCount = (post.likes_count || 0) + 1;
      isLiked = true;
    }

    // Update post likes count
    const { error: updateError } = await supabase
      .from('posts')
      .update({ likes_count: newLikesCount })
      .eq('id', postId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      likes: newLikesCount,
      isLiked: isLiked,
      message: isLiked ? 'Post liked' : 'Post unliked'
    });

  } catch (error) {
    console.error('Error in likePost:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to toggle like on post' 
    });
  }
}

export async function checkPostLike(req, res) {
  try {
    const { postId } = req.params;
    const userId = req.userId; // From protectUser middleware
    
    if (!postId || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Check if user has liked this post
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (likeCheckError && likeCheckError.code !== 'PGRST116') {
      throw likeCheckError;
    }

    res.json({
      success: true,
      isLiked: !!existingLike
    });

  } catch (error) {
    console.error('Error in checkPostLike:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check like status',
      isLiked: false
    });
  }
}