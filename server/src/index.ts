import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { prisma } from './lib/prisma';
import contentRouter from './routes/content';
import streamRouter from './routes/stream';
import { ADDONS } from './config/addons';
import { deviceUserMiddleware } from './middleware/deviceUser';
import { nsfwGuard } from './middleware/nsfwGuard';
import homeRouter from './routes/home';
import userRouter from './routes/user';
import nsfwRouter from './routes/nsfw';
import moviesRouter from './routes/movies';
import tvRouter from './routes/tv';
import animeRouter from './routes/anime';
import { startAddonHealthMonitor, getAddonHealthSnapshot } from './services/addonHealth';
import { cache } from './services/cache';
import { tmdb as tmdbService } from './services/tmdb';

dotenv.config();

const PORT = process.env.PORT || 3001;

// Validate critical environment variables
const REQUIRED_ENV = ['TMDB_API_KEY', 'POSTGRES_PRISMA_URL', 'KV_URL', 'JWT_SECRET'];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(`❌ CRITICAL ERROR: Missing required environment variables: ${missingEnv.join(', ')}`);
}

const app = express();

// Security middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  contentSecurityPolicy: false,
}));
app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Anonymous User Fingerprinting
app.use(deviceUserMiddleware);

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/diag', async (req, res) => {
  const diag: any = {
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      TMDB_KEY_SET: !!process.env.TMDB_API_KEY,
      POSTGRES_SET: !!process.env.POSTGRES_PRISMA_URL,
      KV_SET: !!process.env.KV_URL,
    },
    database: 'unknown',
    kv: 'unknown',
    tmdb: 'unknown',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    diag.database = 'connected';
  } catch (err: any) {
    diag.database = `error: ${err.message}`;
  }

  diag.kv = cache.isRedisHealthy() ? 'connected' : 'disconnected (using memory fallback)';

  try {
    const trending = await tmdbService.getTrending('movie', 'day');
    diag.tmdb = trending.length > 0 ? 'connected' : 'no_results (unauthorized or empty)';
  } catch (err: any) {
    diag.tmdb = `error: ${err.message}`;
  }

  res.json(diag);
});

app.get('/api/health/addons', (_req, res) => {
  res.json(getAddonHealthSnapshot());
});

app.get('/api/health', async (req, res) => {
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      TMDB_KEY: process.env.TMDB_API_KEY ? `${process.env.TMDB_API_KEY.substring(0, 4)}***` : 'MISSING',
      POSTGRES: !!process.env.POSTGRES_PRISMA_URL,
      KV: !!process.env.KV_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
    },
    database: 'unknown',
    cache: 'unknown',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'connected';
  } catch (err: any) {
    health.status = 'error';
    health.database = `error: ${err.message}`;
  }

  health.cache = cache.isRedisHealthy() ? 'connected' : 'memory_fallback';

  if (health.status === 'error') {
    res.status(500).json(health);
  } else {
    res.status(200).json(health);
  }
});

// Proxy Routes based on Stremio Protocol Requirements
app.use('/api/content', contentRouter);
app.use('/api/stream', streamRouter);
app.use('/api/home', homeRouter);
app.use('/api/user', userRouter);
app.use('/api/movies', moviesRouter);
app.use('/api/tv', tvRouter);
app.use('/api/anime', animeRouter);

// Protected NSFW routes
app.use('/api/nsfw', nsfwGuard, nsfwRouter);

app.get('/api/addons/manifest.json', (req, res) => {
  res.status(200).json({
    id: 'org.streamhub.proxy',
    name: 'StreamHub Proxy',
    version: '1.0.0',
    catalogs: [
      { type: 'movie', id: 'streamhub_movies' },
      { type: 'series', id: 'streamhub_series' }
    ],
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie', 'series', 'anime', 'other']
  });
});

// Dual mode: start server for local dev, or export for Vercel serverless
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    startAddonHealthMonitor();
  });
}

// Vercel serverless handler
export default app;
