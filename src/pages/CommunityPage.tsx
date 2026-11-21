import { ArrowRight, Calendar, Globe, MessageSquare, Sparkles, Users } from 'lucide-react';
import { Surface3D } from '../components/Surface3D';
import { useAppContext } from '../context/AppContext';
import { PageRoute } from '../types/navigation';

interface CommunityPageProps {
  onNavigate: (route: PageRoute) => void;
}

export function CommunityPage({ onNavigate }: CommunityPageProps) {
  const { siteData } = useAppContext();
  const announcements = siteData?.announcements ?? [];
  const totalPreorders = siteData?.launch?.totalPreorders ?? 0;
  const qualified = siteData?.launch?.earlyAccessQualified ?? 0;

  return (
    <div className="bg-[#F4F4F5] text-[#0A0A0B]">
      <section className="relative overflow-hidden helzerx-studio-hero pt-16 pb-20 md:pt-24 md:pb-24 border-b border-black/[0.06]">
        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs font-medium text-neutral-600 mb-6">
            <span className="font-semibold text-[#0A0A0B]">HelzerX Community</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>Server Owners</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>Developers &amp; Creators</span>
          </div>

          <h1 className="text-[clamp(2.6rem,6vw,4.75rem)] font-extrabold tracking-[-0.04em] leading-[0.98] helzerx-dotted-text max-w-[16ch] mx-auto pb-2">
            built with builders.
          </h1>
          <p className="mt-6 max-w-[58ch] mx-auto text-base md:text-lg leading-[1.65] text-neutral-600">
            Connect with infrastructure engineers, game network founders, Studio designers, and
            early-access members preparing for the January 1, 2027 launch.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('launch')}
              className="px-6 py-3 text-sm font-semibold text-white bg-[#0A0A0B] rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer shadow-[0_10px_24px_rgba(10,10,11,0.18)]"
            >
              Join Launch 2027 Early Access
            </button>
            <button
              type="button"
              onClick={() => onNavigate('partners')}
              className="px-6 py-3 text-sm font-semibold text-[#0A0A0B] bg-white border border-black/15 rounded-xl hover:border-black/35 transition-colors cursor-pointer shadow-sm"
            >
              Explore Partner Program
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#F4F4F5] py-16 md:py-24">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            <Surface3D intensity={13} delay={0.04}>
              <div className="p-7 h-full">
                <div className="w-11 h-11 rounded-2xl bg-[#111114] text-white flex items-center justify-center shadow-[0_10px_20px_rgba(10,10,11,0.22)]">
                  <Users className="w-5 h-5" />
                </div>
                <div className="mt-5 text-2xl font-extrabold tracking-tight text-[#0A0A0B] tabular-nums">
                  {totalPreorders}+ Pre-Orders
                </div>
                <p className="mt-2 text-xs text-neutral-600">
                  Active pre-launch community reservations tracked live across helzerx.cyou.
                </p>
              </div>
            </Surface3D>
            <Surface3D intensity={13} delay={0.1}>
              <div className="p-7 h-full">
                <div className="w-11 h-11 rounded-2xl bg-[#111114] text-white flex items-center justify-center shadow-[0_10px_20px_rgba(10,10,11,0.22)]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="mt-5 text-2xl font-extrabold tracking-tight text-[#0A0A0B] tabular-nums">
                  {qualified} / 50 Qualified
                </div>
                <p className="mt-2 text-xs text-neutral-600">
                  Verified pre-launch members locked in for an 8GB RAM launch server on Jan 1, 2027.
                </p>
              </div>
            </Surface3D>
            <Surface3D intensity={13} delay={0.16}>
              <div className="p-7 h-full">
                <div className="w-11 h-11 rounded-2xl bg-[#111114] text-white flex items-center justify-center shadow-[0_10px_20px_rgba(10,10,11,0.22)]">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="mt-5 text-2xl font-extrabold tracking-tight text-[#0A0A0B]">
                  International
                </div>
                <p className="mt-2 text-xs text-neutral-600">
                  Open engineering updates, partner commissions, and global creative collaboration.
                </p>
              </div>
            </Surface3D>
          </div>

          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-extrabold text-[#0A0A0B] tracking-tight">
              Community Bulletins &amp; Announcements
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('blog')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A0A0B] hover:text-neutral-600 cursor-pointer"
            >
              <span>Read Engineering Blog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {announcements.map((item, idx) => (
              <Surface3D key={item.id} intensity={11} delay={idx * 0.05}>
                <article className="p-7 h-full">
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span className="font-semibold capitalize text-[#0A0A0B]">{item.type}</span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-[#0A0A0B]">{item.title}</h3>
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{item.body}</p>
                </article>
              </Surface3D>
            ))}
          </div>

          <Surface3D variant="dark" intensity={8} className="mt-12 rounded-3xl">
            <div className="p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-300">
                  <MessageSquare className="w-4 h-4 text-white" />
                  <span>Direct Channels</span>
                </div>
                <h3 className="mt-2 text-xl font-bold text-white">
                  Need Technical Assistance or Partnership?
                </h3>
                <p className="mt-1 text-sm text-neutral-300">
                  Create a tracked support ticket or apply to join the HelzerX Staff &amp; Partner
                  network.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate('support')}
                  className="px-5 py-2.5 text-xs font-bold text-[#0A0A0B] bg-white rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  Support Center
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('careers')}
                  className="px-5 py-2.5 text-xs font-semibold text-white border border-white/25 rounded-lg hover:border-white/50 transition-colors cursor-pointer"
                >
                  Open Careers
                </button>
              </div>
            </div>
          </Surface3D>
        </div>
      </section>
    </div>
  );
}
