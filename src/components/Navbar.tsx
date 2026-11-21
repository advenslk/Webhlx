import { ChevronDown, LayoutDashboard, LogOut, Menu, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { PageRoute, ROUTE_PATHS } from '../types/navigation';

interface NavbarProps {
  currentRoute: PageRoute;
  onNavigate: (route: PageRoute) => void;
}

export function Navbar({ currentRoute, onNavigate }: NavbarProps) {
  const { user, sessionReady, isAdminRole, logout, cart } = useAppContext();
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
    { label: 'Launch 01.01.2027', desc: 'Early access & first-50 8GB offer', route: 'launch' },
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
      className="sticky top-0 z-50 w-full bg-[#F4F4F5]/90 backdrop-blur-xl border-b border-black/[0.08]"
    >
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <a
          href={ROUTE_PATHS.home}
          onClick={(e) => {
            e.preventDefault();
            go('home');
          }}
          className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-[#0A0A0B] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-md px-1"
        >
          <img
            src="/assets/aistudio/IMG_20261011_201132-removebg-preview_9b5f47c8.png"
            alt="HelzerX Technologies"
            className="h-6 w-auto object-contain shrink-0"
          />
          <span>helzerx.</span>
        </a>

        {/* Primary Desktop Navigation */}
        <nav aria-label="Primary Navigation" className="hidden xl:flex items-center gap-5">
          <button
            type="button"
            onClick={() => go('home')}
            className={`text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              currentRoute === 'home' ? 'text-[#0A0A0B] font-semibold' : 'text-neutral-600 hover:text-[#0A0A0B]'
            }`}
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => go('about')}
            className={`text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              currentRoute === 'about' ? 'text-[#0A0A0B] font-semibold' : 'text-neutral-600 hover:text-[#0A0A0B]'
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
                isProductsActive ? 'text-[#0A0A0B] font-semibold' : 'text-neutral-600 hover:text-[#0A0A0B]'
              }`}
            >
              <span>Products</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-75" />
            </button>

            {openMenu === 'products' && (
              <div className="absolute left-0 top-full mt-3 w-[340px] rounded-2xl bg-white border border-black/[0.08] p-2.5 shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
                {productItems.map((item) => (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => go(item.route)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer block ${
                      currentRoute === item.route
                        ? 'bg-[#0A0A0B] text-white'
                        : 'hover:bg-neutral-100 text-[#0A0A0B]'
                    }`}
                  >
                    <div
                      className={`text-xs font-semibold ${
                        currentRoute === item.route ? 'text-white' : 'text-[#0A0A0B]'
                      }`}
                    >
                      {item.label}
                    </div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        currentRoute === item.route ? 'text-neutral-300' : 'text-neutral-600'
                      }`}
                    >
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => go('cloud')}
            className={`text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              currentRoute === 'cloud' ? 'text-[#0A0A0B] font-semibold' : 'text-neutral-600 hover:text-[#0A0A0B]'
            }`}
          >
            Cloud
          </button>

          <button
            type="button"
            onClick={() => go('studio')}
            className={`text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              currentRoute === 'studio' ? 'text-[#0A0A0B] font-semibold' : 'text-neutral-600 hover:text-[#0A0A0B]'
            }`}
          >
            Studio
          </button>

          <button
            type="button"
            onClick={() => go('shop')}
            className={`text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              currentRoute === 'shop' ? 'text-[#0A0A0B] font-semibold' : 'text-neutral-600 hover:text-[#0A0A0B]'
            }`}
          >
            Shop
          </button>

          <button
            type="button"
            onClick={() => go('pricing')}
            className={`text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              currentRoute === 'pricing' ? 'text-[#0A0A0B] font-semibold' : 'text-neutral-600 hover:text-[#0A0A0B]'
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
                isCommunityActive ? 'text-[#0A0A0B] font-semibold' : 'text-neutral-600 hover:text-[#0A0A0B]'
              }`}
            >
              <span>Community</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-75" />
            </button>

            {openMenu === 'community' && (
              <div className="absolute left-0 top-full mt-3 w-[340px] rounded-2xl bg-white border border-black/[0.08] p-2.5 shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
                {communityItems.map((item) => (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => go(item.route)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer block ${
                      currentRoute === item.route
                        ? 'bg-[#0A0A0B] text-white'
                        : 'hover:bg-neutral-100 text-[#0A0A0B]'
                    }`}
                  >
                    <div
                      className={`text-xs font-semibold ${
                        currentRoute === item.route ? 'text-white' : 'text-[#0A0A0B]'
                      }`}
                    >
                      {item.label}
                    </div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        currentRoute === item.route ? 'text-neutral-300' : 'text-neutral-600'
                      }`}
                    >
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => go('blog')}
            className={`text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              currentRoute === 'blog' ? 'text-[#0A0A0B] font-semibold' : 'text-neutral-600 hover:text-[#0A0A0B]'
            }`}
          >
            Blog
          </button>

          <button
            type="button"
            onClick={() => go('contact')}
            className={`text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              currentRoute === 'contact' ? 'text-[#0A0A0B] font-semibold' : 'text-neutral-600 hover:text-[#0A0A0B]'
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#0A0A0B] bg-white border border-black/[0.12] rounded-lg hover:border-black/30 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#0A0A0B]" />
              <span className="tabular-nums">{cartCount}</span>
            </button>
          )}

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => go('dashboard')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  currentRoute === 'dashboard'
                    ? 'bg-[#0A0A0B] border-[#0A0A0B] text-white'
                    : 'bg-white border-black/[0.12] text-[#0A0A0B] hover:border-black/30'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              {isAdminRole && (
                <button
                  type="button"
                  onClick={() => go('admin')}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    currentRoute === 'admin'
                      ? 'bg-[#0A0A0B] text-white border-[#0A0A0B]'
                      : 'bg-white text-[#0A0A0B] border-black/[0.12] hover:border-black/35'
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
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:text-[#0A0A0B] hover:bg-black/[0.06] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : sessionReady ? (
            <div className="hidden md:flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => go('auth')}
                className="px-3 py-2 text-xs font-semibold text-neutral-700 hover:text-[#0A0A0B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => go('launch')}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg hover:bg-neutral-800 transition-colors shadow-[0_6px_16px_rgba(10,10,11,0.18)] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div
              aria-hidden="true"
              className="hidden md:block h-8 w-32 animate-pulse rounded-lg bg-black/[0.06]"
            />
          )}

          {/* Mobile / Tablet Menu Button */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="xl:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-neutral-700 hover:text-[#0A0A0B] hover:bg-black/[0.06] transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Drawer */}
      {mobileOpen && (
        <div className="xl:hidden bg-white border-b border-black/[0.08] px-6 py-5 max-h-[82vh] overflow-y-auto shadow-xl">
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
                    ? 'bg-[#0A0A0B] text-white'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-[#0A0A0B]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-black/[0.08] flex flex-wrap gap-3">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => go('dashboard')}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg cursor-pointer"
                >
                  Customer Dashboard
                </button>
                {isAdminRole && (
                  <button
                    type="button"
                    onClick={() => go('admin')}
                    className="flex-1 py-2.5 px-4 text-xs font-semibold text-[#0A0A0B] bg-white border border-black/15 rounded-lg cursor-pointer"
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
                  className="py-2.5 px-4 text-xs font-medium text-neutral-700 border border-black/15 rounded-lg cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => go('auth')}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-[#0A0A0B] border border-black/15 rounded-lg cursor-pointer"
                >
                  Login / Register
                </button>
                <button
                  type="button"
                  onClick={() => go('launch')}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg cursor-pointer"
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
