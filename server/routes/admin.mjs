import express from 'express';
import { getSupabase } from '../config/database.js';
import { createNewArticleNotification } from '../utils/notificationHelpers.mjs';

// Get the actual Supabase client
const supabase = getSupabase();

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
    // Support optional pagination to avoid fetching huge payloads
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const offset = parseInt(req.query.offset) || 0;

    // Fetch posts with joined category and status in one query to avoid N+1
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        description,
        content,
        image,
        author,
        date,
        likes_count,
        category_id,
        status_id,
        categories(id, name),
        statuses(id, status)
      `)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Error fetching posts (admin):', error);
      return res.status(500).json({ error: 'Error fetching posts' });
    }

    const transformedPosts = (posts || []).map(post => ({
      id: post.id,
      title: post.title,
      description: post.description,
      content: post.content,
      image: post.image,
      author: post.author || 'Admin',
      date: post.date,
      likes_count: post.likes_count || 0,
      category: post.categories?.name || (post.category_id ? 'Uncategorized' : null),
      category_id: post.category_id,
      status: post.statuses?.status || (post.status_id ? 'published' : null),
      status_id: post.status_id
    }));

    res.json({
      success: true,
      data: transformedPosts,
      total: transformedPosts.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('❌ Admin posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new post
adminRouter.post('/posts', requireAdmin, async (req, res) => {
  try {
    const { title, description, content, image, category, status, author } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    // Find category ID if category name is provided
    let categoryId = null;
    if (category) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', category)
        .single();
      
      if (!categoryError && categoryData) {
        categoryId = categoryData.id;
      }
    }

    // Find status ID (default to published)
    const statusName = status || 'published';
    const { data: statusData, error: statusError } = await supabase
      .from('statuses')
      .select('id')
      .eq('status', statusName)
      .single();

    let statusId = statusData?.id || 2; // Default to published (id: 2)

    const { data: newPost, error } = await supabase
      .from('posts')
      .insert([{
        title: title.trim(),
        description: description?.trim() || null,
        content: content.trim(),
        image: image || '',
        author: author?.trim() || 'Admin', // เพิ่ม author
        category_id: categoryId,
        status_id: statusId,
        likes_count: 0
      }])
      .select(`
        id,
        title,
        description,
        content,
        image,
        author,
        date,
        likes_count,
        categories(id, name),
        statuses(id, status)
      `)
      .single();

    if (error) {
      console.error('❌ Error creating post:', error);
      return res.status(500).json({ error: "Error creating post" });
    }


    
    // Create notification if the post is published
    if (statusName === 'published') {
      try {
        // Get the admin user who created the post
        const adminUserId = req.user.id;
        await createNewArticleNotification(adminUserId, newPost.id, newPost.title);

      } catch (notificationError) {
        console.error('❌ Error creating notifications:', notificationError);
        // Don't fail the post creation if notification fails
      }
    }

    res.status(201).json({
      success: true,
      data: newPost,
      message: "Post created successfully"
    });
  } catch (error) {
    console.error('❌ Create post error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update post
adminRouter.put('/posts/:id', requireAdmin, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { title, description, content, image, category, status, author } = req.body;

    if (!postId || isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    // Find category ID if category name is provided
    let categoryId = null;
    if (category) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', category)
        .single();
      
      if (!categoryError && categoryData) {
        categoryId = categoryData.id;
      }
    }

    // Find status ID
    let statusId = null;
    if (status) {
      const { data: statusData, error: statusError } = await supabase
        .from('statuses')
        .select('id')
        .eq('status', status)
        .single();
      
      if (!statusError && statusData) {
        statusId = statusData.id;
      }
    }

    const updateData = {
      title: title.trim(),
      description: description?.trim() || null,
      content: content.trim()
    };

    if (image !== undefined) updateData.image = image || '';
    if (author !== undefined) updateData.author = author?.trim() || 'Admin'; // เพิ่ม author
    if (categoryId !== null) updateData.category_id = categoryId;
    if (statusId !== null) updateData.status_id = statusId;

    // Check if this is changing from draft to published
    const { data: currentPost, error: currentError } = await supabase
      .from('posts')
      .select('statuses(status)')
      .eq('id', postId)
      .single();

    const wasNotPublished = currentPost && currentPost.statuses.status !== 'published';
    const isNowPublished = status === 'published';

    const { data: updatedPost, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select(`
        id,
        title,
        description,
        content,
        image,
        date,
        likes_count,
        categories(id, name),
        statuses(id, status)
      `)
      .single();

    if (error) {
      console.error('❌ Error updating post:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: "Post not found" });
      }
      return res.status(500).json({ error: "Error updating post" });
    }


    
    // Create notification if the post was just published
    if (wasNotPublished && isNowPublished) {
      try {
        const adminUserId = req.user.id;
        await createNewArticleNotification(adminUserId, updatedPost.id, updatedPost.title);

      } catch (notificationError) {
        console.error('❌ Error creating notifications:', notificationError);
        // Don't fail the post update if notification fails
      }
    }

    res.json({
      success: true,
      data: updatedPost,
      message: "Post updated successfully"
    });
  } catch (error) {
    console.error('❌ Update post error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single post for editing
adminRouter.get('/posts/:id', requireAdmin, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    if (!postId || isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    // Get post data
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) {
      console.error('❌ Error fetching post:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: "Post not found" });
      }
      return res.status(500).json({ error: "Error fetching post" });
    }

    // Get category name if category_id exists
    let categoryName = '';
    if (post.category_id) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('name')
        .eq('id', post.category_id)
        .single();
      
      if (categoryData) {
        categoryName = categoryData.name;
      }
    }

    // Get status if status_id exists
    let statusName = 'published';
    if (post.status_id) {
      const { data: statusData } = await supabase
        .from('statuses')
        .select('status')
        .eq('id', post.status_id)
        .single();
      
      if (statusData) {
        statusName = statusData.status;
      }
    }

    // Transform the data
    const transformedPost = {
      id: post.id,
      title: post.title,
      description: post.description,
      content: post.content,
      image: post.image,
      author: post.author || 'Admin', // เพิ่ม author
      date: post.date,
      likes_count: post.likes_count,
      category: categoryName,
      category_id: post.category_id,
      status: statusName,
      status_id: post.status_id
    };

    res.status(200).json({ success: true, data: transformedPost });
  } catch (error) {
    console.error('❌ Error in get post:', error);
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
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('❌ Error deleting post:', error);
      return res.status(500).json({ error: "Error deleting post" });
    }


    res.json({
      success: true,
      message: "Post deleted successfully"
    });
  } catch (error) {
    console.error('❌ Delete post error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all comments for admin
adminRouter.get('/comments', requireAdmin, async (req, res) => {
  try {
    // Pagination to avoid returning extremely large sets which can timeout
    const limit = Math.min(parseInt(req.query.limit) || 200, 2000);
    const offset = parseInt(req.query.offset) || 0;

    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        posts(title)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: 'Error fetching comments' });
    }

    res.json({
      success: true,
      data: comments,
      total: comments.length,
      limit,
      offset
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
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
    // Collect warnings for partial failures rather than failing the whole endpoint
    const warnings = [];

    // Get posts count
    let totalPosts = 0;
    try {
      const { count, error: postsError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });
      if (postsError) {
        console.error('Error fetching posts count:', postsError);
        warnings.push('Could not fetch total posts count');
      } else {
        totalPosts = count || 0;
      }
    } catch (err) {
      console.error('Unexpected error fetching posts count:', err);
      warnings.push('Unexpected error fetching total posts count');
    }

    // Get comments count
    let totalComments = 0;
    try {
      const { count, error: commentsError } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true });
      if (commentsError) {
        console.error('Error fetching comments count:', commentsError);
        warnings.push('Could not fetch total comments count');
      } else {
        totalComments = count || 0;
      }
    } catch (err) {
      console.error('Unexpected error fetching comments count:', err);
      warnings.push('Unexpected error fetching total comments count');
    }

    // Get total likes (resilient: fallback to 0 on error)
    let totalLikes = 0;
    try {
      const { data: likesData, error: likesError } = await supabase
        .from('posts')
        .select('likes_count');

      if (likesError) {
        console.error('Error fetching likes stats:', likesError);
        warnings.push('Could not fetch likes totals');
      } else {
        totalLikes = (likesData || []).reduce((sum, post) => sum + (post.likes_count || 0), 0);
      }
    } catch (err) {
      console.error('Unexpected error fetching likes stats:', err);
      warnings.push('Unexpected error fetching likes totals');
    }

    // Get categories (best-effort)
    let categories = [];
    try {
      const { data: categoryRows, error: categoryRowsError } = await supabase
        .from('categories')
        .select('name');

      if (categoryRowsError) {
        console.error('Error fetching categories stats:', categoryRowsError);
        warnings.push('Could not fetch category list');
      } else {
        categories = (categoryRows || []).map(c => c.name).filter(Boolean);
      }
    } catch (err) {
      console.error('Unexpected error fetching categories:', err);
      warnings.push('Unexpected error fetching categories');
    }

    res.json({
      success: true,
      data: {
        totalPosts: totalPosts || 0,
        totalComments: totalComments || 0,
        totalLikes: totalLikes || 0,
        totalCategories: categories.length,
        categories,
        warnings
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== CATEGORY MANAGEMENT =====

// Get all categories for admin
adminRouter.get('/categories', requireAdmin, async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: "Error fetching categories" });
    }

    res.json({
      success: true,
      data: categories,
      total: categories.length
    });
  } catch (error) {
    console.error('Admin categories error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new category
adminRouter.post('/categories', requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    // Check if category already exists
    const { data: existing, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', name.trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return res.status(500).json({ error: "Error checking existing categories" });
    }

    if (existing) {
      return res.status(409).json({ error: "Category already exists" });
    }

    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert([{
        name: name.trim()
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "Error creating category" });
    }

    res.status(201).json({
      success: true,
      data: newCategory,
      message: "Category created successfully"
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update category
adminRouter.put('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const { name } = req.body;

    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    // Check if category name already exists (excluding current category)
    const { data: existing, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', name.trim())
      .neq('id', categoryId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return res.status(500).json({ error: "Error checking existing categories" });
    }

    if (existing) {
      return res.status(409).json({ error: "Category name already exists" });
    }

    const { data: updatedCategory, error } = await supabase
      .from('categories')
      .update({
        name: name.trim()
      })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: "Category not found" });
      }
      return res.status(500).json({ error: "Error updating category" });
    }

    res.json({
      success: true,
      data: updatedCategory,
      message: "Category updated successfully"
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete category
adminRouter.delete('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);

    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    // Check if category is being used by any posts
    const { data: posts, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1);

    if (postError) {
      return res.status(500).json({ error: "Error checking category usage" });
    }

    if (posts && posts.length > 0) {
      return res.status(409).json({ 
        error: "Cannot delete category. It is being used by existing posts."
      });
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      return res.status(500).json({ error: "Error deleting category" });
    }

    res.json({
      success: true,
      message: "Category deleted successfully"
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default adminRouter;
