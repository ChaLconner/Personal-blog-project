import express from 'express';
import cors from 'cors';

// Import all routes
import authRoutes from '../server/routes/auth.mjs';
import adminRoutes from '../server/routes/admin.mjs';
import uploadRoutes from '../server/routes/upload.mjs';
import blogRoutes from '../server/routes/blogRouter.js';
import postRoutes from '../server/routes/posts.js';

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://personal-blog-project-six.vercel.app',
    'https://personal-blog-project-nijtz5qay-chalconners-projects.vercel.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/upload', uploadRoutes);
app.use('/blog', blogRoutes);
app.use('/posts', postRoutes);

// Health check endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Personal Blog API is running on Vercel!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

export default app;
