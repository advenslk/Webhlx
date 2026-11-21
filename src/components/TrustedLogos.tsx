import { PARTNER_LOGOS } from '../data/helzerxData';

function PartnerGlyph({ shape }: { shape: (typeof PARTNER_LOGOS)[number]['shape'] }) {
  switch (shape) {
    case 'prism':
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M9 2L16 14H2L9 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case 'grid':
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <rect x="2.5" y="2.5" width="5" height="5" rx="1" fill="currentColor" />
          <rect x="10.5" y="2.5" width="5" height="5" rx="1" fill="currentColor" fillOpacity="0.5" />
          <rect x="2.5" y="10.5" width="5" height="5" rx="1" fill="currentColor" fillOpacity="0.5" />
          <rect x="10.5" y="10.5" width="5" height="5" rx="1" fill="currentColor" />
        </svg>
      );
    case 'cross':
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'pulse':
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M2 9H5.5L7.5 4L10.5 14L12.5 9H16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'hex':
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M9 2L15 5.5V12.5L9 16L3 12.5V5.5L9 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case 'star':
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M9 2V16M2 9H16M4.2 4.2L13.8 13.8M13.8 4.2L4.2 13.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

export function TrustedLogos() {
  return (
    <section aria-label="Trusted partners" className="bg-black pt-6 pb-20 md:pb-24">
      <div className="max-w-[1120px] mx-auto px-6 text-center">
        <p className="text-xs font-medium text-neutral-500 tracking-wide">
          Trusted by forward-thinking engineering and retail teams
        </p>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-6 gap-x-8 items-center justify-items-center">
          {PARTNER_LOGOS.map((partner) => (
            <div
              key={partner.name}
              className="flex items-center gap-2.5 text-neutral-400/80 hover:text-neutral-200 transition-colors"
            >
              <PartnerGlyph shape={partner.shape} />
              <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
