import {
  Briefcase,
  CheckCircle2,
  Code2,
  Film,
  Layers,
  Loader2,
  MessageSquare,
  Palette,
  PenTool,
  Send,
  Sparkles,
  Upload,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import studioDashboardImg from '../assets/images/helzerx_studio_dashboard_1795231046611.jpg';
import { useAppContext } from '../context/AppContext';
import { STUDIO_METHODOLOGY } from '../data/helzerxPagesData';
import { ApiError, apiRequest } from '../lib/api';
import { PageRoute } from '../types/navigation';

interface StudioProject {
  id: string;
  client_name: string;
  client_email: string;
  service_type: string;
  title: string;
  budget_range: string;
  timeline: string;
  brief: string;
  attachment_name: string;
  status: string;
  admin_notes: string;
  updated_at: string;
}

interface StudioMessage {
  id: string;
  project_id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

interface StudioPageProps {
  onNavigate: (route: PageRoute, division?: 'studio') => void;
}

const STUDIO_SERVICES = [
  { id: 'Website Development', icon: Code2, desc: 'Production React, Next.js, Node.js, and high-conversion web platforms.' },
  { id: 'UI/UX Design', icon: Layers, desc: 'Dark & light design systems, interactive prototypes, and WCAG AA interfaces.' },
  { id: 'Custom Software Development', icon: Briefcase, desc: 'Enterprise portals, API gateways, billing engines, and automation tools.' },
  { id: 'Graphic Design', icon: Palette, desc: 'Product launch assets, social campaigns, key art, and technical illustrations.' },
  { id: 'Video Editing', icon: Film, desc: 'Product launch films, motion UI reels, and high-retention editorial cuts.' },
  { id: 'Branding', icon: PenTool, desc: 'Complete brand strategy, visual identity, typography, and brand guidelines.' },
  { id: 'Digital Solutions', icon: Sparkles, desc: 'End-to-end SEO, analytics instrumentation, and cloud deployment pipelines.' },
];

export function StudioPage({ onNavigate }: StudioPageProps) {
  const { user } = useAppContext();

  // Quote submission state
  const [clientName, setClientName] = useState(user?.name || '');
  const [clientEmail, setClientEmail] = useState(user?.email || '');
  const [serviceType, setServiceType] = useState(STUDIO_SERVICES[0].id);
  const [title, setTitle] = useState('');
  const [budgetRange, setBudgetRange] = useState('$2,500 - $5,000');
  const [timeline, setTimeline] = useState('4-6 Weeks');
  const [brief, setBrief] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedProject, setSubmittedProject] = useState<StudioProject | null>(null);

  // Client tracking portal state
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (user) {
      setClientName((prev) => prev || user.name);
      setClientEmail((prev) => prev || user.email);
    }
  }, [user]);

  const loadProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setMessages([]);
      return;
    }
    try {
      const res = await apiRequest<{ projects: StudioProject[]; messages: StudioMessage[] }>(
        '/api/studio/projects',
      );
      setProjects(res.projects || []);
      setMessages(res.messages || []);
      if (res.projects?.length > 0 && !activeProjectId) {
        setActiveProjectId(res.projects[0].id);
      }
    } catch {
      // ignore transient
    }
  }, [user, activeProjectId]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAttachmentName(file ? file.name : '');
  };

  const handleSubmitBrief = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await apiRequest<{ project: StudioProject }>('/api/studio/projects', {
        method: 'POST',
        body: JSON.stringify({
          clientName,
          clientEmail,
          serviceType,
          title,
          budgetRange,
          timeline,
          brief,
          attachmentName,
        }),
      });
      setSubmittedProject(res.project);
      setTitle('');
      setBrief('');
      setAttachmentName('');
      await loadProjects();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Unable to submit project request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeProjectId || replyText.trim().length < 2) return;
    setSendingReply(true);
    try {
      await apiRequest(`/api/studio/projects/${activeProjectId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: replyText.trim() }),
      });
      setReplyText('');
      await loadProjects();
    } catch {
      // ignore
    } finally {
      setSendingReply(false);
    }
  };

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const activeMessages = messages.filter((m) => m.project_id === activeProjectId);

  return (
    <div className="bg-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden helzerx-hero-aura pt-20 pb-28 md:pt-28 md:pb-36">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[440px] left-1/2 -translate-x-1/2 w-[165%] h-[540px] rounded-[100%] bg-black border-t border-violet-300/40 shadow-[0_-20px_80px_rgba(167,139,250,0.38)]"
        />

        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs md:text-sm font-medium text-violet-200/85 mb-6">
            <span>HelzerX Studio</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Web &amp; Custom Software</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>UI/UX &amp; Branding</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Creative Production</span>
          </div>

          <h1 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-extrabold tracking-[-0.03em] leading-[1.04] text-white max-w-[18ch] mx-auto">
            Creative &amp; Software Engineering Studio
          </h1>
          <p className="mt-6 max-w-[60ch] mx-auto text-base md:text-lg leading-[1.6] text-neutral-200/90">
            Senior product designers, full-stack engineers, brand directors, and video editors
            shipping commercial web platforms, SaaS dashboards, and digital brand ecosystems.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#studio-quote"
              className="px-6 py-3 text-sm font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Request Custom Quote
            </a>
            <button
              type="button"
              onClick={() => onNavigate(user ? 'dashboard' : 'auth')}
              className="px-6 py-3 text-sm font-semibold text-white bg-white/[0.06] border border-white/15 rounded-lg hover:bg-white/[0.12] transition-colors cursor-pointer"
            >
              {user ? 'Track Active Projects' : 'Client Portal Sign In'}
            </button>
          </div>
        </div>
      </section>

      {/* Preserved Studio 3D Showcase */}
      <section className="relative bg-black pb-20 md:pb-24 -mt-12 z-10">
        <div className="max-w-[1040px] mx-auto px-6">
          <div className="helzerx-perspective-frame rounded-2xl overflow-hidden border border-white/[0.14] bg-[#08080D] shadow-[0_24px_70px_rgba(0,0,0,0.6),0_0_75px_rgba(124,58,237,0.28)]">
            <img
              src={studioDashboardImg}
              alt="HelzerX Studio Dashboard showcasing analytics, cohort metrics, and 2026 schedule"
              referrerPolicy="no-referrer"
              className="w-full h-auto block object-cover"
            />
          </div>
        </div>
      </section>

      {/* 7 Studio Services Grid */}
      <section className="bg-black py-16 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="max-w-[660px] mx-auto text-center mb-12">
            <div className="text-xs font-mono text-violet-300">STUDIO CAPABILITIES</div>
            <h2 className="mt-2 text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold tracking-tight text-white">
              Seven Specialized Production Tracks
            </h2>
            <p className="mt-3 text-sm md:text-base text-neutral-400">
              Select a track below to pre-fill your project request brief.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STUDIO_SERVICES.map((svc) => {
              const Icon = svc.icon;
              const active = serviceType === svc.id;
              return (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => {
                    setServiceType(svc.id);
                    document.getElementById('studio-quote')?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    });
                  }}
                  className={`text-left rounded-2xl p-6 border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#100D1E] border-violet-400/60'
                      : 'bg-[#08080C] border-white/[0.1] hover:border-white/25'
                  }`}
                >
                  <Icon className="w-5 h-5 text-violet-300" />
                  <h3 className="mt-4 text-base font-bold text-white">{svc.id}</h3>
                  <p className="mt-2 text-xs text-neutral-400 leading-relaxed">{svc.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Methodology */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {STUDIO_METHODOLOGY.map((phase) => (
              <article
                key={phase.step}
                className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-7"
              >
                <div className="font-mono text-sm font-semibold text-cyan-300 tabular-nums">
                  {phase.step}
                </div>
                <h3 className="mt-3 text-lg font-bold text-white">{phase.title}</h3>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{phase.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Request Form & Live Client Project Tracking */}
      <section id="studio-quote" className="bg-black py-16 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 items-start">
          {/* Request Form */}
          <div className="rounded-2xl bg-[#08080F] border border-white/[0.12] p-7 md:p-8">
            <div className="text-xs font-mono text-violet-300">PROJECT INTAKE</div>
            <h2 className="mt-2 text-2xl font-bold text-white">Request a Studio Project or Quote</h2>
            <p className="mt-2 text-xs text-neutral-400">
              Your brief is stored in our project database and immediately trackable inside your Client Portal.
            </p>

            {submittedProject ? (
              <div className="mt-6 rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-6 space-y-3">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Project Brief Submitted ({submittedProject.id})</span>
                </div>
                <p className="text-xs text-neutral-200 leading-relaxed">
                  <strong>{submittedProject.title}</strong> ({submittedProject.service_type}) has
                  been assigned status <span className="font-mono">{submittedProject.status}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedProject(null)}
                  className="px-4 py-2 text-xs font-semibold text-black bg-white rounded-lg cursor-pointer"
                >
                  Submit Another Brief
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitBrief} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Alex Mercer"
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
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="founder@company.com"
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Service Track
                    </label>
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
                    >
                      {STUDIO_SERVICES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Budget Range
                    </label>
                    <select
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
                    >
                      <option>$1,000 - $2,500</option>
                      <option>$2,500 - $5,000</option>
                      <option>$5,000 - $15,000</option>
                      <option>$15,000+ Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Target Timeline
                    </label>
                    <select
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
                    >
                      <option>2-4 Weeks</option>
                      <option>4-6 Weeks</option>
                      <option>2-3 Months</option>
                      <option>Flexible</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Project Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Global SaaS Commerce Platform & Brand Identity"
                    className="w-full rounded-lg bg-black border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Project Brief &amp; Requirements
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="Describe deliverables, target users, reference links, and technical requirements..."
                    className="w-full rounded-lg bg-black border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400 resize-y"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Reference Spec File (optional metadata)
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-lg bg-black border border-dashed border-white/[0.18] px-3.5 py-2.5 text-xs text-neutral-400 cursor-pointer hover:border-violet-400/50">
                    <span className="inline-flex items-center gap-2 truncate">
                      <Upload className="w-4 h-4 text-violet-300 shrink-0" />
                      <span className="truncate">
                        {attachmentName || 'Attach brief PDF, wireframe, or archive name'}
                      </span>
                    </span>
                    <input type="file" onChange={handleFileChange} className="sr-only" />
                  </label>
                </div>

                {submitError && (
                  <p role="alert" className="text-xs text-rose-400 font-medium">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Submit Project Request</span>
                </button>
              </form>
            )}
          </div>

          {/* Client Project Tracker + Messages */}
          <div className="rounded-2xl bg-[#08080C] border border-white/[0.12] p-7 md:p-8">
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
              <div>
                <div className="text-xs font-mono text-cyan-300">CLIENT PORTAL</div>
                <h2 className="mt-1 text-xl font-bold text-white">Active Studio Projects</h2>
              </div>
              <MessageSquare className="w-5 h-5 text-neutral-400" />
            </div>

            {!user ? (
              <div className="py-12 text-center space-y-3">
                <p className="text-sm text-neutral-400">
                  Sign in with your project email to track milestones and message your assigned Studio team.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('auth')}
                  className="px-5 py-2 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 cursor-pointer"
                >
                  Sign In to Track Projects
                </button>
              </div>
            ) : projects.length === 0 ? (
              <p className="py-12 text-center text-sm text-neutral-400">
                No Studio projects linked to <span className="font-mono text-white">{user.email}</span> yet.
              </p>
            ) : (
              <div className="mt-4 space-y-5">
                <div className="flex flex-wrap gap-2">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActiveProjectId(p.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        p.id === activeProjectId
                          ? 'bg-white text-black border-white'
                          : 'bg-black/50 text-neutral-300 border-white/10 hover:border-white/25'
                      }`}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>

                {activeProject && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-black/60 border border-white/[0.08] p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-violet-300">{activeProject.service_type}</span>
                        <span className="font-mono px-2 py-0.5 rounded bg-white/[0.07] text-cyan-300">
                          {activeProject.status}
                        </span>
                      </div>
                      <div className="text-neutral-300">
                        Budget: <span className="font-mono text-white">{activeProject.budget_range}</span> · Timeline:{' '}
                        <span className="font-mono text-white">{activeProject.timeline}</span>
                      </div>
                      {activeProject.admin_notes && (
                        <div className="pt-2 border-t border-white/[0.06] text-neutral-300">
                          <span className="font-semibold text-white">Studio Lead Note: </span>
                          {activeProject.admin_notes}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {activeMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className="rounded-lg bg-white/[0.03] border border-white/[0.08] p-3 text-xs"
                        >
                          <div className="flex items-center justify-between text-neutral-400">
                            <span className="font-semibold text-white">
                              {msg.sender_name}{' '}
                              <span className="font-mono text-violet-300">({msg.sender_role})</span>
                            </span>
                            <span className="font-mono tabular-nums">
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-1.5 text-neutral-200 leading-relaxed">{msg.message}</p>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Send an update or question to Studio..."
                        className="flex-1 rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-400"
                      />
                      <button
                        type="submit"
                        disabled={sendingReply}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
