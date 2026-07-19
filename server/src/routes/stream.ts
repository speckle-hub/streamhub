import { Router, Request, Response } from 'express';
import axios from 'axios';
import path from 'path';
import { cache } from '../services/cache';
import { verifyToken, createToken } from '../services/tokens';

const router = Router();

async function checkConcurrentStreams(ip: string): Promise<number> {
  const key = `streams:${ip}`;
  const current = await cache.get(key);
  return current ? parseInt(current, 10) : 0;
}

const MIME_TYPES: Record<string, string> = {
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
  '.mp4': 'video/mp4',
  '.mkv': 'video/x-matroska',
};

router.get('/proxy', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Missing token' });
    }

    let payload: { url: string; addon: string };
    try {
      payload = verifyToken(token);
    } catch (e: any) {
      return res.status(403).json({ error: e.message });
    }

    if (!payload.url) {
      return res.status(400).json({ error: 'No URL in token' });
    }

    // Rate limit: max 3 concurrent streams per IP
    if (req.ip) {
      const userStreams = await checkConcurrentStreams(req.ip);
      if (userStreams >= parseInt(process.env.MAX_CONCURRENT_STREAMS || '3')) {
        return res.status(429).json({ error: 'Too many concurrent streams' });
      }
    }

    const upstreamHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (compatible; StreamHub/1.0)',
    };

    // Forward Range header for video seeking
    if (req.headers.range) {
      upstreamHeaders['Range'] = req.headers.range as string;
    }

    // Set CORS headers so browser doesn't block video stream
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    // Detect Content-Type based on extension for better browser support
    const urlObj = new URL(payload.url);
    const ext = path.extname(urlObj.pathname).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'video/mp4';

    // HLS manifest: proxy and rewrite segment URLs
    if (payload.url.includes('.m3u8')) {
      const response = await axios.get(payload.url, {
        headers: upstreamHeaders,
        responseType: 'text',
        timeout: 15000,
      });

      let m3u8 = response.data as string;
      const baseUrlStr = payload.url.substring(0, payload.url.lastIndexOf('/') + 1);

      // Rewrite segment URLs so they go through our proxy
      m3u8 = m3u8.replace(/^(?!#)(\S+)$/gm, (match: string) => {
        let fullUrl = match.trim();
        if (!fullUrl.startsWith('http')) {
          fullUrl = new URL(fullUrl, baseUrlStr).toString();
        }
        // Segments also need tokens
        const segmentToken = createToken(fullUrl, payload.addon);
        return `/api/stream/proxy?token=${segmentToken}`;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(m3u8);
    }

    // For all other streams (MP4, TS segments, etc.): pipe through
    const upstreamRes = await axios.get(payload.url, {
      headers: upstreamHeaders,
      responseType: 'stream',
      timeout: 30000,
    });

    // Forward relevant headers from upstream
    const forwardHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    forwardHeaders.forEach((h) => {
      const val = upstreamRes.headers[h];
      if (val) res.setHeader(h, val);
    });
    
    // Override content-type if we matched it and upstream is generic
    if (!res.getHeader('content-type') || res.getHeader('content-type') === 'application/octet-stream') {
        res.setHeader('Content-Type', contentType);
    }

    // If the upstream gave 206, mirror it; else 200
    res.status(upstreamRes.status === 206 ? 206 : 200);
    upstreamRes.data.pipe(res);

    upstreamRes.data.on('error', (err: Error) => {
      console.error('Stream pipe error:', err.message);
      if (!res.headersSent) res.status(500).json({ error: 'Stream error' });
    });
  } catch (err: any) {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) {
        const statusCode = err.response?.status || 500;
        res.status(statusCode).json({ error: 'Proxy failed', message: err.message });
    }
  }
});

export default router;
