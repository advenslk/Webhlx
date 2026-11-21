import { ChevronDown, LayoutDashboard, LogOut, Menu, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { PageRoute, ROUTE_PATHS } from '../types/navigation';

interface NavbarProps {
  currentRoute: PageRoute;
  onNavigate: (route: PageRoute) => void;
}

export function Navbar({ currentRoute, onNavigate }: NavbarProps) {
  const { user, isAdminRole, logout, cart } = useAppContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<'products' | 'community' | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const go = (route: PageRoute) => {
    setOpenMenu(null);
    setMobileOpen(false);
    onNavigate(route);
  };

  const productItems: { label: string; desc: string; route: PageRoute }[] = [
    { label: 'Products Overview', desc: 'Explore the complete HelzerX suite', route: 'products' },
    { label: 'HelzerX Cloud', desc: 'Minecraft, Game & Proxmox LXC nodes', route: 'cloud' },
    { label: 'HelzerX Studio', desc: 'Web, UI/UX, branding & custom software', route: 'studio' },
    { label: 'HelzerX Shop', desc: 'Hardware, peripherals & digital licenses', route: 'shop' },
    { label: 'Solutions', desc: 'Enterprise & scaling architectures', route: 'solutions' },
    { label: 'Pricing', desc: 'Transparent compute & studio tiers', route: 'pricing' },
  ];

  const communityItems: { label: string; desc: string; route: PageRoute }[] = [
    { label: 'Partners', desc: 'Referral & agency partnership program', route: 'partners' },
    { label: 'Community', desc: 'Builders, creators & announcements', route: 'community' },
    { label: 'Blog', desc: 'Engineering deep-dives & release notes', route: 'blog' },
    { label: 'Careers', desc: 'Open roles at HelzerX Technologies', route: 'careers' },
    { label: 'Launch 01.01.2027', desc: '47+ pre-orders & first-50 8GB offer', route: 'launch' },
    { label: 'Support Center', desc: 'Docs, knowledge base & tickets', route: 'support' },
  ];

  const isProductsActive = ['products', 'cloud', 'studio', 'shop', 'solutions', 'pricing'].includes(
    currentRoute,
  );
  const isCommunityActive = ['partners', 'community', 'blog', 'careers', 'launch', 'support'].includes(
    currentRoute,
  );

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-50 w-full bg-black/85 backdrop-blur-xl border-b border-white/[0.08]"
    >
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Wordmark */}
        <a
          href={ROUTE_PATHS.home}
          onClick={(e) => {
            e.preventDefault();
            go('home');
          }}
          className="flex items-center gap-2.5 text-base lg:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded-md px-1"
        >
          <span
            aria-hidden="true"
            className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-400 via-blue-500 to-cyan-400 flex items-center justify-center shadow-[0_0_18px_rgba(99,102,241,0.45)]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2.5 2.5L7 7M7 7L11.5 2.5M7 7L2.5 11.5M7 7L11.5 11.5"
                stroke="#FFFFFF"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span>HelzerX</span>
        </a>

        {/* Primary Desktop Navigation */}
        <nav aria-label="Primary Navigation" className="hidden xl:flex items-center gap-5">
          <button
            type="button"
            onClick={() => go('home')}
            className={`text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              currentRoute === 'home' ? 'text-white' : 'text-neutral-300 hover:text-white'
            }`}
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => go('about')}
            className={`text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              currentRoute === 'about' ? 'text-white' : 'text-neutral-300 hover:text-white'
            }`}
          >
            About
          </button>

          {/* Products & Services Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'products' ? null : 'products')}
              aria-expanded={openMenu === 'products'}
              className={`inline-flex items-center gap-1 text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
                isProductsActive ? 'text-white' : 'text-neutral-300 hover:text-white'
              }`}
            >
              <span>Products</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-75" />
            </button>

            {openMenu === 'products' && (
              <div className="absolute left-0 top-full mt-3 w-[340px] rounded-2xl bg-[#0B0C14]/95 backdrop-blur-xl border border-white/[0.12] p-2.5 shadow-[0_24px_60px_rgba(0,0,0,0.85)]">
                {productItems.map((item) => (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => go(item.route)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer block ${
                      currentRoute === item.route
                        ? 'bg-violet-500/15 text-white'
                        : 'hover:bg-white/[0.05] text-neutral-200'
                    }`}
                  >
                    <div className="text-xs font-semibold text-white">{item.label}</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => go('cloud')}
            className={`text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              currentRoute === 'cloud' ? 'text-white' : 'text-neutral-300 hover:text-white'
            }`}
          >
            Cloud
          </button>

          <button
            type="button"
            onClick={() => go('studio')}
            className={`text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              currentRoute === 'studio' ? 'text-white' : 'text-neutral-300 hover:text-white'
            }`}
          >
            Studio
          </button>

          <button
            type="button"
            onClick={() => go('shop')}
            className={`text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              currentRoute === 'shop' ? 'text-white' : 'text-neutral-300 hover:text-white'
            }`}
          >
            Shop
          </button>

          <button
            type="button"
            onClick={() => go('pricing')}
            className={`text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              currentRoute === 'pricing' ? 'text-white' : 'text-neutral-300 hover:text-white'
            }`}
          >
            Pricing
          </button>

          {/* Community & Resources Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'community' ? null : 'community')}
              aria-expanded={openMenu === 'community'}
              className={`inline-flex items-center gap-1 text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
                isCommunityActive ? 'text-white' : 'text-neutral-300 hover:text-white'
              }`}
            >
              <span>Community</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-75" />
            </button>

            {openMenu === 'community' && (
              <div className="absolute left-0 top-full mt-3 w-[340px] rounded-2xl bg-[#0B0C14]/95 backdrop-blur-xl border border-white/[0.12] p-2.5 shadow-[0_24px_60px_rgba(0,0,0,0.85)]">
                {communityItems.map((item) => (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => go(item.route)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer block ${
                      currentRoute === item.route
                        ? 'bg-violet-500/15 text-white'
                        : 'hover:bg-white/[0.05] text-neutral-200'
                    }`}
                  >
                    <div className="text-xs font-semibold text-white">{item.label}</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => go('blog')}
            className={`text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              currentRoute === 'blog' ? 'text-white' : 'text-neutral-300 hover:text-white'
            }`}
          >
            Blog
          </button>

          <button
            type="button"
            onClick={() => go('contact')}
            className={`text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              currentRoute === 'contact' ? 'text-white' : 'text-neutral-300 hover:text-white'
            }`}
          >
            Contact
          </button>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {cartCount > 0 && (
            <button
              type="button"
              onClick={() => go('shop')}
              aria-label={`Shop cart with ${cartCount} items`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-200 border border-white/[0.12] rounded-lg hover:border-white/30 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-violet-300" />
              <span className="font-mono tabular-nums">{cartCount}</span>
            </button>
          )}

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => go('dashboard')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  currentRoute === 'dashboard'
                    ? 'bg-white/15 border-violet-400/50 text-white'
                    : 'border-white/[0.12] text-neutral-200 hover:text-white hover:border-white/25'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              {isAdminRole && (
                <button
                  type="button"
                  onClick={() => go('admin')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    currentRoute === 'admin'
                      ? 'bg-violet-500 text-white'
                      : 'bg-violet-500/20 text-violet-200 border border-violet-400/35 hover:bg-violet-500/30'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  logout();
                  go('home');
                }}
                aria-label="Log out"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => go('auth')}
                className="px-3 py-2 text-xs font-medium text-neutral-200 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => go('launch')}
                className="px-4 py-2 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile / Tablet Menu Button */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="xl:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-neutral-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Drawer */}
      {mobileOpen && (
        <div className="xl:hidden bg-[#06070D]/98 border-b border-white/10 px-6 py-5 max-h-[82vh] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(
              [
                ['Home', 'home'],
                ['About', 'about'],
                ['Products', 'products'],
                ['Cloud', 'cloud'],
                ['Studio', 'studio'],
                ['Shop', 'shop'],
                ['Solutions', 'solutions'],
                ['Pricing', 'pricing'],
                ['Partners', 'partners'],
                ['Community', 'community'],
                ['Careers', 'careers'],
                ['Launch 2027', 'launch'],
                ['Blog', 'blog'],
                ['Support', 'support'],
                ['Contact', 'contact'],
              ] as [string, PageRoute][]
            ).map(([label, r]) => (
              <button
                key={r}
                type="button"
                onClick={() => go(r)}
                className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  currentRoute === r
                    ? 'bg-violet-500/20 text-white'
                    : 'text-neutral-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap gap-3">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => go('dashboard')}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-white/10 rounded-lg cursor-pointer"
                >
                  Customer Dashboard
                </button>
                {isAdminRole && (
                  <button
                    type="button"
                    onClick={() => go('admin')}
                    className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-violet-600 rounded-lg cursor-pointer"
                  >
                    Admin Panel
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    go('home');
                  }}
                  className="py-2.5 px-4 text-xs font-medium text-neutral-300 border border-white/15 rounded-lg cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => go('auth')}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-white border border-white/20 rounded-lg cursor-pointer"
                >
                  Login / Register
                </button>
                <button
                  type="button"
                  onClick={() => go('launch')}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-black bg-white rounded-lg cursor-pointer"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
