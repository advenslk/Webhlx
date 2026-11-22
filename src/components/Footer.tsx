import { Mail, Phone } from 'lucide-react';
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
            <div className="mt-4 rounded-xl bg-[#F4F4F5] border border-black/[0.08] p-3.5 max-w-xs space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Direct Contact
              </div>
              <div className="flex flex-col gap-1.5 text-xs">
                <a
                  href="tel:+94781810179"
                  className="inline-flex items-center gap-2 font-semibold text-[#0A0A0B] hover:text-neutral-600 transition-colors tabular-nums"
                >
                  <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" aria-hidden="true" />
                  <span>+94781810179</span>
                </a>
                <a
                  href="mailto:support@helzerx.cyou"
                  className="inline-flex items-center gap-2 font-semibold text-[#0A0A0B] hover:text-neutral-600 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" aria-hidden="true" />
                  <span>support@helzerx.cyou</span>
                </a>
              </div>
            </div>
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

        {/* Tactile 3D Social Channels Row */}
        <div className="mt-12 pt-8 border-t border-black/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="text-xs font-bold text-[#0A0A0B]">Connect With HelzerX</div>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              Follow official product drops, infrastructure announcements, and direct channels.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {[
              {
                name: 'Discord',
                href: 'https://discord.gg/helzerx',
                icon: (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 fill-[#5865F2]">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
                  </svg>
                ),
              },
              {
                name: 'YouTube',
                href: 'https://youtube.com/@helzerx',
                icon: (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 fill-[#FF0000]">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
                  </svg>
                ),
              },
              {
                name: 'X',
                href: 'https://x.com/helzerx',
                icon: (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#0A0A0B]">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                  </svg>
                ),
              },
              {
                name: 'Facebook',
                href: 'https://facebook.com/helzerx',
                icon: (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 fill-[#1877F2]">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
                  </svg>
                ),
              },
              {
                name: 'TikTok',
                href: 'https://tiktok.com/@helzerx',
                icon: (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 fill-[#0A0A0B]">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1Z" />
                  </svg>
                ),
              },
              {
                name: 'Skype',
                href: 'https://join.skype.com',
                icon: (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 fill-[#00AFF0]">
                    <path d="M22.39 14.37c.11-.76.17-1.56.17-2.37 0-5.83-4.73-10.56-10.56-10.56-.81 0-1.61.06-2.37.17A6.11 6.11 0 0 0 6.11.44C2.74.44 0 3.18 0 6.55c0 1.27.39 2.45 1.06 3.43-.11.76-.17 1.56-.17 2.37 0 5.83 4.73 10.56 10.56 10.56.81 0 1.61-.06 2.37-.17a6.11 6.11 0 0 0 3.52 1.17c3.37 0 6.11-2.74 6.11-6.11 0-1.27-.39-2.45-1.06-3.43ZM12.1 18.23c-3.49 0-5.05-1.72-5.05-3.01 0-.66.49-1.13 1.17-1.13 1.51 0 1.12 2.17 3.88 2.17 1.42 0 2.2-.77 2.2-1.56 0-.47-.23-.99-1.17-1.22l-3.09-.77c-2.49-.62-2.94-1.97-2.94-3.24 0-2.63 2.47-3.62 4.8-3.62 2.14 0 4.66 1.18 4.66 2.76 0 .68-.59 1.08-1.26 1.08-1.29 0-1.05-1.78-3.57-1.78-1.28 0-1.98.58-1.98 1.4 0 .82.99 1.08 1.85 1.28l2.29.51c2.51.56 3.15 2.03 3.15 3.41 0 2.13-1.64 3.73-4.94 3.73Z" />
                  </svg>
                ),
              },
              {
                name: 'WhatsApp',
                href: 'https://wa.me/94781810179',
                icon: (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]">
                    <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5l-1.406 5.156 5.281-1.375a9.927 9.927 0 0 0 4.75 1.203h.004c5.512 0 9.965-4.453 9.965-9.969C22 6.453 17.547 2 12.031 2Zm5.8 14.125c-.246.695-1.434 1.328-1.988 1.406-.508.074-1.152.106-1.859-.117-.43-.137-.98-.32-1.688-.625-2.969-1.281-4.906-4.266-5.055-4.465-.148-.199-1.207-1.605-1.207-3.062 0-1.457.766-2.172 1.039-2.469.273-.297.594-.371.793-.371.199 0 .398.004.57.012.184.008.43-.07.672.512.246.594.84 2.051.914 2.199.074.148.125.324.023.523-.102.199-.148.324-.297.496-.148.172-.312.387-.445.52-.148.148-.305.309-.133.605.172.297.766 1.262 1.645 2.043 1.129 1.008 2.082 1.32 2.379 1.469.297.148.469.125.641-.074.172-.199.742-.867.941-1.164.199-.297.398-.246.672-.148.273.098 1.734.816 2.031.965.297.148.496.223.57.348.074.125.074.723-.172 1.418Z" />
                  </svg>
                ),
              },
              {
                name: 'Instagram',
                href: 'https://instagram.com/helzerx',
                icon: (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 fill-[#E4405F]">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
                  </svg>
                ),
              },
            ].map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                title={social.name}
                className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-b from-white to-[#ECECF2] border border-black/[0.1] text-xs font-semibold text-[#0A0A0B] shadow-[0_3px_0_#C8C8D4,0_8px_16px_rgba(10,10,16,0.08),inset_0_1px_0_#ffffff] hover:-translate-y-0.5 hover:shadow-[0_4px_0_#BFBFCF,0_12px_20px_rgba(10,10,16,0.12),inset_0_1px_0_#ffffff] active:translate-y-[2px] active:shadow-[0_1px_0_#C8C8D4,0_4px_8px_rgba(10,10,16,0.06)] transition-all duration-150"
              >
                <span className="transition-transform duration-150 group-hover:scale-110">
                  {social.icon}
                </span>
                <span>{social.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Tactile 3D Payment Methods Row */}
        <div className="mt-8 pt-6 border-t border-black/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-[#0A0A0B]">We Accept</div>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              Verified local bank transfers, mobile wallets, global cards, and crypto settlements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                name: 'eZ Cash',
                icon: (
                  <span className="inline-flex items-center justify-center w-5 h-4 rounded bg-gradient-to-br from-[#D90429] to-[#9B001C] text-[9px] font-black tracking-tighter text-white">
                    eZ
                  </span>
                ),
              },
              {
                name: 'Sampath Bank',
                icon: (
                  <span className="inline-flex items-center justify-center w-5 h-4 rounded bg-gradient-to-br from-[#F37021] to-[#C84B08] text-[9px] font-black text-white">
                    SB
                  </span>
                ),
              },
              {
                name: 'LankaQR',
                icon: (
                  <span className="inline-flex items-center justify-center w-5 h-4 rounded bg-gradient-to-br from-[#0F4C81] to-[#082E52] text-[8px] font-black text-white">
                    QR
                  </span>
                ),
              },
              {
                name: 'Visa',
                icon: (
                  <svg aria-hidden="true" viewBox="0 0 32 16" className="w-6 h-3.5">
                    <text
                      x="1"
                      y="13"
                      fill="#1A1F71"
                      fontFamily="system-ui, sans-serif"
                      fontWeight="900"
                      fontStyle="italic"
                      fontSize="12"
                    >
                      VISA
                    </text>
                  </svg>
                ),
              },
              {
                name: 'Mastercard',
                icon: (
                  <svg aria-hidden="true" viewBox="0 0 26 16" className="w-6 h-4">
                    <circle cx="9.5" cy="8" r="6" fill="#EB001B" />
                    <circle cx="16.5" cy="8" r="6" fill="#F79E1B" fillOpacity="0.9" />
                  </svg>
                ),
              },
              {
                name: 'Stripe',
                icon: (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-[#635BFF] text-[9px] font-black text-white">
                    S
                  </span>
                ),
              },
              {
                name: 'PayPal',
                icon: (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-[#003087] text-[9px] font-black italic text-white">
                    P
                  </span>
                ),
              },
              {
                name: 'Binance Pay',
                icon: (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 fill-[#F0B90B]">
                    <path d="m12 3 4.2 4.2-1.9 1.9L12 6.8 9.7 9.1 7.8 7.2 12 3Zm-6.8 6.8 1.9 1.9-1.9 1.9-1.9-1.9 1.9-1.9Zm13.6 0 1.9 1.9-1.9 1.9-1.9-1.9 1.9-1.9ZM12 9.9l2.1 2.1L12 14.1 9.9 12 12 9.9Zm0 7.3 2.3-2.3 1.9 1.9L12 21l-4.2-4.2 1.9-1.9 2.3 2.3Z" />
                  </svg>
                ),
              },
              {
                name: 'Bitcoin',
                icon: (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4">
                    <circle cx="12" cy="12" r="10.5" fill="#F7931A" />
                    <text
                      x="12"
                      y="16"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontFamily="system-ui, sans-serif"
                      fontWeight="800"
                      fontSize="12"
                    >
                      ₿
                    </text>
                  </svg>
                ),
              },
              {
                name: 'USDT (Crypto)',
                icon: (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4">
                    <circle cx="12" cy="12" r="10.5" fill="#26A17B" />
                    <text
                      x="12"
                      y="16"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontFamily="system-ui, sans-serif"
                      fontWeight="800"
                      fontSize="11"
                    >
                      ₮
                    </text>
                  </svg>
                ),
              },
            ].map((method) => (
              <div
                key={method.name}
                title={method.name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-b from-white to-[#ECECF2] border border-black/[0.1] text-[11px] font-bold text-[#0A0A0B] shadow-[0_3px_0_#C8C8D4,0_7px_14px_rgba(10,10,16,0.07),inset_0_1px_0_#ffffff] hover:-translate-y-0.5 hover:shadow-[0_4px_0_#BFBFCF,0_10px_18px_rgba(10,10,16,0.11),inset_0_1px_0_#ffffff] transition-all duration-150 select-none"
              >
                {method.icon}
                <span>{method.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-black/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-neutral-500">
          <span className="tabular-nums">
            © {new Date().getFullYear()} HelzerX Technologies · https://helzerx.cyou
          </span>
          <span>Cloud · Studio · Shop · Unified Account</span>
        </div>
      </div>
    </footer>
  );
}
