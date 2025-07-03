import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import process from 'process';

// Load environment variables first - ES module syntax
dotenv.config();

// Debug environment variables
console.log('Environment check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET');

import { dbService } from './config/database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware (for development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Blog API Server is running!' });
});

// Blog Posts Routes
app.get('/api/posts', async (req, res) => {
  try {
    const { category, limit, search } = req.query;
    
    // Validate limit parameter
    let validatedLimit = null;
    if (limit) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum <= 0 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid limit: must be a positive number between 1 and 100'
        });
      }
      validatedLimit = limitNum;
    }
    
    const filters = { 
      category: category || null, 
      limit: validatedLimit, 
      search: search ? search.trim() : null 
    };
    
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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get single blog post
app.get('/api/posts/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    // Validate post ID
    if (isNaN(postId) || postId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID: must be a positive number'
      });
    }
    
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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Post not found'
    });
  }
});

// Comments Routes
app.get('/api/comments', async (req, res) => {
  try {
    const { postId } = req.query;
    let comments;

    if (postId) {
      const postIdNum = parseInt(postId);
      if (isNaN(postIdNum) || postIdNum <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid postId: must be a positive number'
        });
      }
      comments = await dbService.getCommentsByPostId(postIdNum);
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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create new comment
app.post('/api/comments', async (req, res) => {
  try {
    const { post_id, name, comment, image } = req.body;
    
    // Validate required fields
    if (!post_id || !name || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: post_id, name, comment'
      });
    }

    // Validate post_id is a valid number
    const postIdNum = parseInt(post_id);
    if (isNaN(postIdNum) || postIdNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post_id: must be a positive number'
      });
    }

    // Validate name and comment length
    if (name.trim().length === 0 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 1 and 100 characters'
      });
    }

    if (comment.trim().length === 0 || comment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be between 1 and 1000 characters'
      });
    }

    // Check if post exists
    try {
      await dbService.getPostById(postIdNum);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const newComment = await dbService.createComment({
      post_id: postIdNum,
      name: name.trim(),
      comment: comment.trim(),
      image: image || 'https://via.placeholder.com/48x48?text=U',
      created_at: new Date().toISOString()
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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
