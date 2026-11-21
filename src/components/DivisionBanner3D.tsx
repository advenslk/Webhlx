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
 * Full-Bleed Top-to-Bottom Smooth Division Banner:
 * - Image fills the obsidian black hero stage completely edge-to-edge from top-0 with zero text overlapping the artwork
 * - Smooth multi-stop bottom gradient melts organically from the dark banner straight into the #F4F4F5 light studio ground
 * - Division label, description, and actions sit cleanly below the banner melt above the 4 aligned 3D spec cards
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
      {/* Edge-to-Edge Top Obsidian Artwork Stage Melting Smoothly Downward into #F4F4F5 */}
      <div className="relative w-full overflow-hidden bg-[#09090B] h-[250px] sm:h-[320px] md:h-[380px] lg:h-[410px]">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full h-full max-w-[1360px] mx-auto pointer-events-none select-none"
        >
          {imgFailed ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
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
              className="w-full h-full object-cover object-center"
            />
          )}

          {/* Subtle horizontal feather on ultra-wide screens (>1360px) so sides melt cleanly into #09090B */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#09090B] to-transparent hidden xl:block"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#09090B] to-transparent hidden xl:block"
          />
        </motion.div>

        {/* Silky Top-to-Bottom Gradient Melt transitioning directly into #F4F4F5 ground */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 sm:h-40 bg-gradient-to-t from-[#F4F4F5] via-[#F4F4F5]/75 via-28% to-transparent"
        />
      </div>

      {/* Division Label, Description & Action Buttons positioned cleanly BELOW the banner */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 max-w-[860px] mx-auto px-6 -mt-4 sm:-mt-6 text-center"
      >
        <div className="text-xs font-semibold text-neutral-500">{divisionLabel}</div>
        <p className="mt-3 max-w-[62ch] mx-auto text-sm sm:text-base leading-[1.65] text-neutral-700">
          {description}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">{actions}</div>
      </motion.div>

      {/* 4 Aligned Sculptural 3D Spec Cards */}
      <div className="relative z-20 max-w-[1160px] mx-auto px-6 mt-10 sm:mt-12">
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
