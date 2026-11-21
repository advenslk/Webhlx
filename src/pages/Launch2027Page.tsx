import { CheckCircle2, Clock, Server, ShieldCheck } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { apiRequest } from '../lib/api';
import { PageRoute } from '../types/navigation';

interface LaunchStatusResponse {
  launchDate: string;
  basePreorders: number;
  totalPreorders: number;
  earlyAccessLimit: number;
  qualifiedCount: number;
  totalRegistrations: number;
  spotsRemaining: number;
  announcementText: string;
  myRegistration: {
    id: string;
    full_name: string;
    email: string;
    eligibility_status: string;
    slot_number: number | null;
    email_verified: number;
    created_at: string;
  } | null;
}

interface Launch2027PageProps {
  onNavigate: (route: PageRoute) => void;
}

export function Launch2027Page({ onNavigate }: Launch2027PageProps) {
  const { user, refreshSiteData } = useAppContext();
  const [status, setStatus] = useState<LaunchStatusResponse | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [useCase, setUseCase] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      const data = await apiRequest<LaunchStatusResponse>('/api/launch/status');
      setStatus(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void loadStatus();
  }, [user]);

  useEffect(() => {
    if (user) {
      setFullName((prev) => prev || user.name);
      setEmail((prev) => prev || user.email);
    }
  }, [user]);

  useEffect(() => {
    const target = new Date(status?.launchDate || '2027-01-01T00:00:00Z').getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [status?.launchDate]);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResultMsg(null);
    try {
      const res = await apiRequest<{ message: string }>('/api/launch/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, useCase, acceptedTerms }),
      });
      setResultMsg(res.message);
      await loadStatus();
      await refreshSiteData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black text-white">
      <section className="relative overflow-hidden helzerx-hero-aura pt-20 pb-28 md:pt-28 md:pb-36">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[440px] left-1/2 -translate-x-1/2 w-[165%] h-[540px] rounded-[100%] bg-black border-t border-violet-300/40 shadow-[0_-20px_80px_rgba(167,139,250,0.38)]"
        />

        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs font-mono text-cyan-300 mb-5">
            HELZERX OFFICIAL LAUNCH · JANUARY 1, 2027
          </div>
          <h1 className="text-[clamp(2.5rem,5.5vw,4.3rem)] font-extrabold tracking-[-0.03em] leading-[1.03] text-white max-w-[16ch] mx-auto">
            01.01.2027 Global Release
          </h1>
          <p className="mt-5 max-w-[60ch] mx-auto text-base md:text-lg text-neutral-200/90 leading-relaxed">
            The first 50 eligible, email-verified users who register before launch receive an 8GB
            RAM launch server allocation.
          </p>

          {/* Live Countdown */}
          <div className="mt-10 grid grid-cols-4 gap-3 sm:gap-5 max-w-[540px] mx-auto">
            {[
              ['Days', countdown.days],
              ['Hours', countdown.hours],
              ['Minutes', countdown.minutes],
              ['Seconds', countdown.seconds],
            ].map(([label, val]) => (
              <div
                key={String(label)}
                className="rounded-2xl bg-black/70 border border-white/[0.14] py-4 px-2 backdrop-blur-md"
              >
                <div className="font-mono text-2xl sm:text-4xl font-bold text-white tabular-nums">
                  {String(val).padStart(2, '0')}
                </div>
                <div className="mt-1 text-[11px] text-neutral-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Campaign Live Stats + Early Access Registration */}
      <section className="bg-black py-16 md:py-24">
        <div className="max-w-[1160px] mx-auto px-6">
          {/* Live Database Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14">
            <div className="rounded-2xl bg-[#080910] border border-white/[0.1] p-7">
              <div className="text-xs text-neutral-400">Live Pre-Orders</div>
              <div className="mt-2 font-mono text-3xl font-bold text-white tabular-nums">
                {status?.totalPreorders ?? 0}
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Connected directly to persistent Shop &amp; pre-launch order records.
              </p>
            </div>

            <div className="rounded-2xl bg-[#080910] border border-white/[0.1] p-7">
              <div className="text-xs text-neutral-400">Qualified 8GB RAM Slots</div>
              <div className="mt-2 font-mono text-3xl font-bold text-violet-300 tabular-nums">
                {status?.qualifiedCount ?? 0} / {status?.earlyAccessLimit ?? 50}
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Requires pre-launch registration, accepted Terms, and verified email.
              </p>
            </div>

            <div className="rounded-2xl bg-[#080910] border border-white/[0.1] p-7">
              <div className="text-xs text-neutral-400">Remaining First-50 Spots</div>
              <div className="mt-2 font-mono text-3xl font-bold text-cyan-300 tabular-nums">
                {status?.spotsRemaining ?? 50}
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                {status?.totalRegistrations ?? 0} total registrations submitted in queue.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-10 items-start">
            {/* Eligibility Rules */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">
                Early Access &amp; Eligibility Verification
              </h2>
              <p className="text-sm text-neutral-300 leading-relaxed">
                HelzerX never grants unverified promotion claims automatically. Eligibility is
                evaluated strictly against database records:
              </p>

              <div className="space-y-4">
                <div className="rounded-2xl bg-[#080910] border border-white/[0.1] p-6 flex items-start gap-4">
                  <ShieldCheck className="w-5 h-5 text-violet-300 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-white">1. Verified Account Identity</h3>
                    <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                      Your HelzerX account email must be verified (`email_verified = 1`).
                      Unverified registrations remain in `pending_verification` until confirmed.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#080910] border border-white/[0.1] p-6 flex items-start gap-4">
                  <Clock className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-white">2. Pre-Launch Timestamp</h3>
                    <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                      Registration must occur before January 1, 2027 (00:00 UTC) and accept the
                      Terms of Service.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#080910] border border-white/[0.1] p-6 flex items-start gap-4">
                  <Server className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-white">3. First 50 Qualified Cap</h3>
                    <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                      Qualified slots #1 through #50 receive an 8GB RAM launch server allocation;
                      additional verified users join the priority waitlist.
                    </p>
                  </div>
                </div>
              </div>

              {status?.myRegistration && (
                <div className="rounded-2xl bg-violet-500/10 border border-violet-400/35 p-6">
                  <div className="text-xs font-mono text-violet-300">YOUR REGISTRATION STATUS</div>
                  <div className="mt-2 text-lg font-bold text-white capitalize">
                    {status.myRegistration.eligibility_status.replace(/_/g, ' ')}
                    {status.myRegistration.slot_number
                      ? ` · Slot #${status.myRegistration.slot_number}`
                      : ''}
                  </div>
                  <p className="mt-1 text-xs text-neutral-300">
                    Registered as {status.myRegistration.email}.{' '}
                    {status.myRegistration.email_verified === 0 && (
                      <button
                        type="button"
                        onClick={() => onNavigate('auth')}
                        className="underline text-white font-semibold cursor-pointer"
                      >
                        Verify your email to finalize qualification.
                      </button>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Registration Form */}
            <form
              onSubmit={handleRegister}
              className="rounded-2xl bg-[#090A12] border border-white/[0.12] p-7 space-y-5"
            >
              <h3 className="text-lg font-bold text-white">Register for Early Access</h3>

              <div>
                <label htmlFor="ea-name" className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Full name
                </label>
                <input
                  id="ea-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg bg-black/60 border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label htmlFor="ea-email" className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Account email
                </label>
                <input
                  id="ea-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg bg-black/60 border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label htmlFor="ea-use" className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Intended 8GB RAM server workload
                </label>
                <textarea
                  id="ea-use"
                  rows={3}
                  required
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  placeholder="e.g. Paper Minecraft community, Proxmox LXC staging API..."
                  className="w-full rounded-lg bg-black/60 border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
                />
              </div>

              <label className="flex items-start gap-2.5 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-white/25"
                />
                <span>
                  I accept the{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('terms')}
                    className="underline text-white cursor-pointer"
                  >
                    Terms of Service
                  </button>{' '}
                  and understand email verification is required for eligibility.
                </span>
              </label>

              {error && (
                <p role="alert" className="text-xs font-medium text-rose-400">
                  {error}
                </p>
              )}

              {resultMsg && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-3.5 text-xs text-emerald-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{resultMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 text-sm font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Checking Eligibility...' : 'Submit Early Access Registration'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
