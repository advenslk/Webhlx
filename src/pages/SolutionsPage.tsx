import { ArrowRight, Building2, Check, Gamepad2, Rocket, ShieldCheck } from 'lucide-react';
import { PageRoute } from '../types/navigation';

interface SolutionsPageProps {
  onNavigate: (route: PageRoute) => void;
}

const SOLUTIONS = [
  {
    id: 'gaming',
    icon: Gamepad2,
    tag: 'GAME NETWORKS',
    title: 'High-Concurrency Minecraft & Game Infrastructure',
    summary:
      'Run low-latency Paper, Purpur, Fabric, and proxy networks on isolated Ryzen EPYC cores with integrated Pterodactyl control and automated NVMe snapshots.',
    deliverables: [
      'Direct Pterodactyl panel orchestration',
      '10 Gbps DDoS-protected uplinks',
      'Sub-second container snapshots',
      'Custom proxy & firewall allocation',
    ],
    route: 'cloud' as PageRoute,
  },
  {
    id: 'saas',
    icon: Rocket,
    tag: 'SAAS & STARTUPS',
    title: 'Full-Stack Product Launch + Managed VPS Fleet',
    summary:
      'Pair HelzerX Studio product engineering with Proxmox LXC container pools so your web platform, API gateway, and database cluster ship under one SLA.',
    deliverables: [
      'React / TypeScript / Node.js architecture',
      'Dedicated LXC compute + managed backups',
      'Design systems & marketing launch site',
      '24/7 engineering ticket escalation',
    ],
    route: 'studio' as PageRoute,
  },
  {
    id: 'enterprise',
    icon: Building2,
    tag: 'ENTERPRISE WORKSTATIONS',
    title: 'Hardware Fleet Procurement & Custom Internal Tools',
    summary:
      'Outfit distributed creative and engineering teams with calibrated 6K displays, custom rack blades, and bespoke internal admin consoles built by Studio.',
    deliverables: [
      'Pre-imaged HelzerX Core Rack Nodes',
      'Factory-calibrated Studio 6K displays',
      'Custom RBAC operational software',
      'Consolidated invoicing & partner terms',
    ],
    route: 'shop' as PageRoute,
  },
  {
    id: 'security',
    icon: ShieldCheck,
    tag: 'COMPLIANCE & RELIABILITY',
    title: 'Isolated Multi-Region Deployment Architecture',
    summary:
      'Protect mission-critical data with hardware-level LXC isolation, RBAC permission boundaries, encrypted backups, and strict audit logging.',
    deliverables: [
      '99.98% Infrastructure SLA guarantee',
      'Immutable audit logs & staff permissions',
      'Automated off-node ZFS replication',
      'Dedicated compliance documentation',
    ],
    route: 'sla' as PageRoute,
  },
];

export function SolutionsPage({ onNavigate }: SolutionsPageProps) {
  return (
    <div className="bg-black text-white">
      <section className="relative overflow-hidden helzerx-hero-aura pt-20 pb-24 md:pt-28 md:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[440px] left-1/2 -translate-x-1/2 w-[165%] h-[540px] rounded-[100%] bg-black border-t border-violet-300/40 shadow-[0_-20px_80px_rgba(167,139,250,0.35)]"
        />

        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs md:text-sm font-medium text-violet-200/85 mb-6">
            <span>HelzerX Solutions</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Game Networks</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>SaaS</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Enterprise</span>
          </div>

          <h1 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-extrabold tracking-[-0.03em] leading-[1.04] text-white max-w-[18ch] mx-auto">
            Industry-Ready Architectures
          </h1>
          <p className="mt-6 max-w-[58ch] mx-auto text-base md:text-lg leading-[1.6] text-neutral-200/90">
            Purpose-built blueprints combining HelzerX Cloud compute, Shop hardware, and Studio
            software teams for measurable operational scale.
          </p>
        </div>
      </section>

      <section className="bg-black py-16 md:py-24">
        <div className="max-w-[1160px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {SOLUTIONS.map((sol) => {
            const Icon = sol.icon;
            return (
              <article
                key={sol.id}
                className="flex flex-col justify-between rounded-2xl bg-[#08080F] border border-white/[0.1] p-8"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                    <Icon className="w-4 h-4" />
                    <span>{sol.tag}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-bold text-white">{sol.title}</h2>
                  <p className="mt-3 text-sm text-neutral-400 leading-relaxed">{sol.summary}</p>

                  <ul className="mt-6 space-y-2.5 border-t border-white/[0.08] pt-5">
                    {sol.deliverables.map((d) => (
                      <li key={d} className="flex items-center gap-2.5 text-sm text-neutral-200">
                        <Check className="w-4 h-4 text-violet-300 shrink-0" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate(sol.route)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    <span>Explore Division</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className="px-5 py-2.5 text-xs font-semibold text-neutral-200 border border-white/15 rounded-lg hover:border-white/30 transition-colors cursor-pointer"
                  >
                    Request Architecture Call
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
