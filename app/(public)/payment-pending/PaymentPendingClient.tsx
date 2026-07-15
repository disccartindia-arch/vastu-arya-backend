'use client';
/**
 * app/(public)/payment-pending/PaymentPendingClient.tsx
 * Enhanced pending screen: payment timeline, live status polling of
 * GET /api/payment/upi/status/:ref every 8 s (max 3 minutes). Auto-
 * redirects to /payment-success on verified, or /payment-failed on
 * rejected. UPI-fallback CTA + WhatsApp help preserved.
 */
export const dynamic = 'force-dynamic';
import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import PaymentTimeline, { PaymentTimelineStep } from '../../../components/payment/PaymentTimeline';
import { PAYMENT_ROUTES } from '../../../config/payment.config';
import { Clock, RefreshCw, MessageCircle, QrCode, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

function PendingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const ref    = params.get('ref')    || '';
  const name   = params.get('name')   || '';
  const amount = params.get('amount') || '11';
  const [checks, setChecks] = useState(0);
  const [lastChecked, setLastChecked] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const waMsg = encodeURIComponent(
    `🙏 Namaste!\n\nMy payment is pending verification.\nRef: ${ref}\nName: ${name}\nAmount: ₹${amount}`
  );

  useEffect(() => {
    if (!ref) return;
    let alive = true;
    const check = async () => {
      try {
        const res = await fetch(PAYMENT_ROUTES.upiStatus(ref), { cache: 'no-store' });
        const json = await res.json().catch(() => null);
        if (!alive) return;
        setChecks(c => c + 1);
        setLastChecked(new Date().toISOString());
        const status = (json?.data?.status || json?.data?.paymentStatus || '').toString().toLowerCase();
        if (status === 'verified' || status === 'paid') {
          router.push(`/payment-success?ref=${ref}&amount=${amount}`);
        } else if (status === 'rejected' || status === 'failed') {
          router.push(`/payment-failed?ref=${ref}&reason=verification_failed&amount=${amount}`);
        }
      } catch { /* transient — try again next tick */ }
    };
    // First check after 4s so the page has a moment to breathe
    const first = setTimeout(check, 4000);
    // Then every 8s
    timerRef.current = setInterval(check, 8000);
    // Stop after 3 minutes to avoid infinite polling
    const stop = setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
    }, 3 * 60 * 1000);
    return () => {
      alive = false;
      clearTimeout(first); clearTimeout(stop);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ref, amount, router]);

  const copyRef = () => { if (ref) navigator.clipboard?.writeText(ref).then(() => toast.success('Reference copied')); };

  const timeline: PaymentTimelineStep[] = [
    { key: 'submitted',   label: 'Payment submitted',    status: 'done' },
    { key: 'received',    label: 'Reference received',   status: 'done' },
    { key: 'verifying',   label: 'Under verification',   description: 'Usually takes a few minutes.', status: 'active' },
    { key: 'confirmed',   label: 'Booking confirmed',    status: 'pending' },
  ];

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center py-16 px-4">
      <div className="max-w-lg w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg p-6 sm:p-8" style={{ border: '1px solid rgba(212,160,23,0.15)' }}>
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center relative">
              <Clock size={36} className="text-amber-600" />
              <span className="absolute inset-0 rounded-full border-2 border-amber-300 animate-ping" style={{ animationDuration: '2s' }} />
            </div>
          </div>
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-3">
              <Clock size={12} /> Payment Pending
            </div>
            <h1 data-testid="payment-pending-heading" className="font-display text-2xl font-bold text-text-dark mb-2">Payment Under Verification</h1>
            <p className="text-text-light text-sm leading-relaxed">
              Your booking will be confirmed as soon as our team verifies the payment. This page auto-refreshes.
            </p>
          </div>

          {/* Ref */}
          {ref && (
            <div className="bg-white rounded-2xl p-4 mb-4 text-center" style={{ border: '1px solid rgba(212,160,23,0.22)' }}>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Booking Reference</p>
              <button data-testid="copy-ref-btn" onClick={copyRef} className="inline-flex items-center gap-2 font-mono font-bold text-lg text-primary">
                {ref} <Copy size={14} />
              </button>
            </div>
          )}

          {/* Live polling meta */}
          <div className="bg-orange-50 rounded-2xl p-3 mb-4 text-xs text-gray-600 flex items-center justify-between border border-orange-100">
            <span className="inline-flex items-center gap-1.5"><RefreshCw size={12} className="animate-spin" /> Checking status…</span>
            <span data-testid="poll-checks">{checks} check{checks === 1 ? '' : 's'}{lastChecked ? ` · ${new Date(lastChecked).toLocaleTimeString('en-IN', { hour12: false })}` : ''}</span>
          </div>

          <div className="mb-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment Timeline</h2>
            <PaymentTimeline steps={timeline} />
          </div>

          <div className="space-y-3">
            {ref && (
              <Link href={`/order-status?ref=${ref}`} data-testid="check-status-btn"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
                <RefreshCw size={16} /> Refresh Status Now
              </Link>
            )}
            <Link href="/book-appointment" data-testid="upi-fallback-btn"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-orange-200 text-primary font-semibold text-sm">
              <QrCode size={16} /> Pay via UPI Instead
            </Link>
            <a href={`https://wa.me/917000343804?text=${waMsg}`} target="_blank" rel="noopener noreferrer" data-testid="whatsapp-help-btn"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#25D366] text-white font-semibold text-sm">
              <MessageCircle size={16} /> WhatsApp for Help
            </a>
            <Link href="/" data-testid="home-btn" className="block text-center text-xs text-gray-400 hover:text-primary transition-colors">
              ← Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default function PaymentPendingPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-spin">🕉️</div></div>}>
        <PendingContent />
      </Suspense>
      <Footer />
    </>
  );
}
