import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Mock NSFW search for verification
router.get('/search', async (req: Request, res: Response) => {
  const { q } = req.query;
  
  // In Phase 4, we'll integrate real NSFW addons
  const mockResults = [
    {
      id: 'mock:nsfw:1',
      title: `NSFW Result: ${q}`,
      type: 'movie',
      posterPath: 'https://via.placeholder.com/342x513?text=NSFW',
      rating: 9.9
    }
  ];

  res.json(mockResults);
});

// History routes
router.get('/history', async (req: Request, res: Response) => {
  const deviceId = req.deviceId;
  const history = await prisma.nsfwWatchProgress.findMany({
    where: { userId: deviceId },
    orderBy: { updatedAt: 'desc' },
    take: 20
  });
  res.json(history);
});

router.delete('/history', async (req: Request, res: Response) => {
  const deviceId = req.deviceId;
  await prisma.nsfwWatchProgress.deleteMany({
    where: { userId: deviceId }
  });
  res.json({ success: true });
});

export default router;
