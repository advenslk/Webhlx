import { Surface3D } from '../components/Surface3D';
import { LEGAL_DOCUMENTS } from '../lib/platformData';
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
    <div className="bg-[#F4F4F5] text-[#0A0A0B]">
      <section className="relative overflow-hidden helzerx-studio-hero pt-14 pb-24 md:pt-20 md:pb-28">
        <div className="relative z-10 max-w-[940px] mx-auto px-6">
          {/* Policy Switcher Tabs */}
          <div
            role="tablist"
            aria-label="HelzerX Legal Documents"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white border border-black/[0.08] shadow-sm mb-10"
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
                      ? 'bg-[#0A0A0B] text-white'
                      : 'text-neutral-600 hover:text-[#0A0A0B] hover:bg-neutral-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <header className="pb-8 border-b border-black/[0.08]">
            <div className="text-xs font-semibold text-neutral-500">
              HelzerX Technologies · {doc.effectiveDate}
            </div>
            <h1 className="mt-3 text-[clamp(2.2rem,4.5vw,3.5rem)] font-extrabold tracking-[-0.04em] helzerx-dotted-text leading-[1.02] pb-1">
              {doc.title}
            </h1>
            <p className="mt-4 text-base leading-[1.65] text-neutral-600 max-w-[65ch]">
              {doc.subtitle}
            </p>
          </header>

          {/* Policy Reader Card */}
          <Surface3D intensity={3} className="mt-10">
            <div className="p-7 md:p-10 space-y-10">
              {doc.sections.map((sec) => (
                <section key={sec.id} id={sec.id} className="space-y-3">
                  <h2 className="text-lg font-bold text-[#0A0A0B] tracking-tight">{sec.heading}</h2>
                  {sec.paragraphs.map((para, idx) => (
                    <p key={idx} className="text-sm md:text-base leading-[1.7] text-neutral-700">
                      {para}
                    </p>
                  ))}
                </section>
              ))}
            </div>
          </Surface3D>

          {/* Bottom Legal Contact Callout */}
          <div className="mt-12 pt-8 border-t border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-neutral-600">
              Questions regarding these terms? Reach our compliance team at{' '}
              <span className="font-semibold text-[#0A0A0B]">legal@helzerx.cyou</span>.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Contact HelzerX
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
