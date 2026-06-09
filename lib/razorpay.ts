// lib/razorpay.ts — Fixed: dynamic Razorpay key resolution
// Priority order:
//   1. NEXT_PUBLIC_RAZORPAY_KEY_ID (Vercel env var — fastest, set this for production)
//   2. In-memory cache from a previous settings fetch
//   3. Runtime fetch from /api/settings — works even without the env var
import { paymentAPI } from './api';
import { loadRazorpayScript } from './utils';
import toast from 'react-hot-toast';

let _cachedKey: string | null = null;

async function resolveRazorpayKey(): Promise<string | null> {
  // 1. Env var set at build time in Vercel (preferred)
  const envKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (envKey && envKey.startsWith('rzp_')) return envKey;

  // 2. In-memory cache from a prior settings call
  if (_cachedKey) return _cachedKey;

  // 3. Runtime fetch from backend — the key_id (not key_secret) is safe to expose
  try {
    const { default: api } = await import('./api');
    const res = await api.get('/settings');
    const key: string | undefined = res?.data?.data?.razorpayKeyId;
    if (key && key.startsWith('rzp_')) {
      _cachedKey = key;
      return key;
    }
  } catch (err) {
    console.warn('[Razorpay] Could not fetch key from /api/settings:', err);
  }

  return null;
}

interface PaymentOptions {
  amount: number;
  name: string;
  email?: string;
  phone: string;
  description: string;
  type: 'product' | 'service' | 'booking';
  orderData?: any;
  onSuccess: (data: any) => void;
  onFailure?: (error: any) => void;
}

export const initiateRazorpayPayment = async (options: PaymentOptions) => {
  const razorpayKey = await resolveRazorpayKey();

  if (!razorpayKey) {
    console.error(
      '[Razorpay] No key found.\n' +
      '  Option A (recommended): add NEXT_PUBLIC_RAZORPAY_KEY_ID to Vercel env vars and redeploy.\n' +
      '  Option B (no redeploy): go to Admin → Settings and paste your Razorpay key_id into the "Razorpay Key ID" field.'
    );
    toast.error('Payment system is not configured. Please contact support.');
    options.onFailure?.({ message: 'Razorpay key not configured', code: 'RAZORPAY_KEY_MISSING' });
    return;
  }

  const loaded = await loadRazorpayScript();
  if (!loaded) {
    toast.error('Payment gateway failed to load. Check your internet connection and try again.');
    options.onFailure?.({ message: 'Razorpay script failed to load' });
    return;
  }

  try {
    const { data } = await paymentAPI.createOrder({ amount: options.amount, type: options.type });
    if (!data.success) throw new Error(data.message || 'Failed to create payment order');

    const rzpOptions = {
      key: razorpayKey,
      amount: data.data.amount,
      currency: 'INR',
      name: 'Vastu Arya',
      description: options.description,
      image: '/logo.jpg',
      order_id: data.data.orderId,
      prefill: {
        name: options.name,
        email: options.email || '',
        contact: options.phone,
      },
      theme: { color: '#FF6B00' },
      modal: {
        ondismiss: () => {
          // Only show toast if user actively dismissed (not a script error)
          toast.error('Payment cancelled.');
          options.onFailure?.({ message: 'Payment dismissed by user' });
        },
      },
      handler: async (response: any) => {
        try {
          const verifyRes = await paymentAPI.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderData: options.orderData || {
              name: options.name,
              phone: options.phone,
              email: options.email,
              amount: options.amount,
              serviceName: options.description,
            },
            type: options.type,
          });
          if (verifyRes.data.success) {
            options.onSuccess(verifyRes.data.data);
          } else {
            throw new Error('Payment verification returned failure');
          }
        } catch (err: any) {
          console.error('[Razorpay] Verification error:', err);
          toast.error('Payment verification failed. Please contact support with your payment ID.');
          options.onFailure?.(err);
        }
      },
    };

    const rzp = new (window as any).Razorpay(rzpOptions);

    // Handle payment failures surfaced by Razorpay's own error events
    rzp.on('payment.failed', (resp: any) => {
      console.error('[Razorpay] Payment failed:', resp.error);
      toast.error(`Payment failed: ${resp.error?.description || 'Unknown error'}`);
      options.onFailure?.(resp.error);
    });

    rzp.open();
  } catch (error: any) {
    console.error('[Razorpay] Order creation error:', error);
    toast.error(error.response?.data?.message || error.message || 'Payment initiation failed. Please try again.');
    options.onFailure?.(error);
  }
};
