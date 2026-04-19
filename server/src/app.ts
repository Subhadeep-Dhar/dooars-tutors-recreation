import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import profileRoutes from './modules/profiles/profile.routes';
import searchRoutes from './modules/search/search.routes';
import reviewRoutes  from './modules/reviews/review.routes';

const app = express();

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true, // required for httpOnly cookie refresh tokens
  })
);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api', generalLimiter);

// ── Health check — used by Railway for deployment verification ───────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API routes — added here as modules are built ─────────────────────────────
app.use('/api/v1/auth',     authRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/search',   searchRoutes);
app.use('/api/v1/reviews',  reviewRoutes);
// app.use('/api/v1/admin',    adminRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler — must be last ──────────────────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────────────────────
async function start() {
  if (env.MONGODB_URI) {
    await connectDB();
  } else {
    console.warn('⚠️  MONGODB_URI not provided — skipping database connection');
  }
  if (env.REDIS_URL) {
    await connectRedis();
  } else {
    console.warn('⚠️  REDIS_URL not provided — running without cache');
  }

  app.listen(env.PORT, () => {
    console.info(`🚀 Server running on http://localhost:${env.PORT}`);
    console.info(`   Environment: ${env.NODE_ENV}`);
    console.info(`   Health check: http://localhost:${env.PORT}/health`);
  });
}

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});