import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { addonProxy } from '../services/addonProxy';

const router = Router();

// GET /api/nsfw/home
router.get('/home', async (req, res) => {
  try {
    const deviceId = req.deviceId || '';

    // Parallel fetch for catalogs and watchlist
    const [adultTrending, hentaiTrending, nsfwWatchlist, nsfwProgress] = await Promise.all([
      addonProxy.fetchCatalog('porntube', 'movie', 'popular'), // Adult
      addonProxy.fetchCatalog('hentaistream', 'movie', 'popular'), // Hentai
      prisma.nsfwWatchlist.findMany({
        where: { userId: deviceId },
        orderBy: { addedAt: 'desc' },
        take: 20
      }),
      prisma.nsfwWatchProgress.findMany({
        where: { userId: deviceId },
        orderBy: { updatedAt: 'desc' },
        take: 10
      })
    ]);

    const mapMeta = (m: any, addon: string) => ({
      id: m.id,
      name: m.name,
      poster: m.poster,
      type: m.type,
      sourceAddon: addon
    });

    res.json({
      adult: (adultTrending.metas || []).slice(0, 15).map((m: any) => mapMeta(m, 'porntube')),
      hentai: (hentaiTrending.metas || []).slice(0, 15).map((m: any) => mapMeta(m, 'hentaistream')),
      watchlist: {
        all: nsfwWatchlist,
        continue: nsfwProgress.map(p => ({
          contentId: p.contentId,
          title: p.title,
          type: p.contentType,
          progress: Math.floor((p.position / p.duration) * 100)
        }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch NSFW hub' });
  }
});

// Watchlist routes for NSFW
router.post('/watchlist', async (req, res) => {
  const { contentId, contentType, title, poster, sourceAddon } = req.body;
  const userId = req.deviceId || '';

  try {
    const item = await prisma.nsfwWatchlist.upsert({
      where: {
        nsfw_watchlist_unique: { userId, contentId }
      },
      create: {
        userId, contentId, contentType, title, poster, sourceAddon
      },
      update: {
        addedAt: new Date()
      }
    });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/watchlist/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.deviceId || '';
  try {
    await prisma.nsfwWatchlist.delete({
      where: {
        nsfw_watchlist_unique: { userId, contentId: id }
      }
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
