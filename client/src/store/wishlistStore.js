import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import useAuthStore from './authStore';

/** Wishlist: local (full snapshots) for guests, synced to /api/wishlist when signed in. */
const useWishlistStore = create(
  persist(
    (set, get) => ({
      products: [],

      init: async () => {
        if (!useAuthStore.getState().token) return;
        try {
          const { data } = await api.get('/wishlist');
          set({ products: data.data.products });
        } catch {
          /* keep local */
        }
      },

      /** Pass a full product object. Returns true if now wishlisted. */
      toggle: async (product) => {
        const id = typeof product === 'string' ? product : product._id;
        const exists = get().products.some((p) => p._id === id);

        if (!useAuthStore.getState().token) {
          set({
            products: exists
              ? get().products.filter((p) => p._id !== id)
              : [...get().products, typeof product === 'object' ? product : { _id: id }],
          });
          return !exists;
        }
        if (exists) {
          const { data } = await api.delete(`/wishlist/${id}`);
          set({ products: data.data.products });
          return false;
        }
        const { data } = await api.post(`/wishlist/${id}`);
        set({ products: data.data.products });
        return true;
      },

      remove: (productId) => get().toggle(productId),

      has: (productId) => get().products.some((p) => p._id === productId),
    }),
    { name: 'voltiq_wishlist' }
  )
);

export default useWishlistStore;
