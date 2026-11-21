import { ArrowRight, Globe, Layers, ShieldCheck } from 'lucide-react';
import { Surface3D } from '../components/Surface3D';
import { DIVISIONS } from '../lib/platformData';
import { PageRoute } from '../types/navigation';

interface AboutPageProps {
  onNavigate: (route: PageRoute) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="bg-[#F4F4F5] text-[#0A0A0B]">
      <section className="relative overflow-hidden helzerx-studio-hero pt-16 pb-20 md:pt-24 md:pb-28 border-b border-black/[0.06]">
        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs font-medium text-neutral-600 mb-6">
            <span className="font-semibold text-[#0A0A0B]">HelzerX Technologies</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>About the Company</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>helzerx.cyou</span>
          </div>

          <h1 className="text-[clamp(2.6rem,6vw,4.75rem)] font-extrabold tracking-[-0.04em] leading-[0.98] helzerx-dotted-text max-w-[16ch] mx-auto pb-2">
            engineered for builders.
          </h1>
          <p className="mt-6 max-w-[60ch] mx-auto text-base md:text-lg leading-[1.65] text-neutral-600">
            HelzerX Technologies unites high-availability cloud compute, calibrated workstation
            hardware, and full-cycle software studio delivery under a single accountable global
            brand launching at full scale on January 1, 2027.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-[#F4F4F5] py-16 md:py-24 border-b border-black/[0.06]">
        <div className="max-w-[1160px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Surface3D intensity={12} delay={0.04}>
            <article className="p-8 h-full">
              <div className="text-xs font-semibold text-neutral-500">Mission</div>
              <h2 className="mt-2.5 text-2xl font-bold text-[#0A0A0B] tracking-tight">
                Eliminate Infrastructure Friction
              </h2>
              <p className="mt-3 text-sm leading-[1.7] text-neutral-600">
                Modern product teams lose months coordinating disconnected cloud hosts, software
                agencies, and hardware vendors. HelzerX consolidates compute, creative engineering,
                and procurement into one deterministic ecosystem with transparent telemetry.
              </p>
            </article>
          </Surface3D>

          <Surface3D intensity={12} delay={0.1}>
            <article className="p-8 h-full">
              <div className="text-xs font-semibold text-neutral-500">Architecture Standard</div>
              <h2 className="mt-2.5 text-2xl font-bold text-[#0A0A0B] tracking-tight">
                Zero Simulated Reliability
              </h2>
              <p className="mt-3 text-sm leading-[1.7] text-neutral-600">
                Every server control, billing ledger, and client project board we ship relies on
                verifiable backend state, strict role-based security, and direct daemon integration —
                built for production workloads from day one.
              </p>
            </article>
          </Surface3D>
        </div>

        <div className="max-w-[1160px] mx-auto px-6 mt-10 grid grid-cols-2 lg:grid-cols-4 gap-5">
          <Surface3D intensity={13} delay={0.04}>
            <div className="p-6">
              <div className="text-2xl font-extrabold tracking-tight text-[#0A0A0B] tabular-nums">
                99.98%
              </div>
              <div className="mt-1 text-xs text-neutral-600">Cloud uptime SLA target</div>
            </div>
          </Surface3D>
          <Surface3D intensity={13} delay={0.08}>
            <div className="p-6">
              <div className="text-2xl font-extrabold tracking-tight text-[#0A0A0B] tabular-nums">
                01.01.2027
              </div>
              <div className="mt-1 text-xs text-neutral-600">Official global launch</div>
            </div>
          </Surface3D>
          <Surface3D intensity={13} delay={0.12}>
            <div className="p-6">
              <div className="text-2xl font-extrabold tracking-tight text-[#0A0A0B] tabular-nums">
                3 Divisions
              </div>
              <div className="mt-1 text-xs text-neutral-600">Cloud, Shop &amp; Studio unified</div>
            </div>
          </Surface3D>
          <Surface3D intensity={13} delay={0.16}>
            <div className="p-6">
              <div className="text-2xl font-extrabold tracking-tight text-[#0A0A0B] tabular-nums">
                24/7
              </div>
              <div className="mt-1 text-xs text-neutral-600">Engineering ticket escalation</div>
            </div>
          </Surface3D>
        </div>
      </section>

      {/* Leadership Principles */}
      <section className="bg-[#F4F4F5] py-16 md:py-20 border-b border-black/[0.06]">
        <div className="max-w-[1160px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Surface3D intensity={12} delay={0.04}>
            <div className="p-7 h-full">
              <div className="w-11 h-11 rounded-2xl bg-[#111114] text-white flex items-center justify-center shadow-[0_10px_20px_rgba(10,10,11,0.22)]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="mt-5 text-base font-bold text-[#0A0A0B]">Security by Architecture</h3>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                Per-user scrypt cryptography, server-side secret isolation, and audit-logged RBAC
                across all internal and client portals.
              </p>
            </div>
          </Surface3D>

          <Surface3D intensity={12} delay={0.1}>
            <div className="p-7 h-full">
              <div className="w-11 h-11 rounded-2xl bg-[#111114] text-white flex items-center justify-center shadow-[0_10px_20px_rgba(10,10,11,0.22)]">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="mt-5 text-base font-bold text-[#0A0A0B]">Vertical Integration</h3>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                Studio applications deploy seamlessly onto HelzerX Cloud LXC pools, managed
                alongside certified Shop hardware workstations.
              </p>
            </div>
          </Surface3D>

          <Surface3D intensity={12} delay={0.16}>
            <div className="p-7 h-full">
              <div className="w-11 h-11 rounded-2xl bg-[#111114] text-white flex items-center justify-center shadow-[0_10px_20px_rgba(10,10,11,0.22)]">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="mt-5 text-base font-bold text-[#0A0A0B]">International Delivery</h3>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                Low-latency routing from Asia-Pacific and European edges with transparent USD billing
                and global logistics.
              </p>
            </div>
          </Surface3D>
        </div>
      </section>

      {/* What we build */}
      <section className="bg-[#F4F4F5] py-20 md:py-24">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="max-w-[640px] mx-auto text-center">
            <h2 className="text-[clamp(1.85rem,3.5vw,2.75rem)] font-extrabold tracking-tight text-[#0A0A0B]">
              Three divisions, one account
            </h2>
            <p className="mt-3 text-sm md:text-base text-neutral-600">
              Every HelzerX product is connected by the same identity, billing, and support layer.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {DIVISIONS.map((division, idx) => (
              <Surface3D key={division.id} intensity={13} delay={idx * 0.06}>
                <article className="h-full flex flex-col justify-between p-8">
                  <div>
                    <div className="text-xs font-semibold text-neutral-500">
                      {division.shortName}
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-[#0A0A0B] leading-snug">
                      {division.headline}
                    </h3>
                    <p className="mt-3 text-sm leading-[1.6] text-neutral-600">
                      {division.description}
                    </p>
                    <div className="mt-5 text-xs font-medium text-neutral-700 leading-relaxed">
                      {division.highlights.join(' · ')}
                    </div>
                  </div>
                  <div className="mt-7 pt-5 border-t border-black/[0.08] text-xs font-semibold text-[#0A0A0B] tabular-nums">
                    {division.metricLabel}
                  </div>
                </article>
              </Surface3D>
            ))}
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('careers')}
              className="px-6 py-3 text-sm font-semibold text-[#0A0A0B] bg-white border border-black/15 rounded-lg hover:border-black/35 transition-colors cursor-pointer shadow-sm"
            >
              Join HelzerX Team
            </button>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0A0A0B] rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <span>Work With Us</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
