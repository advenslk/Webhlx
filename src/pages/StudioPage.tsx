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
import { DivisionBanner3D } from '../components/DivisionBanner3D';
import { Surface3D } from '../components/Surface3D';
import { useAppContext } from '../context/AppContext';
import { STUDIO_METHODOLOGY } from '../lib/platformData';
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
    <div className="bg-[#F4F4F5] text-[#0A0A0B]">
      {/* Smooth Full-Bleed Atmospheric Studio Banner Background + Floating 3D Cards */}
      <DivisionBanner3D
        imageSrc="/assets/aistudio/file_00000000808c8211b10e793920a7f76f_8d80975c.png"
        imageAlt="HelzerX Studio 2026 — Turning Ideas Into Reality Background Banner"
        divisionLabel="HelzerX Studio · Web & Custom Software · UI/UX & Branding · 2026"
        description="Senior product designers, full-stack engineers, brand directors, and video editors shipping commercial web platforms, SaaS dashboards, and digital brand ecosystems."
        fallbackTitle="HelzerX Studio 2026"
        fallbackSubtitle="Turning Ideas Into Reality · Full-Stack Engineering & Brand Systems"
        icon={<Layers className="w-6 h-6" />}
        actions={
          <>
            <a
              href="#studio-quote"
              className="px-6 py-3 text-sm font-semibold text-[#0A0A0B] bg-white rounded-xl hover:bg-neutral-100 transition-colors shadow-[0_14px_34px_rgba(0,0,0,0.35)] cursor-pointer"
            >
              Request Custom Quote
            </a>
            <button
              type="button"
              onClick={() => onNavigate(user ? 'dashboard' : 'auth')}
              className="px-6 py-3 text-sm font-semibold text-white bg-white/15 backdrop-blur-md border border-white/25 rounded-xl hover:bg-white/25 transition-colors cursor-pointer"
            >
              {user ? 'Track Active Projects' : 'Client Portal Sign In'}
            </button>
          </>
        }
        specs={[
          {
            value: '7 Tracks',
            label: 'Production Disciplines',
            detail: 'Web apps, UI/UX systems, branding, custom software, video, and digital ops.',
          },
          {
            value: '2026',
            label: 'Studio Architecture',
            detail: 'Weekly staging deployments with interactive Figma & Three.js craft.',
          },
          {
            value: 'Live Sync',
            label: 'Client Portal Threads',
            detail: 'Direct communication threads, budget milestones, and spec uploads.',
          },
          {
            value: 'End-to-End',
            label: 'Cloud Deployment',
            detail: 'Production rollouts hosted natively on HelzerX Cloud LXC infrastructure.',
          },
        ]}
      />

      {/* Preserved Studio 3D Hardware Bezel Showcase */}
      <section className="relative bg-[#F4F4F5] pt-4 pb-20 md:pb-24 z-10">
        <div className="max-w-[840px] mx-auto px-6">
          <div className="text-center mb-8">
            <div className="text-xs font-medium text-neutral-500">Client Analytics Workspace</div>
            <h2 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-[#0A0A0B]">
              HelzerX Studio Dashboard
            </h2>
          </div>
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-7 inset-x-10 h-14 rounded-full bg-black/25 blur-2xl"
            />
            <div className="helzerx-perspective-frame rounded-[24px] overflow-hidden border-[6px] border-[#141417] bg-[#141417] shadow-[0_42px_95px_-20px_rgba(10,10,14,0.44)]">
              <img
                src={studioDashboardImg}
                alt="HelzerX Studio Dashboard showcasing analytics, cohort metrics, and 2026 schedule"
                referrerPolicy="no-referrer"
                className="w-full h-auto block object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 7 Studio Services Grid */}
      <section className="bg-[#F4F4F5] py-16 md:py-24 border-t border-black/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="max-w-[660px] mx-auto text-center mb-12">
            <div className="text-xs font-medium text-neutral-500">Studio Capabilities</div>
            <h2 className="mt-2 text-[clamp(1.85rem,3.5vw,2.75rem)] font-extrabold tracking-tight text-[#0A0A0B]">
              Seven Specialized Production Tracks
            </h2>
            <p className="mt-3 text-sm md:text-base text-neutral-600">
              Select a track below to pre-fill your project request brief.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STUDIO_SERVICES.map((svc, idx) => {
              const Icon = svc.icon;
              const active = serviceType === svc.id;
              return (
                <Surface3D
                  key={svc.id}
                  intensity={14}
                  delay={idx * 0.04}
                  variant={active ? 'dark' : 'light'}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setServiceType(svc.id);
                      document.getElementById('studio-quote')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                      });
                    }}
                    className="w-full h-full text-left p-6 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-[0_12px_24px_rgba(10,10,14,0.28)] border ${
                          active
                            ? 'bg-white text-[#0A0A0B] border-white/20'
                            : 'bg-[#111114] text-white border-white/10'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3
                        className={`mt-5 text-base font-bold ${
                          active ? 'text-white' : 'text-[#0A0A0B]'
                        }`}
                      >
                        {svc.id}
                      </h3>
                      <p
                        className={`mt-2 text-xs leading-relaxed ${
                          active ? 'text-neutral-300' : 'text-neutral-600'
                        }`}
                      >
                        {svc.desc}
                      </p>
                    </div>
                  </button>
                </Surface3D>
              );
            })}
          </div>

          {/* Methodology */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {STUDIO_METHODOLOGY.map((phase, idx) => (
              <Surface3D key={phase.id} intensity={16} delay={idx * 0.06}>
                <article className="p-7 h-full">
                  <div className="text-xs font-semibold text-neutral-500">
                    {phase.stage}
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-[#0A0A0B]">{phase.title}</h3>
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                    {phase.description}
                  </p>
                </article>
              </Surface3D>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Request Form & Live Client Project Tracking */}
      <section id="studio-quote" className="bg-[#F4F4F5] py-16 md:py-24 border-t border-black/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 items-start">
          {/* Request Form */}
          <Surface3D intensity={6}>
            <div className="p-7 md:p-8">
              <div className="text-xs font-medium text-neutral-500">Project Intake</div>
              <h2 className="mt-1.5 text-2xl font-bold text-[#0A0A0B]">
                Request a Studio Project or Quote
              </h2>
              <p className="mt-2 text-xs text-neutral-600">
                Your brief is stored in our project database and immediately trackable inside your
                Client Portal.
              </p>

              {submittedProject ? (
                <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-6 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Project Brief Submitted ({submittedProject.id})</span>
                  </div>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    <strong>{submittedProject.title}</strong> ({submittedProject.service_type}) has
                    been assigned status{' '}
                    <span className="font-semibold text-[#0A0A0B]">{submittedProject.status}</span>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmittedProject(null)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-xl hover:bg-neutral-800 cursor-pointer"
                  >
                    Submit Another Brief
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitBrief} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Alex Mercer"
                        className="w-full rounded-xl bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] placeholder:text-neutral-400 focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="founder@company.com"
                        className="w-full rounded-xl bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] placeholder:text-neutral-400 focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                        Service Track
                      </label>
                      <select
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value)}
                        className="w-full rounded-xl bg-[#F8F8FA] border border-black/[0.12] px-3 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                      >
                        {STUDIO_SERVICES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                        Budget Range
                      </label>
                      <select
                        value={budgetRange}
                        onChange={(e) => setBudgetRange(e.target.value)}
                        className="w-full rounded-xl bg-[#F8F8FA] border border-black/[0.12] px-3 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                      >
                        <option>$1,000 - $2,500</option>
                        <option>$2,500 - $5,000</option>
                        <option>$5,000 - $15,000</option>
                        <option>$15,000+ Enterprise</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                        Target Timeline
                      </label>
                      <select
                        value={timeline}
                        onChange={(e) => setTimeline(e.target.value)}
                        className="w-full rounded-xl bg-[#F8F8FA] border border-black/[0.12] px-3 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                      >
                        <option>2-4 Weeks</option>
                        <option>4-6 Weeks</option>
                        <option>2-3 Months</option>
                        <option>Flexible</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                      Project Title
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Global SaaS Commerce Platform & Brand Identity"
                      className="w-full rounded-xl bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] placeholder:text-neutral-400 focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                      Project Brief &amp; Requirements
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={brief}
                      onChange={(e) => setBrief(e.target.value)}
                      placeholder="Describe deliverables, target users, reference links, and technical requirements..."
                      className="w-full rounded-xl bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] placeholder:text-neutral-400 focus:outline-none focus:border-black resize-y"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                      Reference Spec File (optional metadata)
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-xl bg-[#F8F8FA] border border-dashed border-black/20 px-3.5 py-2.5 text-xs text-neutral-600 cursor-pointer hover:border-black">
                      <span className="inline-flex items-center gap-2 truncate">
                        <Upload className="w-4 h-4 text-[#0A0A0B] shrink-0" />
                        <span className="truncate">
                          {attachmentName || 'Attach brief PDF, wireframe, or archive name'}
                        </span>
                      </span>
                      <input type="file" onChange={handleFileChange} className="sr-only" />
                    </label>
                  </div>

                  {submitError && (
                    <p role="alert" className="text-xs text-rose-700 font-medium">
                      {submitError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 text-xs font-semibold text-white bg-[#0A0A0B] rounded-xl hover:bg-neutral-800 disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Submit Project Request</span>
                  </button>
                </form>
              )}
            </div>
          </Surface3D>

          {/* Client Project Tracker + Messages */}
          <Surface3D intensity={6}>
            <div className="p-7 md:p-8">
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-black/[0.08]">
                <div>
                  <div className="text-xs font-medium text-neutral-500">Client Portal</div>
                  <h2 className="mt-1 text-xl font-bold text-[#0A0A0B]">Active Studio Projects</h2>
                </div>
                <MessageSquare className="w-5 h-5 text-neutral-500" />
              </div>

              {!user ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-sm text-neutral-600">
                    Sign in with your project email to track milestones and message your assigned
                    Studio team.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('auth')}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0A0A0B] rounded-xl hover:bg-neutral-800 cursor-pointer"
                  >
                    Sign In to Track Projects
                  </button>
                </div>
              ) : projects.length === 0 ? (
                <p className="py-12 text-center text-sm text-neutral-600">
                  No Studio projects linked to{' '}
                  <span className="font-semibold text-[#0A0A0B]">{user.email}</span> yet.
                </p>
              ) : (
                <div className="mt-4 space-y-5">
                  <div className="flex flex-wrap gap-2">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setActiveProjectId(p.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                          p.id === activeProjectId
                            ? 'bg-[#0A0A0B] text-white border-[#0A0A0B]'
                            : 'bg-[#F8F8FA] text-neutral-700 border-black/[0.1] hover:border-black/30'
                        }`}
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>

                  {activeProject && (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-[#F8F8FA] border border-black/[0.08] p-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#0A0A0B]">
                            {activeProject.service_type}
                          </span>
                          <span className="font-semibold px-2.5 py-0.5 rounded-lg bg-[#0A0A0B] text-white">
                            {activeProject.status}
                          </span>
                        </div>
                        <div className="text-neutral-600">
                          Budget:{' '}
                          <span className="font-semibold text-[#0A0A0B]">
                            {activeProject.budget_range}
                          </span>{' '}
                          · Timeline:{' '}
                          <span className="font-semibold text-[#0A0A0B]">
                            {activeProject.timeline}
                          </span>
                        </div>
                        {activeProject.admin_notes && (
                          <div className="pt-2 border-t border-black/[0.06] text-neutral-700">
                            <span className="font-semibold text-[#0A0A0B]">Studio Lead Note: </span>
                            {activeProject.admin_notes}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {activeMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className="rounded-xl bg-[#F8F8FA] border border-black/[0.08] p-3 text-xs"
                          >
                            <div className="flex items-center justify-between text-neutral-500">
                              <span className="font-semibold text-[#0A0A0B]">
                                {msg.sender_name}{' '}
                                <span className="text-neutral-500">({msg.sender_role})</span>
                              </span>
                              <span className="tabular-nums">
                                {new Date(msg.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="mt-1.5 text-neutral-700 leading-relaxed">{msg.message}</p>
                          </div>
                        ))}
                      </div>

                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Send an update or question to Studio..."
                          className="flex-1 rounded-xl bg-[#F8F8FA] border border-black/[0.12] px-3 py-2 text-xs text-[#0A0A0B] focus:outline-none focus:border-black"
                        />
                        <button
                          type="submit"
                          disabled={sendingReply}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-xl hover:bg-neutral-800 cursor-pointer"
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
          </Surface3D>
        </div>
      </section>
    </div>
  );
}
