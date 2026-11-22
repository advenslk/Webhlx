import {
  Activity,
  BarChart3,
  Briefcase,
  Database,
  FileText,
  FolderKanban,
  Globe,
  KeyRound,
  LifeBuoy,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Unlock,
  Users,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Surface3D } from '../components/Surface3D';
import { useAppContext, type UserRole } from '../context/AppContext';
import { ApiError, apiRequest } from '../lib/api';
import { PageRoute } from '../types/navigation';

interface AdminOverview {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalOrders: number;
    totalRevenue: number;
    activeServers: number;
    pendingProjects: number;
    openTickets: number;
    activeSessionsCount?: number;
    lockedAccountsCount?: number;
  };
  users: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: string;
    email_verified: number;
    totp_enabled?: number;
    last_login_at?: string;
    last_login_ip?: string;
    created_at: string;
  }[];
  plans: {
    id: string;
    name: string;
    category: string;
    cpu: string;
    ram_gb: number;
    price_monthly_usd: number;
    hzl_cost: number;
  }[];
  servers: {
    id: string;
    user_id: string;
    name: string;
    node_name: string;
    pterodactyl_identifier: string;
    status: string;
    location: string;
  }[];
  projects: {
    id: string;
    client_name: string;
    client_email: string;
    service_type: string;
    title: string;
    status: string;
    admin_notes: string;
  }[];
  products: {
    id: string;
    name: string;
    category: string;
    price_usd: number;
    stock: number;
    active: number;
  }[];
  orders: {
    id: string;
    customer_email: string;
    total_usd: number;
    status: string;
    payment_status: string;
    created_at: string;
  }[];
  coupons: {
    id: string;
    code: string;
    discount_percent: number;
    used_count: number;
    max_uses: number;
  }[];
  invoices: {
    id: string;
    invoice_number: string;
    amount_usd: number;
    status: string;
    issued_at: string;
  }[];
  tickets: {
    id: string;
    email: string;
    subject: string;
    priority: string;
    status: string;
  }[];
  partners: {
    id: string;
    company_name: string;
    email: string;
    referral_code: string;
    commission_rate: number;
    status: string;
  }[];
  careers: {
    id: string;
    position_title: string;
    applicant_name: string;
    email: string;
    status: string;
  }[];
  earlyAccess: {
    id: string;
    full_name: string;
    email: string;
    email_verified: number;
    eligibility_status: string;
    slot_number: number | null;
  }[];
  blogPosts: {
    id: string;
    title: string;
    category: string;
    status: string;
    published_at: string;
  }[];
  announcements: {
    id: string;
    title: string;
    body: string;
    type: string;
  }[];
  faqs: {
    id: string;
    category: string;
    question: string;
  }[];
  inquiries: {
    id: string;
    name: string;
    email: string;
    scope: string;
    brief: string;
    created_at: string;
  }[];
  auditLogs: {
    id: string;
    actor_email: string;
    action: string;
    target_type: string;
    target_id: string;
    details: string;
    created_at: string;
  }[];
  pterodactyl: {
    configured: boolean;
    panelUrl: string | null;
    requiredEnvVars: string[];
  };
}

interface SecurityCenterOverview {
  overview: {
    status: 'HARDENED' | 'ELEVATED' | 'EMERGENCY';
    highSeverityEvents: number;
    totalSecurityEvents: number;
    activeSessionsCount: number;
    lockedAccountsCount: number;
    mfaEnabledUsers: number;
    totalUsers: number;
  };
  websiteProtection: {
    cspActive: boolean;
    hstsReady: boolean;
    nosniffActive: boolean;
    antiAbuseActive: boolean;
    turnstileConfigured: boolean;
    cloudflareProxyDetected: boolean;
    devtoolsDeterrence: boolean;
  };
  apiSecurity: {
    startedAt: string;
    totalApiRequests: number;
    blockedProbeRequests: number;
    rateLimitTriggered: number;
    unauthorizedAttempts: number;
    activeRateLimitBuckets: number;
  };
  infrastructure: {
    nodeVersion: string;
    nodeEnv: string;
    dbJournalMode: string;
    foreignKeysEnforced: boolean;
    pterodactylIsolated: boolean;
    backups: { name: string; sizeBytes: number; createdAt: string }[];
  };
  controls: {
    maintenanceLockdown: boolean;
    loginRestriction: boolean;
    apiEmergencyReadOnly: boolean;
    emergencySecurityMode: boolean;
    requireAdminMfa: boolean;
    devtoolsDeterrence: boolean;
  };
  activeSessions: {
    id: string;
    user_id: string;
    ip_address: string;
    user_agent: string;
    created_at: string;
    last_seen_at: string;
    expires_at: string;
    user_email: string;
    user_role: string;
  }[];
  lockedAccounts: {
    email: string;
    failed_attempts: number;
    locked_until: string;
    last_failed_at: string;
  }[];
  securityEvents: {
    id: string;
    event_type: string;
    severity: string;
    ip_address: string;
    actor_email: string;
    path: string;
    details: string;
    created_at: string;
  }[];
  auditLogs: AdminOverview['auditLogs'];
}

type AdminTab =
  | 'overview'
  | 'security_center'
  | 'users'
  | 'cloud'
  | 'shop'
  | 'studio_support'
  | 'growth'
  | 'cms';

interface AdminPageProps {
  onNavigate: (route: PageRoute) => void;
}

export function AdminPage({ onNavigate }: AdminPageProps) {
  const { user, isAdminRole, siteData, refreshSiteData } = useAppContext();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [securityOverview, setSecurityOverview] = useState<SecurityCenterOverview | null>(null);
  const [securityAccessNote, setSecurityAccessNote] = useState<string | null>(null);
  const [confirmEmergency, setConfirmEmergency] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Create forms state
  const [planName, setPlanName] = useState('');
  const [planCat, setPlanCat] = useState('Minecraft');
  const [planCpu, setPlanCpu] = useState('4 vCPU EPYC');
  const [planRam, setPlanRam] = useState('8');
  const [planPrice, setPlanPrice] = useState('14.00');

  const [prodName, setProdName] = useState('');
  const [prodCat, setProdCat] = useState('Hardware');
  const [prodPrice, setProdPrice] = useState('299');
  const [prodStock, setProdStock] = useState('25');
  const [prodSummary, setProdSummary] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [couponPct, setCouponPct] = useState('15');

  const [postTitle, setPostTitle] = useState('');
  const [postCat, setPostCat] = useState('Engineering');
  const [postExcerpt, setPostExcerpt] = useState('');
  const [postContent, setPostContent] = useState('');

  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');

  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');

  const [heroHeading, setHeroHeading] = useState(
    siteData?.settings?.general?.heroHeading || 'BUILD WITHOUT LIMITS.',
  );
  const [promoBanner, setPromoBanner] = useState(
    siteData?.settings?.general?.promoBanner || '',
  );

  const loadAdmin = useCallback(async () => {
    if (!user || !isAdminRole) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [overviewRes, secRes] = await Promise.allSettled([
        apiRequest<AdminOverview>('/api/admin/overview'),
        apiRequest<SecurityCenterOverview>('/api/admin/security/overview'),
      ]);
      if (overviewRes.status === 'fulfilled') {
        setOverview(overviewRes.value);
      } else {
        setFeedback(
          overviewRes.reason instanceof ApiError
            ? overviewRes.reason.message
            : 'Unable to load admin overview.',
        );
      }
      if (secRes.status === 'fulfilled') {
        setSecurityOverview(secRes.value);
        setSecurityAccessNote(null);
      } else {
        setSecurityOverview(null);
        setSecurityAccessNote(
          secRes.reason instanceof ApiError
            ? secRes.reason.message
            : 'Security Center requires Super Admin, Admin, or Security Admin permissions.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [user, isAdminRole]);

  useEffect(() => {
    void loadAdmin();
  }, [loadAdmin]);

  if (!user || !isAdminRole) {
    return (
      <div className="bg-[#F4F4F5] text-[#0A0A0B] min-h-[70vh] flex items-center justify-center px-6">
        <Surface3D intensity={5} className="max-w-md w-full">
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0A0A0B] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6 text-rose-400" />
            </div>
            <h1 className="text-2xl font-bold text-[#0A0A0B]">RBAC Admin Access Required</h1>
            <p className="text-sm text-neutral-600">
              This management console requires an authenticated Super Admin, Admin, or Staff account.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('auth')}
              className="w-full py-2.5 px-5 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg hover:bg-neutral-800 cursor-pointer"
            >
              Sign In / Claim Initial Admin
            </button>
          </div>
        </Surface3D>
      </div>
    );
  }

  const runAction = async (fn: () => Promise<unknown>, successMsg: string) => {
    setFeedback(null);
    try {
      await fn();
      setFeedback(successMsg);
      await loadAdmin();
      await refreshSiteData();
    } catch (err) {
      setFeedback(err instanceof ApiError ? err.message : 'Operation failed.');
    }
  };

  const handleCreatePlan = (e: FormEvent) => {
    e.preventDefault();
    void runAction(
      () =>
        apiRequest('/api/admin/cloud/plans', {
          method: 'POST',
          body: JSON.stringify({
            name: planName,
            category: planCat,
            cpu: planCpu,
            ram_gb: Number(planRam),
            storage_gb: 60,
            price_monthly_usd: Number(planPrice),
            hzl_cost: Math.round(Number(planPrice) * 35),
          }),
        }).then(() => setPlanName('')),
      'Hosting plan created.',
    );
  };

  const handleCreateProduct = (e: FormEvent) => {
    e.preventDefault();
    void runAction(
      () =>
        apiRequest('/api/admin/shop/products', {
          method: 'POST',
          body: JSON.stringify({
            name: prodName,
            category: prodCat,
            price_usd: Number(prodPrice),
            stock: Number(prodStock),
            summary: prodSummary,
          }),
        }).then(() => {
          setProdName('');
          setProdSummary('');
        }),
      'Product added to Shop catalog.',
    );
  };

  const handleCreateCoupon = (e: FormEvent) => {
    e.preventDefault();
    void runAction(
      () =>
        apiRequest('/api/admin/shop/coupons', {
          method: 'POST',
          body: JSON.stringify({ code: couponCode, discount_percent: Number(couponPct) }),
        }).then(() => setCouponCode('')),
      'Coupon code created.',
    );
  };

  const handleCreatePost = (e: FormEvent) => {
    e.preventDefault();
    void runAction(
      () =>
        apiRequest('/api/admin/blog/posts', {
          method: 'POST',
          body: JSON.stringify({
            title: postTitle,
            category: postCat,
            excerpt: postExcerpt,
            content: postContent,
            status: 'published',
          }),
        }).then(() => {
          setPostTitle('');
          setPostExcerpt('');
          setPostContent('');
        }),
      'Blog article published.',
    );
  };

  const handleCreateAnnouncement = (e: FormEvent) => {
    e.preventDefault();
    void runAction(
      () =>
        apiRequest('/api/admin/announcements', {
          method: 'POST',
          body: JSON.stringify({ title: annTitle, body: annBody, type: 'launch' }),
        }).then(() => {
          setAnnTitle('');
          setAnnBody('');
        }),
      'Announcement published.',
    );
  };

  const handleCreateFaq = (e: FormEvent) => {
    e.preventDefault();
    void runAction(
      () =>
        apiRequest('/api/admin/faqs', {
          method: 'POST',
          body: JSON.stringify({ category: 'General', question: faqQ, answer: faqA }),
        }).then(() => {
          setFaqQ('');
          setFaqA('');
        }),
      'FAQ entry added.',
    );
  };

  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    const current = siteData?.settings?.general || {
      companyName: 'HelzerX Technologies',
      domain: 'helzerx.cyou',
      launchDate: '2027-01-01T00:00:00Z',
      heroDescription:
        'Powering the next generation of digital experiences through innovative technology, reliable infrastructure, and creative solutions.',
      supportEmail: 'support@helzerx.cyou',
      salesEmail: 'hello@helzerx.cyou',
    };
    void runAction(
      () =>
        apiRequest('/api/admin/settings', {
          method: 'PATCH',
          body: JSON.stringify({
            key: 'general',
            value: { ...current, heroHeading, promoBanner },
          }),
        }),
      'Site settings updated.',
    );
  };

  const handleToggleSecurityControl = (
    key: keyof SecurityCenterOverview['controls'],
    value: boolean,
    label: string,
  ) => {
    if (!confirmEmergency) {
      setFeedback('Check the Emergency Action Confirmation box in Section G before applying control changes.');
      return;
    }
    void runAction(
      () =>
        apiRequest('/api/admin/security/controls', {
          method: 'PATCH',
          body: JSON.stringify({ [key]: value, confirmAction: true }),
        }),
      `${label} ${value ? 'enabled' : 'disabled'}.`,
    );
  };

  const handleGlobalRevokeSessions = () => {
    if (!confirmEmergency) {
      setFeedback('Check the Emergency Action Confirmation box before revoking all platform sessions.');
      return;
    }
    void runAction(
      () =>
        apiRequest('/api/admin/security/revoke-all-sessions', {
          method: 'POST',
          body: JSON.stringify({ confirmAction: true }),
        }),
      'Revoked all other active sessions across HelzerX.',
    );
  };

  const handleCreateEncryptedBackup = async () => {
    setCreatingBackup(true);
    setFeedback(null);
    try {
      const res = await apiRequest<{
        ok: boolean;
        fileName: string;
        integrityOk: boolean;
        verifiedDecryption: boolean;
      }>('/api/admin/security/backup', { method: 'POST' });
      setFeedback(
        `Encrypted AES-256-GCM backup "${res.fileName}" created (SQLite integrity: ${res.integrityOk ? 'OK' : 'WARN'}, Decrypt verify: ${res.verifiedDecryption ? 'OK' : 'FAIL'}).`,
      );
      await loadAdmin();
    } catch (err) {
      setFeedback(err instanceof ApiError ? err.message : 'Backup creation failed.');
    } finally {
      setCreatingBackup(false);
    }
  };

  const tabs: { id: AdminTab; label: string; icon: typeof BarChart3 }[] = [
    { id: 'overview', label: 'Analytics & Audit', icon: BarChart3 },
    { id: 'security_center', label: 'Security Center', icon: ShieldCheck },
    { id: 'users', label: 'Users & RBAC', icon: Users },
    { id: 'cloud', label: 'Cloud & Pterodactyl', icon: Server },
    { id: 'shop', label: 'Shop, Orders & Coupons', icon: ShoppingBag },
    { id: 'studio_support', label: 'Studio & Support', icon: FolderKanban },
    { id: 'growth', label: 'Launch 2027, Partners & Staff', icon: Sparkles },
    { id: 'cms', label: 'Blog, CMS & Settings', icon: FileText },
  ];

  const cardClass =
    'rounded-2xl bg-white border border-black/[0.08] shadow-[0_14px_40px_-15px_rgba(10,10,11,0.08)] p-6';
  const rowClass = 'rounded-xl bg-[#F8F8FA] border border-black/[0.08] p-3.5 text-xs';
  const inputClass =
    'w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3 py-2 text-xs text-[#0A0A0B] focus:outline-none focus:border-black';
  const selectClass =
    'rounded bg-white border border-black/[0.15] px-2.5 py-1 text-xs text-[#0A0A0B] focus:outline-none focus:border-black';

  return (
    <div className="bg-[#F4F4F5] text-[#0A0A0B] min-h-screen py-10">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-black/[0.08]">
          <div>
            <div className="text-xs font-semibold text-neutral-500 capitalize">
              HelzerX Admin Console · {user.role.replace(/_/g, ' ')}
            </div>
            <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-[#0A0A0B] tracking-tight">
              Enterprise Operations &amp; CMS
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void loadAdmin()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0A0A0B] bg-white border border-black/15 rounded-lg hover:border-black/35 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync All</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div className="rounded-xl bg-[#0A0A0C] text-white border border-black px-4 py-3 text-xs font-medium shadow-sm">
            {feedback}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pb-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0A0A0B] text-white border-[#0A0A0B]'
                    : 'bg-white text-neutral-700 border-black/[0.1] hover:border-black/30'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {loading || !overview ? (
          <div className="py-16 flex items-center justify-center gap-2 text-sm text-neutral-600">
            <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0B]" />
            <span>Loading enterprise management records...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 1. OVERVIEW & AUDIT */}
            {tab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <Surface3D intensity={12} delay={0.03}>
                    <div className="p-5">
                      <div className="text-xs text-neutral-600">Total Users</div>
                      <div className="mt-2 text-2xl font-extrabold tracking-tight text-[#0A0A0B] tabular-nums">
                        {overview.metrics.totalUsers}
                      </div>
                    </div>
                  </Surface3D>
                  <Surface3D intensity={12} delay={0.06}>
                    <div className="p-5">
                      <div className="text-xs text-neutral-600">Paid Revenue</div>
                      <div className="mt-2 text-2xl font-extrabold tracking-tight text-emerald-700 tabular-nums">
                        ${overview.metrics.totalRevenue.toLocaleString()}
                      </div>
                    </div>
                  </Surface3D>
                  <Surface3D intensity={12} delay={0.09}>
                    <div className="p-5">
                      <div className="text-xs text-neutral-600">Total Orders</div>
                      <div className="mt-2 text-2xl font-extrabold tracking-tight text-[#0A0A0B] tabular-nums">
                        {overview.metrics.totalOrders}
                      </div>
                    </div>
                  </Surface3D>
                  <Surface3D intensity={12} delay={0.12}>
                    <div className="p-5">
                      <div className="text-xs text-neutral-600">Active Servers</div>
                      <div className="mt-2 text-2xl font-extrabold tracking-tight text-[#0A0A0B] tabular-nums">
                        {overview.metrics.activeServers}
                      </div>
                    </div>
                  </Surface3D>
                  <Surface3D intensity={12} delay={0.15}>
                    <div className="p-5">
                      <div className="text-xs text-neutral-600">Studio Queue</div>
                      <div className="mt-2 text-2xl font-extrabold tracking-tight text-[#0A0A0B] tabular-nums">
                        {overview.metrics.pendingProjects}
                      </div>
                    </div>
                  </Surface3D>
                  <Surface3D intensity={12} delay={0.18}>
                    <div className="p-5">
                      <div className="text-xs text-neutral-600">Open Tickets</div>
                      <div className="mt-2 text-2xl font-extrabold tracking-tight text-amber-700 tabular-nums">
                        {overview.metrics.openTickets}
                      </div>
                    </div>
                  </Surface3D>
                </div>

                <div className={`${cardClass} space-y-4`}>
                  <h2 className="text-base font-bold text-[#0A0A0B] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#0A0A0B]" />
                    <span>Security Audit Logs</span>
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-neutral-500 border-b border-black/[0.08]">
                        <tr>
                          <th className="py-2 pr-4">Action</th>
                          <th className="py-2 pr-4">Actor</th>
                          <th className="py-2 pr-4">Target</th>
                          <th className="py-2 pr-4">Details</th>
                          <th className="py-2">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.06] tabular-nums">
                        {overview.auditLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="py-2 pr-4 font-semibold text-[#0A0A0B]">
                              {log.action}
                            </td>
                            <td className="py-2 pr-4 text-[#0A0A0B]">{log.actor_email}</td>
                            <td className="py-2 pr-4 text-neutral-600">
                              {log.target_type}:{log.target_id}
                            </td>
                            <td className="py-2 pr-4 text-neutral-700">{log.details}</td>
                            <td className="py-2 text-neutral-500">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 1B. HELZERX SECURITY CENTER (SECTIONS A-G) */}
            {tab === 'security_center' && (
              <div className="space-y-6">
                {!securityOverview ? (
                  <div className={`${cardClass} text-xs text-neutral-700`}>
                    {securityAccessNote || 'Security Center telemetry requires security:read permission.'}
                  </div>
                ) : (
                  <>
                    {/* A. OVERVIEW */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-base font-bold text-[#0A0A0B] flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#0A0A0B]" />
                          <span>A. Security Posture Overview</span>
                        </h2>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide ${
                            securityOverview.overview.status === 'EMERGENCY'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : securityOverview.overview.status === 'ELEVATED'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          STATUS: {securityOverview.overview.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <Surface3D intensity={10}>
                          <div className="p-4">
                            <div className="text-[11px] text-neutral-600">High Severity Events</div>
                            <div className="mt-1.5 text-2xl font-extrabold text-rose-700 tabular-nums">
                              {securityOverview.overview.highSeverityEvents}
                            </div>
                          </div>
                        </Surface3D>
                        <Surface3D intensity={10}>
                          <div className="p-4">
                            <div className="text-[11px] text-neutral-600">Total Security Events</div>
                            <div className="mt-1.5 text-2xl font-extrabold text-[#0A0A0B] tabular-nums">
                              {securityOverview.overview.totalSecurityEvents}
                            </div>
                          </div>
                        </Surface3D>
                        <Surface3D intensity={10}>
                          <div className="p-4">
                            <div className="text-[11px] text-neutral-600">Active Sessions</div>
                            <div className="mt-1.5 text-2xl font-extrabold text-[#0A0A0B] tabular-nums">
                              {securityOverview.overview.activeSessionsCount}
                            </div>
                          </div>
                        </Surface3D>
                        <Surface3D intensity={10}>
                          <div className="p-4">
                            <div className="text-[11px] text-neutral-600">Locked Accounts</div>
                            <div className="mt-1.5 text-2xl font-extrabold text-amber-700 tabular-nums">
                              {securityOverview.overview.lockedAccountsCount}
                            </div>
                          </div>
                        </Surface3D>
                        <Surface3D intensity={10}>
                          <div className="p-4">
                            <div className="text-[11px] text-neutral-600">TOTP MFA Users</div>
                            <div className="mt-1.5 text-2xl font-extrabold text-emerald-700 tabular-nums">
                              {securityOverview.overview.mfaEnabledUsers} / {securityOverview.overview.totalUsers}
                            </div>
                          </div>
                        </Surface3D>
                        <Surface3D intensity={10}>
                          <div className="p-4">
                            <div className="text-[11px] text-neutral-600">Encrypted Backups</div>
                            <div className="mt-1.5 text-2xl font-extrabold text-[#0A0A0B] tabular-nums">
                              {securityOverview.infrastructure.backups.length}
                            </div>
                          </div>
                        </Surface3D>
                      </div>
                    </div>

                    {/* B. WEBSITE PROTECTION & C. API SECURITY */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className={`${cardClass} space-y-4`}>
                        <h3 className="text-sm font-bold text-[#0A0A0B] flex items-center gap-2">
                          <Globe className="w-4 h-4 text-[#0A0A0B]" />
                          <span>B. Website Protection &amp; Edge Headers</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                          {[
                            ['Strict CSP Policy', securityOverview.websiteProtection.cspActive],
                            ['HSTS Transport Guard', securityOverview.websiteProtection.hstsReady],
                            ['X-Content-Type nosniff', securityOverview.websiteProtection.nosniffActive],
                            ['Anti-Abuse Path/XSS Shield', securityOverview.websiteProtection.antiAbuseActive],
                            ['Cloudflare Turnstile Gate', securityOverview.websiteProtection.turnstileConfigured],
                            ['Cloudflare CF-Ray Proxy', securityOverview.websiteProtection.cloudflareProxyDetected],
                          ].map(([label, enabled]) => (
                            <div
                              key={String(label)}
                              className="rounded-xl bg-[#F8F8FA] border border-black/[0.08] px-3 py-2.5 flex items-center justify-between gap-2"
                            >
                              <span className="font-medium text-[#0A0A0B]">{label}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  enabled
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-neutral-200 text-neutral-700'
                                }`}
                              >
                                {enabled ? 'ACTIVE' : 'PENDING'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={`${cardClass} space-y-4`}>
                        <h3 className="text-sm font-bold text-[#0A0A0B] flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#0A0A0B]" />
                          <span>C. API Security Telemetry (Since Boot)</span>
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                          <div className={rowClass}>
                            <div className="text-neutral-500">Total API Calls</div>
                            <div className="mt-1 text-lg font-extrabold text-[#0A0A0B] tabular-nums">
                              {securityOverview.apiSecurity.totalApiRequests}
                            </div>
                          </div>
                          <div className={rowClass}>
                            <div className="text-neutral-500">Blocked Probes</div>
                            <div className="mt-1 text-lg font-extrabold text-rose-700 tabular-nums">
                              {securityOverview.apiSecurity.blockedProbeRequests}
                            </div>
                          </div>
                          <div className={rowClass}>
                            <div className="text-neutral-500">429 Rate Limits</div>
                            <div className="mt-1 text-lg font-extrabold text-amber-700 tabular-nums">
                              {securityOverview.apiSecurity.rateLimitTriggered}
                            </div>
                          </div>
                          <div className={rowClass}>
                            <div className="text-neutral-500">401/403 Denied</div>
                            <div className="mt-1 text-lg font-extrabold text-[#0A0A0B] tabular-nums">
                              {securityOverview.apiSecurity.unauthorizedAttempts}
                            </div>
                          </div>
                          <div className={rowClass}>
                            <div className="text-neutral-500">Limiter Buckets</div>
                            <div className="mt-1 text-lg font-extrabold text-[#0A0A0B] tabular-nums">
                              {securityOverview.apiSecurity.activeRateLimitBuckets}
                            </div>
                          </div>
                          <div className={rowClass}>
                            <div className="text-neutral-500">Server Boot</div>
                            <div className="mt-1 text-[11px] font-semibold text-[#0A0A0B] tabular-nums">
                              {new Date(securityOverview.apiSecurity.startedAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* D. USER SECURITY (ACTIVE SESSIONS + LOCKED ACCOUNTS) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className={`${cardClass} space-y-3`}>
                        <h3 className="text-sm font-bold text-[#0A0A0B] flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-[#0A0A0B]" />
                          <span>D. Active Platform Sessions ({securityOverview.activeSessions.length})</span>
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {securityOverview.activeSessions.map((ses) => (
                            <div
                              key={ses.id}
                              className={`${rowClass} flex items-center justify-between gap-2`}
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-[#0A0A0B] truncate">
                                  {ses.user_email} · <span className="capitalize">{ses.user_role.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="text-neutral-600 font-mono text-[11px] truncate">
                                  {ses.ip_address} · {ses.user_agent}
                                </div>
                              </div>
                              <span className="text-[11px] text-neutral-500 tabular-nums shrink-0">
                                {new Date(ses.last_seen_at).toLocaleTimeString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={`${cardClass} space-y-3`}>
                        <h3 className="text-sm font-bold text-[#0A0A0B] flex items-center gap-2">
                          <Lock className="w-4 h-4 text-[#0A0A0B]" />
                          <span>D. Brute-Force Locked Accounts ({securityOverview.lockedAccounts.length})</span>
                        </h3>
                        {securityOverview.lockedAccounts.length === 0 ? (
                          <p className="text-xs text-neutral-600">
                            No accounts are currently locked due to failed password attempts.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {securityOverview.lockedAccounts.map((acc) => (
                              <div
                                key={acc.email}
                                className={`${rowClass} flex items-center justify-between gap-2`}
                              >
                                <div>
                                  <div className="font-bold text-[#0A0A0B]">{acc.email}</div>
                                  <div className="text-neutral-600 tabular-nums">
                                    {acc.failed_attempts} failed attempts · Until{' '}
                                    {new Date(acc.locked_until).toLocaleTimeString()}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void runAction(
                                      () =>
                                        apiRequest('/api/admin/security/unlock-account', {
                                          method: 'POST',
                                          body: JSON.stringify({ email: acc.email }),
                                        }),
                                      `Unlocked ${acc.email}`,
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#0A0A0B] bg-white border border-black/15 rounded hover:border-black/35 cursor-pointer"
                                >
                                  <Unlock className="w-3 h-3" />
                                  <span>Unlock</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* E. INFRASTRUCTURE & ENCRYPTED BACKUPS */}
                    <div className={`${cardClass} space-y-4`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-[#0A0A0B] flex items-center gap-2">
                          <Database className="w-4 h-4 text-[#0A0A0B]" />
                          <span>E. Infrastructure Hardening &amp; AES-256-GCM Database Backups</span>
                        </h3>
                        <button
                          type="button"
                          disabled={creatingBackup}
                          onClick={() => void handleCreateEncryptedBackup()}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg hover:bg-neutral-800 cursor-pointer disabled:opacity-60"
                        >
                          {creatingBackup ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          <span>Run Integrity Check &amp; Encrypted Backup</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className={rowClass}>
                          <div className="text-neutral-500">Node Runtime</div>
                          <div className="mt-1 font-bold text-[#0A0A0B] font-mono">
                            {securityOverview.infrastructure.nodeVersion} ({securityOverview.infrastructure.nodeEnv})
                          </div>
                        </div>
                        <div className={rowClass}>
                          <div className="text-neutral-500">SQLite Journal / FK</div>
                          <div className="mt-1 font-bold text-[#0A0A0B] uppercase">
                            {securityOverview.infrastructure.dbJournalMode} · FK{' '}
                            {securityOverview.infrastructure.foreignKeysEnforced ? 'ON' : 'OFF'}
                          </div>
                        </div>
                        <div className={rowClass}>
                          <div className="text-neutral-500">Pterodactyl Key Isolation</div>
                          <div className="mt-1 font-bold text-[#0A0A0B]">
                            {securityOverview.infrastructure.pterodactylIsolated
                              ? 'Server-Only Isolated'
                              : 'Not Configured'}
                          </div>
                        </div>
                        <div className={rowClass}>
                          <div className="text-neutral-500">Stored .hxbk Backups</div>
                          <div className="mt-1 font-bold text-[#0A0A0B] tabular-nums">
                            {securityOverview.infrastructure.backups.length} verified archives
                          </div>
                        </div>
                      </div>

                      {securityOverview.infrastructure.backups.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {securityOverview.infrastructure.backups.map((bk) => (
                            <div
                              key={bk.name}
                              className="rounded-lg bg-[#F8F8FA] border border-black/[0.08] px-3 py-2 flex items-center justify-between gap-2 font-mono text-[11px]"
                            >
                              <span className="truncate text-[#0A0A0B]">{bk.name}</span>
                              <span className="text-neutral-600 shrink-0 tabular-nums">
                                {(bk.sizeBytes / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* F. AUDIT & THREAT LOGS */}
                    <div className={`${cardClass} space-y-3`}>
                      <h3 className="text-sm font-bold text-[#0A0A0B] flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-[#0A0A0B]" />
                        <span>F. Real-Time Security Events &amp; Threat Feed</span>
                      </h3>
                      <div className="overflow-x-auto max-h-80 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-neutral-500 border-b border-black/[0.08]">
                            <tr>
                              <th className="py-2 pr-3">Severity</th>
                              <th className="py-2 pr-3">Event</th>
                              <th className="py-2 pr-3">Actor / IP</th>
                              <th className="py-2 pr-3">Details</th>
                              <th className="py-2">Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/[0.06] tabular-nums">
                            {securityOverview.securityEvents.map((ev) => (
                              <tr key={ev.id}>
                                <td className="py-2 pr-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      ev.severity === 'high'
                                        ? 'bg-rose-100 text-rose-800'
                                        : ev.severity === 'warning'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-neutral-100 text-neutral-700'
                                    }`}
                                  >
                                    {ev.severity}
                                  </span>
                                </td>
                                <td className="py-2 pr-3 font-semibold text-[#0A0A0B]">{ev.event_type}</td>
                                <td className="py-2 pr-3 font-mono text-[11px] text-neutral-700">
                                  {ev.actor_email || 'anonymous'} ({ev.ip_address})
                                </td>
                                <td className="py-2 pr-3 text-neutral-700">{ev.details}</td>
                                <td className="py-2 text-neutral-500">
                                  {new Date(ev.created_at).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* G. EMERGENCY CONTROLS */}
                    <div className={`${cardClass} border-rose-200 space-y-4`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-[#0A0A0B]">
                            G. Emergency Platform Security Controls
                          </h3>
                          <p className="text-xs text-neutral-600 mt-0.5">
                            Every toggle enforces immediate server-side middleware restrictions and logs an admin audit trail.
                          </p>
                        </div>
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={confirmEmergency}
                            onChange={(e) => setConfirmEmergency(e.target.checked)}
                          />
                          <span>Confirm emergency security action</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(
                          [
                            ['maintenanceLockdown', 'Maintenance Lockdown', 'Pause non-admin API traffic'],
                            ['loginRestriction', 'Temporary Login Restriction', 'Pause customer logins & signups'],
                            ['apiEmergencyReadOnly', 'API Emergency Read-Only', 'Block non-admin API mutations'],
                            ['emergencySecurityMode', 'Emergency Rate Tightening', 'Halve API rate-limit bursts'],
                            ['requireAdminMfa', 'Admin MFA Policy Flag', 'Enforce admin TOTP policy'],
                            ['devtoolsDeterrence', 'Optional Context Deterrence', 'Deter casual page context menu'],
                          ] as [keyof SecurityCenterOverview['controls'], string, string][]
                        ).map(([ctrlKey, title, desc]) => {
                          const enabled = securityOverview.controls[ctrlKey];
                          return (
                            <div
                              key={ctrlKey}
                              className="rounded-xl bg-[#F8F8FA] border border-black/[0.08] p-3.5 flex items-center justify-between gap-3"
                            >
                              <div>
                                <div className="text-xs font-bold text-[#0A0A0B]">{title}</div>
                                <div className="text-[11px] text-neutral-600">{desc}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleSecurityControl(ctrlKey, !enabled, title)
                                }
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer shrink-0 ${
                                  enabled
                                    ? 'bg-rose-700 text-white'
                                    : 'bg-white border border-black/15 text-[#0A0A0B] hover:border-black/35'
                                }`}
                              >
                                {enabled ? 'ACTIVE' : 'OFF'}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-black/[0.08] flex justify-end">
                        <button
                          type="button"
                          onClick={handleGlobalRevokeSessions}
                          className="px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer"
                        >
                          Force Revoke All Other Active Sessions
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 2. USERS & RBAC */}
            {tab === 'users' && (
              <div className={`${cardClass} space-y-4`}>
                <h2 className="text-lg font-bold text-[#0A0A0B]">
                  Registered Users &amp; RBAC Roles
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-neutral-500 border-b border-black/[0.08]">
                      <tr>
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Email</th>
                        <th className="py-2 pr-4">Verified / MFA</th>
                        <th className="py-2 pr-4">Role</th>
                        <th className="py-2 pr-4">Account Status</th>
                        <th className="py-2">Sessions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.06]">
                      {overview.users.map((u) => (
                        <tr key={u.id}>
                          <td className="py-2.5 pr-4 font-bold text-[#0A0A0B]">{u.name}</td>
                          <td className="py-2.5 pr-4 text-neutral-700">{u.email}</td>
                          <td className="py-2.5 pr-4 font-semibold text-[#0A0A0B]">
                            {u.email_verified ? 'Email OK' : 'Unverified'} ·{' '}
                            {u.totp_enabled ? 'MFA ON' : 'No MFA'}
                          </td>
                          <td className="py-2.5 pr-4">
                            <select
                              value={u.role}
                              disabled={user.role !== 'super_admin'}
                              onChange={(e) =>
                                void runAction(
                                  () =>
                                    apiRequest(`/api/admin/users/${u.id}`, {
                                      method: 'PATCH',
                                      body: JSON.stringify({ role: e.target.value }),
                                    }),
                                  `Updated role for ${u.email}`,
                                )
                              }
                              className={selectClass}
                            >
                              <option value="customer">customer</option>
                              <option value="partner">partner</option>
                              <option value="staff">staff</option>
                              <option value="moderator">moderator</option>
                              <option value="support_manager">support_manager</option>
                              <option value="finance_manager">finance_manager</option>
                              <option value="security_admin">security_admin</option>
                              <option value="admin">admin</option>
                              <option value="super_admin">super_admin</option>
                            </select>
                          </td>
                          <td className="py-2.5 pr-4">
                            <select
                              value={u.status}
                              onChange={(e) =>
                                void runAction(
                                  () =>
                                    apiRequest(`/api/admin/users/${u.id}`, {
                                      method: 'PATCH',
                                      body: JSON.stringify({ status: e.target.value }),
                                    }),
                                  `Updated status for ${u.email}`,
                                )
                              }
                              className={selectClass}
                            >
                              <option value="active">active</option>
                              <option value="suspended">suspended</option>
                            </select>
                          </td>
                          <td className="py-2.5">
                            <button
                              type="button"
                              onClick={() =>
                                void runAction(
                                  () =>
                                    apiRequest(`/api/admin/users/${u.id}/revoke-sessions`, {
                                      method: 'POST',
                                    }),
                                  `Revoked active sessions for ${u.email}`,
                                )
                              }
                              className="px-2.5 py-1 text-[11px] font-semibold text-[#0A0A0B] bg-white border border-black/15 rounded hover:border-black/35 cursor-pointer"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. CLOUD & PTERODACTYL */}
            {tab === 'cloud' && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-[#0A0A0C] text-white border border-black p-6 flex flex-wrap items-center justify-between gap-4 text-xs shadow-lg">
                  <div>
                    <div className="font-semibold text-neutral-300">Pterodactyl Integration</div>
                    <div className="mt-1 text-sm font-bold text-white">
                      {overview.pterodactyl.configured
                        ? `Connected to ${overview.pterodactyl.panelUrl}`
                        : 'Configure PTERODACTYL_URL, PTERODACTYL_APP_API_KEY, and PTERODACTYL_CLIENT_API_KEY in server env'}
                    </div>
                  </div>
                  <span className="font-semibold px-3 py-1 rounded bg-white/10 text-amber-300">
                    {overview.pterodactyl.configured ? 'CONNECTED' : 'UNCONFIGURED'}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
                  <form onSubmit={handleCreatePlan} className={`${cardClass} space-y-3`}>
                    <h3 className="text-sm font-bold text-[#0A0A0B] flex items-center gap-2">
                      <Plus className="w-4 h-4 text-[#0A0A0B]" />
                      <span>Add Hosting Plan</span>
                    </h3>
                    <input
                      type="text"
                      required
                      placeholder="Plan Name"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      className={inputClass}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Category"
                        value={planCat}
                        onChange={(e) => setPlanCat(e.target.value)}
                        className={inputClass}
                      />
                      <input
                        type="text"
                        placeholder="CPU"
                        value={planCpu}
                        onChange={(e) => setPlanCpu(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="RAM GB"
                        value={planRam}
                        onChange={(e) => setPlanRam(e.target.value)}
                        className={inputClass}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price USD"
                        value={planPrice}
                        onChange={(e) => setPlanPrice(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg hover:bg-neutral-800 cursor-pointer"
                    >
                      Create Hosting Plan
                    </button>
                  </form>

                  <div className={`${cardClass} space-y-3`}>
                    <h3 className="text-sm font-bold text-[#0A0A0B]">Active Hosting Plans</h3>
                    {overview.plans.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-xs rounded-lg bg-[#F8F8FA] border border-black/[0.08] px-3.5 py-2.5"
                      >
                        <div>
                          <span className="font-bold text-[#0A0A0B]">{p.name}</span>{' '}
                          <span className="text-neutral-600 tabular-nums">
                            ({p.category} · {p.ram_gb}GB · ${p.price_monthly_usd}/mo)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              () => apiRequest(`/api/admin/cloud/plans/${p.id}`, { method: 'DELETE' }),
                              'Plan deleted.',
                            )
                          }
                          className="text-neutral-500 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Server Requests */}
                <div className={`${cardClass} space-y-3`}>
                  <h3 className="text-sm font-bold text-[#0A0A0B]">
                    Customer Cloud Server Requests
                  </h3>
                  {overview.servers.length === 0 ? (
                    <p className="text-xs text-neutral-600">No server instances created yet.</p>
                  ) : (
                    overview.servers.map((srv) => (
                      <div
                        key={srv.id}
                        className={`flex flex-wrap items-center justify-between gap-3 ${rowClass}`}
                      >
                        <div>
                          <div className="font-bold text-[#0A0A0B]">{srv.name}</div>
                          <div className="text-neutral-600 tabular-nums">
                            {srv.id} · {srv.node_name} · Ptero ID:{' '}
                            {srv.pterodactyl_identifier || 'none'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={srv.status}
                            onChange={(e) =>
                              void runAction(
                                () =>
                                  apiRequest(`/api/admin/cloud/servers/${srv.id}`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({ status: e.target.value }),
                                  }),
                                `Updated server ${srv.name}`,
                              )
                            }
                            className={selectClass}
                          >
                            <option value="pending_provisioning">pending_provisioning</option>
                            <option value="active">active</option>
                            <option value="suspended">suspended</option>
                            <option value="terminated">terminated</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 4. SHOP, ORDERS & COUPONS */}
            {tab === 'shop' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <form onSubmit={handleCreateProduct} className={`${cardClass} space-y-3`}>
                    <h3 className="text-sm font-bold text-[#0A0A0B]">Add Shop Product</h3>
                    <input
                      type="text"
                      required
                      placeholder="Product Name"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className={inputClass}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={prodCat}
                        onChange={(e) => setProdCat(e.target.value)}
                        className={inputClass}
                      >
                        <option>Hardware</option>
                        <option>Peripherals</option>
                        <option>Digital Kits</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Price USD"
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        className={inputClass}
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={prodStock}
                        onChange={(e) => setProdStock(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <textarea
                      rows={2}
                      required
                      placeholder="Product summary"
                      value={prodSummary}
                      onChange={(e) => setProdSummary(e.target.value)}
                      className={inputClass}
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg cursor-pointer"
                    >
                      Add Product
                    </button>
                  </form>

                  <form onSubmit={handleCreateCoupon} className={`${cardClass} space-y-3`}>
                    <h3 className="text-sm font-bold text-[#0A0A0B]">Discount Coupons</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="CODE (e.g. LAUNCH25)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className={`flex-1 uppercase ${inputClass}`}
                      />
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={couponPct}
                        onChange={(e) => setCouponPct(e.target.value)}
                        className="w-20 rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3 py-2 text-xs text-[#0A0A0B]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-2 pt-2">
                      {overview.coupons.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between text-xs bg-[#F8F8FA] border border-black/[0.08] px-3 py-2 rounded-lg"
                        >
                          <span className="font-semibold text-[#0A0A0B] tabular-nums">
                            {c.code} · {c.discount_percent}% off ({c.used_count}/{c.max_uses} uses)
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              void runAction(
                                () =>
                                  apiRequest(`/api/admin/shop/coupons/${c.id}`, {
                                    method: 'DELETE',
                                  }),
                                'Coupon removed.',
                              )
                            }
                            className="text-neutral-500 hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </form>
                </div>

                {/* Orders */}
                <div className={`${cardClass} space-y-3`}>
                  <h3 className="text-sm font-bold text-[#0A0A0B]">Shop Orders &amp; Invoices</h3>
                  {overview.orders.length === 0 ? (
                    <p className="text-xs text-neutral-600">No customer orders placed yet.</p>
                  ) : (
                    overview.orders.map((o) => (
                      <div
                        key={o.id}
                        className={`flex flex-wrap items-center justify-between gap-3 ${rowClass}`}
                      >
                        <div>
                          <div className="font-bold text-[#0A0A0B] tabular-nums">
                            {o.id} · ${o.total_usd.toLocaleString()}
                          </div>
                          <div className="text-neutral-600">{o.customer_email}</div>
                        </div>
                        <select
                          value={o.status}
                          onChange={(e) =>
                            void runAction(
                              () =>
                                apiRequest(`/api/admin/shop/orders/${o.id}`, {
                                  method: 'PATCH',
                                  body: JSON.stringify({ status: e.target.value }),
                                }),
                              `Order ${o.id} updated.`,
                            )
                          }
                          className={selectClass}
                        >
                          <option value="pending_payment">pending_payment</option>
                          <option value="paid">paid</option>
                          <option value="processing">processing</option>
                          <option value="fulfilled">fulfilled</option>
                          <option value="refunded">refunded</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 5. STUDIO & SUPPORT */}
            {tab === 'studio_support' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${cardClass} space-y-3`}>
                  <h3 className="text-sm font-bold text-[#0A0A0B]">Studio Client Projects</h3>
                  {overview.projects.length === 0 ? (
                    <p className="text-xs text-neutral-600">No Studio projects submitted yet.</p>
                  ) : (
                    overview.projects.map((prj) => (
                      <div key={prj.id} className={`${rowClass} space-y-2`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0A0A0B]">{prj.title}</span>
                          <select
                            value={prj.status}
                            onChange={(e) =>
                              void runAction(
                                () =>
                                  apiRequest(`/api/admin/studio/projects/${prj.id}`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({
                                      status: e.target.value,
                                      admin_notes: prj.admin_notes,
                                    }),
                                  }),
                                `Updated Studio project ${prj.title}`,
                              )
                            }
                            className={selectClass}
                          >
                            <option value="submitted">submitted</option>
                            <option value="in_review">in_review</option>
                            <option value="active">active</option>
                            <option value="completed">completed</option>
                            <option value="archived">archived</option>
                          </select>
                        </div>
                        <div className="text-neutral-600">
                          {prj.service_type} · {prj.client_email}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className={`${cardClass} space-y-3`}>
                  <h3 className="text-sm font-bold text-[#0A0A0B] flex items-center gap-2">
                    <LifeBuoy className="w-4 h-4 text-[#0A0A0B]" />
                    <span>Support Tickets</span>
                  </h3>
                  {overview.tickets.length === 0 ? (
                    <p className="text-xs text-neutral-600">No support tickets yet.</p>
                  ) : (
                    overview.tickets.map((t) => (
                      <div
                        key={t.id}
                        className={`${rowClass} flex items-center justify-between gap-2`}
                      >
                        <div>
                          <div className="font-bold text-[#0A0A0B]">{t.subject}</div>
                          <div className="text-neutral-600">
                            {t.email} · {t.priority}
                          </div>
                        </div>
                        <select
                          value={t.status}
                          onChange={(e) =>
                            void runAction(
                              () =>
                                apiRequest(`/api/admin/support/tickets/${t.id}`, {
                                  method: 'PATCH',
                                  body: JSON.stringify({ status: e.target.value }),
                                }),
                              `Ticket ${t.id} updated.`,
                            )
                          }
                          className={selectClass}
                        >
                          <option value="open">open</option>
                          <option value="answered">answered</option>
                          <option value="resolved">resolved</option>
                          <option value="closed">closed</option>
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 6. LAUNCH 2027, PARTNERS & CAREERS */}
            {tab === 'growth' && (
              <div className="space-y-6">
                <div className={`${cardClass} space-y-3`}>
                  <h3 className="text-sm font-bold text-[#0A0A0B]">
                    Launch 01.01.2027 Early Access Registrations ({overview.earlyAccess.length})
                  </h3>
                  {overview.earlyAccess.length === 0 ? (
                    <p className="text-xs text-neutral-600">No Early Access registrations yet.</p>
                  ) : (
                    overview.earlyAccess.map((ea) => (
                      <div
                        key={ea.id}
                        className={`flex flex-wrap items-center justify-between gap-3 ${rowClass}`}
                      >
                        <div>
                          <span className="font-bold text-[#0A0A0B]">{ea.full_name}</span>{' '}
                          <span className="text-neutral-600">({ea.email})</span> ·
                          Verified:{' '}
                          <span className="font-semibold text-[#0A0A0B]">
                            {ea.email_verified ? 'Yes' : 'No'}
                          </span>
                          {ea.slot_number ? ` · Slot #${ea.slot_number}` : ''}
                        </div>
                        <select
                          value={ea.eligibility_status}
                          onChange={(e) =>
                            void runAction(
                              () =>
                                apiRequest(`/api/admin/launch/${ea.id}`, {
                                  method: 'PATCH',
                                  body: JSON.stringify({ eligibility_status: e.target.value }),
                                }),
                              `Updated eligibility for ${ea.email}`,
                            )
                          }
                          className={selectClass}
                        >
                          <option value="pending_verification">pending_verification</option>
                          <option value="qualified">qualified</option>
                          <option value="waitlisted">waitlisted</option>
                          <option value="ineligible">ineligible</option>
                        </select>
                      </div>
                    ))
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className={`${cardClass} space-y-3`}>
                    <h3 className="text-sm font-bold text-[#0A0A0B]">Partner Applications</h3>
                    {overview.partners.length === 0 ? (
                      <p className="text-xs text-neutral-600">No partner applications yet.</p>
                    ) : (
                      overview.partners.map((p) => (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between ${rowClass}`}
                        >
                          <div>
                            <div className="font-bold text-[#0A0A0B]">{p.company_name}</div>
                            <div className="text-neutral-600">
                              {p.referral_code} · {p.email}
                            </div>
                          </div>
                          <select
                            value={p.status}
                            onChange={(e) =>
                              void runAction(
                                () =>
                                  apiRequest(`/api/admin/partners/${p.id}`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({ status: e.target.value }),
                                  }),
                                `Updated partner ${p.company_name}`,
                              )
                            }
                            className={selectClass}
                          >
                            <option value="pending">pending</option>
                            <option value="approved">approved</option>
                            <option value="rejected">rejected</option>
                          </select>
                        </div>
                      ))
                    )}
                  </div>

                  <div className={`${cardClass} space-y-3`}>
                    <h3 className="text-sm font-bold text-[#0A0A0B] flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#0A0A0B]" />
                      <span>Career &amp; Staff Applications</span>
                    </h3>
                    {overview.careers.length === 0 ? (
                      <p className="text-xs text-neutral-600">No career applications yet.</p>
                    ) : (
                      overview.careers.map((c) => (
                        <div
                          key={c.id}
                          className={`flex items-center justify-between ${rowClass}`}
                        >
                          <div>
                            <div className="font-bold text-[#0A0A0B]">{c.applicant_name}</div>
                            <div className="text-neutral-600">{c.position_title}</div>
                          </div>
                          <select
                            value={c.status}
                            onChange={(e) =>
                              void runAction(
                                () =>
                                  apiRequest(`/api/admin/careers/${c.id}`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({ status: e.target.value }),
                                  }),
                                `Updated application for ${c.applicant_name}`,
                              )
                            }
                            className={selectClass}
                          >
                            <option value="received">received</option>
                            <option value="reviewing">reviewing</option>
                            <option value="interview">interview</option>
                            <option value="accepted">accepted</option>
                            <option value="declined">declined</option>
                          </select>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 7. CMS & SETTINGS */}
            {tab === 'cms' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <form onSubmit={handleCreatePost} className={`${cardClass} space-y-3`}>
                    <h3 className="text-sm font-bold text-[#0A0A0B]">Publish Blog Article</h3>
                    <input
                      type="text"
                      required
                      placeholder="Article Title"
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      required
                      placeholder="Category"
                      value={postCat}
                      onChange={(e) => setPostCat(e.target.value)}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      required
                      placeholder="Short Excerpt"
                      value={postExcerpt}
                      onChange={(e) => setPostExcerpt(e.target.value)}
                      className={inputClass}
                    />
                    <textarea
                      rows={3}
                      required
                      placeholder="Full Markdown / Text Content"
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className={inputClass}
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg cursor-pointer"
                    >
                      Publish Post
                    </button>
                  </form>

                  <form onSubmit={handleSaveSettings} className={`${cardClass} space-y-3`}>
                    <h3 className="text-sm font-bold text-[#0A0A0B] flex items-center gap-2">
                      <Settings className="w-4 h-4 text-[#0A0A0B]" />
                      <span>Global Homepage Settings</span>
                    </h3>
                    <label className="block text-xs font-semibold text-neutral-700">
                      Hero Heading
                    </label>
                    <input
                      type="text"
                      value={heroHeading}
                      onChange={(e) => setHeroHeading(e.target.value)}
                      className={inputClass}
                    />
                    <label className="block text-xs font-semibold text-neutral-700">
                      Promo Banner Text
                    </label>
                    <input
                      type="text"
                      value={promoBanner}
                      onChange={(e) => setPromoBanner(e.target.value)}
                      className={inputClass}
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg cursor-pointer"
                    >
                      Save Site Settings
                    </button>
                  </form>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <form onSubmit={handleCreateAnnouncement} className={`${cardClass} space-y-3`}>
                    <h3 className="text-sm font-bold text-[#0A0A0B]">Create Announcement</h3>
                    <input
                      type="text"
                      required
                      placeholder="Announcement Title"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      className={inputClass}
                    />
                    <textarea
                      rows={2}
                      required
                      placeholder="Announcement message"
                      value={annBody}
                      onChange={(e) => setAnnBody(e.target.value)}
                      className={inputClass}
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg cursor-pointer"
                    >
                      Post Announcement
                    </button>
                  </form>

                  <form onSubmit={handleCreateFaq} className={`${cardClass} space-y-3`}>
                    <h3 className="text-sm font-bold text-[#0A0A0B]">Add FAQ Entry</h3>
                    <input
                      type="text"
                      required
                      placeholder="Question"
                      value={faqQ}
                      onChange={(e) => setFaqQ(e.target.value)}
                      className={inputClass}
                    />
                    <textarea
                      rows={2}
                      required
                      placeholder="Answer"
                      value={faqA}
                      onChange={(e) => setFaqA(e.target.value)}
                      className={inputClass}
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg cursor-pointer"
                    >
                      Add FAQ
                    </button>
                  </form>
                </div>

                {/* Contact Inquiries */}
                <div className={`${cardClass} space-y-3`}>
                  <h3 className="text-sm font-bold text-[#0A0A0B] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#0A0A0B]" />
                    <span>Contact Inquiries ({overview.inquiries.length})</span>
                  </h3>
                  {overview.inquiries.length === 0 ? (
                    <p className="text-xs text-neutral-600">No contact submissions yet.</p>
                  ) : (
                    overview.inquiries.map((inq) => (
                      <div key={inq.id} className={`${rowClass} space-y-1`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0A0A0B]">
                            {inq.name} ({inq.email})
                          </span>
                          <span className="font-semibold text-[#0A0A0B] capitalize">
                            {inq.scope}
                          </span>
                        </div>
                        <p className="text-neutral-700">{inq.brief}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
