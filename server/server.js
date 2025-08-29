import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables first
dotenv.config();

// Import routes
import authRouter from './routes/auth.mjs';
import adminRouter from './routes/admin.mjs';
import blogRouter from './routes/blogRouter.js';
import uploadRouter from './routes/uploadSupabase.mjs';
import notificationsRouter from './routes/notifications.mjs';
import commentsRouter from './routes/comments.mjs';
// Note: posts.js contains individual functions, not a router

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://personal-blog-project-six.vercel.app',
    'https://personal-blog-project-nijtz5qay-chalconners-projects.vercel.app',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (only in development)
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
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/blog', blogRouter);
app.use('/upload', uploadRouter);
app.use('/notifications', notificationsRouter);
app.use('/comments', commentsRouter);
// Posts routes are handled within admin routes

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    error: error.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Server starting up...');
    console.log(`📡 Server is running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}`);
    console.log(`💻 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    console.log('✅ Server is ready to accept connections');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  process.exit(0);
});

export default app;
