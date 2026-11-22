import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { db } from './db.ts';
import {
  fetchPterodactylAppServers,
  fetchPterodactylServerResources,
  getPterodactylStatus,
  sendPterodactylPowerSignal,
} from './pterodactyl.ts';
import {
  ADMIN_ROLES,
  ALL_USER_ROLES,
  buildTotpOtpAuthUri,
  cleanText,
  createRateLimiter,
  decryptAndVerifyBackupBuffer,
  encryptBackupBuffer,
  generateId,
  generateTotpSecret,
  getRuntimeSecurityCounters,
  hashPassword,
  hasPermission,
  isAdminPanelRole,
  isSafeHttpUrl,
  isValidEmail,
  registerSecurityEventSink,
  signSessionToken,
  setEmergencySecurityModeState,
  validateAttachmentFile,
  validatePasswordStrength,
  verifyPassword,
  verifySessionToken,
  verifyStripeWebhookSignature,
  verifyTotpCode,
  type AdminPermission,
  type SecurityEventInput,
  type UserRole,
} from './security.ts';
import {
  buildOAuthAuthorizeUrl,
  exchangeOAuthCodeForProfile,
  generateSixDigitCode,
  getAuthPublicConfig,
  getProviderConfig,
  hashOtpCode,
  resolveAppBaseUrl,
  sendOtpEmail,
  verifyOAuthState,
  verifyTurnstileToken,
} from './authProviders.ts';

interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  email_verified: number;
  avatar_url: string;
  notify_email: number;
  notify_security: number;
  totp_enabled: number;
  last_login_at: string;
  last_login_ip: string;
  created_at: string;
}

interface SecurityControlsState {
  maintenanceLockdown: boolean;
  loginRestriction: boolean;
  apiEmergencyReadOnly: boolean;
  emergencySecurityMode: boolean;
  requireAdminMfa: boolean;
  devtoolsDeterrence: boolean;
}

const DEFAULT_SECURITY_CONTROLS: SecurityControlsState = {
  maintenanceLockdown: false,
  loginRestriction: false,
  apiEmergencyReadOnly: false,
  emergencySecurityMode: false,
  requireAdminMfa: false,
  devtoolsDeterrence: false,
};

function getSecurityControls(): SecurityControlsState {
  try {
    const row = db
      .prepare("SELECT value_json FROM site_settings WHERE key = 'security_controls'")
      .get() as { value_json: string } | undefined;
    if (!row) return { ...DEFAULT_SECURITY_CONTROLS };
    const parsed = JSON.parse(row.value_json) as Partial<SecurityControlsState>;
    const merged: SecurityControlsState = {
      maintenanceLockdown: Boolean(parsed.maintenanceLockdown),
      loginRestriction: Boolean(parsed.loginRestriction),
      apiEmergencyReadOnly: Boolean(parsed.apiEmergencyReadOnly),
      emergencySecurityMode: Boolean(parsed.emergencySecurityMode),
      requireAdminMfa:
        Boolean(parsed.requireAdminMfa) || process.env.REQUIRE_ADMIN_MFA?.trim() === 'true',
      devtoolsDeterrence: Boolean(parsed.devtoolsDeterrence),
    };
    setEmergencySecurityModeState(merged.emergencySecurityMode);
    return merged;
  } catch {
    return { ...DEFAULT_SECURITY_CONTROLS };
  }
}

interface AuthedRequest extends Request {
  authUser?: AuthenticatedUser;
  authSessionId?: string;
}

function getClientIp(req: Request): string {
  return cleanText(req.ip || req.socket.remoteAddress || 'unknown', 80);
}

function getUserAgent(req: Request): string {
  return cleanText(req.headers['user-agent'] || 'Unknown client', 220);
}

function recordSecurityEvent(event: SecurityEventInput): void {
  try {
    db.prepare(`
      INSERT INTO security_events (id, event_type, severity, ip_address, actor_email, path, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId('sec'),
      cleanText(event.eventType, 60),
      event.severity,
      cleanText(event.ipAddress, 80),
      cleanText(event.actorEmail || '', 254).toLowerCase(),
      cleanText(event.path || '', 200),
      cleanText(event.details || '', 400),
      new Date().toISOString(),
    );
  } catch {
    // ignore logging failure
  }
}

registerSecurityEventSink((event) => {
  recordSecurityEvent(event);
});

function sanitizeUser(row: Record<string, unknown>): AuthenticatedUser {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role) as UserRole,
    status: String(row.status),
    email_verified: Number(row.email_verified ?? 0),
    avatar_url: String(row.avatar_url ?? ''),
    notify_email: Number(row.notify_email ?? 1),
    notify_security: Number(row.notify_security ?? 1),
    totp_enabled: Number(row.totp_enabled ?? 0),
    last_login_at: String(row.last_login_at ?? ''),
    last_login_ip: String(row.last_login_ip ?? ''),
    created_at: String(row.created_at),
  };
}

function issueUserSession(
  user: { id: string; email: string; role: UserRole },
  req: Request,
): { token: string; sessionId: string } {
  const sessionId = generateId('ses');
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const clientIp = getClientIp(req);

  // Detect new IP address login for security alerting
  const userMeta = db
    .prepare('SELECT last_login_ip, notify_security FROM users WHERE id = ?')
    .get(user.id) as { last_login_ip?: string; notify_security?: number } | undefined;

  if (
    userMeta?.last_login_ip &&
    userMeta.last_login_ip !== clientIp &&
    clientIp !== 'unknown'
  ) {
    recordSecurityEvent({
      eventType: 'NEW_IP_LOGIN_DETECTED',
      severity: 'warning',
      ipAddress: clientIp,
      actorEmail: user.email,
      path: req.path,
      details: `Sign-in from new IP ${clientIp} (previous ${userMeta.last_login_ip}).`,
    });
    if (userMeta.notify_security === 1) {
      createNotification(
        user.id,
        'New IP Sign-In Detected',
        `A sign-in occurred from ${clientIp}. Review Active Sessions in Security Settings if unrecognized.`,
      );
    }
  }

  db.prepare('UPDATE users SET last_login_at = ?, last_login_ip = ? WHERE id = ?').run(
    nowIso,
    clientIp,
    user.id,
  );

  // Clean up expired sessions for this user to keep table tidy
  db.prepare('DELETE FROM user_sessions WHERE user_id = ? AND expires_at < ?').run(user.id, nowIso);

  db.prepare(`
    INSERT INTO user_sessions (id, user_id, ip_address, user_agent, created_at, last_seen_at, expires_at, revoked_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
  `).run(sessionId, user.id, clientIp, getUserAgent(req), nowIso, nowIso, expiresAt);

  const token = signSessionToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    jti: sessionId,
  });

  return { token, sessionId };
}

function getOptionalSession(req: Request): { user: AuthenticatedUser; sessionId: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const payload = verifySessionToken(token);
  if (!payload || !payload.jti) return null;

  const sessionRow = db
    .prepare('SELECT id, user_id, expires_at, revoked_at, last_seen_at FROM user_sessions WHERE id = ?')
    .get(payload.jti) as
    | { id: string; user_id: string; expires_at: string; revoked_at: string | null; last_seen_at: string }
    | undefined;

  if (!sessionRow || sessionRow.user_id !== payload.sub || sessionRow.revoked_at !== null) {
    return null;
  }
  if (new Date(sessionRow.expires_at) <= new Date()) {
    return null;
  }

  const row = db
    .prepare(
      'SELECT id, name, email, role, status, email_verified, avatar_url, notify_email, notify_security, totp_enabled, last_login_at, last_login_ip, created_at FROM users WHERE id = ?',
    )
    .get(payload.sub) as Record<string, unknown> | undefined;
  if (!row || row.status !== 'active') return null;

  const nowMs = Date.now();
  const lastSeenMs = new Date(sessionRow.last_seen_at).getTime();
  if (!Number.isFinite(lastSeenMs) || nowMs - lastSeenMs > 60_000) {
    db.prepare('UPDATE user_sessions SET last_seen_at = ? WHERE id = ?').run(
      new Date(nowMs).toISOString(),
      sessionRow.id,
    );
  }

  return { user: sanitizeUser(row), sessionId: sessionRow.id };
}

function getOptionalUser(req: Request): AuthenticatedUser | null {
  return getOptionalSession(req)?.user ?? null;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const session = getOptionalSession(req);
  if (!session) {
    res.status(401).json({ error: 'Authentication required or session expired. Please sign in.' });
    return;
  }
  req.authUser = session.user;
  req.authSessionId = session.sessionId;
  next();
}

function requireRole(roles: UserRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      recordSecurityEvent({
        eventType: 'UNAUTHORIZED_ROLE_ACCESS',
        severity: 'high',
        ipAddress: getClientIp(req),
        actorEmail: req.authUser?.email || 'anonymous',
        path: cleanText(`${req.baseUrl}${req.path}`, 200),
        details: `Denied role ${req.authUser?.role || 'none'} access to restricted route.`,
      });
      res.status(403).json({ error: 'Insufficient permissions for this action.' });
      return;
    }
    next();
  };
}

function requirePermission(permission: AdminPermission) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser || !hasPermission(req.authUser.role, permission)) {
      recordSecurityEvent({
        eventType: 'PERMISSION_DENIED',
        severity: 'warning',
        ipAddress: getClientIp(req),
        actorEmail: req.authUser?.email || 'anonymous',
        path: cleanText(`${req.baseUrl}${req.path}`, 200),
        details: `Role ${req.authUser?.role || 'none'} lacked permission ${permission}.`,
      });
      res.status(403).json({ error: `Missing permission (${permission}) for this operation.` });
      return;
    }
    next();
  };
}

function requireAdminIpAllowlist(req: Request, res: Response, next: NextFunction): void {
  const rawList = process.env.ADMIN_IP_ALLOWLIST?.trim();
  if (!rawList) {
    next();
    return;
  }
  const allowlist = rawList
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const ip = getClientIp(req);
  if (allowlist.length > 0 && !allowlist.includes(ip)) {
    recordSecurityEvent({
      eventType: 'ADMIN_IP_BLOCKED',
      severity: 'high',
      ipAddress: ip,
      path: cleanText(`${req.baseUrl}${req.path}`, 200),
      details: 'Blocked admin API access from non-allowlisted IP.',
    });
    res.status(403).json({ error: 'Admin access denied from this network IP address.' });
    return;
  }
  next();
}

function logAudit(
  actorId: string,
  actorEmail: string,
  action: string,
  targetType: string,
  targetId: string,
  details = '',
): void {
  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_email, action, target_type, target_id, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId('aud'),
    actorId,
    actorEmail,
    action,
    targetType,
    targetId,
    cleanText(details, 400),
    new Date().toISOString(),
  );
}

function createNotification(userId: string, title: string, body: string): void {
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, body, read, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
  `).run(generateId('ntf'), userId, cleanText(title, 120), cleanText(body, 320), new Date().toISOString());
}

export const apiRouter = Router();

const authRateLimit = createRateLimiter(25, 10 * 60 * 1000, 'auth');
const formRateLimit = createRateLimiter(30, 10 * 60 * 1000, 'form');

// Enforce live server-side Emergency Controls (Maintenance Lockdown & Emergency Read-Only)
apiRouter.use((req, res, next) => {
  const controls = getSecurityControls();
  const pathStr = req.path;

  if (controls.maintenanceLockdown) {
    const allowedInLockdown =
      pathStr === '/health' ||
      pathStr === '/public/site-data' ||
      pathStr.startsWith('/auth/config') ||
      pathStr.startsWith('/auth/bootstrap-status') ||
      pathStr.startsWith('/auth/login/start') ||
      pathStr.startsWith('/auth/otp/') ||
      pathStr === '/auth/me' ||
      pathStr === '/auth/logout';

    if (!allowedInLockdown) {
      const optUser = getOptionalUser(req);
      if (!optUser || !isAdminPanelRole(optUser.role)) {
        res.status(503).json({
          error: 'Platform is temporarily in Emergency Maintenance Lockdown. Only administrators may access.',
        });
        return;
      }
    }
  }

  if (
    controls.apiEmergencyReadOnly &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase())
  ) {
    const exemptMutation =
      pathStr.startsWith('/auth/login/start') ||
      pathStr.startsWith('/auth/otp/') ||
      pathStr === '/auth/logout';
    if (!exemptMutation) {
      const optUser = getOptionalUser(req);
      if (!optUser || !isAdminPanelRole(optUser.role)) {
        res.status(503).json({
          error: 'API is currently in Emergency Read-Only Restriction mode. Try again shortly.',
        });
        return;
      }
    }
  }

  next();
});

apiRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'HelzerX Technologies API',
    timestamp: new Date().toISOString(),
  });
});

function syncEarlyAccessForVerifiedEmail(userId: string, email: string): void {
  const ea = db
    .prepare('SELECT id, accepted_terms FROM early_access_registrations WHERE email = ?')
    .get(email) as { id: string; accepted_terms: number } | undefined;
  if (ea && ea.accepted_terms === 1) {
    const campaign = db
      .prepare('SELECT launch_date, early_access_limit FROM launch_campaign WHERE id = ?')
      .get('launch_2027') as { launch_date: string; early_access_limit: number } | undefined;
    const qualifiedCount = db
      .prepare("SELECT COUNT(*) as c FROM early_access_registrations WHERE eligibility_status = 'qualified'")
      .get() as { c: number };
    const limit = campaign?.early_access_limit ?? 50;
    const beforeLaunch = campaign ? new Date() < new Date(campaign.launch_date) : true;
    const newStatus = beforeLaunch && qualifiedCount.c < limit ? 'qualified' : 'waitlisted';
    const slotNum = newStatus === 'qualified' ? qualifiedCount.c + 1 : null;
    db.prepare(
      'UPDATE early_access_registrations SET user_id = COALESCE(user_id, ?), email_verified = 1, eligibility_status = ?, slot_number = ? WHERE id = ?',
    ).run(userId, newStatus, slotNum, ea.id);
  }
}

// ==================================================
// AUTHENTICATION & FIRST-RUN SUPER ADMIN BOOTSTRAP
// ==================================================

apiRouter.get('/auth/config', (_req, res) => {
  res.json(getAuthPublicConfig());
});

apiRouter.get('/auth/bootstrap-status', (_req, res) => {
  const adminRow = db
    .prepare("SELECT COUNT(*) as c FROM users WHERE role = 'super_admin'")
    .get() as { c: number };
  const hasPasscodeEnv = Boolean(process.env.HELZERX_ADMIN_PASSCODE?.trim());
  res.json({
    needsBootstrap: adminRow.c === 0 && !hasPasscodeEnv,
    hasSuperAdmin: adminRow.c > 0,
    passcodeConfigured: hasPasscodeEnv,
  });
});

apiRouter.post('/auth/bootstrap-admin', authRateLimit, async (req, res) => {
  const name = cleanText(req.body?.name, 80);
  const email = cleanText(req.body?.email, 254).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';

  if (name.length < 2 || !isValidEmail(email)) {
    res.status(400).json({
      error: 'Provide a valid name and email address.',
    });
    return;
  }

  const strengthErr = validatePasswordStrength(password);
  if (strengthErr) {
    res.status(400).json({ error: strengthErr });
    return;
  }

  const configuredPasscode = process.env.HELZERX_ADMIN_PASSCODE?.trim();
  if (configuredPasscode) {
    if (!passcode || passcode !== configuredPasscode) {
      recordSecurityEvent({
        eventType: 'ADMIN_BOOTSTRAP_INVALID_PASSCODE',
        severity: 'high',
        ipAddress: getClientIp(req),
        actorEmail: email,
        path: '/api/auth/bootstrap-admin',
        details: 'Rejected initial super_admin claim with invalid passcode.',
      });
      res.status(403).json({ error: 'Invalid admin setup passcode.' });
      return;
    }
  }

  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  const userId = generateId('usr');

  try {
    db.exec('BEGIN IMMEDIATE;');
    const existingAdmin = db
      .prepare("SELECT COUNT(*) as c FROM users WHERE role = 'super_admin'")
      .get() as { c: number };
    if (existingAdmin.c > 0) {
      db.exec('ROLLBACK;');
      res.status(409).json({
        error: 'A Super Admin account has already been claimed. Please sign in normally.',
      });
      return;
    }

    const existingEmail = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email) as { id: string } | undefined;
    if (existingEmail) {
      db.exec('ROLLBACK;');
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, status, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'super_admin', 'active', 1, ?, ?)
    `).run(userId, name, email, passwordHash, now, now);

    db.exec('COMMIT;');
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      // ignore
    }
    res.status(500).json({ error: err instanceof Error ? err.message : 'Bootstrap failed.' });
    return;
  }

  logAudit(userId, email, 'BOOTSTRAP_SUPER_ADMIN', 'users', userId, 'Claimed initial Super Admin');
  recordSecurityEvent({
    eventType: 'BOOTSTRAP_SUPER_ADMIN',
    severity: 'info',
    ipAddress: getClientIp(req),
    actorEmail: email,
    path: '/api/auth/bootstrap-admin',
    details: 'Initial Super Admin identity claimed.',
  });
  const { token } = issueUserSession({ id: userId, email, role: 'super_admin' }, req);
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as Record<string, unknown>;
  res.status(201).json({ token, user: sanitizeUser(row) });
});

apiRouter.post('/auth/register', authRateLimit, (req, res) => {
  recordSecurityEvent({
    eventType: 'LEGACY_AUTH_BYPASS_BLOCKED',
    severity: 'warning',
    ipAddress: getClientIp(req),
    actorEmail: cleanText(req.body?.email, 254).toLowerCase(),
    path: '/api/auth/register',
    details: 'Blocked direct legacy registration without Cloudflare + 6-digit OTP.',
  });
  res.status(410).json({
    error: 'Direct registration is disabled. Complete Cloudflare verification and 6-digit email OTP.',
  });
});

apiRouter.post('/auth/login', authRateLimit, (req, res) => {
  recordSecurityEvent({
    eventType: 'LEGACY_AUTH_BYPASS_BLOCKED',
    severity: 'warning',
    ipAddress: getClientIp(req),
    actorEmail: cleanText(req.body?.email, 254).toLowerCase(),
    path: '/api/auth/login',
    details: 'Blocked direct legacy login without Cloudflare + 6-digit OTP.',
  });
  res.status(410).json({
    error: 'Direct login is disabled. Complete Cloudflare verification and 6-digit email OTP.',
  });
});

apiRouter.post('/auth/login/start', authRateLimit, async (req, res) => {
  const email = cleanText(req.body?.email, 254).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const turnstileToken = typeof req.body?.turnstileToken === 'string' ? req.body.turnstileToken : '';

  const turnstile = await verifyTurnstileToken(turnstileToken, getClientIp(req));
  if (!turnstile.ok) {
    res.status(400).json({ error: turnstile.error || 'Cloudflare verification required.' });
    return;
  }

  if (!isValidEmail(email) || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const lockout = db
    .prepare('SELECT failed_attempts, locked_until FROM auth_lockouts WHERE email = ?')
    .get(email) as { failed_attempts: number; locked_until: string | null } | undefined;

  if (lockout?.locked_until && new Date(lockout.locked_until) > new Date()) {
    const minsLeft = Math.max(
      1,
      Math.ceil((new Date(lockout.locked_until).getTime() - Date.now()) / 60_000),
    );
    recordSecurityEvent({
      eventType: 'ACCOUNT_LOCKED_ATTEMPT',
      severity: 'warning',
      ipAddress: getClientIp(req),
      actorEmail: email,
      path: '/api/auth/login/start',
      details: `Blocked login attempt during active brute-force lockout (${minsLeft}m left).`,
    });
    res.status(429).json({
      error: `Account temporarily locked due to repeated failed sign-in attempts. Try again in ${minsLeft} minute${minsLeft === 1 ? '' : 's'}.`,
    });
    return;
  }

  const row = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const valid = await verifyPassword(password, String(row.password_hash));
  if (!valid) {
    const nowIso = new Date().toISOString();
    const nextFailed = (lockout?.failed_attempts ?? 0) + 1;
    const shouldLock = nextFailed >= 5;
    const lockedUntil = shouldLock ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;

    db.prepare(`
      INSERT INTO auth_lockouts (email, failed_attempts, locked_until, last_failed_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        failed_attempts = excluded.failed_attempts,
        locked_until = excluded.locked_until,
        last_failed_at = excluded.last_failed_at,
        updated_at = excluded.updated_at
    `).run(email, nextFailed, lockedUntil, nowIso, nowIso);

    if (shouldLock) {
      recordSecurityEvent({
        eventType: 'BRUTE_FORCE_LOCKOUT',
        severity: 'high',
        ipAddress: getClientIp(req),
        actorEmail: email,
        path: '/api/auth/login/start',
        details: `Account locked for 15 minutes after ${nextFailed} failed password attempts.`,
      });
      if (Number(row.notify_security) === 1) {
        createNotification(
          String(row.id),
          'Security Alert: Temporary Sign-In Lockout',
          '5 failed sign-in attempts were blocked and your account was locked for 15 minutes.',
        );
      }
      res.status(429).json({
        error: 'Too many failed password attempts. Account locked for 15 minutes for protection.',
      });
      return;
    }

    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (row.status !== 'active') {
    res.status(403).json({ error: 'This account has been suspended. Contact support.' });
    return;
  }

  const controls = getSecurityControls();
  if (controls.loginRestriction && !isAdminPanelRole(String(row.role) as UserRole)) {
    res.status(403).json({
      error: 'Customer sign-in is temporarily restricted by administrators. Please try again later.',
    });
    return;
  }

  db.prepare('DELETE FROM auth_lockouts WHERE email = ?').run(email);

  const challengeId = generateId('otp');
  const code = generateSixDigitCode();
  const codeHash = hashOtpCode(challengeId, code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO email_otp_codes (id, purpose, email, name, password_hash, code_hash, attempts, expires_at, consumed, created_at)
    VALUES (?, 'login', ?, ?, '', ?, 0, ?, 0, ?)
  `).run(challengeId, email, String(row.name), codeHash, expiresAt, now.toISOString());

  const delivery = await sendOtpEmail({
    email,
    name: String(row.name),
    code,
    purpose: 'login',
  });

  res.json({
    challengeId,
    email,
    expiresInSeconds: 600,
    deliveryMode: delivery.deliveryMode,
    ...(delivery.deliveryMode === 'preview' ? { codePreview: code } : {}),
  });
});

apiRouter.post('/auth/register/start', authRateLimit, async (req, res) => {
  const controls = getSecurityControls();
  if (controls.loginRestriction || controls.maintenanceLockdown) {
    res.status(403).json({ error: 'New account registrations are temporarily paused.' });
    return;
  }

  const name = cleanText(req.body?.name, 80);
  const email = cleanText(req.body?.email, 254).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const turnstileToken = typeof req.body?.turnstileToken === 'string' ? req.body.turnstileToken : '';

  const turnstile = await verifyTurnstileToken(turnstileToken, getClientIp(req));
  if (!turnstile.ok) {
    res.status(400).json({ error: turnstile.error || 'Cloudflare verification required.' });
    return;
  }

  if (name.length < 2) {
    res.status(400).json({ error: 'Name must be at least 2 characters.' });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }

  const strengthErr = validatePasswordStrength(password);
  if (strengthErr) {
    res.status(400).json({ error: strengthErr });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const challengeId = generateId('otp');
  const code = generateSixDigitCode();
  const codeHash = hashOtpCode(challengeId, code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO email_otp_codes (id, purpose, email, name, password_hash, code_hash, attempts, expires_at, consumed, created_at)
    VALUES (?, 'register', ?, ?, ?, ?, 0, ?, 0, ?)
  `).run(challengeId, email, name, passwordHash, codeHash, expiresAt, now.toISOString());

  const delivery = await sendOtpEmail({
    email,
    name,
    code,
    purpose: 'register',
  });

  res.json({
    challengeId,
    email,
    expiresInSeconds: 600,
    deliveryMode: delivery.deliveryMode,
    ...(delivery.deliveryMode === 'preview' ? { codePreview: code } : {}),
  });
});

apiRouter.post('/auth/otp/resend', authRateLimit, async (req, res) => {
  const challengeId = cleanText(req.body?.challengeId, 64);
  if (!challengeId) {
    res.status(400).json({ error: 'Verification challenge ID is required.' });
    return;
  }

  const row = db
    .prepare('SELECT * FROM email_otp_codes WHERE id = ? AND consumed = 0')
    .get(challengeId) as
    | { id: string; purpose: 'login' | 'register'; email: string; name: string; created_at: string }
    | undefined;

  if (!row) {
    res.status(404).json({ error: 'Verification session expired. Please start again.' });
    return;
  }

  const elapsedMs = Date.now() - new Date(row.created_at).getTime();
  if (elapsedMs < 20_000) {
    res.status(429).json({
      error: `Please wait ${Math.ceil((20_000 - elapsedMs) / 1000)}s before requesting a new code.`,
    });
    return;
  }

  const code = generateSixDigitCode();
  const codeHash = hashOtpCode(row.id, code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

  db.prepare(`
    UPDATE email_otp_codes SET code_hash = ?, attempts = 0, expires_at = ?, created_at = ? WHERE id = ?
  `).run(codeHash, expiresAt, now.toISOString(), row.id);

  const delivery = await sendOtpEmail({
    email: row.email,
    name: row.name,
    code,
    purpose: row.purpose,
  });

  res.json({
    ok: true,
    expiresInSeconds: 600,
    deliveryMode: delivery.deliveryMode,
    ...(delivery.deliveryMode === 'preview' ? { codePreview: code } : {}),
  });
});

apiRouter.post('/auth/otp/verify', authRateLimit, async (req, res) => {
  const challengeId = cleanText(req.body?.challengeId, 64);
  const code = cleanText(req.body?.code, 12).replace(/\s+/g, '');
  const totpCode = cleanText(req.body?.totpCode, 16).replace(/\s+/g, '');
  const backupCode = cleanText(req.body?.backupCode, 32).toUpperCase();

  if (!challengeId || !/^\d{6}$/.test(code)) {
    res.status(400).json({ error: 'Enter the 6-digit verification code sent to your email.' });
    return;
  }

  const challenge = db
    .prepare('SELECT * FROM email_otp_codes WHERE id = ?')
    .get(challengeId) as
    | {
        id: string;
        purpose: 'login' | 'register';
        email: string;
        name: string;
        password_hash: string;
        code_hash: string;
        attempts: number;
        expires_at: string;
        consumed: number;
      }
    | undefined;

  if (!challenge || challenge.consumed === 1) {
    res.status(404).json({ error: 'Verification session not found or already used.' });
    return;
  }

  if (new Date(challenge.expires_at) < new Date()) {
    res.status(410).json({ error: 'Verification code has expired. Please request a new code.' });
    return;
  }

  if (challenge.attempts >= 5) {
    res.status(429).json({ error: 'Too many invalid code attempts. Please start again.' });
    return;
  }

  const candidateHash = hashOtpCode(challenge.id, code);
  const candidateBuf = Buffer.from(candidateHash, 'hex');
  const expectedBuf = Buffer.from(challenge.code_hash, 'hex');
  const isMatch =
    candidateBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(candidateBuf, expectedBuf);

  if (!isMatch) {
    const nextAttempts = challenge.attempts + 1;
    db.prepare('UPDATE email_otp_codes SET attempts = ? WHERE id = ?').run(
      nextAttempts,
      challenge.id,
    );
    const remaining = Math.max(0, 5 - nextAttempts);
    res.status(401).json({
      error:
        remaining > 0
          ? `Invalid 6-digit code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Too many invalid attempts. Please start again.',
    });
    return;
  }

  const now = new Date().toISOString();

  if (challenge.purpose === 'login') {
    const userRow = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(challenge.email) as Record<string, unknown> | undefined;
    if (!userRow || userRow.status !== 'active') {
      res.status(403).json({ error: 'Account unavailable. Contact support.' });
      return;
    }

    // If user enabled TOTP Authenticator MFA, verify it before issuing a session token
    if (Number(userRow.totp_enabled ?? 0) === 1 && String(userRow.totp_secret || '')) {
      if (!totpCode && !backupCode) {
        res.json({
          mfaRequired: true,
          challengeId: challenge.id,
          email: challenge.email,
        });
        return;
      }

      let mfaValid = false;
      if (totpCode && verifyTotpCode(String(userRow.totp_secret), totpCode)) {
        mfaValid = true;
      } else if (backupCode) {
        const storedHashes = JSON.parse(String(userRow.mfa_backup_hashes_json || '[]')) as string[];
        for (let i = 0; i < storedHashes.length; i += 1) {
          if (await verifyPassword(backupCode, storedHashes[i])) {
            mfaValid = true;
            storedHashes.splice(i, 1);
            db.prepare('UPDATE users SET mfa_backup_hashes_json = ? WHERE id = ?').run(
              JSON.stringify(storedHashes),
              String(userRow.id),
            );
            break;
          }
        }
      }

      if (!mfaValid) {
        const nextAttempts = challenge.attempts + 1;
        db.prepare('UPDATE email_otp_codes SET attempts = ? WHERE id = ?').run(
          nextAttempts,
          challenge.id,
        );
        recordSecurityEvent({
          eventType: 'MFA_VERIFICATION_FAILED',
          severity: 'warning',
          ipAddress: getClientIp(req),
          actorEmail: challenge.email,
          path: '/api/auth/otp/verify',
          details: 'Invalid Authenticator TOTP or backup code during login.',
        });
        res.status(401).json({ error: 'Invalid Authenticator 6-digit or backup code.' });
        return;
      }
    }

    db.prepare('UPDATE email_otp_codes SET consumed = 1 WHERE id = ?').run(challenge.id);
    if (Number(userRow.email_verified) === 0) {
      db.prepare('UPDATE users SET email_verified = 1, verification_token = NULL, updated_at = ? WHERE id = ?').run(
        now,
        String(userRow.id),
      );
      syncEarlyAccessForVerifiedEmail(String(userRow.id), challenge.email);
    }

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(String(userRow.id)) as Record<
      string,
      unknown
    >;
    const { token } = issueUserSession(
      {
        id: String(updated.id),
        email: String(updated.email),
        role: String(updated.role) as UserRole,
      },
      req,
    );
    recordSecurityEvent({
      eventType: 'LOGIN_OTP_VERIFIED',
      severity: 'info',
      ipAddress: getClientIp(req),
      actorEmail: String(updated.email),
      path: '/api/auth/otp/verify',
      details:
        Number(userRow.totp_enabled ?? 0) === 1
          ? 'Signed in with Turnstile + 6-digit email OTP + TOTP MFA.'
          : 'Signed in with Cloudflare Turnstile + 6-digit email OTP.',
    });
    res.json({ token, user: sanitizeUser(updated) });
    return;
  }

  // Register completion
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(challenge.email);
  if (existing) {
    db.prepare('UPDATE email_otp_codes SET consumed = 1 WHERE id = ?').run(challenge.id);
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const userId = generateId('usr');
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, status, email_verified, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'customer', 'active', 1, ?, ?)
  `).run(userId, challenge.name, challenge.email, challenge.password_hash, now, now);

  db.prepare('UPDATE email_otp_codes SET consumed = 1 WHERE id = ?').run(challenge.id);

  createNotification(
    userId,
    'Welcome to HelzerX Technologies',
    'Your email address has been verified via 6-digit security code and your unified account is active.',
  );
  syncEarlyAccessForVerifiedEmail(userId, challenge.email);

  const createdRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as Record<
    string,
    unknown
  >;
  const { token } = issueUserSession(
    {
      id: userId,
      email: challenge.email,
      role: 'customer',
    },
    req,
  );
  recordSecurityEvent({
    eventType: 'REGISTER_OTP_VERIFIED',
    severity: 'info',
    ipAddress: getClientIp(req),
    actorEmail: challenge.email,
    path: '/api/auth/otp/verify',
    details: 'Account created and verified via 6-digit email OTP.',
  });
  res.status(201).json({ token, user: sanitizeUser(createdRow) });
});

apiRouter.get('/auth/oauth/:provider/url', authRateLimit, (req, res) => {
  const config = getProviderConfig(req.params.provider);
  if (!config) {
    res.status(404).json({ error: 'Unsupported OAuth provider.' });
    return;
  }

  const originQuery = typeof req.query.origin === 'string' ? req.query.origin : undefined;
  const baseUrl = resolveAppBaseUrl(originQuery, req.get('host'));
  const redirectUri = `${baseUrl}/api/auth/oauth/${config.id}/callback`;

  if (!config.configured) {
    res.json({
      configured: false,
      provider: config.id,
      label: config.label,
      callbackUrl: redirectUri,
      requiredEnvVars: [config.clientIdEnv, config.clientSecretEnv],
    });
    return;
  }

  const url = buildOAuthAuthorizeUrl(config, redirectUri);
  res.json({
    configured: true,
    provider: config.id,
    label: config.label,
    callbackUrl: redirectUri,
    url,
  });
});

const oauthCallbackHandler = async (req: Request, res: Response) => {
  const sendPopupResult = (payload: Record<string, unknown>) => {
    const serialized = JSON.stringify(payload).replace(/</g, '\\u003c');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html>
<html>
  <head><title>HelzerX Authentication</title></head>
  <body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #F4F4F5; color: #0A0A0B;">
    <div style="text-align: center; max-width: 360px; padding: 24px;">
      <p style="font-weight: 700; margin-bottom: 8px;">Completing HelzerX Sign-In...</p>
      <p style="font-size: 13px; color: #52525B;">This window will close automatically.</p>
    </div>
    <script>
      (function() {
        var data = ${serialized};
        if (window.opener) {
          window.opener.postMessage(data, '*');
          window.close();
        } else {
          window.location.href = '/#/auth';
        }
      })();
    </script>
  </body>
</html>`);
  };

  const config = getProviderConfig(req.params.provider);
  if (!config || !config.configured) {
    sendPopupResult({ type: 'HELZERX_OAUTH_ERROR', error: 'OAuth provider is not configured.' });
    return;
  }

  const source = req.method === 'POST' ? (req.body ?? {}) : req.query;
  const errorParam = typeof source.error === 'string' ? source.error : '';
  if (errorParam) {
    sendPopupResult({
      type: 'HELZERX_OAUTH_ERROR',
      error: cleanText(source.error_description || errorParam, 200),
    });
    return;
  }

  const code = typeof source.code === 'string' ? source.code : '';
  const state = typeof source.state === 'string' ? source.state : '';
  const appleUserJson = typeof source.user === 'string' ? source.user : undefined;

  const parsedState = verifyOAuthState(state, config.id);
  if (!code || !parsedState) {
    sendPopupResult({
      type: 'HELZERX_OAUTH_ERROR',
      error: 'Invalid or expired OAuth state. Please try again.',
    });
    return;
  }

  try {
    const profile = await exchangeOAuthCodeForProfile({
      config,
      code,
      redirectUri: parsedState.redirectUri,
      appleUserJson,
    });

    const now = new Date().toISOString();
    let userRow = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(profile.email) as Record<string, unknown> | undefined;

    if (!userRow) {
      const userId = generateId('usr');
      const randomPasswordHash = await hashPassword(crypto.randomBytes(24).toString('hex'));
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, role, status, email_verified, avatar_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'customer', 'active', 1, ?, ?, ?)
      `).run(
        userId,
        profile.name,
        profile.email,
        randomPasswordHash,
        isSafeHttpUrl(profile.avatarUrl) ? profile.avatarUrl : '',
        now,
        now,
      );
      createNotification(
        userId,
        `Signed up via ${config.label}`,
        `Your HelzerX Technologies account is linked with ${config.label}.`,
      );
      syncEarlyAccessForVerifiedEmail(userId, profile.email);
      userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as Record<string, unknown>;
    } else {
      if (userRow.status !== 'active') {
        sendPopupResult({
          type: 'HELZERX_OAUTH_ERROR',
          error: 'This account has been suspended. Contact support.',
        });
        return;
      }
      if (Number(userRow.email_verified) === 0) {
        db.prepare('UPDATE users SET email_verified = 1, verification_token = NULL, updated_at = ? WHERE id = ?').run(
          now,
          String(userRow.id),
        );
        syncEarlyAccessForVerifiedEmail(String(userRow.id), profile.email);
        userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(String(userRow.id)) as Record<
          string,
          unknown
        >;
      }
    }

    const sanitized = sanitizeUser(userRow);
    const { token } = issueUserSession(
      {
        id: sanitized.id,
        email: sanitized.email,
        role: sanitized.role,
      },
      req,
    );
    recordSecurityEvent({
      eventType: 'OAUTH_LOGIN_SUCCESS',
      severity: 'info',
      ipAddress: getClientIp(req),
      actorEmail: sanitized.email,
      path: `/api/auth/oauth/${config.id}/callback`,
      details: `Authenticated via ${config.label} OAuth.`,
    });

    sendPopupResult({
      type: 'HELZERX_OAUTH_SUCCESS',
      provider: config.id,
      token,
      user: sanitized,
    });
  } catch (err) {
    sendPopupResult({
      type: 'HELZERX_OAUTH_ERROR',
      error: err instanceof Error ? err.message : `${config.label} authentication failed.`,
    });
  }
};

apiRouter.all(
  ['/auth/oauth/:provider/callback', '/auth/oauth/:provider/callback/'],
  oauthCallbackHandler,
);

apiRouter.post('/auth/verify-email', authRateLimit, (req, res) => {
  const token = cleanText(req.body?.token, 64);
  if (!token) {
    res.status(400).json({ error: 'Verification token is required.' });
    return;
  }

  const user = db
    .prepare('SELECT id, email FROM users WHERE verification_token = ?')
    .get(token) as { id: string; email: string } | undefined;

  if (!user) {
    res.status(404).json({ error: 'Invalid or expired verification token.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(
    'UPDATE users SET email_verified = 1, verification_token = NULL, updated_at = ? WHERE id = ?',
  ).run(now, user.id);

  // Sync Early Access registration eligibility if this user registered before launch
  const ea = db
    .prepare('SELECT id, accepted_terms FROM early_access_registrations WHERE email = ?')
    .get(user.email) as { id: string; accepted_terms: number } | undefined;
  if (ea && ea.accepted_terms === 1) {
    const campaign = db
      .prepare('SELECT launch_date, early_access_limit FROM launch_campaign WHERE id = ?')
      .get('launch_2027') as { launch_date: string; early_access_limit: number } | undefined;
    const qualifiedCount = db
      .prepare("SELECT COUNT(*) as c FROM early_access_registrations WHERE eligibility_status = 'qualified'")
      .get() as { c: number };
    const limit = campaign?.early_access_limit ?? 50;
    const beforeLaunch = campaign ? new Date() < new Date(campaign.launch_date) : true;
    const newStatus = beforeLaunch && qualifiedCount.c < limit ? 'qualified' : 'waitlisted';
    const slotNum = newStatus === 'qualified' ? qualifiedCount.c + 1 : null;
    db.prepare(
      'UPDATE early_access_registrations SET email_verified = 1, eligibility_status = ?, slot_number = ? WHERE id = ?',
    ).run(newStatus, slotNum, ea.id);
  }

  res.json({ ok: true, message: 'Email address verified.' });
});

apiRouter.post('/auth/request-reset', authRateLimit, (req, res) => {
  recordSecurityEvent({
    eventType: 'LEGACY_RESET_BLOCKED',
    severity: 'warning',
    ipAddress: getClientIp(req),
    actorEmail: cleanText(req.body?.email, 254).toLowerCase(),
    path: '/api/auth/request-reset',
    details: 'Blocked disabled token-preview password reset endpoint.',
  });
  res.status(410).json({
    error: 'Legacy token-preview password reset is disabled. Use Security Settings or contact support@helzerx.cyou.',
  });
});

apiRouter.post('/auth/reset-password', authRateLimit, (_req, res) => {
  res.status(410).json({
    error: 'Legacy token-preview password reset is disabled. Use Security Settings or contact support@helzerx.cyou.',
  });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: req.authUser });
});

apiRouter.post('/auth/logout', requireAuth, (req: AuthedRequest, res) => {
  if (req.authSessionId) {
    db.prepare('UPDATE user_sessions SET revoked_at = ? WHERE id = ? AND user_id = ?').run(
      new Date().toISOString(),
      req.authSessionId,
      req.authUser!.id,
    );
  }
  res.json({ ok: true });
});

apiRouter.post('/auth/logout-all', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const nowIso = new Date().toISOString();
  db.prepare('UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(
    nowIso,
    user.id,
  );
  recordSecurityEvent({
    eventType: 'REVOKE_ALL_SESSIONS',
    severity: 'info',
    ipAddress: getClientIp(req),
    actorEmail: user.email,
    path: '/api/auth/logout-all',
    details: 'User terminated all active sessions.',
  });
  res.json({ ok: true, message: 'Signed out from all active devices.' });
});

apiRouter.get('/auth/sessions', requireAuth, (req: AuthedRequest, res) => {
  const nowIso = new Date().toISOString();
  const rows = db
    .prepare(
      `SELECT id, ip_address, user_agent, created_at, last_seen_at, expires_at
       FROM user_sessions
       WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ?
       ORDER BY last_seen_at DESC`,
    )
    .all(req.authUser!.id, nowIso) as {
    id: string;
    ip_address: string;
    user_agent: string;
    created_at: string;
    last_seen_at: string;
    expires_at: string;
  }[];

  res.json({
    sessions: rows.map((s) => ({
      ...s,
      is_current: s.id === req.authSessionId,
    })),
  });
});

apiRouter.delete('/auth/sessions/:id', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const targetId = cleanText(req.params.id, 64);
  const result = db
    .prepare('UPDATE user_sessions SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL')
    .run(new Date().toISOString(), targetId, user.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Active session not found.' });
    return;
  }

  recordSecurityEvent({
    eventType: 'SESSION_REVOKED',
    severity: 'info',
    ipAddress: getClientIp(req),
    actorEmail: user.email,
    path: `/api/auth/sessions/${targetId}`,
    details: `Revoked session ${targetId}.`,
  });
  res.json({ ok: true, revokedCurrent: targetId === req.authSessionId });
});

apiRouter.get('/auth/security-events', requireAuth, (req: AuthedRequest, res) => {
  const events = db
    .prepare(
      `SELECT id, event_type, severity, ip_address, path, details, created_at
       FROM security_events
       WHERE actor_email = ?
       ORDER BY created_at DESC
       LIMIT 20`,
    )
    .all(req.authUser!.email);
  res.json({ events });
});

apiRouter.patch('/auth/profile', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const name = cleanText(req.body?.name, 80) || user.name;
  const avatarUrlRaw = cleanText(req.body?.avatar_url, 500);
  const avatarUrl = avatarUrlRaw && isSafeHttpUrl(avatarUrlRaw) ? avatarUrlRaw : user.avatar_url;
  const notifyEmail = req.body?.notify_email === false ? 0 : 1;
  const notifySecurity = req.body?.notify_security === false ? 0 : 1;

  db.prepare(`
    UPDATE users SET name = ?, avatar_url = ?, notify_email = ?, notify_security = ?, updated_at = ? WHERE id = ?
  `).run(name, avatarUrl, notifyEmail, notifySecurity, new Date().toISOString(), user.id);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as Record<string, unknown>;
  res.json({ user: sanitizeUser(updated) });
});

apiRouter.patch('/auth/password', requireAuth, async (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

  const strengthErr = validatePasswordStrength(newPassword);
  if (strengthErr) {
    res.status(400).json({ error: strengthErr });
    return;
  }

  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id) as {
    password_hash: string;
  };
  const valid = await verifyPassword(currentPassword, row.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Current password is incorrect.' });
    return;
  }

  const nowIso = new Date().toISOString();
  const nextHash = await hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
    nextHash,
    nowIso,
    user.id,
  );

  // Revoke all other active sessions whenever a password is changed
  if (req.authSessionId) {
    db.prepare(
      'UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND id != ? AND revoked_at IS NULL',
    ).run(nowIso, user.id, req.authSessionId);
  } else {
    db.prepare('UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(
      nowIso,
      user.id,
    );
  }

  recordSecurityEvent({
    eventType: 'PASSWORD_UPDATED',
    severity: 'info',
    ipAddress: getClientIp(req),
    actorEmail: user.email,
    path: '/api/auth/password',
    details: 'Password changed and other active sessions revoked.',
  });

  if (user.notify_security === 1) {
    createNotification(
      user.id,
      'Password Updated',
      'Your account password was changed and all other active device sessions were signed out.',
    );
  }

  res.json({
    ok: true,
    message: 'Password updated and all other active sessions signed out.',
  });
});

// TOTP Authenticator App MFA & Privacy Data Export
apiRouter.get('/auth/mfa/status', requireAuth, (req: AuthedRequest, res) => {
  const row = db
    .prepare('SELECT totp_enabled, mfa_backup_hashes_json FROM users WHERE id = ?')
    .get(req.authUser!.id) as { totp_enabled: number; mfa_backup_hashes_json: string } | undefined;
  let backupCodesRemaining = 0;
  try {
    backupCodesRemaining = (JSON.parse(row?.mfa_backup_hashes_json || '[]') as string[]).length;
  } catch {
    backupCodesRemaining = 0;
  }
  res.json({
    enabled: Number(row?.totp_enabled ?? 0) === 1,
    backupCodesRemaining,
  });
});

apiRouter.post('/auth/mfa/setup', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const secret = generateTotpSecret();
  db.prepare('UPDATE users SET totp_secret = ?, totp_enabled = 0, updated_at = ? WHERE id = ?').run(
    secret,
    new Date().toISOString(),
    user.id,
  );
  const otpauthUrl = buildTotpOtpAuthUri(user.email, secret);
  res.json({ secret, otpauthUrl });
});

apiRouter.post('/auth/mfa/verify-enable', requireAuth, async (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const code = cleanText(req.body?.code, 16);
  const row = db
    .prepare('SELECT totp_secret FROM users WHERE id = ?')
    .get(user.id) as { totp_secret: string } | undefined;

  if (!row?.totp_secret || !verifyTotpCode(row.totp_secret, code)) {
    res.status(400).json({ error: 'Invalid 6-digit authenticator code. Ensure device time is synced.' });
    return;
  }

  const backupCodes: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const raw = `${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    backupCodes.push(raw);
    hashes.push(await hashPassword(raw));
  }

  db.prepare(
    'UPDATE users SET totp_enabled = 1, mfa_backup_hashes_json = ?, updated_at = ? WHERE id = ?',
  ).run(JSON.stringify(hashes), new Date().toISOString(), user.id);

  recordSecurityEvent({
    eventType: 'MFA_ENABLED',
    severity: 'info',
    ipAddress: getClientIp(req),
    actorEmail: user.email,
    path: '/api/auth/mfa/verify-enable',
    details: 'User enabled RFC 6238 TOTP Authenticator MFA.',
  });
  createNotification(
    user.id,
    'Authenticator MFA Enabled',
    'Two-factor authentication is now active on your HelzerX Technologies account.',
  );

  res.json({ ok: true, backupCodes });
});

apiRouter.post('/auth/mfa/disable', requireAuth, async (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const code = cleanText(req.body?.code, 24).toUpperCase();

  const row = db
    .prepare('SELECT password_hash, totp_secret, totp_enabled, mfa_backup_hashes_json FROM users WHERE id = ?')
    .get(user.id) as
    | { password_hash: string; totp_secret: string; totp_enabled: number; mfa_backup_hashes_json: string }
    | undefined;

  if (!row || !(await verifyPassword(currentPassword, row.password_hash))) {
    res.status(401).json({ error: 'Current password verification failed.' });
    return;
  }

  if (row.totp_enabled === 1) {
    let validCode = verifyTotpCode(row.totp_secret, code);
    if (!validCode && code) {
      const hashes = JSON.parse(row.mfa_backup_hashes_json || '[]') as string[];
      for (const h of hashes) {
        if (await verifyPassword(code, h)) {
          validCode = true;
          break;
        }
      }
    }
    if (!validCode) {
      res.status(401).json({ error: 'Valid TOTP or backup code is required to disable MFA.' });
      return;
    }
  }

  db.prepare(
    "UPDATE users SET totp_enabled = 0, totp_secret = '', mfa_backup_hashes_json = '[]', updated_at = ? WHERE id = ?",
  ).run(new Date().toISOString(), user.id);

  recordSecurityEvent({
    eventType: 'MFA_DISABLED',
    severity: 'warning',
    ipAddress: getClientIp(req),
    actorEmail: user.email,
    path: '/api/auth/mfa/disable',
    details: 'User disabled Authenticator MFA.',
  });

  res.json({ ok: true, message: 'Authenticator MFA disabled.' });
});

apiRouter.get('/auth/export-data', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const servers = db.prepare('SELECT id, name, plan_id, node_name, status, location, created_at FROM cloud_servers WHERE user_id = ?').all(user.id);
  const orders = db.prepare('SELECT id, subtotal_usd, discount_usd, total_usd, coupon_code, status, payment_status, created_at FROM orders WHERE user_id = ?').all(user.id);
  const projects = db.prepare('SELECT id, title, service_type, status, created_at FROM studio_projects WHERE user_id = ? OR client_email = ?').all(user.id, user.email);
  const tickets = db.prepare('SELECT id, subject, category, priority, status, created_at FROM support_tickets WHERE user_id = ? OR email = ?').all(user.id, user.email);

  recordSecurityEvent({
    eventType: 'DATA_EXPORT_REQUESTED',
    severity: 'info',
    ipAddress: getClientIp(req),
    actorEmail: user.email,
    path: '/api/auth/export-data',
    details: 'User downloaded sanitized account data archive.',
  });

  res.json({
    exportedAt: new Date().toISOString(),
    account: user,
    servers,
    orders,
    projects,
    tickets,
  });
});

// ==================================================
// PUBLIC SITE DATA & CAMPAIGN
// ==================================================

apiRouter.get('/public/site-data', (_req, res) => {
  const settingsRows = db.prepare('SELECT key, value_json FROM site_settings').all() as {
    key: string;
    value_json: string;
  }[];
  const settings: Record<string, unknown> = {};
  for (const row of settingsRows) {
    try {
      settings[row.key] = JSON.parse(row.value_json);
    } catch {
      settings[row.key] = {};
    }
  }

  const announcements = db
    .prepare('SELECT * FROM announcements WHERE active = 1 ORDER BY created_at DESC')
    .all();
  const faqs = db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC').all();
  const campaign = db
    .prepare('SELECT * FROM launch_campaign WHERE id = ?')
    .get('launch_2027') as {
    launch_date: string;
    base_preorders: number;
    early_access_limit: number;
    announcement_text: string;
  };

  const orderCountRow = db
    .prepare("SELECT COUNT(*) as c FROM orders WHERE status != 'cancelled'")
    .get() as { c: number };
  const earlyAccessQualifiedRow = db
    .prepare(
      "SELECT COUNT(*) as c FROM early_access_registrations WHERE eligibility_status = 'qualified'",
    )
    .get() as { c: number };
  const earlyAccessTotalRow = db
    .prepare('SELECT COUNT(*) as c FROM early_access_registrations')
    .get() as { c: number };

  const featuredProducts = db
    .prepare('SELECT * FROM products WHERE active = 1 AND featured = 1 ORDER BY created_at DESC')
    .all();
  const blogPosts = db
    .prepare("SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC LIMIT 6")
    .all();

  res.json({
    settings,
    announcements,
    faqs,
    featuredProducts,
    blogPosts,
    launch: {
      launchDate: campaign?.launch_date ?? '2027-01-01T00:00:00Z',
      basePreorders: campaign?.base_preorders ?? 0,
      totalPreorders: (campaign?.base_preorders ?? 0) + orderCountRow.c,
      earlyAccessLimit: campaign?.early_access_limit ?? 50,
      earlyAccessQualified: earlyAccessQualifiedRow.c,
      earlyAccessRegistrations: earlyAccessTotalRow.c,
      announcementText: campaign?.announcement_text ?? '',
    },
  });
});

// ==================================================
// HELZERX CLOUD & PTERODACTYL INTEGRATION
// ==================================================

apiRouter.get('/cloud/plans', (_req, res) => {
  const plans = db.prepare('SELECT * FROM hosting_plans ORDER BY sort_order ASC').all();
  res.json({ plans });
});

apiRouter.get('/cloud/pterodactyl/status', (req, res) => {
  const status = getPterodactylStatus();
  const optUser = getOptionalUser(req);
  const canSeeUrl = Boolean(optUser && isAdminPanelRole(optUser.role));
  res.json({
    ...status,
    panelUrl: canSeeUrl ? status.panelUrl : null,
  });
});

apiRouter.get('/cloud/servers', requireAuth, async (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const isAdmin = isAdminPanelRole(user.role);

  const dbServers = isAdmin
    ? db.prepare(`
        SELECT cs.*, hp.name as plan_name, hp.cpu, hp.ram_gb, hp.storage_gb, u.email as owner_email
        FROM cloud_servers cs
        LEFT JOIN hosting_plans hp ON cs.plan_id = hp.id
        LEFT JOIN users u ON cs.user_id = u.id
        ORDER BY cs.created_at DESC
      `).all()
    : db.prepare(`
        SELECT cs.*, hp.name as plan_name, hp.cpu, hp.ram_gb, hp.storage_gb
        FROM cloud_servers cs
        LEFT JOIN hosting_plans hp ON cs.plan_id = hp.id
        WHERE cs.user_id = ?
        ORDER BY cs.created_at DESC
      `).all(user.id);

  const pteroStatus = getPterodactylStatus();
  let pterodactylServers: unknown[] = [];
  let pterodactylError: string | null = null;

  if (pteroStatus.configured && isAdmin) {
    const pteroRes = await fetchPterodactylAppServers();
    if (pteroRes.ok && pteroRes.servers) {
      pterodactylServers = pteroRes.servers;
    } else if (pteroRes.error) {
      pterodactylError = pteroRes.error;
    }
  }

  res.json({
    servers: dbServers,
    pterodactyl: {
      configured: pteroStatus.configured,
      panelUrl: isAdmin ? pteroStatus.panelUrl : null,
      hasClientKey: pteroStatus.hasClientKey,
      requiredEnvVars: pteroStatus.requiredEnvVars,
      syncedServers: pterodactylServers,
      syncError: pterodactylError,
    },
  });
});

apiRouter.post('/cloud/servers/request', requireAuth, formRateLimit, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  if (user.email_verified !== 1) {
    res.status(403).json({ error: 'Verify your email address before requesting cloud infrastructure.' });
    return;
  }

  const planId = cleanText(req.body?.planId, 64);
  const serverName = cleanText(req.body?.name, 60);

  if (!planId || serverName.length < 3) {
    res.status(400).json({ error: 'Valid plan and server name (min 3 chars) are required.' });
    return;
  }

  if (!isAdminPanelRole(user.role)) {
    const pendingCount = (
      db
        .prepare("SELECT COUNT(*) as c FROM cloud_servers WHERE user_id = ? AND status = 'pending_provisioning'")
        .get(user.id) as { c: number }
    ).c;
    if (pendingCount >= 5) {
      res.status(429).json({
        error: 'Pending server request limit (5) reached. Wait for provisioning before submitting more.',
      });
      return;
    }
  }

  const plan = db.prepare('SELECT * FROM hosting_plans WHERE id = ? AND available = 1').get(planId) as
    | { id: string; location: string; name: string }
    | undefined;
  if (!plan) {
    res.status(404).json({ error: 'Selected hosting plan is unavailable.' });
    return;
  }

  const serverId = generateId('srv');
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO cloud_servers (id, user_id, plan_id, name, node_name, status, location, created_at)
    VALUES (?, ?, ?, ?, 'hx-nd-01-10', 'pending_provisioning', ?, ?)
  `).run(serverId, user.id, plan.id, serverName, plan.location, now);

  createNotification(
    user.id,
    'Server provisioning request submitted',
    `Server "${serverName}" (${plan.name}) is queued for authorized provisioning.`,
  );
  recordSecurityEvent({
    eventType: 'CLOUD_SERVER_REQUESTED',
    severity: 'info',
    ipAddress: getClientIp(req),
    actorEmail: user.email,
    path: '/api/cloud/servers/request',
    details: `Requested ${plan.name} (${serverName}).`,
  });

  const created = db.prepare('SELECT * FROM cloud_servers WHERE id = ?').get(serverId);
  res.status(201).json({ server: created });
});

apiRouter.get('/cloud/servers/:id/resources', requireAuth, formRateLimit, async (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const srv = db.prepare('SELECT * FROM cloud_servers WHERE id = ?').get(req.params.id) as
    | { id: string; user_id: string; pterodactyl_identifier: string; status: string }
    | undefined;
  if (!srv) {
    res.status(404).json({ error: 'Server record not found.' });
    return;
  }
  const isAdmin = isAdminPanelRole(user.role);
  if (srv.user_id !== user.id && !isAdmin) {
    recordSecurityEvent({
      eventType: 'UNAUTHORIZED_CLOUD_ACCESS',
      severity: 'high',
      ipAddress: getClientIp(req),
      actorEmail: user.email,
      path: `/api/cloud/servers/${srv.id}/resources`,
      details: `Blocked attempt to read resources for non-owned server ${srv.id}.`,
    });
    res.status(403).json({ error: 'Access denied.' });
    return;
  }
  if (!srv.pterodactyl_identifier) {
    res.status(409).json({
      error: 'Server is not yet linked to a Pterodactyl identifier.',
    });
    return;
  }

  const result = await fetchPterodactylServerResources(srv.pterodactyl_identifier);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.json({ resources: result.resources });
});

apiRouter.post('/cloud/servers/:id/power', requireAuth, formRateLimit, async (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const signal = req.body?.signal;
  if (!['start', 'stop', 'restart', 'kill'].includes(signal)) {
    res.status(400).json({ error: 'Invalid power signal.' });
    return;
  }

  const srv = db.prepare('SELECT * FROM cloud_servers WHERE id = ?').get(req.params.id) as
    | { id: string; user_id: string; pterodactyl_identifier: string; status: string }
    | undefined;
  if (!srv) {
    res.status(404).json({ error: 'Server record not found.' });
    return;
  }
  const isAdmin = isAdminPanelRole(user.role);
  if (srv.user_id !== user.id && !isAdmin) {
    recordSecurityEvent({
      eventType: 'UNAUTHORIZED_CLOUD_ACCESS',
      severity: 'high',
      ipAddress: getClientIp(req),
      actorEmail: user.email,
      path: `/api/cloud/servers/${srv.id}/power`,
      details: `Blocked power signal (${signal}) on non-owned server ${srv.id}.`,
    });
    res.status(403).json({ error: 'Access denied.' });
    return;
  }
  if (!isAdmin && srv.status !== 'active') {
    res.status(403).json({ error: `Server power actions disabled while status is "${srv.status}".` });
    return;
  }
  if (!srv.pterodactyl_identifier) {
    res.status(409).json({ error: 'Server is not linked to a Pterodactyl identifier yet.' });
    return;
  }

  const result = await sendPterodactylPowerSignal(srv.pterodactyl_identifier, signal);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  logAudit(user.id, user.email, `PTERODACTYL_POWER_${signal.toUpperCase()}`, 'cloud_servers', srv.id);
  res.json({ ok: true, signal });
});

// ==================================================
// HELZERX SHOP (PRODUCTS, REVIEWS, COUPONS, ORDERS)
// ==================================================

apiRouter.get('/shop/products', (_req, res) => {
  const products = db
    .prepare('SELECT * FROM products WHERE active = 1 ORDER BY featured DESC, created_at DESC')
    .all();
  const reviews = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
  res.json({
    products,
    reviews,
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
  });
});

apiRouter.post('/shop/products/:id/reviews', requireAuth, formRateLimit, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const rating = Number(req.body?.rating);
  const comment = cleanText(req.body?.comment, 600);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 5) {
    res.status(400).json({ error: 'Rating (1-5) and comment (min 5 chars) are required.' });
    return;
  }

  const product = db.prepare('SELECT id FROM products WHERE id = ? AND active = 1').get(req.params.id);
  if (!product) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const reviewId = generateId('rev');
  db.prepare(`
    INSERT INTO reviews (id, product_id, user_id, author_name, rating, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(reviewId, req.params.id, user.id, user.name, rating, comment, new Date().toISOString());

  const created = db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId);
  res.status(201).json({ review: created });
});

apiRouter.post('/shop/coupons/validate', formRateLimit, (req, res) => {
  const code = cleanText(req.body?.code, 40).toUpperCase();
  if (!code) {
    res.status(400).json({ error: 'Coupon code is required.' });
    return;
  }

  const coupon = db
    .prepare('SELECT * FROM coupons WHERE code = ? AND active = 1')
    .get(code) as
    | { id: string; code: string; discount_percent: number; max_uses: number; used_count: number; expires_at: string }
    | undefined;

  if (!coupon || coupon.used_count >= coupon.max_uses || new Date(coupon.expires_at) < new Date()) {
    res.status(404).json({ error: 'Coupon code is invalid or expired.' });
    return;
  }

  res.json({
    valid: true,
    code: coupon.code,
    discountPercent: coupon.discount_percent,
  });
});

apiRouter.post('/shop/orders', requireAuth, formRateLimit, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const itemsInput = Array.isArray(req.body?.items) ? req.body.items : [];
  const shippingAddress = cleanText(req.body?.shippingAddress, 300);
  const couponCode = cleanText(req.body?.couponCode, 40).toUpperCase();
  const rawIdempKey = cleanText(
    req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || '',
    100,
  );
  const idempDbKey = rawIdempKey ? `${user.id}:/shop/orders:${rawIdempKey}` : '';

  if (idempDbKey) {
    const existing = db
      .prepare('SELECT status_code, response_json FROM idempotency_keys WHERE key = ?')
      .get(idempDbKey) as { status_code: number; response_json: string } | undefined;
    if (existing) {
      res.status(existing.status_code).json(JSON.parse(existing.response_json));
      return;
    }
  }

  if (itemsInput.length === 0 || itemsInput.length > 25) {
    res.status(400).json({ error: 'Order must contain between 1 and 25 line items.' });
    return;
  }
  if (shippingAddress.length < 6) {
    res.status(400).json({ error: 'Please provide a complete shipping or billing address.' });
    return;
  }

  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const orderId = generateId('ord');
  const invoiceId = generateId('inv');
  const invoiceNumber = `HX-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const now = new Date().toISOString();

  try {
    db.exec('BEGIN IMMEDIATE;');

    let subtotal = 0;
    const resolvedItems: { productId: string; name: string; qty: number; price: number }[] = [];

    for (const rawItem of itemsInput) {
      const productId = cleanText(rawItem?.productId, 64);
      const qty = Number(rawItem?.quantity);
      if (!productId || !Number.isInteger(qty) || qty < 1 || qty > 50) {
        db.exec('ROLLBACK;');
        res.status(400).json({ error: 'Invalid cart item quantity.' });
        return;
      }

      const product = db
        .prepare('SELECT id, name, price_usd, stock FROM products WHERE id = ? AND active = 1')
        .get(productId) as { id: string; name: string; price_usd: number; stock: number } | undefined;

      if (!product) {
        db.exec('ROLLBACK;');
        res.status(404).json({ error: `Product ${productId} is no longer available.` });
        return;
      }

      const stockRes = db
        .prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?')
        .run(qty, product.id, qty);
      if (stockRes.changes === 0) {
        db.exec('ROLLBACK;');
        res.status(409).json({ error: `Insufficient stock for ${product.name}.` });
        return;
      }

      subtotal += product.price_usd * qty;
      resolvedItems.push({
        productId: product.id,
        name: product.name,
        qty,
        price: product.price_usd,
      });
    }

    let discount = 0;
    let appliedCode = '';
    if (couponCode) {
      const coupon = db
        .prepare('SELECT * FROM coupons WHERE code = ? AND active = 1')
        .get(couponCode) as
        | { id: string; code: string; discount_percent: number; max_uses: number; used_count: number; expires_at: string }
        | undefined;
      if (coupon && coupon.used_count < coupon.max_uses && new Date(coupon.expires_at) >= new Date()) {
        discount = Math.round(subtotal * (coupon.discount_percent / 100) * 100) / 100;
        appliedCode = coupon.code;
        db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(coupon.id);
      }
    }

    const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);
    const paymentProvider = stripeConfigured ? 'stripe_pending' : 'unconfigured';

    db.prepare(`
      INSERT INTO orders (id, user_id, customer_name, customer_email, shipping_address, subtotal_usd, discount_usd, total_usd, coupon_code, status, payment_provider, payment_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', ?, 'awaiting_payment', ?)
    `).run(orderId, user.id, user.name, user.email, shippingAddress, subtotal, discount, total, appliedCode, paymentProvider, now);

    const insertItem = db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price_usd)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const item of resolvedItems) {
      insertItem.run(generateId('oi'), orderId, item.productId, item.name, item.qty, item.price);
    }

    db.prepare(`
      INSERT INTO invoices (id, user_id, order_id, invoice_number, amount_usd, status, issued_at)
      VALUES (?, ?, ?, ?, ?, 'unpaid', ?)
    `).run(invoiceId, user.id, orderId, invoiceNumber, total, now);

    db.exec('COMMIT;');
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      // ignore
    }
    res.status(500).json({ error: err instanceof Error ? err.message : 'Order creation failed.' });
    return;
  }

  createNotification(
    user.id,
    `Order ${orderId} created`,
    `Invoice ${invoiceNumber} issued (${stripeConfigured ? 'ready for Stripe settlement' : 'awaiting payment provider configuration'}).`,
  );
  recordSecurityEvent({
    eventType: 'ORDER_CREATED',
    severity: 'info',
    ipAddress: getClientIp(req),
    actorEmail: user.email,
    path: '/api/shop/orders',
    details: `Order ${orderId} ($${Math.max(0, Math.round(Number(req.body?.items?.length || 0)))} items).`,
  });

  const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const createdInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
  const responseBody = {
    order: createdOrder,
    invoice: createdInvoice,
    stripeConfigured,
    paymentNotice: stripeConfigured
      ? 'Order created and awaiting Stripe payment confirmation.'
      : 'Order and invoice saved with status pending_payment. Configure STRIPE_SECRET_KEY on the server to process live card payments.',
  };

  if (idempDbKey) {
    try {
      db.prepare(
        'INSERT OR IGNORE INTO idempotency_keys (key, user_id, route, status_code, response_json, created_at) VALUES (?, ?, ?, 201, ?, ?)',
      ).run(idempDbKey, user.id, '/shop/orders', JSON.stringify(responseBody), now);
    } catch {
      // ignore
    }
  }

  res.status(201).json(responseBody);
});

apiRouter.post('/shop/webhooks/stripe', (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() || '';
  if (!webhookSecret) {
    res.status(503).json({ error: 'STRIPE_WEBHOOK_SECRET is not configured on the server.' });
    return;
  }

  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  const sigHeader = String(req.headers['stripe-signature'] || '');
  if (!rawBody || !verifyStripeWebhookSignature(rawBody, sigHeader, webhookSecret)) {
    recordSecurityEvent({
      eventType: 'STRIPE_WEBHOOK_INVALID',
      severity: 'high',
      ipAddress: getClientIp(req),
      path: '/api/shop/webhooks/stripe',
      details: 'Rejected webhook due to invalid HMAC signature or expired timestamp.',
    });
    res.status(400).json({ error: 'Invalid webhook signature.' });
    return;
  }

  const event = req.body as {
    id?: string;
    type?: string;
    data?: { object?: { metadata?: { order_id?: string }; amount_total?: number } };
  };
  const orderId = cleanText(event?.data?.object?.metadata?.order_id || '', 64);

  if (event?.type === 'checkout.session.completed' && orderId) {
    const order = db.prepare('SELECT id, status FROM orders WHERE id = ?').get(orderId) as
      | { id: string; status: string }
      | undefined;
    if (order && order.status === 'pending_payment') {
      db.prepare("UPDATE orders SET status = 'paid', payment_status = 'paid', payment_provider = 'stripe' WHERE id = ?").run(
        order.id,
      );
      db.prepare("UPDATE invoices SET status = 'paid' WHERE order_id = ?").run(order.id);
      recordSecurityEvent({
        eventType: 'PAYMENT_VERIFIED_WEBHOOK',
        severity: 'info',
        ipAddress: getClientIp(req),
        path: '/api/shop/webhooks/stripe',
        details: `Verified Stripe settlement for order ${order.id}.`,
      });
    }
  } else if (event?.type === 'charge.refunded' && orderId) {
    db.prepare("UPDATE orders SET status = 'refunded', payment_status = 'refunded' WHERE id = ?").run(orderId);
    db.prepare("UPDATE invoices SET status = 'refunded' WHERE order_id = ?").run(orderId);
  }

  res.json({ received: true });
});

// ==================================================
// HELZERX STUDIO PROJECTS
// ==================================================

apiRouter.get('/studio/projects', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const isAdmin = isAdminPanelRole(user.role);
  const projects = isAdmin
    ? db.prepare('SELECT * FROM studio_projects ORDER BY updated_at DESC').all()
    : db
        .prepare('SELECT * FROM studio_projects WHERE user_id = ? OR client_email = ? ORDER BY updated_at DESC')
        .all(user.id, user.email);

  const projectIds = (projects as { id: string }[]).map((p) => p.id);
  const messages =
    projectIds.length > 0
      ? db
          .prepare(
            `SELECT * FROM studio_messages WHERE project_id IN (${projectIds.map(() => '?').join(',')}) ORDER BY created_at ASC`,
          )
          .all(...projectIds)
      : [];

  res.json({ projects, messages });
});

apiRouter.post('/studio/projects', formRateLimit, (req, res) => {
  const optUser = getOptionalUser(req);
  const clientName = cleanText(req.body?.clientName, 80) || optUser?.name || '';
  const clientEmail = (cleanText(req.body?.clientEmail, 254) || optUser?.email || '').toLowerCase();
  const serviceType = cleanText(req.body?.serviceType, 80);
  const title = cleanText(req.body?.title, 140);
  const budgetRange = cleanText(req.body?.budgetRange, 60) || 'Custom Quote';
  const timeline = cleanText(req.body?.timeline, 60) || 'Flexible';
  const brief = cleanText(req.body?.brief, 2000);
  const attachmentCheck = validateAttachmentFile(req.body?.attachmentName, req.body?.attachmentMime);

  if (!attachmentCheck.ok) {
    res.status(400).json({ error: attachmentCheck.error });
    return;
  }
  const attachmentName = attachmentCheck.fileName;

  if (clientName.length < 2 || !isValidEmail(clientEmail) || !serviceType || title.length < 3 || brief.length < 15) {
    res.status(400).json({
      error: 'Please fill out name, valid email, service type, project title, and brief (min 15 chars).',
    });
    return;
  }

  const projectId = generateId('prj');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO studio_projects (id, user_id, client_name, client_email, service_type, title, budget_range, timeline, brief, attachment_name, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?)
  `).run(projectId, optUser?.id ?? null, clientName, clientEmail, serviceType, title, budgetRange, timeline, brief, attachmentName, now, now);

  db.prepare(`
    INSERT INTO studio_messages (id, project_id, sender_id, sender_name, sender_role, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(generateId('msg'), projectId, optUser?.id ?? 'guest', clientName, optUser?.role ?? 'customer', brief, now);

  if (optUser) {
    createNotification(optUser.id, 'Studio project submitted', `Your request "${title}" is queued for review.`);
  }

  const created = db.prepare('SELECT * FROM studio_projects WHERE id = ?').get(projectId);
  res.status(201).json({ project: created });
});

apiRouter.post('/studio/projects/:id/messages', requireAuth, formRateLimit, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const message = cleanText(req.body?.message, 1200);
  if (message.length < 2) {
    res.status(400).json({ error: 'Message cannot be empty.' });
    return;
  }

  const project = db.prepare('SELECT * FROM studio_projects WHERE id = ?').get(req.params.id) as
    | { id: string; user_id: string | null; client_email: string }
    | undefined;
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const isAdmin = isAdminPanelRole(user.role);
  if (!isAdmin && project.user_id !== user.id && project.client_email !== user.email) {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  const msgId = generateId('msg');
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO studio_messages (id, project_id, sender_id, sender_name, sender_role, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(msgId, project.id, user.id, user.name, user.role, message, now);
  db.prepare('UPDATE studio_projects SET updated_at = ? WHERE id = ?').run(now, project.id);

  const created = db.prepare('SELECT * FROM studio_messages WHERE id = ?').get(msgId);
  res.status(201).json({ message: created });
});

// ==================================================
// PARTNERS, CAREERS, LAUNCH 2027, BLOG, SUPPORT
// ==================================================

apiRouter.get('/partners/me', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const partner = db
    .prepare('SELECT * FROM partners WHERE user_id = ? OR email = ?')
    .get(user.id, user.email) as { id: string } | undefined;
  if (!partner) {
    res.json({ partner: null, referrals: [] });
    return;
  }
  const referrals = db
    .prepare('SELECT * FROM referrals WHERE partner_id = ? ORDER BY created_at DESC')
    .all(partner.id);
  res.json({ partner, referrals });
});

apiRouter.post('/partners/apply', formRateLimit, (req, res) => {
  const optUser = getOptionalUser(req);
  const companyName = cleanText(req.body?.companyName, 100);
  const contactName = cleanText(req.body?.contactName, 80) || optUser?.name || '';
  const email = (cleanText(req.body?.email, 254) || optUser?.email || '').toLowerCase();
  const website = cleanText(req.body?.website, 200);
  const audienceSummary = cleanText(req.body?.audienceSummary, 800);

  if (companyName.length < 2 || contactName.length < 2 || !isValidEmail(email) || audienceSummary.length < 15) {
    res.status(400).json({ error: 'Complete company name, contact name, valid email, and summary.' });
    return;
  }
  if (website && !isSafeHttpUrl(website)) {
    res.status(400).json({ error: 'Website URL must start with http:// or https://.' });
    return;
  }

  const partnerId = generateId('ptr');
  const referralCode = `HX-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO partners (id, user_id, company_name, contact_name, email, website, audience_summary, referral_code, commission_rate, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 15, 'pending', ?)
  `).run(partnerId, optUser?.id ?? null, companyName, contactName, email, website, audienceSummary, referralCode, now);

  const created = db.prepare('SELECT * FROM partners WHERE id = ?').get(partnerId);
  res.status(201).json({ partner: created });
});

const OPEN_POSITIONS = [
  {
    id: 'pos_infra_eng',
    title: 'Senior Linux & Proxmox Infrastructure Engineer',
    department: 'HelzerX Cloud',
    location: 'Remote (Global)',
    type: 'Full-Time',
    summary: 'Architect high-availability Proxmox LXC nodes, ZFS NVMe pools, and automated Pterodactyl daemon pipelines.',
  },
  {
    id: 'pos_fullstack',
    title: 'Principal TypeScript Full-Stack Engineer',
    department: 'HelzerX Studio',
    location: 'Remote (Global)',
    type: 'Full-Time',
    summary: 'Build end-to-end enterprise dashboards, secure API gateways, and real-time analytics interfaces.',
  },
  {
    id: 'pos_design',
    title: 'Staff Product & Design Systems Designer',
    department: 'HelzerX Studio',
    location: 'Remote (Global)',
    type: 'Full-Time',
    summary: 'Own dark-first design tokens, WCAG AA interface architecture, and commercial client delivery.',
  },
  {
    id: 'pos_support',
    title: 'Cloud & Hardware Technical Support Specialist',
    department: 'Customer Operations',
    location: 'Remote (Global)',
    type: 'Full-Time',
    summary: 'Resolve customer server tickets, assist with Pterodactyl workflows, and coordinate hardware warranty replacements.',
  },
];

apiRouter.get('/careers/positions', (_req, res) => {
  res.json({ positions: OPEN_POSITIONS });
});

apiRouter.get('/careers/my-applications', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const apps = db
    .prepare('SELECT * FROM career_applications WHERE user_id = ? OR email = ? ORDER BY created_at DESC')
    .all(user.id, user.email);
  res.json({ applications: apps });
});

apiRouter.post('/careers/apply', formRateLimit, (req, res) => {
  const optUser = getOptionalUser(req);
  const positionId = cleanText(req.body?.positionId, 64);
  const pos = OPEN_POSITIONS.find((p) => p.id === positionId);
  const applicantName = cleanText(req.body?.applicantName, 80) || optUser?.name || '';
  const email = (cleanText(req.body?.email, 254) || optUser?.email || '').toLowerCase();
  const portfolioUrl = cleanText(req.body?.portfolioUrl, 250);
  const coverNote = cleanText(req.body?.coverNote, 1500);
  const attachmentCheck = validateAttachmentFile(req.body?.attachmentName, req.body?.attachmentMime);

  if (!attachmentCheck.ok) {
    res.status(400).json({ error: attachmentCheck.error });
    return;
  }
  const attachmentName = attachmentCheck.fileName;

  if (!pos || applicantName.length < 2 || !isValidEmail(email) || coverNote.length < 15) {
    res.status(400).json({ error: 'Please select a role and provide valid name, email, and cover note.' });
    return;
  }
  if (portfolioUrl && !isSafeHttpUrl(portfolioUrl)) {
    res.status(400).json({ error: 'Portfolio URL must start with http:// or https://.' });
    return;
  }

  const appId = generateId('app');
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO career_applications (id, user_id, position_id, position_title, applicant_name, email, portfolio_url, cover_note, attachment_name, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?)
  `).run(appId, optUser?.id ?? null, pos.id, pos.title, applicantName, email, portfolioUrl, coverNote, attachmentName, now);

  const created = db.prepare('SELECT * FROM career_applications WHERE id = ?').get(appId);
  res.status(201).json({ application: created });
});

// ==================================================
// JANUARY 1, 2027 LAUNCH CAMPAIGN & FIRST 50 ELIGIBILITY
// ==================================================

apiRouter.get('/launch/status', (req, res) => {
  const optUser = getOptionalUser(req);
  const campaign = db
    .prepare('SELECT * FROM launch_campaign WHERE id = ?')
    .get('launch_2027') as {
    launch_date: string;
    base_preorders: number;
    early_access_limit: number;
    announcement_text: string;
  };
  const orderCount = db
    .prepare("SELECT COUNT(*) as c FROM orders WHERE status != 'cancelled'")
    .get() as { c: number };
  const qualifiedCount = db
    .prepare(
      "SELECT COUNT(*) as c FROM early_access_registrations WHERE eligibility_status = 'qualified'",
    )
    .get() as { c: number };
  const totalRegistrations = db
    .prepare('SELECT COUNT(*) as c FROM early_access_registrations')
    .get() as { c: number };

  const myRegistration = optUser
    ? db
        .prepare('SELECT * FROM early_access_registrations WHERE user_id = ? OR email = ?')
        .get(optUser.id, optUser.email)
    : null;

  res.json({
    launchDate: campaign.launch_date,
    basePreorders: campaign.base_preorders,
    totalPreorders: campaign.base_preorders + orderCount.c,
    earlyAccessLimit: campaign.early_access_limit,
    qualifiedCount: qualifiedCount.c,
    totalRegistrations: totalRegistrations.c,
    spotsRemaining: Math.max(0, campaign.early_access_limit - qualifiedCount.c),
    announcementText: campaign.announcement_text,
    myRegistration,
  });
});

apiRouter.post('/launch/register', formRateLimit, (req, res) => {
  const optUser = getOptionalUser(req);
  const fullName = cleanText(req.body?.fullName, 80) || optUser?.name || '';
  const email = (cleanText(req.body?.email, 254) || optUser?.email || '').toLowerCase();
  const useCase = cleanText(req.body?.useCase, 400);
  const acceptedTerms = req.body?.acceptedTerms === true;

  if (fullName.length < 2 || !isValidEmail(email) || useCase.length < 5) {
    res.status(400).json({ error: 'Full name, valid email, and intended server use case are required.' });
    return;
  }
  if (!acceptedTerms) {
    res.status(400).json({ error: 'You must accept the Terms of Service to register for Early Access.' });
    return;
  }

  const existing = db
    .prepare('SELECT * FROM early_access_registrations WHERE email = ?')
    .get(email);
  if (existing) {
    res.status(409).json({
      error: 'This email is already registered for Early Access.',
      registration: existing,
    });
    return;
  }

  const userRecord = optUser ?? (db.prepare('SELECT id, email_verified FROM users WHERE email = ?').get(email) as { id: string; email_verified: number } | undefined);
  const isVerified = userRecord ? Number(userRecord.email_verified) === 1 : false;

  const campaign = db
    .prepare('SELECT launch_date, early_access_limit FROM launch_campaign WHERE id = ?')
    .get('launch_2027') as { launch_date: string; early_access_limit: number };

  const qualifiedRow = db
    .prepare("SELECT COUNT(*) as c FROM early_access_registrations WHERE eligibility_status = 'qualified'")
    .get() as { c: number };

  const beforeLaunch = new Date() < new Date(campaign.launch_date);
  let eligibilityStatus = 'pending_verification';
  let slotNumber: number | null = null;

  if (!beforeLaunch) {
    eligibilityStatus = 'ineligible';
  } else if (!isVerified) {
    eligibilityStatus = 'pending_verification';
  } else if (qualifiedRow.c < campaign.early_access_limit) {
    eligibilityStatus = 'qualified';
    slotNumber = qualifiedRow.c + 1;
  } else {
    eligibilityStatus = 'waitlisted';
  }

  const regId = generateId('ea');
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO early_access_registrations (id, user_id, full_name, email, use_case, email_verified, accepted_terms, eligibility_status, slot_number, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `).run(regId, userRecord?.id ?? null, fullName, email, useCase, isVerified ? 1 : 0, eligibilityStatus, slotNumber, now);

  const created = db.prepare('SELECT * FROM early_access_registrations WHERE id = ?').get(regId);
  res.status(201).json({
    registration: created,
    message:
      eligibilityStatus === 'qualified'
        ? `Eligibility verified! Qualified at Early Access slot #${slotNumber} of ${campaign.early_access_limit} for an 8GB RAM launch server.`
        : eligibilityStatus === 'pending_verification'
          ? 'Registration recorded as pending_verification. Sign in and verify your account email to confirm eligibility for the first-50 8GB RAM server allocation.'
          : eligibilityStatus === 'waitlisted'
            ? 'All 50 qualified slots are currently filled; your registration has been placed on the priority waitlist.'
            : 'Pre-launch eligibility window has closed.',
  });
});

// ==================================================
// BLOG, SUPPORT, NEWSLETTER, CONTACT, DASHBOARD
// ==================================================

apiRouter.get('/blog/posts', (_req, res) => {
  const posts = db
    .prepare("SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC")
    .all();
  res.json({ posts });
});

apiRouter.get('/blog/posts/:slug', (req, res) => {
  const post = db
    .prepare("SELECT * FROM blog_posts WHERE slug = ? AND status = 'published'")
    .get(req.params.slug);
  if (!post) {
    res.status(404).json({ error: 'Article not found.' });
    return;
  }
  res.json({ post });
});

apiRouter.get('/support/tickets', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const isAdmin = isAdminPanelRole(user.role);
  const tickets = isAdmin
    ? db.prepare('SELECT * FROM support_tickets ORDER BY updated_at DESC').all()
    : db
        .prepare('SELECT * FROM support_tickets WHERE user_id = ? OR email = ? ORDER BY updated_at DESC')
        .all(user.id, user.email);

  const ids = (tickets as { id: string }[]).map((t) => t.id);
  const replies =
    ids.length > 0
      ? db
          .prepare(
            `SELECT * FROM ticket_replies WHERE ticket_id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at ASC`,
          )
          .all(...ids)
      : [];
  res.json({ tickets, replies });
});

apiRouter.post('/support/tickets', formRateLimit, (req, res) => {
  const optUser = getOptionalUser(req);
  const name = cleanText(req.body?.name, 80) || optUser?.name || '';
  const email = (cleanText(req.body?.email, 254) || optUser?.email || '').toLowerCase();
  const category = cleanText(req.body?.category, 60) || 'General';
  const priority = ['low', 'normal', 'high', 'urgent'].includes(req.body?.priority)
    ? req.body.priority
    : 'normal';
  const subject = cleanText(req.body?.subject, 140);
  const body = cleanText(req.body?.message, 2000);
  const attachmentCheck = validateAttachmentFile(req.body?.attachmentName, req.body?.attachmentMime);

  if (!attachmentCheck.ok) {
    res.status(400).json({ error: attachmentCheck.error });
    return;
  }
  const attachmentName = attachmentCheck.fileName;

  if (name.length < 2 || !isValidEmail(email) || subject.length < 4 || body.length < 10) {
    res.status(400).json({ error: 'Name, valid email, subject, and message (min 10 chars) required.' });
    return;
  }

  const ticketId = generateId('tkt');
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO support_tickets (id, user_id, name, email, category, priority, subject, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
  `).run(ticketId, optUser?.id ?? null, name, email, category, priority, subject, now, now);

  db.prepare(`
    INSERT INTO ticket_replies (id, ticket_id, sender_id, sender_name, sender_role, body, attachment_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(generateId('rep'), ticketId, optUser?.id ?? 'guest', name, optUser?.role ?? 'customer', body, attachmentName, now);

  const created = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId);
  res.status(201).json({ ticket: created });
});

apiRouter.post('/support/tickets/:id/replies', requireAuth, formRateLimit, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const body = cleanText(req.body?.message, 1500);
  const attachmentCheck = validateAttachmentFile(req.body?.attachmentName, req.body?.attachmentMime);
  if (!attachmentCheck.ok) {
    res.status(400).json({ error: attachmentCheck.error });
    return;
  }
  const attachmentName = attachmentCheck.fileName;
  if (body.length < 2) {
    res.status(400).json({ error: 'Reply message cannot be empty.' });
    return;
  }

  const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(req.params.id) as
    | { id: string; user_id: string | null; email: string }
    | undefined;
  if (!ticket) {
    res.status(404).json({ error: 'Support ticket not found.' });
    return;
  }
  const isAdmin = isAdminPanelRole(user.role);
  if (!isAdmin && ticket.user_id !== user.id && ticket.email !== user.email) {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  const replyId = generateId('rep');
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO ticket_replies (id, ticket_id, sender_id, sender_name, sender_role, body, attachment_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(replyId, ticket.id, user.id, user.name, user.role, body, attachmentName, now);

  db.prepare('UPDATE support_tickets SET updated_at = ?, status = ? WHERE id = ?').run(
    now,
    isAdmin ? 'answered' : 'open',
    ticket.id,
  );

  const created = db.prepare('SELECT * FROM ticket_replies WHERE id = ?').get(replyId);
  res.status(201).json({ reply: created });
});

apiRouter.post('/newsletter/subscribe', formRateLimit, (req, res) => {
  const email = cleanText(req.body?.email, 254).toLowerCase();
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  const existing = db.prepare('SELECT id FROM newsletter_subscribers WHERE email = ?').get(email);
  if (existing) {
    res.json({ ok: true, message: 'You are already subscribed to HelzerX updates.' });
    return;
  }
  db.prepare('INSERT INTO newsletter_subscribers (id, email, created_at) VALUES (?, ?, ?)').run(
    generateId('sub'),
    email,
    new Date().toISOString(),
  );
  res.status(201).json({ ok: true, message: 'Subscribed to HelzerX announcements and release notes.' });
});

apiRouter.post('/contact', formRateLimit, (req, res) => {
  const name = cleanText(req.body?.name, 80);
  const email = cleanText(req.body?.email, 254).toLowerCase();
  const company = cleanText(req.body?.company, 100);
  const scope = cleanText(req.body?.scope, 60) || 'ecosystem';
  const brief = cleanText(req.body?.brief, 2000);

  if (name.length < 2 || !isValidEmail(email) || brief.length < 10) {
    res.status(400).json({ error: 'Name, valid work email, and inquiry brief (min 10 chars) are required.' });
    return;
  }

  const id = generateId('inq');
  db.prepare(`
    INSERT INTO contact_inquiries (id, name, email, company, scope, brief, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'new', ?)
  `).run(id, name, email, company, scope, brief, new Date().toISOString());

  res.status(201).json({ ok: true, inquiryId: id });
});

apiRouter.get('/dashboard/overview', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const servers = db
    .prepare(`
      SELECT cs.*, hp.name as plan_name, hp.cpu, hp.ram_gb, hp.storage_gb, hp.price_monthly_usd
      FROM cloud_servers cs
      LEFT JOIN hosting_plans hp ON cs.plan_id = hp.id
      WHERE cs.user_id = ?
      ORDER BY cs.created_at DESC
    `)
    .all(user.id);
  const orders = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
    .all(user.id);
  const orderIds = (orders as { id: string }[]).map((o) => o.id);
  const orderItems =
    orderIds.length > 0
      ? db
          .prepare(
            `SELECT * FROM order_items WHERE order_id IN (${orderIds.map(() => '?').join(',')})`,
          )
          .all(...orderIds)
      : [];
  const invoices = db
    .prepare('SELECT * FROM invoices WHERE user_id = ? ORDER BY issued_at DESC')
    .all(user.id);
  const projects = db
    .prepare('SELECT * FROM studio_projects WHERE user_id = ? OR client_email = ? ORDER BY updated_at DESC')
    .all(user.id, user.email);
  const tickets = db
    .prepare('SELECT * FROM support_tickets WHERE user_id = ? OR email = ? ORDER BY updated_at DESC')
    .all(user.id, user.email);
  const notifications = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20')
    .all(user.id);
  const earlyAccess = db
    .prepare('SELECT * FROM early_access_registrations WHERE user_id = ? OR email = ?')
    .get(user.id, user.email);

  res.json({
    servers,
    orders,
    orderItems,
    invoices,
    projects,
    tickets,
    notifications,
    earlyAccess,
  });
});

apiRouter.post('/dashboard/notifications/read-all', requireAuth, (req: AuthedRequest, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.authUser!.id);
  res.json({ ok: true });
});

// ==================================================
// ADMIN MANAGEMENT API (RBAC PROTECTED)
// ==================================================

const adminGuard = [requireAdminIpAllowlist, requireAuth, requireRole(ADMIN_ROLES)] as const;

apiRouter.get('/admin/overview', ...adminGuard, requirePermission('overview:read'), (_req, res) => {
  const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  const activeUsers = (
    db.prepare("SELECT COUNT(*) as c FROM users WHERE status = 'active'").get() as { c: number }
  ).c;
  const totalOrders = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number }).c;
  const totalRevenueRow = db
    .prepare("SELECT COALESCE(SUM(total_usd), 0) as total FROM orders WHERE status IN ('paid', 'processing', 'fulfilled')")
    .get() as { total: number };
  const activeServers = (
    db.prepare("SELECT COUNT(*) as c FROM cloud_servers WHERE status = 'active'").get() as { c: number }
  ).c;
  const pendingProjects = (
    db.prepare("SELECT COUNT(*) as c FROM studio_projects WHERE status IN ('submitted', 'in_review', 'active')").get() as {
      c: number;
    }
  ).c;
  const openTickets = (
    db.prepare("SELECT COUNT(*) as c FROM support_tickets WHERE status IN ('open', 'answered')").get() as {
      c: number;
    }
  ).c;

  const users = db
    .prepare(
      'SELECT id, name, email, role, status, email_verified, totp_enabled, last_login_at, last_login_ip, created_at FROM users ORDER BY created_at DESC',
    )
    .all();
  const plans = db.prepare('SELECT * FROM hosting_plans ORDER BY sort_order ASC').all();
  const servers = db.prepare('SELECT * FROM cloud_servers ORDER BY created_at DESC').all();
  const projects = db.prepare('SELECT * FROM studio_projects ORDER BY updated_at DESC').all();
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY code ASC').all();
  const invoices = db.prepare('SELECT * FROM invoices ORDER BY issued_at DESC').all();
  const tickets = db.prepare('SELECT * FROM support_tickets ORDER BY updated_at DESC').all();
  const partners = db.prepare('SELECT * FROM partners ORDER BY created_at DESC').all();
  const careers = db.prepare('SELECT * FROM career_applications ORDER BY created_at DESC').all();
  const earlyAccess = db
    .prepare('SELECT * FROM early_access_registrations ORDER BY created_at ASC')
    .all();
  const blogPosts = db.prepare('SELECT * FROM blog_posts ORDER BY created_at DESC').all();
  const announcements = db.prepare('SELECT * FROM announcements ORDER BY created_at DESC').all();
  const faqs = db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC').all();
  const inquiries = db.prepare('SELECT * FROM contact_inquiries ORDER BY created_at DESC').all();
  const nowIso = new Date().toISOString();
  const auditLogs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 60').all();
  const securityEvents = db
    .prepare('SELECT * FROM security_events ORDER BY created_at DESC LIMIT 60')
    .all();
  const activeSessionsCount = (
    db
      .prepare('SELECT COUNT(*) as c FROM user_sessions WHERE revoked_at IS NULL AND expires_at > ?')
      .get(nowIso) as { c: number }
  ).c;
  const lockedAccountsCount = (
    db
      .prepare('SELECT COUNT(*) as c FROM auth_lockouts WHERE locked_until IS NOT NULL AND locked_until > ?')
      .get(nowIso) as { c: number }
  ).c;

  res.json({
    metrics: {
      totalUsers,
      activeUsers,
      totalOrders,
      totalRevenue: totalRevenueRow.total,
      activeServers,
      pendingProjects,
      openTickets,
      activeSessionsCount,
      lockedAccountsCount,
    },
    users,
    plans,
    servers,
    projects,
    products,
    orders,
    coupons,
    invoices,
    tickets,
    partners,
    careers,
    earlyAccess,
    blogPosts,
    announcements,
    faqs,
    inquiries,
    auditLogs,
    securityEvents,
    pterodactyl: getPterodactylStatus(),
  });
});

// ==================================================
// HELZERX SECURITY CENTER (ADMIN RBAC PROTECTED)
// ==================================================

apiRouter.get('/admin/security/overview', ...adminGuard, requirePermission('security:read'), (req, res) => {
  const nowIso = new Date().toISOString();
  const controls = getSecurityControls();
  const counters = getRuntimeSecurityCounters();

  const totalSecurityEvents = (
    db.prepare('SELECT COUNT(*) as c FROM security_events').get() as { c: number }
  ).c;
  const highSeverityEvents = (
    db.prepare("SELECT COUNT(*) as c FROM security_events WHERE severity = 'high'").get() as {
      c: number;
    }
  ).c;
  const activeSessions = db
    .prepare(
      `SELECT us.id, us.user_id, us.ip_address, us.user_agent, us.created_at, us.last_seen_at, us.expires_at,
              u.email as user_email, u.role as user_role
       FROM user_sessions us
       JOIN users u ON us.user_id = u.id
       WHERE us.revoked_at IS NULL AND us.expires_at > ?
       ORDER BY us.last_seen_at DESC
       LIMIT 50`,
    )
    .all(nowIso);
  const lockedAccounts = db
    .prepare(
      'SELECT email, failed_attempts, locked_until, last_failed_at FROM auth_lockouts WHERE locked_until IS NOT NULL AND locked_until > ?',
    )
    .all(nowIso);
  const mfaStats = db
    .prepare(
      'SELECT COUNT(*) as total, SUM(CASE WHEN totp_enabled = 1 THEN 1 ELSE 0 END) as enabled FROM users',
    )
    .get() as { total: number; enabled: number | null };

  const securityEvents = db
    .prepare('SELECT * FROM security_events ORDER BY created_at DESC LIMIT 80')
    .all();
  const auditLogs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50').all();

  let journalMode = 'wal';
  try {
    const jm = db.prepare('PRAGMA journal_mode;').get() as { journal_mode?: string };
    journalMode = jm?.journal_mode || 'wal';
  } catch {
    // ignore
  }

  const backupDir = path.resolve(process.cwd(), 'data', 'backups');
  let backups: { name: string; sizeBytes: number; createdAt: string }[] = [];
  if (fs.existsSync(backupDir)) {
    backups = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith('.hxbk'))
      .map((f) => {
        const stat = fs.statSync(path.join(backupDir, f));
        return { name: f, sizeBytes: stat.size, createdAt: stat.mtime.toISOString() };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10);
  }

  const cfRayDetected = Boolean(req.headers['cf-ray'] || req.headers['cf-connecting-ip']);
  const turnstileReady = Boolean(
    process.env.VITE_TURNSTILE_SITE_KEY?.trim() && process.env.TURNSTILE_SECRET_KEY?.trim(),
  );

  res.json({
    overview: {
      status:
        controls.maintenanceLockdown || controls.emergencySecurityMode
          ? 'EMERGENCY'
          : highSeverityEvents > 0
            ? 'ELEVATED'
            : 'HARDENED',
      highSeverityEvents,
      totalSecurityEvents,
      activeSessionsCount: activeSessions.length,
      lockedAccountsCount: lockedAccounts.length,
      mfaEnabledUsers: Number(mfaStats?.enabled ?? 0),
      totalUsers: Number(mfaStats?.total ?? 0),
    },
    websiteProtection: {
      cspActive: true,
      hstsReady: true,
      nosniffActive: true,
      antiAbuseActive: true,
      turnstileConfigured: turnstileReady,
      cloudflareProxyDetected: cfRayDetected,
      devtoolsDeterrence: controls.devtoolsDeterrence,
    },
    apiSecurity: counters,
    infrastructure: {
      nodeVersion: process.version,
      nodeEnv: process.env.NODE_ENV || 'development',
      dbJournalMode: journalMode,
      foreignKeysEnforced: true,
      pterodactylIsolated: getPterodactylStatus().configured,
      backups,
    },
    controls,
    activeSessions,
    lockedAccounts,
    securityEvents,
    auditLogs,
  });
});

apiRouter.patch(
  '/admin/security/controls',
  ...adminGuard,
  requirePermission('security:emergency'),
  (req: AuthedRequest, res) => {
    const actor = req.authUser!;
    if (req.body?.confirmAction !== true) {
      res.status(400).json({ error: 'Explicit confirmation (confirmAction) is required for emergency controls.' });
      return;
    }

    const current = getSecurityControls();
    const next: SecurityControlsState = {
      maintenanceLockdown:
        typeof req.body?.maintenanceLockdown === 'boolean'
          ? req.body.maintenanceLockdown
          : current.maintenanceLockdown,
      loginRestriction:
        typeof req.body?.loginRestriction === 'boolean'
          ? req.body.loginRestriction
          : current.loginRestriction,
      apiEmergencyReadOnly:
        typeof req.body?.apiEmergencyReadOnly === 'boolean'
          ? req.body.apiEmergencyReadOnly
          : current.apiEmergencyReadOnly,
      emergencySecurityMode:
        typeof req.body?.emergencySecurityMode === 'boolean'
          ? req.body.emergencySecurityMode
          : current.emergencySecurityMode,
      requireAdminMfa:
        typeof req.body?.requireAdminMfa === 'boolean'
          ? req.body.requireAdminMfa
          : current.requireAdminMfa,
      devtoolsDeterrence:
        typeof req.body?.devtoolsDeterrence === 'boolean'
          ? req.body.devtoolsDeterrence
          : current.devtoolsDeterrence,
    };

    db.prepare(`
      INSERT INTO site_settings (key, value_json, updated_at) VALUES ('security_controls', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
    `).run(JSON.stringify(next), new Date().toISOString());
    setEmergencySecurityModeState(next.emergencySecurityMode);

    const summary = `lockdown=${next.maintenanceLockdown}, loginRestriction=${next.loginRestriction}, readOnly=${next.apiEmergencyReadOnly}, emergencyMode=${next.emergencySecurityMode}`;
    recordSecurityEvent({
      eventType: 'EMERGENCY_CONTROLS_UPDATED',
      severity: 'high',
      ipAddress: getClientIp(req),
      actorEmail: actor.email,
      path: '/api/admin/security/controls',
      details: summary,
    });
    logAudit(actor.id, actor.email, 'UPDATE_SECURITY_CONTROLS', 'site_settings', 'security_controls', summary);
    res.json({ ok: true, controls: next });
  },
);

apiRouter.post(
  '/admin/security/unlock-account',
  ...adminGuard,
  requirePermission('security:emergency'),
  (req: AuthedRequest, res) => {
    const actor = req.authUser!;
    const email = cleanText(req.body?.email, 254).toLowerCase();
    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }
    db.prepare('DELETE FROM auth_lockouts WHERE email = ?').run(email);
    recordSecurityEvent({
      eventType: 'ACCOUNT_UNLOCKED_ADMIN',
      severity: 'info',
      ipAddress: getClientIp(req),
      actorEmail: email,
      path: '/api/admin/security/unlock-account',
      details: `Lockout cleared by ${actor.email}.`,
    });
    logAudit(actor.id, actor.email, 'UNLOCK_ACCOUNT', 'auth_lockouts', email);
    res.json({ ok: true, message: `Cleared brute-force lockout for ${email}.` });
  },
);

apiRouter.post(
  '/admin/security/revoke-all-sessions',
  ...adminGuard,
  requirePermission('security:emergency'),
  (req: AuthedRequest, res) => {
    const actor = req.authUser!;
    if (req.body?.confirmAction !== true) {
      res.status(400).json({ error: 'Explicit confirmation required to revoke sessions.' });
      return;
    }
    const nowIso = new Date().toISOString();
    const resDb = req.authSessionId
      ? db
          .prepare('UPDATE user_sessions SET revoked_at = ? WHERE revoked_at IS NULL AND id != ?')
          .run(nowIso, req.authSessionId)
      : db.prepare('UPDATE user_sessions SET revoked_at = ? WHERE revoked_at IS NULL').run(nowIso);

    recordSecurityEvent({
      eventType: 'GLOBAL_SESSIONS_REVOKED',
      severity: 'high',
      ipAddress: getClientIp(req),
      actorEmail: actor.email,
      path: '/api/admin/security/revoke-all-sessions',
      details: `Revoked ${resDb.changes} active session(s) across the platform.`,
    });
    logAudit(actor.id, actor.email, 'GLOBAL_SESSION_REVOCATION', 'user_sessions', 'all', `count=${resDb.changes}`);
    res.json({ ok: true, revokedCount: resDb.changes });
  },
);

apiRouter.post(
  '/admin/security/backup',
  ...adminGuard,
  requirePermission('security:emergency'),
  (req: AuthedRequest, res) => {
    const actor = req.authUser!;
    const dbPath = path.resolve(process.cwd(), 'data', 'helzerx.db');
    const backupDir = path.resolve(process.cwd(), 'data', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const integrityRow = db.prepare('PRAGMA integrity_check;').get() as {
      integrity_check?: string;
    };
    const integrityOk = integrityRow?.integrity_check === 'ok';

    // Flush WAL into main DB before snapshotting
    try {
      db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    } catch {
      // ignore if busy
    }

    const plainBuf = fs.readFileSync(dbPath);
    const originalHash = crypto.createHash('sha256').update(plainBuf).digest('hex');
    const encryptedBuf = encryptBackupBuffer(plainBuf);
    const decryptedTest = decryptAndVerifyBackupBuffer(encryptedBuf);
    const verifiedHash = crypto.createHash('sha256').update(decryptedTest).digest('hex');
    const verifiedDecryption = originalHash === verifiedHash;

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `helzerx-backup-${stamp}.hxbk`;
    fs.writeFileSync(path.join(backupDir, fileName), encryptedBuf);

    recordSecurityEvent({
      eventType: 'ENCRYPTED_BACKUP_VERIFIED',
      severity: 'info',
      ipAddress: getClientIp(req),
      actorEmail: actor.email,
      path: '/api/admin/security/backup',
      details: `Backup ${fileName} created (integrity=${integrityOk}, verified=${verifiedDecryption}).`,
    });
    logAudit(actor.id, actor.email, 'CREATE_ENCRYPTED_BACKUP', 'database', fileName, `sha256=${originalHash.slice(0, 16)}`);

    res.json({
      ok: true,
      fileName,
      sizeBytes: encryptedBuf.length,
      sha256: originalHash,
      integrityOk,
      verifiedDecryption,
    });
  },
);

apiRouter.patch('/admin/users/:id', ...adminGuard, requirePermission('users:write'), (req: AuthedRequest, res) => {
  const actor = req.authUser!;
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as
    | { id: string; email: string; role: UserRole; status: string }
    | undefined;
  if (!target) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const nextRole = req.body?.role;
  const nextStatus = req.body?.status;

  if (nextRole && !ALL_USER_ROLES.includes(nextRole)) {
    res.status(400).json({ error: 'Invalid role.' });
    return;
  }
  if (nextRole && nextRole !== target.role && !hasPermission(actor.role, 'roles:write')) {
    res.status(403).json({ error: 'Only a Super Admin can modify account roles.' });
    return;
  }
  if (nextStatus && !['active', 'suspended'].includes(nextStatus)) {
    res.status(400).json({ error: 'Invalid account status.' });
    return;
  }

  const resolvedRole = (nextRole ?? target.role) as UserRole;
  const resolvedStatus = nextStatus ?? target.status;

  if (target.role === 'super_admin' && (resolvedRole !== 'super_admin' || resolvedStatus !== 'active')) {
    const activeSuperAdmins = (
      db
        .prepare("SELECT COUNT(*) as c FROM users WHERE role = 'super_admin' AND status = 'active'")
        .get() as { c: number }
    ).c;
    if (activeSuperAdmins <= 1) {
      res.status(409).json({
        error: 'Cannot suspend or demote the last active Super Admin account.',
      });
      return;
    }
  }

  const nowIso = new Date().toISOString();
  db.prepare('UPDATE users SET role = ?, status = ?, updated_at = ? WHERE id = ?').run(
    resolvedRole,
    resolvedStatus,
    nowIso,
    target.id,
  );

  // Immediately revoke active sessions when role changes or user is suspended
  if (resolvedStatus === 'suspended' || resolvedRole !== target.role) {
    db.prepare('UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(
      nowIso,
      target.id,
    );
    recordSecurityEvent({
      eventType: 'ADMIN_USER_SECURITY_UPDATE',
      severity: 'warning',
      ipAddress: getClientIp(req),
      actorEmail: target.email,
      path: `/api/admin/users/${target.id}`,
      details: `Updated by ${actor.email} (role=${resolvedRole}, status=${resolvedStatus}); sessions revoked.`,
    });
  }

  logAudit(actor.id, actor.email, 'UPDATE_USER', 'users', target.id, `role=${resolvedRole}, status=${resolvedStatus}`);
  res.json({ ok: true });
});

apiRouter.post('/admin/users/:id/revoke-sessions', ...adminGuard, requirePermission('users:write'), (req: AuthedRequest, res) => {
  const actor = req.authUser!;
  const target = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.params.id) as
    | { id: string; email: string }
    | undefined;
  if (!target) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  db.prepare('UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(
    new Date().toISOString(),
    target.id,
  );
  recordSecurityEvent({
    eventType: 'ADMIN_SESSIONS_REVOKED',
    severity: 'warning',
    ipAddress: getClientIp(req),
    actorEmail: target.email,
    path: `/api/admin/users/${target.id}/revoke-sessions`,
    details: `Admin ${actor.email} revoked all active sessions.`,
  });
  logAudit(actor.id, actor.email, 'REVOKE_USER_SESSIONS', 'users', target.id, target.email);
  res.json({ ok: true, message: `All active sessions revoked for ${target.email}.` });
});

apiRouter.post('/admin/cloud/plans', ...adminGuard, requirePermission('cloud:write'), (req: AuthedRequest, res) => {
  const name = cleanText(req.body?.name, 80);
  const category = cleanText(req.body?.category, 40) || 'Minecraft';
  const cpu = cleanText(req.body?.cpu, 60);
  const ramGb = Number(req.body?.ram_gb);
  const storageGb = Number(req.body?.storage_gb);
  const network = cleanText(req.body?.network, 60) || '10 Gbps';
  const priceUsd = Number(req.body?.price_monthly_usd);
  const hzlCost = Number(req.body?.hzl_cost);
  const location = cleanText(req.body?.location, 80) || 'Singapore · sn1.helzerx.cyou';

  if (name.length < 3 || !cpu || !Number.isFinite(ramGb) || !Number.isFinite(priceUsd)) {
    res.status(400).json({ error: 'Provide valid plan name, CPU, RAM, and price.' });
    return;
  }

  const id = generateId('pln');
  db.prepare(`
    INSERT INTO hosting_plans (id, name, category, cpu, ram_gb, storage_gb, network, price_monthly_usd, hzl_cost, location, features_json, available, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 99)
  `).run(id, name, category, cpu, ramGb, storageGb || 40, network, priceUsd, hzlCost || 400, location, JSON.stringify(['Managed Control Panel', 'Automated Backups']));

  logAudit(req.authUser!.id, req.authUser!.email, 'CREATE_PLAN', 'hosting_plans', id, name);
  res.status(201).json({ id });
});

apiRouter.delete('/admin/cloud/plans/:id', ...adminGuard, requirePermission('cloud:write'), (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM hosting_plans WHERE id = ?').run(req.params.id);
  logAudit(req.authUser!.id, req.authUser!.email, 'DELETE_PLAN', 'hosting_plans', req.params.id);
  res.json({ ok: true });
});

apiRouter.patch('/admin/cloud/servers/:id', ...adminGuard, requirePermission('cloud:write'), (req: AuthedRequest, res) => {
  const status = cleanText(req.body?.status, 40);
  const pterodactylIdentifier = cleanText(req.body?.pterodactyl_identifier, 40);
  const nodeName = cleanText(req.body?.node_name, 60);
  if (!['pending_provisioning', 'active', 'suspended', 'terminated'].includes(status)) {
    res.status(400).json({ error: 'Invalid server status.' });
    return;
  }
  db.prepare(`
    UPDATE cloud_servers SET status = ?, pterodactyl_identifier = COALESCE(NULLIF(?, ''), pterodactyl_identifier), node_name = COALESCE(NULLIF(?, ''), node_name) WHERE id = ?
  `).run(status, pterodactylIdentifier, nodeName, req.params.id);
  logAudit(req.authUser!.id, req.authUser!.email, 'UPDATE_SERVER', 'cloud_servers', req.params.id, status);
  res.json({ ok: true });
});

apiRouter.patch('/admin/studio/projects/:id', ...adminGuard, requirePermission('support:write'), (req: AuthedRequest, res) => {
  const status = cleanText(req.body?.status, 40);
  const adminNotes = cleanText(req.body?.admin_notes, 800);
  if (!['submitted', 'in_review', 'active', 'completed', 'archived'].includes(status)) {
    res.status(400).json({ error: 'Invalid project status.' });
    return;
  }
  db.prepare('UPDATE studio_projects SET status = ?, admin_notes = ?, updated_at = ? WHERE id = ?').run(
    status,
    adminNotes,
    new Date().toISOString(),
    req.params.id,
  );
  logAudit(req.authUser!.id, req.authUser!.email, 'UPDATE_STUDIO_PROJECT', 'studio_projects', req.params.id, status);
  res.json({ ok: true });
});

apiRouter.post('/admin/shop/products', ...adminGuard, requirePermission('shop:write'), (req: AuthedRequest, res) => {
  const name = cleanText(req.body?.name, 100);
  const category = cleanText(req.body?.category, 40) || 'Hardware';
  const priceUsd = Number(req.body?.price_usd);
  const stock = Number(req.body?.stock);
  const summary = cleanText(req.body?.summary, 500);
  const badge = cleanText(req.body?.badge, 30) || 'New';

  if (name.length < 3 || !Number.isFinite(priceUsd) || priceUsd < 0 || !Number.isFinite(stock) || summary.length < 5) {
    res.status(400).json({ error: 'Valid name, price, stock, and summary required.' });
    return;
  }

  const id = generateId('prod');
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${crypto.randomBytes(2).toString('hex')}`;
  db.prepare(`
    INSERT INTO products (id, slug, name, category, price_usd, stock, image_url, badge, summary, specs_json, featured, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, '/assets/aistudio/IMG_20261121_083503_16556201.JPG', ?, ?, ?, 0, 1, ?)
  `).run(id, slug, name, category, priceUsd, stock, badge, summary, JSON.stringify(['HelzerX Certified', 'Direct Dispatch']), new Date().toISOString());

  logAudit(req.authUser!.id, req.authUser!.email, 'CREATE_PRODUCT', 'products', id, name);
  res.status(201).json({ id });
});

apiRouter.patch('/admin/shop/products/:id', ...adminGuard, requirePermission('shop:write'), (req: AuthedRequest, res) => {
  const stock = Number(req.body?.stock);
  const priceUsd = Number(req.body?.price_usd);
  const active = req.body?.active === 0 ? 0 : 1;
  db.prepare('UPDATE products SET stock = ?, price_usd = ?, active = ? WHERE id = ?').run(
    Number.isFinite(stock) ? stock : 0,
    Number.isFinite(priceUsd) ? priceUsd : 0,
    active,
    req.params.id,
  );
  logAudit(req.authUser!.id, req.authUser!.email, 'UPDATE_PRODUCT', 'products', req.params.id);
  res.json({ ok: true });
});

apiRouter.delete('/admin/shop/products/:id', ...adminGuard, requirePermission('shop:write'), (req: AuthedRequest, res) => {
  db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(req.params.id);
  logAudit(req.authUser!.id, req.authUser!.email, 'ARCHIVE_PRODUCT', 'products', req.params.id);
  res.json({ ok: true });
});

apiRouter.patch('/admin/shop/orders/:id', ...adminGuard, requirePermission('orders:write'), (req: AuthedRequest, res) => {
  const status = cleanText(req.body?.status, 40);
  if (!['pending_payment', 'paid', 'processing', 'fulfilled', 'refunded', 'cancelled'].includes(status)) {
    res.status(400).json({ error: 'Invalid order status.' });
    return;
  }
  const paymentStatus = status === 'paid' || status === 'processing' || status === 'fulfilled' ? 'paid' : status === 'refunded' ? 'refunded' : 'awaiting_payment';
  db.prepare('UPDATE orders SET status = ?, payment_status = ? WHERE id = ?').run(
    status,
    paymentStatus,
    req.params.id,
  );
  db.prepare('UPDATE invoices SET status = ? WHERE order_id = ?').run(
    paymentStatus === 'paid' ? 'paid' : paymentStatus === 'refunded' ? 'refunded' : 'unpaid',
    req.params.id,
  );
  logAudit(req.authUser!.id, req.authUser!.email, 'UPDATE_ORDER', 'orders', req.params.id, status);
  res.json({ ok: true });
});

apiRouter.post('/admin/shop/coupons', ...adminGuard, requirePermission('shop:write'), (req: AuthedRequest, res) => {
  const code = cleanText(req.body?.code, 30).toUpperCase();
  const discountPercent = Number(req.body?.discount_percent);
  const maxUses = Number(req.body?.max_uses) || 100;
  if (!code || !Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 90) {
    res.status(400).json({ error: 'Valid code and discount (1-90%) required.' });
    return;
  }
  const id = generateId('cpn');
  db.prepare(`
    INSERT INTO coupons (id, code, discount_percent, active, max_uses, used_count, expires_at)
    VALUES (?, ?, ?, 1, ?, 0, '2027-12-31T23:59:59Z')
  `).run(id, code, discountPercent, maxUses);
  logAudit(req.authUser!.id, req.authUser!.email, 'CREATE_COUPON', 'coupons', id, code);
  res.status(201).json({ id });
});

apiRouter.delete('/admin/shop/coupons/:id', ...adminGuard, requirePermission('shop:write'), (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id);
  logAudit(req.authUser!.id, req.authUser!.email, 'DELETE_COUPON', 'coupons', req.params.id);
  res.json({ ok: true });
});

apiRouter.patch('/admin/partners/:id', ...adminGuard, requirePermission('cms:write'), (req: AuthedRequest, res) => {
  const status = cleanText(req.body?.status, 30);
  const commissionRate = Number(req.body?.commission_rate) || 15;
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Invalid partner status.' });
    return;
  }
  const partner = db.prepare('SELECT user_id FROM partners WHERE id = ?').get(req.params.id) as
    | { user_id: string | null }
    | undefined;
  db.prepare('UPDATE partners SET status = ?, commission_rate = ? WHERE id = ?').run(
    status,
    commissionRate,
    req.params.id,
  );
  if (status === 'approved' && partner?.user_id) {
    db.prepare("UPDATE users SET role = 'partner' WHERE id = ? AND role = 'customer'").run(partner.user_id);
  }
  logAudit(req.authUser!.id, req.authUser!.email, 'UPDATE_PARTNER', 'partners', req.params.id, status);
  res.json({ ok: true });
});

apiRouter.patch('/admin/careers/:id', ...adminGuard, requirePermission('cms:write'), (req: AuthedRequest, res) => {
  const status = cleanText(req.body?.status, 30);
  const notes = cleanText(req.body?.reviewer_notes, 500);
  if (!['received', 'reviewing', 'interview', 'accepted', 'declined'].includes(status)) {
    res.status(400).json({ error: 'Invalid application status.' });
    return;
  }
  db.prepare('UPDATE career_applications SET status = ?, reviewer_notes = ? WHERE id = ?').run(
    status,
    notes,
    req.params.id,
  );
  logAudit(req.authUser!.id, req.authUser!.email, 'UPDATE_CAREER_APP', 'career_applications', req.params.id, status);
  res.json({ ok: true });
});

apiRouter.patch('/admin/launch/:id', ...adminGuard, requirePermission('cms:write'), (req: AuthedRequest, res) => {
  const status = cleanText(req.body?.eligibility_status, 40);
  if (!['pending_verification', 'qualified', 'waitlisted', 'ineligible'].includes(status)) {
    res.status(400).json({ error: 'Invalid eligibility status.' });
    return;
  }
  let slotNum: number | null = null;
  if (status === 'qualified') {
    const c = (
      db
        .prepare("SELECT COUNT(*) as c FROM early_access_registrations WHERE eligibility_status = 'qualified'")
        .get() as { c: number }
    ).c;
    slotNum = c + 1;
  }
  db.prepare('UPDATE early_access_registrations SET eligibility_status = ?, slot_number = ? WHERE id = ?').run(
    status,
    slotNum,
    req.params.id,
  );
  logAudit(req.authUser!.id, req.authUser!.email, 'UPDATE_EARLY_ACCESS', 'early_access_registrations', req.params.id, status);
  res.json({ ok: true });
});

apiRouter.patch('/admin/support/tickets/:id', ...adminGuard, requirePermission('support:write'), (req: AuthedRequest, res) => {
  const status = cleanText(req.body?.status, 30);
  const priority = cleanText(req.body?.priority, 20);
  if (!['open', 'answered', 'resolved', 'closed'].includes(status)) {
    res.status(400).json({ error: 'Invalid ticket status.' });
    return;
  }
  db.prepare('UPDATE support_tickets SET status = ?, priority = COALESCE(NULLIF(?, \'\'), priority), updated_at = ? WHERE id = ?').run(
    status,
    priority,
    new Date().toISOString(),
    req.params.id,
  );
  logAudit(req.authUser!.id, req.authUser!.email, 'UPDATE_TICKET', 'support_tickets', req.params.id, status);
  res.json({ ok: true });
});

apiRouter.post('/admin/blog/posts', ...adminGuard, requirePermission('cms:write'), (req: AuthedRequest, res) => {
  const title = cleanText(req.body?.title, 160);
  const category = cleanText(req.body?.category, 50) || 'Engineering';
  const excerpt = cleanText(req.body?.excerpt, 400);
  const content = cleanText(req.body?.content, 8000);
  const status = req.body?.status === 'draft' ? 'draft' : 'published';

  if (title.length < 4 || excerpt.length < 10 || content.length < 20) {
    res.status(400).json({ error: 'Title, excerpt, and article content are required.' });
    return;
  }

  const id = generateId('post');
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${crypto.randomBytes(2).toString('hex')}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO blog_posts (id, slug, title, category, tags_json, excerpt, content, author_name, status, featured, published_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(id, slug, title, category, JSON.stringify([category]), excerpt, content, req.authUser!.name, status, now, now);

  logAudit(req.authUser!.id, req.authUser!.email, 'CREATE_BLOG_POST', 'blog_posts', id, title);
  res.status(201).json({ id });
});

apiRouter.delete('/admin/blog/posts/:id', ...adminGuard, requirePermission('cms:write'), (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM blog_posts WHERE id = ?').run(req.params.id);
  logAudit(req.authUser!.id, req.authUser!.email, 'DELETE_BLOG_POST', 'blog_posts', req.params.id);
  res.json({ ok: true });
});

apiRouter.post('/admin/announcements', ...adminGuard, requirePermission('cms:write'), (req: AuthedRequest, res) => {
  const title = cleanText(req.body?.title, 120);
  const body = cleanText(req.body?.body, 400);
  const type = cleanText(req.body?.type, 30) || 'general';
  if (title.length < 3 || body.length < 5) {
    res.status(400).json({ error: 'Title and announcement message required.' });
    return;
  }
  const id = generateId('ann');
  db.prepare('INSERT INTO announcements (id, title, body, type, active, created_at) VALUES (?, ?, ?, ?, 1, ?)').run(
    id,
    title,
    body,
    type,
    new Date().toISOString(),
  );
  logAudit(req.authUser!.id, req.authUser!.email, 'CREATE_ANNOUNCEMENT', 'announcements', id, title);
  res.status(201).json({ id });
});

apiRouter.delete('/admin/announcements/:id', ...adminGuard, requirePermission('cms:write'), (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  logAudit(req.authUser!.id, req.authUser!.email, 'DELETE_ANNOUNCEMENT', 'announcements', req.params.id);
  res.json({ ok: true });
});

apiRouter.post('/admin/faqs', ...adminGuard, requirePermission('cms:write'), (req: AuthedRequest, res) => {
  const category = cleanText(req.body?.category, 50) || 'General';
  const question = cleanText(req.body?.question, 200);
  const answer = cleanText(req.body?.answer, 800);
  if (question.length < 5 || answer.length < 10) {
    res.status(400).json({ error: 'FAQ question and answer are required.' });
    return;
  }
  const id = generateId('faq');
  db.prepare('INSERT INTO faqs (id, category, question, answer, sort_order) VALUES (?, ?, ?, ?, 50)').run(
    id,
    category,
    question,
    answer,
  );
  logAudit(req.authUser!.id, req.authUser!.email, 'CREATE_FAQ', 'faqs', id, question);
  res.status(201).json({ id });
});

apiRouter.delete('/admin/faqs/:id', ...adminGuard, requirePermission('cms:write'), (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM faqs WHERE id = ?').run(req.params.id);
  logAudit(req.authUser!.id, req.authUser!.email, 'DELETE_FAQ', 'faqs', req.params.id);
  res.json({ ok: true });
});

apiRouter.patch('/admin/settings', ...adminGuard, requirePermission('settings:write'), (req: AuthedRequest, res) => {
  const key = cleanText(req.body?.key, 40) || 'general';
  if (key === 'security_controls') {
    res.status(403).json({ error: 'Security controls must be updated via /api/admin/security/controls.' });
    return;
  }
  const value = req.body?.value;
  if (!value || typeof value !== 'object') {
    res.status(400).json({ error: 'Valid settings object required.' });
    return;
  }
  db.prepare(`
    INSERT INTO site_settings (key, value_json, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
  `).run(key, JSON.stringify(value), new Date().toISOString());

  logAudit(req.authUser!.id, req.authUser!.email, 'UPDATE_SETTINGS', 'site_settings', key);
  res.json({ ok: true });
});
