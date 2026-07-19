import { Router } from 'express';
import { ADDONS } from '../config/addons';
import { addonProxy, StreamSource } from '../services/addonProxy';

const router = Router();

router.get('/search', async (req, res) => {
  const { q, nsfw = 'false' } = req.query;
  
  if (!q) {
    return res.json({ categories: {} });
  }

  // Define types to search
  const types = ['movie', 'series'];
  
  const searchPromises: Promise<any>[] = [];

  // Query all non-NSFW addons for movie/series
  Object.entries(ADDONS).forEach(([id, config]) => {
    if (!config.enabled) return;
    if (config.nsfw && nsfw !== 'true') return;

    types.forEach(type => {
      searchPromises.push(
        addonProxy.fetchCatalog(id, type, 'search', `search=${q}`)
          .then(data => (data.metas || []).map((m: any) => ({ ...m, sourceAddon: id, type: type === 'series' ? 'tv' : type })))
          .catch(() => [])
      );
    });
  });

  const results = await Promise.all(searchPromises);
  const allMetas = results.flat();

  // Deduplicate and Categorize
  const categories: Record<string, any[]> = {
    movies: [],
    tv: [],
    anime: [],
    nsfw: []
  };

  const seenIds = new Set<string>();

  for (const meta of allMetas) {
    if (!meta.id || seenIds.has(meta.id)) continue;
    seenIds.add(meta.id);

    const formatted = {
      id: meta.id,
      type: meta.type,
      name: meta.name,
      poster: meta.poster,
      imdbRating: meta.imdbRating,
      year: meta.releaseInfo || meta.year,
      sourceAddon: meta.sourceAddon
    };

    // Determine category
    const addonConfig = ADDONS[meta.sourceAddon as string];
    if (addonConfig?.nsfw) {
      categories.nsfw.push(formatted);
    } else if (meta.sourceAddon === 'animestream' || (meta.name && /anime/i.test(meta.name))) {
      categories.anime.push(formatted);
    } else if (meta.type === 'movie') {
      categories.movies.push(formatted);
    } else {
      categories.tv.push(formatted);
    }
  }

  res.json({ categories });
});

router.get('/streams/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const { nsfw = 'false' } = req.query;
  
  const allStreams = await Promise.allSettled(
    Object.entries(ADDONS)
      .filter(([_, config]) => {
        if (config.nsfw && nsfw !== 'true') return false;
        return config.enabled;
      })
      .map(([addonId]) => {
        return addonProxy.fetchStreams(addonId, type, id);
      })
  );
  
  const streams = allStreams
    .filter((r): r is PromiseFulfilledResult<StreamSource[]> => r.status === 'fulfilled')
    .flatMap((r: any) => r.value)
    .sort((a, b) => qualityRank(b.quality) - qualityRank(a.quality));
  
  res.json({ streams });
});

function qualityRank(q: string | undefined): number {
  if (q?.includes('4K') || q?.includes('2160')) return 4;
  if (q?.includes('1080')) return 3;
  if (q?.includes('720')) return 2;
  if (q?.includes('480')) return 1;
  return 0;
}

export default router;
