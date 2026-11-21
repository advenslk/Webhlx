import { ArrowRight, Globe, Mail, Server } from 'lucide-react';
import { ContactSection } from '../components/ContactSection';
import { useAppContext } from '../context/AppContext';
import { DivisionId } from '../data/helzerxData';
import { PageRoute } from '../types/navigation';

interface ContactPageProps {
  selectedDivision: DivisionId;
  onNavigate?: (route: PageRoute) => void;
}

export function ContactPage({ selectedDivision, onNavigate }: ContactPageProps) {
  const { siteData } = useAppContext();
  const general = siteData?.settings?.general;
  const supportEmail = general?.supportEmail || 'support@helzerx.cyou';
  const salesEmail = general?.salesEmail || 'hello@helzerx.cyou';

  return (
    <div className="bg-black text-white">
      <section className="relative overflow-hidden helzerx-hero-aura pt-16 pb-16 md:pt-24 md:pb-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[440px] left-1/2 -translate-x-1/2 w-[165%] h-[540px] rounded-[100%] bg-black border-t border-violet-300/40 shadow-[0_-20px_80px_rgba(167,139,250,0.35)]"
        />
        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs md:text-sm font-medium text-violet-200/85 mb-5">
            <span>HelzerX Technologies</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>helzerx.cyou</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Global Enterprise Desk</span>
          </div>
          <h1 className="text-[clamp(2.4rem,5vw,4rem)] font-extrabold tracking-[-0.03em] leading-[1.05] text-white">
            Contact Engineering &amp; Sales
          </h1>
          <p className="mt-5 max-w-[56ch] mx-auto text-base md:text-lg text-neutral-300">
            Reach our infrastructure, hardware procurement, and product studio leads directly or
            open a technical support ticket.
          </p>
        </div>
      </section>

      <section className="bg-black pt-10 pb-4">
        <div className="max-w-[1040px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6">
            <div className="flex items-center gap-2.5 text-sm font-bold text-white">
              <Mail className="w-4 h-4 text-violet-300" />
              <span>Enterprise &amp; Sales</span>
            </div>
            <p className="mt-2 text-xs font-mono text-neutral-300">{salesEmail}</p>
            <p className="mt-2 text-xs text-neutral-500">Custom clusters, bulk Shop orders, Studio scopes</p>
          </div>

          <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6">
            <div className="flex items-center gap-2.5 text-sm font-bold text-white">
              <Server className="w-4 h-4 text-cyan-300" />
              <span>Cloud Control Plane</span>
            </div>
            <p className="mt-2 text-xs font-mono text-neutral-300">sn1.helzerx.cyou</p>
            <p className="mt-2 text-xs text-neutral-500">Node hx-nd-01-10 · Proxmox &amp; Pterodactyl</p>
          </div>

          <div className="rounded-2xl bg-[#08080C] border border-white/[0.1] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 text-sm font-bold text-white">
                <Globe className="w-4 h-4 text-violet-300" />
                <span>Technical Support</span>
              </div>
              <p className="mt-2 text-xs font-mono text-neutral-300">{supportEmail}</p>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('support')}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-white transition-colors cursor-pointer"
              >
                <span>Open Support Ticket</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      <ContactSection selectedDivision={selectedDivision} />
    </div>
  );
}
