import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import blogRouter from './routes/blogRouter.js';
import uploadRouter from './routes/uploadSupabase.js';
import notificationsRouter from './routes/notifications.js';
import commentsRouter from './routes/comments.js';
import likesRouter from './routes/likes.js';
import { getSupabase } from './config/database.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'https://personal-blog-project-six.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      (process.env.NODE_ENV === 'development' && (origin.includes('localhost') || origin.includes('127.0.0.1')))
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'If-Modified-Since', 'If-None-Match', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['ETag', 'Last-Modified']
}));

app.options('*', cors());

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, error: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
app.use('/auth/check-email', authLimiter);

app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('Invalid JSON in request body');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

app.get('/health', async (req, res) => {
  let dbStatus = 'HEALTHY';
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) dbStatus = 'UNHEALTHY';
  } catch (err) {
    dbStatus = 'UNHEALTHY';
  }

  res.json({
    status: dbStatus === 'HEALTHY' ? 'OK' : 'DEGRADED',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/blog', blogRouter);
app.use('/upload', uploadRouter);
app.use('/notifications', notificationsRouter);
app.use('/comments', commentsRouter);
app.use('/likes', likesRouter);

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  if (req.headers.origin) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  res.status(error.status || 500).json({
    error: error.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

export default app;
