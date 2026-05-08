// lib/razorpay.ts — Fix #6: Guard against undefined Razorpay key
import { paymentAPI } from './api';
import { loadRazorpayScript } from './utils';
import toast from 'react-hot-toast';

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
  // Fix #6 — Guard: never open the modal with key=undefined
  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!razorpayKey) {
    // eslint-disable-next-line no-console
    console.error('[Razorpay] NEXT_PUBLIC_RAZORPAY_KEY_ID is not set');
    toast.error('Payment system is not configured. Please contact support.');
    options.onFailure?.({
      message: 'Razorpay key not configured',
      code: 'RAZORPAY_KEY_MISSING',
    });
    return;
  }

  const loaded = await loadRazorpayScript();
  if (!loaded) {
    toast.error('Payment gateway failed to load. Please try again.');
    options.onFailure?.({ message: 'Script load failed' });
    return;
  }

  try {
    const { data } = await paymentAPI.createOrder({ amount: options.amount, type: options.type });
    if (!data.success) throw new Error('Failed to create order');

    const rzpOptions = {
      key: razorpayKey,          // Fix #6 — use local variable, never undefined
      amount: data.data.amount,
      currency: 'INR',
      name: 'Vastu Arya',
      description: options.description,
      image: '/logo.jpg',
      order_id: data.data.orderId,
      prefill: { name: options.name, email: options.email || '', contact: options.phone },
      theme: { color: '#FF6B00' },
      modal: { ondismiss: () => toast.error('Payment cancelled.') },
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
            throw new Error('Payment verification failed');
          }
        } catch (err) {
          toast.error('Payment verification failed. Contact support.');
          options.onFailure?.(err);
        }
      },
    };

    const rzp = new (window as any).Razorpay(rzpOptions);
    rzp.open();
  } catch (error: any) {
    toast.error(error.message || 'Payment initiation failed');
    options.onFailure?.(error);
  }
};
