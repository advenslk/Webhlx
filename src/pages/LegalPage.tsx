import { LEGAL_DOCUMENTS } from '../data/helzerxPagesData';
import { PageRoute } from '../types/navigation';

interface LegalPageProps {
  docKey: 'terms' | 'privacy' | 'sla';
  onNavigate: (route: PageRoute) => void;
}

const LEGAL_TABS: { key: 'terms' | 'privacy' | 'sla'; label: string }[] = [
  { key: 'terms', label: 'Terms of Service' },
  { key: 'privacy', label: 'Privacy Policy' },
  { key: 'sla', label: 'SLA & Refund Policy' },
];

export function LegalPage({ docKey, onNavigate }: LegalPageProps) {
  const doc = LEGAL_DOCUMENTS[docKey];

  return (
    <div className="bg-black text-white">
      <section className="relative overflow-hidden bg-black pt-16 pb-24 md:pt-24 md:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(65%_70%_at_50%_0%,rgba(109,40,217,0.22),transparent_80%)]"
        />

        <div className="relative z-10 max-w-[920px] mx-auto px-6">
          {/* Policy Switcher Tabs */}
          <div
            role="tablist"
            aria-label="HelzerX Legal Documents"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white/[0.05] border border-white/[0.1] mb-10"
          >
            {LEGAL_TABS.map((tab) => {
              const active = docKey === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onNavigate(tab.key)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-white text-black'
                      : 'text-neutral-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <header className="pb-8 border-b border-white/[0.1]">
            <div className="text-xs font-medium text-violet-300">
              HelzerX Technologies · {doc.effectiveDate}
            </div>
            <h1 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight text-white">
              {doc.title}
            </h1>
            <p className="mt-4 text-base leading-[1.6] text-neutral-400 max-w-[65ch]">
              {doc.subtitle}
            </p>
          </header>

          {/* Sections */}
          <div className="mt-10 space-y-10">
            {doc.sections.map((sec) => (
              <section key={sec.id} id={sec.id} className="space-y-3">
                <h2 className="text-lg font-bold text-white tracking-tight">{sec.heading}</h2>
                {sec.paragraphs.map((para, idx) => (
                  <p key={idx} className="text-sm md:text-base leading-[1.7] text-neutral-300">
                    {para}
                  </p>
                ))}
              </section>
            ))}
          </div>

          {/* Bottom Legal Contact Callout */}
          <div className="mt-14 pt-8 border-t border-white/[0.1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-neutral-400">
              Questions regarding these terms? Reach our compliance team at{' '}
              <span className="font-mono text-neutral-200">legal@helzerx.cyou</span>.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="px-5 py-2.5 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Contact HelzerX
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
