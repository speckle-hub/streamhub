import { Router } from 'express';
import { addonProxy } from '../services/addonProxy';

const router = Router();

// GET /api/tv
router.get('/', async (req, res) => {
  try {
    const [popular, trending, drama, scifi, networks] = await Promise.all([
      addonProxy.fetchCatalog('cinemata', 'series', 'top'),
      addonProxy.fetchCatalog('cinemata', 'series', 'popular'), 
      addonProxy.fetchCatalog('cinemata', 'series', 'top', 'genre=Drama'),
      addonProxy.fetchCatalog('cinemata', 'series', 'top', 'genre=Sci-Fi'),
      addonProxy.fetchCatalog('cinemata', 'series', 'top', 'genre=Action'),
    ]);

    const mapMeta = (m: any) => ({
      id: m.id,
      type: 'tv',
      name: m.name,
      poster: m.poster,
      imdbRating: m.imdbRating,
      year: m.releaseInfo || m.year
    });

    res.json({
      hero: popular.metas?.[0] ? mapMeta(popular.metas[0]) : null,
      rows: [
        { title: 'Popular TV Shows', items: (popular.metas || []).slice(0, 15).map(mapMeta) },
        { title: 'Trending Today', items: (trending.metas || []).slice(0, 15).map(mapMeta) },
        { title: 'Drama', items: (drama.metas || []).slice(0, 15).map(mapMeta) },
        { title: 'Sci-Fi & Fantasy', items: (scifi.metas || []).slice(0, 15).map(mapMeta) },
        { title: 'Action & Adventure', items: (networks.metas || []).slice(0, 15).map(mapMeta) },
      ]
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch TV shows' });
  }
});

export default router;
