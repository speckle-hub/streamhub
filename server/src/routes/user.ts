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

    // Ensure content exists in DB for relation integrity
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

    res.json(progress);
  } catch (err: any) {
    console.error('Progress Update Error:', err.message);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// POST /api/user/settings
router.post('/settings', async (req: Request, res: Response) => {
  try {
    const deviceId = req.deviceId;
    console.log('Settings Route: deviceId:', deviceId, 'Cookies:', req.cookies);
    if (!deviceId) return res.status(401).json({ error: 'Unauthorized' });

    const { debridKey, autoplay, nsfwEnabled } = req.body;
    
    await prisma.user.update({
      where: { id: deviceId },
      data: {
        settings: JSON.stringify({ debridKey, autoplay, nsfwEnabled }),
      },
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Settings Update Error:', err.message, 'deviceId:', req.deviceId);
    res.status(500).json({ error: 'Failed to update settings', message: err.message });
  }
});

// GET /api/user/continue-watching
router.get('/continue-watching', async (req: Request, res: Response) => {
  try {
    const deviceId = req.deviceId;
    if (!deviceId) return res.status(401).json({ error: 'Unauthorized' });

    const progress = await prisma.watchProgress.findMany({
      where: {
        userId: deviceId,
        completed: false,
        percent: { gt: 0, lt: 95 }
      },
      include: { content: true },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    res.json(progress);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch continue watching' });
  }
});

// POST /api/user/watchlist
router.post('/watchlist', async (req: Request, res: Response) => {
  try {
    const deviceId = req.deviceId;
    const { contentId, type, action } = req.body;

    if (!deviceId || !contentId || !action) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    if (action === 'add') {
      await ensureContent(contentId, type || 'movie');
      await prisma.watchlist.upsert({
        where: { watchlist_id: { userId: deviceId, contentId } },
        create: { userId: deviceId, contentId },
        update: {}
      });
    } else {
      await prisma.watchlist.delete({
        where: { watchlist_id: { userId: deviceId, contentId } }
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update watchlist' });
  }
});

// POST /api/user/verify-age
router.post('/verify-age', async (req: Request, res: Response) => {
  try {
    const deviceId = req.deviceId;
    if (!deviceId) return res.status(401).json({ error: 'Unauthorized' });

    const { confirmed } = req.body;
    if (!confirmed) return res.status(400).json({ error: 'Confirmation required' });

    await prisma.user.update({
      where: { id: deviceId },
      data: {
        ageVerified: true,
        verifiedAt: new Date()
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to verify age' });
  }
});
// POST /api/user/verify-pin
router.post('/verify-pin', async (req: Request, res: Response) => {
  try {
    const deviceId = req.deviceId;
    if (!deviceId) return res.status(401).json({ error: 'Unauthorized' });

    const { pin } = req.body;
    const user = await prisma.user.findUnique({ where: { id: deviceId } });
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    // In a real app, nsfwPinHash would be checked. 
    // For this phase, we use the simple settings persistence.
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
