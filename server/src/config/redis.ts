import Redis from 'ioredis';
import { env } from './env';

let redisClient: Redis | null = null;
let redisAvailable = false;

export async function connectRedis(): Promise<void> {
  if (env.NODE_ENV === 'development' && env.REDIS_URL === 'redis://localhost:6379') {
    console.info('ℹ️  Redis skipped in local dev — cache disabled');
    return;
  }

  try {
    if (!env.REDIS_URL) {
      console.info('ℹ️  Redis URL not set — cache disabled');
      return;
    }

    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    await redisClient.connect();
    redisAvailable = true;
    console.info('✅ Redis connected');

    redisClient.on('error', () => {
      redisAvailable = false;
    });
  } catch {
    console.warn('⚠️  Redis unavailable — running without cache');
    redisAvailable = false;
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  if (!redisAvailable || !redisClient) return null;
  try { return await redisClient.get(key); }
  catch { return null; }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (!redisAvailable || !redisClient) return;
  try { await redisClient.setex(key, ttlSeconds, value); }
  catch { }
}

export async function cacheDel(pattern: string): Promise<void> {
  if (!redisAvailable || !redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) await redisClient.del(...keys);
  } catch { }
}