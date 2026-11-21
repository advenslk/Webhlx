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
        `Server request "${res.server.name}" (${res.server.id}) queued as pending_provisioning.`,
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
    <div className="bg-black text-white">
      {/* Page Hero */}
      <section className="relative overflow-hidden helzerx-hero-aura pt-20 pb-28 md:pt-28 md:pb-36">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[440px] left-1/2 -translate-x-1/2 w-[165%] h-[540px] rounded-[100%] bg-black border-t border-violet-300/40 shadow-[0_-20px_80px_rgba(167,139,250,0.38)]"
        />

        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs md:text-sm font-medium text-violet-200/85 mb-6">
            <span>HelzerX Cloud</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Minecraft &amp; Game Servers</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Proxmox LXC &amp; VPS</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>sn1.helzerx.cyou</span>
          </div>

          <h1 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-extrabold tracking-[-0.03em] leading-[1.04] text-white max-w-[18ch] mx-auto">
            Member Cloud Infrastructure
          </h1>
          <p className="mt-6 max-w-[60ch] mx-auto text-base md:text-lg leading-[1.6] text-neutral-200/90">
            Provision isolated Proxmox LXC VPS nodes and high-tick Paper Minecraft servers backed by
            server-side Pterodactyl API orchestration, DDoS protection, and automated ZFS snapshots.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#cloud-plans"
              className="px-6 py-3 text-sm font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Browse Hosting Plans
            </a>
            <button
              type="button"
              onClick={() => onNavigate(user ? 'dashboard' : 'auth')}
              className="inline-flex items-center gap-1.5 px-5 py-3 text-sm font-medium text-neutral-200 hover:text-white border border-white/15 rounded-lg hover:border-white/30 transition-colors cursor-pointer"
            >
              <span>{user ? 'Open Server Console' : 'Sign In to Provision'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Preserved Member Cloud Console 3D Showcase */}
      <section className="relative bg-black pb-20 md:pb-24 -mt-12 z-10">
        <div className="max-w-[1040px] mx-auto px-6">
          <div className="helzerx-perspective-frame rounded-2xl overflow-hidden border border-white/[0.14] bg-[#08080D] shadow-[0_24px_70px_rgba(0,0,0,0.6),0_0_75px_rgba(124,58,237,0.28)]">
            <img
              src="/assets/aistudio/IMG_20261121_083503_16556201.JPG"
              alt="HelzerX Member Cloud Console showing verified HZL credit wallet and active Proxmox LXC and Minecraft servers"
              referrerPolicy="no-referrer"
              className="w-full h-auto block object-cover"
            />
          </div>
        </div>
      </section>

      {/* Pterodactyl Live Integration Status & Server Locations */}
      <section className="bg-black py-12 border-t border-white/[0.06]">
        <div className="max-w-[1160px] mx-auto px-6 space-y-8">
          <div className="rounded-2xl bg-[#08080F] border border-white/[0.12] p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                <Cpu className="w-4 h-4" />
                <span>PTERODACTYL PANEL API INTEGRATION</span>
              </div>
              <h2 className="text-xl font-bold text-white">
                {pteroStatus?.configured
                  ? `Connected to ${pteroStatus.panelUrl}`
                  : 'Server-Side Pterodactyl Proxy Ready (Awaiting Credentials)'}
              </h2>
              <p className="text-sm text-neutral-400 leading-relaxed">
                {pteroStatus?.configured
                  ? 'Authenticated users linked to a Pterodactyl server identifier can inspect live CPU/RAM metrics and trigger power signals directly from this console.'
                  : 'All Pterodactyl calls execute strictly on the Express backend (/api/cloud/servers/*) so API keys are never exposed in client bundles. Configure the environment variables below on your server to enable live daemon telemetry.'}
              </p>
              {!pteroStatus?.configured && pteroStatus?.requiredEnvVars && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {pteroStatus.requiredEnvVars.map((envVar) => (
                    <code
                      key={envVar}
                      className="text-xs font-mono px-2.5 py-1 rounded bg-white/[0.06] border border-white/[0.1] text-violet-200"
                    >
                      {envVar}
                    </code>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl bg-black/60 border border-white/[0.08] p-4 min-w-[240px] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">API Connection</span>
                <span
                  className={`font-mono font-semibold ${
                    pteroStatus?.configured ? 'text-emerald-400' : 'text-amber-300'
                  }`}
                >
                  {pteroStatus?.configured ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Client Power Control</span>
                <span
                  className={`font-mono font-semibold ${
                    pteroStatus?.hasClientKey ? 'text-emerald-400' : 'text-neutral-400'
                  }`}
                >
                  {pteroStatus?.hasClientKey ? 'Enabled' : 'Pending Key'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Primary Node</span>
                <span className="font-mono text-white">hx-nd-01-10</span>
              </div>
            </div>
          </div>

          {/* Infrastructure Pillars + Regions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <article className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6">
              <Server className="w-5 h-5 text-cyan-300" />
              <h3 className="mt-4 text-base font-bold text-white">Minecraft Hosting</h3>
              <p className="mt-1.5 text-xs text-neutral-400 leading-relaxed">
                Paper, Purpur, Forge, and Velocity proxy nodes tuned for stable 20.0 TPS under load.
              </p>
            </article>
            <article className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6">
              <Cloud className="w-5 h-5 text-violet-300" />
              <h3 className="mt-4 text-base font-bold text-white">Proxmox LXC &amp; VPS</h3>
              <p className="mt-1.5 text-xs text-neutral-400 leading-relaxed">
                Root SSH Debian &amp; Ubuntu containers backed by ECC DDR5 and mirrored ZFS NVMe pools.
              </p>
            </article>
            <article className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6">
              <Shield className="w-5 h-5 text-blue-300" />
              <h3 className="mt-4 text-base font-bold text-white">Server Management</h3>
              <p className="mt-1.5 text-xs text-neutral-400 leading-relaxed">
                Automated snapshot scheduling, firewall hardening, and 24/7 engineering escalation.
              </p>
            </article>
            <article className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6">
              <Globe className="w-5 h-5 text-cyan-300" />
              <h3 className="mt-4 text-base font-bold text-white">Global Server Locations</h3>
              <p className="mt-1.5 text-xs text-neutral-400 leading-relaxed">
                Singapore (<span className="font-mono">sn1.helzerx.cyou</span>), Frankfurt EU, and US-East anycast routing.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Live Plans + Provisioning Form */}
      <section id="cloud-plans" className="bg-black py-16 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold tracking-tight text-white">
                Hosting Plans &amp; Provisioning
              </h2>
              <p className="mt-2 text-sm text-neutral-400">
                Select a tier from the live catalog to submit a server provisioning request.
              </p>
            </div>

            <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-white/[0.05] border border-white/[0.1]">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-white text-black'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-sm text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin text-violet-300" />
              <span>Loading compute tiers...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visiblePlans.map((plan) => {
                let features: string[] = [];
                try {
                  features = JSON.parse(plan.features_json || '[]');
                } catch {
                  features = [];
                }
                const isSelected = selectedPlanId === plan.id;
                return (
                  <article
                    key={plan.id}
                    className={`flex flex-col justify-between rounded-2xl p-7 border transition-colors ${
                      isSelected
                        ? 'bg-[#0C0B18] border-violet-400/60'
                        : 'bg-[#08080C] border-white/[0.1]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-neutral-400">
                        <span className="font-mono text-cyan-300">{plan.category}</span>
                        <span>{plan.location}</span>
                      </div>
                      <h3 className="mt-2 text-xl font-bold text-white">{plan.name}</h3>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="font-mono text-2xl font-bold text-white tabular-nums">
                          ${plan.price_monthly_usd.toFixed(2)}
                        </span>
                        <span className="text-xs text-neutral-400">
                          / mo · {plan.hzl_cost} HZL
                        </span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/[0.08] grid grid-cols-2 gap-2 text-xs font-mono text-neutral-300 tabular-nums">
                        <div>{plan.cpu}</div>
                        <div>{plan.ram_gb} GB RAM</div>
                        <div>{plan.storage_gb} GB NVMe</div>
                        <div>{plan.network}</div>
                      </div>

                      <ul className="mt-4 space-y-2">
                        {features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-xs text-neutral-300">
                            <Check className="w-3.5 h-3.5 text-violet-300 shrink-0" />
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
                      className={`mt-6 w-full py-2.5 px-4 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-violet-500 text-white'
                          : 'bg-white text-black hover:bg-neutral-200'
                      }`}
                    >
                      {isSelected ? 'Selected for Deployment' : `Select ${plan.name}`}
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          {/* Provisioning Request Form & User Servers */}
          <div
            id="request-server-form"
            className="mt-14 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-start"
          >
            <form
              onSubmit={handleRequestServer}
              className="rounded-2xl bg-[#08080F] border border-white/[0.12] p-7 space-y-5"
            >
              <div>
                <div className="text-xs font-mono text-cyan-300">PROVISIONING QUEUE</div>
                <h3 className="mt-1 text-lg font-bold text-white">Request New Server Instance</h3>
              </div>

              <div>
                <label htmlFor="cloud-plan-select" className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Hosting Plan
                </label>
                <select
                  id="cloud-plan-select"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full rounded-lg bg-black border border-white/[0.12] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.ram_gb}GB RAM · ${p.price_monthly_usd}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cloud-srv-name" className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Instance Hostname
                </label>
                <input
                  id="cloud-srv-name"
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="my-smp-node-01"
                  className="w-full rounded-lg bg-black border border-white/[0.12] px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-400"
                />
              </div>

              {requestError && (
                <p role="alert" className="text-xs text-rose-400 font-medium">
                  {requestError}
                </p>
              )}
              {requestNotice && (
                <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-400/25 rounded-lg p-3">
                  {requestNotice}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{user ? 'Submit Server Request' : 'Sign In to Request Server'}</span>
              </button>
            </form>

            {/* User Server Table / Console */}
            <div className="rounded-2xl bg-[#08080C] border border-white/[0.12] p-7">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-lg font-bold text-white">Your Cloud Servers</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Real-time container records and Pterodactyl daemon controls.
                  </p>
                </div>
                {user && (
                  <button
                    type="button"
                    onClick={() => void loadServers()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white border border-white/15 rounded-lg cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingServers ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                )}
              </div>

              {serverOpMsg && (
                <div className="mt-4 rounded-lg bg-violet-500/10 border border-violet-400/30 p-3 text-xs text-violet-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{serverOpMsg}</span>
                </div>
              )}

              {!user ? (
                <div className="py-10 text-center space-y-3">
                  <p className="text-sm text-neutral-400">
                    Sign in to view your provisioned servers, allocations, and Pterodactyl controls.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('auth')}
                    className="px-5 py-2 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 cursor-pointer"
                  >
                    Sign In / Create Account
                  </button>
                </div>
              ) : servers.length === 0 ? (
                <div className="py-10 text-center text-sm text-neutral-400">
                  No cloud servers requested yet. Select a hosting plan on the left to deploy your first instance.
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {servers.map((srv) => {
                    const hasIdentifier = Boolean(srv.pterodactyl_identifier);
                    const telemetry = resourceMap[srv.id] as Record<string, unknown> | undefined;
                    return (
                      <div
                        key={srv.id}
                        className="rounded-xl bg-black/60 border border-white/[0.08] p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold text-white">{srv.name}</div>
                            <div className="text-xs text-neutral-400 font-mono tabular-nums mt-0.5">
                              {srv.plan_name || srv.plan_id} · {srv.node_name} · {srv.location}
                            </div>
                          </div>
                          <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/[0.06] border border-white/[0.1] text-cyan-300">
                            {srv.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
                          <div className="text-xs font-mono text-neutral-500">
                            {hasIdentifier
                              ? `Pterodactyl ID: ${srv.pterodactyl_identifier}`
                              : 'Awaiting Admin Pterodactyl identifier binding'}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={!hasIdentifier}
                              onClick={() => void handleInspectResources(srv.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-white/15 text-neutral-200 hover:bg-white/10 disabled:opacity-40 cursor-pointer"
                            >
                              <Activity className="w-3 h-3" />
                              <span>Metrics</span>
                            </button>
                            <button
                              type="button"
                              disabled={!hasIdentifier}
                              onClick={() => void handlePower(srv.id, 'start')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40 cursor-pointer"
                            >
                              <Power className="w-3 h-3" />
                              <span>Start</span>
                            </button>
                            <button
                              type="button"
                              disabled={!hasIdentifier}
                              onClick={() => void handlePower(srv.id, 'restart')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-amber-400/30 text-amber-300 hover:bg-amber-500/10 disabled:opacity-40 cursor-pointer"
                            >
                              <RotateCw className="w-3 h-3" />
                              <span>Restart</span>
                            </button>
                            <button
                              type="button"
                              disabled={!hasIdentifier}
                              onClick={() => void handlePower(srv.id, 'stop')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-rose-400/30 text-rose-300 hover:bg-rose-500/10 disabled:opacity-40 cursor-pointer"
                            >
                              <Square className="w-3 h-3" />
                              <span>Stop</span>
                            </button>
                          </div>
                        </div>

                        {telemetry && (
                          <pre className="text-xs font-mono text-cyan-200 bg-black p-3 rounded border border-white/10 overflow-x-auto">
                            {JSON.stringify(telemetry, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
