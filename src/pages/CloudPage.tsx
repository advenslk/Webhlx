import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  Cloud,
  Cpu,
  Globe,
  Loader2,
  Power,
  RefreshCw,
  RotateCw,
  Server,
  Shield,
  Square,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { DivisionBanner3D } from '../components/DivisionBanner3D';
import { Surface3D } from '../components/Surface3D';
import { useAppContext } from '../context/AppContext';
import { ApiError, apiRequest } from '../lib/api';
import { PageRoute } from '../types/navigation';

interface CloudPlan {
  id: string;
  name: string;
  category: string;
  cpu: string;
  ram_gb: number;
  storage_gb: number;
  network: string;
  price_monthly_usd: number;
  hzl_cost: number;
  location: string;
  features_json: string;
}

interface CloudServerRecord {
  id: string;
  plan_id: string;
  plan_name: string | null;
  name: string;
  node_name: string;
  pterodactyl_identifier: string;
  status: string;
  location: string;
  cpu?: string;
  ram_gb?: number;
  storage_gb?: number;
  owner_email?: string;
  created_at: string;
}

interface PterodactylStatus {
  configured: boolean;
  panelUrl: string | null;
  hasClientKey: boolean;
  requiredEnvVars: string[];
}

interface CloudPageProps {
  onNavigate: (route: PageRoute, division?: 'cloud') => void;
}

export function CloudPage({ onNavigate }: CloudPageProps) {
  const { user } = useAppContext();
  const [plans, setPlans] = useState<CloudPlan[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [pteroStatus, setPteroStatus] = useState<PterodactylStatus | null>(null);
  const [servers, setServers] = useState<CloudServerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServers, setLoadingServers] = useState(false);

  // Server provisioning request form
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [serverName, setServerName] = useState('');
  const [requestNotice, setRequestNotice] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Live resource & power states per server
  const [resourceMap, setResourceMap] = useState<Record<string, unknown>>({});
  const [serverOpMsg, setServerOpMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest<{ plans: CloudPlan[] }>('/api/cloud/plans'),
      apiRequest<PterodactylStatus>('/api/cloud/pterodactyl/status'),
    ])
      .then(([plansRes, pteroRes]) => {
        if (!active) return;
        const list = plansRes.plans || [];
        setPlans(list);
        if (list.length > 0) setSelectedPlanId(list[0].id);
        setPteroStatus(pteroRes);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const loadServers = useCallback(async () => {
    if (!user) {
      setServers([]);
      return;
    }
    setLoadingServers(true);
    try {
      const res = await apiRequest<{
        servers: CloudServerRecord[];
        pterodactyl: PterodactylStatus;
      }>('/api/cloud/servers');
      setServers(res.servers || []);
      setPteroStatus(res.pterodactyl);
    } catch {
      // ignore transient error
    } finally {
      setLoadingServers(false);
    }
  }, [user]);

  useEffect(() => {
    void loadServers();
  }, [loadServers]);

  const categories = ['All', ...Array.from(new Set(plans.map((p) => p.category)))];
  const visiblePlans =
    categoryFilter === 'All' ? plans : plans.filter((p) => p.category === categoryFilter);

  const handleRequestServer = async (e: FormEvent) => {
    e.preventDefault();
    setRequestError(null);
    setRequestNotice(null);

    if (!user) {
      onNavigate('auth');
      return;
    }
    if (!selectedPlanId || serverName.trim().length < 3) {
      setRequestError('Select a hosting tier and provide a server hostname (min 3 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest<{ server: CloudServerRecord }>('/api/cloud/servers/request', {
        method: 'POST',
        body: JSON.stringify({ planId: selectedPlanId, name: serverName.trim() }),
      });
      setServerName('');
      setRequestNotice(
        `Server request "${res.server.name}" (${res.server.id}) queued as pending provisioning.`,
      );
      await loadServers();
    } catch (err) {
      setRequestError(err instanceof ApiError ? err.message : 'Unable to submit server request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInspectResources = async (serverId: string) => {
    setServerOpMsg(null);
    try {
      const res = await apiRequest<{ resources: unknown }>(`/api/cloud/servers/${serverId}/resources`);
      setResourceMap((prev) => ({ ...prev, [serverId]: res.resources }));
    } catch (err) {
      setServerOpMsg(err instanceof ApiError ? err.message : 'Unable to fetch server telemetry.');
    }
  };

  const handlePower = async (serverId: string, signal: 'start' | 'stop' | 'restart') => {
    setServerOpMsg(null);
    try {
      await apiRequest(`/api/cloud/servers/${serverId}/power`, {
        method: 'POST',
        body: JSON.stringify({ signal }),
      });
      setServerOpMsg(`Power signal "${signal}" dispatched to Pterodactyl daemon.`);
    } catch (err) {
      setServerOpMsg(err instanceof ApiError ? err.message : 'Power signal rejected.');
    }
  };

  return (
    <div className="bg-[#F4F4F5] text-[#0A0A0B]">
      {/* Smooth Full-Bleed Atmospheric Cloud Banner Background + Floating 3D Spec Cards */}
      <DivisionBanner3D
        imageSrc="/assets/aistudio/file_0000000027788211b1e314262e805179_c9c9b7ff.png"
        imageAlt="HelzerX Cloud — Modern Cloud Solutions 2026 Background Banner"
        divisionLabel="HelzerX Cloud · Minecraft & Game Nodes · Proxmox LXC · sn1.helzerx.cyou"
        description="Provision isolated Proxmox LXC VPS nodes and high-tick Paper Minecraft servers backed by server-side Pterodactyl orchestration, DDoS filtering, and automated ZFS snapshots."
        fallbackTitle="HelzerX Cloud"
        fallbackSubtitle="Modern Cloud Solutions · Proxmox LXC & Pterodactyl Compute"
        icon={<Cloud className="w-6 h-6" />}
        actions={
          <>
            <a
              href="#cloud-plans"
              className="px-6 py-3 text-sm font-semibold text-[#0A0A0B] bg-white rounded-xl hover:bg-neutral-100 transition-colors shadow-[0_14px_34px_rgba(0,0,0,0.35)] cursor-pointer"
            >
              Browse Hosting Plans
            </a>
            <button
              type="button"
              onClick={() => onNavigate(user ? 'dashboard' : 'auth')}
              className="inline-flex items-center gap-1.5 px-6 py-3 text-sm font-semibold text-white bg-white/15 backdrop-blur-md border border-white/25 rounded-xl hover:bg-white/25 transition-colors cursor-pointer"
            >
              <span>{user ? 'Open Server Console' : 'Sign In to Provision'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        }
        specs={[
          {
            value: '20.0 TPS',
            label: 'Paper & Purpur Tick',
            detail: 'High-clock AMD Ryzen EPYC compute tuned for zero-lag multiplayer worlds.',
          },
          {
            value: 'ZFS NVMe',
            label: 'Mirrored Gen4 Arrays',
            detail: 'Instant snapshots and isolated Proxmox LXC containers with root SSH.',
          },
          {
            value: '10 Gbps',
            label: 'Anycast DDoS Mesh',
            detail: 'Always-on Layer 4 & Layer 7 mitigation shielding sn1.helzerx.cyou.',
          },
          {
            value: '99.98%',
            label: 'Target Uptime SLA',
            detail: 'Zero-leak backend Pterodactyl orchestration with live daemon power controls.',
          },
        ]}
      />

      {/* Preserved Member Cloud Console 3D Hardware Bezel Showcase */}
      <section className="relative bg-[#F4F4F5] pt-4 pb-20 md:pb-24 z-10">
        <div className="max-w-[840px] mx-auto px-6">
          <div className="text-center mb-8">
            <div className="text-xs font-medium text-neutral-500">Live Infrastructure Interface</div>
            <h2 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-[#0A0A0B]">
              Member Cloud Console
            </h2>
          </div>
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-7 inset-x-10 h-14 rounded-full bg-black/25 blur-2xl"
            />
            <div className="helzerx-perspective-frame rounded-[24px] overflow-hidden border-[6px] border-[#141417] bg-[#141417] shadow-[0_42px_95px_-20px_rgba(10,10,14,0.44)]">
              <img
                src="/assets/aistudio/IMG_20261121_083503_16556201.JPG"
                alt="HelzerX Member Cloud Console showing verified HZL credit wallet and active Proxmox LXC and Minecraft servers"
                referrerPolicy="no-referrer"
                className="w-full h-auto block object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pterodactyl Live Integration Status & Server Locations */}
      <section className="bg-[#F4F4F5] py-14 border-t border-black/[0.06]">
        <div className="max-w-[1160px] mx-auto px-6 space-y-10">
          <Surface3D intensity={8}>
            <div className="p-7 md:p-9 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
                  <Cpu className="w-4 h-4 text-[#0A0A0B]" />
                  <span>Pterodactyl Panel Orchestration</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#0A0A0B] tracking-tight">
                  {pteroStatus?.configured
                    ? `Connected to ${pteroStatus.panelUrl}`
                    : 'Server-Side Pterodactyl Proxy Ready'}
                </h2>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {pteroStatus?.configured
                    ? 'Authenticated users linked to a Pterodactyl server identifier can inspect live CPU and RAM metrics and trigger power signals directly from this console.'
                    : 'All Pterodactyl calls execute strictly on the Express backend so panel credentials are never exposed in client bundles. Set the environment variables on your server to enable live daemon telemetry.'}
                </p>
                {!pteroStatus?.configured && pteroStatus?.requiredEnvVars && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {pteroStatus.requiredEnvVars.map((envVar) => (
                      <span
                        key={envVar}
                        className="text-xs font-medium px-3 py-1 rounded-lg bg-[#F4F4F5] border border-black/[0.1] text-[#0A0A0B]"
                      >
                        {envVar}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-[#111114] text-white p-6 min-w-[260px] space-y-3 text-xs shadow-[0_24px_50px_-14px_rgba(0,0,0,0.45)] border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">API Connection</span>
                  <span className="font-semibold text-white">
                    {pteroStatus?.configured ? 'Configured' : 'Awaiting Key'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Client Power Control</span>
                  <span className="font-semibold text-neutral-200">
                    {pteroStatus?.hasClientKey ? 'Enabled' : 'Pending Key'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Primary Node</span>
                  <span className="font-semibold text-white">hx-nd-01-10</span>
                </div>
              </div>
            </div>
          </Surface3D>

          {/* Infrastructure Pillars + Regions (Elevated 3D Staggered Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Surface3D intensity={12} delay={0}>
              <article className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-[#111114] flex items-center justify-center shadow-[0_12px_24px_rgba(10,10,14,0.28)] border border-white/10">
                    <Server className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-[#0A0A0B]">Minecraft Hosting</h3>
                </div>
                <p className="mt-2.5 text-xs text-neutral-600 leading-relaxed">
                  Paper, Purpur, Forge, and Velocity proxy nodes tuned for stable 20.0 TPS under load.
                </p>
              </article>
            </Surface3D>
            <Surface3D intensity={12} delay={0.05}>
              <article className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-[#111114] flex items-center justify-center shadow-[0_12px_24px_rgba(10,10,14,0.28)] border border-white/10">
                    <Cloud className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-[#0A0A0B]">Proxmox LXC &amp; VPS</h3>
                </div>
                <p className="mt-2.5 text-xs text-neutral-600 leading-relaxed">
                  Root SSH Debian &amp; Ubuntu containers backed by ECC DDR5 and mirrored ZFS NVMe pools.
                </p>
              </article>
            </Surface3D>
            <Surface3D intensity={12} delay={0.1}>
              <article className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-[#111114] flex items-center justify-center shadow-[0_12px_24px_rgba(10,10,14,0.28)] border border-white/10">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-[#0A0A0B]">Server Management</h3>
                </div>
                <p className="mt-2.5 text-xs text-neutral-600 leading-relaxed">
                  Automated snapshot scheduling, firewall hardening, and 24/7 engineering escalation.
                </p>
              </article>
            </Surface3D>
            <Surface3D intensity={12} delay={0.15}>
              <article className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-[#111114] flex items-center justify-center shadow-[0_12px_24px_rgba(10,10,14,0.28)] border border-white/10">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-[#0A0A0B]">Global Server Locations</h3>
                </div>
                <p className="mt-2.5 text-xs text-neutral-600 leading-relaxed">
                  Singapore (sn1.helzerx.cyou), Frankfurt EU, and US-East anycast routing.
                </p>
              </article>
            </Surface3D>
          </div>
        </div>
      </section>

      {/* Live Plans + Provisioning Form */}
      <section id="cloud-plans" className="bg-[#F4F4F5] py-16 md:py-24 border-t border-black/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-[clamp(1.85rem,3.5vw,2.75rem)] font-extrabold tracking-tight text-[#0A0A0B]">
                Hosting Plans &amp; Provisioning
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                Select a tier from the live catalog to submit a server provisioning request.
              </p>
            </div>

            <div className="inline-flex flex-wrap gap-1 p-1.5 rounded-xl bg-white border border-black/[0.08] shadow-sm">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-[#0A0A0B] text-white'
                      : 'text-neutral-600 hover:text-[#0A0A0B] hover:bg-neutral-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-sm text-neutral-600">
              <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0B]" />
              <span>Loading compute tiers...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visiblePlans.map((plan, idx) => {
                let features: string[] = [];
                try {
                  features = JSON.parse(plan.features_json || '[]');
                } catch {
                  features = [];
                }
                const isSelected = selectedPlanId === plan.id;
                return (
                  <Surface3D
                    key={plan.id}
                    intensity={14}
                    delay={idx * 0.05}
                    variant={isSelected ? 'dark' : 'light'}
                  >
                    <article className="h-full flex flex-col justify-between p-7">
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`font-semibold ${
                              isSelected ? 'text-neutral-300' : 'text-neutral-600'
                            }`}
                          >
                            {plan.category}
                          </span>
                          <span className={isSelected ? 'text-neutral-400' : 'text-neutral-500'}>
                            {plan.location}
                          </span>
                        </div>
                        <h3
                          className={`mt-2 text-xl font-bold ${
                            isSelected ? 'text-white' : 'text-[#0A0A0B]'
                          }`}
                        >
                          {plan.name}
                        </h3>
                        <div className="mt-3 flex items-baseline gap-2">
                          <span
                            className={`text-3xl font-extrabold tabular-nums tracking-tight ${
                              isSelected ? 'text-white' : 'text-[#0A0A0B]'
                            }`}
                          >
                            ${plan.price_monthly_usd.toFixed(2)}
                          </span>
                          <span
                            className={`text-xs ${
                              isSelected ? 'text-neutral-400' : 'text-neutral-600'
                            }`}
                          >
                            / month · {plan.hzl_cost} HZL
                          </span>
                        </div>

                        <div
                          className={`mt-4 pt-4 border-t grid grid-cols-2 gap-2 text-xs tabular-nums font-medium ${
                            isSelected
                              ? 'border-white/10 text-neutral-200'
                              : 'border-black/[0.08] text-neutral-700'
                          }`}
                        >
                          <div>{plan.cpu}</div>
                          <div>{plan.ram_gb} GB RAM</div>
                          <div>{plan.storage_gb} GB NVMe</div>
                          <div>{plan.network}</div>
                        </div>

                        <ul className="mt-4 space-y-2">
                          {features.map((f) => (
                            <li
                              key={f}
                              className={`flex items-center gap-2 text-xs ${
                                isSelected ? 'text-neutral-200' : 'text-neutral-700'
                              }`}
                            >
                              <Check
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSelected ? 'text-white' : 'text-[#0A0A0B]'
                                }`}
                              />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlanId(plan.id);
                          document.getElementById('request-server-form')?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                          });
                        }}
                        className={`mt-6 w-full py-2.5 px-4 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-white text-[#0A0A0B] hover:bg-neutral-200 shadow-lg'
                            : 'bg-[#0A0A0B] text-white hover:bg-neutral-800'
                        }`}
                      >
                        {isSelected ? 'Selected for Deployment' : `Select ${plan.name}`}
                      </button>
                    </article>
                  </Surface3D>
                );
              })}
            </div>
          )}

          {/* Provisioning Request Form & User Servers */}
          <div
            id="request-server-form"
            className="mt-14 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-start"
          >
            <Surface3D intensity={6}>
              <form onSubmit={handleRequestServer} className="p-7 space-y-5">
                <div>
                  <div className="text-xs font-medium text-neutral-500">Server Provisioning</div>
                  <h3 className="mt-1 text-lg font-bold text-[#0A0A0B]">
                    Request New Server Instance
                  </h3>
                </div>

                <div>
                  <label
                    htmlFor="cloud-plan-select"
                    className="block text-xs font-semibold text-[#0A0A0B] mb-1.5"
                  >
                    Hosting Plan
                  </label>
                  <select
                    id="cloud-plan-select"
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full rounded-xl bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] focus:outline-none focus:border-black"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.ram_gb}GB RAM · ${p.price_monthly_usd}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="cloud-srv-name"
                    className="block text-xs font-semibold text-[#0A0A0B] mb-1.5"
                  >
                    Instance Hostname
                  </label>
                  <input
                    id="cloud-srv-name"
                    type="text"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    placeholder="my-smp-node-01"
                    className="w-full rounded-xl bg-[#F8F8FA] border border-black/[0.12] px-3.5 py-2.5 text-sm text-[#0A0A0B] placeholder:text-neutral-400 focus:outline-none focus:border-black"
                  />
                </div>

                {requestError && (
                  <p role="alert" className="text-xs text-rose-700 font-medium">
                    {requestError}
                  </p>
                )}
                {requestNotice && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    {requestNotice}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-[#0A0A0B] rounded-xl hover:bg-neutral-800 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{user ? 'Submit Server Request' : 'Sign In to Request Server'}</span>
                </button>
              </form>
            </Surface3D>

            {/* User Server Table / Console */}
            <Surface3D intensity={6}>
              <div className="p-7">
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-black/[0.08]">
                  <div>
                    <h3 className="text-lg font-bold text-[#0A0A0B]">Your Cloud Servers</h3>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      Real-time container records and Pterodactyl daemon controls.
                    </p>
                  </div>
                  {user && (
                    <button
                      type="button"
                      onClick={() => void loadServers()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0A0A0B] border border-black/15 rounded-lg hover:bg-neutral-100 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingServers ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  )}
                </div>

                {serverOpMsg && (
                  <div className="mt-4 rounded-xl bg-neutral-100 border border-black/10 p-3 text-xs text-[#0A0A0B] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{serverOpMsg}</span>
                  </div>
                )}

                {!user ? (
                  <div className="py-10 text-center space-y-3">
                    <p className="text-sm text-neutral-600">
                      Sign in to view your provisioned servers, allocations, and Pterodactyl controls.
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('auth')}
                      className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0A0A0B] rounded-xl hover:bg-neutral-800 cursor-pointer"
                    >
                      Sign In / Create Account
                    </button>
                  </div>
                ) : servers.length === 0 ? (
                  <div className="py-10 text-center text-sm text-neutral-600">
                    No cloud servers requested yet. Select a hosting plan on the left to deploy your
                    first instance.
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {servers.map((srv) => {
                      const hasIdentifier = Boolean(srv.pterodactyl_identifier);
                      const telemetry = resourceMap[srv.id] as Record<string, unknown> | undefined;
                      return (
                        <div
                          key={srv.id}
                          className="rounded-2xl bg-[#F8F8FA] border border-black/[0.08] p-4 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="text-sm font-bold text-[#0A0A0B]">{srv.name}</div>
                              <div className="text-xs text-neutral-600 tabular-nums mt-0.5">
                                {srv.plan_name || srv.plan_id} · {srv.node_name} · {srv.location}
                              </div>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#0A0A0B] text-white">
                              {srv.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-black/[0.06]">
                            <div className="text-xs text-neutral-600">
                              {hasIdentifier
                                ? `Pterodactyl ID: ${srv.pterodactyl_identifier}`
                                : 'Awaiting Admin Pterodactyl identifier binding'}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={!hasIdentifier}
                                onClick={() => void handleInspectResources(srv.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-black/15 text-[#0A0A0B] hover:bg-neutral-200 disabled:opacity-40 cursor-pointer"
                              >
                                <Activity className="w-3 h-3" />
                                <span>Metrics</span>
                              </button>
                              <button
                                type="button"
                                disabled={!hasIdentifier}
                                onClick={() => void handlePower(srv.id, 'start')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 cursor-pointer"
                              >
                                <Power className="w-3 h-3" />
                                <span>Start</span>
                              </button>
                              <button
                                type="button"
                                disabled={!hasIdentifier}
                                onClick={() => void handlePower(srv.id, 'restart')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-40 cursor-pointer"
                              >
                                <RotateCw className="w-3 h-3" />
                                <span>Restart</span>
                              </button>
                              <button
                                type="button"
                                disabled={!hasIdentifier}
                                onClick={() => void handlePower(srv.id, 'stop')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-40 cursor-pointer"
                              >
                                <Square className="w-3 h-3" />
                                <span>Stop</span>
                              </button>
                            </div>
                          </div>

                          {telemetry && (
                            <pre className="text-xs font-mono text-neutral-200 bg-[#0A0A0C] p-3 rounded-xl border border-black overflow-x-auto">
                              {JSON.stringify(telemetry, null, 2)}
                            </pre>
                          )}
                        </div>
                      );
                    })}
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
