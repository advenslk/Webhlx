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
import { DivisionId, WORKSPACE_DATA, WorkspaceItem } from '../lib/platformData';

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
      className="relative overflow-hidden bg-[#F4F4F5] pt-20 pb-28 md:pt-28 md:pb-36 border-t border-black/[0.06]"
    >
      <div className="relative z-10 max-w-[1160px] mx-auto px-6">
        {/* Centered Header with Signature Dotted Title */}
        <div className="max-w-[740px] mx-auto text-center">
          <div className="text-xs font-medium text-neutral-500 mb-3">
            Unified Control Plane
          </div>
          <h2 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-extrabold tracking-[-0.04em] leading-[1.02] helzerx-dotted-text pb-2">
            command center.
          </h2>
          <p className="mt-4 text-sm md:text-base leading-[1.6] text-neutral-600 max-w-xl mx-auto">
            Monitor Proxmox LXC and Pterodactyl servers in Cloud, coordinate Shop fulfillment, and
            track Studio client delivery from one cohesive 3D interface.
          </p>

          {/* Interactive Division Segmented Control */}
          <div
            role="tablist"
            aria-label="HelzerX Workspace Views"
            className="mt-8 inline-flex items-center gap-1 p-1.5 rounded-2xl bg-white border border-black/[0.09] shadow-[0_12px_30px_rgba(0,0,0,0.06)]"
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
                  className={`relative inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                    active ? 'text-white' : 'text-neutral-600 hover:text-[#0A0A0B]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="workspace-tab-indicator"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-[#0A0A0B] shadow-sm"
                    />
                  )}
                  <Icon className="relative z-10 w-3.5 h-3.5" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Static Sculptural 3D Matte-Black Hardware Studio Display Frame */}
        <div
          className="mt-10 md:mt-12 max-w-[860px] mx-auto relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
        >
          {/* Realistic Studio Ground Contact Shadow under the 3D frame */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-8 inset-x-10 h-14 rounded-full bg-black/25 blur-2xl"
          />

          <div className="relative helzerx-perspective-frame">
            <div className="relative w-full h-[360px] sm:h-[460px] md:h-auto md:aspect-[16/9] rounded-2xl overflow-hidden border-[6px] border-[#141417] bg-[#060810] shadow-[0_42px_95px_-20px_rgba(10,10,14,0.48)]">
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
                      <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center bg-[#0B0B10]">
                        {activeDivision === 'cloud' ? (
                          <Cloud className="w-10 h-10 text-white mb-3" />
                        ) : (
                          <Layers className="w-10 h-10 text-white mb-3" />
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
                    className="w-full h-full flex flex-col bg-[#0B0B0E] text-white"
                  >
                    {/* Window Chrome Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-white/[0.08] bg-[#121216] shrink-0">
                      <div className="flex items-center gap-2 shrink-0" aria-hidden="true">
                        <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                        <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                        <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                      </div>

                      <div className="relative flex-1 max-w-md">
                        <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search hardware, kits, or orders..."
                          aria-label="Search workspace items"
                          className="w-full bg-black/55 border border-white/[0.1] rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-white/40"
                        />
                      </div>

                      <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 shrink-0">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Live Catalog</span>
                      </div>
                    </div>

                    {/* Split Workspace Body */}
                    <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[220px_1fr]">
                      <aside className="hidden md:flex flex-col justify-between border-r border-white/[0.08] bg-[#08080B] p-4">
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
                                    ? 'bg-white/15 text-white border border-white/25'
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
                              <span className="text-neutral-400 tabular-nums">
                                {grp.items.length}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-white/[0.08] px-2.5 text-xs text-neutral-500">
                          HelzerX Shop Portal
                        </div>
                      </aside>

                      <div className="flex flex-col justify-between p-4 sm:p-6 bg-[#0D0D12] overflow-y-auto">
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
                                              ? 'bg-white/[0.08]'
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
                                                  ? 'bg-white border-white text-black'
                                                  : 'border-white/25 hover:border-white'
                                              }`}
                                            >
                                              {done && <Check className="w-3 h-3" strokeWidth={2.5} />}
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => setSelectedItemId(item.id)}
                                              className="text-left min-w-0 flex-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
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
                                            <span className="text-neutral-400 tabular-nums whitespace-nowrap">
                                              {item.dateOrMetric}
                                            </span>
                                            <span
                                              className={`font-medium whitespace-nowrap w-20 text-right ${
                                                displayState === 'Completed'
                                                  ? 'text-emerald-300'
                                                  : displayState === 'In Progress'
                                                    ? 'text-amber-300'
                                                    : 'text-white'
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
