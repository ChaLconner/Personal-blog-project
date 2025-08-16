import express from 'express';
import { supabase } from '../config/database.js';

const adminRouter = express.Router();

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  try {
    // Get user from Supabase
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
      return res.status(401).json({ error: "Unauthorized or token expired" });
    }

    const supabaseUserId = data.user.id;
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUserId)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return res.status(403).json({ error: "Access denied: Admin privileges required" });
    }

    req.user = userData;
    req.userId = supabaseUserId;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get all posts for admin (with additional info)
adminRouter.get('/posts', requireAdmin, async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: "Error fetching posts" });
    }

    res.json({
      success: true,
      data: posts,
      total: posts.length
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new post
adminRouter.post('/posts', requireAdmin, async (req, res) => {
  try {
    const { title, description, content, image, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const { data: newPost, error } = await supabase
      .from('blog_posts')
      .insert([{
        title: title.trim(),
        description: description?.trim() || '',
        content: content.trim(),
        image: image || null,
        category: category?.trim() || null,
        author: req.user.name,
        date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "Error creating post" });
    }

    res.status(201).json({
      success: true,
      data: newPost,
      message: "Post created successfully"
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update post
adminRouter.put('/posts/:id', requireAdmin, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { title, description, content, image, category } = req.body;

    if (!postId || isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const { data: updatedPost, error } = await supabase
      .from('blog_posts')
      .update({
        title: title.trim(),
        description: description?.trim() || '',
        content: content.trim(),
        image: image || null,
        category: category?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: "Post not found" });
      }
      return res.status(500).json({ error: "Error updating post" });
    }

    res.json({
      success: true,
      data: updatedPost,
      message: "Post updated successfully"
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete post
adminRouter.delete('/posts/:id', requireAdmin, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    if (!postId || isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      return res.status(500).json({ error: "Error deleting post" });
    }

    res.json({
      success: true,
      message: "Post deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all comments for admin
adminRouter.get('/comments', requireAdmin, async (req, res) => {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        blog_posts(title)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: "Error fetching comments" });
    }

    res.json({
      success: true,
      data: comments,
      total: comments.length
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete comment
adminRouter.delete('/comments/:id', requireAdmin, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);

    if (!commentId || isNaN(commentId)) {
      return res.status(400).json({ error: "Invalid comment ID" });
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      return res.status(500).json({ error: "Error deleting comment" });
    }

    res.json({
      success: true,
      message: "Comment deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get dashboard stats
adminRouter.get('/stats', requireAdmin, async (req, res) => {
  try {
    // Get posts count
    const { count: totalPosts, error: postsError } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true });

    if (postsError) {
      return res.status(500).json({ error: "Error fetching posts stats" });
    }

    // Get comments count
    const { count: totalComments, error: commentsError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true });

    if (commentsError) {
      return res.status(500).json({ error: "Error fetching comments stats" });
    }

    // Get total likes
    const { data: likesData, error: likesError } = await supabase
      .from('blog_posts')
      .select('likes');

    if (likesError) {
      return res.status(500).json({ error: "Error fetching likes stats" });
    }

    const totalLikes = (likesData || []).reduce((sum, post) => sum + (post.likes || 0), 0);

    // Get categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('blog_posts')
      .select('category')
      .not('category', 'is', null);

    if (categoriesError) {
      return res.status(500).json({ error: "Error fetching categories stats" });
    }

    const categories = [...new Set(
      (categoriesData || [])
        .map(item => item.category)
        .filter(category => category && category.trim().length > 0)
    )];

    res.json({
      success: true,
      data: {
        totalPosts: totalPosts || 0,
        totalComments: totalComments || 0,
        totalLikes: totalLikes || 0,
        totalCategories: categories.length,
        categories
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default adminRouter;
