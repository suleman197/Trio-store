import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('voltiq_user') || 'null'),
  token: localStorage.getItem('voltiq_token') || null,
  loading: false,

  setAuth: ({ token, user }) => {
    if (token) localStorage.setItem('voltiq_token', token);
    if (user) localStorage.setItem('voltiq_user', JSON.stringify(user));
    set({ token, user });
  },

  login: async (email, password, guestCart = []) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password, guestCart });
      get().setAuth(data.data);
      return data;
    } finally {
      set({ loading: false });
    }
  },

  register: async (payload) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/register', payload);
      get().setAuth(data.data);
      return data;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* token already invalid */
    }
    localStorage.removeItem('voltiq_token');
    localStorage.removeItem('voltiq_user');
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    const { token } = get();
    if (!token) return null;
    try {
      const { data } = await api.get('/auth/me');
      localStorage.setItem('voltiq_user', JSON.stringify(data.data.user));
      set({ user: data.data.user });
      return data.data.user;
    } catch {
      get().logout();
      return null;
    }
  },
}));

export default useAuthStore;
