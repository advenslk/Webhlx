import crypto from 'node:crypto';
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
  cleanText,
  createRateLimiter,
  generateId,
  hashPassword,
  isSafeHttpUrl,
  isValidEmail,
  sanitizeFileName,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
  type UserRole,
} from './security.ts';

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
  created_at: string;
}

interface AuthedRequest extends Request {
  authUser?: AuthenticatedUser;
}

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
    created_at: String(row.created_at),
  };
}

function getOptionalUser(req: Request): AuthenticatedUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const payload = verifySessionToken(token);
  if (!payload) return null;
  const row = db
    .prepare(
      'SELECT id, name, email, role, status, email_verified, avatar_url, notify_email, notify_security, created_at FROM users WHERE id = ?',
    )
    .get(payload.sub) as Record<string, unknown> | undefined;
  if (!row || row.status !== 'active') return null;
  return sanitizeUser(row);
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const user = getOptionalUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  req.authUser = user;
  next();
}

function requireRole(roles: UserRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      res.status(403).json({ error: 'Insufficient permissions for this action.' });
      return;
    }
    next();
  };
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

const authRateLimit = createRateLimiter(25, 10 * 60 * 1000);
const formRateLimit = createRateLimiter(30, 10 * 60 * 1000);

apiRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'HelzerX Technologies API',
    timestamp: new Date().toISOString(),
  });
});

// ==================================================
// AUTHENTICATION & FIRST-RUN SUPER ADMIN BOOTSTRAP
// ==================================================

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

  if (name.length < 2 || !isValidEmail(email) || password.length < 8) {
    res.status(400).json({
      error: 'Provide a valid name, email address, and password (minimum 8 characters).',
    });
    return;
  }

  const configuredPasscode = process.env.HELZERX_ADMIN_PASSCODE?.trim();
  if (configuredPasscode) {
    if (!passcode || passcode !== configuredPasscode) {
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
  const token = signSessionToken({ sub: userId, email, role: 'super_admin' });
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as Record<string, unknown>;
  res.status(201).json({ token, user: sanitizeUser(row) });
});

apiRouter.post('/auth/register', authRateLimit, async (req, res) => {
  const name = cleanText(req.body?.name, 80);
  const email = cleanText(req.body?.email, 254).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (name.length < 2) {
    res.status(400).json({ error: 'Name must be at least 2 characters.' });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const userId = generateId('usr');
  const passwordHash = await hashPassword(password);
  const verificationToken = crypto.randomBytes(12).toString('hex');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, status, email_verified, verification_token, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'customer', 'active', 0, ?, ?, ?)
  `).run(userId, name, email, passwordHash, verificationToken, now, now);

  createNotification(
    userId,
    'Verify your HelzerX email',
    'Complete email verification in Security Settings to unlock full Early Access eligibility.',
  );

  const token = signSessionToken({ sub: userId, email, role: 'customer' });
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as Record<string, unknown>;
  res.status(201).json({
    token,
    user: sanitizeUser(row),
    verificationTokenPreview: verificationToken,
  });
});

apiRouter.post('/auth/login', authRateLimit, async (req, res) => {
  const email = cleanText(req.body?.email, 254).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!isValidEmail(email) || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
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
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (row.status !== 'active') {
    res.status(403).json({ error: 'This account has been suspended. Contact support.' });
    return;
  }

  const role = String(row.role) as UserRole;
  const token = signSessionToken({
    sub: String(row.id),
    email: String(row.email),
    role,
  });

  res.json({ token, user: sanitizeUser(row) });
});

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
  const email = cleanText(req.body?.email, 254).toLowerCase();
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;
  if (!user) {
    res.json({
      ok: true,
      message: 'If an account matches that email, a reset token has been generated.',
    });
    return;
  }

  const resetToken = crypto.randomBytes(12).toString('hex');
  db.prepare('UPDATE users SET reset_token = ?, updated_at = ? WHERE id = ?').run(
    resetToken,
    new Date().toISOString(),
    user.id,
  );

  res.json({
    ok: true,
    message: 'Password reset token generated. Enter the token below to set a new password.',
    resetTokenPreview: resetToken,
  });
});

apiRouter.post('/auth/reset-password', authRateLimit, async (req, res) => {
  const token = cleanText(req.body?.token, 64);
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
  if (!token || newPassword.length < 8) {
    res.status(400).json({ error: 'Valid reset token and password (min 8 chars) required.' });
    return;
  }

  const user = db.prepare('SELECT id FROM users WHERE reset_token = ?').get(token) as
    | { id: string }
    | undefined;
  if (!user) {
    res.status(404).json({ error: 'Invalid or expired reset token.' });
    return;
  }

  const passwordHash = await hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, updated_at = ? WHERE id = ?').run(
    passwordHash,
    new Date().toISOString(),
    user.id,
  );

  res.json({ ok: true, message: 'Password updated. You can now sign in.' });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: req.authUser });
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

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters.' });
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

  const nextHash = await hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
    nextHash,
    new Date().toISOString(),
    user.id,
  );
  res.json({ ok: true, message: 'Password updated successfully.' });
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

apiRouter.get('/cloud/pterodactyl/status', (_req, res) => {
  res.json(getPterodactylStatus());
});

apiRouter.get('/cloud/servers', requireAuth, async (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const isAdmin = user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff';

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
      panelUrl: pteroStatus.panelUrl,
      hasClientKey: pteroStatus.hasClientKey,
      requiredEnvVars: pteroStatus.requiredEnvVars,
      syncedServers: pterodactylServers,
      syncError: pterodactylError,
    },
  });
});

apiRouter.post('/cloud/servers/request', requireAuth, formRateLimit, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const planId = cleanText(req.body?.planId, 64);
  const serverName = cleanText(req.body?.name, 60);

  if (!planId || serverName.length < 3) {
    res.status(400).json({ error: 'Valid plan and server name (min 3 chars) are required.' });
    return;
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

  const created = db.prepare('SELECT * FROM cloud_servers WHERE id = ?').get(serverId);
  res.status(201).json({ server: created });
});

apiRouter.get('/cloud/servers/:id/resources', requireAuth, async (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const srv = db.prepare('SELECT * FROM cloud_servers WHERE id = ?').get(req.params.id) as
    | { id: string; user_id: string; pterodactyl_identifier: string }
    | undefined;
  if (!srv) {
    res.status(404).json({ error: 'Server record not found.' });
    return;
  }
  const isAdmin = user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff';
  if (srv.user_id !== user.id && !isAdmin) {
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

apiRouter.post('/cloud/servers/:id/power', requireAuth, async (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const signal = req.body?.signal;
  if (!['start', 'stop', 'restart', 'kill'].includes(signal)) {
    res.status(400).json({ error: 'Invalid power signal.' });
    return;
  }

  const srv = db.prepare('SELECT * FROM cloud_servers WHERE id = ?').get(req.params.id) as
    | { id: string; user_id: string; pterodactyl_identifier: string }
    | undefined;
  if (!srv) {
    res.status(404).json({ error: 'Server record not found.' });
    return;
  }
  const isAdmin = user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff';
  if (srv.user_id !== user.id && !isAdmin) {
    res.status(403).json({ error: 'Access denied.' });
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
      if (product.stock < qty) {
        db.exec('ROLLBACK;');
        res.status(409).json({ error: `Insufficient stock for ${product.name}.` });
        return;
      }

      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, product.id);
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

  const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const createdInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
  res.status(201).json({
    order: createdOrder,
    invoice: createdInvoice,
    stripeConfigured,
    paymentNotice: stripeConfigured
      ? 'Order created and awaiting Stripe payment confirmation.'
      : 'Order and invoice saved with status pending_payment. Configure STRIPE_SECRET_KEY on the server to process live card payments.',
  });
});

// ==================================================
// HELZERX STUDIO PROJECTS
// ==================================================

apiRouter.get('/studio/projects', requireAuth, (req: AuthedRequest, res) => {
  const user = req.authUser!;
  const isAdmin = user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff';
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
  const attachmentName = sanitizeFileName(req.body?.attachmentName);

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

  const isAdmin = user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff';
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
  const attachmentName = sanitizeFileName(req.body?.attachmentName);

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
  const isAdmin = user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff';
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
  const attachmentName = sanitizeFileName(req.body?.attachmentName);

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
  const attachmentName = sanitizeFileName(req.body?.attachmentName);
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
  const isAdmin = user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff';
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

const adminGuard = [requireAuth, requireRole(['super_admin', 'admin', 'staff'])] as const;

apiRouter.get('/admin/overview', ...adminGuard, (_req, res) => {
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
    .prepare('SELECT id, name, email, role, status, email_verified, created_at FROM users ORDER BY created_at DESC')
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
  const auditLogs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 60').all();

  res.json({
    metrics: {
      totalUsers,
      activeUsers,
      totalOrders,
      totalRevenue: totalRevenueRow.total,
      activeServers,
      pendingProjects,
      openTickets,
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
    pterodactyl: getPterodactylStatus(),
  });
});

apiRouter.patch('/admin/users/:id', ...adminGuard, (req: AuthedRequest, res) => {
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

  if (nextRole && !['super_admin', 'admin', 'staff', 'partner', 'customer'].includes(nextRole)) {
    res.status(400).json({ error: 'Invalid role.' });
    return;
  }
  if (nextRole && nextRole !== target.role && actor.role !== 'super_admin') {
    res.status(403).json({ error: 'Only a Super Admin can modify account roles.' });
    return;
  }
  if (nextStatus && !['active', 'suspended'].includes(nextStatus)) {
    res.status(400).json({ error: 'Invalid account status.' });
    return;
  }

  db.prepare('UPDATE users SET role = ?, status = ?, updated_at = ? WHERE id = ?').run(
    nextRole ?? target.role,
    nextStatus ?? target.status,
    new Date().toISOString(),
    target.id,
  );

  logAudit(actor.id, actor.email, 'UPDATE_USER', 'users', target.id, `role=${nextRole ?? target.role}, status=${nextStatus ?? target.status}`);
  res.json({ ok: true });
});

apiRouter.post('/admin/cloud/plans', ...adminGuard, (req: AuthedRequest, res) => {
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

apiRouter.delete('/admin/cloud/plans/:id', ...adminGuard, (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM hosting_plans WHERE id = ?').run(req.params.id);
  logAudit(req.authUser!.id, req.authUser!.email, 'DELETE_PLAN', 'hosting_plans', req.params.id);
  res.json({ ok: true });
});

apiRouter.patch('/admin/cloud/servers/:id', ...adminGuard, (req: AuthedRequest, res) => {
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

apiRouter.patch('/admin/studio/projects/:id', ...adminGuard, (req: AuthedRequest, res) => {
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

apiRouter.post('/admin/shop/products', ...adminGuard, (req: AuthedRequest, res) => {
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

apiRouter.patch('/admin/shop/products/:id', ...adminGuard, (req: AuthedRequest, res) => {
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

apiRouter.delete('/admin/shop/products/:id', ...adminGuard, (req: AuthedRequest, res) => {
  db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(req.params.id);
  logAudit(req.authUser!.id, req.authUser!.email, 'ARCHIVE_PRODUCT', 'products', req.params.id);
  res.json({ ok: true });
});

apiRouter.patch('/admin/shop/orders/:id', ...adminGuard, (req: AuthedRequest, res) => {
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

apiRouter.post('/admin/shop/coupons', ...adminGuard, (req: AuthedRequest, res) => {
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

apiRouter.delete('/admin/shop/coupons/:id', ...adminGuard, (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id);
  logAudit(req.authUser!.id, req.authUser!.email, 'DELETE_COUPON', 'coupons', req.params.id);
  res.json({ ok: true });
});

apiRouter.patch('/admin/partners/:id', ...adminGuard, (req: AuthedRequest, res) => {
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

apiRouter.patch('/admin/careers/:id', ...adminGuard, (req: AuthedRequest, res) => {
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

apiRouter.patch('/admin/launch/:id', ...adminGuard, (req: AuthedRequest, res) => {
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

apiRouter.patch('/admin/support/tickets/:id', ...adminGuard, (req: AuthedRequest, res) => {
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

apiRouter.post('/admin/blog/posts', ...adminGuard, (req: AuthedRequest, res) => {
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

apiRouter.delete('/admin/blog/posts/:id', ...adminGuard, (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM blog_posts WHERE id = ?').run(req.params.id);
  logAudit(req.authUser!.id, req.authUser!.email, 'DELETE_BLOG_POST', 'blog_posts', req.params.id);
  res.json({ ok: true });
});

apiRouter.post('/admin/announcements', ...adminGuard, (req: AuthedRequest, res) => {
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

apiRouter.delete('/admin/announcements/:id', ...adminGuard, (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  logAudit(req.authUser!.id, req.authUser!.email, 'DELETE_ANNOUNCEMENT', 'announcements', req.params.id);
  res.json({ ok: true });
});

apiRouter.post('/admin/faqs', ...adminGuard, (req: AuthedRequest, res) => {
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

apiRouter.delete('/admin/faqs/:id', ...adminGuard, (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM faqs WHERE id = ?').run(req.params.id);
  logAudit(req.authUser!.id, req.authUser!.email, 'DELETE_FAQ', 'faqs', req.params.id);
  res.json({ ok: true });
});

apiRouter.patch('/admin/settings', ...adminGuard, (req: AuthedRequest, res) => {
  const key = cleanText(req.body?.key, 40) || 'general';
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
