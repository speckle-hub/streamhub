import Redis from 'ioredis';
import { kv } from '@vercel/kv';

// ── In-memory fallback store ──────────────────────────────────────────────
interface MemEntry { value: string; expiresAt: number; }
const memStore = new Map<string, MemEntry>();

// ── Circuit Breaker ───────────────────────────────────────────────────────
const FAILURE_THRESHOLD = 3;
const RECOVERY_MS = 30_000;

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private openedAt = 0;

  isAvailable(): boolean {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'OPEN') {
      if (Date.now() - this.openedAt >= RECOVERY_MS) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  recordFailure() {
    this.failures += 1;
    if (this.failures >= FAILURE_THRESHOLD) {
      this.state = 'OPEN';
      this.openedAt = Date.now();
      console.warn('[Cache] Circuit breaker OPEN — falling back to memory cache');
    }
  }
}

// ── Cache Service ─────────────────────────────────────────────────────────
class CacheService {
  private redisClient: Redis | null = null;
  private isVercelKV: boolean;
  private isConnected = false;
  private breaker = new CircuitBreaker();

  constructor() {
    this.isVercelKV = !!process.env.KV_URL;

    if (!this.isVercelKV) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      try {
        this.redisClient = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
          connectTimeout: 2000,
          lazyConnect: true,
        });

        this.redisClient.on('error', (err) => {
          if (this.isConnected) {
            console.warn('[Cache] Redis error:', err.message);
            this.breaker.recordFailure();
          }
          this.isConnected = false;
        });

        this.redisClient.on('connect', () => {
          console.log('[Cache] Local Redis connected');
          this.isConnected = true;
          this.breaker.recordSuccess();
        });
      } catch (err) {
        console.warn('[Cache] Local Redis init failed:', (err as Error).message);
      }
    } else {
      // Vercel KV uses serverless REST, so it is inherently "connected"
      console.log('[Cache] Vercel KV Enabled');
      this.isConnected = true;
    }
  }

  private memGet(key: string): string | null {
    const entry = memStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      memStore.delete(key);
      return null;
    }
    return entry.value;
  }

  private memSet(key: string, value: string, ttl: number) {
    memStore.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
    if (memStore.size > 500) {
      const first = memStore.keys().next().value;
      if (first) memStore.delete(first);
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.breaker.isAvailable()) {
      try {
        let val;
        if (this.isVercelKV) {
          val = await kv.get(key) as string | null | undefined; // Vercel KV sometimes returns raw values, ensure it is string if possible, or we serialize at set.
          // Wait, if we set string, KV might return string or object if JSON parsed.
          // By our app design, TMDB responses are stringified JSON. Wait, in server we store strings.
          if (val && typeof val !== 'string') {
            val = JSON.stringify(val);
          }
        } else if (this.redisClient) {
          val = await this.redisClient.get(key);
        }

        this.breaker.recordSuccess();
        if (val) return val;
      } catch (err) {
        this.breaker.recordFailure();
      }
    }
    return this.memGet(key);
  }

  async set(key: string, value: string, ttl: number = 3600): Promise<void> {
    this.memSet(key, value, ttl);

    if (this.isConnected && this.breaker.isAvailable()) {
      try {
        if (this.isVercelKV) {
          await kv.set(key, value, { ex: ttl });
        } else if (this.redisClient) {
          await this.redisClient.set(key, value, 'EX', ttl);
        }
        this.breaker.recordSuccess();
      } catch (err) {
        this.breaker.recordFailure();
      }
    }
  }

  async del(key: string): Promise<void> {
    memStore.delete(key);
    if (this.isConnected && this.breaker.isAvailable()) {
      try {
        if (this.isVercelKV) {
          await kv.del(key);
        } else if (this.redisClient) {
          await this.redisClient.del(key);
        }
      } catch (_) {}
    }
  }

  async invalidateByPrefix(prefix: string): Promise<void> {
    for (const key of memStore.keys()) {
      if (key.startsWith(prefix)) memStore.delete(key);
    }
    if (this.isConnected && this.breaker.isAvailable()) {
      try {
        if (this.isVercelKV) {
          const keys = await kv.keys(`${prefix}*`);
          if (keys.length > 0) await kv.del(...keys);
        } else if (this.redisClient) {
          const keys = await this.redisClient.keys(`${prefix}*`);
          if (keys.length > 0) await this.redisClient.del(...keys);
        }
      } catch (_) {}
    }
  }

  isRedisHealthy(): boolean {
    return this.isConnected && this.breaker.isAvailable();
  }
}

export const cache = new CacheService();
