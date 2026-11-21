import { motion, useReducedMotion } from 'motion/react';

const HELZERX_LOGO_URL = '/assets/aistudio/IMG_20261011_201132-removebg-preview_9b5f47c8.png';
const EXTRUSION_SLICES = 18;
const DEPTH_SPAN_PX = 24;

/**
 * Sculptural 3D Animated HelzerX Emblem Centerpiece
 *
 * - Extrudes the official HelzerX brand mark along Z-depth using stacked dimensional planes
 *   so angled rotation exposes solid brushed-graphite & obsidian 3D wall thickness
 * - Adds a masked studio specular light sweep strictly across the glyph silhouette
 * - Grounded by a synchronized breathing studio contact shadow on the hero canvas
 * - No cursor jitter or touch displacement; pure smooth studio loop respecting prefers-reduced-motion
 */
export function ThreeCoreBackdrop() {
  const shouldReduceMotion = useReducedMotion();

  const sliceIndices = Array.from({ length: EXTRUSION_SLICES }, (_, idx) => idx);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative w-full h-full flex flex-col items-center justify-center select-none [perspective:1150px]"
    >
      {/* Soft Neutral Studio Ambient Halo Behind Emblem */}
      <div
        className="absolute w-[320px] sm:w-[400px] h-[220px] sm:h-[260px] rounded-full opacity-75 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at center, rgba(255,255,255,0.95) 0%, rgba(228,228,231,0.45) 55%, rgba(244,244,245,0) 80%)',
        }}
      />

      {/* Sculpted 3D Rotating & Levitating Logo Monolith */}
      <motion.div
        initial={
          shouldReduceMotion
            ? { rotateY: -12, rotateX: 10, rotateZ: -1, y: 0 }
            : { opacity: 0, scale: 0.92, rotateY: -18, rotateX: 12, y: 12 }
        }
        animate={
          shouldReduceMotion
            ? { opacity: 1, scale: 1, rotateY: -12, rotateX: 10, rotateZ: -1, y: 0 }
            : {
                opacity: 1,
                scale: 1,
                rotateY: [-19, 19, -19],
                rotateX: [9, 15, 9],
                rotateZ: [-1.4, 1.4, -1.4],
                y: [-8, 7, -8],
              }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.5 }
            : {
                opacity: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
                scale: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
                rotateY: { duration: 11, repeat: Infinity, ease: 'easeInOut' },
                rotateX: { duration: 7.5, repeat: Infinity, ease: 'easeInOut' },
                rotateZ: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
                y: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' },
              }
        }
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-[220px] sm:w-[275px] md:w-[310px] aspect-[1.58/1] flex items-center justify-center"
      >
        {/* Multi-Slice 3D Extruded Body (Back -> Front) */}
        {sliceIndices.map((idx) => {
          const progress = idx / (EXTRUSION_SLICES - 1); // 0 (back) -> 1 (front)
          const zOffset = -DEPTH_SPAN_PX / 2 + progress * DEPTH_SPAN_PX;
          const isFront = idx === EXTRUSION_SLICES - 1;
          const isBack = idx === 0;

          // Side extrusion walls get slightly lighter brushed-graphite / titanium edge values
          // so the 3D thickness reads unmistakably against the studio backdrop
          const filterValue = isFront
            ? 'contrast(1.06)'
            : isBack
              ? 'brightness(1.85) opacity(0.65)'
              : progress < 0.35
                ? 'brightness(2.35) contrast(0.9)'
                : progress < 0.72
                  ? 'brightness(2.85) contrast(0.88)'
                  : 'brightness(1.6) contrast(0.95)';

          return (
            <img
              key={idx}
              src={HELZERX_LOGO_URL}
              alt=""
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{
                transform: `translateZ(${zOffset.toFixed(2)}px)`,
                filter: filterValue,
              }}
            />
          );
        })}

        {/* Masked Studio Specular Gloss Highlight Strictly Clipped to Logo Silhouette */}
        <motion.div
          animate={
            shouldReduceMotion
              ? { backgroundPosition: '50% 50%' }
              : { backgroundPosition: ['-140% 0%', '220% 0%', '-140% 0%'] }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 8, repeat: Infinity, ease: 'easeInOut' }
          }
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translateZ(${(DEPTH_SPAN_PX / 2 + 0.6).toFixed(2)}px)`,
            WebkitMaskImage: `url(${HELZERX_LOGO_URL})`,
            maskImage: `url(${HELZERX_LOGO_URL})`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            backgroundImage:
              'linear-gradient(112deg, rgba(255,255,255,0) 28%, rgba(255,255,255,0.22) 48%, rgba(255,255,255,0.06) 56%, rgba(255,255,255,0) 70%)',
            backgroundSize: '210% 100%',
          }}
        />
      </motion.div>

      {/* Synchronized Studio Contact Shadow Beneath Levitating Emblem */}
      <motion.div
        animate={
          shouldReduceMotion
            ? { scaleX: 1, opacity: 0.9 }
            : {
                scaleX: [0.92, 1.06, 0.92],
                opacity: [0.68, 0.95, 0.68],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 5.5, repeat: Infinity, ease: 'easeInOut' }
        }
        className="mt-7 sm:mt-8 w-[210px] sm:w-[270px] h-7 rounded-full blur-md"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(10,10,14,0.34) 0%, rgba(10,10,14,0.14) 48%, rgba(10,10,14,0) 76%)',
        }}
      />
    </div>
  );
}
