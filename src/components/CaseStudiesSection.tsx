import { CASE_STUDIES } from '../data/helzerxData';

export function CaseStudiesSection() {
  return (
    <section id="proof" className="bg-black py-20 md:py-28 border-t border-white/[0.06]">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="max-w-[660px] mx-auto text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight text-white leading-[1.12]">
            Proven across production deployments
          </h2>
          <p className="mt-4 text-base md:text-lg leading-[1.6] text-neutral-400">
            Measurable outcomes delivered by HelzerX Cloud, Shop, and Studio for engineering,
            robotics, and B2B commerce organizations.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {CASE_STUDIES.map((study) => (
            <article
              key={study.id}
              className="flex flex-col justify-between rounded-2xl bg-[#08080C] border border-white/[0.1] p-8"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
                  <span className="text-violet-300">{study.division}</span>
                  <span aria-hidden="true" className="text-neutral-600">
                    ·
                  </span>
                  <span>{study.client}</span>
                </div>

                <p className="mt-4 text-2xl font-bold tracking-tight text-white tabular-nums">
                  {study.metric}
                </p>

                <p className="mt-3 text-sm leading-[1.6] text-neutral-400">{study.summary}</p>
              </div>

              <blockquote className="mt-7 pt-5 border-t border-white/[0.08]">
                <p className="text-sm leading-[1.6] text-neutral-200">“{study.quote}”</p>
                <footer className="mt-3 text-xs text-neutral-400">
                  <span className="font-semibold text-neutral-200">{study.author}</span>
                  <span aria-hidden="true" className="mx-1.5 text-neutral-600">
                    ·
                  </span>
                  <span>{study.role}</span>
                </footer>
              </blockquote>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
