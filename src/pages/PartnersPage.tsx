import { CheckCircle2, Copy, DollarSign, Handshake, Loader2, Users } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Surface3D } from '../components/Surface3D';
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
    <div className="bg-[#F4F4F5] text-[#0A0A0B]">
      <section className="relative overflow-hidden helzerx-studio-hero pt-16 pb-20 md:pt-24 md:pb-24 border-b border-black/[0.06]">
        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs font-medium text-neutral-600 mb-6">
            <span className="font-semibold text-[#0A0A0B]">HelzerX Partners</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>Affiliates &amp; Resellers</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>15%+ Commission</span>
          </div>

          <h1 className="text-[clamp(2.6rem,6vw,4.75rem)] font-extrabold tracking-[-0.04em] leading-[0.98] helzerx-dotted-text max-w-[16ch] mx-auto pb-2">
            partner network.
          </h1>
          <p className="mt-6 max-w-[58ch] mx-auto text-base md:text-lg leading-[1.65] text-neutral-600">
            Partner with HelzerX Technologies to earn recurring revenue on Cloud clusters, Shop
            hardware procurement, and Studio engineering contracts.
          </p>
        </div>
      </section>

      <section className="bg-[#F4F4F5] py-16 md:py-24">
        <div className="max-w-[1160px] mx-auto px-6 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Surface3D intensity={13} delay={0.04}>
              <div className="p-7 h-full">
                <div className="w-11 h-11 rounded-2xl bg-[#111114] text-white flex items-center justify-center shadow-[0_10px_20px_rgba(10,10,11,0.22)]">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h2 className="mt-5 text-lg font-bold text-[#0A0A0B]">15% Recurring Share</h2>
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                  Tracked attribution across Cloud server renewals, Shop invoices, and Studio
                  retainers.
                </p>
              </div>
            </Surface3D>
            <Surface3D intensity={13} delay={0.1}>
              <div className="p-7 h-full">
                <div className="w-11 h-11 rounded-2xl bg-[#111114] text-white flex items-center justify-center shadow-[0_10px_20px_rgba(10,10,11,0.22)]">
                  <Handshake className="w-5 h-5" />
                </div>
                <h2 className="mt-5 text-lg font-bold text-[#0A0A0B]">Co-Engineered Deals</h2>
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                  Joint architectural proposals with HelzerX solution engineers for enterprise leads.
                </p>
              </div>
            </Surface3D>
            <Surface3D intensity={13} delay={0.16}>
              <div className="p-7 h-full">
                <div className="w-11 h-11 rounded-2xl bg-[#111114] text-white flex items-center justify-center shadow-[0_10px_20px_rgba(10,10,11,0.22)]">
                  <Users className="w-5 h-5" />
                </div>
                <h2 className="mt-5 text-lg font-bold text-[#0A0A0B]">Dedicated Partner Portal</h2>
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                  Manage your unique referral code, commission rate, and live payout status online.
                </p>
              </div>
            </Surface3D>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 items-start">
            {/* Partner Application Form */}
            <Surface3D intensity={6} delay={0.04}>
              <div className="p-7 md:p-8">
                <div className="text-xs font-semibold text-neutral-500">Partner Application</div>
                <h2 className="mt-1.5 text-2xl font-bold text-[#0A0A0B]">
                  Apply to Join the Partner Network
                </h2>
                <p className="mt-2 text-xs text-neutral-600">
                  Submitting creates a tracked application and issues your unique referral identifier.
                </p>

                {createdPartner ? (
                  <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-5 space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-bold text-emerald-700 text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Partner Application Recorded</span>
                    </div>
                    <p className="text-neutral-700">
                      Company: <strong>{createdPartner.company_name}</strong> · Status:{' '}
                      <span className="font-bold capitalize text-[#0A0A0B]">
                        {createdPartner.status}
                      </span>
                    </p>
                    <p className="font-bold text-[#0A0A0B]">
                      Assigned Referral Code: {createdPartner.referral_code}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleApply} className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                          Company / Brand Name
                        </label>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="HelzerX Agency Partner"
                          className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                          Contact Name
                        </label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Jordan Taylor"
                          className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                          Business Email
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="partners@company.com"
                          className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                          Website URL (optional)
                        </label>
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://company.com"
                          className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                        Audience &amp; Partnership Overview
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={audienceSummary}
                        onChange={(e) => setAudienceSummary(e.target.value)}
                        placeholder="Describe your client base, hosting volume, or agency services..."
                        className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black resize-y"
                      />
                    </div>

                    {error && (
                      <p role="alert" className="text-xs text-rose-700 font-medium">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg hover:bg-neutral-800 disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>Submit Partner Application</span>
                    </button>
                  </form>
                )}
              </div>
            </Surface3D>

            {/* Partner Dashboard */}
            <Surface3D intensity={6} delay={0.1}>
              <div className="p-7 md:p-8 space-y-5">
                <div className="pb-4 border-b border-black/[0.08]">
                  <div className="text-xs font-semibold text-neutral-500">Partner Portal</div>
                  <h2 className="mt-1 text-xl font-bold text-[#0A0A0B]">Your Referral Telemetry</h2>
                </div>

                {loadingMe ? (
                  <div className="py-10 flex items-center justify-center gap-2 text-xs text-neutral-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading partner profile...</span>
                  </div>
                ) : !user ? (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-xs text-neutral-600">
                      Sign in with your applicant email to inspect referral earnings and approval
                      status.
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('auth')}
                      className="px-5 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg cursor-pointer"
                    >
                      Sign In to Partner Portal
                    </button>
                  </div>
                ) : !activePartner ? (
                  <p className="py-8 text-center text-xs text-neutral-600">
                    No partner record found for{' '}
                    <span className="font-semibold text-[#0A0A0B]">{user.email}</span>. Submit
                    an application on the left to generate your referral code.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#F8F8FA] border border-black/[0.08] p-4">
                        <div className="text-[11px] text-neutral-600">Approval Status</div>
                        <div className="mt-1 text-sm font-bold text-[#0A0A0B] capitalize">
                          {activePartner.status}
                        </div>
                      </div>
                      <div className="rounded-xl bg-[#F8F8FA] border border-black/[0.08] p-4">
                        <div className="text-[11px] text-neutral-600">Commission Rate</div>
                        <div className="mt-1 text-sm font-bold text-[#0A0A0B] tabular-nums">
                          {activePartner.commission_rate}%
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-[#0A0A0C] text-white p-4 flex items-center justify-between shadow-md">
                      <div>
                        <div className="text-[11px] text-neutral-400">Referral Code</div>
                        <div className="mt-0.5 text-base font-bold tracking-tight text-white">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/20 rounded-lg text-white hover:bg-white/10 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-[#0A0A0B] mb-2">
                        Attributed Referrals ({referrals.length})
                      </h3>
                      {referrals.length === 0 ? (
                        <p className="text-xs text-neutral-600">
                          No completed referrals recorded yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {referrals.map((ref) => (
                            <div
                              key={ref.id}
                              className="flex items-center justify-between text-xs rounded-lg bg-[#F8F8FA] border border-black/[0.08] px-3 py-2"
                            >
                              <span className="font-medium text-[#0A0A0B]">{ref.referred_email}</span>
                              <span className="font-bold text-emerald-700 tabular-nums">
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
            </Surface3D>
          </div>
        </div>
      </section>
    </div>
  );
}
