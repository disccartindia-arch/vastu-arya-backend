'use client';
// app/(public)/checkout/CheckoutClient.tsx — enhanced with progress indicator + UPI auto-fallback
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import WhatsAppButton from '../../../components/common/WhatsAppButton';
import UpiPaymentModal from '../../../components/payment/UpiPaymentModal';
import PaymentProgress, { PaymentStage } from '../../../components/payment/PaymentProgress';
import { useCartStore } from '../../../store/cartStore';
import { useUIStore } from '../../../store/uiStore';
import { initiateRazorpayPayment } from '../../../lib/razorpay';
import { formatPrice } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { Shield, Truck, RefreshCw, QrCode } from 'lucide-react';

interface FormState { name: string; email: string; phone: string; address: string; city: string; pincode: string; }
const EMPTY_FORM: FormState = { name: '', email: '', phone: '', address: '', city: '', pincode: '' };

function validate(form: FormState): string | null {
  if (!form.name.trim())    return 'Full name is required';
  if (!form.email.trim() || !form.email.includes('@')) return 'A valid email is required';
  if (!/^[6-9]\d{9}$/.test(form.phone)) return 'Enter a valid 10-digit Indian mobile number';
  if (!form.city.trim())    return 'City is required';
  if (!/^\d{6}$/.test(form.pincode)) return 'Enter a valid 6-digit PIN code';
  if (!form.address.trim()) return 'Delivery address is required';
  return null;
}

// Errors from lib/razorpay.ts that mean Razorpay is unusable *right now*
// → we auto-open the UPI fallback with the same amount/context so the
// customer never has to figure out what to do next.
const AUTO_FALLBACK_REASONS = new Set(['script_load_failed', 'create_order_failed']);

export default function CheckoutPage() {
  const router = useRouter();
  const { lang } = useUIStore();
  const { items, totalPrice, clearCart } = useCartStore();
  const [form, setForm]     = useState<FormState>(EMPTY_FORM);
  const [stage, setStage]   = useState<PaymentStage>('idle');
  const [upiOpen, setUpiOpen] = useState(false);

  const loading = stage !== 'idle' && stage !== 'failed' && stage !== 'done';

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="text-center py-20">
            <div className="text-5xl mb-3">🛒</div>
            <p className="font-display text-xl mb-4">Your cart is empty</p>
            <button onClick={() => router.push('/vastu-store')} data-testid="go-store-btn"
              className="bg-primary text-white px-6 py-3 rounded-xl font-semibold">Go to Store</button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleCheckout = async () => {
    const err = validate(form);
    if (err) { toast.error(err); return; }

    setStage('creating-order');

    const orderItems = items.map(i => ({
      name:  i.product.name.en, price: i.product.offerPrice, qty: i.qty,
      image: i.product.images?.[0] || '', product: i.product._id,
    }));

    await initiateRazorpayPayment({
      amount: totalPrice(), name: form.name, email: form.email, phone: form.phone,
      description: 'Vastu Store Order', type: 'product',
      orderData: {
        customerInfo: { name: form.name, email: form.email, phone: form.phone, address: form.address, city: form.city, pincode: form.pincode },
        items: orderItems, totalAmount: totalPrice(),
      },
      onSuccess: (data) => {
        setStage('done');
        clearCart();
        router.push(`/payment-success?orderId=${data.orderId || ''}&amount=${totalPrice()}`);
      },
      onFailure: (reason) => {
        setStage('failed');
        if (reason && AUTO_FALLBACK_REASONS.has(reason)) {
          // Razorpay is unusable — auto-open UPI fallback.
          toast('Payment gateway unavailable — showing UPI QR fallback.', { icon: 'ℹ️' });
          setUpiOpen(true);
        } else if (reason === 'user_dismissed') {
          // User closed the popup themselves — just quietly reset.
          setStage('idle');
        } else {
          // Other failures — go to the enhanced /payment-failed screen.
          const q = new URLSearchParams({
            amount: String(totalPrice()),
            service: 'Vastu Store Order',
            reason:  reason || '',
          });
          router.push(`/payment-failed?${q.toString()}`);
        }
      },
    });

    // Progress the stage as we know the gateway is open now.
    setStage(prev => (prev === 'creating-order' ? 'gateway' : prev));
  };

  const fields: { key: keyof FormState; label: string; placeholder: string; type?: string }[] = [
    { key: 'name',    label: 'Full Name *',    placeholder: 'Your full name' },
    { key: 'email',   label: 'Email *',        placeholder: 'your@email.com', type: 'email' },
    { key: 'phone',   label: 'Phone *',        placeholder: '10-digit mobile', type: 'tel' },
    { key: 'city',    label: 'City *',         placeholder: 'Your city' },
    { key: 'pincode', label: 'PIN Code *',     placeholder: '6-digit PIN', type: 'tel' },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h1 className="font-display text-3xl font-bold text-text-dark mb-8">{lang === 'en' ? 'Checkout' : 'चेकआउट'}</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Delivery form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-text-dark mb-4">{lang === 'en' ? 'Delivery Information' : 'डिलीवरी जानकारी'}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {fields.map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-text-mid mb-1">{f.label}</label>
                      <input data-testid={`checkout-input-${f.key}`}
                        type={f.type || 'text'} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder}
                        maxLength={f.key === 'phone' ? 10 : f.key === 'pincode' ? 6 : undefined} disabled={loading}
                        className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:border-primary text-sm disabled:opacity-60" />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-text-mid mb-1">Full Address *</label>
                    <textarea data-testid="checkout-input-address" value={form.address} onChange={set('address')} placeholder="House no, Street, Area..." rows={3} disabled={loading}
                      className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:border-primary text-sm resize-none disabled:opacity-60" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs text-text-light">
                <div className="bg-white rounded-xl p-3 shadow-sm flex flex-col items-center gap-1"><Shield size={16} className="text-green-500" /> Secure Payment</div>
                <div className="bg-white rounded-xl p-3 shadow-sm flex flex-col items-center gap-1"><Truck size={16} className="text-primary" /> Fast Delivery</div>
                <div className="bg-white rounded-xl p-3 shadow-sm flex flex-col items-center gap-1"><RefreshCw size={16} className="text-blue-500" /> Easy Returns</div>
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm h-fit sticky top-24">
              <h2 className="font-semibold text-text-dark mb-4">{lang === 'en' ? 'Order Summary' : 'ऑर्डर सारांश'}</h2>

              <div className="space-y-3 mb-4">
                {items.map(i => (
                  <div key={i.product._id} className="flex items-center gap-3">
                    {i.product.images?.[0] && <img src={i.product.images[0]} alt={i.product.name.en} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-mid truncate">{i.product.name.en}</p>
                      <p className="text-xs text-text-light">× {i.qty}</p>
                    </div>
                    <span className="font-semibold text-text-dark text-sm flex-shrink-0">{formatPrice(i.product.offerPrice * i.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-orange-100 pt-3 mb-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span><span className="text-primary">{formatPrice(totalPrice())}</span>
                </div>
              </div>

              {/* Live progress */}
              {stage !== 'idle' && (
                <div className="mb-4">
                  <PaymentProgress stage={stage} />
                </div>
              )}

              <button onClick={handleCheckout} disabled={loading} data-testid="pay-btn"
                className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold text-lg transition-all shadow-orange disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? (
                  <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" /><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" /></svg>Processing…</>
                ) : (<>🔒 Pay {formatPrice(totalPrice())}</>)}
              </button>

              <button onClick={() => setUpiOpen(true)} disabled={loading} data-testid="pay-upi-btn"
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-orange-200 text-primary font-semibold text-sm disabled:opacity-60">
                <QrCode size={14} /> Pay via UPI QR
              </button>

              <p className="text-center text-xs text-text-light mt-3">Secured by Razorpay · UPI · Cards · NetBanking</p>
            </div>
          </div>
        </div>
      </main>

      <UpiPaymentModal
        isOpen={upiOpen}
        onClose={() => setUpiOpen(false)}
        amount={totalPrice()}
        itemName="Vastu Store Order"
        itemId="cart"
        itemType="product"
        requiresAddress
        onSuccess={refId => {
          setUpiOpen(false);
          clearCart();
          toast.success(`Payment submitted! Ref: ${refId}`);
        }}
      />

      <Footer />
      <WhatsAppButton />
    </>
  );
}
