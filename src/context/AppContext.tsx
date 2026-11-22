import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiRequest, getAuthToken, setAuthToken } from '../lib/api';

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'security_admin'
  | 'finance_manager'
  | 'support_manager'
  | 'moderator'
  | 'staff'
  | 'partner'
  | 'customer';

export const ADMIN_PANEL_ROLES: UserRole[] = [
  'super_admin',
  'admin',
  'security_admin',
  'finance_manager',
  'support_manager',
  'moderator',
  'staff',
];

export function isAdminPanelRole(role: string | undefined | null): boolean {
  return Boolean(role && ADMIN_PANEL_ROLES.includes(role as UserRole));
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  email_verified: number;
  avatar_url: string;
  notify_email: number;
  notify_security: number;
  totp_enabled?: number;
  last_login_at?: string;
  last_login_ip?: string;
  created_at: string;
}

export interface SiteSettingsGeneral {
  companyName: string;
  domain: string;
  launchDate: string;
  heroHeading: string;
  heroDescription: string;
  supportEmail: string;
  salesEmail: string;
  promoBanner: string;
}

export interface PublicSiteData {
  settings: {
    general?: SiteSettingsGeneral;
    security_controls?: {
      maintenanceLockdown?: boolean;
      loginRestriction?: boolean;
      apiEmergencyReadOnly?: boolean;
      emergencySecurityMode?: boolean;
      requireAdminMfa?: boolean;
      devtoolsDeterrence?: boolean;
    };
  };
  announcements: {
    id: string;
    title: string;
    body: string;
    type: string;
    created_at: string;
  }[];
  faqs: {
    id: string;
    category: string;
    question: string;
    answer: string;
  }[];
  featuredProducts: {
    id: string;
    slug: string;
    name: string;
    category: string;
    price_usd: number;
    stock: number;
    image_url: string;
    badge: string;
    summary: string;
    specs_json: string;
  }[];
  blogPosts: {
    id: string;
    slug: string;
    title: string;
    category: string;
    tags_json: string;
    excerpt: string;
    content: string;
    author_name: string;
    published_at: string;
  }[];
  launch: {
    launchDate: string;
    basePreorders: number;
    totalPreorders: number;
    earlyAccessLimit: number;
    earlyAccessQualified: number;
    earlyAccessRegistrations: number;
    announcementText: string;
  };
}

export interface CartItem {
  productId: string;
  name: string;
  priceUsd: number;
  quantity: number;
}

interface AppContextValue {
  user: AuthUser | null;
  sessionReady: boolean;
  setSession: (token: string | null, user: AuthUser | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  logoutAll: () => Promise<void>;
  isAdminRole: boolean;
  siteData: PublicSiteData | null;
  refreshSiteData: () => Promise<void>;
  cart: CartItem[];
  wishlist: string[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const CART_KEY = 'helzerx.cart';
const WISHLIST_KEY = 'helzerx.wishlist';

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures — state still works for this session.
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [siteData, setSiteData] = useState<PublicSiteData | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => readStored<CartItem[]>(CART_KEY, []));
  const [wishlist, setWishlist] = useState<string[]>(() => readStored<string[]>(WISHLIST_KEY, []));
  const [sessionReady, setSessionReady] = useState(false);

  const refreshSiteData = useCallback(async () => {
    try {
      const data = await apiRequest<PublicSiteData>('/api/public/site-data');
      setSiteData(data);
    } catch {
      // keep existing siteData if transient fetch error
    }
  }, []);

  useEffect(() => {
    void refreshSiteData();
  }, [refreshSiteData]);

  const setSession = useCallback((token: string | null, nextUser: AuthUser | null) => {
    setAuthToken(token);
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiRequest<{ user: AuthUser }>('/api/auth/me');
      setUser(res.user);
    } catch {
      setAuthToken(null);
      setUser(null);
    } finally {
      setSessionReady(true);
    }
  }, []);

  // Restore a saved session on load so auth survives reloads and new tabs.
  useEffect(() => {
    if (getAuthToken()) {
      void refreshUser();
    } else {
      setSessionReady(true);
    }
  }, [refreshUser]);

  useEffect(() => persist(CART_KEY, cart), [cart]);
  useEffect(() => persist(WISHLIST_KEY, wishlist), [wishlist]);

  const logout = useCallback(() => {
    const currentToken = getAuthToken();
    if (currentToken) {
      void fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` },
      }).catch(() => {
        // Ignore network errors while clearing client session
      });
    }
    setAuthToken(null);
    setUser(null);
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout-all', { method: 'POST' });
    } catch {
      // Clear local session regardless
    } finally {
      setAuthToken(null);
      setUser(null);
    }
  }, []);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.productId === item.productId);
      if (existing) {
        return prev.map((p) =>
          p.productId === item.productId ? { ...p, quantity: p.quantity + 1 } : p,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const updateCartQty = useCallback((productId: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((p) => p.productId !== productId);
      return prev.map((p) => (p.productId === productId ? { ...p, quantity: qty } : p));
    });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  }, []);

  const isAdminRole = user !== null && isAdminPanelRole(user.role);

  return (
    <AppContext.Provider
      value={{
        user,
        sessionReady,
        setSession,
        refreshUser,
        logout,
        logoutAll,
        isAdminRole,
        siteData,
        refreshSiteData,
        cart,
        wishlist,
        addToCart,
        updateCartQty,
        clearCart,
        toggleWishlist,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
}
