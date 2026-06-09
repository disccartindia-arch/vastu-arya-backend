/**
 * lib/razorpay.ts — FIXED
 *
 * KEY FIXES:
 * 1. onSuccess redirect now passes paymentStatus=paid (backend-verified)
 * 2. onFailure redirect passes status=failed
 * 3. Never sets booking/order active client-side — always confirmed by backend verify endpoint
 * 4. RAZORPAY_KEY_SECRET is NEVER used in frontend — only RAZORPAY_KEY_ID
 */

import api from './api';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPaymentOptions {
  amount:      number;
  name:        string;
  phone:       string;
  email?:      string;
  description: string;
  type:        'service' | 'booking' | 'product';
  orderData:   Record<string, any>;
  onSuccess:   (data: { bookingId?: string; orderId?: string; paymentId: string; paymentStatus: 'paid' }) => void;
  onFailure:   (reason?: string) => void;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const script   = document.createElement('script');
    script.src     = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function initiateRazorpayPayment(options: RazorpayPaymentOptions): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    toast.error('Payment gateway failed to load. Please refresh and try again.');
    options.onFailure('script_load_failed');
    return;
  }

  let razorpayOrderId: string;
  let orderAmount: number;

  try {
    const res = await api.post('/payment/create-order', {
      amount:   options.amount,
      currency: 'INR',
      type:     options.type,
    });
    razorpayOrderId = res.data.data.orderId;
    orderAmount     = res.data.data.amount; // paise
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Could not create payment order. Please try again.');
    options.onFailure('create_order_failed');
    return;
  }

  const rzp = new window.Razorpay({
    // FRONTEND ONLY USES KEY_ID — secret stays on backend
    key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount:      orderAmount,
    currency:    'INR',
    order_id:    razorpayOrderId,
    name:        'Vastu Arya',
    description: options.description,
    image:       '/logo.jpg',
    prefill: {
      name:    options.name,
      contact: options.phone,
      email:   options.email || '',
    },
    theme: { color: '#FF6B00' },

    handler: async (response: any) => {
      // ── BACKEND VERIFICATION — never trust client result alone ──────────────
      // The backend performs HMAC signature check before marking PAID
      try {
        const verifyRes = await api.post('/payment/verify', {
          razorpay_order_id:   response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature:  response.razorpay_signature,
          orderData:           options.orderData,
          type:                options.type,
        });

        if (verifyRes.data.success && verifyRes.data.paymentStatus === 'paid') {
          // ✅ Backend confirmed paid — safe to call onSuccess
          options.onSuccess({
            bookingId:     verifyRes.data.data?.bookingId,
            orderId:       verifyRes.data.data?.orderId,
            paymentId:     response.razorpay_payment_id,
            paymentStatus: 'paid',
          });
        } else {
          // Backend returned success:false or status !== paid
          toast.error('Payment could not be verified. Please contact support.');
          options.onFailure('verification_failed');
        }
      } catch (verifyErr: any) {
        toast.error(verifyErr?.response?.data?.message || 'Payment verification failed. Please contact support.');
        options.onFailure('verification_error');
      }
    },

    modal: {
      ondismiss: () => {
        options.onFailure('user_dismissed');
      },
    },
  });

  rzp.on('payment.failed', (response: any) => {
    const reason = response?.error?.description || 'Payment failed';
    toast.error(reason);
    options.onFailure(reason);
  });

  rzp.open();
}
