import { createClient } from '@supabase/supabase-js';
import process from 'process';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Database service functions
export const dbService = {
  // Blog Posts
  async getAllPosts(filters = {}) {
    let query = supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    if (filters.limit) {
      query = query.limit(parseInt(filters.limit));
    }

    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Error fetching posts: ${error.message}`);
    }
    
    return data;
  },

  async getPostById(id) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching post: ${error.message}`);
    }

    return data;
  },

  async createPost(postData) {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([postData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating post: ${error.message}`);
    }

    return data;
  },

  async updatePost(id, postData) {
    const { data, error } = await supabase
      .from('blog_posts')
      .update(postData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating post: ${error.message}`);
    }

    return data;
  },

  async deletePost(id) {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting post: ${error.message}`);
    }

    return true;
  },

  // Comments
  async getCommentsByPostId(postId) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Error fetching comments: ${error.message}`);
    }

    return data;
  },

  async getAllComments() {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching comments: ${error.message}`);
    }

    return data;
  },

  async createComment(commentData) {
    const { data, error } = await supabase
      .from('comments')
      .insert([commentData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating comment: ${error.message}`);
    }

    return data;
  },

  // Categories
  async getCategories() {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      throw new Error(`Error fetching categories: ${error.message}`);
    }

    // Get unique categories
    const categories = [...new Set(data.map(item => item.category))];
    return categories;
  },

  // Stats
  async getStats() {
    // Get total posts
    const { count: totalPosts, error: postsError } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true });

    if (postsError) {
      throw new Error(`Error fetching posts count: ${postsError.message}`);
    }

    // Get total likes
    const { data: likesData, error: likesError } = await supabase
      .from('blog_posts')
      .select('likes');

    if (likesError) {
      throw new Error(`Error fetching likes: ${likesError.message}`);
    }

    const totalLikes = likesData.reduce((sum, post) => sum + (post.likes || 0), 0);

    // Get total comments
    const { count: totalComments, error: commentsError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true });

    if (commentsError) {
      throw new Error(`Error fetching comments count: ${commentsError.message}`);
    }

    // Get categories
    const categories = await this.getCategories();

    return {
      totalPosts: totalPosts || 0,
      totalLikes,
      totalComments: totalComments || 0,
      totalCategories: categories.length,
      categories
    };
  }
};
