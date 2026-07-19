import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { prisma } from '../lib/prisma';

declare global {
  namespace Express {
    interface Request {
      deviceId: string;
    }
  }
}

export async function deviceUserMiddleware(req: Request, res: Response, next: NextFunction) {
  // Fingerprint: IP + User-Agent
  const fingerprint = createHash('sha256')
    .update((req.ip || 'unknown') + (req.headers['user-agent'] || 'unknown'))
    .digest('hex')
    .slice(0, 16);
  
  req.deviceId = fingerprint;
  
  // Persistence via cookie
  const existingCookie = req.cookies?.deviceId;
  console.log('Middleware: Fingerprint:', fingerprint, 'Cookie:', existingCookie);
  
  if (!existingCookie) {
    res.cookie('deviceId', fingerprint, { 
      httpOnly: true, 
      maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
    });
    console.log('Middleware: Setting new cookie');
  } else {
    req.deviceId = existingCookie;
    console.log('Middleware: Using existing cookie', req.deviceId);
  }
  
  try {
    // Auto-create user if missing (non-fatal)
    await prisma.user.upsert({
      where: { id: req.deviceId },
      create: { 
        id: req.deviceId,
        settings: JSON.stringify({ debridKey: '', autoplay: true, nsfwEnabled: false })
      },
      update: {},
    });
  } catch (err: any) {
    console.warn('Device Middleware: DB unavailable, proceeding without user record:', err.message);
  }
  
  next();
}
