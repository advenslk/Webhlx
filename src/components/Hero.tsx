import { ArrowRight } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
  onExploreDivisions: () => void;
}

export function Hero({ onGetStarted, onExploreDivisions }: HeroProps) {
  return (
    <section
      id="top"
      className="relative overflow-hidden helzerx-hero-aura pt-20 pb-36 md:pt-28 md:pb-48"
    >
      {/* Subtle atmospheric star/grain sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(139,92,246,0.14),transparent_58%)]"
      />

      {/* Curved planetary black horizon mask at the bottom of the hero matching the reference */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[420px] md:-bottom-[520px] left-1/2 -translate-x-1/2 w-[180%] md:w-[155%] h-[540px] md:h-[650px] rounded-[100%] bg-black border-t border-violet-300/45 shadow-[0_-24px_90px_rgba(167,139,250,0.45)]"
      />

      <div className="relative z-10 max-w-[1120px] mx-auto px-6 flex flex-col items-center text-center">
        {/* Clean unboxed division metadata line (Zero-Pill Discipline) */}
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs md:text-sm font-medium text-violet-200/85 mb-8">
          <span>HelzerX Technologies</span>
          <span aria-hidden="true" className="text-violet-400/60">·</span>
          <span>Cloud</span>
          <span aria-hidden="true" className="text-violet-400/60">·</span>
          <span>Shop</span>
          <span aria-hidden="true" className="text-violet-400/60">·</span>
          <span>Studio</span>
          <span aria-hidden="true" className="text-violet-400/60">·</span>
          <button
            type="button"
            onClick={onExploreDivisions}
            className="inline-flex items-center gap-1 text-white hover:text-violet-200 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded"
          >
            <span>Explore divisions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hero Headline flanked by bespoke 3D-shaded purple sculptural accents */}
        <div className="relative w-full max-w-[920px] mx-auto flex items-center justify-center">
          {/* Left 3D Violet Prism Pointer */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute -left-8 xl:-left-12 top-1/2 -translate-y-1/2 w-36 h-36 select-none pointer-events-none drop-shadow-[0_24px_38px_rgba(20,5,55,0.65)]"
          >
            <svg viewBox="0 0 180 180" fill="none" className="w-full h-full">
              <defs>
                <linearGradient id="hxPrismTop" x1="25" y1="30" x2="145" y2="110" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#DDD6FE" />
                  <stop offset="55%" stopColor="#A78BFA" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
                <linearGradient id="hxPrismSide" x1="30" y1="90" x2="130" y2="150" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#4C1D95" />
                </linearGradient>
              </defs>
              <g transform="rotate(-14 90 90)">
                <path
                  d="M28 86L134 36C141 33 147 40 144 47L105 144C102 151 92 152 87 145L69 116L33 102C25 99 23 89 28 86Z"
                  fill="url(#hxPrismSide)"
                />
                <path
                  d="M32 80L136 32C142 29 147 35 143 41L99 135C96 141 88 141 84 135L68 108L34 95C27 92 26 83 32 80Z"
                  fill="url(#hxPrismTop)"
                  stroke="#EDE9FE"
                  strokeOpacity="0.45"
                  strokeWidth="1.5"
                />
                <path
                  d="M72 104L137 37"
                  stroke="#F5F3FF"
                  strokeOpacity="0.35"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            </svg>
          </div>

          <h1 className="text-[clamp(2.85rem,7vw,5.5rem)] font-extrabold tracking-[-0.035em] leading-[0.98] text-white max-w-[14ch] mx-auto">
            One Core. Infinite Scale.
          </h1>

          {/* Right 3D Violet Isometric Console Cube */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute -right-8 xl:-right-12 -top-2 w-40 h-40 select-none pointer-events-none drop-shadow-[0_26px_42px_rgba(20,5,55,0.68)]"
          >
            <svg viewBox="0 0 180 180" fill="none" className="w-full h-full">
              <defs>
                <linearGradient id="hxCubeFront" x1="40" y1="30" x2="145" y2="140" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#E9D5FF" />
                  <stop offset="48%" stopColor="#A855F7" />
                  <stop offset="100%" stopColor="#6D28D9" />
                </linearGradient>
                <linearGradient id="hxCubeDepth" x1="25" y1="60" x2="135" y2="155" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#3B0764" />
                </linearGradient>
              </defs>
              <g transform="rotate(9 90 90)">
                <rect
                  x="30"
                  y="36"
                  width="112"
                  height="96"
                  rx="24"
                  fill="url(#hxCubeDepth)"
                  transform="translate(-10 10)"
                />
                <rect
                  x="34"
                  y="34"
                  width="112"
                  height="96"
                  rx="24"
                  fill="url(#hxCubeFront)"
                  stroke="#F3E8FF"
                  strokeOpacity="0.5"
                  strokeWidth="1.5"
                />
                <path
                  d="M66 64L114 102M114 64L66 102"
                  stroke="#FAF5FF"
                  strokeOpacity="0.55"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </g>
            </svg>
          </div>
        </div>

        {/* Concrete Value Proposition */}
        <p className="mt-7 max-w-[56ch] text-base md:text-lg leading-[1.6] text-neutral-200/90 font-normal">
          HelzerX Technologies unites enterprise cloud infrastructure, curated hardware &amp; digital
          commerce, and full-cycle product engineering in one cohesive ecosystem.
        </p>

        {/* Uniquely Primary CTA */}
        <div className="mt-9 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={onGetStarted}
            className="px-6 py-3 text-sm font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors duration-150 shadow-[0_8px_30px_rgba(255,255,255,0.18)] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            Get started
          </button>
        </div>
      </div>
    </section>
  );
}
