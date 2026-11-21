import { ArrowRight, Calendar, Globe, MessageSquare, Sparkles, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { PageRoute } from '../types/navigation';

interface CommunityPageProps {
  onNavigate: (route: PageRoute) => void;
}

export function CommunityPage({ onNavigate }: CommunityPageProps) {
  const { siteData } = useAppContext();
  const announcements = siteData?.announcements ?? [];
  const totalPreorders = siteData?.launch?.totalPreorders ?? 47;
  const qualified = siteData?.launch?.earlyAccessQualified ?? 0;

  return (
    <div className="bg-black text-white">
      <section className="relative overflow-hidden helzerx-hero-aura pt-20 pb-24 md:pt-28 md:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[440px] left-1/2 -translate-x-1/2 w-[165%] h-[540px] rounded-[100%] bg-black border-t border-violet-300/40 shadow-[0_-20px_80px_rgba(167,139,250,0.35)]"
        />

        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs md:text-sm font-medium text-violet-200/85 mb-6">
            <span>HelzerX Community</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Server Owners</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Developers &amp; Creators</span>
          </div>

          <h1 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-extrabold tracking-[-0.03em] leading-[1.04] text-white max-w-[18ch] mx-auto">
            Built With Global Builders
          </h1>
          <p className="mt-6 max-w-[58ch] mx-auto text-base md:text-lg leading-[1.6] text-neutral-200/90">
            Connect with infrastructure engineers, game network founders, Studio designers, and
            early-access members preparing for the January 1, 2027 launch.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('launch')}
              className="px-6 py-3 text-sm font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Join Launch 2027 Early Access
            </button>
            <button
              type="button"
              onClick={() => onNavigate('partners')}
              className="px-6 py-3 text-sm font-semibold text-white bg-white/[0.06] border border-white/15 rounded-lg hover:bg-white/[0.12] transition-colors cursor-pointer"
            >
              Explore Partner Program
            </button>
          </div>
        </div>
      </section>

      <section className="bg-black py-16 md:py-24">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            <div className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-7">
              <Users className="w-5 h-5 text-cyan-300" />
              <div className="mt-4 font-mono text-2xl font-bold text-white tabular-nums">
                {totalPreorders}+ Pre-Orders
              </div>
              <p className="mt-2 text-xs text-neutral-400">
                Active pre-launch community reservations tracked live across helzerx.cyou.
              </p>
            </div>
            <div className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-7">
              <Sparkles className="w-5 h-5 text-violet-300" />
              <div className="mt-4 font-mono text-2xl font-bold text-white tabular-nums">
                {qualified} / 50 Qualified
              </div>
              <p className="mt-2 text-xs text-neutral-400">
                Verified pre-launch members locked in for an 8GB RAM launch server on Jan 1, 2027.
              </p>
            </div>
            <div className="rounded-2xl bg-[#08080F] border border-white/[0.1] p-7">
              <Globe className="w-5 h-5 text-blue-300" />
              <div className="mt-4 font-mono text-2xl font-bold text-white">International</div>
              <p className="mt-2 text-xs text-neutral-400">
                Open engineering updates, partner commissions, and global creative collaboration.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-white">Community Bulletins &amp; Announcements</h2>
            <button
              type="button"
              onClick={() => onNavigate('blog')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-white cursor-pointer"
            >
              <span>Read Engineering Blog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {announcements.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-7"
              >
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="font-mono uppercase text-violet-300">{item.type}</span>
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{item.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-2xl bg-[#08080F] border border-white/[0.12] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                <MessageSquare className="w-4 h-4" />
                <span>DIRECT CHANNELS</span>
              </div>
              <h3 className="mt-2 text-xl font-bold text-white">Need Technical Assistance or Partnership?</h3>
              <p className="mt-1 text-sm text-neutral-400">
                Create a tracked support ticket or apply to join the HelzerX Staff &amp; Partner network.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('support')}
                className="px-5 py-2.5 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Support Center
              </button>
              <button
                type="button"
                onClick={() => onNavigate('careers')}
                className="px-5 py-2.5 text-xs font-semibold text-white border border-white/15 rounded-lg hover:border-white/30 transition-colors cursor-pointer"
              >
                Open Careers
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
