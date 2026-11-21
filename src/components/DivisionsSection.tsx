import { ArrowUpRight, Cloud, Layers, ShoppingBag } from 'lucide-react';
import { DIVISIONS, DivisionId } from '../data/helzerxData';
import { PageRoute } from '../types/navigation';

interface DivisionsSectionProps {
  activeDivision: DivisionId;
  onSelectDivision: (division: DivisionId) => void;
  onOpenDivisionPage: (route: PageRoute, division: DivisionId) => void;
}

function DivisionIcon({ id }: { id: DivisionId }) {
  switch (id) {
    case 'cloud':
      return <Cloud className="w-5 h-5 text-black" strokeWidth={2} />;
    case 'shop':
      return <ShoppingBag className="w-5 h-5 text-black" strokeWidth={2} />;
    case 'studio':
      return <Layers className="w-5 h-5 text-black" strokeWidth={2} />;
  }
}

export function DivisionsSection({
  activeDivision,
  onSelectDivision,
  onOpenDivisionPage,
}: DivisionsSectionProps) {
  return (
    <section id="divisions" className="bg-black py-20 md:py-28">
      <div className="max-w-[1160px] mx-auto px-6">
        {/* Centered Editorial Heading matching reference layout */}
        <div className="max-w-[660px] mx-auto text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight text-white leading-[1.12]">
            Everything you need to build and scale
          </h2>
          <p className="mt-4 text-base md:text-lg leading-[1.6] text-neutral-400">
            Three specialized divisions operating under one engineering standard—from bare-metal
            cloud clusters and curated hardware to custom digital products.
          </p>
        </div>

        {/* Three Division Cards */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {DIVISIONS.map((division, index) => {
            const isSelected = activeDivision === division.id;
            const numPrefix = `0${index + 1}.`;

            return (
              <article
                key={division.id}
                className={`group relative flex flex-col justify-between rounded-2xl p-8 transition-colors duration-200 border ${
                  isSelected
                    ? 'bg-[#0D0A18] border-violet-400/50 shadow-[0_0_40px_rgba(124,58,237,0.16)]'
                    : 'bg-[#08080C] border-white/[0.1] hover:border-white/25'
                }`}
              >
                <div>
                  {/* Crisp White Rounded Square Icon matching reference cards */}
                  <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-[0_6px_20px_rgba(255,255,255,0.12)] mx-auto lg:mx-0">
                    <DivisionIcon id={division.id} />
                  </div>

                  {/* Clean editorial numbering + division title */}
                  <div className="mt-6 text-center lg:text-left">
                    <h3 className="text-xl font-bold tracking-tight text-white">
                      <span className="text-violet-300/80 font-mono text-sm mr-2 tabular-nums">
                        {numPrefix}
                      </span>
                      {division.name}
                    </h3>
                    <p className="mt-2.5 text-sm font-medium text-neutral-200 leading-snug">
                      {division.headline}
                    </p>
                    <p className="mt-3 text-sm leading-[1.6] text-neutral-400">
                      {division.description}
                    </p>
                  </div>
                </div>

                <div className="mt-7 pt-5 border-t border-white/[0.08] flex flex-col gap-4">
                  {/* Unboxed metadata with subtle dot separators (Zero-Pill Discipline) */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-2 gap-y-1 text-xs text-neutral-400 tabular-nums">
                    {division.highlights.map((item, idx) => (
                      <span key={item} className="inline-flex items-center gap-2">
                        <span>{item}</span>
                        {idx < division.highlights.length - 1 && (
                          <span aria-hidden="true" className="text-neutral-600">
                            ·
                          </span>
                        )}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onSelectDivision(division.id)}
                      className="text-xs font-medium text-violet-300 hover:text-violet-200 transition-colors cursor-pointer text-left tabular-nums"
                    >
                      {division.metricLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenDivisionPage(division.id, division.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-violet-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded px-1 py-0.5"
                    >
                      <span>Open {division.shortName}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
