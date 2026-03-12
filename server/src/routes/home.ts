import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { addonProxy } from '../services/addonProxy';

const router = Router();

// GET /api/home
router.get('/', async (req, res) => {
  try {
    const deviceId = req.deviceId || '';

    // 1. Fetch Personal Data (Parallel)
    const [continueWatching, watchlist] = await Promise.all([
      prisma.watchProgress.findMany({
        where: { 
          userId: deviceId,
          completed: false,
          percent: { gt: 0, lt: 90 }
        },
        include: { content: true },
        orderBy: { updatedAt: 'desc' },
        take: 10
      }),
      prisma.watchlist.findMany({
        where: { userId: deviceId },
        include: { content: true },
        orderBy: { addedAt: 'desc' },
        take: 10
      })
    ]);

    // 2. Fetch Catalogs from Cinemata (Parallel)
    // Cinemata usually has: Top Movies, Top Series
    const [movieCatalog, seriesCatalog] = await Promise.all([
      addonProxy.fetchCatalog('cinemata', 'movie', 'top'),
      addonProxy.fetchCatalog('cinemata', 'series', 'top')
    ]);

    // 3. Map Cinemata Data to UI Format
    const mapMeta = (m: any, type: string) => ({
      id: m.id,
      type: type,
      name: m.name,
      poster: m.poster,
      imdbRating: m.imdbRating,
      year: m.releaseInfo || m.year,
      description: m.description
    });

    const trendingMovies = (movieCatalog.metas || []).slice(0, 15).map((m: any) => mapMeta(m, 'movie'));
    const trendingTV = (seriesCatalog.metas || []).slice(0, 15).map((m: any) => mapMeta(m, 'tv'));

    res.json({
      hero: trendingMovies[0] || trendingTV[0],
      rows: [
        { title: 'Continue Watching', items: continueWatching.map(p => ({ ...p.content, progress: p.percent })), id: 'continue' },
        { title: 'Your Watchlist', items: watchlist.map(w => w.content), id: 'watchlist' },
        { title: 'Trending Movies', items: trendingMovies, id: 'trending_movies' },
        { title: 'Trending TV Shows', items: trendingTV, id: 'trending_tv' },
        { title: 'New Releases', items: trendingMovies.slice(5, 15), id: 'new_releases' }
      ]
    });
  } catch (err: any) {
    console.error('[Home API] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch home content' });
  }
});

export default router;
