/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { AppProvider } from './context/AppContext';
import { DivisionId } from './lib/platformData';
import { HomePage } from './pages/HomePage';
import { PageRoute, ROUTE_PATHS, parseRouteFromHash } from './types/navigation';

// Secondary pages are loaded on demand to keep the first paint fast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lazyPage = <T extends ComponentType<any>>(loader: () => Promise<{ default: T }>) =>
  lazy(loader);
const AboutPage = lazyPage(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const AdminPage = lazyPage(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const AuthPage = lazyPage(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const BlogPage = lazyPage(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })));
const CareersPage = lazyPage(() => import('./pages/CareersPage').then((m) => ({ default: m.CareersPage })));
const CloudPage = lazyPage(() => import('./pages/CloudPage').then((m) => ({ default: m.CloudPage })));
const CommunityPage = lazyPage(() => import('./pages/CommunityPage').then((m) => ({ default: m.CommunityPage })));
const ContactPage = lazyPage(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const DashboardPage = lazyPage(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const Launch2027Page = lazyPage(() => import('./pages/Launch2027Page').then((m) => ({ default: m.Launch2027Page })));
const LegalPage = lazyPage(() => import('./pages/LegalPage').then((m) => ({ default: m.LegalPage })));
const PartnersPage = lazyPage(() => import('./pages/PartnersPage').then((m) => ({ default: m.PartnersPage })));
const PricingPage = lazyPage(() => import('./pages/PricingPage').then((m) => ({ default: m.PricingPage })));
const ProductsPage = lazyPage(() => import('./pages/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const ShopPage = lazyPage(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const SolutionsPage = lazyPage(() => import('./pages/SolutionsPage').then((m) => ({ default: m.SolutionsPage })));
const StudioPage = lazyPage(() => import('./pages/StudioPage').then((m) => ({ default: m.StudioPage })));
const SupportPage = lazyPage(() => import('./pages/SupportPage').then((m) => ({ default: m.SupportPage })));

function PageFallback() {
  return (
    <div className="min-h-[60vh] px-6 py-24 bg-[#F4F4F5]">
      <div className="mx-auto max-w-[1120px] space-y-6">
        <div className="helzerx-shimmer h-10 w-2/3 max-w-md rounded-lg" />
        <div className="helzerx-shimmer h-4 w-1/2 max-w-lg rounded" />
        <div className="grid gap-5 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="helzerx-shimmer h-40 rounded-2xl" />
          <div className="helzerx-shimmer h-40 rounded-2xl" />
          <div className="helzerx-shimmer h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  const [route, setRoute] = useState<PageRoute>(() =>
    typeof window !== 'undefined' ? parseRouteFromHash(window.location.hash) : 'home',
  );
  const [contactDivision, setContactDivision] = useState<DivisionId>('cloud');
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRouteFromHash(window.location.hash));
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateTo = (nextRoute: PageRoute, division?: DivisionId) => {
    if (division) {
      setContactDivision(division);
    }
    const targetHash = ROUTE_PATHS[nextRoute];
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      setRoute(nextRoute);
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const renderPage = () => {
    switch (route) {
      case 'about':
        return <AboutPage onNavigate={(r) => navigateTo(r)} />;
      case 'products':
        return <ProductsPage onNavigate={(r) => navigateTo(r)} />;
      case 'cloud':
        return <CloudPage onNavigate={(r, d) => navigateTo(r, d)} />;
      case 'studio':
        return <StudioPage onNavigate={(r, d) => navigateTo(r, d)} />;
      case 'shop':
        return <ShopPage onNavigate={(r, d) => navigateTo(r, d)} />;
      case 'solutions':
        return <SolutionsPage onNavigate={(r) => navigateTo(r)} />;
      case 'pricing':
        return <PricingPage onNavigate={(r) => navigateTo(r)} />;
      case 'partners':
        return <PartnersPage onNavigate={(r) => navigateTo(r)} />;
      case 'careers':
        return <CareersPage onNavigate={(r) => navigateTo(r)} />;
      case 'launch':
        return <Launch2027Page onNavigate={(r) => navigateTo(r)} />;
      case 'community':
        return <CommunityPage onNavigate={(r) => navigateTo(r)} />;
      case 'blog':
        return <BlogPage />;
      case 'support':
        return <SupportPage onNavigate={(r) => navigateTo(r)} />;
      case 'contact':
        return <ContactPage selectedDivision={contactDivision} onNavigate={(r) => navigateTo(r)} />;
      case 'auth':
        return <AuthPage onNavigate={(r) => navigateTo(r)} />;
      case 'dashboard':
        return <DashboardPage onNavigate={(r) => navigateTo(r)} />;
      case 'admin':
        return <AdminPage onNavigate={(r) => navigateTo(r)} />;
      case 'terms':
        return <LegalPage docKey="terms" onNavigate={(r) => navigateTo(r)} />;
      case 'privacy':
        return <LegalPage docKey="privacy" onNavigate={(r) => navigateTo(r)} />;
      case 'sla':
        return <LegalPage docKey="sla" onNavigate={(r) => navigateTo(r)} />;
      case 'home':
      default:
        return <HomePage onNavigate={(r, d) => navigateTo(r, d)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] text-[#0A0A0B] flex flex-col">
      <Navbar currentRoute={route} onNavigate={(r) => navigateTo(r)} />
      <main className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={route}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          >
            <Suspense fallback={<PageFallback />}>{renderPage()}</Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer onNavigate={(r) => navigateTo(r)} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
