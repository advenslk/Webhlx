import { ArrowRight, Cloud, Cpu, Palette, Server, ShoppingBag, Shield } from 'lucide-react';
import { Surface3D } from '../components/Surface3D';
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
      banner: '/assets/aistudio/file_0000000027788211b1e314262e805179_c9c9b7ff.png',
      route: 'cloud' as PageRoute,
      cta: 'Open HelzerX Cloud',
      icon: Cloud,
    },
    {
      id: 'studio',
      title: 'HelzerX Studio',
      subtitle: 'Web, Software, UI/UX, Branding & Creative Production',
      description:
        'Dedicated product engineering and digital creative agency executing full-stack applications, custom enterprise software, UI/UX design systems, video editing, and branding.',
      specs: ['7 Creative & Engineering Tracks', 'Client Project Portal', 'Direct Message Threads', 'Custom Sprint Scopes'],
      banner: '/assets/aistudio/file_00000000808c8211b10e793920a7f76f_8d80975c.png',
      route: 'studio' as PageRoute,
      cta: 'Open HelzerX Studio',
      icon: Palette,
    },
    {
      id: 'shop',
      title: 'HelzerX Shop',
      subtitle: 'Compute Hardware, Peripherals & Commercial Software Kits',
      description:
        'Direct procurement storefront offering calibrated 6K workstation displays, rack compute blades, CNC mechanical decks, and downloadable enterprise starter packs.',
      specs: ['Live Stock Inventory', 'Verified Customer Reviews', 'Coupon & Invoice System', 'Order History Portal'],
      banner: '/assets/aistudio/file_00000000ca6c821196ff7de47bf63b50_2269b23b.png',
      route: 'shop' as PageRoute,
      cta: 'Open HelzerX Shop',
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="bg-[#F4F4F5] text-[#0A0A0B]">
      <section className="relative overflow-hidden helzerx-studio-hero pt-16 pb-20 md:pt-24 md:pb-24 border-b border-black/[0.06]">
        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs font-medium text-neutral-600 mb-6">
            <span className="font-semibold text-[#0A0A0B]">HelzerX Ecosystem</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>Cloud</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>Studio</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>Shop</span>
          </div>

          <h1 className="text-[clamp(2.6rem,6vw,4.75rem)] font-extrabold tracking-[-0.04em] leading-[0.98] helzerx-dotted-text max-w-[16ch] mx-auto pb-2">
            unified products.
          </h1>
          <p className="mt-6 max-w-[58ch] mx-auto text-base md:text-lg leading-[1.65] text-neutral-600">
            Three tightly integrated divisions engineered to power game communities, SaaS companies,
            and international creative organizations.
          </p>
        </div>
      </section>

      <section className="bg-[#F4F4F5] py-16 md:py-24">
        <div className="max-w-[1180px] mx-auto px-6 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {suites.map((suite, idx) => {
              const Icon = suite.icon;
              return (
                <Surface3D key={suite.id} intensity={13} delay={idx * 0.06}>
                  <article className="h-full flex flex-col justify-between text-left">
                    <div>
                      <button
                        type="button"
                        onClick={() => onNavigate(suite.route)}
                        className="relative block w-full h-44 sm:h-48 overflow-hidden bg-[#0A0A0C] cursor-pointer group/prod"
                      >
                        <img
                          src={suite.banner}
                          alt={`${suite.title} Showcase Banner`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-center"
                        />
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f8f8fb] via-[#f8f8fb]/75 via-30% to-transparent"
                        />
                      </button>

                      <div className="px-7 pt-2">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500">
                          <Icon className="w-4 h-4 text-[#0A0A0B] shrink-0" />
                          <span>{suite.subtitle}</span>
                        </div>
                        <h2 className="mt-2.5 text-2xl font-bold text-[#0A0A0B] tracking-tight">
                          {suite.title}
                        </h2>
                        <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
                          {suite.description}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-x-2.5 gap-y-1.5 text-xs text-neutral-700 font-medium">
                          {suite.specs.map((spec, i) => (
                            <span key={spec} className="inline-flex items-center gap-2">
                              <span>{spec}</span>
                              {i < suite.specs.length - 1 && (
                                <span aria-hidden="true" className="text-neutral-400">·</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="px-7 pb-7 pt-5 mt-6 border-t border-black/[0.06] flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => onNavigate(suite.route)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0A0A0B] rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        <span>{suite.cta}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('pricing')}
                        className="px-4 py-2.5 text-xs font-semibold text-[#0A0A0B] border border-black/15 rounded-xl hover:border-black/35 transition-colors cursor-pointer"
                      >
                        View Pricing
                      </button>
                    </div>
                  </article>
                </Surface3D>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <Surface3D intensity={14} delay={0}>
              <div className="p-7 h-full">
                <div className="w-11 h-11 rounded-2xl bg-[#111114] text-white flex items-center justify-center shadow-[0_12px_24px_rgba(10,10,14,0.28)] border border-white/10">
                  <Server className="w-5 h-5" />
                </div>
                <h3 className="mt-5 text-base font-bold text-[#0A0A0B]">
                  Launch 01.01.2027 Allocation
                </h3>
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                  Verified pre-launch accounts among the first 50 eligible registrations receive an
                  8GB RAM server upon launch.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('launch')}
                  className="mt-4 text-xs font-bold text-[#0A0A0B] hover:text-neutral-600 cursor-pointer"
                >
                  Check Eligibility →
                </button>
              </div>
            </Surface3D>
            <Surface3D intensity={14} delay={0.05}>
              <div className="p-7 h-full">
                <div className="w-11 h-11 rounded-2xl bg-[#111114] text-white flex items-center justify-center shadow-[0_12px_24px_rgba(10,10,14,0.28)] border border-white/10">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="mt-5 text-base font-bold text-[#0A0A0B]">
                  Custom Enterprise Stacks
                </h3>
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                  Dedicated private Proxmox host clusters combined with Studio custom software teams.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('solutions')}
                  className="mt-4 text-xs font-bold text-[#0A0A0B] hover:text-neutral-600 cursor-pointer"
                >
                  Explore Solutions →
                </button>
              </div>
            </Surface3D>
            <Surface3D intensity={14} delay={0.1}>
              <div className="p-7 h-full">
                <div className="w-11 h-11 rounded-2xl bg-[#111114] text-white flex items-center justify-center shadow-[0_12px_24px_rgba(10,10,14,0.28)] border border-white/10">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="mt-5 text-base font-bold text-[#0A0A0B]">
                  Unified Customer Portal
                </h3>
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                  Manage servers, invoices, Studio milestones, and support tickets from one dashboard.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="mt-4 text-xs font-bold text-[#0A0A0B] hover:text-neutral-600 cursor-pointer"
                >
                  Open Dashboard →
                </button>
              </div>
            </Surface3D>
          </div>
        </div>
      </section>
    </div>
  );
}
