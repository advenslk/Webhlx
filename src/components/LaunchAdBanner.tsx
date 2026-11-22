import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Surface3D } from './Surface3D';
import { PageRoute } from '../types/navigation';

interface LaunchAdBannerProps {
  onNavigate: (route: PageRoute) => void;
}

interface AdSlide {
  id: string;
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  accentGlow: string;
}

const AD_SLIDES: AdSlide[] = [
  {
    id: 'launch-2027-global',
    image: '/assets/aistudio/file_000000004ad88211a8e591ecb96170f2_8add3bda.png',
    alt: 'HelzerX Technologies Official Launch — 2027.01.01 — A New Era Begins',
    eyebrow: 'Official Global Launch · 2027.01.01',
    title: 'A New Era Begins Across Cloud, Studio & Shop',
    description:
      'Innovate, build, and grow on unified infrastructure launching worldwide on January 1, 2027.',
    ctaLabel: 'Explore Launch 2027',
    accentGlow: 'from-emerald-500/20 via-emerald-950/30 to-transparent',
  },
  {
    id: 'launch-8gb-early-access',
    image: '/assets/aistudio/file_00000000bfb482118c24707616217a1a_fd55a8df.png',
    alt: 'HelzerX Official Launch Day — 8GB Free MC Server for First 50 Registered Users',
    eyebrow: 'Early Access Allocation · First 50 Users',
    title: '8GB Free MC Server for First 50 Verified Members',
    description:
      'Register and verify your account ahead of January 1, 2027 to qualify for a launch-day 8GB RAM server node.',
    ctaLabel: 'Register Now',
    accentGlow: 'from-violet-500/25 via-indigo-950/35 to-transparent',
  },
];

const SLIDE_DURATION_MS = 5000;

export function LaunchAdBanner({ onNavigate }: LaunchAdBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (paused || shouldReduceMotion) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % AD_SLIDES.length);
    }, SLIDE_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [paused, shouldReduceMotion]);

  const goToSlide = (nextIndex: number) => {
    setDirection(nextIndex > activeIndex ? 1 : -1);
    setActiveIndex(nextIndex);
  };

  const stepSlide = (delta: number) => {
    setDirection(delta >= 0 ? 1 : -1);
    setActiveIndex((prev) => (prev + delta + AD_SLIDES.length) % AD_SLIDES.length);
  };

  const activeSlide = AD_SLIDES[activeIndex];

  return (
    <section
      aria-label="Launch promotions"
      className="bg-[#F4F4F5] py-10 md:py-14 border-t border-black/[0.06]"
    >
      <div className="max-w-[1060px] mx-auto px-6">
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <Surface3D variant="dark" intensity={7} className="rounded-2xl overflow-hidden">
            <div className="relative grid grid-cols-1 lg:grid-cols-[1.35fr_0.95fr] items-stretch">
              {/* Animated Promotional Artwork Stage */}
              <button
                type="button"
                onClick={() => onNavigate('launch')}
                className="relative h-[220px] sm:h-[270px] lg:h-[290px] w-full overflow-hidden bg-[#070709] cursor-pointer text-left focus:outline-none group"
                aria-label={`${activeSlide.title} — Open Launch 2027 page`}
              >
                <AnimatePresence mode="wait" custom={direction} initial={false}>
                  <motion.div
                    key={activeSlide.id}
                    custom={direction}
                    initial={
                      shouldReduceMotion
                        ? { opacity: 1 }
                        : { opacity: 0, x: direction > 0 ? 36 : -36, scale: 0.985 }
                    }
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 1 }
                        : { opacity: 0, x: direction > 0 ? -36 : 36, scale: 0.985 }
                    }
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 flex items-center justify-center p-3 sm:p-4"
                  >
                    {/* Soft ambient color backdrop matching the active poster */}
                    <img
                      src={activeSlide.image}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-110 pointer-events-none select-none"
                    />
                    <div
                      aria-hidden="true"
                      className={`absolute inset-0 bg-gradient-to-tr ${activeSlide.accentGlow} pointer-events-none`}
                    />

                    {/* Crisp full artwork with gentle continuous float/zoom */}
                    <motion.img
                      src={activeSlide.image}
                      alt={activeSlide.alt}
                      animate={
                        shouldReduceMotion
                          ? undefined
                          : { scale: [1, 1.022, 1] }
                      }
                      transition={
                        shouldReduceMotion
                          ? undefined
                          : { duration: 4.8, repeat: Infinity, ease: 'easeInOut' }
                      }
                      className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain rounded-xl shadow-[0_18px_45px_rgba(0,0,0,0.65)] ring-1 ring-white/10"
                    />
                  </motion.div>
                </AnimatePresence>
              </button>

              {/* Editorial Caption + Controls */}
              <div className="relative flex flex-col justify-between p-6 sm:p-8 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#0d0d11]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeSlide.id}
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="text-[11px] font-semibold tracking-wide text-neutral-400">
                      {activeSlide.eyebrow}
                    </div>
                    <h3 className="mt-2 text-lg sm:text-xl font-extrabold tracking-tight text-white leading-snug">
                      {activeSlide.title}
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                      {activeSlide.description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate('launch')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0A0A0B] bg-white rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    <span>{activeSlide.ctaLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => stepSlide(-1)}
                      aria-label="Previous promotion"
                      className="w-7 h-7 rounded-lg border border-white/15 text-neutral-300 hover:text-white hover:border-white/35 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1.5 px-1">
                      {AD_SLIDES.map((slide, idx) => (
                        <button
                          key={slide.id}
                          type="button"
                          onClick={() => goToSlide(idx)}
                          aria-label={`Show promotion ${idx + 1}`}
                          aria-current={idx === activeIndex ? 'true' : undefined}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            idx === activeIndex
                              ? 'w-5 bg-white'
                              : 'w-1.5 bg-white/30 hover:bg-white/55'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => stepSlide(1)}
                      aria-label="Next promotion"
                      className="w-7 h-7 rounded-lg border border-white/15 text-neutral-300 hover:text-white hover:border-white/35 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtle slide timer progress bar */}
                {!shouldReduceMotion && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-white/10 overflow-hidden"
                  >
                    <motion.div
                      key={`${activeSlide.id}-${paused ? 'paused' : 'play'}`}
                      initial={{ scaleX: 0 }}
                      animate={paused ? { scaleX: 0 } : { scaleX: 1 }}
                      transition={{
                        duration: paused ? 0 : SLIDE_DURATION_MS / 1000,
                        ease: 'linear',
                      }}
                      className="h-full w-full origin-left bg-white/75"
                    />
                  </div>
                )}
              </div>
            </div>
          </Surface3D>
        </div>
      </div>
    </section>
  );
}
