import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { PageRoute } from '../types/navigation';

interface HostingPlan {
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

interface PricingPageProps {
  onNavigate: (route: PageRoute) => void;
}

export function PricingPage({ onNavigate }: PricingPageProps) {
  const [plans, setPlans] = useState<HostingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    let active = true;
    apiRequest<{ plans: HostingPlan[] }>('/api/cloud/plans')
      .then((res) => {
        if (active) setPlans(res.plans || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const studioPackages = [
    {
      name: 'Brand & UI/UX Sprint',
      price: '$2,400',
      cadence: 'Fixed Scope',
      summary: 'Complete visual identity, Figma design tokens, interactive prototype, and brand book.',
      features: ['Custom Visual Language', 'Figma Component Library', 'Responsive Desktop & Mobile', '2 Revision Cycles'],
    },
    {
      name: 'Full-Stack Web Platform',
      price: '$5,800',
      cadence: '4–6 Weeks',
      summary: 'Production website or SaaS platform with Express/PostgreSQL-grade backend, auth, and CMS.',
      features: ['Custom React + TypeScript Frontend', 'REST API & Database Schema', 'RBAC Admin Dashboard', 'SEO & Security Hardening'],
    },
    {
      name: 'Enterprise Custom Software',
      price: 'Custom',
      cadence: 'Dedicated Squad',
      summary: 'Tailored internal tools, automated billing pipelines, cloud panel integrations, and ongoing SLA.',
      features: ['Principal Engineers & Designers', 'Pterodactyl / API Integrations', 'CI/CD & Load Testing', 'Priority 24/7 Support'],
    },
  ];

  return (
    <div className="bg-black text-white">
      <section className="relative overflow-hidden helzerx-hero-aura pt-20 pb-24 md:pt-28 md:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[440px] left-1/2 -translate-x-1/2 w-[165%] h-[540px] rounded-[100%] bg-black border-t border-violet-300/40 shadow-[0_-20px_80px_rgba(167,139,250,0.35)]"
        />

        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs md:text-sm font-medium text-violet-200/85 mb-6">
            <span>Transparent Pricing</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>HelzerX Cloud &amp; Studio</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>USD &amp; HZL Credits</span>
          </div>

          <h1 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-extrabold tracking-[-0.03em] leading-[1.04] text-white max-w-[18ch] mx-auto">
            Predictable Compute &amp; Studio Pricing
          </h1>
          <p className="mt-6 max-w-[58ch] mx-auto text-base md:text-lg leading-[1.6] text-neutral-200/90">
            Clear resource specifications with zero hidden bandwidth fees. Apply coupon{' '}
            <span className="font-mono text-cyan-300">HELZERX2027</span> in HelzerX Shop for 20%
            launch savings.
          </p>

          <div className="mt-8 inline-flex items-center p-1 rounded-xl bg-white/[0.06] border border-white/[0.12]">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                billing === 'monthly' ? 'bg-white text-black' : 'text-neutral-300 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBilling('annual')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                billing === 'annual' ? 'bg-white text-black' : 'text-neutral-300 hover:text-white'
              }`}
            >
              Annual (-15%)
            </button>
          </div>
        </div>
      </section>

      {/* Cloud Plans from SQLite */}
      <section className="bg-black py-16 md:py-24 border-b border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-xs font-mono text-cyan-300">HELZERX CLOUD</div>
              <h2 className="mt-2 text-2xl md:text-3xl font-bold text-white">
                Infrastructure &amp; Game Hosting Tiers
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('cloud')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 hover:text-white cursor-pointer"
            >
              <span>Deploy on Cloud Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-sm text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin text-violet-300" />
              <span>Loading live hosting plans...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => {
                let features: string[] = [];
                try {
                  features = JSON.parse(plan.features_json || '[]');
                } catch {
                  features = [];
                }
                const price =
                  billing === 'annual'
                    ? Math.round(plan.price_monthly_usd * 0.85 * 100) / 100
                    : plan.price_monthly_usd;

                return (
                  <article
                    key={plan.id}
                    className="flex flex-col justify-between rounded-2xl bg-[#08080F] border border-white/[0.1] p-7"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-neutral-400">
                        <span className="font-mono text-cyan-300">{plan.category}</span>
                        <span>{plan.location}</span>
                      </div>
                      <h3 className="mt-3 text-xl font-bold text-white">{plan.name}</h3>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="font-mono text-3xl font-bold text-white tabular-nums">
                          ${price.toFixed(2)}
                        </span>
                        <span className="text-xs text-neutral-400">/ month</span>
                      </div>
                      <div className="mt-1 text-xs font-mono text-violet-300 tabular-nums">
                        or {plan.hzl_cost.toLocaleString()} HZL / mo
                      </div>

                      <div className="mt-5 pt-4 border-t border-white/[0.08] space-y-2 text-xs text-neutral-300 font-mono tabular-nums">
                        <div>CPU: {plan.cpu}</div>
                        <div>Memory: {plan.ram_gb} GB DDR5 ECC</div>
                        <div>Storage: {plan.storage_gb} GB NVMe</div>
                        <div>Network: {plan.network}</div>
                      </div>

                      <ul className="mt-5 space-y-2">
                        {features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-xs text-neutral-300">
                            <Check className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate('cloud')}
                      className="mt-7 w-full py-2.5 px-4 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      Request Provisioning
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Studio Packages */}
      <section className="bg-black py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-xs font-mono text-violet-300">HELZERX STUDIO</div>
              <h2 className="mt-2 text-2xl md:text-3xl font-bold text-white">
                Creative &amp; Custom Engineering Sprints
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('studio')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 hover:text-white cursor-pointer"
            >
              <span>Submit Custom Brief</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {studioPackages.map((pkg) => (
              <article
                key={pkg.name}
                className="flex flex-col justify-between rounded-2xl bg-[#08080C] border border-white/[0.1] p-7"
              >
                <div>
                  <div className="text-xs font-mono text-neutral-400">{pkg.cadence}</div>
                  <h3 className="mt-2 text-xl font-bold text-white">{pkg.name}</h3>
                  <div className="mt-3 font-mono text-2xl font-bold text-white tabular-nums">
                    {pkg.price}
                  </div>
                  <p className="mt-3 text-sm text-neutral-400 leading-relaxed">{pkg.summary}</p>
                  <ul className="mt-6 space-y-2.5 border-t border-white/[0.08] pt-5">
                    {pkg.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-xs text-neutral-200">
                        <Check className="w-3.5 h-3.5 text-violet-300 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('studio')}
                  className="mt-7 w-full py-2.5 px-4 text-xs font-semibold text-white bg-white/[0.08] border border-white/15 rounded-lg hover:bg-white/[0.15] transition-colors cursor-pointer"
                >
                  Start Studio Project
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
