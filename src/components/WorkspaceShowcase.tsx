import {
  Check,
  Cloud,
  Layers,
  Search,
  ShoppingBag,
  SlidersHorizontal,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import studioDashboardImg from '../assets/images/helzerx_studio_dashboard_1795231046611.jpg';
import { DivisionId, WORKSPACE_DATA, WorkspaceItem } from '../data/helzerxData';

interface WorkspaceShowcaseProps {
  activeDivision: DivisionId;
  onSelectDivision: (division: DivisionId) => void;
  onAutoCycleDivision: (division: DivisionId) => void;
}

const DIVISION_ORDER: DivisionId[] = ['cloud', 'shop', 'studio'];

const DIVISION_TABS: { id: DivisionId; label: string; icon: typeof Cloud }[] = [
  { id: 'cloud', label: 'HelzerX Cloud', icon: Cloud },
  { id: 'shop', label: 'HelzerX Shop', icon: ShoppingBag },
  { id: 'studio', label: 'HelzerX Studio', icon: Layers },
];

const DIVISION_IMAGES: Partial<
  Record<
    DivisionId,
    {
      src: string;
      alt: string;
      fallbackTitle: string;
      fallbackDesc: string;
    }
  >
> = {
  cloud: {
    src: '/assets/aistudio/IMG_20261121_083503_16556201.JPG',
    alt: 'HelzerX Member Cloud Console displaying verified HZL credits, active Proxmox LXC and Minecraft servers, and live deployments',
    fallbackTitle: 'HelzerX Member Cloud Console',
    fallbackDesc:
      'Manage HZL credits, Proxmox LXC containers, and Pterodactyl Minecraft instances on sn1.helzerx.cyou.',
  },
  studio: {
    src: studioDashboardImg,
    alt: 'HelzerX Studio Dashboard displaying revenue analytics, active users, mentor metrics, September 2026 schedule, and course purchases',
    fallbackTitle: 'HelzerX Studio Dashboard',
    fallbackDesc:
      'Track platform revenue, active learners, mentor cohorts, community growth, and course purchases in one studio workspace.',
  },
};

export function WorkspaceShowcase({
  activeDivision,
  onSelectDivision,
  onAutoCycleDivision,
}: WorkspaceShowcaseProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string>('shp-1');
  const [completedOverrides, setCompletedOverrides] = useState<Record<string, boolean>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [isPaused, setIsPaused] = useState(false);

  const shouldReduceMotion = useReducedMotion();
  const activeWorkspace = WORKSPACE_DATA[activeDivision];
  const activeImageShowcase = DIVISION_IMAGES[activeDivision];

  // Auto-cycle smoothly between Cloud -> Shop -> Studio unless hovered, focused, or searching
  useEffect(() => {
    if (shouldReduceMotion || isPaused || searchQuery.trim().length > 0) {
      return;
    }

    const timer = window.setInterval(() => {
      const currentIdx = DIVISION_ORDER.indexOf(activeDivision);
      const nextDivision = DIVISION_ORDER[(currentIdx + 1) % DIVISION_ORDER.length];
      onAutoCycleDivision(nextDivision);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [activeDivision, isPaused, onAutoCycleDivision, searchQuery, shouldReduceMotion]);

  const handleTabSwitch = (division: DivisionId) => {
    onSelectDivision(division);
    const firstItem = WORKSPACE_DATA[division].subgroups[0]?.items[0];
    if (firstItem) {
      setSelectedItemId(firstItem.id);
    }
    setSearchQuery('');
  };

  const filteredSubgroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return activeWorkspace.subgroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            !query ||
            item.title.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query) ||
            item.owner.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [activeWorkspace, searchQuery]);

  const allItems: WorkspaceItem[] = useMemo(
    () => activeWorkspace.subgroups.flatMap((g) => g.items),
    [activeWorkspace],
  );

  const inspectedItem =
    allItems.find((item) => item.id === selectedItemId) ?? allItems[0] ?? null;

  const isRowDone = (item: WorkspaceItem) => {
    if (item.id in completedOverrides) {
      return completedOverrides[item.id];
    }
    return item.state === 'Completed';
  };

  const toggleRowDone = (id: string, current: boolean) => {
    setCompletedOverrides((prev) => ({ ...prev, [id]: !current }));
  };

  return (
    <section
      id="interface"
      className="relative overflow-hidden bg-black pt-16 pb-24 md:pt-24 md:pb-32"
    >
      {/* Rich radial violet glow rising from behind the 3D interface matching reference */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[76%] helzerx-bottom-glow"
      />

      <div className="relative z-10 max-w-[1160px] mx-auto px-6">
        {/* Centered Header */}
        <div className="max-w-[660px] mx-auto text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight text-white leading-[1.12]">
            Unified command interface
          </h2>
          <p className="mt-4 text-base md:text-lg leading-[1.6] text-neutral-400">
            Manage HZL credits and Proxmox LXC or Minecraft servers in HelzerX Cloud, coordinate
            Shop fulfillment, and review Studio platforms from one workspace.
          </p>

          {/* Interactive Division Segmented Control */}
          <div
            role="tablist"
            aria-label="HelzerX Workspace Views"
            className="mt-8 inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.05] border border-white/[0.1]"
          >
            {DIVISION_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeDivision === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`relative inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                    active
                      ? 'bg-white text-black shadow-sm'
                      : 'text-neutral-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Unified Single-Shape 3D Showcase Frame (Identical 16:9 size & shape for Cloud, Shop, Studio) */}
        <div
          className="mt-12 md:mt-16 max-w-[1040px] mx-auto relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
        >
          {/* Ambient 3D Violet Floor Halo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-10 -top-6 h-40 rounded-full bg-violet-600/20 blur-3xl"
          />

          <div className="helzerx-perspective-frame relative">
            <div className="relative w-full h-[360px] sm:h-[460px] md:h-auto md:aspect-[16/9] rounded-2xl overflow-hidden border border-white/[0.14] bg-[#08080D] shadow-[0_24px_70px_rgba(0,0,0,0.6),0_0_75px_rgba(124,58,237,0.28)]">
              {/* Top specular glass rim highlight */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/50 to-transparent z-20"
              />

              <AnimatePresence mode="wait">
                {activeImageShowcase ? (
                  <motion.div
                    key={activeDivision}
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10, scale: 0.99 }}
                    transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full h-full"
                  >
                    {failedImages[activeDivision] ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center bg-gradient-to-b from-[#0D0A18] to-black">
                        {activeDivision === 'cloud' ? (
                          <Cloud className="w-10 h-10 text-violet-300 mb-3" />
                        ) : (
                          <Layers className="w-10 h-10 text-violet-300 mb-3" />
                        )}
                        <p className="text-sm font-semibold text-white">
                          {activeImageShowcase.fallbackTitle}
                        </p>
                        <p className="mt-1 text-xs text-neutral-400 max-w-md">
                          {activeImageShowcase.fallbackDesc}
                        </p>
                      </div>
                    ) : (
                      <img
                        src={activeImageShowcase.src}
                        alt={activeImageShowcase.alt}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [activeDivision]: true }))
                        }
                        className="w-full h-full block object-cover object-top select-none"
                      />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="shop-console"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10, scale: 0.99 }}
                    transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full flex flex-col bg-[#0A0A0F]"
                  >
                    {/* Window Chrome Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-white/[0.08] bg-[#0E0E15] shrink-0">
                      <div className="flex items-center gap-2 shrink-0" aria-hidden="true">
                        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                      </div>

                      <div className="relative flex-1 max-w-md">
                        <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search hardware, kits, or orders..."
                          aria-label="Search workspace items"
                          className="w-full bg-black/50 border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-violet-400/60"
                        />
                      </div>

                      <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 shrink-0">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Live Catalog</span>
                      </div>
                    </div>

                    {/* Split Workspace Body fitted cleanly inside the exact 16:9 frame */}
                    <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[220px_1fr]">
                      <aside className="hidden md:flex flex-col justify-between border-r border-white/[0.08] bg-[#08080C] p-4">
                        <div className="space-y-1">
                          <div className="px-2.5 py-1.5 text-xs font-semibold text-neutral-500">
                            Ecosystem
                          </div>
                          {DIVISION_TABS.map((tab) => {
                            const Icon = tab.icon;
                            const active = activeDivision === tab.id;
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabSwitch(tab.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                                  active
                                    ? 'bg-violet-500/15 text-white border border-violet-400/30'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04] border border-transparent'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{tab.label}</span>
                              </button>
                            );
                          })}

                          <div className="pt-3 px-2.5 py-1 text-xs font-semibold text-neutral-500">
                            Active Queues
                          </div>
                          {activeWorkspace.subgroups.map((grp) => (
                            <div
                              key={grp.label}
                              className="px-3 py-1 text-xs text-neutral-400 flex items-center justify-between"
                            >
                              <span className="truncate">{grp.label}</span>
                              <span className="font-mono text-neutral-500 tabular-nums">
                                {grp.items.length}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-white/[0.08] px-2.5 text-xs text-neutral-500">
                          HelzerX Shop Portal
                        </div>
                      </aside>

                      <div className="flex flex-col justify-between p-4 sm:p-6 bg-[#0B0B11] overflow-y-auto">
                        <div>
                          <div className="text-xs text-neutral-400">{activeWorkspace.breadcrumb}</div>
                          <div className="mt-1.5 flex items-center justify-between gap-4">
                            <h3 className="text-lg font-bold text-white tracking-tight">
                              {activeWorkspace.heading}
                            </h3>
                            <span className="text-xs text-neutral-400 tabular-nums">
                              {allItems.length} tracked records
                            </span>
                          </div>

                          <div className="mt-4 space-y-4">
                            {filteredSubgroups.length === 0 ? (
                              <div className="py-8 text-center text-sm text-neutral-400 border border-dashed border-white/10 rounded-xl">
                                No items match “{searchQuery}”. Clear the search to view all records.
                              </div>
                            ) : (
                              filteredSubgroups.map((group) => (
                                <div key={group.label}>
                                  <div className="text-xs font-medium text-neutral-400 mb-2">
                                    {group.label}
                                  </div>
                                  <div className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
                                    {group.items.map((item) => {
                                      const done = isRowDone(item);
                                      const selected = inspectedItem?.id === item.id;
                                      const displayState = done
                                        ? 'Completed'
                                        : item.state === 'Completed'
                                          ? 'Active'
                                          : item.state;

                                      return (
                                        <div
                                          key={item.id}
                                          className={`flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 py-2 px-2 -mx-2 rounded-lg transition-colors ${
                                            selected
                                              ? 'bg-violet-500/[0.09]'
                                              : 'hover:bg-white/[0.03]'
                                          }`}
                                        >
                                          <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <button
                                              type="button"
                                              onClick={() => toggleRowDone(item.id, done)}
                                              aria-label={`Mark ${item.title} as ${done ? 'active' : 'completed'}`}
                                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors cursor-pointer ${
                                                done
                                                  ? 'bg-violet-500 border-violet-400 text-white'
                                                  : 'border-white/25 hover:border-violet-400'
                                              }`}
                                            >
                                              {done && <Check className="w-3 h-3" strokeWidth={2.5} />}
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => setSelectedItemId(item.id)}
                                              className="text-left min-w-0 flex-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded"
                                            >
                                              <span
                                                className={`block text-xs sm:text-sm truncate ${
                                                  done
                                                    ? 'text-neutral-400 line-through'
                                                    : 'text-neutral-100'
                                                }`}
                                              >
                                                {item.title}
                                              </span>
                                            </button>
                                          </div>

                                          <div className="flex items-center gap-4 text-xs shrink-0 pl-7 sm:pl-0">
                                            <span className="font-mono text-neutral-400 tabular-nums whitespace-nowrap">
                                              {item.dateOrMetric}
                                            </span>
                                            <span
                                              className={`font-medium whitespace-nowrap w-20 text-right ${
                                                displayState === 'Completed'
                                                  ? 'text-emerald-300'
                                                  : displayState === 'In Progress'
                                                    ? 'text-amber-300'
                                                    : 'text-violet-300'
                                              }`}
                                            >
                                              {displayState}
                                            </span>
                                            <span
                                              title={item.owner}
                                              className="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-[10px] font-semibold text-neutral-200 shrink-0"
                                            >
                                              {item.initials}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {inspectedItem && (
                          <div className="mt-4 pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0">
                            <div className="text-neutral-300 truncate">
                              <span className="font-semibold text-white">
                                {inspectedItem.category}
                              </span>
                              <span aria-hidden="true" className="mx-2 text-neutral-600">
                                ·
                              </span>
                              <span className="text-neutral-400">{inspectedItem.detail}</span>
                            </div>
                            <span className="text-neutral-400 whitespace-nowrap shrink-0">
                              Lead: {inspectedItem.owner}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Subtle, lighter bottom shadow fade so bottom content stays clear */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/45 via-black/15 to-transparent z-10"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
