
// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly configure dotenv to look for .env in the server directory
const envPath = path.join(__dirname, '.env');
console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('.env file loaded successfully');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
  console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET');
  console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
}

import express from 'express';
import cors from 'cors';

// Import routes
import authRouter from './routes/auth.mjs';
import adminRouter from './routes/admin.mjs';
import blogRouter from './routes/blogRouter.js';
import uploadRouter from './routes/uploadSupabase.mjs';
import notificationsRouter from './routes/notifications.mjs';
import commentsRouter from './routes/comments.mjs';
import likesRouter from './routes/likes.mjs';
// Note: posts.js contains individual functions, not a router

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
// Middleware
// Try to load optional security/performance middlewares dynamically so the
// server can still start if they aren't installed in the environment.
(async () => {
  try {
    const helmetModule = await import('helmet');
    const helmetFn = helmetModule.default || helmetModule;
    app.use(helmetFn());
  } catch (err) {
    console.warn('Optional dependency "helmet" not available — skipping.');
  }

  try {
    const compressionModule = await import('compression');
    const compressionFn = compressionModule.default || compressionModule;
    app.use(compressionFn());
  } catch (err) {
    console.warn('Optional dependency "compression" not available — skipping.');
  }

  try {
    const rateLimitModule = await import('express-rate-limit');
    const rateLimitFn = rateLimitModule.default || rateLimitModule;
    const limiter = rateLimitFn({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use(limiter);
  } catch (err) {
    console.warn('Optional dependency "express-rate-limit" not available — skipping.');
  }
})();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://personal-blog-project-six.vercel.app',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('Invalid JSON received:', buf.toString());
      res.status(400).json({ error: 'Invalid JSON in request body' });
      return;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Response time logging
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const ms = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2);
    if (process.env.NODE_ENV === 'development') {
      console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${ms}ms`);
    }
  });
  next();
});

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
app.use('/likes', likesRouter);
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
  console.error('Request details:', {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body,
    params: req.params,
    query: req.query
  });
  
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
