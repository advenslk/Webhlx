import { ArrowRight, Building2, Check, Gamepad2, Rocket, ShieldCheck } from 'lucide-react';
import { Surface3D } from '../components/Surface3D';
import { PageRoute } from '../types/navigation';

interface SolutionsPageProps {
  onNavigate: (route: PageRoute) => void;
}

const SOLUTIONS = [
  {
    id: 'gaming',
    icon: Gamepad2,
    tag: 'Game Networks',
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
    tag: 'SaaS & Startups',
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
    tag: 'Enterprise Workstations',
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
    tag: 'Compliance & Reliability',
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
    <div className="bg-[#F4F4F5] text-[#0A0A0B]">
      <section className="relative overflow-hidden helzerx-studio-hero pt-16 pb-20 md:pt-24 md:pb-24 border-b border-black/[0.06]">
        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs font-medium text-neutral-600 mb-6">
            <span className="font-semibold text-[#0A0A0B]">HelzerX Solutions</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>Game Networks</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>SaaS</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>Enterprise</span>
          </div>

          <h1 className="text-[clamp(2.6rem,6vw,4.75rem)] font-extrabold tracking-[-0.04em] leading-[0.98] helzerx-dotted-text max-w-[16ch] mx-auto pb-2">
            industry solutions.
          </h1>
          <p className="mt-6 max-w-[58ch] mx-auto text-base md:text-lg leading-[1.65] text-neutral-600">
            Purpose-built blueprints combining HelzerX Cloud compute, Shop hardware, and Studio
            software teams for measurable operational scale.
          </p>
        </div>
      </section>

      <section className="bg-[#F4F4F5] py-16 md:py-24">
        <div className="max-w-[1160px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {SOLUTIONS.map((sol, idx) => {
            const Icon = sol.icon;
            return (
              <Surface3D key={sol.id} intensity={12} delay={idx * 0.06}>
                <article className="h-full flex flex-col justify-between p-8">
                  <div>
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-600">
                      <span className="w-8 h-8 rounded-xl bg-[#111114] text-white flex items-center justify-center shadow-[0_8px_16px_rgba(10,10,11,0.2)]">
                        <Icon className="w-4 h-4" />
                      </span>
                      <span>{sol.tag}</span>
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-[#0A0A0B]">{sol.title}</h2>
                    <p className="mt-3 text-sm text-neutral-600 leading-relaxed">{sol.summary}</p>

                    <ul className="mt-6 space-y-2.5 border-t border-black/[0.08] pt-5">
                      {sol.deliverables.map((d) => (
                        <li key={d} className="flex items-center gap-2.5 text-sm text-neutral-700">
                          <Check className="w-4 h-4 text-[#0A0A0B] shrink-0" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => onNavigate(sol.route)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <span>Explore Division</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('contact')}
                      className="px-5 py-2.5 text-xs font-semibold text-[#0A0A0B] border border-black/15 rounded-lg hover:border-black/35 transition-colors cursor-pointer"
                    >
                      Request Architecture Call
                    </button>
                  </div>
                </article>
              </Surface3D>
            );
          })}
        </div>
      </section>
    </div>
  );
}
