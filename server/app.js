import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import blogRouter from './routes/blogRouter.js';
import uploadRouter, { MAX_IMAGE_SIZE_MB } from './routes/uploadSupabase.js';
import notificationsRouter from './routes/notifications.js';
import commentsRouter from './routes/comments.js';
import likesRouter from './routes/likes.js';
import { getSupabase } from './config/database.js';

const app = express();
const READINESS_TIMEOUT_MS = 4000;

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use((req, res, next) => {
  const requestId = randomUUID();
  const startedAt = process.hrtime.bigint();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    };

    if (process.env.NODE_ENV === 'production') {
      if (req.path !== '/health' || res.statusCode >= 400) {
        console.log(JSON.stringify(logEntry));
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.log(
        `${logEntry.method} ${logEntry.path} - ${logEntry.status} - ${logEntry.durationMs}ms - ${requestId}`,
      );
    }
  });

  next();
});

const developmentOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
];
const allowedOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.NODE_ENV === 'development' ? developmentOrigins : [])
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'If-Modified-Since', 'If-None-Match', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['ETag', 'Last-Modified', 'X-Request-ID']
}));

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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    database: 'NOT_CHECKED',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/ready', async (req, res) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), READINESS_TIMEOUT_MS);

  try {
    const { error } = await getSupabase()
      .from('users')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);

    if (error) throw error;

    res.json({
      status: 'OK',
      database: 'HEALTHY',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch {
    res.status(503).json({
      status: 'DEGRADED',
      database: 'UNHEALTHY',
      reason: controller.signal.aborted ? 'TIMEOUT' : 'QUERY_FAILED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  } finally {
    clearTimeout(timeoutId);
  }
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
  console.error('Global error handler:', {
    requestId: req.requestId,
    message: error.message,
    type: error.type,
    code: error.code,
    status: error.status || error.statusCode
  });
  if (req.headers.origin && allowedOrigins.includes(req.headers.origin)) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  const isMalformedJson = error.type === 'entity.parse.failed';
  const isUploadValidationError = ['LIMIT_FILE_SIZE', 'LIMIT_UNEXPECTED_FILE'].includes(error.code);
  const status = isMalformedJson || isUploadValidationError
    ? 400
    : error.status || (error.message === 'Not allowed by CORS' ? 403 : 500);
  const validationMessage = error.code === 'LIMIT_FILE_SIZE'
    ? `File too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB`
    : error.code === 'LIMIT_UNEXPECTED_FILE'
      ? 'Unexpected upload field'
      : null;
  const message = process.env.NODE_ENV === 'production' && status >= 500
    ? 'Internal Server Error'
    : validationMessage || error.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

export default app;
