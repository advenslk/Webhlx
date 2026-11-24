import { ArrowRight, Boxes, Cloud, Code2, Cpu, Database, Gamepad2, Globe, Lock, ShieldCheck } from 'lucide-react';
import { Surface3D } from './Surface3D';
import { PageRoute } from '../types/navigation';

interface TrustedLogosProps {
  onNavigate?: (route: PageRoute) => void;
}

const STACK_ROWS = [
  {
    id: 'row-1',
    direction: 'right' as const,
    tiles: [
      { name: 'Proxmox VE', role: 'LXC Compute', icon: Boxes },
      { name: 'Pterodactyl', role: 'Game Proxy', icon: Gamepad2 },
      { name: 'React 19', role: 'Spatial UI', icon: Code2 },
    ],
  },
  {
    id: 'row-2',
    direction: 'left' as const,
    tiles: [
      { name: 'SQLite WAL', role: 'Ledger DB', icon: Database },
      { name: 'Node.js', role: 'API Gateway', icon: Cloud },
      { name: 'Zero-Trust', role: 'Scrypt RBAC', icon: Lock },
    ],
  },
  {
    id: 'row-3',
    direction: 'right' as const,
    tiles: [
      { name: 'EPYC Nodes', role: 'DDR5 Bare-Metal', icon: Cpu },
      { name: 'Anycast', role: 'Global Edge', icon: Globe },
      { name: '99.98% SLA', role: 'Audit Trail', icon: ShieldCheck },
    ],
  },
];

export function TrustedLogos({ onNavigate }: TrustedLogosProps) {
  return (
    <section
      aria-label="Technology infrastructure"
      className="bg-[#F4F4F5] py-20 md:py-28 border-t border-black/[0.06]"
    >
      <div className="max-w-[1180px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-center">
        {/* Left Editorial Column mirroring reference image layout */}
        <div>
          <h2 className="text-[clamp(1.75rem,3.4vw,2.75rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[#0A0A0B]">
            Engineered to scale every workload. Built to support every stage.
          </h2>
          <p className="mt-5 text-sm md:text-base text-neutral-600 leading-relaxed max-w-md">
            From high-frequency Minecraft &amp; Proxmox LXC nodes to full-cycle React platforms and
            verified hardware fulfillment, HelzerX runs every workload on unified architecture.
          </p>
          <div className="mt-8">
            <button
              type="button"
              onClick={() => onNavigate?.('products')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <span>See our stack</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Elevated White 3D Stack Tile Rows (Alternating Right -> Left -> Right Marquee) */}
        <div className="min-w-0 helzerx-marquee-stage">
          <div className="flex flex-col gap-6 sm:gap-7">
            {STACK_ROWS.map((row) => (
              <div key={row.id} className="helzerx-marquee-row">
                <div
                  className={`helzerx-marquee-track ${
                    row.direction === 'right'
                      ? 'helzerx-marquee-track-right'
                      : 'helzerx-marquee-track-left'
                  }`}
                >
                  {[0, 1].map((dupIndex) => (
                    <div
                      key={dupIndex}
                      aria-hidden={dupIndex === 1 || undefined}
                      className="helzerx-marquee-group"
                    >
                      {[0, 1].flatMap((cycle) =>
                        row.tiles.map(({ name, role, icon: Icon }) => (
                          <Surface3D
                            key={`${row.id}-${dupIndex}-${cycle}-${name}`}
                            intensity={12}
                            animateEntrance={false}
                            className="helzerx-marquee-tile rounded-2xl w-[168px] sm:w-[188px] shrink-0"
                          >
                            <div className="p-4 sm:p-5 h-full min-h-[116px] flex flex-col items-center justify-center text-center">
                              <Icon className="w-5 h-5 text-[#0A0A0B] mb-2 shrink-0" aria-hidden="true" />
                              <span className="text-xs sm:text-sm font-bold tracking-tight text-[#0A0A0B] leading-tight">
                                {name}
                              </span>
                              <span className="mt-1 text-[11px] text-neutral-500 leading-tight">
                                {role}
                              </span>
                            </div>
                          </Surface3D>
                        )),
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
