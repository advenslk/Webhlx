import { FormEvent, useState } from 'react';
import { apiRequest } from '../lib/api';
import { PageRoute, ROUTE_PATHS } from '../types/navigation';

interface FooterProps {
  onNavigate: (route: PageRoute) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const [email, setEmail] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLink = (e: React.MouseEvent, route: PageRoute) => {
    e.preventDefault();
    onNavigate(route);
  };

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    setIsError(false);
    try {
      const res = await apiRequest<{ message: string }>('/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setStatusMsg(res.message);
      setEmail('');
    } catch (err) {
      setIsError(true);
      setStatusMsg(err instanceof Error ? err.message : 'Unable to subscribe.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-white border-t border-black/[0.08] py-16 text-[#0A0A0B]">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.4fr] gap-10">
          {/* Brand */}
          <div className="space-y-3">
            <a
              href={ROUTE_PATHS.home}
              onClick={(e) => handleLink(e, 'home')}
              className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-[#0A0A0B]"
            >
              <img
                src="/assets/aistudio/IMG_20261011_201132-removebg-preview_9b5f47c8.png"
                alt="HelzerX Technologies"
                className="h-6 w-auto object-contain shrink-0"
              />
              <span>helzerx.</span>
            </a>
            <p className="text-xs leading-relaxed text-neutral-600 max-w-xs">
              Cloud infrastructure, creative product engineering studio, and hardware &amp; digital
              commerce unified at https://helzerx.cyou.
            </p>
            <p className="text-xs font-medium text-neutral-500 tabular-nums">
              Global Launch · January 1, 2027
            </p>
          </div>

          {/* Ecosystem */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#0A0A0B]">Platform</div>
            <ul className="space-y-2 text-xs text-neutral-600">
              {[
                ['Products', 'products'],
                ['HelzerX Cloud', 'cloud'],
                ['HelzerX Studio', 'studio'],
                ['HelzerX Shop', 'shop'],
                ['Solutions', 'solutions'],
                ['Pricing', 'pricing'],
              ].map(([label, r]) => (
                <li key={r}>
                  <a
                    href={ROUTE_PATHS[r as PageRoute]}
                    onClick={(e) => handleLink(e, r as PageRoute)}
                    className="hover:text-[#0A0A0B] transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#0A0A0B]">Company</div>
            <ul className="space-y-2 text-xs text-neutral-600">
              {[
                ['About Us', 'about'],
                ['Launch 01.01.2027', 'launch'],
                ['Partners', 'partners'],
                ['Careers', 'careers'],
                ['Community', 'community'],
                ['Blog', 'blog'],
              ].map(([label, r]) => (
                <li key={r}>
                  <a
                    href={ROUTE_PATHS[r as PageRoute]}
                    onClick={(e) => handleLink(e, r as PageRoute)}
                    className="hover:text-[#0A0A0B] transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Legal */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#0A0A0B]">Support &amp; Legal</div>
            <ul className="space-y-2 text-xs text-neutral-600">
              {[
                ['Support Center', 'support'],
                ['Contact Us', 'contact'],
                ['Customer Portal', 'dashboard'],
                ['Terms of Service', 'terms'],
                ['Privacy Policy', 'privacy'],
                ['SLA & Refund Policy', 'sla'],
              ].map(([label, r]) => (
                <li key={r}>
                  <a
                    href={ROUTE_PATHS[r as PageRoute]}
                    onClick={(e) => handleLink(e, r as PageRoute)}
                    className="hover:text-[#0A0A0B] transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#0A0A0B]">Release Updates</div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Receive January 1, 2027 launch briefings, infrastructure notes, and product drops.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  aria-label="Newsletter email"
                  className="flex-1 min-w-0 rounded-lg bg-[#F4F4F5] border border-black/[0.12] px-3 py-2 text-xs text-[#0A0A0B] placeholder:text-neutral-500 focus:outline-none focus:border-black"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0A0A0B] rounded-lg hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? '...' : 'Join'}
                </button>
              </div>
              {statusMsg && (
                <p className={`text-[11px] font-medium ${isError ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {statusMsg}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-black/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-neutral-500">
          <span className="tabular-nums">
            © {new Date().getFullYear()} HelzerX Technologies · https://helzerx.cyou
          </span>
          <span>Cloud · Studio · Shop · Unified Account</span>
        </div>
      </div>
    </footer>
  );
}
