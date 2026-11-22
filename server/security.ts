import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const EPHEMERAL_SESSION_SECRET = crypto.randomBytes(32).toString('hex');

if (process.env.NODE_ENV === 'production') {
  const productionSecret = process.env.SESSION_SECRET?.trim() ?? '';
  if (productionSecret.length < 32) {
    console.warn(
      '[HelzerX Security] SESSION_SECRET is unset or shorter than 32 chars; using an ephemeral process secret.',
    );
  }
}

function getSessionSecret(): string {
  const configured = process.env.SESSION_SECRET?.trim();
  return configured && configured.length >= 16 ? configured : EPHEMERAL_SESSION_SECRET;
}

export type UserRole = 'super_admin' | 'admin' | 'staff' | 'partner' | 'customer';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;

  const expectedBuf = Buffer.from(expectedHex, 'hex');
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });

  if (expectedBuf.length !== derived.length) return false;
  return crypto.timingSafeEqual(expectedBuf, derived);
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

export function signSessionToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>, ttlSeconds = 60 * 60 * 24): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: AuthTokenPayload = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  };
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${header}.${body}`;
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(data)
    .digest('base64url');
  return `${data}.${sig}`;
}

export function verifySessionToken(token: string): AuthTokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  if (!header || !body || !sig) return null;

  const data = `${header}.${body}`;
  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(data)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(body)) as AuthTokenPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!decoded.sub || !decoded.email || !decoded.role || decoded.exp < now) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.baseUrl}${req.path}:${ip}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (bucket.count >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests. Please wait before trying again.',
      });
      return;
    }

    bucket.count += 1;
    next();
  };
}

export function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\0/g, '').trim().slice(0, maxLength);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

export function isSafeHttpUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function sanitizeFileName(name: unknown): string {
  if (typeof name !== 'string') return '';
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}
