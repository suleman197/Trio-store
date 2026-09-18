import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, CreditCard, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { newsletterApi } from '../../services';
import useSiteSettings from '../../hooks/useSiteSettings.jsx';

const CATEGORY_LINKS = [
  ['Smartphones', '/shop?category=smartphones'],
  ['Laptops', '/shop?category=laptops'],
  ['Gaming', '/shop?category=gaming'],
  ['Headphones', '/shop?category=headphones'],
  ['Smart Watches', '/shop?category=smart-watches'],
  ['Accessories', '/shop?category=accessories'],
];

const SOCIAL_ICONS = {
  facebook: 'M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.2-3.2 3.3V11H9v3h2.3v7h2.2z',
  x: 'M17.2 4h2.5l-5.5 6.3L20.7 20h-5.1l-4-5.2L7 20H4.5l5.9-6.7L4 4h5.2l3.6 4.8L17.2 4zm-.9 14.4h1.4L8.5 5.5H7l9.3 12.9z',
  instagram: 'M12 8.8A3.2 3.2 0 1 0 12 15.2 3.2 3.2 0 0 0 12 8.8zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm6.4-.2a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0zM12 4.6c-2.4 0-2.7 0-3.7.1a5 5 0 0 0-1.6.3 3.2 3.2 0 0 0-1.9 1.9c-.2.5-.3 1-.3 1.6-.1 1-.1 1.3-.1 3.7s0 2.7.1 3.7c0 .6.1 1.1.3 1.6a3.2 3.2 0 0 0 1.9 1.9c.5.2 1 .3 1.6.3 1 .1 1.3.1 3.7.1s2.7 0 3.7-.1a5 5 0 0 0 1.6-.3 3.2 3.2 0 0 0 1.9-1.9c.2-.5.3-1 .3-1.6.1-1 .1-1.3.1-3.7s0-2.7-.1-3.7a5 5 0 0 0-.3-1.6 3.2 3.2 0 0 0-1.9-1.9 5 5 0 0 0-1.6-.3c-1-.1-1.3-.1-3.7-.1z',
  youtube: 'M21.6 8.2a2.5 2.5 0 0 0-1.8-1.8C18.2 6 12 6 12 6s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 8.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 3.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-3.8zM10 15V9l5.2 3L10 15z',
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { settings } = useSiteSettings();

  const subscribe = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error('Please enter a valid email');
    setLoading(true);
    try {
      await newsletterApi.subscribe(email);
      toast.success(`Subscribed! Welcome to the ${settings.brandName} insider list.`);
      setEmail('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const colTitle = 'text-sm font-bold uppercase tracking-widest mb-4 text-gold-400';
  const link = 'block text-sm text-ink-500 hover:text-gold-400 transition-colors py-1.5';

  return (
    <footer className="bg-[#050505] text-white mt-20">
      {/* Trust bar */}
      <div className="border-b border-ink-800">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            [Truck, 'Free Shipping', 'On all orders over $500'],
            [RotateCcw, '30-Day Returns', 'Hassle-free return policy'],
            [ShieldCheck, '2-Year Warranty', 'On eligible products'],
            [CreditCard, 'Secure Payments', '256-bit SSL encrypted'],
          ].map(([Icon, title, sub]) => (
            <div key={title} className="flex items-start gap-3">
              <Icon size={22} strokeWidth={1.5} className="shrink-0 mt-0.5 text-gold-400" />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-ink-500 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand */}
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.brandName} className="w-9 h-9 rounded-lg object-cover" />
            ) : (
              <span className="w-9 h-9 rounded-lg bg-gold-500 text-black flex items-center justify-center font-extrabold text-xl">{settings.brandName?.charAt(0) || 'V'}</span>
            )}
            <span className="text-2xl font-extrabold tracking-tight">{settings.brandName}</span>
          </Link>
          <p className="mt-4 text-sm text-ink-500 leading-relaxed max-w-sm">
            {settings.tagline}. {settings.aboutText}
          </p>
          <div className="mt-6 space-y-2 text-sm text-ink-500">
            <p className="flex items-center gap-2.5"><MapPin size={15} className="text-gold-400" /> {settings.address}</p>
            <p className="flex items-center gap-2.5"><Phone size={15} className="text-gold-400" /> {settings.contactPhone}</p>
            <p className="flex items-center gap-2.5"><Mail size={15} className="text-gold-400" /> {settings.contactEmail}</p>
          </div>
          <div className="mt-6 flex items-center gap-3">
            {Object.entries(SOCIAL_ICONS).map(([key, path]) => (
              <a
                key={key}
                href={settings.socialLinks?.[key] || '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={key}
                className="w-9 h-9 rounded-full border border-ink-700 flex items-center justify-center hover:bg-gold-500 hover:text-black hover:border-gold-500 transition-all duration-200"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d={path} /></svg>
              </a>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 className={colTitle}>Quick Links</h4>
          <Link to="/shop" className={link}>Shop All</Link>
          <Link to="/orders" className={link}>My Orders</Link>
          <Link to="/wishlist" className={link}>Wishlist</Link>
          <Link to="/cart" className={link}>Cart</Link>
        </div>

        {/* Categories */}
        <div>
          <h4 className={colTitle}>Categories</h4>
          {CATEGORY_LINKS.map(([label, to]) => (
            <Link key={to} to={to} className={link}>
              {label}
            </Link>
          ))}
        </div>

        {/* Newsletter */}
        <div>
          <h4 className={colTitle}>Newsletter</h4>
          <p className="text-sm text-ink-500 mb-4">Get early access to drops and exclusive deals.</p>
          <form onSubmit={subscribe} className="flex rounded-lg overflow-hidden border border-ink-700 focus-within:border-gold-500 transition-colors">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="flex-1 min-w-0 bg-transparent px-3.5 py-2.5 text-sm text-white placeholder:text-ink-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-gold-500 text-black text-sm font-semibold px-4 hover:bg-gold-400 transition-colors disabled:opacity-50"
            >
              Join
            </button>
          </form>
          <p className="mt-6 text-xs text-ink-400 leading-relaxed">
            By subscribing you agree to our{' '}
            <a href="#" className="underline hover:text-gold-400">Privacy Policy</a> and{' '}
            <a href="#" className="underline hover:text-gold-400">Terms & Conditions</a>.
          </p>
        </div>
      </div>

      <div className="border-t border-ink-800">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-400">
          <p>© {new Date().getFullYear()} {settings.footerCopyright}</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-gold-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gold-400 transition-colors">Terms & Conditions</a>
            <a href="#" className="hover:text-gold-400 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
