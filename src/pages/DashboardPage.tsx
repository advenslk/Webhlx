import {
  Activity,
  Bell,
  CheckCheck,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  Lock,
  Palette,
  Server,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ApiError, apiRequest } from '../lib/api';
import { PageRoute } from '../types/navigation';

interface DashboardOverview {
  servers: {
    id: string;
    plan_id: string;
    name: string;
    plan_name: string | null;
    cpu: string | null;
    ram_gb: number | null;
    storage_gb: number | null;
    price_monthly_usd: number | null;
    node_name: string;
    pterodactyl_identifier: string;
    status: string;
    location: string;
    created_at: string;
  }[];
  orders: {
    id: string;
    subtotal_usd: number;
    discount_usd: number;
    total_usd: number;
    coupon_code: string;
    status: string;
    payment_status: string;
    created_at: string;
  }[];
  orderItems: {
    id: string;
    order_id: string;
    product_name: string;
    quantity: number;
    unit_price_usd: number;
  }[];
  invoices: {
    id: string;
    order_id: string;
    invoice_number: string;
    amount_usd: number;
    status: string;
    issued_at: string;
  }[];
  projects: {
    id: string;
    service_type: string;
    title: string;
    budget_range: string;
    timeline: string;
    status: string;
    updated_at: string;
  }[];
  tickets: {
    id: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    updated_at: string;
  }[];
  notifications: {
    id: string;
    title: string;
    body: string;
    read: number;
    created_at: string;
  }[];
  earlyAccess: {
    eligibility_status: string;
    slot_number: number | null;
    use_case: string;
  } | null;
}

type DashTab = 'overview' | 'servers' | 'orders' | 'projects' | 'tickets' | 'notifications' | 'security';

interface DashboardPageProps {
  onNavigate: (route: PageRoute) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user, refreshUser, isAdminRole } = useAppContext();
  const [tab, setTab] = useState<DashTab>('overview');
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile & security state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [notifyEmail, setNotifyEmail] = useState(user?.notify_email !== 0);
  const [notifySecurity, setNotifySecurity] = useState(user?.notify_security !== 0);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [verifyToken, setVerifyToken] = useState('');
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest<DashboardOverview>('/api/dashboard/overview');
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setAvatarUrl(user.avatar_url || '');
      setNotifyEmail(user.notify_email !== 0);
      setNotifySecurity(user.notify_security !== 0);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="bg-black text-white min-h-[70vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl bg-[#08080F] border border-white/[0.12] p-8 text-center space-y-4">
          <Lock className="w-8 h-8 text-violet-300 mx-auto" />
          <h1 className="text-2xl font-bold text-white">Customer Dashboard</h1>
          <p className="text-sm text-neutral-400">
            Sign in to access your servers, orders, invoices, Studio projects, support tickets,
            and account security settings.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="w-full py-2.5 px-5 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 cursor-pointer"
          >
            Sign In / Create Account
          </button>
        </div>
      </div>
    );
  }

  const handleMarkAllRead = async () => {
    await apiRequest('/api/dashboard/notifications/read-all', { method: 'POST' });
    await loadOverview();
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      await apiRequest('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: profileName,
          avatar_url: avatarUrl,
          notify_email: notifyEmail,
          notify_security: notifySecurity,
        }),
      });
      await refreshUser();
      setProfileMsg('Profile preferences updated.');
    } catch (err) {
      setProfileMsg(err instanceof ApiError ? err.message : 'Unable to save profile.');
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setPwdMsg(res.message);
    } catch (err) {
      setPwdMsg(err instanceof ApiError ? err.message : 'Unable to change password.');
    }
  };

  const handleVerifyEmail = async (e: FormEvent) => {
    e.preventDefault();
    setVerifyMsg(null);
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: verifyToken.trim() }),
      });
      setVerifyToken('');
      await refreshUser();
      await loadOverview();
      setVerifyMsg(res.message);
    } catch (err) {
      setVerifyMsg(err instanceof ApiError ? err.message : 'Verification failed.');
    }
  };

  const unreadCount = data?.notifications.filter((n) => n.read === 0).length ?? 0;
  const totalSpend =
    data?.orders.reduce((s, o) => s + (o.status !== 'cancelled' ? o.total_usd : 0), 0) ?? 0;

  const navTabs: { id: DashTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'servers', label: `Cloud Servers (${data?.servers.length ?? 0})`, icon: Server },
    { id: 'orders', label: `Orders & Invoices (${data?.orders.length ?? 0})`, icon: CreditCard },
    { id: 'projects', label: `Studio Projects (${data?.projects.length ?? 0})`, icon: FolderKanban },
    { id: 'tickets', label: `Support Tickets (${data?.tickets.length ?? 0})`, icon: LifeBuoy },
    { id: 'notifications', label: `Notifications (${unreadCount})`, icon: Bell },
    { id: 'security', label: 'Profile & Security', icon: ShieldCheck },
  ];

  const chartSeries = [
    { label: 'Servers', value: data?.servers.length ?? 0, color: '#22d3ee' },
    { label: 'Orders', value: data?.orders.length ?? 0, color: '#a78bfa' },
    { label: 'Projects', value: data?.projects.length ?? 0, color: '#60a5fa' },
    { label: 'Tickets', value: data?.tickets.length ?? 0, color: '#34d399' },
  ];
  const maxChartVal = Math.max(1, ...chartSeries.map((c) => c.value));

  return (
    <div className="bg-black text-white min-h-screen py-10 md:py-14">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="text-xs font-mono text-cyan-300">
              CUSTOMER PORTAL · {user.role.toUpperCase()}
            </div>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold text-white">
              Welcome, {user.name}
            </h1>
            <p className="mt-1 text-xs text-neutral-400 font-mono">
              {user.email} · {user.email_verified ? 'Email Verified' : 'Email Unverified'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {isAdminRole && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-violet-600/80 hover:bg-violet-500 rounded-lg cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('cloud')}
              className="px-4 py-2 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 cursor-pointer"
            >
              Deploy Server
            </button>
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="px-4 py-2 text-xs font-semibold text-neutral-200 border border-white/15 rounded-lg hover:border-white/30 cursor-pointer"
            >
              Visit Shop
            </button>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
          {/* Sidebar */}
          <aside className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-3 space-y-1">
            {navTabs.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-white text-black font-semibold'
                      : 'text-neutral-300 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Main Panel */}
          <div className="space-y-6">
            {loading ? (
              <div className="py-16 flex items-center justify-center gap-2 text-sm text-neutral-400">
                <Loader2 className="w-4 h-4 animate-spin text-violet-300" />
                <span>Loading your account telemetry...</span>
              </div>
            ) : (
              <>
                {tab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-5">
                        <div className="text-xs text-neutral-400">Cloud Servers</div>
                        <div className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
                          {data?.servers.length ?? 0}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-5">
                        <div className="text-xs text-neutral-400">Total Order Value</div>
                        <div className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
                          ${totalSpend.toLocaleString()}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-5">
                        <div className="text-xs text-neutral-400">Studio Projects</div>
                        <div className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
                          {data?.projects.length ?? 0}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-5">
                        <div className="text-xs text-neutral-400">Open Tickets</div>
                        <div className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
                          {data?.tickets.length ?? 0}
                        </div>
                      </div>
                    </div>

                    {/* Launch 2027 Early Access Status */}
                    <div className="rounded-2xl bg-[#08080F] border border-white/[0.12] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                          <Sparkles className="w-4 h-4" />
                          <span>LAUNCH 01.01.2027 · 8GB RAM SERVER CAMPAIGN</span>
                        </div>
                        <h2 className="mt-1 text-lg font-bold text-white">
                          {data?.earlyAccess
                            ? `Eligibility Status: ${data.earlyAccess.eligibility_status}`
                            : 'Not yet registered for Launch 2027 Early Access'}
                        </h2>
                        <p className="mt-1 text-xs text-neutral-400">
                          {data?.earlyAccess?.slot_number
                            ? `Confirmed at Early Access slot #${data.earlyAccess.slot_number} of 50.`
                            : 'Register and verify your account email before January 1, 2027 to qualify for the first-50 8GB RAM server allocation.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate('launch')}
                        className="px-4 py-2 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 shrink-0 cursor-pointer"
                      >
                        Manage Early Access
                      </button>
                    </div>

                    {/* Account Resource Distribution SVG Chart */}
                    <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                          <Activity className="w-4 h-4 text-violet-300" />
                          <span>Workspace Activity Summary</span>
                        </h2>
                        <span className="text-xs font-mono text-neutral-400">Live SQLite Records</span>
                      </div>
                      <div className="space-y-3">
                        {chartSeries.map((bar) => (
                          <div key={bar.label} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-neutral-300">{bar.label}</span>
                              <span className="font-mono text-white tabular-nums">{bar.value}</span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.max(4, Math.round((bar.value / maxChartVal) * 100))}%`,
                                  backgroundColor: bar.color,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {tab === 'servers' && (
                  <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-white">Provisioned Cloud Servers</h2>
                      <button
                        type="button"
                        onClick={() => onNavigate('cloud')}
                        className="text-xs font-semibold text-cyan-300 hover:text-white cursor-pointer"
                      >
                        Open Cloud Console →
                      </button>
                    </div>
                    {data?.servers.length === 0 ? (
                      <p className="py-8 text-center text-xs text-neutral-400">
                        No servers requested yet. Visit HelzerX Cloud to launch a Minecraft or Proxmox node.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {data?.servers.map((srv) => (
                          <div
                            key={srv.id}
                            className="rounded-xl bg-black/60 border border-white/[0.08] p-4 flex flex-wrap items-center justify-between gap-3"
                          >
                            <div>
                              <div className="text-sm font-bold text-white">{srv.name}</div>
                              <div className="text-xs font-mono text-neutral-400">
                                {srv.plan_name || srv.plan_id} · {srv.node_name} · {srv.location}
                              </div>
                            </div>
                            <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/[0.06] text-cyan-300">
                              {srv.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'orders' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-violet-300" />
                          <span>Order &amp; Payment History</span>
                        </h2>
                      </div>
                      {data?.orders.length === 0 ? (
                        <p className="py-6 text-center text-xs text-neutral-400">
                          No orders placed yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {data?.orders.map((ord) => {
                            const items = data.orderItems.filter((i) => i.order_id === ord.id);
                            return (
                              <div
                                key={ord.id}
                                className="rounded-xl bg-black/60 border border-white/[0.08] p-4 space-y-2 text-xs"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-mono font-bold text-white">{ord.id}</span>
                                  <span className="font-mono text-cyan-300 uppercase">
                                    {ord.status} · ${ord.total_usd.toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-neutral-400">
                                  {items.map((it) => `${it.quantity}× ${it.product_name}`).join(', ')}
                                </div>
                                <div className="text-neutral-500 font-mono">
                                  {new Date(ord.created_at).toLocaleString()} · Payment:{' '}
                                  {ord.payment_status}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6 space-y-4">
                      <h2 className="text-lg font-bold text-white">Billing Invoices</h2>
                      {data?.invoices.length === 0 ? (
                        <p className="py-4 text-xs text-neutral-400">No invoices generated yet.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="text-neutral-400 border-b border-white/[0.08]">
                              <tr>
                                <th className="py-2 pr-4">Invoice #</th>
                                <th className="py-2 pr-4">Order</th>
                                <th className="py-2 pr-4">Amount</th>
                                <th className="py-2 pr-4">Status</th>
                                <th className="py-2">Issued</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.06] font-mono tabular-nums">
                              {data?.invoices.map((inv) => (
                                <tr key={inv.id}>
                                  <td className="py-2.5 pr-4 text-white">{inv.invoice_number}</td>
                                  <td className="py-2.5 pr-4 text-neutral-400">{inv.order_id}</td>
                                  <td className="py-2.5 pr-4 text-white">${inv.amount_usd.toFixed(2)}</td>
                                  <td className="py-2.5 pr-4 text-cyan-300 uppercase">{inv.status}</td>
                                  <td className="py-2.5 text-neutral-500">
                                    {new Date(inv.issued_at).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {tab === 'projects' && (
                  <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Palette className="w-4 h-4 text-violet-300" />
                        <span>Studio Projects</span>
                      </h2>
                      <button
                        type="button"
                        onClick={() => onNavigate('studio')}
                        className="text-xs font-semibold text-cyan-300 hover:text-white cursor-pointer"
                      >
                        Open Project Messages →
                      </button>
                    </div>
                    {data?.projects.length === 0 ? (
                      <p className="py-8 text-center text-xs text-neutral-400">
                        No Studio projects submitted yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {data?.projects.map((prj) => (
                          <div
                            key={prj.id}
                            className="rounded-xl bg-black/60 border border-white/[0.08] p-4 flex flex-wrap items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <div className="text-sm font-bold text-white">{prj.title}</div>
                              <div className="text-neutral-400 font-mono">
                                {prj.service_type} · {prj.budget_range} · {prj.timeline}
                              </div>
                            </div>
                            <span className="font-mono px-2.5 py-1 rounded bg-white/[0.06] text-violet-300 uppercase">
                              {prj.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'tickets' && (
                  <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-white">Support Tickets</h2>
                      <button
                        type="button"
                        onClick={() => onNavigate('support')}
                        className="text-xs font-semibold text-cyan-300 hover:text-white cursor-pointer"
                      >
                        Open Support Desk →
                      </button>
                    </div>
                    {data?.tickets.length === 0 ? (
                      <p className="py-8 text-center text-xs text-neutral-400">
                        No active support tickets.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {data?.tickets.map((t) => (
                          <div
                            key={t.id}
                            className="rounded-xl bg-black/60 border border-white/[0.08] p-4 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="text-sm font-bold text-white">{t.subject}</div>
                              <div className="text-neutral-400 font-mono">
                                {t.category} · Priority: {t.priority}
                              </div>
                            </div>
                            <span className="font-mono text-cyan-300 uppercase">{t.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'notifications' && (
                  <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-white">Notifications</h2>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => void handleMarkAllRead()}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-white cursor-pointer"
                        >
                          <CheckCheck className="w-4 h-4" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>
                    {data?.notifications.length === 0 ? (
                      <p className="py-8 text-center text-xs text-neutral-400">All caught up.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {data?.notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`rounded-xl border p-4 text-xs ${
                              n.read === 0
                                ? 'bg-violet-500/10 border-violet-400/30'
                                : 'bg-black/50 border-white/[0.08]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">{n.title}</span>
                              <span className="font-mono text-neutral-500">
                                {new Date(n.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="mt-1 text-neutral-300">{n.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'security' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <form
                      onSubmit={handleSaveProfile}
                      className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-6 space-y-4"
                    >
                      <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                        <User className="w-4 h-4" />
                        <span>PROFILE PREFERENCES</span>
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-300 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-300 mb-1">
                          Avatar URL (https://...)
                        </label>
                        <input
                          type="url"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-xs text-neutral-300">
                        <input
                          type="checkbox"
                          checked={notifyEmail}
                          onChange={(e) => setNotifyEmail(e.target.checked)}
                        />
                        <span>Receive order &amp; product release emails</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-neutral-300">
                        <input
                          type="checkbox"
                          checked={notifySecurity}
                          onChange={(e) => setNotifySecurity(e.target.checked)}
                        />
                        <span>Receive login &amp; security alerts</span>
                      </label>
                      {profileMsg && <p className="text-xs text-cyan-300">{profileMsg}</p>}
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-semibold text-black bg-white rounded-lg cursor-pointer"
                      >
                        Save Profile
                      </button>
                    </form>

                    <div className="space-y-6">
                      <form
                        onSubmit={handleChangePassword}
                        className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-6 space-y-3"
                      >
                        <div className="flex items-center gap-2 text-xs font-mono text-violet-300">
                          <Lock className="w-4 h-4" />
                          <span>PASSWORD UPDATE</span>
                        </div>
                        <input
                          type="password"
                          required
                          placeholder="Current password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="password"
                          required
                          placeholder="New password (min 8 characters)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white"
                        />
                        {pwdMsg && <p className="text-xs text-cyan-300">{pwdMsg}</p>}
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-semibold text-black bg-white rounded-lg cursor-pointer"
                        >
                          Update Password
                        </button>
                      </form>

                      {!user.email_verified && (
                        <form
                          onSubmit={handleVerifyEmail}
                          className="rounded-2xl bg-[#08080F] border border-amber-400/30 p-6 space-y-3"
                        >
                          <div className="text-xs font-mono text-amber-300">
                            EMAIL VERIFICATION REQUIRED FOR EARLY ACCESS
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="Paste email verification token"
                            value={verifyToken}
                            onChange={(e) => setVerifyToken(e.target.value)}
                            className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white font-mono"
                          />
                          {verifyMsg && <p className="text-xs text-emerald-300">{verifyMsg}</p>}
                          <button
                            type="submit"
                            className="px-4 py-2 text-xs font-semibold text-black bg-amber-300 rounded-lg cursor-pointer"
                          >
                            Verify Email Token
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
