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
        content: true 
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
      trending: [
        ...trendingMovies.slice(0, 10).map(m => ({
          id: m.id.toString(),
          type: 'movie',
          name: m.title,
          poster: m.poster_path,
          imdbRating: m.vote_average?.toFixed(1),
          year: m.release_date ? new Date(m.release_date).getFullYear() : null
        })),
        ...trendingTV.slice(0, 10).map(t => ({
          id: t.id.toString(),
          type: 'tv',
          name: t.name,
          poster: t.poster_path,
          imdbRating: t.vote_average?.toFixed(1),
          year: t.first_air_date ? new Date(t.first_air_date).getFullYear() : null
        }))
      ],
      continueWatching,
      watchlist: watchlist.map(w => w.content),
      newReleases: [] 
    });
  } catch (err: any) {
    console.error('Home API Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch home content' });
  }
});

export default router;
