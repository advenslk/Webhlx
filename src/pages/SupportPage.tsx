import { BookOpen, CheckCircle2, HelpCircle, LifeBuoy, Loader2, Send, Upload } from 'lucide-react';
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import { Surface3D } from '../components/Surface3D';
import { useAppContext } from '../context/AppContext';
import { ApiError, apiRequest } from '../lib/api';
import { PageRoute } from '../types/navigation';

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  updated_at: string;
}

interface TicketReply {
  id: string;
  ticket_id: string;
  sender_name: string;
  sender_role: string;
  body: string;
  attachment_name: string;
  created_at: string;
}

interface SupportPageProps {
  onNavigate: (route: PageRoute) => void;
}

const DOC_GUIDES = [
  {
    title: 'Connecting Pterodactyl Daemon & Client APIs',
    category: 'HelzerX Cloud',
    summary:
      'Set PTERODACTYL_URL, PTERODACTYL_APP_API_KEY, and PTERODACTYL_CLIENT_API_KEY in server environment secrets to unlock live telemetry and power controls.',
  },
  {
    title: 'Launch 01.01.2027 Early Access Eligibility',
    category: 'Campaign',
    summary:
      'Register an account, verify your email address in Security Settings, and confirm your Early Access application before Jan 1, 2027 to qualify for the first-50 8GB RAM allocation.',
  },
  {
    title: 'Shop Order Checkout & Invoice Settlement',
    category: 'HelzerX Shop',
    summary:
      'Orders automatically generate an invoice record inside your Dashboard. When Stripe keys are live, card capture transitions orders from pending_payment to paid.',
  },
  {
    title: 'Studio Project Sprints & File Specifications',
    category: 'HelzerX Studio',
    summary:
      'Track milestone statuses and message Studio leads directly from the Client Portal once your project brief is submitted.',
  },
];

export function SupportPage({ onNavigate }: SupportPageProps) {
  const { user, siteData } = useAppContext();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [category, setCategory] = useState('Cloud Infrastructure');
  const [priority, setPriority] = useState('normal');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<SupportTicket | null>(null);

  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (user) {
      setName((p) => p || user.name);
      setEmail((p) => p || user.email);
    }
  }, [user]);

  const loadTickets = useCallback(async () => {
    if (!user) {
      setTickets([]);
      setReplies([]);
      return;
    }
    try {
      const res = await apiRequest<{ tickets: SupportTicket[]; replies: TicketReply[] }>(
        '/api/support/tickets',
      );
      setTickets(res.tickets || []);
      setReplies(res.replies || []);
      if (res.tickets?.length > 0 && !activeTicketId) {
        setActiveTicketId(res.tickets[0].id);
      }
    } catch {
      // ignore
    }
  }, [user, activeTicketId]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setAttachmentName(f ? f.name : '');
  };

  const handleCreateTicket = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiRequest<{ ticket: SupportTicket }>('/api/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          category,
          priority,
          subject,
          message,
          attachmentName,
        }),
      });
      setCreatedTicket(res.ticket);
      setSubject('');
      setMessage('');
      setAttachmentName('');
      await loadTickets();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeTicketId || replyText.trim().length < 2) return;
    setSendingReply(true);
    try {
      await apiRequest(`/api/support/tickets/${activeTicketId}/replies`, {
        method: 'POST',
        body: JSON.stringify({ message: replyText.trim() }),
      });
      setReplyText('');
      await loadTickets();
    } catch {
      // ignore
    } finally {
      setSendingReply(false);
    }
  };

  const faqs = siteData?.faqs ?? [];
  const activeTicket = tickets.find((t) => t.id === activeTicketId) ?? null;
  const activeReplies = replies.filter((r) => r.ticket_id === activeTicketId);

  return (
    <div className="bg-[#F4F4F5] text-[#0A0A0B]">
      <section className="relative overflow-hidden helzerx-studio-hero pt-16 pb-20 md:pt-24 md:pb-24 border-b border-black/[0.06]">
        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs font-medium text-neutral-600 mb-5">
            <span className="font-semibold text-[#0A0A0B]">Support Center</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>Documentation</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>Ticket Desk</span>
          </div>
          <h1 className="text-[clamp(2.6rem,6vw,4.75rem)] font-extrabold tracking-[-0.04em] leading-[0.98] helzerx-dotted-text pb-2">
            help &amp; docs.
          </h1>
          <p className="mt-5 max-w-[56ch] mx-auto text-base md:text-lg text-neutral-600">
            Search operational documentation, inspect common billing &amp; launch FAQs, or open a
            tracked support ticket with our engineering team.
          </p>
        </div>
      </section>

      <section className="bg-[#F4F4F5] py-14 md:py-20">
        <div className="max-w-[1200px] mx-auto px-6 space-y-16">
          {/* Knowledge Base Guides */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 mb-4">
              <BookOpen className="w-4 h-4 text-[#0A0A0B]" />
              <span>Knowledge Base</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {DOC_GUIDES.map((guide, idx) => (
                <Surface3D key={guide.title} intensity={11} delay={idx * 0.05}>
                  <article className="p-6 h-full">
                    <div className="text-xs font-semibold text-neutral-500">{guide.category}</div>
                    <h2 className="mt-2 text-base font-bold text-[#0A0A0B]">{guide.title}</h2>
                    <p className="mt-2 text-xs text-neutral-600 leading-relaxed">{guide.summary}</p>
                  </article>
                </Surface3D>
              ))}
            </div>
          </div>

          {/* Ticket Creation + Thread Desk */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 items-start">
            <Surface3D intensity={6} delay={0.04}>
              <div className="p-7 md:p-8">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
                  <LifeBuoy className="w-4 h-4 text-[#0A0A0B]" />
                  <span>New Ticket</span>
                </div>
                <h2 className="mt-2 text-2xl font-bold text-[#0A0A0B]">Submit Support Ticket</h2>

                {createdTicket ? (
                  <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-5 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-emerald-700 text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Ticket {createdTicket.id} Opened</span>
                    </div>
                    <p className="text-neutral-700">
                      Subject: <strong>{createdTicket.subject}</strong> · Priority:{' '}
                      <span className="font-bold capitalize text-[#0A0A0B]">
                        {createdTicket.priority}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setCreatedTicket(null)}
                      className="mt-2 px-4 py-1.5 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg cursor-pointer"
                    >
                      Open Another Ticket
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateTicket} className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                          Name
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                          Account Email
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                          Category
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                        >
                          <option>Cloud Infrastructure</option>
                          <option>Billing &amp; Invoices</option>
                          <option>Shop Orders</option>
                          <option>Studio Projects</option>
                          <option>Account &amp; Security</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                          Priority
                        </label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                        >
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent (Production Down)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                        Subject
                      </label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Short summary of your request"
                        className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                        Details
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Include server ID, order ID, or steps to reproduce..."
                        className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black resize-y"
                      />
                    </div>

                    <label className="flex items-center justify-between gap-3 rounded-lg bg-[#F8F8FA] border border-dashed border-black/20 px-3.5 py-2 text-xs text-neutral-600 cursor-pointer">
                      <span className="inline-flex items-center gap-2 truncate">
                        <Upload className="w-4 h-4 text-[#0A0A0B] shrink-0" />
                        <span className="truncate">
                          {attachmentName || 'Attach diagnostic log filename'}
                        </span>
                      </span>
                      <input type="file" onChange={handleFile} className="sr-only" />
                    </label>

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
                      <span>Open Support Ticket</span>
                    </button>
                  </form>
                )}
              </div>
            </Surface3D>

            {/* Active Tickets */}
            <Surface3D intensity={6} delay={0.1}>
              <div className="p-7 md:p-8 space-y-5">
                <div className="pb-4 border-b border-black/[0.08]">
                  <div className="text-xs font-semibold text-neutral-500">Ticket History</div>
                  <h2 className="mt-1 text-xl font-bold text-[#0A0A0B]">
                    Your Open Conversations
                  </h2>
                </div>

                {!user ? (
                  <div className="py-10 text-center space-y-3">
                    <p className="text-xs text-neutral-600">
                      Sign in to view ticket replies and communicate with support staff.
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('auth')}
                      className="px-5 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                ) : tickets.length === 0 ? (
                  <p className="py-10 text-center text-xs text-neutral-600">
                    No support tickets filed under{' '}
                    <span className="font-semibold text-[#0A0A0B]">{user.email}</span>.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {tickets.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setActiveTicketId(t.id)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                            t.id === activeTicketId
                              ? 'bg-[#0A0A0B] text-white border-[#0A0A0B]'
                              : 'bg-[#F8F8FA] text-neutral-700 border-black/[0.1]'
                          }`}
                        >
                          {t.subject}
                        </button>
                      ))}
                    </div>

                    {activeTicket && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs font-semibold bg-[#0A0A0C] text-white rounded-lg px-3.5 py-2">
                          <span>{activeTicket.category}</span>
                          <span className="text-neutral-200 capitalize">
                            {activeTicket.status} · {activeTicket.priority}
                          </span>
                        </div>

                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                          {activeReplies.map((r) => (
                            <div
                              key={r.id}
                              className="rounded-lg bg-[#F8F8FA] border border-black/[0.08] p-3 text-xs"
                            >
                              <div className="flex items-center justify-between text-neutral-500">
                                <span className="font-semibold text-[#0A0A0B]">
                                  {r.sender_name}{' '}
                                  <span className="font-medium text-neutral-600">
                                    ({r.sender_role})
                                  </span>
                                </span>
                                <span className="tabular-nums">
                                  {new Date(r.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="mt-1.5 text-neutral-700">{r.body}</p>
                            </div>
                          ))}
                        </div>

                        <form onSubmit={handleSendReply} className="flex gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Add a reply to this ticket..."
                            className="flex-1 rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3 py-2 text-xs text-[#0A0A0B] focus:outline-none focus:border-black"
                          />
                          <button
                            type="submit"
                            disabled={sendingReply}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Reply</span>
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Surface3D>
          </div>

          {/* Live CMS FAQs */}
          {faqs.length > 0 && (
            <div className="pt-8 border-t border-black/[0.08]">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 mb-4">
                <HelpCircle className="w-4 h-4 text-[#0A0A0B]" />
                <span>Frequently Asked Questions</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {faqs.map((faq, idx) => (
                  <Surface3D key={faq.id} intensity={11} delay={idx * 0.05}>
                    <div className="p-6 h-full">
                      <div className="text-xs font-semibold text-neutral-500">{faq.category}</div>
                      <h3 className="mt-1.5 text-sm font-bold text-[#0A0A0B]">{faq.question}</h3>
                      <p className="mt-2 text-xs text-neutral-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </Surface3D>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
