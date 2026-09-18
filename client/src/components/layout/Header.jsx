import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, X, Search, Heart, ShoppingBag, User, LogOut, LayoutDashboard,
  ChevronDown, Package, Zap,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import { productApi, categoryApi } from '../../services';
import useDebounce from '../../hooks/useDebounce';
import { formatCurrency, effectivePrice } from '../../utils/format';
import useSiteSettings from '../../hooks/useSiteSettings.jsx';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/shop?sort=popular', label: 'Best Sellers' },
  { to: '/shop?discounted=true', label: 'Deals' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpenMobile, setSearchOpenMobile] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const itemCount = useCartStore((s) => s.itemCount);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);
  const wishlistCount = useWishlistStore((s) => s.products.length);
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const debouncedQuery = useDebounce(query);
  const searchRef = useRef(null);
  const { settings } = useSiteSettings();

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setSearchOpenMobile(false);
    setSuggestions([]);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer or search is open
  useEffect(() => {
    if (mobileOpen || searchOpenMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen, searchOpenMobile]);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      let alive = true;
      productApi.suggest(debouncedQuery).then((s) => alive && setSuggestions(s)).catch(() => {});
      return () => (alive = false);
    }
    setSuggestions([]);
  }, [debouncedQuery]);

  useEffect(() => {
    const close = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSuggestions([]);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submitSearch = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    setSuggestions([]);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-ink-800">
      {/* Announcement bar */}
      {settings.announcementEnabled && (
        <div className="bg-gold-500 text-black">
          <p className="max-w-7xl mx-auto px-4 py-2 text-[11px] sm:text-xs font-medium tracking-wide text-center flex items-center justify-center gap-2">
            <Zap size={12} /> {settings.announcementText}
          </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 h-16">
          {/* Mobile hamburger */}
          <button className="lg:hidden p-2 -ml-2 text-white" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 mr-2">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.brandName} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <span className="w-8 h-8 rounded-lg bg-gold-500 text-black flex items-center justify-center font-extrabold text-lg">{settings.brandName?.charAt(0) || 'V'}</span>
            )}
            <span className="text-xl font-extrabold tracking-tight hidden xs:inline text-white">{settings.brandName}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7 ml-4">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-gold-400 ${
                    isActive && l.to === '/' ? 'text-gold-400' : 'text-ink-600'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Search */}
          <form onSubmit={submitSearch} ref={searchRef} className="relative flex-1 max-w-md mx-auto hidden md:block">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-ink-700 text-sm bg-ink-900 text-white placeholder:text-ink-600
                focus:bg-ink-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
            />
            <SearchSuggestions suggestions={suggestions} onPick={() => setSuggestions([])} />
          </form>

          <div className="flex-1 md:hidden" />

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button className="md:hidden p-2 text-white" onClick={() => setSearchOpenMobile(true)} aria-label="Search">
              <Search size={20} />
            </button>

            <Link to="/wishlist" className="relative p-2 text-white hover:text-gold-400 transition-colors" aria-label="Wishlist">
              <Heart size={20} />
              {wishlistCount > 0 && <IconBadge count={wishlistCount} />}
            </Link>

            <button onClick={() => setDrawerOpen(true)} className="relative p-2 text-white" aria-label="Cart">
              <ShoppingBag size={20} />
              {itemCount > 0 && <IconBadge count={itemCount} />}
            </button>

            {/* User */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="hidden lg:flex items-center gap-1.5 pl-3 pr-2 py-2 rounded-full border border-ink-700 hover:border-gold-500 transition-colors text-sm font-medium text-white"
                >
                  <User size={16} />
                  <span className="max-w-[90px] truncate">{user.firstName}</span>
                  <ChevronDown size={14} />
                </button>
                <button onClick={() => setUserMenuOpen((o) => !o)} className="lg:hidden p-2 text-white" aria-label="Account">
                  <User size={20} />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-[#111] border border-ink-800 rounded-xl shadow-xl z-50 py-2 animate-[menuIn_.15s_ease]">
                      <style>{`@keyframes menuIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}`}</style>
                      <div className="px-4 py-2 border-b border-ink-800">
                        <p className="text-sm font-semibold truncate text-white">{user.name}</p>
                        <p className="text-xs text-ink-500 truncate">{user.email}</p>
                      </div>
                      <MenuItems user={user} handleLogout={handleLogout} />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-1 hidden lg:inline-flex items-center gap-1.5 bg-gold-500 text-black text-sm font-medium px-4 py-2 rounded-full hover:bg-gold-400 transition-colors"
              >
                <User size={15} /> Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {createPortal(
        <>
          {mobileOpen && (
            <MobileDrawer onClose={() => setMobileOpen(false)} user={user} handleLogout={handleLogout} categories={categories} settings={settings} />
          )}
          {searchOpenMobile && (
            <div className="fixed inset-0 z-[60] bg-[#0a0a0a] p-4">
              <form onSubmit={submitSearch} className="flex items-center gap-3 relative">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-ink-700 bg-ink-900 text-sm text-white focus:border-gold-500 focus:outline-none placeholder:text-ink-600"
                  />
                  <SearchSuggestions suggestions={suggestions} onPick={() => { setSuggestions([]); setSearchOpenMobile(false); }} mobile />
                </div>
                <button type="button" onClick={() => setSearchOpenMobile(false)} aria-label="Close search" className="p-2 text-white">
                  <X size={22} />
                </button>
              </form>
            </div>
          )}
        </>,
        document.body
      )}
    </header>
  );
}

function IconBadge({ count }) {
  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-0.5 bg-gold-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function SearchSuggestions({ suggestions, onPick, mobile }) {
  if (suggestions.length === 0) return null;
  return (
    <div
      className={`${
        mobile ? 'static w-full mt-2' : 'absolute left-0 right-0 top-full mt-2'
      } bg-[#111] border border-ink-800 rounded-xl shadow-xl z-50 overflow-hidden`}
    >
      {suggestions.map((s) => (
        <Link
          key={s._id}
          to={`/product/${s.slug}`}
          onClick={onPick}
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-ink-800 transition-colors"
        >
          <img src={s.images?.[0]} alt="" className="w-9 h-9 rounded-md object-cover bg-ink-900" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate text-white">{s.name}</p>
            <p className="text-xs text-ink-500">{s.brand}</p>
          </div>
          <span className="text-sm font-bold text-gold-400">{formatCurrency(effectivePrice(s))}</span>
        </Link>
      ))}
    </div>
  );
}

function MenuItems({ user, handleLogout }) {
  const item =
    'flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-ink-800 transition-colors w-full text-left text-white';
  return (
    <>
      {user.role !== 'admin' && (
        <Link to="/orders" className={item}>
          <Package size={15} /> My Orders
        </Link>
      )}
      {user.role !== 'admin' ? (
        <button onClick={handleLogout} className={`${item} text-red-400`}>
          <LogOut size={15} /> Logout
        </button>
      ) : (
        <>
          <Link to="/admin" className={item}>
            <LayoutDashboard size={15} /> Admin Dashboard
          </Link>
          <button onClick={handleLogout} className={`${item} text-red-400`}>
            <LogOut size={15} /> Logout
          </button>
        </>
      )}
    </>
  );
}

function MobileDrawer({ onClose, user, handleLogout, categories = [], settings = {} }) {
  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute left-0 top-0 bottom-0 w-[300px] h-dvh bg-[#0a0a0a] flex flex-col shadow-2xl animate-[drawerIn_.25s_ease] overflow-y-auto">
        <style>{`@keyframes drawerIn{from{transform:translateX(-100%)}to{transform:none}}`}</style>
        <div className="flex items-center justify-between px-5 h-16 border-b border-ink-800 shrink-0">
          <Link to="/" className="flex items-center gap-2" onClick={onClose}>
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.brandName} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <span className="w-8 h-8 rounded-lg bg-gold-500 text-black flex items-center justify-center font-extrabold">{settings.brandName?.charAt(0) || 'V'}</span>
            )}
            <span className="text-lg font-extrabold tracking-tight text-white">{settings.brandName}</span>
          </Link>
          <button onClick={onClose} aria-label="Close menu" className="p-2 -mr-2 text-ink-400 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>

        <nav className="py-4 border-b border-ink-800">
          {[{ to: '/', label: 'Home' }, ...NAV_LINKS.slice(1)].map((l) => (
            <Link key={l.label} to={l.to} onClick={onClose} className="block px-5 py-3 text-sm font-semibold hover:bg-ink-800 text-white">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="py-4 border-b border-ink-800">
          <p className="px-5 pb-2 text-[11px] font-bold uppercase tracking-widest text-gold-400">Categories</p>
          {categories.map((c) => (
            <Link
              key={c._id}
              to={`/shop?category=${c.slug}`}
              onClick={onClose}
              className="block px-5 py-2.5 text-sm text-ink-400 hover:bg-ink-800 hover:text-white"
            >
              {c.name}
            </Link>
          ))}
        </div>

        <div className="mt-auto p-5 border-t border-ink-800">
          {user ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold truncate text-white">{user.name}</p>
              {user.role === 'admin' ? (
                <Link to="/admin" onClick={onClose} className="block w-full text-center bg-gold-500 text-black text-sm font-medium py-2.5 rounded-lg">
                  Admin Dashboard
                </Link>
              ) : (
                <Link to="/orders" onClick={onClose} className="block w-full text-center border border-ink-700 text-sm font-medium py-2.5 rounded-lg text-white">
                  My Orders
                </Link>
              )}
              <button onClick={handleLogout} className="block w-full text-center text-red-400 text-sm font-medium py-2">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" onClick={onClose} className="block w-full text-center bg-gold-500 text-black text-sm font-medium py-3 rounded-lg">
              Sign In / Register
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
