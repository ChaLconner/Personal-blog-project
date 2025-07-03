import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import process from 'process';

// Load environment variables first
dotenv.config();

// Debug environment variables
console.log('Environment check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET');

import { dbService } from './config/database.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Blog API Server is running!' });
});

// Blog Posts Routes
app.get('/api/posts', async (req, res) => {
  try {
    const { category, limit, search } = req.query;
    const filters = { category, limit, search };
    
    const posts = await dbService.getAllPosts(filters);

    res.json({
      success: true,
      data: posts,
      total: posts.length
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blog posts',
      error: error.message
    });
  }
});

// Get single blog post
app.get('/api/posts/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await dbService.getPostById(postId);
    
    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(404).json({
      success: false,
      message: 'Blog post not found',
      error: error.message
    });
  }
});

// Comments Routes
app.get('/api/comments', async (req, res) => {
  try {
    const { postId } = req.query;
    let comments;

    if (postId) {
      comments = await dbService.getCommentsByPostId(parseInt(postId));
    } else {
      comments = await dbService.getAllComments();
    }

    res.json({
      success: true,
      data: comments,
      total: comments.length
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: error.message
    });
  }
});

// Create new comment
app.post('/api/comments', async (req, res) => {
  try {
    const { post_id, name, comment, image } = req.body;
    
    if (!post_id || !name || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: post_id, name, comment'
      });
    }

    const newComment = await dbService.createComment({
      post_id: parseInt(post_id),
      name,
      comment,
      image: image || 'https://via.placeholder.com/48x48?text=U',
      date: new Date().toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    });

    res.status(201).json({
      success: true,
      data: newComment,
      message: 'Comment created successfully'
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating comment',
      error: error.message
    });
  }
});

// Categories Route
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await dbService.getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// Stats Route
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await dbService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
});
