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

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'security_admin'
  | 'finance_manager'
  | 'support_manager'
  | 'moderator'
  | 'staff'
  | 'partner'
  | 'customer';

export const ALL_USER_ROLES: UserRole[] = [
  'super_admin',
  'admin',
  'security_admin',
  'finance_manager',
  'support_manager',
  'moderator',
  'staff',
  'partner',
  'customer',
];

export const ADMIN_ROLES: UserRole[] = [
  'super_admin',
  'admin',
  'security_admin',
  'finance_manager',
  'support_manager',
  'moderator',
  'staff',
];

export type AdminPermission =
  | 'overview:read'
  | 'security:read'
  | 'security:emergency'
  | 'users:write'
  | 'roles:write'
  | 'cloud:write'
  | 'shop:write'
  | 'orders:write'
  | 'support:write'
  | 'cms:write'
  | 'settings:write';

const ROLE_PERMISSION_MAP: Record<UserRole, AdminPermission[] | ['*']> = {
  super_admin: ['*'],
  admin: [
    'overview:read',
    'security:read',
    'security:emergency',
    'users:write',
    'cloud:write',
    'shop:write',
    'orders:write',
    'support:write',
    'cms:write',
    'settings:write',
  ],
  security_admin: ['overview:read', 'security:read', 'security:emergency', 'users:write'],
  finance_manager: ['overview:read', 'shop:write', 'orders:write'],
  support_manager: ['overview:read', 'support:write', 'users:write'],
  moderator: ['overview:read', 'cms:write', 'support:write'],
  staff: ['overview:read', 'cloud:write', 'support:write', 'cms:write'],
  partner: [],
  customer: [],
};

export function isAdminPanelRole(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function hasPermission(role: UserRole, permission: AdminPermission): boolean {
  const perms = ROLE_PERMISSION_MAP[role];
  if (!perms) return false;
  if ((perms as string[]).includes('*')) return true;
  return (perms as AdminPermission[]).includes(permission);
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  jti?: string;
  iat: number;
  exp: number;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      64,
      { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (err, key) => {
        if (err) reject(err);
        else resolve(key);
      },
    );
  });
  return `scrypt2:${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  let salt = '';
  let expectedHex = '';
  let scryptOpts: crypto.ScryptOptions | undefined;

  if (parts.length === 3 && parts[0] === 'scrypt2') {
    salt = parts[1] ?? '';
    expectedHex = parts[2] ?? '';
    scryptOpts = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
  } else if (parts.length === 2) {
    salt = parts[0] ?? '';
    expectedHex = parts[1] ?? '';
  } else {
    return false;
  }

  if (!salt || !expectedHex) return false;

  const expectedBuf = Buffer.from(expectedHex, 'hex');
  const derived = await new Promise<Buffer>((resolve, reject) => {
    const cb = (err: Error | null, key: Buffer) => {
      if (err) reject(err);
      else resolve(key);
    };
    if (scryptOpts) {
      crypto.scrypt(password, salt, 64, scryptOpts, cb);
    } else {
      crypto.scrypt(password, salt, 64, cb);
    }
  });

  if (expectedBuf.length !== derived.length) return false;
  return crypto.timingSafeEqual(expectedBuf, derived);
}

const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  'password1234',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'qwertyuiop',
  'admin123',
  'admin1234',
  'helzerx123',
  'letmein123',
  'welcome123',
  'iloveyou',
  'aaaaaaaa',
]);

export function validatePasswordStrength(password: string): string | null {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (password.length > 128) {
    return 'Password must be 128 characters or fewer.';
  }
  const normalized = password.trim().toLowerCase();
  if (COMMON_WEAK_PASSWORDS.has(normalized)) {
    return 'Please choose a stronger password that is not commonly guessed.';
  }
  if (/^(.)\1+$/.test(password)) {
    return 'Password cannot consist of a single repeated character.';
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password)) {
    return 'Password must include both letters and at least one number or symbol.';
  }
  return null;
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

export function signSessionToken(
  payload: Omit<AuthTokenPayload, 'iat' | 'exp'>,
  ttlSeconds = 60 * 60 * 24,
): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: AuthTokenPayload = {
    ...payload,
    jti: payload.jti || generateId('ses'),
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
  if (!token || token.length > 4096) return null;
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
    const parsedHeader = JSON.parse(base64UrlDecode(header)) as { alg?: string; typ?: string };
    if (parsedHeader.alg !== 'HS256' || parsedHeader.typ !== 'JWT') {
      return null;
    }
    const decoded = JSON.parse(base64UrlDecode(body)) as AuthTokenPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!decoded.sub || !decoded.email || !decoded.role || !decoded.jti || decoded.exp < now) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  const isProd = process.env.NODE_ENV === 'production';
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  if (isHttps) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Keep Vite dev HMR & AI Studio preview iframe compatible while locking down object/base/form/remote scripts
  const scriptSrc = isProd
    ? "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com";

  const csp = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' ws: wss: https://challenges.cloudflare.com https://discord.com https://accounts.google.com https://github.com",
    "frame-src 'self' https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://appleid.apple.com",
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);
  next();
}

export function noStoreCache(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}

export interface SecurityEventInput {
  eventType: string;
  severity: 'info' | 'warning' | 'high';
  ipAddress: string;
  actorEmail?: string;
  path?: string;
  details?: string;
}

type SecurityEventSink = (event: SecurityEventInput) => void;
let securityEventSink: SecurityEventSink | null = null;

export function registerSecurityEventSink(sink: SecurityEventSink): void {
  securityEventSink = sink;
}

function emitSecurityEvent(event: SecurityEventInput): void {
  try {
    securityEventSink?.(event);
  } catch {
    // never crash request lifecycle on telemetry write
  }
}

const FORBIDDEN_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function hasForbiddenKeys(value: unknown, depth = 0): boolean {
  if (depth > 12 || value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) {
    return value.some((item) => hasForbiddenKeys(item, depth + 1));
  }
  const obj = value as Record<string, unknown>;
  for (const key of Object.getOwnPropertyNames(obj)) {
    if (FORBIDDEN_OBJECT_KEYS.has(key)) {
      return true;
    }
    if (hasForbiddenKeys(obj[key], depth + 1)) {
      return true;
    }
  }
  return false;
}

const runtimeCounters = {
  startedAt: new Date().toISOString(),
  totalApiRequests: 0,
  blockedRequests: 0,
  rateLimitedRequests: 0,
  unauthorizedRequests: 0,
};

export function incrementApiRequestCount(): void {
  runtimeCounters.totalApiRequests += 1;
}

export function incrementUnauthorizedCount(): void {
  runtimeCounters.unauthorizedRequests += 1;
}

export function getRuntimeSecurityCounters() {
  return {
    ...runtimeCounters,
    rateLimiterBuckets: rateBuckets.size,
    sessionSecretConfigured: (process.env.SESSION_SECRET?.trim().length ?? 0) >= 32,
    adminIpAllowlistConfigured: Boolean(process.env.ADMIN_IP_ALLOWLIST?.trim()),
    backupKeyConfigured: Boolean(process.env.BACKUP_ENCRYPTION_KEY?.trim()),
    stripeWebhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
  };
}

let emergencySecurityModeActive = false;

export function setEmergencySecurityModeState(enabled: boolean): void {
  emergencySecurityModeActive = enabled;
}

export function isEmergencySecurityModeActive(): boolean {
  return emergencySecurityModeActive;
}

const SUSPICIOUS_PROBE_PATTERNS = [
  /\/\.env/i,
  /\/\.git(?:\/|$)/i,
  /\/\.htaccess/i,
  /\/wp-login\.php/i,
  /\/wp-admin/i,
  /\/xmlrpc\.php/i,
  /\/phpinfo/i,
  /\/phpmyadmin/i,
  /\/cgi-bin\//i,
  /\/actuator(?:\/|$)/i,
  /\.\.[/\\]/,
  /%00/,
  /(?:union(?:\s+all)?\s+select|sleep\(\d+\)|benchmark\(|<script[\s>])/i,
];

export function antiAbuseMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = cleanText(req.ip || req.socket.remoteAddress || 'unknown', 80);
  const rawUrl = req.originalUrl || req.url || '';
  let decodedUrl = rawUrl;
  try {
    decodedUrl = decodeURIComponent(rawUrl);
  } catch {
    decodedUrl = rawUrl;
  }

  if (
    rawUrl.includes('\0') ||
    SUSPICIOUS_PROBE_PATTERNS.some((pattern) => pattern.test(rawUrl) || pattern.test(decodedUrl))
  ) {
    runtimeCounters.blockedRequests += 1;
    emitSecurityEvent({
      eventType: 'EXPLOIT_PROBE_BLOCKED',
      severity: 'high',
      ipAddress: ip,
      path: cleanText(rawUrl, 200),
      details: 'Blocked suspicious scanner, injection, or path traversal probe.',
    });
    res.status(403).json({ error: 'Forbidden request path or pattern.' });
    return;
  }

  if (hasForbiddenKeys(req.query) || hasForbiddenKeys(req.body)) {
    runtimeCounters.blockedRequests += 1;
    emitSecurityEvent({
      eventType: 'PROTOTYPE_POLLUTION_BLOCKED',
      severity: 'high',
      ipAddress: ip,
      path: cleanText(req.path || rawUrl, 200),
      details: 'Blocked request containing forbidden object prototype keys.',
    });
    res.status(400).json({ error: 'Invalid request payload structure.' });
    return;
  }

  next();
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function pruneRateBuckets(now: number): void {
  if (rateBuckets.size <= 2000) return;
  for (const [k, v] of rateBuckets.entries()) {
    if (v.resetAt <= now) {
      rateBuckets.delete(k);
    }
  }
  if (rateBuckets.size > 10000) {
    // Evict oldest keys to keep memory bounded under distributed flood
    let removed = 0;
    for (const k of rateBuckets.keys()) {
      rateBuckets.delete(k);
      removed += 1;
      if (removed >= 2000) break;
    }
  }
}

export function createRateLimiter(maxRequests: number, windowMs: number, scope = 'route') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const effectiveMax = emergencySecurityModeActive
      ? Math.max(5, Math.floor(maxRequests / 2))
      : maxRequests;
    const normalizedPath = scope === 'global' ? 'global' : `${req.baseUrl}${req.path}`;
    const key = `${scope}:${normalizedPath}:${ip}`;
    const now = Date.now();
    pruneRateBuckets(now);

    const bucket = rateBuckets.get(key);
    res.setHeader('X-RateLimit-Limit', String(effectiveMax));

    if (!bucket || bucket.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, effectiveMax - 1)));
      next();
      return;
    }

    if (bucket.count >= effectiveMax) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('Retry-After', String(retryAfterSec));
      runtimeCounters.rateLimitedRequests += 1;

      if (bucket.count === effectiveMax) {
        emitSecurityEvent({
          eventType: 'RATE_LIMIT_TRIGGERED',
          severity: 'warning',
          ipAddress: cleanText(ip, 80),
          path: cleanText(`${req.baseUrl}${req.path}`, 200),
          details: `Rate limit exceeded (${effectiveMax} requests / ${Math.round(windowMs / 1000)}s).`,
        });
      }
      bucket.count += 1;

      res.status(429).json({
        error: `Too many requests. Please wait ${retryAfterSec}s before trying again.`,
      });
      return;
    }

    bucket.count += 1;
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, effectiveMax - bucket.count)));
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

const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.pdf',
  '.txt',
  '.md',
  '.csv',
  '.zip',
  '.doc',
  '.docx',
]);

const ALLOWED_ATTACHMENT_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export function validateAttachmentFile(
  rawName: unknown,
  rawMime?: unknown,
): { ok: boolean; fileName: string; error?: string } {
  const cleaned = sanitizeFileName(rawName);
  if (!cleaned) {
    return { ok: true, fileName: '' };
  }
  const lower = cleaned.toLowerCase();
  const dotIdx = lower.lastIndexOf('.');
  if (dotIdx <= 0) {
    return { ok: false, fileName: '', error: 'Attachment filename must include a supported extension.' };
  }
  const ext = lower.slice(dotIdx);
  if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      fileName: '',
      error: `Unsupported attachment file type (${ext}). Allowed: PNG, JPG, WEBP, PDF, TXT, MD, CSV, ZIP, DOCX.`,
    };
  }
  if (typeof rawMime === 'string' && rawMime.trim()) {
    const normalizedMime = rawMime.trim().toLowerCase().split(';')[0];
    if (!ALLOWED_ATTACHMENT_MIMES.has(normalizedMime)) {
      return { ok: false, fileName: '', error: `Disallowed attachment MIME type (${normalizedMime}).` };
    }
  }
  return { ok: true, fileName: cleaned };
}

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

// RFC 4648 Base32 & RFC 6238 TOTP MFA (Authenticator Apps)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(str: string): Buffer {
  const clean = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

export function buildTotpOtpAuthUri(
  email: string,
  secret: string,
  issuer = 'HelzerX Technologies',
): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

function computeHotpCode(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
}

export function verifyTotpCode(secret: string, code: string, windowSteps = 1): boolean {
  const trimmed = cleanText(code, 12).replace(/\s+/g, '');
  if (!secret || !/^\d{6}$/.test(trimmed)) return false;
  const currentStep = Math.floor(Date.now() / 1000 / 30);
  const candidateBuf = Buffer.from(trimmed);
  for (let delta = -windowSteps; delta <= windowSteps; delta += 1) {
    const expected = computeHotpCode(secret, currentStep + delta);
    const expectedBuf = Buffer.from(expected);
    if (candidateBuf.length === expectedBuf.length && crypto.timingSafeEqual(candidateBuf, expectedBuf)) {
      return true;
    }
  }
  return false;
}

// AES-256-GCM Encrypted Database Backup Helpers
function getBackupEncryptionKey(): Buffer {
  const raw = process.env.BACKUP_ENCRYPTION_KEY?.trim() || getSessionSecret();
  return crypto.scryptSync(raw, 'helzerx-backup-aes256-salt', 32);
}

export function encryptBackupBuffer(plain: Buffer): Buffer {
  const key = getBackupEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: [4-byte magic 'HXBK'][12-byte iv][16-byte tag][ciphertext]
  return Buffer.concat([Buffer.from('HXBK'), iv, authTag, ciphertext]);
}

export function decryptAndVerifyBackupBuffer(encrypted: Buffer): Buffer {
  if (encrypted.length < 32 || encrypted.subarray(0, 4).toString('utf8') !== 'HXBK') {
    throw new Error('Invalid encrypted backup header.');
  }
  const key = getBackupEncryptionKey();
  const iv = encrypted.subarray(4, 16);
  const tag = encrypted.subarray(16, 32);
  const ciphertext = encrypted.subarray(32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

// Stripe Webhook Cryptographic HMAC-SHA256 Verifier
export function verifyStripeWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string,
  webhookSecret: string,
  toleranceSeconds = 300,
): boolean {
  if (!rawBody || !signatureHeader || !webhookSecret) return false;
  const parts = signatureHeader.split(',');
  let timestamp = '';
  const signatures: string[] = [];
  for (const part of parts) {
    const [k, v] = part.split('=');
    if (k?.trim() === 't' && v) timestamp = v.trim();
    if (k?.trim() === 'v1' && v) signatures.push(v.trim());
  }
  if (!timestamp || signatures.length === 0) return false;
  const tsNum = Number(timestamp);
  if (!Number.isFinite(tsNum) || Math.abs(Math.floor(Date.now() / 1000) - tsNum) > toleranceSeconds) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(signedPayload)
    .digest('hex');
  const expectedBuf = Buffer.from(expectedSig, 'hex');

  return signatures.some((sig) => {
    try {
      const sigBuf = Buffer.from(sig, 'hex');
      return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
    } catch {
      return false;
    }
  });
}
