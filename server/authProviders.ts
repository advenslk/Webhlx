import crypto from 'node:crypto';
import { cleanText, isSafeHttpUrl, isValidEmail } from './security.ts';

export type OAuthProviderId = 'discord' | 'google' | 'github' | 'apple';

interface OAuthProviderConfig {
  id: OAuthProviderId;
  label: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  clientId: string;
  clientSecret: string;
  configured: boolean;
}

const OAUTH_STATE_SECRET =
  process.env.SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

export function getAuthPublicConfig() {
  const turnstileSiteKey = process.env.VITE_TURNSTILE_SITE_KEY?.trim() || '';
  const turnstileSecretConfigured = Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
  const emailConfigured = Boolean(process.env.RESEND_API_KEY?.trim());

  return {
    turnstileSiteKey,
    turnstileConfigured: Boolean(turnstileSiteKey && turnstileSecretConfigured),
    emailConfigured,
    oauthProviders: {
      discord: Boolean(
        process.env.DISCORD_CLIENT_ID?.trim() && process.env.DISCORD_CLIENT_SECRET?.trim(),
      ),
      google: Boolean(
        process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
      ),
      github: Boolean(
        process.env.GITHUB_CLIENT_ID?.trim() && process.env.GITHUB_CLIENT_SECRET?.trim(),
      ),
      apple: Boolean(
        process.env.APPLE_CLIENT_ID?.trim() && process.env.APPLE_CLIENT_SECRET?.trim(),
      ),
    },
  };
}

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = cleanText(token, 2048);
  if (!trimmed) {
    return { ok: false, error: 'Please complete the Cloudflare security verification.' };
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secretKey) {
    // Preview / local mode without TURNSTILE_SECRET_KEY: accept either live Turnstile test token or completed interactive widget token
    if (trimmed.startsWith('cf-turnstile-verified:') || trimmed.length >= 16) {
      return { ok: true };
    }
    return { ok: false, error: 'Please complete the Cloudflare security verification.' };
  }

  try {
    const form = new URLSearchParams();
    form.set('secret', secretKey);
    form.set('response', trimmed);
    if (remoteIp) {
      form.set('remoteip', remoteIp);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      signal: AbortSignal.timeout(8000),
    });

    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (!res.ok || !data.success) {
      return {
        ok: false,
        error: 'Cloudflare human verification failed. Please retry the check.',
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'Unable to verify Cloudflare security check right now. Please try again.',
    };
  }
}

export function generateSixDigitCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtpCode(challengeId: string, code: string): string {
  return crypto
    .createHash('sha256')
    .update(`${challengeId}:${code.trim()}`)
    .digest('hex');
}

export async function sendOtpEmail(params: {
  email: string;
  name?: string;
  code: string;
  purpose: 'login' | 'register';
}): Promise<{ deliveryMode: 'email' | 'preview'; provider: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromAddress =
    process.env.EMAIL_FROM?.trim() || 'HelzerX Technologies <onboarding@resend.dev>';

  if (!apiKey) {
    console.info(
      `[HelzerX Auth OTP] (${params.purpose}) 6-digit verification code for ${params.email}: ${params.code}`,
    );
    return { deliveryMode: 'preview', provider: 'preview' };
  }

  const actionLabel = params.purpose === 'register' ? 'complete registration' : 'sign in';
  const greetingName = params.name ? ` ${params.name}` : '';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; color: #0A0A0B; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 14px;">
      <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #71717a;">HelzerX Unified Identity</div>
      <h2 style="margin: 10px 0 8px; font-size: 22px; font-weight: 800;">Your 6-digit verification code</h2>
      <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #3f3f46;">
        Hello${greetingName}, enter this 6-digit security code to ${actionLabel} on HelzerX Technologies. It expires in 10 minutes.
      </p>
      <div style="padding: 18px 20px; background: #f4f4f5; border: 1px solid #d4d4d8; border-radius: 10px; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 32px; font-weight: 800; letter-spacing: 0.3em; color: #0A0A0B;">
        ${params.code}
      </div>
      <p style="margin: 20px 0 0; font-size: 12px; color: #71717a;">
        If you did not request this code, you can safely ignore this email.
      </p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [params.email],
        subject: `${params.code} is your HelzerX verification code`,
        html,
        text: `Your HelzerX 6-digit verification code is: ${params.code}. It expires in 10 minutes.`,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[HelzerX Auth OTP] Resend delivery failed, falling back to preview:', errText);
      return { deliveryMode: 'preview', provider: 'preview' };
    }

    return { deliveryMode: 'email', provider: 'resend' };
  } catch (err) {
    console.warn('[HelzerX Auth OTP] Email request error, falling back to preview:', err);
    return { deliveryMode: 'preview', provider: 'preview' };
  }
}

export function getProviderConfig(provider: string): OAuthProviderConfig | null {
  switch (provider) {
    case 'discord': {
      const clientId = process.env.DISCORD_CLIENT_ID?.trim() || '';
      const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim() || '';
      return {
        id: 'discord',
        label: 'Discord',
        clientIdEnv: 'DISCORD_CLIENT_ID',
        clientSecretEnv: 'DISCORD_CLIENT_SECRET',
        clientId,
        clientSecret,
        configured: Boolean(clientId && clientSecret),
      };
    }
    case 'google': {
      const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || '';
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || '';
      return {
        id: 'google',
        label: 'Google',
        clientIdEnv: 'GOOGLE_CLIENT_ID',
        clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
        clientId,
        clientSecret,
        configured: Boolean(clientId && clientSecret),
      };
    }
    case 'github': {
      const clientId = process.env.GITHUB_CLIENT_ID?.trim() || '';
      const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim() || '';
      return {
        id: 'github',
        label: 'GitHub',
        clientIdEnv: 'GITHUB_CLIENT_ID',
        clientSecretEnv: 'GITHUB_CLIENT_SECRET',
        clientId,
        clientSecret,
        configured: Boolean(clientId && clientSecret),
      };
    }
    case 'apple': {
      const clientId = process.env.APPLE_CLIENT_ID?.trim() || '';
      const clientSecret = process.env.APPLE_CLIENT_SECRET?.trim() || '';
      return {
        id: 'apple',
        label: 'Apple ID',
        clientIdEnv: 'APPLE_CLIENT_ID',
        clientSecretEnv: 'APPLE_CLIENT_SECRET',
        clientId,
        clientSecret,
        configured: Boolean(clientId && clientSecret),
      };
    }
    default:
      return null;
  }
}

export function resolveAppBaseUrl(requestedOrigin?: string): string {
  const configuredAppUrl = process.env.APP_URL?.trim();
  if (configuredAppUrl && isSafeHttpUrl(configuredAppUrl)) {
    return configuredAppUrl.replace(/\/+$/, '');
  }
  if (requestedOrigin && isSafeHttpUrl(requestedOrigin)) {
    return new URL(requestedOrigin).origin;
  }
  return 'http://localhost:3000';
}

interface OAuthStatePayload {
  provider: OAuthProviderId;
  redirectUri: string;
  nonce: string;
  exp: number;
}

export function signOAuthState(payload: Omit<OAuthStatePayload, 'nonce' | 'exp'>): string {
  const full: OAuthStatePayload = {
    ...payload,
    nonce: crypto.randomBytes(10).toString('hex'),
    exp: Math.floor(Date.now() / 1000) + 600,
  };
  const encoded = Buffer.from(JSON.stringify(full)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', OAUTH_STATE_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyOAuthState(
  stateToken: string,
  expectedProvider: OAuthProviderId,
): OAuthStatePayload | null {
  const [encoded, sig] = stateToken.split('.');
  if (!encoded || !sig) return null;
  const expectedSig = crypto
    .createHmac('sha256', OAUTH_STATE_SECRET)
    .update(encoded)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as OAuthStatePayload;
    if (
      parsed.provider !== expectedProvider ||
      !parsed.redirectUri ||
      parsed.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function buildOAuthAuthorizeUrl(
  config: OAuthProviderConfig,
  redirectUri: string,
): string {
  const state = signOAuthState({ provider: config.id, redirectUri });

  if (config.id === 'discord') {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify email',
      state,
    });
    return `https://discord.com/oauth2/authorize?${params.toString()}`;
  }

  if (config.id === 'google') {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      prompt: 'select_account',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  if (config.id === 'github') {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  // Apple ID
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    response_mode: 'form_post',
    scope: 'name email',
    state,
  });
  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
}

export async function exchangeOAuthCodeForProfile(params: {
  config: OAuthProviderConfig;
  code: string;
  redirectUri: string;
  appleUserJson?: string;
}): Promise<{ email: string; name: string; avatarUrl: string }> {
  const { config, code, redirectUri, appleUserJson } = params;

  if (config.id === 'discord') {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }).toString(),
      signal: AbortSignal.timeout(10000),
    });
    const tokenData = (await tokenRes.json()) as { access_token?: string; error_description?: string };
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Discord token exchange failed.');
    }

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      signal: AbortSignal.timeout(10000),
    });
    const u = (await userRes.json()) as {
      id?: string;
      username?: string;
      global_name?: string;
      email?: string;
      avatar?: string;
    };
    if (!userRes.ok || !u.email || !isValidEmail(u.email)) {
      throw new Error('Discord did not return a verified email address.');
    }
    const avatarUrl =
      u.id && u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png` : '';
    return {
      email: u.email.toLowerCase(),
      name: cleanText(u.global_name || u.username || 'Discord User', 80),
      avatarUrl,
    };
  }

  if (config.id === 'google') {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }).toString(),
      signal: AbortSignal.timeout(10000),
    });
    const tokenData = (await tokenRes.json()) as { access_token?: string; error_description?: string };
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Google token exchange failed.');
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      signal: AbortSignal.timeout(10000),
    });
    const u = (await userRes.json()) as { email?: string; name?: string; picture?: string };
    if (!userRes.ok || !u.email || !isValidEmail(u.email)) {
      throw new Error('Google did not return an email address.');
    }
    return {
      email: u.email.toLowerCase(),
      name: cleanText(u.name || 'Google User', 80),
      avatarUrl: cleanText(u.picture || '', 500),
    };
  }

  if (config.id === 'github') {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUri,
      }).toString(),
      signal: AbortSignal.timeout(10000),
    });
    const tokenData = (await tokenRes.json()) as { access_token?: string; error_description?: string };
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || 'GitHub token exchange failed.');
    }

    const headers = {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'HelzerX-Technologies',
    };
    const userRes = await fetch('https://api.github.com/user', {
      headers,
      signal: AbortSignal.timeout(10000),
    });
    const u = (await userRes.json()) as {
      login?: string;
      name?: string;
      email?: string;
      avatar_url?: string;
    };

    let email = u.email?.toLowerCase() || '';
    if (!email || !isValidEmail(email)) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers,
        signal: AbortSignal.timeout(10000),
      });
      if (emailsRes.ok) {
        const list = (await emailsRes.json()) as {
          email: string;
          primary: boolean;
          verified: boolean;
        }[];
        const primary = list.find((e) => e.primary && e.verified) || list.find((e) => e.verified);
        email = primary?.email?.toLowerCase() || '';
      }
    }
    if (!email || !isValidEmail(email)) {
      throw new Error('GitHub account does not have a verified email address.');
    }
    return {
      email,
      name: cleanText(u.name || u.login || 'GitHub User', 80),
      avatarUrl: cleanText(u.avatar_url || '', 500),
    };
  }

  // Apple ID
  const tokenRes = await fetch('https://appleid.apple.com/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }).toString(),
    signal: AbortSignal.timeout(10000),
  });
  const tokenData = (await tokenRes.json()) as { id_token?: string; error?: string };
  if (!tokenRes.ok || !tokenData.id_token) {
    throw new Error(tokenData.error || 'Apple ID token exchange failed.');
  }

  const jwtParts = tokenData.id_token.split('.');
  if (jwtParts.length < 2) {
    throw new Error('Invalid Apple ID token payload.');
  }
  const claims = JSON.parse(Buffer.from(jwtParts[1], 'base64url').toString('utf8')) as {
    email?: string;
    sub?: string;
  };
  let appleName = 'Apple User';
  if (appleUserJson) {
    try {
      const parsedUser = JSON.parse(appleUserJson) as {
        name?: { firstName?: string; lastName?: string };
      };
      const combined = [parsedUser.name?.firstName, parsedUser.name?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (combined) appleName = combined;
    } catch {
      // ignore malformed optional user JSON
    }
  }
  const email = claims.email?.toLowerCase() || '';
  if (!email || !isValidEmail(email)) {
    throw new Error('Apple ID did not provide an email address.');
  }
  return {
    email,
    name: cleanText(appleName, 80),
    avatarUrl: '',
  };
}
