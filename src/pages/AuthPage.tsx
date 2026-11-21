import { CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useAppContext, type AuthUser } from '../context/AppContext';
import { apiRequest } from '../lib/api';
import { PageRoute } from '../types/navigation';

interface AuthPageProps {
  onNavigate: (route: PageRoute) => void;
}

type AuthMode = 'login' | 'register' | 'verify' | 'reset' | 'bootstrap';

export function AuthPage({ onNavigate }: AuthPageProps) {
  const { setSession } = useAppContext();
  const [mode, setMode] = useState<AuthMode>('login');
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [passcodeRequired, setPasscodeRequired] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewToken, setPreviewToken] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ needsBootstrap: boolean; passcodeConfigured: boolean }>('/api/auth/bootstrap-status')
      .then((res) => {
        setNeedsBootstrap(res.needsBootstrap);
        setPasscodeRequired(res.passcodeConfigured);
      })
      .catch(() => {
        // ignore
      });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    setPreviewToken(null);

    try {
      if (mode === 'login') {
        const res = await apiRequest<{ token: string; user: AuthUser }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setSession(res.token, res.user);
        onNavigate(
          res.user.role === 'super_admin' || res.user.role === 'admin' ? 'admin' : 'dashboard',
        );
      } else if (mode === 'register') {
        const res = await apiRequest<{
          token: string;
          user: AuthUser;
          verificationTokenPreview?: string;
        }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        });
        setSession(res.token, res.user);
        if (res.verificationTokenPreview) {
          setPreviewToken(res.verificationTokenPreview);
          setNotice(
            `Account created! Copy your verification token (${res.verificationTokenPreview}) and verify your email in the Verify tab or Security Settings.`,
          );
        } else {
          onNavigate('dashboard');
        }
      } else if (mode === 'bootstrap') {
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
      } else if (mode === 'verify') {
        const res = await apiRequest<{ message: string }>('/api/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token: tokenInput }),
        });
        setNotice(res.message);
      } else if (mode === 'reset') {
        if (!tokenInput) {
          const res = await apiRequest<{ message: string; resetTokenPreview?: string }>(
            '/api/auth/request-reset',
            {
              method: 'POST',
              body: JSON.stringify({ email }),
            },
          );
          setNotice(res.message);
          if (res.resetTokenPreview) {
            setPreviewToken(res.resetTokenPreview);
            setTokenInput(res.resetTokenPreview);
          }
        } else {
          const res = await apiRequest<{ message: string }>('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token: tokenInput, newPassword }),
          });
          setNotice(res.message);
          setMode('login');
          setTokenInput('');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black text-white py-16 md:py-24 px-6">
      <div className="max-w-[520px] mx-auto">
        <div className="text-center mb-8">
          <div className="text-xs font-mono text-violet-300">HELZERX UNIFIED IDENTITY</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            {mode === 'login' && 'Sign in to HelzerX'}
            {mode === 'register' && 'Create your HelzerX Account'}
            {mode === 'bootstrap' && 'Claim First-Run Super Admin'}
            {mode === 'verify' && 'Verify Email Address'}
            {mode === 'reset' && 'Reset Account Password'}
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            One account across Cloud, Studio, Shop, Partners, and Support Center.
          </p>
        </div>

        {/* First-Run Super Admin Bootstrap Alert */}
        {needsBootstrap && mode !== 'bootstrap' && (
          <div className="mb-6 rounded-2xl bg-violet-500/10 border border-violet-400/35 p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-violet-300 shrink-0 mt-0.5" />
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
              onClick={() => {
                setMode('bootstrap');
                setError(null);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Claim Admin
            </button>
          </div>
        )}

        {/* Mode Tabs */}
        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.1] mb-6">
          {(
            [
              ['login', 'Login'],
              ['register', 'Register'],
              ['verify', 'Verify Email'],
              ['reset', 'Reset Password'],
            ] as [AuthMode, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
                setNotice(null);
              }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                mode === m ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-[#090A12] border border-white/[0.12] p-7 space-y-5"
        >
          {(mode === 'register' || mode === 'bootstrap') && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-medium text-neutral-300 mb-1.5">
                Full name
              </label>
              <input
                id="auth-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-lg bg-black/60 border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'bootstrap' || mode === 'reset') && (
            <div>
              <label htmlFor="auth-email" className="block text-xs font-medium text-neutral-300 mb-1.5">
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full rounded-lg bg-black/60 border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'bootstrap') && (
            <div>
              <label htmlFor="auth-pass" className="block text-xs font-medium text-neutral-300 mb-1.5">
                Password {mode !== 'login' ? '(min 8 characters)' : ''}
              </label>
              <input
                id="auth-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg bg-black/60 border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
              />
            </div>
          )}

          {mode === 'bootstrap' && passcodeRequired && (
            <div>
              <label htmlFor="auth-passcode" className="block text-xs font-medium text-neutral-300 mb-1.5">
                Admin Setup Passcode (HELZERX_ADMIN_PASSCODE)
              </label>
              <input
                id="auth-passcode"
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full rounded-lg bg-black/60 border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
              />
            </div>
          )}

          {(mode === 'verify' || mode === 'reset') && (
            <div>
              <label htmlFor="auth-token" className="block text-xs font-medium text-neutral-300 mb-1.5">
                {mode === 'verify' ? 'Verification Token' : 'Reset Token (leave empty to request)'}
              </label>
              <input
                id="auth-token"
                type="text"
                required={mode === 'verify'}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste token here"
                className="w-full rounded-lg bg-black/60 border border-white/[0.12] px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-violet-400"
              />
            </div>
          )}

          {mode === 'reset' && tokenInput && (
            <div>
              <label htmlFor="auth-newpass" className="block text-xs font-medium text-neutral-300 mb-1.5">
                New Password (min 8 characters)
              </label>
              <input
                id="auth-newpass"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg bg-black/60 border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
              />
            </div>
          )}

          {error && (
            <p role="alert" className="text-xs font-medium text-rose-400">
              {error}
            </p>
          )}

          {notice && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-3.5 text-xs text-emerald-200 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <span>{notice}</span>
              </div>
              {previewToken && mode === 'register' && (
                <button
                  type="button"
                  onClick={() => {
                    setTokenInput(previewToken);
                    setMode('verify');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black font-semibold cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Verify Email Now</span>
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-sm font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-60"
          >
            {loading
              ? 'Processing...'
              : mode === 'login'
                ? 'Sign In'
                : mode === 'register'
                  ? 'Create Account'
                  : mode === 'bootstrap'
                    ? 'Claim Super Admin'
                    : mode === 'verify'
                      ? 'Verify Email'
                      : tokenInput
                        ? 'Update Password'
                        : 'Generate Reset Token'}
          </button>
        </form>
      </div>
    </div>
  );
}
