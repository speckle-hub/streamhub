import { Router } from 'express';
import { ADDONS } from '../config/addons';
import { AddonProxy, StreamSource } from '../services/addonProxy';

const router = Router();

router.get('/search', async (req, res) => {
  const { q, type = 'movie', nsfw = 'false' } = req.query;
  
  if (!q) {
    return res.json({ metas: [] });
  }

  const results = await Promise.allSettled(
    Object.entries(ADDONS)
      .filter(([id, config]) => {
        if (config.nsfw && nsfw !== 'true') return false;
        if (!config.enabled) return false;
        return true;
      })
      .map(async ([id, config]) => {
        const proxy = new AddonProxy();
        try {
          const data = await proxy.fetchCatalog(id, type as string, 'search', `search=${q}`);
          return (data.metas || []).map((m: any) => ({ ...m, sourceAddon: id }));
        } catch {
          return [];
        }
      })
  );
  
  // Deduplicate by IMDB ID, merge sources
  let allMetas: any[] = [];
  results.forEach(r => {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) {
      allMetas = [...allMetas, ...r.value];
    }
  });

  const merged = mergeAndDeduplicate(allMetas);
  res.json({ metas: merged });
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
        const proxy = new AddonProxy();
        return proxy.fetchStreams(addonId, type, id);
      })
  );
  
  const streams = allStreams
    .filter((r): r is PromiseFulfilledResult<StreamSource[]> => r.status === 'fulfilled')
    .flatMap((r: any) => r.value)
    .sort((a, b) => qualityRank(b.quality) - qualityRank(a.quality));
  
  res.json({ streams });
});

function mergeAndDeduplicate(metas: any[]) {
  const seen = new Set();
  const deduped = [];
  for (const m of metas) {
    if (!m.id) continue;
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    deduped.push(m);
  }
  return deduped;
}

function qualityRank(q: string | undefined): number {
  if (q?.includes('4K') || q?.includes('2160')) return 4;
  if (q?.includes('1080')) return 3;
  if (q?.includes('720')) return 2;
  if (q?.includes('480')) return 1;
  return 0;
}

export default router;
