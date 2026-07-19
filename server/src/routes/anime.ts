import { Router } from 'express';
import { addonProxy } from '../services/addonProxy';

const router = Router();

// GET /api/anime
router.get('/', async (req, res) => {
  try {
    // Animestream often uses different catalog IDs, we'll try to fetch top/popular
    const [cinemataAnime, animestreamPopular, action, fantasy, romance] = await Promise.all([
      addonProxy.fetchCatalog('cinemata', 'movie', 'top', 'genre=Animation'),
      addonProxy.fetchCatalog('animestream', 'movie', 'popular'), 
      addonProxy.fetchCatalog('animestream', 'series', 'top', 'genre=Action'),
      addonProxy.fetchCatalog('animestream', 'series', 'top', 'genre=Fantasy'),
      addonProxy.fetchCatalog('animestream', 'series', 'top', 'genre=Romance'),
    ]);

    const mapMeta = (m: any) => ({
      id: m.id,
      type: m.type || 'movie',
      name: m.name,
      poster: m.poster,
      imdbRating: m.imdbRating,
      year: m.releaseInfo || m.year
    });

    res.json({
      hero: (animestreamPopular.metas || cinemataAnime.metas)?.[0] ? mapMeta((animestreamPopular.metas || cinemataAnime.metas)[0]) : null,
      rows: [
        { title: 'Popular Anime', items: (animestreamPopular.metas || []).slice(0, 15).map(mapMeta) },
        { title: 'Top Movies', items: (cinemataAnime.metas || []).slice(0, 15).map(mapMeta) },
        { title: 'Action Anime', items: (action.metas || []).slice(0, 15).map(mapMeta) },
        { title: 'Fantasy', items: (fantasy.metas || []).slice(0, 15).map(mapMeta) },
        { title: 'Romance', items: (romance.metas || []).slice(0, 15).map(mapMeta) },
      ]
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch anime' });
  }
});

export default router;
