import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import useAuthStore from './authStore';

const emptySummary = { items: [], subtotal: 0, itemCount: 0 };

/**
 * Hybrid cart:
 *  • Guests → localStorage-backed cart (full product snapshot per line)
 *  • Signed-in users → server cart via /api/cart (guest lines merge on login)
 */
const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      itemCount: 0,
      loading: false,
      drawerOpen: false,

      setDrawerOpen: (open) => set({ drawerOpen: open }),

      /** Hydrate from server when authed; compute totals for guest cart. */
      init: async () => {
        if (!useAuthStore.getState().token) {
          get()._recomputeLocal();
          return;
        }
        try {
          const { data } = await api.get('/cart');
          set({ items: data.data.items, subtotal: data.data.subtotal, itemCount: data.data.itemCount });
        } catch {
          /* offline — keep current */
        }
      },

      _recomputeLocal: () => {
        const items = get().items;
        const subtotal = Math.round(items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) * 100) / 100;
        const itemCount = items.reduce((s, i) => s + i.quantity, 0);
        set({ items: [...items], subtotal, itemCount });
      },

      addItem: async (product, quantity = 1, variant = {}) => {
        if (!useAuthStore.getState().token) {
          // Guest flow — local only
          const unitPrice =
            product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price;
          const keyOf = (v) => JSON.stringify(v || {});
          const existing = get().items.find((i) => i.productId === product._id && keyOf(i.variant) === keyOf(variant));
          let items;
          if (existing) {
            items = get().items.map((i) =>
              i === existing ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock || 99) } : i
            );
          } else {
            items = [
              ...get().items,
              {
                _id: `${product._id}-${Date.now()}`,
                productId: product._id,
                name: product.name,
                slug: product.slug,
                sku: product.sku,
                brand: product.brand,
                image: product.images?.[0],
                price: product.price,
                unitPrice,
                stock: product.stock ?? 99,
                variant,
                quantity,
              },
            ];
          }
          set({ items });
          get()._recomputeLocal();
          return;
        }

        set({ loading: true });
        try {
          await api.post('/cart', { productId: product._id, quantity, variant });
          const { data } = await api.get('/cart');
          set({ items: data.data.items, subtotal: data.data.subtotal, itemCount: data.data.itemCount });
        } finally {
          set({ loading: false });
        }
      },

      updateItem: async (itemId, quantity) => {
        if (!useAuthStore.getState().token) {
          set({
            items: get()
              .items.filter((i) => i._id !== itemId || quantity > 0)
              .map((i) => (i._id === itemId ? { ...i, quantity } : i)),
          });
          get()._recomputeLocal();
          return;
        }
        const { data } = await api.put(`/cart/${itemId}`, { quantity });
        set({ items: data.data.items, subtotal: data.data.subtotal, itemCount: data.data.itemCount });
      },

      removeItem: async (itemId) => {
        if (!useAuthStore.getState().token) {
          set({ items: get().items.filter((i) => i._id !== itemId) });
          get()._recomputeLocal();
          return;
        }
        const { data } = await api.delete(`/cart/${itemId}`);
        set({ items: data.data.items, subtotal: data.data.subtotal, itemCount: data.data.itemCount });
      },

      clear: async () => {
        if (useAuthStore.getState().token) {
          try {
            await api.delete('/cart');
          } catch {
            /* ignore */
          }
        }
        set({ ...emptySummary });
      },

      buyNowItem: async (product, quantity = 1, variant = {}) => {
        await get().clear();
        await get().addItem(product, quantity, variant);
      },
    }),
    {
      name: 'voltiq_cart',
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => state?._recomputeLocal?.(),
    }
  )
);

export default useCartStore;
