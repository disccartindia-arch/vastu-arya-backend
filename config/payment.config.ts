/**
 * config/payment.config.ts
 * ─────────────────────────────────────────────────────────────────
 * Single source of truth for payment configuration.
 *
 * CHANGED this round: the old UpiPaymentModal.tsx hardcoded its own
 * UPI_PRIMARY / UPI_SECONDARY constants directly in the component —
 * and got it backwards: it labelled 'vastuarya@ybl' as PRIMARY and
 * 'aryavartguna@ybl' as SECONDARY, the opposite of what the backend's
 * PaymentSettings model actually defines (primaryUPI: 'aryavartguna@ybl',
 * fallbackUPI: 'vastuarya@ybl'). This file now fetches the live values
 * from the backend (GET /api/payment/settings) so there is exactly one
 * place those IDs are defined — the database, via PaymentSettings.ts —
 * and the hardcoded constants below only exist as a last-resort fallback
 * if that request fails (e.g. backend cold-starting on Render free tier).
 *
 * Endpoint paths are also centralised here so nothing else in the
 * frontend hardcodes a route string — verify all backend paths in one
 * place, here, against src/server.ts / src/routes/*.ts in the backend
 * package.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://vastu-arya-backend-1.onrender.com/api';

// ── Route paths — must match backend exactly ──────────────────────
// payment.routes.ts:       GET/PUT /settings, POST /create-order, POST /verify
// upiPayment.routes.ts:    POST /submit, GET /status/:referenceId
// (both mounted under /api/payment and /api/payment/upi respectively)
export const PAYMENT_ROUTES = {
  createOrder:   `${API_BASE_URL}/payment/create-order`,
  verify:        `${API_BASE_URL}/payment/verify`,
  settings:      `${API_BASE_URL}/payment/settings`,
  upiSubmit:     `${API_BASE_URL}/payment/upi/submit`,
  upiStatus:     (referenceId: string) => `${API_BASE_URL}/payment/upi/status/${referenceId}`,
};

// ── Fallback UPI config — only used if /payment/settings fetch fails ──
// Matches the corrected defaults in backend src/models/PaymentSettings.ts.
export const UPI_FALLBACK = {
  primary:   { id: 'aryavartguna@ybl', label: 'Primary UPI',     qr: '/images/qr/upi-primary-aryavartguna.jpeg' },
  secondary: { id: 'vastuarya@ybl',    label: 'Alternative UPI', qr: '/images/qr/upi-secondary-vastuarya.jpeg' },
  payeeName: 'Vastu Arya',
};

export interface PaymentSettingsResponse {
  primaryUPI: string;
  fallbackUPI: string;
  payeeName: string;
  upiEnabled: boolean;
  fallbackEnabled: boolean;
  razorpayEnabled: boolean;
  codEnabled: boolean;
}

/**
 * Fetches live UPI configuration from the backend. Falls back to
 * UPI_FALLBACK (with a console.warn) if the request fails for any
 * reason, so the payment modal never breaks just because this one
 * settings call had a hiccup.
 */
export async function fetchPaymentSettings(): Promise<{
  primary: { id: string; label: string; qr: string };
  secondary: { id: string; label: string; qr: string };
  payeeName: string;
}> {
  try {
    const res = await fetch(PAYMENT_ROUTES.settings, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Settings fetch failed: ${res.status}`);
    const json = await res.json();
    const data: PaymentSettingsResponse = json?.data;
    if (!data?.primaryUPI || !data?.fallbackUPI) throw new Error('Malformed settings response');

    return {
      primary:   { id: data.primaryUPI,  label: 'Primary UPI',     qr: UPI_FALLBACK.primary.qr },
      secondary: { id: data.fallbackUPI, label: 'Alternative UPI', qr: UPI_FALLBACK.secondary.qr },
      payeeName: data.payeeName || UPI_FALLBACK.payeeName,
    };
  } catch (err) {
    console.warn('[payment.config] Falling back to hardcoded UPI config:', (err as Error).message);
    return {
      primary: UPI_FALLBACK.primary,
      secondary: UPI_FALLBACK.secondary,
      payeeName: UPI_FALLBACK.payeeName,
    };
  }
}

/** Formats a rupee amount with the ₹ symbol and Indian digit grouping, e.g. 1999 -> "₹1,999". */
export function formatAmount(amount: number): string {
  return `₹${new Intl.NumberFormat('en-IN').format(Math.round(amount))}`;
}

export const PAYMENT_CONFIG = {
  serviceCount: 25,
};
