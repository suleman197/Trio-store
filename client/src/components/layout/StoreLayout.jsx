import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';

/** Storefront chrome: header, footer, cart drawer + auth/cart hydration. */
export default function StoreLayout() {
  const location = useLocation();

  useEffect(() => {
    const bootstrap = async () => {
      const token = useAuthStore.getState().token;
      if (token) {
        await useAuthStore.getState().fetchMe();
        await useWishlistStore.getState().init();
        await useCartStore.getState().init();
      } else {
        useCartStore.getState().init();
      }
    };
    bootstrap();
  }, []);

  // Hide storefront chrome on checkout for a focused flow
  const isCheckout = location.pathname.startsWith('/checkout');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      {!isCheckout && <Footer />}
      <CartDrawer />
    </div>
  );
}
