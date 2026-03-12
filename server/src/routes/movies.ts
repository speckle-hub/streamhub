import { Router } from 'express';
import { addonProxy } from '../services/addonProxy';

const router = Router();

// GET /api/movies
router.get('/', async (req, res) => {
  try {
    const [popular, topRated, action, comedy, horror] = await Promise.all([
      addonProxy.fetchCatalog('cinemata', 'movie', 'top'),
      addonProxy.fetchCatalog('cinemata', 'movie', 'popular'), // Use popular for top rated or similar
      addonProxy.fetchCatalog('cinemata', 'movie', 'top', 'genre=Action'),
      addonProxy.fetchCatalog('cinemata', 'movie', 'top', 'genre=Comedy'),
      addonProxy.fetchCatalog('cinemata', 'movie', 'top', 'genre=Horror'),
    ]);

    const mapMeta = (m: any) => ({
      id: m.id,
      type: 'movie',
      name: m.name,
      poster: m.poster,
      imdbRating: m.imdbRating,
      year: m.releaseInfo || m.year
    });

    res.json({
      hero: popular.metas?.[0] ? mapMeta(popular.metas[0]) : null,
      rows: [
        { title: 'Popular Movies', items: (popular.metas || []).slice(0, 15).map(mapMeta) },
        { title: 'Top Rated', items: (topRated.metas || []).slice(0, 15).map(mapMeta) },
        { title: 'Action', items: (action.metas || []).slice(0, 15).map(mapMeta) },
        { title: 'Comedy', items: (comedy.metas || []).slice(0, 15).map(mapMeta) },
        { title: 'Horror', items: (horror.metas || []).slice(0, 15).map(mapMeta) },
      ]
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

export default router;
