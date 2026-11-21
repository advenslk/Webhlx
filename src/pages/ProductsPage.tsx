import { ArrowRight, Cloud, Cpu, Palette, Server, ShoppingBag, Shield } from 'lucide-react';
import { PageRoute } from '../types/navigation';

interface ProductsPageProps {
  onNavigate: (route: PageRoute) => void;
}

export function ProductsPage({ onNavigate }: ProductsPageProps) {
  const suites = [
    {
      id: 'cloud',
      title: 'HelzerX Cloud',
      subtitle: 'Minecraft, Game & Enterprise Proxmox LXC Hosting',
      description:
        'High-frequency AMD EPYC compute nodes powered by NVMe ZFS mirrors, native Pterodactyl control-plane integration, and multi-region edge DDoS filtering.',
      specs: ['Pterodactyl Daemon Proxy', 'Proxmox LXC Containers', 'Automated Snapshots', '99.98% Target SLA'],
      route: 'cloud' as PageRoute,
      cta: 'Open HelzerX Cloud',
      icon: Cloud,
      accent: 'text-cyan-300',
    },
    {
      id: 'studio',
      title: 'HelzerX Studio',
      subtitle: 'Web, Software, UI/UX, Branding & Creative Production',
      description:
        'Dedicated product engineering and digital creative agency executing full-stack applications, custom enterprise software, UI/UX design systems, video editing, and branding.',
      specs: ['7 Creative & Engineering Tracks', 'Client Project Portal', 'Direct Message Threads', 'Custom Sprint Scopes'],
      route: 'studio' as PageRoute,
      cta: 'Open HelzerX Studio',
      icon: Palette,
      accent: 'text-violet-300',
    },
    {
      id: 'shop',
      title: 'HelzerX Shop',
      subtitle: 'Compute Hardware, Peripherals & Commercial Software Kits',
      description:
        'Direct procurement storefront offering calibrated 6K workstation displays, rack compute blades, CNC mechanical decks, and downloadable enterprise starter packs.',
      specs: ['Live Stock Inventory', 'Verified Customer Reviews', 'Coupon & Invoice System', 'Order History Portal'],
      route: 'shop' as PageRoute,
      cta: 'Open HelzerX Shop',
      icon: ShoppingBag,
      accent: 'text-blue-300',
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
            <span>HelzerX Ecosystem</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Cloud</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Studio</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Shop</span>
          </div>

          <h1 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-extrabold tracking-[-0.03em] leading-[1.04] text-white max-w-[18ch] mx-auto">
            Unified Technology Products
          </h1>
          <p className="mt-6 max-w-[58ch] mx-auto text-base md:text-lg leading-[1.6] text-neutral-200/90">
            Three tightly integrated divisions engineered to power game communities, SaaS companies,
            and international creative organizations.
          </p>
        </div>
      </section>

      <section className="bg-black py-16 md:py-24">
        <div className="max-w-[1160px] mx-auto px-6 space-y-8">
          {suites.map((suite) => {
            const Icon = suite.icon;
            return (
              <article
                key={suite.id}
                className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-8 md:p-10 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center"
              >
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400">
                    <Icon className={`w-4 h-4 ${suite.accent}`} />
                    <span>{suite.subtitle}</span>
                  </div>
                  <h2 className="mt-3 text-2xl md:text-3xl font-bold text-white">{suite.title}</h2>
                  <p className="mt-4 text-sm md:text-base text-neutral-300 leading-relaxed">
                    {suite.description}
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => onNavigate(suite.route)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      <span>{suite.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('pricing')}
                      className="px-5 py-2.5 text-xs font-semibold text-neutral-200 border border-white/15 rounded-lg hover:border-white/30 transition-colors cursor-pointer"
                    >
                      View Pricing
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-black/70 border border-white/[0.08] p-6 space-y-3">
                  <div className="text-xs font-mono text-neutral-500">CORE CAPABILITIES</div>
                  {suite.specs.map((spec) => (
                    <div
                      key={spec}
                      className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0 text-sm text-neutral-200"
                    >
                      <span>{spec}</span>
                      <span className={`text-xs font-mono ${suite.accent}`}>INCLUDED</span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="rounded-2xl bg-[#08080C] border border-white/[0.09] p-6">
              <Server className="w-5 h-5 text-cyan-300" />
              <h3 className="mt-3 text-base font-bold text-white">Launch 01.01.2027 Allocation</h3>
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                Verified pre-launch accounts among the first 50 eligible registrations receive an
                8GB RAM server upon launch.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('launch')}
                className="mt-4 text-xs font-semibold text-cyan-300 hover:text-white cursor-pointer"
              >
                Check Eligibility →
              </button>
            </div>
            <div className="rounded-2xl bg-[#08080C] border border-white/[0.09] p-6">
              <Cpu className="w-5 h-5 text-violet-300" />
              <h3 className="mt-3 text-base font-bold text-white">Custom Enterprise Stacks</h3>
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                Dedicated private Proxmox host clusters combined with Studio custom software teams.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('solutions')}
                className="mt-4 text-xs font-semibold text-violet-300 hover:text-white cursor-pointer"
              >
                Explore Solutions →
              </button>
            </div>
            <div className="rounded-2xl bg-[#08080C] border border-white/[0.09] p-6">
              <Shield className="w-5 h-5 text-blue-300" />
              <h3 className="mt-3 text-base font-bold text-white">Unified Customer Portal</h3>
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                Manage servers, invoices, Studio milestones, and support tickets from one dashboard.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="mt-4 text-xs font-semibold text-blue-300 hover:text-white cursor-pointer"
              >
                Open Dashboard →
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
