import { CheckCircle2, Copy, DollarSign, Handshake, Loader2, Users } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ApiError, apiRequest } from '../lib/api';
import { PageRoute } from '../types/navigation';

interface PartnerRecord {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  website: string;
  referral_code: string;
  commission_rate: number;
  status: string;
  created_at: string;
}

interface ReferralRecord {
  id: string;
  referred_email: string;
  amount_usd: number;
  commission_usd: number;
  status: string;
  created_at: string;
}

interface PartnersPageProps {
  onNavigate: (route: PageRoute) => void;
}

export function PartnersPage({ onNavigate }: PartnersPageProps) {
  const { user } = useAppContext();
  const [partner, setPartner] = useState<PartnerRecord | null>(null);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loadingMe, setLoadingMe] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [website, setWebsite] = useState('');
  const [audienceSummary, setAudienceSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPartner, setCreatedPartner] = useState<PartnerRecord | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setContactName((p) => p || user.name);
      setEmail((p) => p || user.email);
    }
  }, [user]);

  const loadPartner = useCallback(async () => {
    if (!user) {
      setPartner(null);
      setReferrals([]);
      return;
    }
    setLoadingMe(true);
    try {
      const res = await apiRequest<{ partner: PartnerRecord | null; referrals: ReferralRecord[] }>(
        '/api/partners/me',
      );
      setPartner(res.partner);
      setReferrals(res.referrals || []);
    } catch {
      // ignore
    } finally {
      setLoadingMe(false);
    }
  }, [user]);

  useEffect(() => {
    void loadPartner();
  }, [loadPartner]);

  const handleApply = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiRequest<{ partner: PartnerRecord }>('/api/partners/apply', {
        method: 'POST',
        body: JSON.stringify({
          companyName,
          contactName,
          email,
          website,
          audienceSummary,
        }),
      });
      setCreatedPartner(res.partner);
      await loadPartner();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to submit partner application.');
    } finally {
      setSubmitting(false);
    }
  };

  const activePartner = partner || createdPartner;

  return (
    <div className="bg-black text-white">
      <section className="relative overflow-hidden helzerx-hero-aura pt-20 pb-24 md:pt-28 md:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[440px] left-1/2 -translate-x-1/2 w-[165%] h-[540px] rounded-[100%] bg-black border-t border-violet-300/40 shadow-[0_-20px_80px_rgba(167,139,250,0.35)]"
        />

        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs md:text-sm font-medium text-violet-200/85 mb-6">
            <span>HelzerX Partners</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Affiliates &amp; Resellers</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>15%+ Commission</span>
          </div>

          <h1 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-extrabold tracking-[-0.03em] leading-[1.04] text-white max-w-[18ch] mx-auto">
            Business Partnership Program
          </h1>
          <p className="mt-6 max-w-[58ch] mx-auto text-base md:text-lg leading-[1.6] text-neutral-200/90">
            Partner with HelzerX Technologies to earn recurring revenue on Cloud clusters, Shop
            hardware procurement, and Studio engineering contracts.
          </p>
        </div>
      </section>

      <section className="bg-black py-16 md:py-24">
        <div className="max-w-[1160px] mx-auto px-6 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-7">
              <DollarSign className="w-5 h-5 text-cyan-300" />
              <h2 className="mt-4 text-lg font-bold text-white">15% Recurring Share</h2>
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                Tracked attribution across Cloud server renewals, Shop invoices, and Studio retainers.
              </p>
            </div>
            <div className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-7">
              <Handshake className="w-5 h-5 text-violet-300" />
              <h2 className="mt-4 text-lg font-bold text-white">Co-Engineered Deals</h2>
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                Joint architectural proposals with HelzerX solution engineers for enterprise leads.
              </p>
            </div>
            <div className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-7">
              <Users className="w-5 h-5 text-blue-300" />
              <h2 className="mt-4 text-lg font-bold text-white">Dedicated Partner Portal</h2>
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                Manage your unique referral code, commission rate, and live payout status online.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 items-start">
            {/* Partner Application Form */}
            <div className="rounded-2xl bg-[#08080F] border border-white/[0.12] p-7 md:p-8">
              <div className="text-xs font-mono text-cyan-300">PARTNER APPLICATION</div>
              <h2 className="mt-2 text-2xl font-bold text-white">Apply to Join the Partner Network</h2>
              <p className="mt-2 text-xs text-neutral-400">
                Submitting creates a tracked application and issues your unique referral identifier.
              </p>

              {createdPartner ? (
                <div className="mt-6 rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-5 space-y-3 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Partner Application Recorded</span>
                  </div>
                  <p className="text-neutral-200">
                    Company: <strong>{createdPartner.company_name}</strong> · Status:{' '}
                    <span className="font-mono text-cyan-300">{createdPartner.status}</span>
                  </p>
                  <p className="font-mono text-violet-300">
                    Assigned Referral Code: {createdPartner.referral_code}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleApply} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Company / Brand Name
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="HelzerX Agency Partner"
                        className="w-full rounded-lg bg-black border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Jordan Taylor"
                        className="w-full rounded-lg bg-black border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Business Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="partners@company.com"
                        className="w-full rounded-lg bg-black border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Website URL (optional)
                      </label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://company.com"
                        className="w-full rounded-lg bg-black border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Audience &amp; Partnership Overview
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={audienceSummary}
                      onChange={(e) => setAudienceSummary(e.target.value)}
                      placeholder="Describe your client base, hosting volume, or agency services..."
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400 resize-y"
                    />
                  </div>

                  {error && (
                    <p role="alert" className="text-xs text-rose-400 font-medium">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Submit Partner Application</span>
                  </button>
                </form>
              )}
            </div>

            {/* Partner Dashboard */}
            <div className="rounded-2xl bg-[#08080C] border border-white/[0.12] p-7 md:p-8 space-y-5">
              <div className="pb-4 border-b border-white/[0.08]">
                <div className="text-xs font-mono text-violet-300">PARTNER PORTAL</div>
                <h2 className="mt-1 text-xl font-bold text-white">Your Referral Telemetry</h2>
              </div>

              {loadingMe ? (
                <div className="py-10 flex items-center justify-center gap-2 text-xs text-neutral-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading partner profile...</span>
                </div>
              ) : !user ? (
                <div className="py-8 text-center space-y-3">
                  <p className="text-xs text-neutral-400">
                    Sign in with your applicant email to inspect referral earnings and approval status.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('auth')}
                    className="px-5 py-2 text-xs font-semibold text-black bg-white rounded-lg cursor-pointer"
                  >
                    Sign In to Partner Portal
                  </button>
                </div>
              ) : !activePartner ? (
                <p className="py-8 text-center text-xs text-neutral-400">
                  No partner record found for <span className="font-mono text-white">{user.email}</span>.
                  Submit an application on the left to generate your referral code.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-black/60 border border-white/[0.08] p-4">
                      <div className="text-[11px] text-neutral-400">Approval Status</div>
                      <div className="mt-1 font-mono text-sm font-bold text-cyan-300 uppercase">
                        {activePartner.status}
                      </div>
                    </div>
                    <div className="rounded-xl bg-black/60 border border-white/[0.08] p-4">
                      <div className="text-[11px] text-neutral-400">Commission Rate</div>
                      <div className="mt-1 font-mono text-sm font-bold text-white tabular-nums">
                        {activePartner.commission_rate}%
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/60 border border-white/[0.08] p-4 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-neutral-400">Referral Code</div>
                      <div className="mt-0.5 font-mono text-base font-bold text-violet-300">
                        {activePartner.referral_code}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(activePartner.referral_code);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1800);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/15 rounded-lg text-neutral-200 hover:bg-white/10 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-neutral-300 mb-2">
                      Attributed Referrals ({referrals.length})
                    </h3>
                    {referrals.length === 0 ? (
                      <p className="text-xs text-neutral-500">
                        No completed referrals recorded yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {referrals.map((ref) => (
                          <div
                            key={ref.id}
                            className="flex items-center justify-between text-xs rounded-lg bg-black/50 border border-white/[0.06] px-3 py-2"
                          >
                            <span className="font-mono text-neutral-200">{ref.referred_email}</span>
                            <span className="font-mono text-emerald-300 tabular-nums">
                              +${ref.commission_usd.toFixed(2)} ({ref.status})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
