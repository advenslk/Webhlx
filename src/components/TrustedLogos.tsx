import { Boxes, Cloud, Code2, Database, Gamepad2, Lock } from 'lucide-react';

const STACK = [
  { name: 'Proxmox VE', icon: Boxes },
  { name: 'Pterodactyl', icon: Gamepad2 },
  { name: 'React', icon: Code2 },
  { name: 'SQLite', icon: Database },
  { name: 'Node.js', icon: Cloud },
  { name: 'Zero-trust auth', icon: Lock },
];

export function TrustedLogos() {
  return (
    <section aria-label="Technology stack" className="bg-black pt-6 pb-20 md:pb-24">
      <div className="max-w-[1120px] mx-auto px-6 text-center">
        <p className="text-xs font-medium text-neutral-500 tracking-wide">
          Built on proven infrastructure and tooling
        </p>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-6 gap-x-8 items-center justify-items-center">
          {STACK.map(({ name, icon: Icon }) => (
            <div
              key={name}
              className="flex items-center gap-2.5 text-neutral-400/80 hover:text-violet-200 transition-colors duration-200"
            >
              <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
              <span className="text-sm font-semibold tracking-tight whitespace-nowrap">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
