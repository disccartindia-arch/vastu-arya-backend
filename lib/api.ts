// lib/api.ts — Fix #7 (prod URL) + Fix #12 (30s timeout + cold-start retry)
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

// Fix #7 — never silently default to localhost in production
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://vastu-arya-backend-1.onrender.com/api';

if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_API_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Vastu Arya] NEXT_PUBLIC_API_URL is not set. Falling back to: ' + API_URL
  );
}

// Fix #12 — 30s timeout (Render free-tier cold-start can take 20-25s)
const api = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Fix #12 — Auto-retry once on 502/503/network errors (Render cold-start)
type RetryConfig = AxiosRequestConfig & { _retry?: boolean };

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('vastu_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const cfg = error.config as RetryConfig | undefined;

    const isColdStart =
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      error.response?.status === 503 ||
      error.response?.status === 502;

    if (isColdStart && cfg && !cfg._retry) {
      cfg._retry = true;
      // eslint-disable-next-line no-console
      console.info('[api] Render cold-start detected, retrying once after 3s…');
      await new Promise((r) => setTimeout(r, 3000));
      return api(cfg);
    }

    // Existing 401 / auth handler
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('vastu_token');
      localStorage.removeItem('vastu_user');
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/admin')
      ) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  login: (d: any) => api.post('/auth/login', d),
  register: (d: any) => api.post('/auth/register', d),
  getMe: () => api.get('/auth/me'),
  updateProfile: (d: any) => api.put('/auth/profile', d),
};

export const servicesAPI = {
  getAll: (p?: any) => api.get('/services', { params: p }),
  getBySlug: (slug: string) => api.get(`/services/${slug}`),
  create: (d: any) => api.post('/services', d),
  update: (id: string, d: any) => api.put(`/services/${id}`, d),
  delete: (id: string) => api.delete(`/services/${id}`),
};

export const productsAPI = {
  getAll: (p?: any) => api.get('/products', { params: p }),
  getBySlug: (slug: string) => api.get(`/products/${slug}`),
  getAdminAll: (p?: any) => api.get('/products/admin/all', { params: p }),
  create: (d: any) => api.post('/products', d),
  update: (id: string, d: any) => api.put(`/products/${id}`, d),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const paymentAPI = {
  createOrder: (d: any) => api.post('/payment/create-order', d),
  verifyPayment: (d: any) => api.post('/payment/verify', d),
};

export const ordersAPI = {
  getAll: (p?: any) => api.get('/orders', { params: p }),
  getById: (id: string) => api.get(`/orders/${id}`),
  updateStatus: (id: string, d: any) => api.put(`/orders/${id}`, d),
};

export const bookingsAPI = {
  getAll: (p?: any) => api.get('/bookings', { params: p }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  updateStatus: (id: string, d: any) => api.put(`/bookings/${id}`, d),
};

export const blogsAPI = {
  getAll: (p?: any) => api.get('/blogs', { params: p }),
  getBySlug: (slug: string) => api.get(`/blogs/${slug}`),
  create: (d: any) => api.post('/blogs', d),
  update: (id: string, d: any) => api.put(`/blogs/${id}`, d),
  delete: (id: string) => api.delete(`/blogs/${id}`),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (d: any) => api.put('/settings', d),
  getPopups: (p?: any) => api.get('/settings/popups', { params: p }),
  createPopup: (d: any) => api.post('/settings/popups', d),
  updatePopup: (id: string, d: any) => api.put(`/settings/popups/${id}`, d),
  deletePopup: (id: string) => api.delete(`/settings/popups/${id}`),
  getSliders: () => api.get('/settings/sliders'),
  getAllSliders: () => api.get('/settings/sliders/all'),
  createSlider: (d: any) => api.post('/settings/sliders', d),
  updateSlider: (id: string, d: any) => api.put(`/settings/sliders/${id}`, d),
  deleteSlider: (id: string) => api.delete(`/settings/sliders/${id}`),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (p?: any) => api.get('/admin/users', { params: p }),
  updateUser: (id: string, d: any) => api.put(`/admin/users/${id}`, d),
  seedProducts: () => api.post('/admin/seed-products'),
  seedServices: () => api.post('/admin/seed-services'),
};

export const contentAPI = {
  getPage: (page: string) => api.get(`/content/${page}`),
  getAll: () => api.get('/content'),
  update: (d: any) => api.put('/content', d),
  bulkUpdate: (items: any[]) => api.post('/content/bulk', { items }),
};

export const configAPI = {
  get: () => api.get('/config'),
  getAll: () => api.get('/config'),
  update: (d: Record<string, any>) => api.put('/config', d),
};

export const uploadAPI = {
  status: () => api.get('/upload/status'),
  single: (fd: FormData) => api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const reviewsAPI = {
  getAll: (p?: any) => api.get('/reviews', { params: p }),
  create: (d: any) => api.post('/reviews', d),
  update: (id: string, d: any) => api.put(`/reviews/${id}`, d),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

export const homepageSettingsAPI = {
  get: () => api.get('/homepage/settings'),
  update: (d: any) => api.put('/homepage/settings', d),
};

export const testimonialsAPI = {
  getAll: (p?: any) => api.get('/homepage/testimonials', { params: p }),
  create: (d: any) => api.post('/homepage/testimonials', d),
  update: (id: string, d: any) => api.put(`/homepage/testimonials/${id}`, d),
  delete: (id: string) => api.delete(`/homepage/testimonials/${id}`),
};

export const themeSettingsAPI = {
  get: () => api.get('/homepage/theme'),
  update: (d: any) => api.put('/homepage/theme', d),
};

export const postsAPI = {
  getAll: (p?: any) => api.get('/posts', { params: p }),
  getById: (id: string) => api.get(`/posts/${id}`),
  like: (id: string, sessionId: string) =>
    api.post(`/posts/${id}/like`, {}, { headers: { 'x-session-id': sessionId } }),
  getComments: (id: string) => api.get(`/posts/${id}/comments`),
  addComment: (id: string, d: any) => api.post(`/posts/${id}/comments`, d),
  create: (d: any) => api.post('/posts', d),
  update: (id: string, d: any) => api.put(`/posts/${id}`, d),
  delete: (id: string) => api.delete(`/posts/${id}`),
};

export const searchAPI = {
  search: (q: string, limit = 8) => api.get('/search', { params: { q, limit } }),
  trending: () => api.get('/search/trending'),
  logClick: (query: string, clickedSlug: string, clickedType: string) =>
    api.post('/search/log-click', { query, clickedSlug, clickedType }),
  analytics: () => api.get('/search/analytics'),
};

export const aiAPI = {
  vastuAnalysis: (d: { concern: string; roomType?: string; direction?: string }) =>
    api.post('/ai/vastu-analysis', d),
};

export const aiSettingsAPI = {
  get:       () => api.get('/ai-settings'),
  getPublic: () => api.get('/ai-settings/public'),
  update: (d: any) => api.put('/ai-settings', d),
  reset:  () => api.post('/ai-settings/reset'),
};

export const aiStatusAPI = {
  check: () => api.get('/ai/status'),
};

export const productGeneratorAPI = {
  generate: (d: { input: string; category: string }) =>
    api.post('/product-generator/generate', d),
};
