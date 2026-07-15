'use client';
/**
 * app/(public)/payment-success/PaymentSuccessClient.tsx
 * Premium success screen with animated burst, payment timeline, and
 * clear next-step CTAs. Backend contract unchanged — reads query params
 * (orderId, bookingId, ref, amount, service) and renders whichever are
 * present.
 */
export const dynamic = 'force-dynamic';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import PaymentTimeline, { PaymentTimelineStep } from '../../../components/payment/PaymentTimeline';
import { CheckCircle, Home, ShoppingBag, Calendar, Copy, Share2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function SuccessContent() {
  const params  = useSearchParams();
  const orderId  = params.get('orderId')   || '';
  const bookingId = params.get('bookingId') || '';
  const ref      = params.get('ref')       || orderId || bookingId;
  const amount   = params.get('amount')    || '';
  const service  = params.get('service')   || '';

  const [now] = useState(() => new Date().toISOString());

  const steps: PaymentTimelineStep[] = [
    { key: 'initiated', label: 'Payment initiated',  status: 'done', timestamp: now },
    { key: 'gateway',   label: 'Payment gateway completed', status: 'done', timestamp: now },
    { key: 'verified',  label: 'Backend verification passed', status: 'done', timestamp: now },
    { key: 'confirmed', label: 'Booking / order confirmed', description: 'Our team will reach out shortly.', status: 'done', timestamp: now },
  ];

  const copyRef = () => {
    if (!ref) return;
    navigator.clipboard?.writeText(ref).then(() => toast.success('Reference copied'));
  };

  const shareLink = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `My Vastu Arya payment is confirmed. Ref: ${ref}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: 'Vastu Arya', text, url }); return; } catch { /* dismissed */ }
    }
    const waMsg = encodeURIComponent(`🙏 ${text}\n${url}`);
    window.open(`https://wa.me/?text=${waMsg}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center py-16 px-4">
      <div className="max-w-lg w-full">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl shadow-orange p-6 sm:p-8"
          style={{ border: '1px solid rgba(212,160,23,0.15)' }}
        >
          {/* Animated check */}
          <div className="relative flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.55, times: [0, 0.6, 1] }}
              className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center relative z-10"
            >
              <CheckCircle size={44} className="text-green-500" />
            </motion.div>
            {/* Radial burst */}
            {[...Array(8)].map((_, i) => (
              <motion.span
                key={i}
                aria-hidden
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.4, 1.8] }}
                transition={{ duration: 0.8, delay: 0.2, times: [0, 0.4, 1] }}
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-primary"
                style={{
                  transform: `translate(-50%,-50%) rotate(${i * 45}deg) translateY(-46px)`,
                }}
              />
            ))}
          </div>

          <div className="text-center mb-6">
            <h1 data-testid="payment-success-heading" className="font-display text-3xl font-bold text-text-dark mb-1">
              Payment Successful
            </h1>
            <p className="text-text-light text-sm">Thank you for choosing Vastu Arya. Your booking is confirmed.</p>
          </div>

          {/* Meta card */}
          {(ref || amount || service) && (
            <div className="bg-orange-50 rounded-2xl p-4 mb-5 border border-orange-100 space-y-2 text-sm">
              {service && (
                <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-semibold text-gray-800 text-right">{service}</span></div>
              )}
              {amount && (
                <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-primary">₹{amount}</span></div>
              )}
              {ref && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Reference</span>
                  <button data-testid="copy-ref-btn" onClick={copyRef} className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-gray-800 hover:text-primary transition-colors">
                    {ref} <Copy size={12} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment Timeline</h2>
            <PaymentTimeline steps={steps} />
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {bookingId ? (
              <Link href={`/account/bookings/${bookingId}`} data-testid="view-booking-btn"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
                <Calendar size={16} /> View Booking
              </Link>
            ) : orderId ? (
              <Link href={`/account/orders/${orderId}`} data-testid="view-order-btn"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
                <ShoppingBag size={16} /> View Order
              </Link>
            ) : (
              <Link href="/account" data-testid="go-account-btn"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
                <Home size={16} /> Go to My Account
              </Link>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Link href="/vastu-store" data-testid="continue-shopping-btn"
                className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-orange-200 text-primary font-semibold text-sm">
                <ShoppingBag size={14} /> Continue Shopping
              </Link>
              <button onClick={shareLink} data-testid="share-btn"
                className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-orange-200 text-primary font-semibold text-sm">
                <Share2 size={14} /> Share
              </button>
            </div>
            <a
              href={`https://wa.me/917000343804?text=${encodeURIComponent(`🙏 Namaste! My payment is confirmed. Ref: ${ref || '-'} `)}`}
              target="_blank" rel="noopener noreferrer"
              data-testid="whatsapp-btn"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#25D366] text-white font-semibold text-sm">
              <MessageCircle size={14} /> Message us on WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-spin">🕉️</div></div>}>
        <SuccessContent />
      </Suspense>
      <Footer />
    </>
  );
}
