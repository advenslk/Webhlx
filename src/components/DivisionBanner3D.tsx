import { motion, useReducedMotion } from 'motion/react';
import { type ReactNode, useState } from 'react';
import { Surface3D } from './Surface3D';

interface DivisionBanner3DProps {
  imageSrc: string;
  imageAlt: string;
  divisionLabel: string;
  description: string;
  fallbackTitle: string;
  fallbackSubtitle: string;
  icon: ReactNode;
  actions: ReactNode;
  specs: { value: string; label: string; detail: string }[];
}

/**
 * Seamless Edge-to-Bottom Smooth 3D Division Banner Stage:
 * - Compact hero height starting directly from top edge with soft elliptical masking so zero box edges appear
 * - Multi-stop smooth downward fade melting directly into the #F4F4F5 studio ground
 * - Stationary, rock-solid under mouse and touch
 */
export function DivisionBanner3D({
  imageSrc,
  imageAlt,
  divisionLabel,
  description,
  fallbackTitle,
  fallbackSubtitle,
  icon,
  actions,
  specs,
}: DivisionBanner3DProps) {
  const shouldReduceMotion = useReducedMotion();
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section className="relative bg-[#F4F4F5] pb-12 md:pb-16">
      {/* Seamless Atmospheric Banner Stage */}
      <div className="relative overflow-hidden bg-[#09090B] pt-5 pb-20 sm:pb-24 flex flex-col items-center">
        {/* Top Quiet Division Label */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 max-w-[1160px] mx-auto w-full px-6 text-center"
        >
          <span className="text-xs font-medium tracking-wide text-neutral-400">
            {divisionLabel}
          </span>
        </motion.div>

        {/* Compact Seamless Artwork Stage with Soft Edge Fade */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 mt-2 w-full max-w-[700px] h-[175px] sm:h-[210px] md:h-[235px] px-4 pointer-events-none select-none flex items-center justify-center"
        >
          {imgFailed ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-3">
                {icon}
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
                {fallbackTitle}
              </h1>
              <p className="mt-1.5 text-xs text-neutral-400 max-w-md">{fallbackSubtitle}</p>
            </div>
          ) : (
            <img
              src={imageSrc}
              alt={imageAlt}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="max-w-full max-h-full w-auto h-full object-contain object-center [mask-image:radial-gradient(ellipse_78%_78%_at_50%_48%,black_58%,transparent_100%)]"
            />
          )}
        </motion.div>

        {/* Multi-Stop Downward Smooth Melt into #F4F4F5 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 sm:h-36 bg-gradient-to-t from-[#F4F4F5] via-[#09090B]/70 via-35% to-transparent"
        />

        {/* Compact Description + Action Horizon */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 max-w-[820px] mx-auto w-full px-6 mt-1 text-center"
        >
          <p className="max-w-[58ch] mx-auto text-sm sm:text-base leading-[1.6] text-neutral-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
            {description}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3.5">{actions}</div>
        </motion.div>
      </div>

      {/* 4 Aligned High-Depth Sculptural 3D Spec Cards */}
      <div className="relative z-20 max-w-[1160px] mx-auto px-6 -mt-12 sm:-mt-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {specs.map((spec, idx) => (
            <Surface3D key={spec.label} delay={idx * 0.05}>
              <div className="p-6 h-full flex flex-col justify-between text-left">
                <div>
                  <div className="text-2xl sm:text-[1.65rem] font-extrabold text-[#0A0A0B] tracking-tight tabular-nums">
                    {spec.value}
                  </div>
                  <div className="mt-1.5 text-sm font-bold text-[#0A0A0B]">{spec.label}</div>
                </div>
                <p className="mt-3 text-xs text-neutral-600 leading-relaxed">{spec.detail}</p>
              </div>
            </Surface3D>
          ))}
        </div>
      </div>
    </section>
  );
}
