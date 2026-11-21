export type PageRoute =
  | 'home'
  | 'about'
  | 'products'
  | 'cloud'
  | 'studio'
  | 'shop'
  | 'solutions'
  | 'pricing'
  | 'partners'
  | 'careers'
  | 'launch'
  | 'community'
  | 'blog'
  | 'support'
  | 'contact'
  | 'auth'
  | 'dashboard'
  | 'admin'
  | 'terms'
  | 'privacy'
  | 'sla';

export const ROUTE_PATHS: Record<PageRoute, string> = {
  home: '#/',
  about: '#/about',
  products: '#/products',
  cloud: '#/cloud',
  studio: '#/studio',
  shop: '#/shop',
  solutions: '#/solutions',
  pricing: '#/pricing',
  partners: '#/partners',
  careers: '#/careers',
  launch: '#/launch',
  community: '#/community',
  blog: '#/blog',
  support: '#/support',
  contact: '#/contact',
  auth: '#/auth',
  dashboard: '#/dashboard',
  admin: '#/admin',
  terms: '#/terms',
  privacy: '#/privacy',
  sla: '#/sla',
};

export function parseRouteFromHash(hash: string): PageRoute {
  const cleaned = hash.replace(/^#\/?/, '').trim().toLowerCase().split('?')[0];
  switch (cleaned) {
    case 'about':
    case 'company':
      return 'about';
    case 'products':
      return 'products';
    case 'cloud':
      return 'cloud';
    case 'studio':
      return 'studio';
    case 'shop':
      return 'shop';
    case 'solutions':
      return 'solutions';
    case 'pricing':
      return 'pricing';
    case 'partners':
      return 'partners';
    case 'careers':
    case 'staff':
      return 'careers';
    case 'launch':
    case '2027':
      return 'launch';
    case 'community':
      return 'community';
    case 'blog':
    case 'announcements':
      return 'blog';
    case 'support':
    case 'docs':
      return 'support';
    case 'contact':
      return 'contact';
    case 'auth':
    case 'login':
    case 'register':
      return 'auth';
    case 'dashboard':
    case 'account':
      return 'dashboard';
    case 'admin':
      return 'admin';
    case 'terms':
    case 'terms-of-service':
      return 'terms';
    case 'privacy':
    case 'privacy-policy':
      return 'privacy';
    case 'sla':
    case 'refund-policy':
      return 'sla';
    default:
      return 'home';
  }
}
