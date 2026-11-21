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
    <div className="bg-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden helzerx-hero-aura pt-20 pb-24 md:pt-28 md:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[440px] left-1/2 -translate-x-1/2 w-[165%] h-[540px] rounded-[100%] bg-black border-t border-violet-300/40 shadow-[0_-20px_80px_rgba(167,139,250,0.35)]"
        />

        <div className="relative z-10 max-w-[1040px] mx-auto px-6 text-center">
          <div className="text-xs md:text-sm font-medium text-violet-200/85 mb-6">
            <span>HelzerX Shop</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Enterprise Hardware</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Digital Licenses</span>
            <span aria-hidden="true" className="mx-2 text-cyan-400/70">·</span>
            <span>Coupon: HELZERX2027 (15% Off)</span>
          </div>

          <h1 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-extrabold tracking-[-0.03em] leading-[1.04] text-white max-w-[18ch] mx-auto">
            Engineered Hardware &amp; Software Kits
          </h1>
          <p className="mt-6 max-w-[58ch] mx-auto text-base md:text-lg leading-[1.6] text-neutral-200/90">
            Direct enterprise store with live inventory, verified customer reviews, wishlist, coupon
            support, and tracked invoice generation.
          </p>
        </div>
      </section>

      {/* Catalog + Cart */}
      <section className="bg-black py-14 md:py-20">
        <div className="max-w-[1260px] mx-auto px-6">
          {/* Filter / Search / Sort Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-8 border-b border-white/[0.08]">
            <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white/[0.05] border border-white/[0.1]">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    category === cat
                      ? 'bg-white text-black'
                      : 'text-neutral-300 hover:text-white hover:bg-white/[0.06]'
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
                  className="pl-9 pr-3 py-2 rounded-lg bg-[#08080F] border border-white/[0.12] text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-400"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')}
                aria-label="Sort products"
                className="px-3 py-2 rounded-lg bg-[#08080F] border border-white/[0.12] text-xs text-white focus:outline-none focus:border-violet-400"
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
              <div className="py-16 flex items-center justify-center gap-2 text-sm text-neutral-400">
                <Loader2 className="w-4 h-4 animate-spin text-violet-300" />
                <span>Loading Shop catalog...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visibleProducts.map((product) => {
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
                    <article
                      key={product.id}
                      className="flex flex-col justify-between rounded-2xl bg-[#08080C] border border-white/[0.1] p-7"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono text-cyan-300">{product.category}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-neutral-400 tabular-nums">
                              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleWishlist(product.id)}
                              aria-label="Toggle wishlist"
                              className={`p-1 rounded transition-colors cursor-pointer ${
                                wished ? 'text-rose-400' : 'text-neutral-500 hover:text-white'
                              }`}
                            >
                              <Heart className="w-4 h-4" fill={wished ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                        </div>

                        <h2 className="mt-3 text-lg font-bold text-white">{product.name}</h2>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-mono text-2xl font-bold text-white tabular-nums">
                            ${product.price_usd.toLocaleString()}
                          </span>
                          {avgRating && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-300 font-mono">
                              <Star className="w-3.5 h-3.5" fill="currentColor" />
                              {avgRating} ({productReviews.length})
                            </span>
                          )}
                        </div>

                        <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
                          {product.summary}
                        </p>

                        <div className="mt-5 pt-4 border-t border-white/[0.08] flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-300">
                          {specs.map((spec, idx) => (
                            <span key={spec} className="inline-flex items-center gap-2">
                              <span>{spec}</span>
                              {idx < specs.length - 1 && (
                                <span aria-hidden="true" className="text-neutral-600">·</span>
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
                          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{inCart > 0 ? `Add Another (${inCart})` : 'Add to Cart'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(product)}
                          className="px-3.5 py-2.5 text-xs font-semibold text-neutral-200 border border-white/15 rounded-lg hover:border-white/30 cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Cart & Real Order Checkout Sidebar */}
            <aside className="rounded-2xl bg-[#0B0B12] border border-white/[0.12] p-6 lg:sticky lg:top-24 space-y-5">
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <ShoppingBag className="w-4 h-4 text-violet-300" />
                  <span>Shopping Cart</span>
                </div>
                <span className="text-xs font-mono text-neutral-400 tabular-nums">
                  {cart.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              </div>

              {orderConfirmation && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Order {orderConfirmation.orderId}</span>
                  </div>
                  <div className="font-mono text-neutral-200">
                    Invoice: {orderConfirmation.invoiceNumber} · ${orderConfirmation.totalUsd.toLocaleString()}
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    {orderConfirmation.paymentNotice}
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('dashboard')}
                    className="text-cyan-300 font-semibold hover:text-white cursor-pointer"
                  >
                    View Order in Dashboard →
                  </button>
                </div>
              )}

              {cart.length === 0 ? (
                <p className="py-6 text-xs text-neutral-400 text-center">
                  Your cart is empty. Add hardware or software licenses from the catalog.
                </p>
              ) : (
                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-start justify-between gap-3 py-2 border-b border-white/[0.06]"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{item.name}</div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400 font-mono tabular-nums">
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                              className="w-5 h-5 rounded bg-white/10 text-white cursor-pointer"
                            >
                              -
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                              className="w-5 h-5 rounded bg-white/10 text-white cursor-pointer"
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
                          className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer"
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
                          className="w-full pl-8 pr-2.5 py-2 rounded-lg bg-black border border-white/[0.12] text-xs text-white uppercase focus:outline-none focus:border-violet-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleApplyCoupon()}
                        className="px-3 py-2 text-xs font-semibold text-white bg-white/[0.08] border border-white/15 rounded-lg hover:bg-white/[0.15] cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                    {couponMsg && <p className="text-xs text-cyan-300">{couponMsg}</p>}
                  </div>

                  {/* Shipping / Billing Address */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Shipping / Billing Address
                    </label>
                    <textarea
                      rows={2}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Street, City, Country, Postal Code"
                      className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-400"
                    />
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-white/[0.08] text-xs">
                    <div className="flex justify-between text-neutral-400">
                      <span>Subtotal</span>
                      <span className="font-mono tabular-nums">${subtotal.toLocaleString()}</span>
                    </div>
                    {discountUsd > 0 && (
                      <div className="flex justify-between text-cyan-300">
                        <span>Discount ({appliedCoupon?.code})</span>
                        <span className="font-mono tabular-nums">-${discountUsd.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-white pt-1">
                      <span>Total</span>
                      <span className="font-mono tabular-nums">${totalUsd.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-neutral-400 leading-relaxed bg-black/50 border border-white/[0.07] rounded-lg p-2.5">
                    {stripeConfigured
                      ? 'Stripe billing enabled. Order creates an invoice awaiting Stripe confirmation.'
                      : 'Note: STRIPE_SECRET_KEY is not configured yet. Orders save with status pending_payment & unpaid invoice—never fake-charged.'}
                  </div>

                  {checkoutError && (
                    <p role="alert" className="text-xs text-rose-400 font-medium">
                      {checkoutError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={checkoutSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 disabled:opacity-60 transition-colors cursor-pointer"
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
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0A0A12] border border-white/[0.15] p-6 md:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-cyan-300">{selectedProduct.category}</div>
                <h3 className="mt-1 text-2xl font-bold text-white">{selectedProduct.name}</h3>
                <div className="mt-2 font-mono text-xl font-bold text-white tabular-nums">
                  ${selectedProduct.price_usd.toLocaleString()} · {selectedProduct.stock} units available
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                aria-label="Close product details"
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed">{selectedProduct.summary}</p>

            <div className="pt-4 border-t border-white/[0.08]">
              <h4 className="text-sm font-bold text-white mb-3">
                Customer Reviews ({selectedReviews.length})
              </h4>
              {selectedReviews.length === 0 ? (
                <p className="text-xs text-neutral-400">No verified customer reviews yet.</p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {selectedReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-lg bg-black/60 border border-white/[0.08] p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{rev.author_name}</span>
                        <span className="font-mono text-amber-300">{rev.rating} / 5 ★</span>
                      </div>
                      <p className="mt-1 text-neutral-300">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="mt-4 space-y-3 pt-4 border-t border-white/[0.08]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-neutral-300">Write a Review</span>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="rounded bg-black border border-white/[0.12] px-2.5 py-1 text-xs text-white"
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
                  className="w-full rounded-lg bg-black border border-white/[0.12] px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-400"
                />
                {reviewError && <p className="text-xs text-rose-400">{reviewError}</p>}
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 text-xs font-semibold text-black bg-white rounded-lg hover:bg-neutral-200 cursor-pointer"
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
