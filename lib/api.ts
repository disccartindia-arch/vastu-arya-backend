// lib/api.ts — VastuArya v2
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL as string) ||
  'https://vastu-arya-backend-1.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 25000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ── Auth token injection ───────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('vastuarya_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Smart retry (skip 4xx) ─────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const cfg = err.config as AxiosRequestConfig & { _retryCount?: number };
    if (!cfg) return Promise.reject(err);

    const status = err.response?.status ?? 0;
    // Never retry client errors
    if (status >= 400 && status < 500) return Promise.reject(err);

    cfg._retryCount = (cfg._retryCount ?? 0) + 1;
    if (cfg._retryCount > 2) return Promise.reject(err);

    await new Promise((r) => setTimeout(r, 500 * cfg._retryCount!));
    return api(cfg);
  }
);

export default api;

// ── Typed helpers ──────────────────────────────────────────────────────

/** Fetch public Razorpay key (fallback to backend runtime) */
export const getPaymentKey = () =>
  api.get<{ key: string }>('/settings/razorpay-key');

/** Create Razorpay order on backend */
export const createRazorpayOrder = (data: {
  amount: number;
  bookingRef: string;
  currency?: string;
}) => api.post<{ orderId: string; amount: number }>('/payment/create-order', data);

/** Verify Razorpay payment HMAC on backend */
export const verifyRazorpayPayment = (data: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  bookingRef: string;
}) => api.post<{ success: boolean; booking?: any }>('/payment/verify', data);

/** Get UPI intent links + QR data */
export const getUPIIntent = (data: {
  amount: number;
  bookingRef: string;
  name: string;
}) => api.post<{
  upiUrl: string;
  qrImageUrl: string;
  primaryUPI: string;
  fallbackUPI: string;
  payeeName: string;
  gPayUrl: string;
  phonePeUrl: string;
  paytmUrl: string;
}>('/payment/upi-intent', data);

/** Record UPI payment (customer-submitted UTR) */
export const recordUPIPayment = (data: {
  bookingRef: string;
  upiId: string;
  transactionId: string;
  amount: number;
  name: string;
  phone: string;
}) => api.post<{ success: boolean; message: string }>('/payment/record-upi', data);

/** Check payment / booking / order status by any reference */
export const getPaymentStatus = (ref: string) =>
  api.get<{
    type: 'booking' | 'order';
    data: {
      id: string;
      name: string;
      phone: string;
      serviceName?: string;
      totalAmount?: number;
      amountPaid: number;
      paymentStatus: string;
      paymentMethod: string;
      status: string;
      paymentId?: string;
      transactionRef?: string;
      verifiedAt?: string;
      createdAt: string;
      items?: Array<{ name: string; qty: number; price: number }>;
    };
  }>(`/payment/status/${encodeURIComponent(ref)}`);

/** Get public payment settings (which methods are enabled) */
export const getPaymentSettings = () =>
  api.get<{
    razorpayEnabled: boolean;
    upiEnabled: boolean;
    codEnabled: boolean;
    fallbackEnabled: boolean;
    payeeName: string;
  }>('/payment/settings');
