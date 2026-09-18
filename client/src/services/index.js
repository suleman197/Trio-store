import api from './api';

export const productApi = {
  list: (params) => api.get('/products', { params }).then((r) => r.data.data),
  get: (idOrSlug) => api.get(`/products/${idOrSlug}`).then((r) => r.data.data),
  brands: () => api.get('/products/brands').then((r) => r.data.data.brands),
  suggest: (q) => api.get('/search/suggest', { params: { q } }).then((r) => r.data.data.suggestions),
};

export const categoryApi = {
  list: (all = false) => api.get('/categories', { params: all ? { all: 'true' } : {} }).then((r) => r.data.data.categories),
};

export const reviewApi = {
  list: (productId, params = {}) => api.get(`/products/${productId}/reviews`, { params }).then((r) => r.data.data),
  create: (productId, payload) => api.post(`/products/${productId}/reviews`, payload).then((r) => r.data),
};

export const orderApi = {
  mine: (params = {}) => api.get('/orders', { params }).then((r) => r.data.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data.data.order),
  place: (payload) => api.post('/orders', payload).then((r) => r.data.data.order),
  cancel: (id) => api.put(`/orders/${id}/cancel`).then((r) => r.data),
  uploadScreenshot: (id, file) => {
    const fd = new FormData();
    fd.append('screenshot', file);
    return api.put(`/orders/${id}/bank-screenshot`, fd, { timeout: 60000 }).then((r) => r.data.data.order);
  },
};

export const couponApi = {
  validate: (code, subtotal) => api.post('/coupons/validate', { code, subtotal }).then((r) => r.data.data),
};

export const newsletterApi = {
  subscribe: (email) => api.post('/search/newsletter', { email }).then((r) => r.data),
};

// ---------- Admin ----------
const admin = '/admin';

export const adminApi = {
  dashboard: () => api.get(`${admin}/dashboard`).then((r) => r.data.data),

  products: {
    list: (params) => api.get('/products', { params: { ...params, limit: 1000 } }).then((r) => r.data.data),
    create: (payload) => api.post('/products', payload).then((r) => r.data),
    update: (id, payload) => api.put(`/products/${id}`, payload).then((r) => r.data),
    remove: (id) => api.delete(`/products/${id}`).then((r) => r.data),
    toggleStatus: (id) => api.patch(`/products/${id}/status`).then((r) => r.data),
  },

  categories: {
    listAll: () => categoryApi.list(true),
    create: (payload) => api.post('/categories', payload).then((r) => r.data),
    update: (id, payload) => api.put(`/categories/${id}`, payload).then((r) => r.data),
    remove: (id) => api.delete(`/categories/${id}`).then((r) => r.data),
  },

  orders: {
    list: (params) => api.get(`${admin}/orders`, { params }).then((r) => r.data.data),
    get: (id) => api.get(`${admin}/orders/${id}`).then((r) => r.data.data.order),
    updateStatus: (id, status, note) => api.put(`${admin}/orders/${id}/status`, { status, note }).then((r) => r.data),
    updatePayment: (id, paymentStatus) => api.put(`${admin}/orders/${id}/payment`, { paymentStatus }).then((r) => r.data),
    verifyBank: (id) => api.put(`${admin}/orders/${id}/verify-bank`).then((r) => r.data),
    rejectBank: (id, reason) => api.put(`${admin}/orders/${id}/reject-bank`, { reason }).then((r) => r.data),
  },

  customers: {
    list: (params) => api.get(`${admin}/customers`, { params }).then((r) => r.data.data),
    get: (id) => api.get(`${admin}/customers/${id}`).then((r) => r.data.data),
    toggleStatus: (id) => api.patch(`${admin}/customers/${id}/status`).then((r) => r.data),
  },

  inventory: {
    list: (params) => api.get(`${admin}/inventory`, { params }).then((r) => r.data.data),
    history: (productId) => api.get(`${admin}/inventory/${productId}/history`).then((r) => r.data.data.history),
    adjust: (productId, payload) => api.patch(`${admin}/inventory/${productId}/adjust`, payload).then((r) => r.data),
  },

  reviews: {
    list: (params) => api.get(`${admin}/reviews`, { params }).then((r) => r.data.data),
    approve: (id) => api.patch(`${admin}/reviews/${id}/approve`).then((r) => r.data),
    remove: (id) => api.delete(`${admin}/reviews/${id}`).then((r) => r.data),
  },

  coupons: {
    list: (params) => api.get('/coupons', { params }).then((r) => r.data.data),
    create: (payload) => api.post('/coupons', payload).then((r) => r.data),
    update: (id, payload) => api.put(`/coupons/${id}`, payload).then((r) => r.data),
    remove: (id) => api.delete(`/coupons/${id}`).then((r) => r.data),
  },

  settings: {
    get: () => api.get('/settings').then((r) => r.data.data.settings),
    update: (payload) => api.put('/settings', payload).then((r) => r.data),
  },

  upload: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post('/admin/upload', fd, { timeout: 60000 }).then((r) => r.data.data);
  },
};

// ---------- Public Settings ----------
export const settingsApi = {
  get: () => api.get('/settings').then((r) => r.data.data.settings),
};
