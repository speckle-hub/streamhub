import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ensureContent } from '../lib/contentSync';

const router = Router();

// POST /api/user/progress
router.post('/progress', async (req: Request, res: Response) => {
  try {
    const deviceId = req.deviceId;
    if (!deviceId) return res.status(401).json({ error: 'Unauthorized' });

    const { contentId, type, position, duration, seasonNumber, episodeNumber, episodeTitle, completed } = req.body;

    if (!contentId || position === undefined || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await ensureContent(contentId, type || 'movie');

    const percent = Math.min(100, Math.floor((position / duration) * 100));

    const progress = await prisma.watchProgress.upsert({
      where: {
        progress_id: {
          userId: deviceId,
          contentId,
          seasonNumber: seasonNumber ?? 0,
          episodeNumber: episodeNumber ?? 0,
        }
      },
      create: {
        userId: deviceId,
        contentId,
        position,
        duration,
        percent,
        seasonNumber: seasonNumber ?? 0,
        episodeNumber: episodeNumber ?? 0,
        episodeTitle,
        completed: completed || percent > 90
      },
      update: {
        position,
        duration,
        percent,
        completed: completed || percent > 90,
        updatedAt: new Date()
      }
    });

    // Automatically update watchlist status to 'watching' if it exists
    await prisma.watchlist.updateMany({
      where: { userId: deviceId, contentId },
      data: { watchStatus: 'watching' }
    });

    res.json(progress);
  } catch (err: any) {
    console.error('Progress Update Error:', err.message);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// GET /api/user/watchlist
router.get('/watchlist', async (req: Request, res: Response) => {
  try {
    const deviceId = req.deviceId;
    if (!deviceId) return res.status(401).json({ error: 'Unauthorized' });

    const watchlist = await prisma.watchlist.findMany({
      where: { userId: deviceId },
      include: { content: true },
      orderBy: { addedAt: 'desc' }
    });

    // Group by status
    const grouped = {
      watch_later: watchlist.filter(w => w.watchStatus === 'watch_later').map(w => w.content),
      watching: watchlist.filter(w => w.watchStatus === 'watching').map(w => w.content),
      finished: watchlist.filter(w => w.watchStatus === 'finished').map(w => w.content),
      dropped: watchlist.filter(w => w.watchStatus === 'dropped').map(w => w.content),
    };

    res.json(grouped);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// POST /api/user/watchlist
router.post('/watchlist', async (req: Request, res: Response) => {
  try {
    const deviceId = req.deviceId;
    const { contentId, type, action, status = 'watch_later', sourceAddon } = req.body;

    if (!deviceId || !contentId || !action) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    if (action === 'add') {
      await ensureContent(contentId, type || 'movie');
      await prisma.watchlist.upsert({
        where: { watchlist_unique: { userId: deviceId, contentId } },
        create: { 
          userId: deviceId, 
          contentId, 
          contentType: type || 'movie',
          watchStatus: status,
          sourceAddon
        },
        update: { 
          watchStatus: status,
          addedAt: new Date() 
        }
      });
    } else {
      await prisma.watchlist.delete({
        where: { watchlist_unique: { userId: deviceId, contentId } }
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update watchlist' });
  }
});

// Settings, Age Verification, PIN Verification (Keeping existing)
router.post('/settings', async (req: Request, res: Response) => {
  try {
    const deviceId = req.deviceId;
    if (!deviceId) return res.status(401).json({ error: 'Unauthorized' });
    const { debridKey, autoplay, nsfwEnabled } = req.body;
    await prisma.user.update({
        where: { id: deviceId },
        data: { settings: JSON.stringify({ debridKey, autoplay, nsfwEnabled }) },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

router.post('/verify-age', async (req: Request, res: Response) => {
  try {
    const deviceId = req.deviceId;
    if (!deviceId) return res.status(401).json({ error: 'Unauthorized' });
    const { confirmed } = req.body;
    if (!confirmed) return res.status(400).json({ error: 'Confirmation required' });
    await prisma.user.update({
        where: { id: deviceId },
        data: { ageVerified: true, verifiedAt: new Date() }
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to verify age' });
  }
});

router.post('/verify-pin', async (req: Request, res: Response) => {
  try {
    const deviceId = req.deviceId;
    if (!deviceId) return res.status(401).json({ error: 'Unauthorized' });
    const { pin } = req.body;
    const user = await prisma.user.findUnique({ where: { id: deviceId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const settings = user.settings ? JSON.parse(user.settings) : {};
    if (settings.nsfwPin === pin) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Invalid PIN' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to verify PIN' });
  }
});

export default router;
