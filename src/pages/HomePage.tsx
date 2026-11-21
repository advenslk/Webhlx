import { ArrowRight, ChevronDown, Cloud, Cpu, Globe, Layers, Lock, ShieldCheck, ShoppingBag, Sparkles, Zap } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { lazy, Suspense, useState } from 'react';

// Load the WebGL scene as a separate chunk so the first paint stays instant.
const ThreeCoreBackdrop = lazy(() =>
  import('../components/ThreeCoreBackdrop').then((module) => ({
    default: module.ThreeCoreBackdrop,
  })),
);
import { TrustedLogos } from '../components/TrustedLogos';
import { WorkspaceShowcase } from '../components/WorkspaceShowcase';
import { useAppContext } from '../context/AppContext';
import { DivisionId } from '../data/helzerxData';
import { PageRoute } from '../types/navigation';

interface HomePageProps {
  onNavigate: (route: PageRoute, division?: DivisionId) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { siteData, addToCart } = useAppContext();
  const [activeDivision, setActiveDivision] = useState<DivisionId>('cloud');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq_1');
  const shouldReduceMotion = useReducedMotion();

  const general = siteData?.settings?.general;
  const heroHeading = general?.heroHeading || 'BUILD WITHOUT LIMITS.';
  const heroDesc =
    general?.heroDescription ||
    'Powering the next generation of digital experiences through innovative technology, reliable infrastructure, and creative solutions.';
  const totalPreorders = siteData?.launch?.totalPreorders ?? 0;
  const earlyAccessQualified = siteData?.launch?.earlyAccessQualified ?? 0;
  const earlyAccessLimit = siteData?.launch?.earlyAccessLimit ?? 50;
  const announcements = siteData?.announcements ?? [];
  const featuredProducts = siteData?.featuredProducts ?? [];
  const faqs = siteData?.faqs ?? [];

  const scrollToEcosystem = () => {
    const el = document.getElementById('ecosystem');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-black text-white">
      {/* 1-3. HERO SECTION + ANIMATED BRANDING + INTERACTIVE 3D BACKGROUND */}
      <section className="relative overflow-hidden helzerx-hero-aura pt-24 pb-40 md:pt-32 md:pb-52">
        <Suspense fallback={null}>
          <ThreeCoreBackdrop />
        </Suspense>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[440px] md:-bottom-[520px] left-1/2 -translate-x-1/2 w-[180%] md:w-[155%] h-[540px] md:h-[650px] rounded-[100%] bg-black border-t border-violet-300/45 shadow-[0_-24px_90px_rgba(167,139,250,0.42)]"
        />

        <div className="relative z-10 max-w-[1120px] mx-auto px-6 flex flex-col items-center text-center">
          {/* Animated HelzerX Branding Strip */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs md:text-sm font-medium text-violet-200/90 mb-8"
          >
            <span>HelzerX Technologies</span>
            <span aria-hidden="true" className="text-cyan-400/70">·</span>
            <span>helzerx.cyou</span>
            <span aria-hidden="true" className="text-cyan-400/70">·</span>
            <span>Official Launch 01.01.2027</span>
            <span aria-hidden="true" className="text-cyan-400/70">·</span>
            <button
              type="button"
              onClick={() => onNavigate('launch')}
              className="inline-flex items-center gap-1 text-cyan-300 hover:text-white transition-colors cursor-pointer"
            >
              <span>{totalPreorders} Pre-orders Live</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(2.65rem,7.2vw,5.4rem)] font-extrabold tracking-[-0.035em] leading-[0.98] text-white max-w-[16ch] mx-auto"
          >
            {heroHeading}
          </motion.h1>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 max-w-[60ch] text-base md:text-lg leading-[1.6] text-neutral-200/90"
          >
            {heroDesc}
          </motion.p>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              type="button"
              onClick={scrollToEcosystem}
              className="px-6 py-3 text-sm font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors shadow-[0_8px_30px_rgba(255,255,255,0.18)] whitespace-nowrap cursor-pointer"
            >
              Explore Our Ecosystem
            </button>
            <button
              type="button"
              onClick={() => onNavigate('launch')}
              className="px-6 py-3 text-sm font-semibold text-white bg-white/[0.06] border border-white/20 rounded-lg hover:bg-white/[0.12] transition-colors whitespace-nowrap cursor-pointer"
            >
              Get Started
            </button>
          </motion.div>
        </div>
      </section>

      <TrustedLogos />

      {/* 4 & 5. COMPANY INTRODUCTION & OUR TECHNOLOGY ECOSYSTEM */}
      <section id="ecosystem" className="bg-black py-20 md:py-24">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="max-w-[700px] mx-auto text-center">
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight text-white leading-[1.12]">
              One unified technology ecosystem
            </h2>
            <p className="mt-4 text-base md:text-lg leading-[1.6] text-neutral-400">
              HelzerX Technologies brings together bare-metal cloud hosting, a full-cycle creative
              engineering studio, and an e-commerce hardware &amp; software marketplace under one
              authenticated account.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <article className="helzerx-tilt-card flex flex-col justify-between rounded-2xl bg-[#080910] border border-white/[0.1] p-8 hover:border-violet-400/40">
              <div>
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-black" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-white">
                  <span className="font-mono text-sm text-violet-300 mr-2">01.</span>
                  HelzerX Cloud
                </h3>
                <p className="mt-2.5 text-sm text-neutral-300 leading-relaxed">
                  Managed Minecraft, Game Servers, Proxmox LXC containers, and KVM compute powered
                  by secure server-side Pterodactyl API synchronization.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-cyan-300 font-mono">sn1.helzerx.cyou</span>
                <button
                  type="button"
                  onClick={() => onNavigate('cloud', 'cloud')}
                  className="font-semibold text-white hover:text-violet-300 transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Open Cloud</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>

            <article className="helzerx-tilt-card flex flex-col justify-between rounded-2xl bg-[#080910] border border-white/[0.1] p-8 hover:border-blue-400/40">
              <div>
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center">
                  <Layers className="w-5 h-5 text-black" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-white">
                  <span className="font-mono text-sm text-blue-300 mr-2">02.</span>
                  HelzerX Studio
                </h3>
                <p className="mt-2.5 text-sm text-neutral-300 leading-relaxed">
                  Website engineering, UI/UX systems, branding, video production, and custom software
                  with live client project tracking and file collaboration.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-blue-300 font-mono">7 Core Disciplines</span>
                <button
                  type="button"
                  onClick={() => onNavigate('studio', 'studio')}
                  className="font-semibold text-white hover:text-blue-300 transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Open Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>

            <article className="helzerx-tilt-card flex flex-col justify-between rounded-2xl bg-[#080910] border border-white/[0.1] p-8 hover:border-cyan-400/40">
              <div>
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-black" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-white">
                  <span className="font-mono text-sm text-cyan-300 mr-2">03.</span>
                  HelzerX Shop
                </h3>
                <p className="mt-2.5 text-sm text-neutral-300 leading-relaxed">
                  Enterprise compute blades, calibrated displays, mechanical decks, and commercial
                  digital kits with inventory tracking and invoicing.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-cyan-300 font-mono">Global Fulfillment</span>
                <button
                  type="button"
                  onClick={() => onNavigate('shop', 'shop')}
                  className="font-semibold text-white hover:text-cyan-300 transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Open Shop</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 7-9. CLOUD, STUDIO & SHOP INTERACTIVE 3D SHOWCASE (PRESERVING REAL SCREENSHOTS) */}
      <WorkspaceShowcase
        activeDivision={activeDivision}
        onSelectDivision={setActiveDivision}
        onAutoCycleDivision={setActiveDivision}
      />

      {/* 6. FEATURED PRODUCTS FROM DATABASE */}
      <section className="bg-black py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-[clamp(1.85rem,3.5vw,2.6rem)] font-bold tracking-tight text-white">
                Featured Hardware &amp; Digital Kits
              </h2>
              <p className="mt-2 text-sm md:text-base text-neutral-400">
                Live inventory synchronized from the HelzerX Shop catalog.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="text-xs font-semibold text-violet-300 hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <span>Browse full catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <article
                key={product.id}
                className="helzerx-tilt-card flex flex-col justify-between rounded-2xl bg-[#080910] border border-white/[0.1] p-6"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="text-violet-300 font-medium">{product.category}</span>
                    <span className="font-mono tabular-nums">{product.stock} in stock</span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-white">{product.name}</h3>
                  <div className="mt-2 font-mono text-xl font-bold text-white tabular-nums">
                    ${product.price_usd.toLocaleString()}
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-neutral-400">
                    {product.summary}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    addToCart({
                      productId: product.id,
                      name: product.name,
                      priceUsd: product.price_usd,
                    });
                    onNavigate('shop');
                  }}
                  className="mt-5 w-full py-2 px-3 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  Add to Cart
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 10 & 11. WHY CHOOSE HELZERX & PLATFORM AT A GLANCE */}
      <section className="bg-black py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="max-w-[660px] mx-auto text-center">
            <h2 className="text-[clamp(1.85rem,3.5vw,2.75rem)] font-bold tracking-tight text-white">
              Engineered for reliability and speed
            </h2>
            <p className="mt-3 text-sm md:text-base text-neutral-400">
              Built with zero-trust server boundaries, unified identity, and real-time operational
              visibility.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl bg-[#080910] border border-white/[0.1] p-6">
              <ShieldCheck className="w-5 h-5 text-violet-300" />
              <div className="mt-4 text-2xl font-bold font-mono text-white tabular-nums">
                {totalPreorders}
              </div>
              <div className="mt-1 text-xs font-medium text-neutral-300">
                Verified Launch Pre-Orders
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Counted from live launch registrations stored in the platform database.
              </p>
            </div>

            <div className="rounded-2xl bg-[#080910] border border-white/[0.1] p-6">
              <Sparkles className="w-5 h-5 text-cyan-300" />
              <div className="mt-4 text-2xl font-bold font-mono text-white tabular-nums">
                {earlyAccessQualified} / {earlyAccessLimit}
              </div>
              <div className="mt-1 text-xs font-medium text-neutral-300">
                Qualified 8GB Early Access Slots
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                First 50 eligible verified accounts receive 8GB RAM servers on 01.01.2027.
              </p>
            </div>

            <div className="rounded-2xl bg-[#080910] border border-white/[0.1] p-6">
              <Cpu className="w-5 h-5 text-blue-300" />
              <div className="mt-4 text-2xl font-bold font-mono text-white tabular-nums">
                Zero-Leak
              </div>
              <div className="mt-1 text-xs font-medium text-neutral-300">
                Server-Side Pterodactyl Proxy
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Panel credentials remain exclusively in server environment variables.
              </p>
            </div>

            <div className="rounded-2xl bg-[#080910] border border-white/[0.1] p-6">
              <Lock className="w-5 h-5 text-emerald-300" />
              <div className="mt-4 text-2xl font-bold font-mono text-white tabular-nums">
                1 Account
              </div>
              <div className="mt-1 text-xs font-medium text-neutral-300">
                Unified RBAC Portal
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Single sign-on across Cloud, Studio, Shop, Partners, and Support Center.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 14. JANUARY 1, 2027 LAUNCH CAMPAIGN PROMOTION */}
      <section className="relative overflow-hidden bg-black py-20 border-t border-white/[0.06]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,rgba(91,33,182,0.22),transparent_75%)]"
        />
        <div className="relative z-10 max-w-[1040px] mx-auto px-6">
          <div className="rounded-3xl bg-[#0A0B14]/90 border border-violet-400/30 p-8 md:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-300">
                <Zap className="w-3.5 h-3.5" />
                <span>HELZERX OFFICIAL LAUNCH · 01.01.2027</span>
              </div>
              <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-white">
                Claim your 8GB RAM Early Access allocation
              </h2>
              <p className="mt-3 text-sm md:text-base text-neutral-300 leading-relaxed">
                With {totalPreorders} pre-orders committed, our Early Access program reserves an
                8GB RAM server for the first 50 verified users who register before January 1, 2027.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('launch')}
                className="px-6 py-3 text-sm font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Register for Early Access
              </button>
              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className="px-5 py-3 text-sm font-medium text-white border border-white/20 rounded-lg hover:border-white/40 transition-colors cursor-pointer"
              >
                View Pricing
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 12. WHY BUILD WITH HELZERX */}
      <section className="bg-black py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="max-w-[640px] mx-auto text-center">
            <h2 className="text-[clamp(1.85rem,3.5vw,2.6rem)] font-bold tracking-tight text-white">
              One platform, no handoffs
            </h2>
            <p className="mt-3 text-sm md:text-base text-neutral-400">
              Infrastructure, hardware, and product engineering under a single authenticated account.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'One identity everywhere',
                body: 'The same account opens the Cloud console, Studio workspace, Shop catalog, and Support center.',
              },
              {
                title: 'Credentials stay server-side',
                body: 'Panel and payment keys are held in environment variables and proxied through the API — never the browser.',
              },
              {
                title: 'Built to be extended',
                body: 'Every action in the platform is backed by a documented API and a real database record.',
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-2xl bg-[#080910] border border-white/[0.1] p-8 hover:border-violet-400/35 transition-colors duration-200"
              >
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm text-neutral-400 leading-relaxed">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 13 & 15. LATEST ANNOUNCEMENTS & PARTNERSHIP SHOWCASE */}
      <section className="bg-black py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-[1160px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Announcements */}
          <div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-white">Latest Announcements</h2>
              <button
                type="button"
                onClick={() => onNavigate('blog')}
                className="text-xs font-semibold text-violet-300 hover:text-white cursor-pointer"
              >
                All updates →
              </button>
            </div>
            <div className="mt-6 space-y-4">
              {announcements.map((ann) => (
                <article
                  key={ann.id}
                  className="rounded-2xl bg-[#080910] border border-white/[0.1] p-6"
                >
                  <div className="text-xs font-mono text-cyan-300 uppercase">{ann.type}</div>
                  <h3 className="mt-2 text-base font-bold text-white">{ann.title}</h3>
                  <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{ann.body}</p>
                </article>
              ))}
            </div>
          </div>

          {/* Partnership Showcase */}
          <div className="rounded-2xl bg-[#090A14] border border-white/[0.12] p-8 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-medium text-violet-300">
                <Globe className="w-4 h-4" />
                <span>HelzerX Partner Network</span>
              </div>
              <h2 className="mt-3 text-2xl font-bold text-white">
                Grow with the HelzerX Business Partnership Program
              </h2>
              <p className="mt-3 text-sm text-neutral-300 leading-relaxed">
                Agencies, gaming networks, and systems integrators earn recurring 15% commissions,
                dedicated infrastructure sandboxes, and priority Studio engineering allocations.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-neutral-300">
                <li>· Real-time referral link &amp; commission tracking</li>
                <li>· Direct administrator review and partner onboarding</li>
                <li>· Co-branded promotional kits and technical support</li>
              </ul>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('partners')}
                className="px-5 py-2.5 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Become a Partner
              </button>
              <button
                type="button"
                onClick={() => onNavigate('careers')}
                className="px-5 py-2.5 text-xs font-medium text-neutral-200 border border-white/15 rounded-lg hover:border-white/30 transition-colors cursor-pointer"
              >
                Explore Careers
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 16. FREQUENTLY ASKED QUESTIONS */}
      <section className="bg-black py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-[860px] mx-auto px-6">
          <div className="text-center">
            <h2 className="text-[clamp(1.85rem,3.5vw,2.6rem)] font-bold tracking-tight text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-sm md:text-base text-neutral-400">
              Answers on HelzerX Cloud, Shop, Studio, security, and the January 1, 2027 launch.
            </p>
          </div>

          <div className="mt-10 divide-y divide-white/[0.08] border-t border-b border-white/[0.08]">
            {faqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 text-left py-2 cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-mono text-violet-300 block mb-1">
                        {faq.category}
                      </span>
                      <span className="text-sm md:text-base font-semibold text-white">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-white' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2 pb-2 text-sm text-neutral-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
