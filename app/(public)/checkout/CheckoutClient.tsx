'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import WhatsAppButton from '../../../components/common/WhatsAppButton';
import { useCartStore } from '../../../store/cartStore';
import { useUIStore } from '../../../store/uiStore';
import { initiateRazorpayPayment } from '../../../lib/razorpay';
import { formatPrice } from '../../../lib/utils';
import toast from 'react-hot-toast';
export default function CheckoutPage() {
  const router = useRouter();
  const { lang } = useUIStore();
  const { items, totalPrice, clearCart } = useCartStore();
  const [form, setForm] = useState({ name:'', email:'', phone:'', address:'', city:'', pincode:'' });
  const [loading, setLoading] = useState(false);
  if (items.length === 0) return (<><Navbar /><div className="min-h-screen bg-cream flex items-center justify-center"><div className="text-center py-20"><div className="text-5xl mb-3">🛒</div><p className="font-display text-xl mb-4">Your cart is empty</p><button onClick={() => router.push('/vastu-store')} className="bg-primary text-white px-6 py-3 rounded-xl font-semibold">Go to Store</button></div></div><Footer /></>);
  const handleCheckout = async () => {
    const { name, email, phone, address, city, pincode } = form;
    if (!name || !email || !phone || !address || !city || !pincode) return toast.error('Please fill all fields');
    setLoading(true);
    const orderItems = items.map(i => ({ name: i.product.name.en, price: i.product.offerPrice, qty: i.qty, image: i.product.images[0] || '', product: i.product._id }));
    await initiateRazorpayPayment({ amount: totalPrice(), name, email, phone, description: 'Vastu Store Order', type: 'product', orderData: { customerInfo: form, items: orderItems, totalAmount: totalPrice() }, onSuccess: (data) => { setLoading(false); clearCart(); router.push(`/payment-success?orderId=${data.orderId}`); }, onFailure: () => setLoading(false) });
  };
  return (<><Navbar /><main className="min-h-screen bg-cream py-12"><div className="max-w-5xl mx-auto px-4 sm:px-6">
    <h1 className="font-display text-3xl font-bold text-text-dark mb-8">{lang==='en'?'Checkout':'चेकआउट'}</h1>
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-text-dark mb-4">{lang==='en'?'Delivery Information':'डिलीवरी जानकारी'}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[{key:'name',label:'Full Name *',placeholder:'Your full name'},{key:'email',label:'Email *',placeholder:'your@email.com'},{key:'phone',label:'Phone *',placeholder:'10-digit number'},{key:'city',label:'City *',placeholder:'Your city'},{key:'pincode',label:'PIN Code *',placeholder:'6-digit PIN'}].map(f=>(<div key={f.key}><label className="block text-sm font-medium text-text-mid mb-1">{f.label}</label><input value={(form as any)[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} placeholder={f.placeholder} className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:border-primary text-sm"/></div>))}
          <div className="sm:col-span-2"><label className="block text-sm font-medium text-text-mid mb-1">Full Address *</label><textarea value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="House no, Street, Area..." rows={3} className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:border-primary text-sm resize-none"/></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm h-fit">
        <h2 className="font-semibold text-text-dark mb-4">{lang==='en'?'Order Summary':'ऑर्डर सारांश'}</h2>
        <div className="space-y-3 mb-4">{items.map(i=>(<div key={i.product._id} className="flex justify-between text-sm"><span className="text-text-mid line-clamp-1">{i.product.name.en} × {i.qty}</span><span className="font-semibold text-text-dark">{formatPrice(i.product.offerPrice*i.qty)}</span></div>))}</div>
        <div className="border-t border-orange-100 pt-3 mb-4"><div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary">{formatPrice(totalPrice())}</span></div></div>
        <button onClick={handleCheckout} disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold text-lg transition-all shadow-orange disabled:opacity-60">{loading?'⏳ Processing...':`🔒 Pay ${formatPrice(totalPrice())}`}</button>
      </div>
    </div>
  </div></main><Footer /><WhatsAppButton /></>);
}
