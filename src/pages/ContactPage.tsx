import { ArrowRight, Globe, Mail, Server } from 'lucide-react';
import { ContactSection } from '../components/ContactSection';
import { Surface3D } from '../components/Surface3D';
import { useAppContext } from '../context/AppContext';
import { DivisionId } from '../lib/platformData';
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
    <div className="bg-[#F4F4F5] text-[#0A0A0B]">
      <section className="relative overflow-hidden helzerx-studio-hero pt-16 pb-16 md:pt-24 md:pb-20 border-b border-black/[0.06]">
        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs font-medium text-neutral-600 mb-5">
            <span className="font-semibold text-[#0A0A0B]">HelzerX Technologies</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>helzerx.cyou</span>
            <span aria-hidden="true" className="mx-2 text-neutral-400">·</span>
            <span>Global Enterprise Desk</span>
          </div>
          <h1 className="text-[clamp(2.6rem,5.5vw,4.5rem)] font-extrabold tracking-[-0.04em] leading-[0.98] helzerx-dotted-text pb-2">
            contact engineering.
          </h1>
          <p className="mt-5 max-w-[56ch] mx-auto text-base md:text-lg text-neutral-600">
            Reach our infrastructure, hardware procurement, and product studio leads directly or
            open a technical support ticket.
          </p>
        </div>
      </section>

      <section className="bg-[#F4F4F5] pt-12 pb-4">
        <div className="max-w-[1040px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          <Surface3D intensity={12} delay={0.04}>
            <div className="p-6 h-full">
              <div className="flex items-center gap-2.5 text-sm font-bold text-[#0A0A0B]">
                <Mail className="w-4 h-4 text-[#0A0A0B]" />
                <span>Enterprise &amp; Sales</span>
              </div>
              <p className="mt-2.5 text-xs font-semibold text-[#0A0A0B]">{salesEmail}</p>
              <p className="mt-2 text-xs text-neutral-600">
                Custom clusters, bulk Shop orders, Studio scopes
              </p>
            </div>
          </Surface3D>

          <Surface3D intensity={12} delay={0.1}>
            <div className="p-6 h-full">
              <div className="flex items-center gap-2.5 text-sm font-bold text-[#0A0A0B]">
                <Server className="w-4 h-4 text-[#0A0A0B]" />
                <span>Cloud Control Plane</span>
              </div>
              <p className="mt-2.5 text-xs font-semibold text-[#0A0A0B]">sn1.helzerx.cyou</p>
              <p className="mt-2 text-xs text-neutral-600">
                Node hx-nd-01-10 · Proxmox &amp; Pterodactyl
              </p>
            </div>
          </Surface3D>

          <Surface3D intensity={12} delay={0.16}>
            <div className="p-6 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 text-sm font-bold text-[#0A0A0B]">
                  <Globe className="w-4 h-4 text-[#0A0A0B]" />
                  <span>Technical Support</span>
                </div>
                <p className="mt-2.5 text-xs font-semibold text-[#0A0A0B]">{supportEmail}</p>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('support')}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#0A0A0B] hover:text-neutral-600 transition-colors cursor-pointer"
                >
                  <span>Open Support Ticket</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </Surface3D>
        </div>
      </section>

      <ContactSection selectedDivision={selectedDivision} />
    </div>
  );
}
