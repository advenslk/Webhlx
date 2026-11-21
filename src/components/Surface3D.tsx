import { motion, useReducedMotion } from 'motion/react';
import { type ReactNode } from 'react';

interface Surface3DProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  variant?: 'light' | 'dark';
  delay?: number;
}

/**
 * Tactile Static-Poise 3D Architectural Card Surface:
 * - Physical stepped bottom bevel lip, inner directional rim lighting & deep studio contact shadows
 * - Zero cursor/touch tilt, jitter, or hover displacement for crisp, steady reading and interaction
 * - Subtle one-time scroll-reveal entrance
 */
export function Surface3D({
  children,
  className = '',
  variant = 'light',
  delay = 0,
}: Surface3DProps) {
  const shouldReduceMotion = useReducedMotion();

  const surfaceClasses =
    variant === 'dark'
      ? 'helzerx-studio-card-dark text-white border border-white/[0.14] hover:border-white/28'
      : 'helzerx-studio-card text-[#0A0A0B] border border-black/[0.08] hover:border-black/[0.16]';

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.42, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative rounded-[22px] overflow-hidden transition-[border-color,box-shadow] duration-200 ${surfaceClasses} ${className}`}
    >
      {/* Top brushed specular bevel rim */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-[1.5px] z-20 ${
          variant === 'dark'
            ? 'bg-gradient-to-r from-transparent via-white/40 to-transparent'
            : 'bg-gradient-to-r from-transparent via-white to-transparent'
        }`}
      />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}
