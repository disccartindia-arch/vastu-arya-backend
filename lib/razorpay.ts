// lib/razorpay.ts — VastuArya v2 (with verified-only redirect)
let _cachedKey: string | null = null;

export async function getRazorpayKey(): Promise<string> {
  // 1. Build-time env (Vercel)
  if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
    return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  }
  // 2. In-memory cache
  if (_cachedKey) return _cachedKey;
  // 3. Runtime fetch from backend
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || '/api'}/settings/razorpay-key`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const { key } = await res.json();
      if (key) { _cachedKey = key; return key; }
    }
  } catch (_) {}
  throw new Error('Razorpay key not available. Please add NEXT_PUBLIC_RAZORPAY_KEY_ID to Vercel env vars.');
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src   = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

export interface RazorpayBookingOptions {
  orderId:    string;
  amount:     number;        // in paise
  currency?:  string;
  name:       string;
  phone:      string;
  email?:     string;
  bookingRef: string;
  description?: string;
}

export async function openRazorpayCheckout(
  opts: RazorpayBookingOptions
): Promise<void> {
  const [loaded, key] = await Promise.all([loadRazorpayScript(), getRazorpayKey()]);
  if (!loaded) throw new Error('Could not load Razorpay. Check your internet connection.');

  return new Promise((resolve, reject) => {
    const rzp = new (window as any).Razorpay({
      key,
      order_id:    opts.orderId,
      amount:      opts.amount,
      currency:    opts.currency || 'INR',
      name:        'Vastu Arya',
      description: opts.description || 'Vastu Consultation Booking',
      image:       '/logo.png',
      prefill: {
        name:    opts.name,
        contact: opts.phone,
        email:   opts.email || '',
      },
      theme:  { color: '#FF6B00' },
      modal:  { ondismiss: () => reject(new Error('dismissed')) },

      // ── Razorpay success callback ──────────────────────────────────────
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id:   string;
        razorpay_signature:  string;
      }) => {
        try {
          // Send to backend for HMAC verification — NEVER trust frontend alone
          const verifyRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || '/api'}/payment/verify`,
            {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_signature:  response.razorpay_signature,
                bookingRef:          opts.bookingRef,
              }),
            }
          );

          const data = await verifyRes.json();

          if (verifyRes.ok && data.success) {
            // ✅ Verified — redirect to confirm page with paid status
            window.location.href =
              `/booking-confirm?status=paid&ref=${encodeURIComponent(opts.bookingRef)}&paymentId=${encodeURIComponent(response.razorpay_payment_id)}`;
            resolve();
          } else {
            // Backend rejected — treat as pending, not failure
            window.location.href =
              `/payment-pending?ref=${encodeURIComponent(opts.bookingRef)}&name=${encodeURIComponent(opts.name)}`;
            resolve();
          }
        } catch (err) {
          // Network error during verify — mark pending (don't say failed — money may have moved)
          window.location.href =
            `/payment-pending?ref=${encodeURIComponent(opts.bookingRef)}&name=${encodeURIComponent(opts.name)}`;
          resolve();
        }
      },
    });

    // ── Razorpay failure event ─────────────────────────────────────────
    rzp.on('payment.failed', (resp: any) => {
      const reason = resp?.error?.description || resp?.error?.reason || 'Payment failed';
      window.location.href =
        `/payment-failed?ref=${encodeURIComponent(opts.bookingRef)}&reason=${encodeURIComponent(reason)}`;
      reject(new Error(reason));
    });

    rzp.open();
  });
}
