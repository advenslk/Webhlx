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
import { Surface3D } from '../components/Surface3D';
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
      <div className="bg-[#F4F4F5] text-[#0A0A0B] min-h-[70vh] flex items-center justify-center px-6">
        <Surface3D intensity={5} className="max-w-md w-full">
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#111114] text-white flex items-center justify-center mx-auto shadow-[0_10px_20px_rgba(10,10,11,0.22)]">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-[#0A0A0B]">Customer Dashboard</h1>
            <p className="text-sm text-neutral-600">
              Sign in to access your servers, orders, invoices, Studio projects, support tickets,
              and account security settings.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('auth')}
              className="w-full py-2.5 px-5 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg hover:bg-neutral-800 cursor-pointer"
            >
              Sign In / Create Account
            </button>
          </div>
        </Surface3D>
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
    { label: 'Servers', value: data?.servers.length ?? 0, color: '#0891b2' },
    { label: 'Orders', value: data?.orders.length ?? 0, color: '#0A0A0B' },
    { label: 'Projects', value: data?.projects.length ?? 0, color: '#00b4d8' },
    { label: 'Tickets', value: data?.tickets.length ?? 0, color: '#059669' },
  ];
  const maxChartVal = Math.max(1, ...chartSeries.map((c) => c.value));

  return (
    <div className="bg-[#F4F4F5] text-[#0A0A0B] min-h-screen py-10 md:py-14">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-black/[0.08]">
          <div>
            <div className="text-xs font-semibold text-neutral-500 capitalize">
              Customer Portal · {user.role.replace(/_/g, ' ')}
            </div>
            <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-[#0A0A0B] tracking-tight">
              Welcome, {user.name}
            </h1>
            <p className="mt-1 text-xs text-neutral-600">
              {user.email} · {user.email_verified ? 'Email Verified' : 'Email Unverified'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {isAdminRole && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0A0A0B] bg-white border border-black/15 hover:border-black/35 rounded-lg cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('cloud')}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg hover:bg-neutral-800 cursor-pointer"
            >
              Deploy Server
            </button>
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="px-4 py-2 text-xs font-semibold text-[#0A0A0B] bg-white border border-black/15 rounded-lg hover:border-black/35 cursor-pointer"
            >
              Visit Shop
            </button>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
          {/* Sidebar */}
          <aside className="rounded-2xl bg-white border border-black/[0.08] shadow-sm p-3 space-y-1">
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
                      ? 'bg-[#0A0A0B] text-white font-semibold'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-[#0A0A0B]'
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
              <div className="py-16 flex items-center justify-center gap-2 text-sm text-neutral-600">
                <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0B]" />
                <span>Loading your account telemetry...</span>
              </div>
            ) : (
              <>
                {tab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Surface3D intensity={11} delay={0.04}>
                        <div className="p-5">
                          <div className="text-xs text-neutral-600">Cloud Servers</div>
                          <div className="mt-2 text-2xl font-extrabold tracking-tight text-[#0A0A0B] tabular-nums">
                            {data?.servers.length ?? 0}
                          </div>
                        </div>
                      </Surface3D>
                      <Surface3D intensity={11} delay={0.08}>
                        <div className="p-5">
                          <div className="text-xs text-neutral-600">Total Order Value</div>
                          <div className="mt-2 text-2xl font-extrabold tracking-tight text-[#0A0A0B] tabular-nums">
                            ${totalSpend.toLocaleString()}
                          </div>
                        </div>
                      </Surface3D>
                      <Surface3D intensity={11} delay={0.12}>
                        <div className="p-5">
                          <div className="text-xs text-neutral-600">Studio Projects</div>
                          <div className="mt-2 text-2xl font-extrabold tracking-tight text-[#0A0A0B] tabular-nums">
                            {data?.projects.length ?? 0}
                          </div>
                        </div>
                      </Surface3D>
                      <Surface3D intensity={11} delay={0.16}>
                        <div className="p-5">
                          <div className="text-xs text-neutral-600">Open Tickets</div>
                          <div className="mt-2 text-2xl font-extrabold tracking-tight text-[#0A0A0B] tabular-nums">
                            {data?.tickets.length ?? 0}
                          </div>
                        </div>
                      </Surface3D>
                    </div>

                    {/* Launch 2027 Early Access Status */}
                    <Surface3D variant="dark" intensity={8}>
                      <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-medium text-neutral-300">
                            <Sparkles className="w-4 h-4 text-white" />
                            <span>Launch 01.01.2027 · 8GB RAM Server Campaign</span>
                          </div>
                          <h2 className="mt-1 text-lg font-bold text-white">
                            {data?.earlyAccess
                              ? `Eligibility Status: ${data.earlyAccess.eligibility_status}`
                              : 'Not yet registered for Launch 2027 Early Access'}
                          </h2>
                          <p className="mt-1 text-xs text-neutral-300">
                            {data?.earlyAccess?.slot_number
                              ? `Confirmed at Early Access slot #${data.earlyAccess.slot_number} of 50.`
                              : 'Register and verify your account email before January 1, 2027 to qualify for the first-50 8GB RAM server allocation.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onNavigate('launch')}
                          className="px-4 py-2 text-xs font-bold text-[#0A0A0B] bg-white rounded-lg hover:bg-neutral-200 shrink-0 cursor-pointer"
                        >
                          Manage Early Access
                        </button>
                      </div>
                    </Surface3D>

                    {/* Account Resource Distribution Chart */}
                    <Surface3D intensity={6}>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-sm font-bold text-[#0A0A0B] flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#0A0A0B]" />
                            <span>Workspace Activity Summary</span>
                          </h2>
                          <span className="text-xs text-neutral-500">Live Account Records</span>
                        </div>
                        <div className="space-y-3">
                          {chartSeries.map((bar) => (
                            <div key={bar.label} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-neutral-700 font-medium">{bar.label}</span>
                                <span className="font-bold text-[#0A0A0B] tabular-nums">
                                  {bar.value}
                                </span>
                              </div>
                              <div className="h-2.5 w-full rounded-full bg-neutral-200 overflow-hidden">
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
                    </Surface3D>
                  </div>
                )}

                {tab === 'servers' && (
                  <Surface3D intensity={5}>
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-[#0A0A0B]">
                          Provisioned Cloud Servers
                        </h2>
                        <button
                          type="button"
                          onClick={() => onNavigate('cloud')}
                          className="text-xs font-bold text-[#0A0A0B] hover:text-neutral-600 cursor-pointer"
                        >
                          Open Cloud Console →
                        </button>
                      </div>
                      {data?.servers.length === 0 ? (
                        <p className="py-8 text-center text-xs text-neutral-600">
                          No servers requested yet. Visit HelzerX Cloud to launch a Minecraft or
                          Proxmox node.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {data?.servers.map((srv) => (
                            <div
                              key={srv.id}
                              className="rounded-xl bg-[#F8F8FA] border border-black/[0.08] p-4 flex flex-wrap items-center justify-between gap-3"
                            >
                              <div>
                                <div className="text-sm font-bold text-[#0A0A0B]">{srv.name}</div>
                                <div className="text-xs text-neutral-600">
                                  {srv.plan_name || srv.plan_id} · {srv.node_name} · {srv.location}
                                </div>
                              </div>
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#0A0A0B] text-white capitalize">
                                {srv.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Surface3D>
                )}

                {tab === 'orders' && (
                  <div className="space-y-6">
                    <Surface3D intensity={5}>
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-bold text-[#0A0A0B] flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-[#0A0A0B]" />
                            <span>Order &amp; Payment History</span>
                          </h2>
                        </div>
                        {data?.orders.length === 0 ? (
                          <p className="py-6 text-center text-xs text-neutral-600">
                            No orders placed yet.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {data?.orders.map((ord) => {
                              const items = data.orderItems.filter((i) => i.order_id === ord.id);
                              return (
                                <div
                                  key={ord.id}
                                  className="rounded-xl bg-[#F8F8FA] border border-black/[0.08] p-4 space-y-2 text-xs"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-bold text-[#0A0A0B] tabular-nums">
                                      {ord.id}
                                    </span>
                                    <span className="font-bold text-[#0A0A0B] capitalize tabular-nums">
                                      {ord.status.replace(/_/g, ' ')} · $
                                      {ord.total_usd.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="text-neutral-700">
                                    {items
                                      .map((it) => `${it.quantity}× ${it.product_name}`)
                                      .join(', ')}
                                  </div>
                                  <div className="text-neutral-500 tabular-nums">
                                    {new Date(ord.created_at).toLocaleString()} · Payment:{' '}
                                    {ord.payment_status}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </Surface3D>

                    <Surface3D intensity={5}>
                      <div className="p-6 space-y-4">
                        <h2 className="text-lg font-bold text-[#0A0A0B]">Billing Invoices</h2>
                        {data?.invoices.length === 0 ? (
                          <p className="py-4 text-xs text-neutral-600">
                            No invoices generated yet.
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="text-neutral-500 border-b border-black/[0.08]">
                                <tr>
                                  <th className="py-2 pr-4">Invoice #</th>
                                  <th className="py-2 pr-4">Order</th>
                                  <th className="py-2 pr-4">Amount</th>
                                  <th className="py-2 pr-4">Status</th>
                                  <th className="py-2">Issued</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-black/[0.06] tabular-nums">
                                {data?.invoices.map((inv) => (
                                  <tr key={inv.id}>
                                    <td className="py-2.5 pr-4 font-semibold text-[#0A0A0B]">
                                      {inv.invoice_number}
                                    </td>
                                    <td className="py-2.5 pr-4 text-neutral-600">{inv.order_id}</td>
                                    <td className="py-2.5 pr-4 font-semibold text-[#0A0A0B]">
                                      ${inv.amount_usd.toFixed(2)}
                                    </td>
                                    <td className="py-2.5 pr-4 font-semibold text-[#0A0A0B] capitalize">
                                      {inv.status}
                                    </td>
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
                    </Surface3D>
                  </div>
                )}

                {tab === 'projects' && (
                  <Surface3D intensity={5}>
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-[#0A0A0B] flex items-center gap-2">
                          <Palette className="w-4 h-4 text-[#0A0A0B]" />
                          <span>Studio Projects</span>
                        </h2>
                        <button
                          type="button"
                          onClick={() => onNavigate('studio')}
                          className="text-xs font-bold text-[#0A0A0B] hover:text-neutral-600 cursor-pointer"
                        >
                          Open Project Messages →
                        </button>
                      </div>
                      {data?.projects.length === 0 ? (
                        <p className="py-8 text-center text-xs text-neutral-600">
                          No Studio projects submitted yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {data?.projects.map((prj) => (
                            <div
                              key={prj.id}
                              className="rounded-xl bg-[#F8F8FA] border border-black/[0.08] p-4 flex flex-wrap items-center justify-between gap-2 text-xs"
                            >
                              <div>
                                <div className="text-sm font-bold text-[#0A0A0B]">{prj.title}</div>
                                <div className="text-neutral-600">
                                  {prj.service_type} · {prj.budget_range} · {prj.timeline}
                                </div>
                              </div>
                              <span className="font-semibold px-2.5 py-1 rounded-md bg-[#0A0A0B] text-white capitalize">
                                {prj.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Surface3D>
                )}

                {tab === 'tickets' && (
                  <Surface3D intensity={5}>
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-[#0A0A0B]">Support Tickets</h2>
                        <button
                          type="button"
                          onClick={() => onNavigate('support')}
                          className="text-xs font-bold text-[#0A0A0B] hover:text-neutral-600 cursor-pointer"
                        >
                          Open Support Desk →
                        </button>
                      </div>
                      {data?.tickets.length === 0 ? (
                        <p className="py-8 text-center text-xs text-neutral-600">
                          No active support tickets.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {data?.tickets.map((t) => (
                            <div
                              key={t.id}
                              className="rounded-xl bg-[#F8F8FA] border border-black/[0.08] p-4 flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="text-sm font-bold text-[#0A0A0B]">{t.subject}</div>
                                <div className="text-neutral-600">
                                  {t.category} · Priority: {t.priority}
                                </div>
                              </div>
                              <span className="font-semibold text-[#0A0A0B] capitalize">
                                {t.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Surface3D>
                )}

                {tab === 'notifications' && (
                  <Surface3D intensity={5}>
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-[#0A0A0B]">Notifications</h2>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => void handleMarkAllRead()}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A0A0B] hover:text-neutral-600 cursor-pointer"
                          >
                            <CheckCheck className="w-4 h-4" />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>
                      {data?.notifications.length === 0 ? (
                        <p className="py-8 text-center text-xs text-neutral-600">All caught up.</p>
                      ) : (
                        <div className="space-y-2.5">
                          {data?.notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`rounded-xl border p-4 text-xs ${
                                n.read === 0
                                  ? 'bg-neutral-100 border-black/15'
                                  : 'bg-[#F8F8FA] border-black/[0.08]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#0A0A0B]">{n.title}</span>
                                <span className="text-neutral-500 tabular-nums">
                                  {new Date(n.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="mt-1 text-neutral-700">{n.body}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Surface3D>
                )}

                {tab === 'security' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Surface3D intensity={5}>
                      <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
                          <User className="w-4 h-4 text-[#0A0A0B]" />
                          <span>Profile Preferences</span>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#0A0A0B] mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3 py-2 text-xs text-[#0A0A0B]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#0A0A0B] mb-1">
                            Avatar URL (https://...)
                          </label>
                          <input
                            type="url"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3 py-2 text-xs text-[#0A0A0B]"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-xs text-neutral-700">
                          <input
                            type="checkbox"
                            checked={notifyEmail}
                            onChange={(e) => setNotifyEmail(e.target.checked)}
                          />
                          <span>Receive order &amp; product release emails</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-neutral-700">
                          <input
                            type="checkbox"
                            checked={notifySecurity}
                            onChange={(e) => setNotifySecurity(e.target.checked)}
                          />
                          <span>Receive login &amp; security alerts</span>
                        </label>
                        {profileMsg && (
                          <p className="text-xs font-semibold text-[#0A0A0B]">{profileMsg}</p>
                        )}
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg cursor-pointer"
                        >
                          Save Profile
                        </button>
                      </form>
                    </Surface3D>

                    <div className="space-y-6">
                      <Surface3D intensity={5}>
                        <form onSubmit={handleChangePassword} className="p-6 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
                            <Lock className="w-4 h-4 text-[#0A0A0B]" />
                            <span>Password Update</span>
                          </div>
                          <input
                            type="password"
                            required
                            placeholder="Current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3 py-2 text-xs text-[#0A0A0B]"
                          />
                          <input
                            type="password"
                            required
                            placeholder="New password (min 8 characters)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-3 py-2 text-xs text-[#0A0A0B]"
                          />
                          {pwdMsg && (
                            <p className="text-xs font-semibold text-[#0A0A0B]">{pwdMsg}</p>
                          )}
                          <button
                            type="submit"
                            className="px-4 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg cursor-pointer"
                          >
                            Update Password
                          </button>
                        </form>
                      </Surface3D>

                      {!user.email_verified && (
                        <Surface3D intensity={5}>
                          <form
                            onSubmit={handleVerifyEmail}
                            className="p-6 space-y-3 border border-amber-300 bg-amber-50/50 rounded-2xl"
                          >
                            <div className="text-xs font-bold text-amber-800">
                              Email verification required for Early Access
                            </div>
                            <input
                              type="text"
                              required
                              placeholder="Paste email verification token"
                              value={verifyToken}
                              onChange={(e) => setVerifyToken(e.target.value)}
                              className="w-full rounded-lg bg-white border border-black/[0.12] px-3 py-2 text-xs text-[#0A0A0B] font-mono"
                            />
                            {verifyMsg && (
                              <p className="text-xs font-semibold text-emerald-700">{verifyMsg}</p>
                            )}
                            <button
                              type="submit"
                              className="px-4 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg cursor-pointer"
                            >
                              Verify Email Token
                            </button>
                          </form>
                        </Surface3D>
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
