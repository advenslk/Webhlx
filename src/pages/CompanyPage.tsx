import { CASE_STUDIES } from '../data/helzerxData';
import { PageRoute } from '../types/navigation';

interface CompanyPageProps {
  onNavigate: (route: PageRoute) => void;
}

export function CompanyPage({ onNavigate }: CompanyPageProps) {
  return (
    <div className="bg-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden helzerx-hero-aura pt-20 pb-24 md:pt-28 md:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[440px] left-1/2 -translate-x-1/2 w-[165%] h-[540px] rounded-[100%] bg-black border-t border-violet-300/40 shadow-[0_-20px_80px_rgba(167,139,250,0.35)]"
        />

        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs md:text-sm font-medium text-violet-200/85 mb-6">
            <span>HelzerX Technologies</span>
            <span aria-hidden="true" className="mx-2 text-violet-400/60">·</span>
            <span>Company &amp; Case Studies</span>
          </div>

          <h1 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-extrabold tracking-[-0.03em] leading-[1.04] text-white max-w-[18ch] mx-auto">
            Built as One Engineering Standard
          </h1>
          <p className="mt-6 max-w-[60ch] mx-auto text-base md:text-lg leading-[1.6] text-neutral-200/90">
            HelzerX Technologies brings together managed Proxmox &amp; Pterodactyl cloud compute,
            calibrated hardware procurement, and full-cycle software studio delivery under a single
            accountable organization.
          </p>
        </div>
      </section>

      {/* Key Operational Metrics */}
      <section className="bg-black py-12 border-b border-white/[0.06]">
        <div className="max-w-[1160px] mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6">
            <div className="font-mono text-2xl font-bold text-white tabular-nums">99.98%</div>
            <div className="mt-1.5 text-xs text-neutral-400">Cloud uptime target</div>
          </div>
          <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6">
            <div className="font-mono text-2xl font-bold text-white tabular-nums">4,200+</div>
            <div className="mt-1.5 text-xs text-neutral-400">Hardware setups shipped</div>
          </div>
          <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6">
            <div className="font-mono text-2xl font-bold text-white tabular-nums">38</div>
            <div className="mt-1.5 text-xs text-neutral-400">Studio platforms launched</div>
          </div>
          <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6">
            <div className="font-mono text-2xl font-bold text-white tabular-nums">24h</div>
            <div className="mt-1.5 text-xs text-neutral-400">Direct engineering response</div>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="bg-black py-20 md:py-24">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="max-w-[640px] mx-auto text-center">
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold tracking-tight text-white">
              Client Case Studies
            </h2>
            <p className="mt-3 text-sm md:text-base text-neutral-400">
              Verified outcomes across infrastructure migrations, workstation fleet rollouts, and
              commerce engineering.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {CASE_STUDIES.map((study) => (
              <article
                key={study.id}
                className="flex flex-col justify-between rounded-2xl bg-[#08080C] border border-white/[0.1] p-8"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
                    <span className="text-violet-300">{study.division}</span>
                    <span aria-hidden="true" className="text-neutral-600">
                      ·
                    </span>
                    <span>{study.client}</span>
                  </div>

                  <p className="mt-4 text-2xl font-bold tracking-tight text-white tabular-nums">
                    {study.metric}
                  </p>
                  <p className="mt-3 text-sm leading-[1.6] text-neutral-400">{study.summary}</p>
                </div>

                <blockquote className="mt-7 pt-5 border-t border-white/[0.08]">
                  <p className="text-sm leading-[1.6] text-neutral-200">“{study.quote}”</p>
                  <footer className="mt-3 text-xs text-neutral-400">
                    <span className="font-semibold text-neutral-200">{study.author}</span>
                    <span aria-hidden="true" className="mx-1.5 text-neutral-600">
                      ·
                    </span>
                    <span>{study.role}</span>
                  </footer>
                </blockquote>
              </article>
            ))}
          </div>

          <div className="mt-14 text-center">
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="px-6 py-3 text-sm font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Start a Project With HelzerX
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
