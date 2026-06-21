/**
 * lib/accountAPI.ts — NEW
 *
 * PRODUCTION HOTFIX ROUND 11 — Phase D.
 *
 * Follows the exact pattern established in lib/bookingStatusAPI.ts
 * (Phase C) — a small, isolated module wrapping the shared `api`
 * axios instance, used by every /account/* page. Every call here goes
 * through the existing interceptor (lib/api.ts), which already
 * attaches the Authorization header from localStorage — no new auth
 * plumbing needed.
 */
import api from './api';

export interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalOrders: number;
  pendingPayments: number;
  verifiedPayments: number;
}

export const accountAPI = {
  getDashboard: () => api.get('/account/dashboard'),
  getBookings: (params?: { search?: string; filter?: string; page?: number; limit?: number }) =>
    api.get('/account/bookings', { params }),
  getBookingDetail: (bookingId: string) => api.get(`/account/bookings/${bookingId}`),
  getOrders: (params?: { search?: string; filter?: string; page?: number; limit?: number }) =>
    api.get('/account/orders', { params }),
  getOrderDetail: (orderId: string) => api.get(`/account/orders/${orderId}`),
  getPayments: (params?: { filter?: string }) => api.get('/account/payments', { params }),
  getProfile: () => api.get('/account/profile'),
  updateProfile: (data: { name?: string; phone?: string }) => api.put('/account/profile', data),
  getActivity: (params?: { page?: number; limit?: number }) => api.get('/account/activity', { params }),
  claimBooking: (data: { bookingId: string; phone: string; email?: string }) =>
    api.post('/account/claim', data),
};
