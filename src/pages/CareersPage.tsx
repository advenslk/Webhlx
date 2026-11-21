import { Briefcase, CheckCircle2, Globe, Loader2, Upload } from 'lucide-react';
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import { Surface3D } from '../components/Surface3D';
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
    <div className="bg-[#F4F4F5] text-[#0A0A0B]">
      <section className="relative overflow-hidden helzerx-studio-hero pt-16 pb-20 md:pt-24 md:pb-24 border-b border-black/[0.06]">
        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs font-medium text-neutral-600 mb-6">
            <span className="font-semibold text-[#0A0A0B]">HelzerX Careers</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>Engineering &amp; Operations</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>Remote Global</span>
          </div>

          <h1 className="text-[clamp(2.6rem,6vw,4.75rem)] font-extrabold tracking-[-0.04em] leading-[0.98] helzerx-dotted-text max-w-[15ch] mx-auto pb-2">
            join the team.
          </h1>
          <p className="mt-6 max-w-[58ch] mx-auto text-base md:text-lg leading-[1.65] text-neutral-600">
            Work directly on bare-metal Proxmox orchestration, commercial design systems, and
            next-generation customer infrastructure ahead of January 1, 2027.
          </p>
        </div>
      </section>

      <section className="bg-[#F4F4F5] py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-6 space-y-14">
          {/* Open Positions */}
          <div>
            <h2 className="text-2xl font-extrabold text-[#0A0A0B] mb-6 tracking-tight">
              Open Staff Positions
            </h2>
            {loading ? (
              <div className="py-10 flex items-center gap-2 text-sm text-neutral-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading roles...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {positions.map((pos, idx) => {
                  const selected = positionId === pos.id;
                  return (
                    <Surface3D
                      key={pos.id}
                      intensity={12}
                      delay={idx * 0.05}
                      variant={selected ? 'dark' : 'light'}
                    >
                      <article className="p-7 h-full flex flex-col justify-between">
                        <div>
                          <div
                            className={`flex items-center justify-between text-xs ${
                              selected ? 'text-neutral-300' : 'text-neutral-600'
                            }`}
                          >
                            <span
                              className={`font-semibold ${
                                selected ? 'text-white' : 'text-[#0A0A0B]'
                              }`}
                            >
                              {pos.department}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Globe className="w-3.5 h-3.5" />
                              {pos.location}
                            </span>
                          </div>
                          <h3
                            className={`mt-3 text-lg font-bold ${
                              selected ? 'text-white' : 'text-[#0A0A0B]'
                            }`}
                          >
                            {pos.title}
                          </h3>
                          <p
                            className={`mt-2 text-xs leading-relaxed ${
                              selected ? 'text-neutral-300' : 'text-neutral-600'
                            }`}
                          >
                            {pos.summary}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPositionId(pos.id);
                            document.getElementById('career-apply-form')?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'center',
                            });
                          }}
                          className={`mt-5 self-start px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                            selected
                              ? 'bg-white text-[#0A0A0B] hover:bg-neutral-200'
                              : 'bg-[#0A0A0B] text-white hover:bg-neutral-800'
                          }`}
                        >
                          Apply for Role
                        </button>
                      </article>
                    </Surface3D>
                  );
                })}
              </div>
            )}
          </div>

          {/* Application Form + Tracker */}
          <div
            id="career-apply-form"
            className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 items-start"
          >
            <Surface3D intensity={6} delay={0.04}>
              <div className="p-7 md:p-8">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
                  <Briefcase className="w-4 h-4 text-[#0A0A0B]" />
                  <span>Staff Application</span>
                </div>
                <h2 className="mt-2 text-2xl font-bold text-[#0A0A0B]">Submit Your Candidacy</h2>

                {submittedApp ? (
                  <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-5 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-emerald-700 text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Application Received ({submittedApp.id})</span>
                    </div>
                    <p className="text-neutral-700">
                      Role: <strong>{submittedApp.position_title}</strong> · Status:{' '}
                      <span className="font-bold capitalize text-[#0A0A0B]">
                        {submittedApp.status}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmittedApp(null)}
                      className="mt-2 px-4 py-1.5 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg cursor-pointer"
                    >
                      Apply to Another Role
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                        Position
                      </label>
                      <select
                        value={positionId}
                        onChange={(e) => setPositionId(e.target.value)}
                        className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
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
                        <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={applicantName}
                          onChange={(e) => setApplicantName(e.target.value)}
                          className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                        GitHub / Portfolio URL (optional)
                      </label>
                      <input
                        type="url"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="https://github.com/username"
                        className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                        Experience &amp; Technical Summary
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={coverNote}
                        onChange={(e) => setCoverNote(e.target.value)}
                        placeholder="Summarize relevant production systems, design leadership, or infrastructure experience..."
                        className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black resize-y"
                      />
                    </div>

                    <div>
                      <label className="flex items-center justify-between gap-3 rounded-lg bg-[#F8F8FA] border border-dashed border-black/20 px-3.5 py-2.5 text-xs text-neutral-600 cursor-pointer hover:border-black">
                        <span className="inline-flex items-center gap-2 truncate">
                          <Upload className="w-4 h-4 text-[#0A0A0B] shrink-0" />
                          <span className="truncate">
                            {attachmentName || 'Attach CV / Resume filename'}
                          </span>
                        </span>
                        <input type="file" onChange={handleFile} className="sr-only" />
                      </label>
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
                      <span>Submit Staff Application</span>
                    </button>
                  </form>
                )}
              </div>
            </Surface3D>

            <Surface3D intensity={6} delay={0.1}>
              <div className="p-7 md:p-8 space-y-5">
                <div className="pb-4 border-b border-black/[0.08]">
                  <div className="text-xs font-semibold text-neutral-500">Applicant Tracker</div>
                  <h2 className="mt-1 text-xl font-bold text-[#0A0A0B]">Your Application Status</h2>
                </div>

                {!user ? (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-xs text-neutral-600">
                      Sign in to view reviewer notes and interview status updates for your
                      applications.
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('auth')}
                      className="px-5 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                ) : myApps.length === 0 ? (
                  <p className="py-8 text-center text-xs text-neutral-600">
                    No staff applications submitted under{' '}
                    <span className="font-semibold text-[#0A0A0B]">{user.email}</span>.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {myApps.map((app) => (
                      <div
                        key={app.id}
                        className="rounded-xl bg-[#F8F8FA] border border-black/[0.08] p-4 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0A0A0B]">{app.position_title}</span>
                          <span className="font-semibold text-[#0A0A0B] capitalize">
                            {app.status}
                          </span>
                        </div>
                        <div className="text-neutral-500 tabular-nums">
                          Submitted {new Date(app.created_at).toLocaleDateString()}
                        </div>
                        {app.reviewer_notes && (
                          <p className="pt-2 border-t border-black/[0.06] text-neutral-700">
                            Reviewer note: {app.reviewer_notes}
                          </p>
                        )}
                      </div>
                    ))}
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
