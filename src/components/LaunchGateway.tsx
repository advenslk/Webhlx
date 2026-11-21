import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { PageRoute } from '../types/navigation';

interface LaunchGatewayProps {
  visible: boolean;
  onEnterSite: (targetRoute?: PageRoute) => void;
}

const HELZERX_LOGO_URL = '/assets/aistudio/IMG_20261011_201132-removebg-preview_9b5f47c8.png';

export function LaunchGateway({ visible, onEnterSite }: LaunchGatewayProps) {
  const { siteData } = useAppContext();
  const shouldReduceMotion = useReducedMotion();
  const [jumping, setJumping] = useState(false);

  const launchDateIso = siteData?.launch?.launchDate || '2027-01-01T00:00:00Z';
  const totalPreorders = siteData?.launch?.totalPreorders ?? 47;
  const earlyAccessLimit = siteData?.launch?.earlyAccessLimit ?? 50;
  const earlyAccessQualified = siteData?.launch?.earlyAccessQualified ?? 0;
  const spotsRemaining = Math.max(0, earlyAccessLimit - earlyAccessQualified);

  const [countdown, setCountdown] = useState(() => {
    const target = new Date(launchDateIso).getTime();
    const diff = Math.max(0, target - Date.now());
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  });

  useEffect(() => {
    const target = new Date(launchDateIso).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [launchDateIso]);

  useEffect(() => {
    if (!visible || jumping) {
      document.body.style.overflow = '';
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible, jumping]);

  const triggerJump = (targetRoute: PageRoute = 'home') => {
    if (jumping) return;
    setJumping(true);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    // Release shortly after initial tactile anticipation spring so underlying site jumps in smoothly
    window.setTimeout(
      () => {
        onEnterSite(targetRoute);
      },
      shouldReduceMotion ? 40 : 180,
    );
  };

  const blocks = [
    { label: 'Days', value: countdown.days, tilt: 'lg:[transform:rotateY(10deg)_rotateX(5deg)]' },
    { label: 'Hours', value: countdown.hours, tilt: 'lg:[transform:rotateY(3.5deg)_rotateX(5deg)]' },
    { label: 'Minutes', value: countdown.minutes, tilt: 'lg:[transform:rotateY(-3.5deg)_rotateX(5deg)]' },
    { label: 'Seconds', value: countdown.seconds, tilt: 'lg:[transform:rotateY(-10deg)_rotateX(5deg)]' },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="HelzerX Technologies Launch Countdown"
          initial={{ opacity: 1 }}
          animate={
            jumping
              ? shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0 }
              : { opacity: 1 }
          }
          exit={
            shouldReduceMotion
              ? { opacity: 0, transition: { duration: 0.2 } }
              : {
                  opacity: 0,
                  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                }
          }
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#07070A] text-white overflow-y-auto overflow-x-hidden px-5 py-8 sm:py-12"
        >
          {/* Ambient Overhead Studio Light Cone */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0"
            style={{
              background:
                'radial-gradient(68% 52% at 50% 18%, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.035) 48%, rgba(7,7,10,0) 78%), radial-gradient(50% 40% at 50% 85%, rgba(255,255,255,0.05) 0%, rgba(7,7,10,0) 72%)',
            }}
          />

          {/* Receding 3D Architectural Grid Floor */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 bottom-0 h-[44vh] overflow-hidden opacity-35"
          >
            <div
              className="w-full h-[180%] origin-top"
              style={{
                transform: 'perspective(720px) rotateX(68deg)',
                backgroundImage:
                  'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)',
                backgroundSize: '56px 56px',
                WebkitMaskImage:
                  'radial-gradient(ellipse 75% 70% at 50% 25%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
                maskImage:
                  'radial-gradient(ellipse 75% 70% at 50% 25%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
              }}
            />
          </div>

          {/* 3D Portal Jump Stage Wrapper */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20, scale: 0.96 }}
            animate={
              jumping
                ? shouldReduceMotion
                  ? { opacity: 0 }
                  : {
                      scale: [1, 0.94, 1.34],
                      y: [0, 12, -52],
                      rotateX: [0, -4, 14],
                      opacity: [1, 1, 0],
                    }
                : { opacity: 1, y: 0, scale: 1, rotateX: 0 }
            }
            transition={
              jumping
                ? {
                    duration: 0.62,
                    times: [0, 0.24, 1],
                    ease: [0.22, 1, 0.36, 1],
                  }
                : { duration: 0.65, ease: [0.16, 1, 0.3, 1] }
            }
            style={{ transformPerspective: 1200, transformStyle: 'preserve-3d' }}
            className="relative z-10 w-full max-w-[980px] mx-auto flex flex-col items-center text-center my-auto"
          >
            {/* Floating Sculpted 3D White Ceramic Brand Medallion */}
            <motion.div
              animate={
                shouldReduceMotion || jumping
                  ? undefined
                  : {
                      y: [-4, 4, -4],
                      rotateY: [-7, 7, -7],
                    }
              }
              transition={
                shouldReduceMotion
                  ? undefined
                  : { duration: 6.5, repeat: Infinity, ease: 'easeInOut' }
              }
              style={{ transformStyle: 'preserve-3d' }}
              className="mb-7 sm:mb-8 inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-b from-white via-[#F5F5F7] to-[#E2E2EC] shadow-[0_6px_0_#A1A1B0,0_11px_0_#7A7A89,0_26px_55px_rgba(0,0,0,0.68),inset_0_2px_0_rgba(255,255,255,1)]"
            >
              <img
                src={HELZERX_LOGO_URL}
                alt="HelzerX Technologies"
                className="h-6 sm:h-7 w-auto object-contain"
              />
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#0A0A0B]">
                helzerx.
              </span>
            </motion.div>

            {/* Quiet Unboxed Editorial Launch Line */}
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs font-medium text-neutral-400">
              <span className="text-white font-semibold">Global Launch Event</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span>January 1, 2027</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span>helzerx.cyou</span>
            </div>

            {/* Monumental 3D Metallic Launch Date Headline */}
            <h1
              className="mt-4 text-[clamp(2.85rem,9vw,6.25rem)] font-extrabold tracking-[-0.045em] leading-[0.94] tabular-nums select-none pb-2"
              style={{
                backgroundImage:
                  'linear-gradient(180deg, #FFFFFF 0%, #ECECF1 48%, #9D9DA9 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter:
                  'drop-shadow(0 4px 0 rgba(255,255,255,0.12)) drop-shadow(0 18px 34px rgba(0,0,0,0.85))',
              }}
            >
              01 · 01 · 2027
            </h1>

            <p className="mt-3 max-w-[54ch] text-sm sm:text-base text-neutral-400 leading-relaxed">
              The unified platform for Cloud Infrastructure, Creative Engineering Studio, and Hardware Commerce opens worldwide.
            </p>

            {/* Sculpted 3D Perspective Countdown Monoliths */}
            <div className="mt-8 sm:mt-10 w-full max-w-[780px] grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-5 [perspective:1200px]">
              {blocks.map((block) => (
                <div
                  key={block.label}
                  className={`relative rounded-2xl border border-white/[0.12] px-4 py-6 sm:py-7 text-center transition-none ${block.tilt}`}
                  style={{
                    background:
                      'linear-gradient(165deg, rgba(34,34,42,0.96) 0%, rgba(16,16,21,0.98) 65%, rgba(10,10,14,1) 100%)',
                    boxShadow:
                      '0 8px 0 -2px #262631, 0 15px 0 -5px #15151C, 0 36px 70px -12px rgba(0,0,0,0.85), inset 0 2px 0 0 rgba(255,255,255,0.2)',
                  }}
                >
                  <div className="text-4xl sm:text-5xl md:text-[3.4rem] font-extrabold tracking-tight text-white tabular-nums leading-none">
                    {String(block.value).padStart(2, '0')}
                  </div>
                  <div className="mt-2.5 text-[11px] sm:text-xs font-semibold tracking-wide text-neutral-400">
                    {block.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Tactile 3D Ceramic Primary CTA + Launch Registration Shortcut */}
            <div className="mt-10 sm:mt-11 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
              <button
                type="button"
                onClick={() => triggerJump('home')}
                disabled={jumping}
                className="group inline-flex items-center justify-center gap-3 px-9 py-4 rounded-2xl bg-gradient-to-b from-white via-[#F6F6F9] to-[#E3E3EC] text-[#0A0A0B] text-sm sm:text-base font-extrabold tracking-tight shadow-[0_6px_0_#9E9EAE,0_11px_0_#6B6B7B,0_24px_60px_rgba(255,255,255,0.18),inset_0_2px_0_rgba(255,255,255,1)] hover:from-white hover:to-[#EFEFF5] active:translate-y-[4px] active:shadow-[0_2px_0_#9E9EAE,0_10px_28px_rgba(255,255,255,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#07070A] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Go to Website</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => triggerJump('launch')}
                disabled={jumping}
                className="inline-flex items-center gap-1.5 px-4 py-3 text-xs sm:text-sm font-semibold text-neutral-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-lg"
              >
                <span>Claim 8GB Early Access Slot</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quiet Platform Launch Ledger Readout */}
            <p className="mt-7 text-xs text-neutral-500 tabular-nums">
              <span className="text-neutral-300 font-semibold">{totalPreorders} Pre-Orders Committed</span>
              <span aria-hidden="true" className="mx-2 text-neutral-700">·</span>
              <span>
                {spotsRemaining} of {earlyAccessLimit} First-50 Launch Allocations Open
              </span>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
