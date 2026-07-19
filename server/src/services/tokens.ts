import jwt from 'jsonwebtoken';

const SECRET = process.env.STREAM_TOKEN_SECRET || 'dev-secret-change-in-production';

export interface TokenPayload {
  url: string;
  addon: string;
}

export const createToken = (url: string, addon: string): string => {
  return jwt.sign({ url, addon }, SECRET, { expiresIn: '15m' });
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
  } catch (err: any) {
    throw new Error('Token validation failed: ' + err.message);
  }
};
