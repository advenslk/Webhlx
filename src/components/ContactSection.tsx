import { CheckCircle2, Loader2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { DivisionId } from '../lib/platformData';
import { ApiError, apiRequest } from '../lib/api';
import { Surface3D } from './Surface3D';

interface ContactSectionProps {
  selectedDivision?: DivisionId;
}

type InquiryScope = DivisionId | 'ecosystem' | 'enterprise';

const SCOPE_OPTIONS: { id: InquiryScope; label: string }[] = [
  { id: 'cloud', label: 'HelzerX Cloud' },
  { id: 'shop', label: 'HelzerX Shop' },
  { id: 'studio', label: 'HelzerX Studio' },
  { id: 'ecosystem', label: 'Full Ecosystem' },
];

export function ContactSection({ selectedDivision = 'cloud' }: ContactSectionProps) {
  const { user } = useAppContext();
  const [scope, setScope] = useState<InquiryScope>(selectedDivision);
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [company, setCompany] = useState('');
  const [brief, setBrief] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [inquiryId, setInquiryId] = useState<string | null>(null);

  useEffect(() => {
    setScope(selectedDivision);
  }, [selectedDivision]);

  useEffect(() => {
    if (user) {
      setFullName((prev) => prev || user.name);
      setEmail((prev) => prev || user.email);
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid work email address.');
      return;
    }
    if (brief.trim().length < 10) {
      setError('Please share a brief summary of your requirements (at least 10 characters).');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await apiRequest<{ ok: boolean; inquiryId: string }>('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          company: company.trim(),
          scope,
          brief: brief.trim(),
        }),
      });
      setInquiryId(res.inquiryId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to send inquiry right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCompany('');
    setBrief('');
    setError(null);
    setInquiryId(null);
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-[#F4F4F5] py-20 md:py-28 border-t border-black/[0.06]"
    >
      <div className="relative z-10 max-w-[820px] mx-auto px-6">
        <div className="text-center">
          <h2 className="text-[clamp(2rem,4vw,3.15rem)] font-extrabold tracking-tight text-[#0A0A0B] leading-[1.1]">
            Start with HelzerX Technologies
          </h2>
          <p className="mt-4 text-base md:text-lg leading-[1.6] text-neutral-600 max-w-[54ch] mx-auto">
            Select a division to request cloud architecture onboarding, hardware procurement
            pricing, or a dedicated Studio product sprint.
          </p>
        </div>

        <Surface3D intensity={6} className="mt-12">
          <div className="p-6 sm:p-10">
            {inquiryId ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="text-xl font-bold text-[#0A0A0B]">Inquiry Logged</h3>
                <p className="text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
                  Thank you, {fullName}. Your inquiry for{' '}
                  <span className="font-semibold text-[#0A0A0B]">
                    {SCOPE_OPTIONS.find((s) => s.id === scope)?.label}
                  </span>{' '}
                  has been saved under reference{' '}
                  <span className="text-[#0A0A0B] font-semibold tabular-nums">{inquiryId}</span>. Expect a response at{' '}
                  <span className="font-medium text-[#0A0A0B]">{email}</span> within one business day.
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-2 inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold text-white bg-[#0A0A0B] hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div>
                  <span className="block text-xs font-semibold text-neutral-700 mb-2.5">
                    Division or scope
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SCOPE_OPTIONS.map((option) => {
                      const active = scope === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setScope(option.id)}
                          className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                            active
                              ? 'bg-[#0A0A0B] text-white border-[#0A0A0B]'
                              : 'bg-[#F4F4F5] text-neutral-700 border-black/[0.08] hover:border-black/25 hover:text-[#0A0A0B]'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="hx-name" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Full name
                    </label>
                    <input
                      id="hx-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] placeholder:text-neutral-400 focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label htmlFor="hx-email" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Work email
                    </label>
                    <input
                      id="hx-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="team@company.com"
                      className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] placeholder:text-neutral-400 focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="hx-company" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Organization (optional)
                  </label>
                  <input
                    id="hx-company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Systems Ltd."
                    className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] placeholder:text-neutral-400 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label htmlFor="hx-brief" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Project or procurement brief
                  </label>
                  <textarea
                    id="hx-brief"
                    rows={4}
                    required
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="Describe your target cloud workloads, hardware quantities, or product launch timeline..."
                    className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] placeholder:text-neutral-400 focus:outline-none focus:border-black resize-y"
                  />
                </div>

                {error && (
                  <p role="alert" className="text-xs font-medium text-rose-700">
                    {error}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <span className="text-xs text-neutral-500">
                    Saved to HelzerX CRM · Typical response within 24 hours
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0A0A0B] rounded-lg hover:bg-neutral-800 disabled:opacity-60 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{submitting ? 'Submitting...' : 'Submit Inquiry'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </Surface3D>
      </div>
    </section>
  );
}
