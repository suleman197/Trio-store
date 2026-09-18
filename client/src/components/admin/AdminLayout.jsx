import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tags, Boxes, ShoppingCart, Users,
  Star, TicketPercent, Settings, LogOut, Menu, X, Store,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import useSiteSettings from '../../hooks/useSiteSettings.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#050505] border-r border-ink-800 text-white shrink-0 sticky top-0 h-screen">
        <SidebarContent user={user} onLogout={handleLogout} settings={settings} />
      </aside>

      {/* Sidebar — mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#050505] border-r border-ink-800 text-white flex flex-col shadow-2xl animate-[aDrawer_.22s_ease] overflow-y-auto">
            <style>{`@keyframes aDrawer{from{transform:translateX(-100%)}to{transform:none}}`}</style>
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-2 -mr-2 text-ink-400 hover:text-white transition-colors z-10" aria-label="Close sidebar">
              <X size={20} />
            </button>
            <SidebarContent user={user} onLogout={handleLogout} onNavigate={() => setSidebarOpen(false)} settings={settings} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-ink-800 h-14 flex items-center gap-3 px-4 sm:px-6">
          <button className="lg:hidden p-2 -ml-2 text-white" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <Menu size={20} />
          </button>
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.brandName} className="h-6 w-6 rounded object-cover" />
          ) : (
            <span className="w-6 h-6 rounded bg-gold-500 text-black flex items-center justify-center font-extrabold text-xs">{settings.brandName?.charAt(0) || 'V'}</span>
          )}
          <span className="font-extrabold tracking-tight text-white">{settings.brandName}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest bg-gold-500 text-black px-2 py-1 rounded">Admin</span>

          <div className="ml-auto flex items-center gap-3">
            <NavLink
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-gold-400 transition-colors"
            >
              <Store size={14} /> View Store
            </NavLink>
            <div className="flex items-center gap-2 pl-3 border-l border-ink-800">
              <span className="w-8 h-8 rounded-full bg-gold-500 text-black text-xs font-bold flex items-center justify-center uppercase">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
              <span className="hidden md:block text-sm font-semibold text-white">{user?.firstName} {user?.lastName}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ user, onLogout, onNavigate, settings = {} }) {
  return (
    <>
      <div className="h-16 flex items-center px-5 border-b border-ink-800 shrink-0">
        <NavLink to="/admin" onClick={onNavigate} className="flex items-center gap-2.5">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.brandName} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <span className="w-8 h-8 rounded-lg bg-gold-500 text-black flex items-center justify-center font-extrabold">{settings.brandName?.charAt(0) || 'V'}</span>
          )}
          <span className="text-lg font-extrabold tracking-tight">{settings.brandName || 'VOLTIQ'}</span>
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive ? 'bg-gold-500 text-black shadow-[0_0_12px_rgba(212,175,55,0.2)]' : 'text-ink-500 hover:text-white hover:bg-ink-800'
              }`
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-ink-800">
        <div className="px-3.5 pb-3">
          <p className="text-xs font-semibold truncate text-white">{user?.firstName} {user?.lastName}</p>
          <p className="text-[11px] text-ink-400 truncate">{user?.email}</p>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-ink-800 transition-colors"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </>
  );
}
