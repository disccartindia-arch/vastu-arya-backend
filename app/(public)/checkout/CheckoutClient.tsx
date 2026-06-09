'use client';
/**
 * CheckoutClient.tsx — FIXED
 * - Uses backend-verified razorpay flow
 * - onSuccess only called when backend confirms paymentStatus === 'paid'
 * - UPI option added with correct aryavartguna@ybl
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import WhatsAppButton from '../../../components/common/WhatsAppButton';
import UPIPaymentModal from '../../../components/common/UPIPaymentModal';
import { useCartStore } from '../../../store/cartStore';
import { useUIStore } from '../../../store/uiStore';
import { initiateRazorpayPayment } from '../../../lib/razorpay';
import { formatPrice } from '../../../lib/utils';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Shield, Truck, RefreshCw, QrCode } from 'lucide-react';

interface FormState {
  name: string; email: string; phone: string;
  address: string; city: string; pincode: string;
}
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

export default function CheckoutPage() {
  const router = useRouter();
  const { lang } = useUIStore();
  const { items, totalPrice, clearCart } = useCartStore();
  const [form, setForm]       = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [upiOpen, setUpiOpen] = useState(false);
  const [upiData, setUpiData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="text-center py-20">
            <div className="text-5xl mb-3">🛒</div>
            <p className="font-display text-xl mb-4">Your cart is empty</p>
            <button onClick={() => router.push('/vastu-store')}
              className="bg-primary text-white px-6 py-3 rounded-xl font-semibold">
              Go to Store
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const getOrderItems = () => items.map(i => ({
    name:    i.product.name.en,
    price:   i.product.offerPrice,
    qty:     i.qty,
    image:   i.product.images?.[0] || '',
    product: i.product._id,
  }));

  const handleRazorpay = async () => {
    const err = validate(form);
    if (err) { toast.error(err); return; }
    setLoading(true);

    await initiateRazorpayPayment({
      amount:      totalPrice(),
      name:        form.name,
      email:       form.email,
      phone:       form.phone,
      description: 'Vastu Store Order',
      type:        'product',
      orderData: {
        customerInfo: { name: form.name, email: form.email, phone: form.phone, address: form.address, city: form.city, pincode: form.pincode },
        items:       getOrderItems(),
        totalAmount: totalPrice(),
      },
      onSuccess: (data) => {
        setLoading(false);
        clearCart();
        router.push(`/payment-success?orderId=${data.orderId || ''}&status=paid`);
      },
      onFailure: (reason) => {
        setLoading(false);
        if (reason !== 'user_dismissed') {
          router.push(`/payment-failed?reason=${encodeURIComponent(reason || 'Payment failed')}`);
        }
      },
    });
  };

  const handleUPIOpen = async () => {
    const err = validate(form);
    if (err) { toast.error(err); return; }
    try {
      const ref = `ORD${Date.now().toString().slice(-8)}`;
      const r = await api.post('/payment/upi-intent', {
        amount: totalPrice(),
        name:   form.name,
        ref,
        note:   'Vastu Store Order',
      });
      setUpiData(r.data.data);
      setUpiOpen(true);
    } catch {
      toast.error('Could not load UPI payment. Please use Razorpay.');
    }
  };

  const handleUPIConfirm = async (upiRef: string) => {
    if (!upiRef.trim()) { toast.error('Enter UPI transaction ID'); return; }
    setSubmitting(true);
    try {
      // For product orders via UPI — create pending order
      const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
      await api.post('/payment/record-upi', {
        name:        form.name,
        phone:       form.phone,
        email:       form.email,
        serviceName: 'Product Order',
        amount:      totalPrice(),
        upiRef,
        formData: {
          customerInfo: { name: form.name, email: form.email, phone: form.phone, address: form.address, city: form.city, pincode: form.pincode },
          items:       getOrderItems(),
          totalAmount: totalPrice(),
          orderId,
        },
      });
      setUpiOpen(false);
      clearCart();
      router.push(`/payment-pending?ref=${orderId}&name=${encodeURIComponent(form.name)}&amount=${totalPrice()}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to record UPI payment. Try Razorpay.');
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="font-display text-3xl font-bold text-text-dark mb-8">
            {lang === 'en' ? 'Checkout' : 'चेकआउट'}
          </h1>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-text-dark mb-4">Delivery Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {fields.map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-text-mid mb-1">{f.label}</label>
                      <input type={f.type || 'text'} value={form[f.key]} onChange={set(f.key)}
                        placeholder={f.placeholder}
                        maxLength={f.key === 'phone' ? 10 : f.key === 'pincode' ? 6 : undefined}
                        disabled={loading}
                        className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:border-primary text-sm disabled:opacity-60"/>
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-text-mid mb-1">Full Address *</label>
                    <textarea value={form.address} onChange={set('address')}
                      placeholder="House no, Street, Area..." rows={3} disabled={loading}
                      className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:border-primary text-sm resize-none disabled:opacity-60"/>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs text-text-light">
                <div className="bg-white rounded-xl p-3 shadow-sm flex flex-col items-center gap-1"><Shield size={16} className="text-green-500" /> Secure Payment</div>
                <div className="bg-white rounded-xl p-3 shadow-sm flex flex-col items-center gap-1"><Truck size={16} className="text-primary" /> Fast Delivery</div>
                <div className="bg-white rounded-xl p-3 shadow-sm flex flex-col items-center gap-1"><RefreshCw size={16} className="text-blue-500" /> Easy Returns</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm h-fit sticky top-24">
              <h2 className="font-semibold text-text-dark mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {items.map(i => (
                  <div key={i.product._id} className="flex items-center gap-3">
                    {i.product.images?.[0] && <img src={i.product.images[0]} alt={i.product.name.en} className="w-10 h-10 rounded-lg object-cover flex-shrink-0"/>}
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
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(totalPrice())}</span>
                </div>
              </div>

              {/* Razorpay button */}
              <button onClick={handleRazorpay} disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold text-lg transition-all shadow-orange disabled:opacity-60 flex items-center justify-center gap-2 mb-3">
                {loading ? (<><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/></svg>Opening Payment…</>) : (<>🔒 Pay {formatPrice(totalPrice())}</>)}
              </button>

              {/* UPI option */}
              <button onClick={handleUPIOpen} disabled={loading}
                className="w-full border-2 border-primary text-primary py-3.5 rounded-xl font-bold text-base transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                <QrCode size={18} /> Pay via UPI QR
              </button>

              <p className="text-center text-xs text-text-light mt-3">
                Secured by Razorpay · UPI · Cards · NetBanking
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />

      {upiData && (
        <UPIPaymentModal
          open={upiOpen}
          onClose={() => setUpiOpen(false)}
          upiData={upiData}
          bookingRef={`ORD${Date.now().toString().slice(-8)}`}
          onConfirm={handleUPIConfirm}
          loading={submitting}
        />
      )}
    </>
  );
}
