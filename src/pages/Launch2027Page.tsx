import { CheckCircle2, Clock, Server, ShieldCheck } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Surface3D } from '../components/Surface3D';
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
    <div className="bg-[#F4F4F5] text-[#0A0A0B]">
      <section className="relative overflow-hidden helzerx-studio-hero pt-16 pb-24 md:pt-24 md:pb-28 border-b border-black/[0.06]">
        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs font-medium text-neutral-600 mb-5">
            <span className="font-semibold text-[#0A0A0B]">HelzerX Official Launch</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>January 1, 2027</span>
          </div>
          <h1 className="text-[clamp(2.8rem,6.5vw,5rem)] font-extrabold tracking-[-0.045em] leading-[0.96] helzerx-dotted-text max-w-[14ch] mx-auto pb-2">
            01.01.2027 launch.
          </h1>
          <p className="mt-5 max-w-[60ch] mx-auto text-base md:text-lg text-neutral-600 leading-relaxed">
            The first 50 eligible, email-verified users who register before launch receive an 8GB
            RAM launch server allocation.
          </p>

          {/* Sculptural Matte-Black 3D Countdown Blocks */}
          <div className="mt-10 grid grid-cols-4 gap-3 sm:gap-5 max-w-[560px] mx-auto">
            {[
              ['Days', countdown.days],
              ['Hours', countdown.hours],
              ['Minutes', countdown.minutes],
              ['Seconds', countdown.seconds],
            ].map(([label, val], idx) => (
              <Surface3D key={String(label)} variant="dark" intensity={14} delay={idx * 0.05}>
                <div className="py-5 px-2 text-center">
                  <div className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white tabular-nums">
                    {String(val).padStart(2, '0')}
                  </div>
                  <div className="mt-1 text-[11px] text-neutral-400 font-medium">{label}</div>
                </div>
              </Surface3D>
            ))}
          </div>
        </div>
      </section>

      {/* Campaign Live Stats + Early Access Registration */}
      <section className="bg-[#F4F4F5] py-16 md:py-24">
        <div className="max-w-[1160px] mx-auto px-6">
          {/* Live Database Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14">
            <Surface3D intensity={13} delay={0.04}>
              <div className="p-7 h-full">
                <div className="text-xs font-semibold text-neutral-600">Live Pre-Orders</div>
                <div className="mt-2 text-3xl font-extrabold tracking-tight text-[#0A0A0B] tabular-nums">
                  {status?.totalPreorders ?? 0}
                </div>
                <p className="mt-2 text-xs text-neutral-600">
                  Connected directly to persistent Shop &amp; pre-launch order records.
                </p>
              </div>
            </Surface3D>

            <Surface3D intensity={13} delay={0.1}>
              <div className="p-7 h-full">
                <div className="text-xs font-semibold text-neutral-600">
                  Qualified 8GB RAM Slots
                </div>
                <div className="mt-2 text-3xl font-extrabold tracking-tight text-[#0A0A0B] tabular-nums">
                  {status?.qualifiedCount ?? 0} / {status?.earlyAccessLimit ?? 50}
                </div>
                <p className="mt-2 text-xs text-neutral-600">
                  Requires pre-launch registration, accepted Terms, and verified email.
                </p>
              </div>
            </Surface3D>

            <Surface3D intensity={13} delay={0.16}>
              <div className="p-7 h-full">
                <div className="text-xs font-semibold text-neutral-600">
                  Remaining First-50 Spots
                </div>
                <div className="mt-2 text-3xl font-extrabold tracking-tight text-[#0A0A0B] tabular-nums">
                  {status?.spotsRemaining ?? 50}
                </div>
                <p className="mt-2 text-xs text-neutral-600">
                  {status?.totalRegistrations ?? 0} total registrations submitted in queue.
                </p>
              </div>
            </Surface3D>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-10 items-start">
            {/* Eligibility Rules */}
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-[#0A0A0B] tracking-tight">
                Early Access &amp; Eligibility Verification
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                HelzerX never grants unverified promotion claims automatically. Eligibility is
                evaluated strictly against database records:
              </p>

              <div className="space-y-4">
                <Surface3D intensity={16} delay={0.04}>
                  <div className="p-6 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#111114] text-white flex items-center justify-center shrink-0 shadow-[0_8px_16px_rgba(10,10,11,0.2)]">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0A0A0B]">
                        Verified Account Identity
                      </h3>
                      <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
                        Your HelzerX account email must be verified before Launch Day.
                        Unverified registrations remain pending verification until confirmed.
                      </p>
                    </div>
                  </div>
                </Surface3D>

                <Surface3D intensity={16} delay={0.09}>
                  <div className="p-6 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#111114] text-white flex items-center justify-center shrink-0 shadow-[0_8px_16px_rgba(10,10,11,0.2)]">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0A0A0B]">
                        Pre-Launch Timestamp
                      </h3>
                      <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
                        Registration must occur before January 1, 2027 (00:00 UTC) and accept the
                        Terms of Service.
                      </p>
                    </div>
                  </div>
                </Surface3D>

                <Surface3D intensity={16} delay={0.14}>
                  <div className="p-6 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#111114] text-white flex items-center justify-center shrink-0 shadow-[0_8px_16px_rgba(10,10,11,0.2)]">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0A0A0B]">
                        First 50 Qualified Cap
                      </h3>
                      <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
                        Qualified slots #1 through #50 receive an 8GB RAM launch server allocation;
                        additional verified users join the priority waitlist.
                      </p>
                    </div>
                  </div>
                </Surface3D>
              </div>

              {status?.myRegistration && (
                <Surface3D variant="dark" intensity={8}>
                  <div className="p-6">
                    <div className="text-xs font-semibold text-neutral-300">
                      Your Registration Status
                    </div>
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
                </Surface3D>
              )}
            </div>

            {/* Registration Form */}
            <Surface3D intensity={6}>
              <form onSubmit={handleRegister} className="p-7 space-y-5">
                <h3 className="text-lg font-bold text-[#0A0A0B]">Register for Early Access</h3>

                <div>
                  <label
                    htmlFor="ea-name"
                    className="block text-xs font-semibold text-[#0A0A0B] mb-1.5"
                  >
                    Full name
                  </label>
                  <input
                    id="ea-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ea-email"
                    className="block text-xs font-semibold text-[#0A0A0B] mb-1.5"
                  >
                    Account email
                  </label>
                  <input
                    id="ea-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ea-use"
                    className="block text-xs font-semibold text-[#0A0A0B] mb-1.5"
                  >
                    Intended 8GB RAM server workload
                  </label>
                  <textarea
                    id="ea-use"
                    rows={3}
                    required
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                    placeholder="e.g. Paper Minecraft community, Proxmox LXC staging API..."
                    className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                  />
                </div>

                <label className="flex items-start gap-2.5 text-xs text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 rounded border-black/30"
                  />
                  <span>
                    I accept the{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('terms')}
                      className="underline font-semibold text-[#0A0A0B] cursor-pointer"
                    >
                      Terms of Service
                    </button>{' '}
                    and understand email verification is required for eligibility.
                  </span>
                </label>

                {error && (
                  <p role="alert" className="text-xs font-medium text-rose-700">
                    {error}
                  </p>
                )}

                {resultMsg && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{resultMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#0A0A0B] rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {loading ? 'Checking Eligibility...' : 'Submit Early Access Registration'}
                </button>
              </form>
            </Surface3D>
          </div>
        </div>
      </section>
    </div>
  );
}
