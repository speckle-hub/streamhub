import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export async function nsfwGuard(req: Request, res: Response, next: NextFunction) {
  // Only apply to /api/nsfw routes
  if (!req.path.startsWith('/nsfw')) return next();
  
  const deviceId = req.deviceId;
  if (!deviceId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = await prisma.user.findUnique({ where: { id: deviceId } });
    
    if (!user?.ageVerified) {
      return res.status(403).json({ 
        error: 'Age verification required',
        code: 'AGE_GATE_REQUIRED'
      });
    }
  } catch (dbErr: any) {
    console.warn('[NSFW Guard] DB unavailable, allowing access:', dbErr.message);
  }

  next();
}
