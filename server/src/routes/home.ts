import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { tmdb } from '../services/tmdb';

const router = Router();

// GET /api/home
router.get('/', async (req, res) => {
  try {
    const deviceId = req.deviceId || '';

    // 1. Get Trending from TMDB (Cached)
    const [trendingMovies, trendingTV] = await Promise.all([
      tmdb.getTrending('movie', 'week'),
      tmdb.getTrending('tv', 'week')
    ]);

    // 2. Get Continue Watching
    const continueWatching = await prisma.watchProgress.findMany({
      where: { 
        userId: deviceId,
        completed: false,
        percent: { gt: 0, lt: 90 }
      },
      include: {
        content: true // Relation name is still 'content'
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    // 3. Get Watchlist
    const watchlist = await prisma.watchlist.findMany({
      where: { userId: deviceId },
      include: { content: true },
      orderBy: { addedAt: 'desc' },
      take: 20
    });

    res.json({
      trending: {
        movies: trendingMovies.slice(0, 10),
        tv: trendingTV.slice(0, 10)
      },
      continueWatching,
      watchlist: watchlist.map(w => w.content),
      newReleases: [] // Will be populated from addon catalogs if needed
    });
  } catch (err: any) {
    console.error('Home API Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch home content' });
  }
});

export default router;
