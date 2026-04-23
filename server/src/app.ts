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
import reviewRoutes from './modules/reviews/review.routes';
import adminRoutes from './modules/admin/admin.routes';
import mediaRoutes from './modules/media/media.routes';

const app = express();

// ── Security ─────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
  })
);

// ── Body parsing ─────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Rate limiting ────────────────────────────────────
app.use('/api', generalLimiter);

// ── Health check (USED BY RENDER + UPTIME ROBOT) ─────
app.get('/api/v1/health', (_req, res) => {
  res.json({
    ok: true,
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ───────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1', mediaRoutes);

// ── 404 handler ──────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Error handler ────────────────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────
async function start() {
  try {
    if (env.MONGODB_URI) {
      await connectDB();
    } else {
      console.warn('⚠️  No MongoDB URI');
    }

    if (env.REDIS_URL) {
      await connectRedis();
    } else {
      console.warn('⚠️  No Redis (cache disabled)');
    }

    const PORT = env.PORT || 4000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`Health: /api/v1/health`);
    });
  } catch (err) {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  }
}

start();

// ── Graceful shutdown ────────────────────────────────
process.on('SIGTERM', () => {
  console.info('SIGTERM received. Shutting down...');
  process.exit(0);
});