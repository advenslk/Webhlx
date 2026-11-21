import {
  CheckCircle2,
  Heart,
  Loader2,
  Plus,
  Search,
  ShoppingBag,
  Star,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { DivisionBanner3D } from '../components/DivisionBanner3D';
import { Surface3D } from '../components/Surface3D';
import { useAppContext } from '../context/AppContext';
import { ApiError, apiRequest } from '../lib/api';
import { PageRoute } from '../types/navigation';

interface ProductRecord {
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
  featured: number;
}

interface ReviewRecord {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ShopPageProps {
  onNavigate: (route: PageRoute, division?: 'shop') => void;
}

export function ShopPage({ onNavigate }: ShopPageProps) {
  const { user, cart, wishlist, addToCart, updateCartQty, clearCart, toggleWishlist } =
    useAppContext();

  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  // Product detail modal + reviews
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Coupon & Checkout state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(
    null,
  );
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [orderConfirmation, setOrderConfirmation] = useState<{
    orderId: string;
    invoiceNumber: string;
    totalUsd: number;
    paymentNotice: string;
  } | null>(null);

  const loadCatalog = useCallback(async () => {
    try {
      const res = await apiRequest<{
        products: ProductRecord[];
        reviews: ReviewRecord[];
        stripeConfigured: boolean;
      }>('/api/shop/products');
      setProducts(res.products || []);
      setReviews(res.reviews || []);
      setStripeConfigured(Boolean(res.stripeConfigured));
    } catch {
      // ignore transient
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  );

  const visibleProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = products.filter((p) => {
      const matchCat = category === 'All' || p.category === category;
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
    if (sortBy === 'price-asc') {
      return [...filtered].sort((a, b) => a.price_usd - b.price_usd);
    }
    if (sortBy === 'price-desc') {
      return [...filtered].sort((a, b) => b.price_usd - a.price_usd);
    }
    return filtered;
  }, [products, category, searchQuery, sortBy]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.priceUsd * item.quantity, 0),
    [cart],
  );

  const discountUsd = useMemo(() => {
    if (!appliedCoupon) return 0;
    return Math.round(subtotal * (appliedCoupon.discountPercent / 100) * 100) / 100;
  }, [subtotal, appliedCoupon]);

  const totalUsd = Math.max(0, Math.round((subtotal - discountUsd) * 100) / 100);

  const handleApplyCoupon = async () => {
    setCouponMsg(null);
    if (!couponInput.trim()) return;
    try {
      const res = await apiRequest<{ valid: boolean; code: string; discountPercent: number }>(
        '/api/shop/coupons/validate',
        {
          method: 'POST',
          body: JSON.stringify({ code: couponInput.trim() }),
        },
      );
      setAppliedCoupon({ code: res.code, discountPercent: res.discountPercent });
      setCouponMsg(`Applied ${res.code} (-${res.discountPercent}%)`);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMsg(err instanceof ApiError ? err.message : 'Coupon invalid.');
    }
  };

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    if (!user) {
      onNavigate('auth');
      return;
    }
    if (cart.length === 0) {
      setCheckoutError('Your cart is empty.');
      return;
    }
    if (shippingAddress.trim().length < 6) {
      setCheckoutError('Enter a complete billing or shipping address.');
      return;
    }

    setCheckoutSubmitting(true);
    try {
      const res = await apiRequest<{
        order: { id: string; total_usd: number };
        invoice: { invoice_number: string };
        paymentNotice: string;
      }>('/api/shop/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
          shippingAddress: shippingAddress.trim(),
          couponCode: appliedCoupon?.code || '',
        }),
      });
      clearCart();
      setAppliedCoupon(null);
      setCouponInput('');
      setShippingAddress('');
      setOrderConfirmation({
        orderId: res.order.id,
        invoiceNumber: res.invoice.invoice_number,
        totalUsd: res.order.total_usd,
        paymentNotice: res.paymentNotice,
      });
      await loadCatalog();
    } catch (err) {
      setCheckoutError(err instanceof ApiError ? err.message : 'Checkout failed.');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setReviewError(null);
    if (!user) {
      onNavigate('auth');
      return;
    }
    setSubmittingReview(true);
    try {
      await apiRequest(`/api/shop/products/${selectedProduct.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });
      setReviewComment('');
      await loadCatalog();
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : 'Unable to post review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const selectedReviews = selectedProduct
    ? reviews.filter((r) => r.product_id === selectedProduct.id)
    : [];

  return (
    <div className="bg-[#F4F4F5] text-[#0A0A0B]">
      {/* Smooth Full-Bleed Atmospheric Shop Banner Background + Floating 3D Cards */}
      <DivisionBanner3D
        imageSrc="/assets/aistudio/file_00000000ca6c821196ff7de47bf63b50_2269b23b.png"
        imageAlt="HelzerX SHOP — Premium Store Background Banner"
        divisionLabel="HelzerX Shop · Enterprise Hardware · Software Kits · Code HELZERX2027 (15% Off)"
        description="Direct enterprise storefront with live inventory counts, verified buyer reviews, coupon savings, and automatic invoice tracking."
        fallbackTitle="HelzerX Shop"
        fallbackSubtitle="Premium Store · Enterprise Hardware & Software Licenses"
        icon={<ShoppingBag className="w-6 h-6" />}
        actions={
          <>
            <a
              href="#shop-catalog"
              className="px-6 py-3 text-sm font-semibold text-white bg-[#0A0A0B] rounded-xl hover:bg-neutral-800 transition-colors shadow-[0_10px_24px_rgba(10,10,11,0.18)] cursor-pointer"
            >
              Browse Hardware &amp; Kits
            </a>
            <button
              type="button"
              onClick={() => onNavigate(user ? 'dashboard' : 'auth')}
              className="px-6 py-3 text-sm font-semibold text-[#0A0A0B] bg-white border border-black/15 rounded-xl hover:border-black/35 transition-colors shadow-sm cursor-pointer"
            >
              {user ? 'View Order Invoices' : 'Sign In for Checkout'}
            </button>
          </>
        }
        specs={[
          {
            value: 'Live Sync',
            label: 'Stock Ledger',
            detail: 'Real-time database inventory validation on every cart checkout.',
          },
          {
            value: '15% Off',
            label: 'Code HELZERX2027',
            detail: 'Validated server-side coupon deductions across hardware and kits.',
          },
          {
            value: 'Verified',
            label: 'Customer Reviews',
            detail: 'Authentic buyer ratings attached to active storefront items.',
          },
          {
            value: 'Tracked',
            label: 'Itemized Invoices',
            detail: 'Instant invoice numbering saved inside your unified dashboard.',
          },
        ]}
      />

      {/* Catalog + Cart */}
      <section id="shop-catalog" className="bg-[#F4F4F5] py-12 md:py-18">
        <div className="max-w-[1260px] mx-auto px-6">
          {/* Filter / Search / Sort Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-8 border-b border-black/[0.08]">
            <div className="inline-flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-white border border-black/[0.08] shadow-sm">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    category === cat
                      ? 'bg-[#0A0A0B] text-white'
                      : 'text-neutral-600 hover:text-[#0A0A0B] hover:bg-neutral-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hardware or kits..."
                  className="pl-9 pr-3 py-2 rounded-xl bg-white border border-black/[0.12] text-xs text-[#0A0A0B] placeholder:text-neutral-400 focus:outline-none focus:border-black"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')}
                aria-label="Sort products"
                className="px-3 py-2 rounded-xl bg-white border border-black/[0.12] text-xs text-[#0A0A0B] focus:outline-none focus:border-black"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
            {/* Products Grid */}
            {loading ? (
              <div className="py-16 flex items-center justify-center gap-2 text-sm text-neutral-600">
                <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0B]" />
                <span>Loading Shop catalog...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visibleProducts.map((product, idx) => {
                  let specs: string[] = [];
                  try {
                    specs = JSON.parse(product.specs_json || '[]');
                  } catch {
                    specs = [];
                  }
                  const inCart = cart.find((c) => c.productId === product.id)?.quantity ?? 0;
                  const wished = wishlist.includes(product.id);
                  const productReviews = reviews.filter((r) => r.product_id === product.id);
                  const avgRating =
                    productReviews.length > 0
                      ? (
                          productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length
                        ).toFixed(1)
                      : null;

                  return (
                    <Surface3D key={product.id} intensity={12} delay={idx * 0.05}>
                      <article className="h-full flex flex-col justify-between p-7 text-left">
                        <div>
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-neutral-500">{product.category}</span>
                            <div className="flex items-center gap-2.5">
                              <span className="text-neutral-500 tabular-nums">
                                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleWishlist(product.id)}
                                aria-label="Toggle wishlist"
                                className={`p-1 rounded transition-colors cursor-pointer ${
                                  wished ? 'text-rose-500' : 'text-neutral-400 hover:text-[#0A0A0B]'
                                }`}
                              >
                                <Heart className="w-4 h-4" fill={wished ? 'currentColor' : 'none'} />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="text-3xl font-extrabold text-[#0A0A0B] tabular-nums tracking-tight">
                              ${product.price_usd.toLocaleString()}
                            </span>
                            {avgRating && (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-semibold tabular-nums">
                                <Star className="w-3.5 h-3.5" fill="currentColor" />
                                {avgRating} ({productReviews.length})
                              </span>
                            )}
                          </div>

                          <div className="mt-4 pt-4 border-t border-black/[0.08]">
                            <h2 className="text-lg font-bold text-[#0A0A0B] leading-snug">
                              {product.name}
                            </h2>
                            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                              {product.summary}
                            </p>
                          </div>

                          <div className="mt-5 pt-4 border-t border-black/[0.06] flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-700">
                            {specs.map((spec, i) => (
                              <span key={spec} className="inline-flex items-center gap-2">
                                <span>{spec}</span>
                                {i < specs.length - 1 && (
                                  <span aria-hidden="true" className="text-neutral-400">·</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-6 flex gap-2">
                          <button
                            type="button"
                            disabled={product.stock <= 0}
                            onClick={() =>
                              addToCart({
                                productId: product.id,
                                name: product.name,
                                priceUsd: product.price_usd,
                              })
                            }
                            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-[#0A0A0B] rounded-xl hover:bg-neutral-800 disabled:opacity-40 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{inCart > 0 ? `Add Another (${inCart})` : 'Add to Cart'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(product)}
                            className="px-3.5 py-2.5 text-xs font-semibold text-[#0A0A0B] border border-black/15 rounded-xl hover:border-black/35 cursor-pointer"
                          >
                            Details
                          </button>
                        </div>
                      </article>
                    </Surface3D>
                  );
                })}
              </div>
            )}

            {/* Cart & Real Order Checkout Sidebar */}
            <aside className="helzerx-studio-card rounded-[22px] border border-black/[0.08] p-6 lg:sticky lg:top-24 space-y-5">
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-black/[0.08]">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0A0A0B]">
                  <ShoppingBag className="w-4 h-4 text-[#0A0A0B]" />
                  <span>Shopping Cart</span>
                </div>
                <span className="text-xs font-medium text-neutral-600 tabular-nums">
                  {cart.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              </div>

              {orderConfirmation && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Order {orderConfirmation.orderId}</span>
                  </div>
                  <div className="font-semibold text-[#0A0A0B]">
                    Invoice: {orderConfirmation.invoiceNumber} · $
                    {orderConfirmation.totalUsd.toLocaleString()}
                  </div>
                  <p className="text-neutral-700 leading-relaxed">
                    {orderConfirmation.paymentNotice}
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('dashboard')}
                    className="text-[#0A0A0B] font-bold hover:underline cursor-pointer"
                  >
                    View Order in Dashboard →
                  </button>
                </div>
              )}

              {cart.length === 0 ? (
                <p className="py-6 text-xs text-neutral-600 text-center">
                  Your cart is empty. Add hardware or software licenses from the catalog.
                </p>
              ) : (
                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-start justify-between gap-3 py-2 border-b border-black/[0.06]"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#0A0A0B] truncate">
                            {item.name}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-neutral-600 tabular-nums">
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                              className="w-5 h-5 rounded bg-neutral-200 text-[#0A0A0B] font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                              className="w-5 h-5 rounded bg-neutral-200 text-[#0A0A0B] font-bold cursor-pointer"
                            >
                              +
                            </button>
                            <span>× ${item.priceUsd.toLocaleString()}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.productId, 0)}
                          aria-label={`Remove ${item.name}`}
                          className="text-neutral-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Coupon */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder="Coupon (HELZERX2027)"
                          className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-[#F8F8FA] border border-black/[0.12] text-xs text-[#0A0A0B] uppercase focus:outline-none focus:border-black"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleApplyCoupon()}
                        className="px-3 py-2 text-xs font-semibold text-[#0A0A0B] bg-[#F4F4F5] border border-black/15 rounded-xl hover:bg-neutral-200 cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                    {couponMsg && <p className="text-xs font-semibold text-[#0A0A0B]">{couponMsg}</p>}
                  </div>

                  {/* Shipping / Billing Address */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0A0A0B] mb-1.5">
                      Shipping / Billing Address
                    </label>
                    <textarea
                      rows={2}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Street, City, Country, Postal Code"
                      className="w-full rounded-xl bg-[#F8F8FA] border border-black/[0.12] px-3 py-2 text-xs text-[#0A0A0B] focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-black/[0.08] text-xs">
                    <div className="flex justify-between text-neutral-600">
                      <span>Subtotal</span>
                      <span className="tabular-nums">${subtotal.toLocaleString()}</span>
                    </div>
                    {discountUsd > 0 && (
                      <div className="flex justify-between text-[#0A0A0B] font-semibold">
                        <span>Discount ({appliedCoupon?.code})</span>
                        <span className="tabular-nums">-${discountUsd.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-extrabold text-[#0A0A0B] pt-1">
                      <span>Total</span>
                      <span className="tabular-nums">${totalUsd.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-neutral-600 leading-relaxed bg-[#F8F8FA] border border-black/[0.08] rounded-xl p-2.5">
                    {stripeConfigured
                      ? 'Stripe billing enabled. Order creates an invoice awaiting Stripe confirmation.'
                      : 'Note: Stripe live key is not configured yet. Orders save with pending payment & unpaid invoice.'}
                  </div>

                  {checkoutError && (
                    <p role="alert" className="text-xs text-rose-700 font-medium">
                      {checkoutError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={checkoutSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-[#0A0A0B] rounded-xl hover:bg-neutral-800 disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {checkoutSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{user ? 'Create Order & Invoice' : 'Sign In to Checkout'}</span>
                  </button>
                </form>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* Product Detail & Reviews Modal */}
      {selectedProduct && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[24px] bg-white border border-black/[0.12] shadow-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-neutral-500">
                  {selectedProduct.category}
                </div>
                <h3 className="mt-1 text-2xl font-bold text-[#0A0A0B]">{selectedProduct.name}</h3>
                <div className="mt-2 text-xl font-extrabold text-[#0A0A0B] tabular-nums">
                  ${selectedProduct.price_usd.toLocaleString()} · {selectedProduct.stock} units
                  available
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                aria-label="Close product details"
                className="p-2 rounded-xl text-neutral-500 hover:text-[#0A0A0B] hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-neutral-700 leading-relaxed">{selectedProduct.summary}</p>

            <div className="pt-4 border-t border-black/[0.08]">
              <h4 className="text-sm font-bold text-[#0A0A0B] mb-3">
                Customer Reviews ({selectedReviews.length})
              </h4>
              {selectedReviews.length === 0 ? (
                <p className="text-xs text-neutral-600">No verified customer reviews yet.</p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {selectedReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-xl bg-[#F8F8FA] border border-black/[0.08] p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#0A0A0B]">{rev.author_name}</span>
                        <span className="font-bold text-amber-700 tabular-nums">
                          {rev.rating} / 5 ★
                        </span>
                      </div>
                      <p className="mt-1 text-neutral-700">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={handleSubmitReview}
                className="mt-4 space-y-3 pt-4 border-t border-black/[0.08]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-[#0A0A0B]">Write a Review</span>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="rounded-lg bg-[#F8F8FA] border border-black/[0.12] px-2.5 py-1 text-xs text-[#0A0A0B]"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} Stars
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  rows={2}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={user ? 'Share hardware or kit feedback...' : 'Sign in to leave a review'}
                  className="w-full rounded-xl bg-[#F8F8FA] border border-black/[0.12] px-3 py-2 text-xs text-[#0A0A0B] focus:outline-none focus:border-black"
                />
                {reviewError && <p className="text-xs text-rose-700 font-medium">{reviewError}</p>}
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-xl hover:bg-neutral-800 cursor-pointer"
                >
                  {user ? 'Post Review' : 'Sign In to Review'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
