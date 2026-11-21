/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { AppProvider } from './context/AppContext';
import { DivisionId } from './data/helzerxData';
import { AboutPage } from './pages/AboutPage';
import { AdminPage } from './pages/AdminPage';
import { AuthPage } from './pages/AuthPage';
import { BlogPage } from './pages/BlogPage';
import { CareersPage } from './pages/CareersPage';
import { CloudPage } from './pages/CloudPage';
import { CommunityPage } from './pages/CommunityPage';
import { ContactPage } from './pages/ContactPage';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { Launch2027Page } from './pages/Launch2027Page';
import { LegalPage } from './pages/LegalPage';
import { PartnersPage } from './pages/PartnersPage';
import { PricingPage } from './pages/PricingPage';
import { ProductsPage } from './pages/ProductsPage';
import { ShopPage } from './pages/ShopPage';
import { SolutionsPage } from './pages/SolutionsPage';
import { StudioPage } from './pages/StudioPage';
import { SupportPage } from './pages/SupportPage';
import { PageRoute, ROUTE_PATHS, parseRouteFromHash } from './types/navigation';

function AppShell() {
  const [route, setRoute] = useState<PageRoute>(() =>
    typeof window !== 'undefined' ? parseRouteFromHash(window.location.hash) : 'home',
  );
  const [contactDivision, setContactDivision] = useState<DivisionId>('cloud');

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
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar currentRoute={route} onNavigate={(r) => navigateTo(r)} />
      <main className="flex-1">{renderPage()}</main>
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
