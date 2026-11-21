import { Briefcase, CheckCircle2, Globe, Loader2, Upload } from 'lucide-react';
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ApiError, apiRequest } from '../lib/api';
import { PageRoute } from '../types/navigation';

interface OpenPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  summary: string;
}

interface CareerApplication {
  id: string;
  position_title: string;
  applicant_name: string;
  email: string;
  status: string;
  reviewer_notes: string;
  created_at: string;
}

interface CareersPageProps {
  onNavigate: (route: PageRoute) => void;
}

export function CareersPage({ onNavigate }: CareersPageProps) {
  const { user } = useAppContext();
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [myApps, setMyApps] = useState<CareerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const [positionId, setPositionId] = useState('');
  const [applicantName, setApplicantName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<CareerApplication | null>(null);

  useEffect(() => {
    if (user) {
      setApplicantName((p) => p || user.name);
      setEmail((p) => p || user.email);
    }
  }, [user]);

  const loadCareers = useCallback(async () => {
    try {
      const posRes = await apiRequest<{ positions: OpenPosition[] }>('/api/careers/positions');
      const list = posRes.positions || [];
      setPositions(list);
      if (list.length > 0 && !positionId) setPositionId(list[0].id);

      if (user) {
        const myRes = await apiRequest<{ applications: CareerApplication[] }>(
          '/api/careers/my-applications',
        );
        setMyApps(myRes.applications || []);
      } else {
        setMyApps([]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user, positionId]);

  useEffect(() => {
    void loadCareers();
  }, [loadCareers]);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setAttachmentName(f ? f.name : '');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiRequest<{ application: CareerApplication }>('/api/careers/apply', {
        method: 'POST',
        body: JSON.stringify({
          positionId,
          applicantName,
          email,
          portfolioUrl,
          coverNote,
          attachmentName,
        }),
      });
      setSubmittedApp(res.application);
      setCoverNote('');
      setAttachmentName('');
      await loadCareers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-black text-white">
      <section className="relative overflow-hidden helzerx-hero-aura pt-20 pb-24 md:pt-28 md:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[440px] left-1/2 -translate-x-1/2 w-[165%] h-[540px] rounded-[100%] bg-black border-t border-violet-300/40 shadow-[0_-20px_80px_rgba(167,139,250,0.35)]"
        />

        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs md:text-sm font-medium text-violet-200/85 mb-6">
            <span>HelzerX Careers</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Engineering &amp; Operations</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Remote Global</span>
          </div>

          <h1 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-extrabold tracking-[-0.03em] leading-[1.04] text-white max-w-[18ch] mx-auto">
            Join the HelzerX Team
          </h1>
          <p className="mt-6 max-w-[58ch] mx-auto text-base md:text-lg leading-[1.6] text-neutral-200/90">
            Work directly on bare-metal Proxmox orchestration, commercial design systems, and
            next-generation customer infrastructure ahead of January 1, 2027.
          </p>
        </div>
      </section>

      <section className="bg-black py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-6 space-y-14">
          {/* Open Positions */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Open Staff Positions</h2>
            {loading ? (
              <div className="py-10 flex items-center gap-2 text-sm text-neutral-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading roles...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {positions.map((pos) => (
                  <article
                    key={pos.id}
                    className={`rounded-2xl p-7 border transition-colors ${
                      positionId === pos.id
                        ? 'bg-[#0E0D1B] border-violet-400/60'
                        : 'bg-[#08080C] border-white/[0.1]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span className="font-mono text-cyan-300">{pos.department}</span>
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        {pos.location}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-white">{pos.title}</h3>
                    <p className="mt-2 text-xs text-neutral-400 leading-relaxed">{pos.summary}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setPositionId(pos.id);
                        document.getElementById('career-apply-form')?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center',
                        });
                      }}
                      className="mt-5 px-4 py-2 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 cursor-pointer"
                    >
                      Apply for Role
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Application Form + Tracker */}
          <div
            id="career-apply-form"
            className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 items-start"
          >
            <div className="rounded-2xl bg-[#08080F] border border-white/[0.12] p-7 md:p-8">
              <div className="flex items-center gap-2 text-xs font-mono text-violet-300">
                <Briefcase className="w-4 h-4" />
                <span>STAFF APPLICATION</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold text-white">Submit Your Candidacy</h2>

              {submittedApp ? (
                <div className="mt-6 rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Application Received ({submittedApp.id})</span>
                  </div>
                  <p className="text-neutral-200">
                    Role: <strong>{submittedApp.position_title}</strong> · Status:{' '}
                    <span className="font-mono text-cyan-300">{submittedApp.status}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmittedApp(null)}
                    className="mt-2 px-4 py-1.5 text-xs font-semibold text-black bg-white rounded-lg cursor-pointer"
                  >
                    Apply to Another Role
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Position
                    </label>
                    <select
                      value={positionId}
                      onChange={(e) => setPositionId(e.target.value)}
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
                    >
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        className="w-full rounded-lg bg-black border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg bg-black border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      GitHub / Portfolio URL (optional)
                    </label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Experience &amp; Technical Summary
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder="Summarize relevant production systems, design leadership, or infrastructure experience..."
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400 resize-y"
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between gap-3 rounded-lg bg-black border border-dashed border-white/[0.18] px-3.5 py-2.5 text-xs text-neutral-400 cursor-pointer hover:border-violet-400/50">
                      <span className="inline-flex items-center gap-2 truncate">
                        <Upload className="w-4 h-4 text-violet-300 shrink-0" />
                        <span className="truncate">{attachmentName || 'Attach CV / Resume filename'}</span>
                      </span>
                      <input type="file" onChange={handleFile} className="sr-only" />
                    </label>
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
                    <span>Submit Staff Application</span>
                  </button>
                </form>
              )}
            </div>

            <div className="rounded-2xl bg-[#08080C] border border-white/[0.12] p-7 md:p-8 space-y-5">
              <div className="pb-4 border-b border-white/[0.08]">
                <div className="text-xs font-mono text-cyan-300">APPLICANT TRACKER</div>
                <h2 className="mt-1 text-xl font-bold text-white">Your Application Status</h2>
              </div>

              {!user ? (
                <div className="py-8 text-center space-y-3">
                  <p className="text-xs text-neutral-400">
                    Sign in to view reviewer notes and interview status updates for your applications.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('auth')}
                    className="px-5 py-2 text-xs font-semibold text-black bg-white rounded-lg cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              ) : myApps.length === 0 ? (
                <p className="py-8 text-center text-xs text-neutral-400">
                  No staff applications submitted under <span className="font-mono text-white">{user.email}</span>.
                </p>
              ) : (
                <div className="space-y-3">
                  {myApps.map((app) => (
                    <div
                      key={app.id}
                      className="rounded-xl bg-black/60 border border-white/[0.08] p-4 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{app.position_title}</span>
                        <span className="font-mono text-cyan-300 uppercase">{app.status}</span>
                      </div>
                      <div className="text-neutral-500 font-mono">
                        Submitted {new Date(app.created_at).toLocaleDateString()}
                      </div>
                      {app.reviewer_notes && (
                        <p className="pt-2 border-t border-white/[0.06] text-neutral-300">
                          Reviewer note: {app.reviewer_notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
