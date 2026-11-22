import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Cloud,
  Cpu,
  Globe,
  Layers,
  Lock,
  Server,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { lazy, Suspense, useState } from 'react';
import { LaunchAdBanner } from '../components/LaunchAdBanner';
import { Surface3D } from '../components/Surface3D';
import { TrustedLogos } from '../components/TrustedLogos';
import { WorkspaceShowcase } from '../components/WorkspaceShowcase';
import { useAppContext } from '../context/AppContext';
import { DivisionId } from '../lib/platformData';
import { PageRoute } from '../types/navigation';

// Load the interactive 3D matte-black studded sculpture lazily so hero text paints immediately.
const ThreeCoreBackdrop = lazy(() =>
  import('../components/ThreeCoreBackdrop').then((module) => ({
    default: module.ThreeCoreBackdrop,
  })),
);

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
  const totalPreorders = siteData?.launch?.totalPreorders ?? 47;
  const earlyAccessQualified = siteData?.launch?.earlyAccessQualified ?? 0;
  const earlyAccessLimit = siteData?.launch?.earlyAccessLimit ?? 50;
  const announcements = siteData?.announcements ?? [];
  const featuredProducts = siteData?.featuredProducts ?? [];
  const faqs = siteData?.faqs ?? [];

  const scrollToEcosystem = () => {
    const el = document.getElementById('ecosystem');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const eaPercent = Math.min(100, Math.round((earlyAccessQualified / Math.max(1, earlyAccessLimit)) * 100));

  return (
    <div className="bg-[#F4F4F5] text-[#0A0A0B]">
      {/* 1-3. STUDIO HERO WITH HALFTONE DOTTED HEADLINE + 3D MATTE-BLACK SCULPTURE + FLOATING 3D CARDS */}
      <section className="relative overflow-hidden helzerx-studio-hero pt-14 pb-24 md:pt-20 md:pb-28">
        <div className="relative z-10 max-w-[1180px] mx-auto px-6 flex flex-col items-center text-center">
          {/* Quiet Typographic Meta Header */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-medium text-neutral-600 mb-6"
          >
            <span className="font-semibold text-[#0A0A0B]">HelzerX Technologies</span>
            <span aria-hidden="true" className="text-neutral-400">·</span>
            <span>helzerx.cyou</span>
            <span aria-hidden="true" className="text-neutral-400">·</span>
            <span>Launch January 1, 2027</span>
            <span aria-hidden="true" className="text-neutral-400">·</span>
            <button
              type="button"
              onClick={() => onNavigate('launch')}
              className="inline-flex items-center gap-1 font-semibold text-[#0A0A0B] hover:text-neutral-600 transition-colors cursor-pointer"
            >
              <span className="tabular-nums">{totalPreorders} Pre-Orders Active</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          {/* Signature Dotted Halftone Hero Headline */}
          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(2.9rem,7.8vw,6.2rem)] font-extrabold tracking-[-0.045em] leading-[0.95] helzerx-dotted-text max-w-[14ch] mx-auto pb-2"
          >
            {heroHeading}
          </motion.h1>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-[58ch] text-sm md:text-base leading-[1.65] text-neutral-600"
          >
            {heroDesc}
          </motion.p>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3.5 relative z-20"
          >
            <button
              type="button"
              onClick={scrollToEcosystem}
              className="px-6 py-3 text-xs md:text-sm font-semibold text-white bg-[#0A0A0B] rounded-xl hover:bg-neutral-800 transition-all shadow-[0_14px_30px_rgba(10,10,11,0.22)] whitespace-nowrap cursor-pointer"
            >
              Explore Our Ecosystem
            </button>
            <button
              type="button"
              onClick={() => onNavigate('launch')}
              className="px-6 py-3 text-xs md:text-sm font-semibold text-[#0A0A0B] bg-white border border-black/15 rounded-xl hover:bg-neutral-100 transition-all shadow-[0_12px_28px_rgba(10,10,14,0.1)] whitespace-nowrap cursor-pointer"
            >
              Get Started
            </button>
          </motion.div>

          {/* 3D Animated Official HelzerX Emblem Centerpiece + Floating Callout Tags */}
          <div className="relative w-full max-w-[740px] h-[300px] sm:h-[360px] md:h-[400px] mx-auto mt-3 -mb-10 sm:-mb-12">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src="/assets/aistudio/IMG_20261011_201132-removebg-preview_9b5f47c8.png"
                    alt=""
                    className="w-[220px] sm:w-[270px] h-auto object-contain opacity-90"
                  />
                </div>
              }
            >
              <ThreeCoreBackdrop />
            </Suspense>

            {/* 4 Spatial Floating White Callout Tags Around 3D Logo */}
            <button
              type="button"
              onClick={() => onNavigate('cloud', 'cloud')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08] shadow-[0_14px_30px_rgba(0,0,0,0.1)] text-[11px] font-semibold text-[#0A0A0B] absolute top-10 left-4 md:left-12 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <span>HelzerX Cloud</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('studio', 'studio')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08] shadow-[0_14px_30px_rgba(0,0,0,0.1)] text-[11px] font-semibold text-[#0A0A0B] absolute top-16 right-4 md:right-12 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <span>HelzerX Studio</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('shop', 'shop')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08] shadow-[0_14px_30px_rgba(0,0,0,0.1)] text-[11px] font-semibold text-[#0A0A0B] absolute bottom-24 left-2 md:left-10 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <span>Hardware &amp; Shop</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('launch')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08] shadow-[0_14px_30px_rgba(0,0,0,0.1)] text-[11px] font-semibold text-[#0A0A0B] absolute bottom-20 right-4 md:right-8 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <span>Launch 01.01.2027</span>
            </button>
          </div>

          {/* 4 Overlapping Floating White 3D KPI Cards */}
          <div className="relative z-20 w-full max-w-[1060px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 text-left">
            <Surface3D intensity={12} delay={0}>
              <div className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0B] tracking-tight tabular-nums">
                    {totalPreorders}+
                  </div>
                  <div className="mt-2 text-xs font-bold text-[#0A0A0B]">Pre-Orders Committed</div>
                </div>
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                  Verified reservations tracked against live platform ledger records.
                </p>
              </div>
            </Surface3D>

            <Surface3D intensity={12} delay={0.05}>
              <div className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0B] tracking-tight tabular-nums">
                    {earlyAccessQualified} / {earlyAccessLimit}
                  </div>
                  <div className="mt-2 text-xs font-bold text-[#0A0A0B]">8GB Early Access</div>
                </div>
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                  First 50 email-verified members receive an 8GB RAM launch node.
                </p>
              </div>
            </Surface3D>

            <Surface3D intensity={12} delay={0.1}>
              <div className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0B] tracking-tight tabular-nums">
                    01.01.27
                  </div>
                  <div className="mt-2 text-xs font-bold text-[#0A0A0B]">Global Release</div>
                </div>
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                  Official full-ecosystem opening across Cloud, Studio, and Shop.
                </p>
              </div>
            </Surface3D>

            <Surface3D intensity={12} delay={0.15}>
              <div className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0B] tracking-tight tabular-nums">
                    99.98%
                  </div>
                  <div className="mt-2 text-xs font-bold text-[#0A0A0B]">Cloud Uptime SLA</div>
                </div>
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                  Zero-leak Express proxy routing sn1.helzerx.cyou Pterodactyl clusters.
                </p>
              </div>
            </Surface3D>
          </div>
        </div>
      </section>

      <LaunchAdBanner onNavigate={onNavigate} />

      <TrustedLogos onNavigate={onNavigate} />

      {/* 4 & 5. INTERACTIVE 3D ECOSYSTEM BENTO */}
      <section id="ecosystem" className="bg-[#F4F4F5] py-24 md:py-32 border-t border-black/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="max-w-[740px] mx-auto text-center">
            <div className="text-xs font-medium text-neutral-500 mb-2">
              The HelzerX Platform
            </div>
            <h2 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-extrabold tracking-[-0.04em] helzerx-dotted-text leading-[1.02] pb-2">
              our ecosystem.
            </h2>
            <p className="mt-4 text-sm md:text-base leading-[1.6] text-neutral-600">
              Bare-metal cloud compute, creative software engineering, and enterprise hardware
              procurement unified under one authenticated account.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* HelzerX Cloud 3D Card — Seamless Full-Bleed Top Image Melting Smoothly Downward */}
            <Surface3D intensity={13} delay={0}>
              <article className="h-full flex flex-col justify-between">
                <div>
                  <button
                    type="button"
                    onClick={() => onNavigate('cloud', 'cloud')}
                    className="relative block w-full h-44 sm:h-48 overflow-hidden bg-[#0A0A0C] cursor-pointer group/banner"
                  >
                    <img
                      src="/assets/aistudio/file_0000000027788211b1e314262e805179_c9c9b7ff.png"
                      alt="HelzerX Cloud — Modern Cloud Solutions"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f8f8fb] via-[#f8f8fb]/75 via-30% to-transparent"
                    />
                  </button>

                  <div className="px-7 pt-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#111114] text-white flex items-center justify-center shadow-[0_8px_18px_rgba(10,10,14,0.22)]">
                          <Cloud className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-[#0A0A0B] tracking-tight">
                          HelzerX Cloud
                        </h3>
                      </div>
                      <span className="text-xs font-medium text-neutral-500">Infrastructure</span>
                    </div>

                    <p className="mt-3.5 text-sm text-neutral-600 leading-relaxed">
                      High-frequency Ryzen EPYC Minecraft nodes, Proxmox LXC containers, and VPS
                      clusters backed by live Pterodactyl API controls.
                    </p>
                  </div>
                </div>

                <div className="px-7 pb-7 pt-5 mt-6 border-t border-black/[0.06] flex items-center justify-between text-xs">
                  <span className="text-neutral-500 font-medium">sn1.helzerx.cyou</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('cloud', 'cloud')}
                    className="font-semibold text-[#0A0A0B] hover:text-neutral-600 transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Explore Cloud</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            </Surface3D>

            {/* HelzerX Studio 3D Card — Seamless Full-Bleed Top Image Melting Smoothly Downward */}
            <Surface3D intensity={13} delay={0.06}>
              <article className="h-full flex flex-col justify-between">
                <div>
                  <button
                    type="button"
                    onClick={() => onNavigate('studio', 'studio')}
                    className="relative block w-full h-44 sm:h-48 overflow-hidden bg-[#0A0A0C] cursor-pointer group/banner"
                  >
                    <img
                      src="/assets/aistudio/file_00000000808c8211b10e793920a7f76f_8d80975c.png"
                      alt="HelzerX Studio 2026 — Turning Ideas Into Reality"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f8f8fb] via-[#f8f8fb]/75 via-30% to-transparent"
                    />
                  </button>

                  <div className="px-7 pt-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#111114] text-white flex items-center justify-center shadow-[0_8px_18px_rgba(10,10,14,0.22)]">
                          <Layers className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-[#0A0A0B] tracking-tight">
                          HelzerX Studio
                        </h3>
                      </div>
                      <span className="text-xs font-medium text-neutral-500">Engineering</span>
                    </div>

                    <p className="mt-3.5 text-sm text-neutral-600 leading-relaxed">
                      Full-stack web platforms, UI/UX design systems, branding, video production, and
                      bespoke enterprise software built in structured sprints.
                    </p>
                  </div>
                </div>

                <div className="px-7 pb-7 pt-5 mt-6 border-t border-black/[0.06] flex items-center justify-between text-xs">
                  <span className="text-neutral-500 font-medium">Client Project Portal</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('studio', 'studio')}
                    className="font-semibold text-[#0A0A0B] hover:text-neutral-600 transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Explore Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            </Surface3D>

            {/* HelzerX Shop 3D Card — Seamless Full-Bleed Top Image Melting Smoothly Downward */}
            <Surface3D intensity={13} delay={0.12}>
              <article className="h-full flex flex-col justify-between">
                <div>
                  <button
                    type="button"
                    onClick={() => onNavigate('shop', 'shop')}
                    className="relative block w-full h-44 sm:h-48 overflow-hidden bg-[#0A0A0C] cursor-pointer group/banner"
                  >
                    <img
                      src="/assets/aistudio/file_00000000ca6c821196ff7de47bf63b50_2269b23b.png"
                      alt="HelzerX SHOP — Premium Store"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f8f8fb] via-[#f8f8fb]/75 via-30% to-transparent"
                    />
                  </button>

                  <div className="px-7 pt-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#111114] text-white flex items-center justify-center shadow-[0_8px_18px_rgba(10,10,14,0.22)]">
                          <ShoppingBag className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-[#0A0A0B] tracking-tight">
                          HelzerX Shop
                        </h3>
                      </div>
                      <span className="text-xs font-medium text-neutral-500">Storefront</span>
                    </div>

                    <p className="mt-3.5 text-sm text-neutral-600 leading-relaxed">
                      Rack compute blades, calibrated 6K displays, anodized mechanical decks, and
                      commercial engineering kits with verified stock &amp; invoices.
                    </p>
                  </div>
                </div>

                <div className="px-7 pb-7 pt-5 mt-6 border-t border-black/[0.06] flex items-center justify-between text-xs">
                  <span className="text-neutral-500 font-medium">Global Fulfillment</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('shop', 'shop')}
                    className="font-semibold text-[#0A0A0B] hover:text-neutral-600 transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Open Shop</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            </Surface3D>
          </div>
        </div>
      </section>

      {/* 7-9. CLOUD, STUDIO & SHOP 3D INTERACTIVE SCREENSHOT SHOWCASE */}
      <WorkspaceShowcase
        activeDivision={activeDivision}
        onSelectDivision={setActiveDivision}
        onAutoCycleDivision={setActiveDivision}
      />

      {/* 6. FEATURED PRODUCTS (HIGH-DEPTH 3D PRODUCT GALLERY) */}
      <section className="bg-[#F4F4F5] py-24 md:py-28 border-t border-black/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-neutral-500 mb-2">
                HelzerX Storefront
              </div>
              <h2 className="text-[clamp(2.25rem,4.8vw,3.75rem)] font-extrabold tracking-[-0.04em] helzerx-dotted-text leading-[1.04] pb-1">
                featured gear.
              </h2>
              <p className="mt-2 text-sm md:text-base text-neutral-600">
                Synchronized live with inventory counts, customer reviews, and invoice generation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="text-xs font-semibold text-[#0A0A0B] hover:text-neutral-600 transition-colors inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <span>Browse full catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map((product, idx) => (
              <Surface3D key={product.id} intensity={12} delay={idx * 0.05}>
                <article className="h-full flex flex-col justify-between p-6 text-left">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-neutral-500">
                      <span>{product.category}</span>
                      <span className="tabular-nums">{product.stock} left</span>
                    </div>

                    <div className="mt-3 text-3xl font-extrabold text-[#0A0A0B] tabular-nums tracking-tight">
                      ${product.price_usd.toLocaleString()}
                    </div>

                    <div className="mt-4 pt-4 border-t border-black/[0.07]">
                      <h3 className="text-base font-bold text-[#0A0A0B] tracking-tight leading-snug">
                        {product.name}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                        {product.summary}
                      </p>
                    </div>
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
                    className="mt-6 w-full py-2.5 px-3 text-xs font-semibold text-white bg-[#0A0A0B] rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Add to Cart
                  </button>
                </article>
              </Surface3D>
            ))}
          </div>
        </div>
      </section>

      {/* 10 & 11. ARCHITECTURAL BENTO PROOF */}
      <section className="bg-[#F4F4F5] py-24 md:py-28 border-t border-black/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="max-w-[680px] mx-auto text-center">
            <div className="text-xs font-medium text-neutral-500 mb-2">
              System Architecture
            </div>
            <h2 className="text-[clamp(2rem,4vw,3.1rem)] font-extrabold tracking-[-0.03em] text-[#0A0A0B]">
              Engineered for verifiable reliability
            </h2>
            <p className="mt-3 text-sm md:text-base text-neutral-600">
              Every server command, checkout order, and Launch 2027 allocation operates against real
              database state and server-isolated API gateways.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Surface3D className="lg:col-span-7" intensity={10} delay={0}>
              <div className="p-8 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0A0A0B]">
                    <Cpu className="w-4 h-4 text-[#0A0A0B]" />
                    <span>Zero-Leak Server Proxy</span>
                  </div>
                  <h3 className="mt-3 text-2xl font-bold text-[#0A0A0B] tracking-tight">
                    Strict Server-Side API Isolation
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600 max-w-xl leading-relaxed">
                    Client sessions authenticate via scrypt-verified HMAC tokens held strictly in
                    memory. Pterodactyl and Stripe credentials remain encrypted on the Express server.
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-[#F4F4F5] border border-black/[0.08] p-4 shadow-sm">
                    <div className="text-[11px] font-medium text-neutral-500">Browser Client</div>
                    <div className="mt-1 text-sm font-bold text-[#0A0A0B]">Memory Bearer</div>
                    <div className="mt-1 text-[11px] text-neutral-600">Zero key exposure</div>
                  </div>
                  <div className="rounded-xl bg-[#111114] text-white p-4 shadow-[0_14px_28px_rgba(0,0,0,0.3)]">
                    <div className="text-[11px] font-medium text-neutral-300">Express Gateway</div>
                    <div className="mt-1 text-sm font-bold text-white">RBAC + Rate Limit</div>
                    <div className="mt-1 text-[11px] text-neutral-400">Audit-logged routes</div>
                  </div>
                  <div className="rounded-xl bg-[#F4F4F5] border border-black/[0.08] p-4 shadow-sm">
                    <div className="text-[11px] font-medium text-neutral-500">Upstream Nodes</div>
                    <div className="mt-1 text-sm font-bold text-[#0A0A0B]">Pterodactyl &amp; DB</div>
                    <div className="mt-1 text-[11px] text-neutral-600">Verified ownership</div>
                  </div>
                </div>
              </div>
            </Surface3D>

            <Surface3D className="lg:col-span-5" intensity={10} delay={0.05}>
              <div className="p-8 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0A0A0B]">
                    <Sparkles className="w-4 h-4 text-[#0A0A0B]" />
                    <span>Launch 01.01.2027 Allocation</span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-[#0A0A0B] tabular-nums tracking-tight">
                      {earlyAccessQualified}
                    </span>
                    <span className="text-lg font-semibold text-neutral-500 tabular-nums">
                      / {earlyAccessLimit} qualified
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                    Verified pre-launch accounts within the first 50 slots automatically qualify for
                    an 8GB RAM launch server.
                  </p>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-600 font-medium">Allocation Progress</span>
                    <span className="font-bold text-[#0A0A0B] tabular-nums">{eaPercent}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-neutral-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0A0A0B] transition-all duration-500"
                      style={{ width: `${Math.max(4, eaPercent)}%` }}
                    />
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs text-neutral-600">
                    <span className="tabular-nums">{totalPreorders} total pre-orders logged</span>
                    <button
                      type="button"
                      onClick={() => onNavigate('launch')}
                      className="font-bold text-[#0A0A0B] hover:text-neutral-600 cursor-pointer"
                    >
                      Check Slot →
                    </button>
                  </div>
                </div>
              </div>
            </Surface3D>

            <Surface3D className="lg:col-span-4" intensity={12} delay={0.08}>
              <div className="p-7 h-full flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#111114] text-white flex items-center justify-center shadow-md">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-[#0A0A0B]">Unified Account &amp; RBAC</h3>
                </div>
                <p className="mt-2.5 text-xs text-neutral-600 leading-relaxed">
                  One account across Cloud servers, Shop orders, Studio threads, and Partner
                  referrals with granular Staff and Admin permissions.
                </p>
              </div>
            </Surface3D>

            <Surface3D className="lg:col-span-4" intensity={12} delay={0.12}>
              <div className="p-7 h-full flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#111114] text-white flex items-center justify-center shadow-md">
                    <Server className="w-4 h-4" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-[#0A0A0B]">Direct Node Control</h3>
                </div>
                <p className="mt-2.5 text-xs text-neutral-600 leading-relaxed">
                  Provision requests, live metrics, and start/restart/stop controls linked directly
                  to Pterodactyl server identifiers.
                </p>
              </div>
            </Surface3D>

            <Surface3D className="lg:col-span-4" intensity={12} delay={0.16}>
              <div className="p-7 h-full flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#111114] text-white flex items-center justify-center shadow-md">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-[#0A0A0B]">Documented API &amp; Audit Trail</h3>
                </div>
                <p className="mt-2.5 text-xs text-neutral-600 leading-relaxed">
                  Every order, server mutation, and RBAC role change writes verifiable audit records
                  backed by SQLite WAL persistence.
                </p>
              </div>
            </Surface3D>
          </div>
        </div>
      </section>

      {/* 14. JANUARY 1, 2027 LAUNCH CAMPAIGN CENTERPIECE (Sculptural Matte-Black 3D Banner on Light Ground) */}
      <section className="relative overflow-hidden bg-[#F4F4F5] py-20 border-t border-black/[0.06]">
        <div className="max-w-[1140px] mx-auto px-6">
          <Surface3D variant="dark" intensity={8} className="rounded-3xl">
            <div className="p-8 md:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-xl">
                <div className="text-xs font-medium text-neutral-300">
                  Official Launch · January 1, 2027
                </div>
                <h2 className="mt-3 text-2xl md:text-4xl font-extrabold tracking-[-0.025em] text-white">
                  Reserve your 8GB RAM Early Access server
                </h2>
                <p className="mt-3 text-sm md:text-base text-neutral-300 leading-relaxed">
                  With {totalPreorders} pre-orders committed, our launch program allocates an 8GB
                  RAM server to the first 50 verified members registered before January 1, 2027.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate('launch')}
                  className="px-6 py-3 text-sm font-bold text-[#0A0A0B] bg-white rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  Register for Early Access
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('pricing')}
                  className="px-5 py-3 text-sm font-semibold text-white border border-white/25 rounded-xl hover:border-white/50 transition-colors cursor-pointer"
                >
                  View Pricing
                </button>
              </div>
            </div>
          </Surface3D>
        </div>
      </section>

      {/* 13 & 15. LATEST ANNOUNCEMENTS & BUSINESS PARTNERSHIPS */}
      <section className="bg-[#F4F4F5] py-24 border-t border-black/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-[#0A0A0B]">
                Latest Announcements
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('blog')}
                className="text-xs font-bold text-[#0A0A0B] hover:text-neutral-600 cursor-pointer"
              >
                All updates →
              </button>
            </div>
            <div className="mt-6 space-y-4">
              {announcements.map((ann, idx) => (
                <Surface3D key={ann.id} intensity={8} delay={idx * 0.05}>
                  <article className="p-6">
                    <div className="text-xs font-semibold text-neutral-500">
                      {ann.type}
                    </div>
                    <h3 className="mt-2 text-base font-bold text-[#0A0A0B]">{ann.title}</h3>
                    <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{ann.body}</p>
                  </article>
                </Surface3D>
              ))}
            </div>
          </div>

          <Surface3D intensity={8}>
            <div className="p-8 md:p-10 h-full flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0A0A0B]">
                  <Globe className="w-4 h-4 text-[#0A0A0B]" />
                  <span>HelzerX Partner Network</span>
                </div>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#0A0A0B]">
                  Partner With HelzerX Technologies
                </h2>
                <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
                  Agencies, server networks, and systems integrators earn recurring 15% commissions
                  with dedicated partner portal attribution and engineering escalation.
                </p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl bg-[#F4F4F5] border border-black/[0.08] p-3.5">
                    <div className="text-lg font-extrabold text-[#0A0A0B] tabular-nums">15%</div>
                    <div className="text-neutral-600 mt-0.5">Commission Share</div>
                  </div>
                  <div className="rounded-xl bg-[#F4F4F5] border border-black/[0.08] p-3.5">
                    <div className="text-lg font-extrabold text-[#0A0A0B]">Live</div>
                    <div className="text-neutral-600 mt-0.5">Referral Codes</div>
                  </div>
                  <div className="rounded-xl bg-[#F4F4F5] border border-black/[0.08] p-3.5">
                    <div className="text-lg font-extrabold text-[#0A0A0B]">Direct</div>
                    <div className="text-neutral-600 mt-0.5">Admin Review</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('partners')}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0A0A0B] rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Become a Partner
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('careers')}
                  className="px-5 py-2.5 text-xs font-semibold text-[#0A0A0B] border border-black/15 rounded-xl hover:border-black/35 transition-colors cursor-pointer"
                >
                  Explore Careers
                </button>
              </div>
            </div>
          </Surface3D>
        </div>
      </section>

      {/* 16. SMOOTH ANIMATED FAQ ACCORDION */}
      <section className="bg-[#F4F4F5] py-24 border-t border-black/[0.06]">
        <div className="max-w-[880px] mx-auto px-6">
          <div className="text-center">
            <div className="text-xs font-medium text-neutral-500 mb-2">
              Platform Clarity
            </div>
            <h2 className="text-[clamp(1.85rem,3.5vw,2.75rem)] font-extrabold tracking-[-0.025em] text-[#0A0A0B]">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-sm md:text-base text-neutral-600">
              Answers on Cloud infrastructure, Shop invoicing, Studio projects, and the January 1,
              2027 launch.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl bg-white border border-black/[0.08] px-6 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.05)] transition-colors hover:border-black/[0.18]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 text-left py-1 cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-medium text-neutral-500 block mb-1">
                        {faq.category}
                      </span>
                      <span className="text-sm md:text-base font-bold text-[#0A0A0B]">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-[#0A0A0B]' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pt-3 pb-1 text-sm text-neutral-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
