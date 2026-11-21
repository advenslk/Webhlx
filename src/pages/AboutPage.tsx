import { ArrowRight, Globe, Layers, Lock, ShieldCheck } from 'lucide-react';
import { DIVISIONS } from '../data/helzerxData';
import { PageRoute } from '../types/navigation';

interface AboutPageProps {
  onNavigate: (route: PageRoute) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="bg-black text-white">
      <section className="relative overflow-hidden helzerx-hero-aura pt-20 pb-24 md:pt-28 md:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[440px] left-1/2 -translate-x-1/2 w-[165%] h-[540px] rounded-[100%] bg-black border-t border-violet-300/40 shadow-[0_-20px_80px_rgba(167,139,250,0.35)]"
        />

        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs md:text-sm font-medium text-violet-200/85 mb-6">
            <span>HelzerX Technologies</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>About the Company</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>helzerx.cyou</span>
          </div>

          <h1 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-extrabold tracking-[-0.03em] leading-[1.04] text-white max-w-[18ch] mx-auto">
            Engineered for Global Builders
          </h1>
          <p className="mt-6 max-w-[60ch] mx-auto text-base md:text-lg leading-[1.6] text-neutral-200/90">
            HelzerX Technologies unites high-availability cloud compute, calibrated workstation
            hardware, and full-cycle software studio delivery under a single accountable global
            brand launching at full scale on January 1, 2027.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-black py-16 md:py-24 border-b border-white/[0.06]">
        <div className="max-w-[1160px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <article className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-8">
            <div className="text-xs font-mono text-cyan-300">MISSION</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Eliminate Infrastructure Friction</h2>
            <p className="mt-3 text-sm leading-[1.7] text-neutral-400">
              Modern product teams lose months coordinating disconnected cloud hosts, software
              agencies, and hardware vendors. HelzerX consolidates compute, creative engineering,
              and procurement into one deterministic ecosystem with transparent telemetry.
            </p>
          </article>

          <article className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-8">
            <div className="text-xs font-mono text-violet-300">ARCHITECTURE STANDARD</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Zero Simulated Reliability</h2>
            <p className="mt-3 text-sm leading-[1.7] text-neutral-400">
              Every server control, billing ledger, and client project board we ship relies on
              verifiable backend state, strict role-based security, and direct daemon integration —
              built for production workloads from day one.
            </p>
          </article>
        </div>

        <div className="max-w-[1160px] mx-auto px-6 mt-10 grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6">
            <div className="font-mono text-2xl font-bold text-white tabular-nums">99.98%</div>
            <div className="mt-1 text-xs text-neutral-400">Cloud uptime SLA target</div>
          </div>
          <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6">
            <div className="font-mono text-2xl font-bold text-white tabular-nums">01.01.2027</div>
            <div className="mt-1 text-xs text-neutral-400">Official global launch</div>
          </div>
          <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6">
            <div className="font-mono text-2xl font-bold text-white tabular-nums">3 Divisions</div>
            <div className="mt-1 text-xs text-neutral-400">Cloud, Shop &amp; Studio unified</div>
          </div>
          <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6">
            <div className="font-mono text-2xl font-bold text-white tabular-nums">24/7</div>
            <div className="mt-1 text-xs text-neutral-400">Engineering ticket escalation</div>
          </div>
        </div>
      </section>

      {/* Leadership Principles */}
      <section className="bg-black py-16 md:py-20 border-b border-white/[0.06]">
        <div className="max-w-[1160px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-7">
            <ShieldCheck className="w-5 h-5 text-cyan-300" />
            <h3 className="mt-4 text-base font-bold text-white">Security by Architecture</h3>
            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
              Per-user scrypt cryptography, server-side secret isolation, and audit-logged RBAC across
              all internal and client portals.
            </p>
          </div>
          <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-7">
            <Layers className="w-5 h-5 text-violet-300" />
            <h3 className="mt-4 text-base font-bold text-white">Vertical Integration</h3>
            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
              Studio applications deploy seamlessly onto HelzerX Cloud LXC pools, managed alongside
              certified Shop hardware workstations.
            </p>
          </div>
          <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-7">
            <Globe className="w-5 h-5 text-blue-300" />
            <h3 className="mt-4 text-base font-bold text-white">International Delivery</h3>
            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
              Low-latency routing from Asia-Pacific and European edges with transparent USD billing
              and global logistics.
            </p>
          </div>
        </div>
      </section>

      {/* What we build */}
      <section className="bg-black py-20 md:py-24">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="max-w-[640px] mx-auto text-center">
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold tracking-tight text-white">
              Three divisions, one account
            </h2>
            <p className="mt-3 text-sm md:text-base text-neutral-400">
              Every HelzerX product is connected by the same identity, billing, and support layer.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {DIVISIONS.map((division) => (
              <article
                key={division.id}
                className="flex flex-col justify-between rounded-2xl bg-[#08080C] border border-white/[0.1] p-8 hover:border-violet-400/35 transition-colors"
              >
                <div>
                  <div className="text-xs font-mono text-violet-300 uppercase">
                    {division.shortName}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white leading-snug">
                    {division.headline}
                  </h3>
                  <p className="mt-3 text-sm leading-[1.6] text-neutral-400">
                    {division.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {division.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-full border border-white/[0.12] bg-white/[0.04] px-2.5 py-1 text-[11px] text-neutral-300"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-7 pt-5 border-t border-white/[0.08] font-mono text-xs text-cyan-300">
                  {division.metricLabel}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('careers')}
              className="px-6 py-3 text-sm font-semibold text-white bg-white/[0.06] border border-white/15 rounded-lg hover:bg-white/[0.12] transition-colors cursor-pointer"
            >
              Join HelzerX Team
            </button>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
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
