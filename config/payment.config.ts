/**
 * payment.config.ts
 * ─────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for all payment configuration.
 * VastuArya.com
 *
 * DO NOT hardcode UPI IDs, QR paths, or payment settings anywhere else.
 * All services, products, and checkout pages must import from here.
 * ─────────────────────────────────────────────────────────────────
 */

export const PAYMENT_CONFIG = {
  // ── UPI Accounts ──────────────────────────────────────────────
  upi: {
    primary: {
      id: "aryavartguna@ybl",
      label: "VastuArya (Primary)",
      bank: "State Bank of India",
      accountLast4: "3356",
      // Path relative to /public — served by Next.js as static asset
      qrImagePath: "/images/qr/upi-primary-aryavartguna.jpeg",
    },
    secondary: {
      id: "vastuarya@ybl",
      label: "VastuArya (Secondary)",
      bank: "IDBI Bank",
      accountLast4: "9553",
      qrImagePath: "/images/qr/upi-secondary-vastuarya.jpeg",
    },
  },

  // ── Active UPI (used in payment modal) ────────────────────────
  // Change this to "secondary" to switch which QR/ID is shown by default
  activeUpi: "primary" as "primary" | "secondary",

  // ── Razorpay ──────────────────────────────────────────────────
  razorpay: {
    // Key is read from env at runtime — do not hardcode here
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
    currency: "INR",
    brandName: "VastuArya",
    brandColor: "#B8860B",
  },

  // ── Service Count ─────────────────────────────────────────────
  serviceCount: "25+",

  // ── Payment Instructions (shown in UPI modal) ─────────────────
  upiInstructions: [
    "Scan the QR code using any UPI app (PhonePe, GPay, Paytm, BHIM).",
    "Enter the exact amount shown.",
    "Complete the payment and take a screenshot.",
    'Upload the screenshot and click "I Have Paid".',
  ],

  // ── Status Labels ─────────────────────────────────────────────
  paymentStatus: {
    UPI_PENDING: "UPI_PENDING",   // User clicked "I Have Paid" — awaiting admin verification
    PAID: "PAID",                  // Admin verified — order/booking activated
    FAILED: "FAILED",
    PENDING: "PENDING",
    RAZORPAY_PENDING: "RAZORPAY_PENDING",
    RAZORPAY_PAID: "RAZORPAY_PAID",
  },
} as const;

// ── Helper: get active UPI account ────────────────────────────────
export function getActiveUpi() {
  return PAYMENT_CONFIG.upi[PAYMENT_CONFIG.activeUpi];
}

// ── Helper: format amount for display ─────────────────────────────
export function formatAmount(amountInRupees: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amountInRupees);
}
