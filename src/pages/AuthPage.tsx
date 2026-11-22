import { ArrowLeft, CheckCircle2, KeyRound, Mail, RefreshCw, ShieldAlert } from 'lucide-react';
import {
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Surface3D } from '../components/Surface3D';
import { TurnstileWidget } from '../components/TurnstileWidget';
import { isAdminPanelRole, useAppContext, type AuthUser } from '../context/AppContext';
import { apiRequest } from '../lib/api';
import { PageRoute } from '../types/navigation';

interface AuthPageProps {
  onNavigate: (route: PageRoute) => void;
}

type AuthMode = 'login' | 'register' | 'bootstrap';
type AuthStep = 'credentials' | 'otp';
type OAuthProvider = 'discord' | 'google' | 'github' | 'apple';

interface AuthConfigResponse {
  turnstileSiteKey: string;
  turnstileConfigured: boolean;
  emailConfigured: boolean;
  oauthProviders: Record<OAuthProvider, boolean>;
}

interface StartOtpResponse {
  challengeId: string;
  email: string;
  expiresInSeconds: number;
  deliveryMode: 'email' | 'preview';
  codePreview?: string;
}

interface OAuthUrlResponse {
  configured: boolean;
  provider: OAuthProvider;
  label: string;
  callbackUrl: string;
  url?: string;
  requiredEnvVars?: string[];
}

export function AuthPage({ onNavigate }: AuthPageProps) {
  const { setSession } = useAppContext();
  const [mode, setMode] = useState<AuthMode>('login');
  const [step, setStep] = useState<AuthStep>('credentials');
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [passcodeRequired, setPasscodeRequired] = useState(false);
  const [authConfig, setAuthConfig] = useState<AuthConfigResponse | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);

  // 6-digit OTP verification state
  const [challengeId, setChallengeId] = useState('');
  const [challengeEmail, setChallengeEmail] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'register'>('login');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [deliveryMode, setDeliveryMode] = useState<'email' | 'preview'>('email');
  const [codePreview, setCodePreview] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [totpInput, setTotpInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [oauthInfo, setOauthInfo] = useState<{
    label: string;
    callbackUrl: string;
    requiredEnvVars: string[];
  } | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    apiRequest<{ needsBootstrap: boolean; passcodeConfigured: boolean }>('/api/auth/bootstrap-status')
      .then((res) => {
        setNeedsBootstrap(res.needsBootstrap);
        setPasscodeRequired(res.passcodeConfigured);
      })
      .catch(() => {
        // ignore
      });

    apiRequest<AuthConfigResponse>('/api/auth/config')
      .then((cfg) => setAuthConfig(cfg))
      .catch(() => {
        // ignore
      });
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      const isTrustedOrigin =
        origin === window.location.origin ||
        origin.endsWith('.run.app') ||
        origin.endsWith('.helzerx.cyou') ||
        origin === 'https://helzerx.cyou' ||
        origin.includes('localhost');
      if (!isTrustedOrigin) {
        return;
      }

      if (event.data?.type === 'HELZERX_OAUTH_SUCCESS' && event.data?.token && event.data?.user) {
        const authedUser = event.data.user as AuthUser;
        setSession(String(event.data.token), authedUser);
        setOauthLoading(null);
        onNavigate(isAdminPanelRole(authedUser.role) ? 'admin' : 'dashboard');
      } else if (event.data?.type === 'HELZERX_OAUTH_ERROR') {
        setOauthLoading(null);
        setError(
          typeof event.data.error === 'string'
            ? event.data.error
            : 'External sign-in failed. Please try again.',
        );
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [onNavigate, setSession]);

  const resetTurnstile = () => {
    setTurnstileToken('');
    setTurnstileResetSignal((s) => s + 1);
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setStep('credentials');
    setError(null);
    setNotice(null);
    setOauthInfo(null);
    setOtpDigits(['', '', '', '', '', '']);
    setCodePreview(null);
    setChallengeId('');
    setMfaRequired(false);
    setTotpInput('');
    resetTurnstile();
  };

  const handleCredentialsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setOauthInfo(null);

    if (mode === 'bootstrap') {
      setLoading(true);
      try {
        const res = await apiRequest<{ token: string; user: AuthUser }>(
          '/api/auth/bootstrap-admin',
          {
            method: 'POST',
            body: JSON.stringify({ name, email, password, passcode }),
          },
        );
        setSession(res.token, res.user);
        setNeedsBootstrap(false);
        onNavigate('admin');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Admin setup failed.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!turnstileToken) {
      setError('Please complete the Cloudflare verification check before continuing.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login/start' : '/api/auth/register/start';
      const payload =
        mode === 'login'
          ? { email, password, turnstileToken }
          : { name, email, password, turnstileToken };

      const res = await apiRequest<StartOtpResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setChallengeId(res.challengeId);
      setChallengeEmail(res.email);
      setOtpPurpose(mode);
      setDeliveryMode(res.deliveryMode);
      setCodePreview(res.codePreview ?? null);
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(20);
      setStep('otp');
      setNotice(
        res.deliveryMode === 'email'
          ? `A 6-digit verification code has been sent to ${res.email}.`
          : `6-digit verification code generated for ${res.email}.`,
      );
      window.setTimeout(() => otpInputRefs.current[0]?.focus(), 60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication request failed.');
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (!/^\d{6}$/.test(code)) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    if (mfaRequired && !totpInput.trim()) {
      setError('Enter your 6-digit Authenticator MFA code or one-time backup code.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const cleanedMfa = totpInput.trim();
      const isTotpDigits = /^\d{6}$/.test(cleanedMfa);
      const res = await apiRequest<{
        mfaRequired?: boolean;
        token?: string;
        user?: AuthUser;
      }>('/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          challengeId,
          code,
          ...(mfaRequired && cleanedMfa
            ? isTotpDigits
              ? { totpCode: cleanedMfa }
              : { backupCode: cleanedMfa }
            : {}),
        }),
      });

      if (res.mfaRequired) {
        setMfaRequired(true);
        setNotice('Email code verified. Enter your Authenticator App 6-digit TOTP or backup code.');
        setLoading(false);
        return;
      }

      if (res.token && res.user) {
        setSession(res.token, res.user);
        onNavigate(isAdminPanelRole(res.user.role) ? 'admin' : 'dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!challengeId || resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{
        ok: boolean;
        deliveryMode: 'email' | 'preview';
        codePreview?: string;
      }>('/api/auth/otp/resend', {
        method: 'POST',
        body: JSON.stringify({ challengeId }),
      });
      setDeliveryMode(res.deliveryMode);
      setCodePreview(res.codePreview ?? null);
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(20);
      setNotice(
        res.deliveryMode === 'email'
          ? `A new 6-digit verification code has been sent to ${challengeEmail}.`
          : `New 6-digit verification code generated for ${challengeEmail}.`,
      );
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, rawValue: string) => {
    const cleaned = rawValue.replace(/\D/g, '');
    if (!cleaned) {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }

    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('');
      setOtpDigits((prev) => {
        const next = [...prev];
        for (let i = 0; i < 6; i++) {
          if (chars[i]) next[i] = chars[i];
        }
        return next;
      });
      const focusIdx = Math.min(chars.length, 5);
      otpInputRefs.current[focusIdx]?.focus();
      return;
    }

    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });
    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const chars = pasted.split('');
    setOtpDigits([
      chars[0] ?? '',
      chars[1] ?? '',
      chars[2] ?? '',
      chars[3] ?? '',
      chars[4] ?? '',
      chars[5] ?? '',
    ]);
    otpInputRefs.current[Math.min(chars.length - 1, 5)]?.focus();
  };

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setError(null);
    setNotice(null);
    setOauthInfo(null);
    setOauthLoading(provider);

    try {
      const origin = encodeURIComponent(window.location.origin);
      const res = await apiRequest<OAuthUrlResponse>(
        `/api/auth/oauth/${provider}/url?origin=${origin}`,
      );

      if (!res.configured || !res.url) {
        setOauthLoading(null);
        setOauthInfo({
          label: res.label,
          callbackUrl: res.callbackUrl,
          requiredEnvVars: res.requiredEnvVars ?? [],
        });
        return;
      }

      const popup = window.open(res.url, 'helzerx_oauth', 'width=560,height=680');
      if (!popup) {
        setOauthLoading(null);
        setError('Popups were blocked by your browser. Please allow popups to continue.');
      }
    } catch (err) {
      setOauthLoading(null);
      setError(err instanceof Error ? err.message : 'Unable to start OAuth sign-in.');
    }
  };

  const oauthButtons: {
    id: OAuthProvider;
    label: string;
    icon: ReactNode;
  }[] = [
    {
      id: 'discord',
      label: 'Discord',
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 fill-[#5865F2]">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
        </svg>
      ),
    },
    {
      id: 'google',
      label: 'Google',
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
          />
        </svg>
      ),
    },
    {
      id: 'github',
      label: 'GitHub',
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 fill-[#0A0A0B]">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      ),
    },
    {
      id: 'apple',
      label: 'Apple ID',
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 fill-[#0A0A0B]">
          <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43Zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-[#F4F4F5] text-[#0A0A0B] helzerx-studio-hero py-16 md:py-24 px-6 min-h-[75vh]">
      <div className="max-w-[520px] mx-auto">
        <div className="text-center mb-8">
          <img
            src="/assets/aistudio/IMG_20261011_201132-removebg-preview_9b5f47c8.png"
            alt="HelzerX Technologies"
            className="h-9 w-auto object-contain mx-auto mb-3"
          />
          <div className="text-xs font-semibold text-neutral-500">HelzerX Unified Identity</div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0A0B]">
            {step === 'otp'
              ? 'Enter 6-Digit Email Code'
              : mode === 'login'
                ? 'Sign in to HelzerX'
                : mode === 'register'
                  ? 'Create your HelzerX Account'
                  : 'Claim First-Run Super Admin'}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            One account across Cloud, Studio, Shop, Partners, and Support Center.
          </p>
        </div>

        {/* First-Run Super Admin Bootstrap Alert */}
        {needsBootstrap && mode !== 'bootstrap' && step === 'credentials' && (
          <Surface3D variant="dark" intensity={8} className="mb-6">
            <div className="p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-white shrink-0 mt-0.5" />
                <div className="text-xs text-neutral-200 leading-relaxed">
                  <span className="font-semibold text-white block">
                    First-Run Super Admin Setup Available
                  </span>
                  No Super Admin has been claimed yet. Set up your administrator credentials before
                  sharing this site.
                </div>
              </div>
              <button
                type="button"
                onClick={() => switchMode('bootstrap')}
                className="px-3 py-1.5 text-xs font-bold text-[#0A0A0B] bg-white rounded-lg hover:bg-neutral-200 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Claim Admin
              </button>
            </div>
          </Surface3D>
        )}

        {/* Mode Tabs: Login & Register only */}
        {step === 'credentials' && (
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white border border-black/[0.08] shadow-sm mb-6">
            {(
              [
                ['login', 'Login'],
                ['register', 'Register'],
              ] as [AuthMode, string][]
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`py-2.5 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  mode === m
                    ? 'bg-[#0A0A0B] text-white'
                    : 'text-neutral-600 hover:text-[#0A0A0B] hover:bg-neutral-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <Surface3D intensity={4}>
          {step === 'credentials' ? (
            <div className="p-7 md:p-8">
              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                {(mode === 'register' || mode === 'bootstrap') && (
                  <div>
                    <label
                      htmlFor="auth-name"
                      className="block text-xs font-semibold text-[#0A0A0B] mb-1.5"
                    >
                      Full name
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-xs font-semibold text-[#0A0A0B] mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="auth-pass"
                    className="block text-xs font-semibold text-[#0A0A0B] mb-1.5"
                  >
                    Password{' '}
                    {mode !== 'login' ? '(min 8 chars · letters + number or symbol)' : ''}
                  </label>
                  <input
                    id="auth-pass"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                  />
                </div>

                {mode === 'bootstrap' && passcodeRequired && (
                  <div>
                    <label
                      htmlFor="auth-passcode"
                      className="block text-xs font-semibold text-[#0A0A0B] mb-1.5"
                    >
                      Admin Setup Passcode (HELZERX_ADMIN_PASSCODE)
                    </label>
                    <input
                      id="auth-passcode"
                      type="password"
                      required
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                    />
                  </div>
                )}

                {/* Cloudflare Turnstile Verification directly below Email & Password */}
                {mode !== 'bootstrap' && (
                  <div>
                    <TurnstileWidget
                      siteKey={authConfig?.turnstileSiteKey}
                      resetSignal={turnstileResetSignal}
                      onVerify={(token) => {
                        setTurnstileToken(token);
                        setError(null);
                      }}
                      onExpire={() => setTurnstileToken('')}
                    />
                  </div>
                )}

                {error && (
                  <p role="alert" className="text-xs font-medium text-rose-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#0A0A0B] rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {loading
                    ? 'Sending 6-Digit Code...'
                    : mode === 'login'
                      ? 'Sign In'
                      : mode === 'register'
                        ? 'Create Account'
                        : 'Claim Super Admin'}
                </button>

                {mode !== 'bootstrap' && (
                  <p className="text-[11px] text-center text-neutral-500">
                    We&apos;ll send a 6-digit verification code to your email to confirm.
                  </p>
                )}
              </form>

              {/* 4 Social / Identity Providers below Email/Password + Cloudflare */}
              {mode !== 'bootstrap' && (
                <div className="mt-6 pt-6 border-t border-black/[0.08]">
                  <div className="relative flex items-center justify-center mb-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Or continue with
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {oauthButtons.map((provider) => {
                      const isBusy = oauthLoading === provider.id;
                      return (
                        <button
                          key={provider.id}
                          type="button"
                          disabled={oauthLoading !== null}
                          onClick={() => void handleOAuthLogin(provider.id)}
                          className="flex items-center justify-center gap-2.5 py-2.5 px-3.5 rounded-lg bg-[#F8F8FA] border border-black/[0.12] hover:bg-white hover:border-black/30 text-xs font-semibold text-[#0A0A0B] transition-colors cursor-pointer disabled:opacity-60"
                        >
                          {provider.icon}
                          <span>{isBusy ? 'Connecting...' : provider.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {oauthInfo && (
                    <div className="mt-4 rounded-xl bg-neutral-100 border border-black/[0.08] p-3.5 text-xs text-neutral-700 space-y-1.5">
                      <div className="font-semibold text-[#0A0A0B]">
                        {oauthInfo.label} OAuth requires provider credentials
                      </div>
                      <p className="text-[11px] leading-relaxed text-neutral-600">
                        Set{' '}
                        <span className="font-mono font-semibold text-[#0A0A0B]">
                          {oauthInfo.requiredEnvVars.join(' & ')}
                        </span>{' '}
                        and register this callback URL in your {oauthInfo.label} developer portal:
                      </p>
                      <div className="rounded-md bg-white border border-black/[0.08] px-2.5 py-1.5 font-mono text-[11px] text-[#0A0A0B] break-all select-all">
                        {oauthInfo.callbackUrl}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleOtpVerify} className="p-7 md:p-8 space-y-5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setError(null);
                    setNotice(null);
                    resetTurnstile();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-[#0A0A0B] cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <span className="text-[11px] font-mono font-medium text-neutral-500">
                  6-Digit Email Verification
                </span>
              </div>

              <div className="rounded-xl bg-[#F8F8FA] border border-black/[0.08] p-4 flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#0A0A0B] shrink-0 mt-0.5" />
                <div className="text-xs text-neutral-700 leading-relaxed">
                  Enter the 6-digit verification code for{' '}
                  <span className="font-semibold text-[#0A0A0B]">{challengeEmail}</span> to{' '}
                  {otpPurpose === 'register' ? 'finish creating your account' : 'complete sign-in'}.
                </div>
              </div>

              {deliveryMode === 'preview' && codePreview && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Email Preview Code</span>
                      <span className="font-mono text-sm font-bold tracking-widest">
                        {codePreview}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpDigits(codePreview.split('').slice(0, 6))}
                    className="px-3 py-1.5 rounded-lg bg-[#0A0A0B] text-white text-[11px] font-semibold hover:bg-neutral-800 cursor-pointer shrink-0"
                  >
                    Fill Code
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0A0A0B] mb-2.5 text-center">
                  6-Digit Security Code
                </label>
                <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      maxLength={6}
                      aria-label={`Verification digit ${index + 1}`}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="h-12 sm:h-14 w-full rounded-lg bg-[#F8F8FA] border border-black/[0.15] text-center font-mono text-lg sm:text-xl font-bold text-[#0A0A0B] focus:outline-none focus:border-black focus:bg-white transition-colors"
                    />
                  ))}
                </div>
              </div>

              {mfaRequired && (
                <div className="rounded-xl bg-[#F8F8FA] border border-black/[0.12] p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0A0A0B]">
                    <KeyRound className="w-4 h-4 text-[#0A0A0B]" />
                    <span>Authenticator MFA Verification</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter 6-digit TOTP or XXXX-XXXX backup code"
                    value={totpInput}
                    onChange={(e) => setTotpInput(e.target.value)}
                    className="w-full rounded-lg bg-white border border-black/[0.15] px-3 py-2 text-sm font-mono text-[#0A0A0B] focus:outline-none focus:border-black"
                  />
                </div>
              )}

              {notice && !codePreview && (
                <p className="text-xs font-medium text-emerald-700 text-center">{notice}</p>
              )}

              {error && (
                <p role="alert" className="text-xs font-medium text-rose-700 text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || otpDigits.join('').length !== 6}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#0A0A0B] rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-60"
              >
                {loading
                  ? 'Verifying Code...'
                  : otpPurpose === 'register'
                    ? 'Verify & Create Account'
                    : 'Verify & Sign In'}
              </button>

              <div className="flex items-center justify-center pt-1">
                <button
                  type="button"
                  disabled={loading || resendCooldown > 0}
                  onClick={() => void handleResendOtp()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-[#0A0A0B] disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : 'Resend 6-digit code'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </Surface3D>
      </div>
    </div>
  );
}
