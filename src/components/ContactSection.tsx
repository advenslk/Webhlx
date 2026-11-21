import { CheckCircle2, Loader2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { DivisionId } from '../data/helzerxData';
import { ApiError, apiRequest } from '../lib/api';

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
      className="relative overflow-hidden bg-black py-24 md:py-32 border-t border-white/[0.06]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(109,40,217,0.22),transparent_80%)]"
      />

      <div className="relative z-10 max-w-[820px] mx-auto px-6">
        <div className="text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight text-white leading-[1.12]">
            Start with HelzerX Technologies
          </h2>
          <p className="mt-4 text-base md:text-lg leading-[1.6] text-neutral-400 max-w-[54ch] mx-auto">
            Select a division to request cloud architecture onboarding, hardware procurement
            pricing, or a dedicated Studio product sprint.
          </p>
        </div>

        <div className="mt-12 rounded-2xl bg-[#09090F] border border-white/[0.12] p-6 sm:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
          {inquiryId ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-violet-500/20 border border-violet-400/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-violet-300" />
              </div>
              <h3 className="text-xl font-bold text-white">Inquiry Logged</h3>
              <p className="text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
                Thank you, {fullName}. Your inquiry for{' '}
                <span className="font-semibold text-white">
                  {SCOPE_OPTIONS.find((s) => s.id === scope)?.label}
                </span>{' '}
                has been saved under reference{' '}
                <span className="font-mono text-cyan-300">{inquiryId}</span>. Expect a response at{' '}
                <span className="font-mono text-violet-300">{email}</span> within one business day.
              </p>
              <button
                type="button"
                onClick={resetForm}
                className="mt-2 inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div>
                <span className="block text-xs font-medium text-neutral-300 mb-2.5">
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
                        className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                          active
                            ? 'bg-white text-black border-white'
                            : 'bg-black/40 text-neutral-300 border-white/[0.1] hover:border-white/25 hover:text-white'
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
                  <label htmlFor="hx-name" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Full name
                  </label>
                  <input
                    id="hx-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full rounded-lg bg-black/60 border border-white/[0.12] px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-400"
                  />
                </div>

                <div>
                  <label htmlFor="hx-email" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Work email
                  </label>
                  <input
                    id="hx-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="team@company.com"
                    className="w-full rounded-lg bg-black/60 border border-white/[0.12] px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="hx-company" className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Organization (optional)
                </label>
                <input
                  id="hx-company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Systems Ltd."
                  className="w-full rounded-lg bg-black/60 border border-white/[0.12] px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label htmlFor="hx-brief" className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Project or procurement brief
                </label>
                <textarea
                  id="hx-brief"
                  rows={4}
                  required
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Describe your target cloud workloads, hardware quantities, or product launch timeline..."
                  className="w-full rounded-lg bg-black/60 border border-white/[0.12] px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-400 resize-y"
                />
              </div>

              {error && (
                <p role="alert" className="text-xs font-medium text-rose-400">
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
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 disabled:opacity-60 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{submitting ? 'Submitting...' : 'Submit Inquiry'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
