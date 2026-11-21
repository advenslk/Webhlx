import {
  Activity,
  BarChart3,
  Briefcase,
  FileText,
  FolderKanban,
  LifeBuoy,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Server,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
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
  };
  users: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: string;
    email_verified: number;
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

type AdminTab =
  | 'overview'
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
      const res = await apiRequest<AdminOverview>('/api/admin/overview');
      setOverview(res);
    } catch (err) {
      setFeedback(err instanceof ApiError ? err.message : 'Unable to load admin overview.');
    } finally {
      setLoading(false);
    }
  }, [user, isAdminRole]);

  useEffect(() => {
    void loadAdmin();
  }, [loadAdmin]);

  if (!user || !isAdminRole) {
    return (
      <div className="bg-black text-white min-h-[70vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl bg-[#08080F] border border-white/[0.12] p-8 text-center space-y-4">
          <Lock className="w-8 h-8 text-rose-400 mx-auto" />
          <h1 className="text-2xl font-bold text-white">RBAC Admin Access Required</h1>
          <p className="text-sm text-neutral-400">
            This management console requires an authenticated Super Admin, Admin, or Staff account.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="w-full py-2.5 px-5 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 cursor-pointer"
          >
            Sign In / Claim Initial Admin
          </button>
        </div>
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

  const tabs: { id: AdminTab; label: string; icon: typeof BarChart3 }[] = [
    { id: 'overview', label: 'Analytics & Audit', icon: BarChart3 },
    { id: 'users', label: 'Users & RBAC', icon: Users },
    { id: 'cloud', label: 'Cloud & Pterodactyl', icon: Server },
    { id: 'shop', label: 'Shop, Orders & Coupons', icon: ShoppingBag },
    { id: 'studio_support', label: 'Studio & Support', icon: FolderKanban },
    { id: 'growth', label: 'Launch 2027, Partners & Staff', icon: Sparkles },
    { id: 'cms', label: 'Blog, CMS & Settings', icon: FileText },
  ];

  return (
    <div className="bg-black text-white min-h-screen py-10">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="text-xs font-mono text-violet-300">
              HELZERX ADMIN CONSOLE · {user.role.toUpperCase()}
            </div>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold text-white">
              Enterprise Operations &amp; CMS
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void loadAdmin()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-200 border border-white/15 rounded-lg hover:border-white/30 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync All</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div className="rounded-xl bg-violet-500/15 border border-violet-400/35 px-4 py-3 text-xs text-violet-100">
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
                    ? 'bg-white text-black border-white'
                    : 'bg-[#08080F] text-neutral-300 border-white/[0.1] hover:border-white/25'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {loading || !overview ? (
          <div className="py-16 flex items-center justify-center gap-2 text-sm text-neutral-400">
            <Loader2 className="w-4 h-4 animate-spin text-violet-300" />
            <span>Loading enterprise management records...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 1. OVERVIEW & AUDIT */}
            {tab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-5">
                    <div className="text-xs text-neutral-400">Total Users</div>
                    <div className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
                      {overview.metrics.totalUsers}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-5">
                    <div className="text-xs text-neutral-400">Paid Revenue</div>
                    <div className="mt-2 font-mono text-2xl font-bold text-emerald-300 tabular-nums">
                      ${overview.metrics.totalRevenue.toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-5">
                    <div className="text-xs text-neutral-400">Total Orders</div>
                    <div className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
                      {overview.metrics.totalOrders}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-5">
                    <div className="text-xs text-neutral-400">Active Servers</div>
                    <div className="mt-2 font-mono text-2xl font-bold text-cyan-300 tabular-nums">
                      {overview.metrics.activeServers}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-5">
                    <div className="text-xs text-neutral-400">Studio Queue</div>
                    <div className="mt-2 font-mono text-2xl font-bold text-violet-300 tabular-nums">
                      {overview.metrics.pendingProjects}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-5">
                    <div className="text-xs text-neutral-400">Open Tickets</div>
                    <div className="mt-2 font-mono text-2xl font-bold text-amber-300 tabular-nums">
                      {overview.metrics.openTickets}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6 space-y-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-300" />
                    <span>Security Audit Logs</span>
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-neutral-400 border-b border-white/[0.08]">
                        <tr>
                          <th className="py-2 pr-4">Action</th>
                          <th className="py-2 pr-4">Actor</th>
                          <th className="py-2 pr-4">Target</th>
                          <th className="py-2 pr-4">Details</th>
                          <th className="py-2">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06] font-mono tabular-nums">
                        {overview.auditLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="py-2 pr-4 text-cyan-300">{log.action}</td>
                            <td className="py-2 pr-4 text-white">{log.actor_email}</td>
                            <td className="py-2 pr-4 text-neutral-400">
                              {log.target_type}:{log.target_id}
                            </td>
                            <td className="py-2 pr-4 text-neutral-300">{log.details}</td>
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

            {/* 2. USERS & RBAC */}
            {tab === 'users' && (
              <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6 space-y-4">
                <h2 className="text-lg font-bold text-white">Registered Users &amp; RBAC Roles</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-neutral-400 border-b border-white/[0.08]">
                      <tr>
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Email</th>
                        <th className="py-2 pr-4">Verified</th>
                        <th className="py-2 pr-4">Role</th>
                        <th className="py-2">Account Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {overview.users.map((u) => (
                        <tr key={u.id}>
                          <td className="py-2.5 pr-4 font-semibold text-white">{u.name}</td>
                          <td className="py-2.5 pr-4 font-mono text-neutral-300">{u.email}</td>
                          <td className="py-2.5 pr-4 font-mono text-cyan-300">
                            {u.email_verified ? 'Yes' : 'No'}
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
                              className="rounded bg-black border border-white/[0.15] px-2 py-1 text-xs text-white"
                            >
                              <option value="customer">customer</option>
                              <option value="partner">partner</option>
                              <option value="staff">staff</option>
                              <option value="admin">admin</option>
                              <option value="super_admin">super_admin</option>
                            </select>
                          </td>
                          <td className="py-2.5">
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
                              className="rounded bg-black border border-white/[0.15] px-2 py-1 text-xs text-white"
                            >
                              <option value="active">active</option>
                              <option value="suspended">suspended</option>
                            </select>
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
                <div className="rounded-2xl bg-[#08080F] border border-white/[0.12] p-6 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="font-mono text-cyan-300">PTERODACTYL INTEGRATION</div>
                    <div className="mt-1 text-sm font-bold text-white">
                      {overview.pterodactyl.configured
                        ? `Connected to ${overview.pterodactyl.panelUrl}`
                        : 'Configure PTERODACTYL_URL, PTERODACTYL_APP_API_KEY, and PTERODACTYL_CLIENT_API_KEY in server env'}
                    </div>
                  </div>
                  <span className="font-mono px-3 py-1 rounded bg-white/[0.06] text-amber-300">
                    {overview.pterodactyl.configured ? 'CONNECTED' : 'UNCONFIGURED'}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
                  <form
                    onSubmit={handleCreatePlan}
                    className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-6 space-y-3"
                  >
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-cyan-300" />
                      <span>Add Hosting Plan</span>
                    </h3>
                    <input
                      type="text"
                      required
                      placeholder="Plan Name"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Category"
                        value={planCat}
                        onChange={(e) => setPlanCat(e.target.value)}
                        className="rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="CPU"
                        value={planCpu}
                        onChange={(e) => setPlanCpu(e.target.value)}
                        className="rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="RAM GB"
                        value={planRam}
                        onChange={(e) => setPlanRam(e.target.value)}
                        className="rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price USD"
                        value={planPrice}
                        onChange={(e) => setPlanPrice(e.target.value)}
                        className="rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 text-xs font-semibold text-black bg-white rounded-lg cursor-pointer"
                    >
                      Create Hosting Plan
                    </button>
                  </form>

                  <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6 space-y-3">
                    <h3 className="text-sm font-bold text-white">Active Hosting Plans</h3>
                    {overview.plans.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-xs rounded-lg bg-black/50 border border-white/[0.08] px-3.5 py-2.5"
                      >
                        <div>
                          <span className="font-semibold text-white">{p.name}</span>{' '}
                          <span className="font-mono text-neutral-400">
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
                          className="text-neutral-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Server Requests */}
                <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6 space-y-3">
                  <h3 className="text-sm font-bold text-white">Customer Cloud Server Requests</h3>
                  {overview.servers.length === 0 ? (
                    <p className="text-xs text-neutral-500">No server instances created yet.</p>
                  ) : (
                    overview.servers.map((srv) => (
                      <div
                        key={srv.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/60 border border-white/[0.08] p-3.5 text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{srv.name}</div>
                          <div className="font-mono text-neutral-400">
                            {srv.id} · {srv.node_name} · Ptero ID: {srv.pterodactyl_identifier || 'none'}
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
                            className="rounded bg-black border border-white/15 px-2.5 py-1 text-xs text-white"
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
                  <form
                    onSubmit={handleCreateProduct}
                    className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-6 space-y-3"
                  >
                    <h3 className="text-sm font-bold text-white">Add Shop Product</h3>
                    <input
                      type="text"
                      required
                      placeholder="Product Name"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={prodCat}
                        onChange={(e) => setProdCat(e.target.value)}
                        className="rounded-lg bg-black border border-white/[0.12] px-2 py-2 text-xs text-white"
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
                        className="rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={prodStock}
                        onChange={(e) => setProdStock(e.target.value)}
                        className="rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <textarea
                      rows={2}
                      required
                      placeholder="Product summary"
                      value={prodSummary}
                      onChange={(e) => setProdSummary(e.target.value)}
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-black bg-white rounded-lg cursor-pointer"
                    >
                      Add Product
                    </button>
                  </form>

                  <form
                    onSubmit={handleCreateCoupon}
                    className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-6 space-y-3"
                  >
                    <h3 className="text-sm font-bold text-white">Discount Coupons</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="CODE (e.g. LAUNCH25)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white uppercase"
                      />
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={couponPct}
                        onChange={(e) => setCouponPct(e.target.value)}
                        className="w-20 rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-semibold text-black bg-white rounded-lg cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-2 pt-2">
                      {overview.coupons.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between text-xs bg-black/50 border border-white/[0.08] px-3 py-2 rounded-lg"
                        >
                          <span className="font-mono text-white">
                            {c.code} · {c.discount_percent}% off ({c.used_count}/{c.max_uses} uses)
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              void runAction(
                                () =>
                                  apiRequest(`/api/admin/shop/coupons/${c.id}`, { method: 'DELETE' }),
                                'Coupon removed.',
                              )
                            }
                            className="text-neutral-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </form>
                </div>

                {/* Orders */}
                <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6 space-y-3">
                  <h3 className="text-sm font-bold text-white">Shop Orders &amp; Invoices</h3>
                  {overview.orders.length === 0 ? (
                    <p className="text-xs text-neutral-500">No customer orders placed yet.</p>
                  ) : (
                    overview.orders.map((o) => (
                      <div
                        key={o.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/60 border border-white/[0.08] p-3.5 text-xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-white">
                            {o.id} · ${o.total_usd.toLocaleString()}
                          </div>
                          <div className="text-neutral-400">{o.customer_email}</div>
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
                          className="rounded bg-black border border-white/15 px-2.5 py-1 text-xs text-white"
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
                <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6 space-y-3">
                  <h3 className="text-sm font-bold text-white">Studio Client Projects</h3>
                  {overview.projects.length === 0 ? (
                    <p className="text-xs text-neutral-500">No Studio projects submitted yet.</p>
                  ) : (
                    overview.projects.map((prj) => (
                      <div
                        key={prj.id}
                        className="rounded-xl bg-black/60 border border-white/[0.08] p-3.5 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{prj.title}</span>
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
                            className="rounded bg-black border border-white/15 px-2 py-1 text-xs text-white"
                          >
                            <option value="submitted">submitted</option>
                            <option value="in_review">in_review</option>
                            <option value="active">active</option>
                            <option value="completed">completed</option>
                            <option value="archived">archived</option>
                          </select>
                        </div>
                        <div className="text-neutral-400 font-mono">
                          {prj.service_type} · {prj.client_email}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <LifeBuoy className="w-4 h-4 text-cyan-300" />
                    <span>Support Tickets</span>
                  </h3>
                  {overview.tickets.length === 0 ? (
                    <p className="text-xs text-neutral-500">No support tickets yet.</p>
                  ) : (
                    overview.tickets.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-xl bg-black/60 border border-white/[0.08] p-3.5 text-xs flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-white">{t.subject}</div>
                          <div className="text-neutral-400 font-mono">
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
                          className="rounded bg-black border border-white/15 px-2 py-1 text-xs text-white"
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
                <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6 space-y-3">
                  <h3 className="text-sm font-bold text-white">
                    Launch 01.01.2027 Early Access Registrations ({overview.earlyAccess.length})
                  </h3>
                  {overview.earlyAccess.length === 0 ? (
                    <p className="text-xs text-neutral-500">No Early Access registrations yet.</p>
                  ) : (
                    overview.earlyAccess.map((ea) => (
                      <div
                        key={ea.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/60 border border-white/[0.08] p-3 text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">{ea.full_name}</span>{' '}
                          <span className="font-mono text-neutral-400">({ea.email})</span> · Verified:{' '}
                          <span className="font-mono text-cyan-300">
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
                          className="rounded bg-black border border-white/15 px-2 py-1 text-xs text-white"
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
                  <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6 space-y-3">
                    <h3 className="text-sm font-bold text-white">Partner Applications</h3>
                    {overview.partners.length === 0 ? (
                      <p className="text-xs text-neutral-500">No partner applications yet.</p>
                    ) : (
                      overview.partners.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-xl bg-black/60 border border-white/[0.08] p-3 text-xs"
                        >
                          <div>
                            <div className="font-bold text-white">{p.company_name}</div>
                            <div className="font-mono text-neutral-400">
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
                            className="rounded bg-black border border-white/15 px-2 py-1 text-xs text-white"
                          >
                            <option value="pending">pending</option>
                            <option value="approved">approved</option>
                            <option value="rejected">rejected</option>
                          </select>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6 space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-violet-300" />
                      <span>Career &amp; Staff Applications</span>
                    </h3>
                    {overview.careers.length === 0 ? (
                      <p className="text-xs text-neutral-500">No career applications yet.</p>
                    ) : (
                      overview.careers.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between rounded-xl bg-black/60 border border-white/[0.08] p-3 text-xs"
                        >
                          <div>
                            <div className="font-bold text-white">{c.applicant_name}</div>
                            <div className="text-neutral-400">{c.position_title}</div>
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
                            className="rounded bg-black border border-white/15 px-2 py-1 text-xs text-white"
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
                  <form
                    onSubmit={handleCreatePost}
                    className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-6 space-y-3"
                  >
                    <h3 className="text-sm font-bold text-white">Publish Blog Article</h3>
                    <input
                      type="text"
                      required
                      placeholder="Article Title"
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Category"
                      value={postCat}
                      onChange={(e) => setPostCat(e.target.value)}
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Short Excerpt"
                      value={postExcerpt}
                      onChange={(e) => setPostExcerpt(e.target.value)}
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                    />
                    <textarea
                      rows={3}
                      required
                      placeholder="Full Markdown / Text Content"
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-black bg-white rounded-lg cursor-pointer"
                    >
                      Publish Post
                    </button>
                  </form>

                  <form
                    onSubmit={handleSaveSettings}
                    className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-6 space-y-3"
                  >
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Settings className="w-4 h-4 text-cyan-300" />
                      <span>Global Homepage Settings</span>
                    </h3>
                    <label className="block text-xs text-neutral-400">Hero Heading</label>
                    <input
                      type="text"
                      value={heroHeading}
                      onChange={(e) => setHeroHeading(e.target.value)}
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                    />
                    <label className="block text-xs text-neutral-400">Promo Banner Text</label>
                    <input
                      type="text"
                      value={promoBanner}
                      onChange={(e) => setPromoBanner(e.target.value)}
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-black bg-white rounded-lg cursor-pointer"
                    >
                      Save Site Settings
                    </button>
                  </form>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <form
                    onSubmit={handleCreateAnnouncement}
                    className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-6 space-y-3"
                  >
                    <h3 className="text-sm font-bold text-white">Create Announcement</h3>
                    <input
                      type="text"
                      required
                      placeholder="Announcement Title"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                    />
                    <textarea
                      rows={2}
                      required
                      placeholder="Announcement message"
                      value={annBody}
                      onChange={(e) => setAnnBody(e.target.value)}
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-black bg-white rounded-lg cursor-pointer"
                    >
                      Post Announcement
                    </button>
                  </form>

                  <form
                    onSubmit={handleCreateFaq}
                    className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-6 space-y-3"
                  >
                    <h3 className="text-sm font-bold text-white">Add FAQ Entry</h3>
                    <input
                      type="text"
                      required
                      placeholder="Question"
                      value={faqQ}
                      onChange={(e) => setFaqQ(e.target.value)}
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                    />
                    <textarea
                      rows={2}
                      required
                      placeholder="Answer"
                      value={faqA}
                      onChange={(e) => setFaqA(e.target.value)}
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-black bg-white rounded-lg cursor-pointer"
                    >
                      Add FAQ
                    </button>
                  </form>
                </div>

                {/* Contact Inquiries */}
                <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-violet-300" />
                    <span>Contact Inquiries ({overview.inquiries.length})</span>
                  </h3>
                  {overview.inquiries.length === 0 ? (
                    <p className="text-xs text-neutral-500">No contact submissions yet.</p>
                  ) : (
                    overview.inquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="rounded-xl bg-black/60 border border-white/[0.08] p-3.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">
                            {inq.name} ({inq.email})
                          </span>
                          <span className="font-mono text-cyan-300">{inq.scope}</span>
                        </div>
                        <p className="text-neutral-300">{inq.brief}</p>
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
