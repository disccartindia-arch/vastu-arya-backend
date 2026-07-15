'use client';
/**
 * app/(public)/payment-failed/PaymentFailureClient.tsx
 * Enhanced failure screen: decoded error messages, timeline, retry,
 * UPI-fallback CTA (opens UPI modal with the failed amount preserved),
 * and WhatsApp help.
 */
export const dynamic = 'force-dynamic';
import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import PaymentTimeline, { PaymentTimelineStep } from '../../../components/payment/PaymentTimeline';
import UpiPaymentModal from '../../../components/payment/UpiPaymentModal';
import { XCircle, RefreshCw, MessageCircle, QrCode, Home, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

// Human-readable messages for known error codes from lib/razorpay.ts
const REASON_MAP: Record<string, string> = {
  script_load_failed:    'The payment gateway could not load — this often happens on flaky networks. Please try again or use the UPI QR fallback below.',
  create_order_failed:   'We could not create your payment order. This is a temporary server hiccup — please try again.',
  verification_failed:   'Your payment was received but our server could not verify it automatically. Please contact us on WhatsApp with your reference — we will confirm within minutes.',
  verification_error:    'A verification error occurred. If you were charged, your money is safe; message us on WhatsApp and we will resolve it.',
  user_dismissed:        'You closed the payment window before completing the payment. No amount was deducted.',
};

function decodeReason(raw: string): string {
  if (!raw) return 'Payment was not completed.';
  if (REASON_MAP[raw]) return REASON_MAP[raw];
  // If it's already a full sentence, return as-is.
  if (raw.length > 24 || /[a-z] [a-z]/.test(raw)) return raw;
  // Snake_case → sentence.
  return raw.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) + '.';
}

function FailedContent() {
  const params = useSearchParams();
  const router = useRouter();
  const ref     = params.get('ref')     || '';
  const rawReason = params.get('reason') || '';
  const reason  = decodeReason(rawReason);
  const amount  = parseInt(params.get('amount') || '11', 10) || 11;
  const service = params.get('service') || 'Vastu Consultation';
  const bookingId = params.get('bookingId') || '';
  const [upiOpen, setUpiOpen] = useState(false);

  const waMsg = encodeURIComponent(
    `🙏 Namaste!\n\nMy payment failed.\nRef: ${ref || '-'}\nService: ${service}\nAmount: ₹${amount}\nReason: ${rawReason || 'unknown'}\n\nPlease help me complete my booking.`
  );

  const timeline: PaymentTimelineStep[] = [
    { key: 'initiated', label: 'Payment initiated',   status: 'done'   },
    { key: 'gateway',   label: 'Payment gateway',     status: rawReason === 'script_load_failed' ? 'failed' : 'done' },
    { key: 'verified',  label: 'Backend verification', status: rawReason === 'verification_failed' || rawReason === 'verification_error' ? 'failed' : rawReason === 'user_dismissed' ? 'skipped' : 'skipped' },
    { key: 'confirmed', label: 'Booking confirmed',   status: 'failed' },
  ];

  const copyRef = () => { if (ref) navigator.clipboard?.writeText(ref).then(() => toast.success('Reference copied')); };
  const retry = () => { router.push('/book-appointment'); };

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center py-16 px-4">
      <div className="max-w-lg w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg p-6 sm:p-8" style={{ border: '1px solid rgba(220,38,38,0.15)' }}
        >
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle size={36} className="text-red-500" />
            </div>
          </div>
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-xs font-semibold mb-3">
              <XCircle size={12} /> Payment Failed
            </div>
            <h1 data-testid="payment-failed-heading" className="font-display text-2xl font-bold text-text-dark mb-2">Payment Not Completed</h1>
            <p className="text-text-light text-sm">No amount has been deducted from your account.</p>
          </div>

          {/* Reason card */}
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
            <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wider mb-1">Why this happened</p>
            <p className="text-sm text-red-800 leading-relaxed">{reason}</p>
          </div>

          {/* Ref */}
          {ref && (
            <div className="bg-white rounded-2xl p-4 mb-4 text-center" style={{ border: '1px solid rgba(212,160,23,0.22)' }}>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Reference</p>
              <button data-testid="copy-ref-btn" onClick={copyRef} className="inline-flex items-center gap-2 font-mono font-bold text-lg text-primary">
                {ref} <Copy size={14} />
              </button>
            </div>
          )}

          {/* Timeline */}
          <div className="mb-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment Timeline</h2>
            <PaymentTimeline steps={timeline} />
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button onClick={retry} data-testid="retry-btn"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
              <RefreshCw size={16} /> Try Payment Again
            </button>
            <button onClick={() => setUpiOpen(true)} data-testid="upi-fallback-btn"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-primary text-primary font-bold text-sm">
              <QrCode size={16} /> Pay ₹{amount} via UPI Instead
            </button>
            <a href={`https://wa.me/917000343804?text=${waMsg}`} target="_blank" rel="noopener noreferrer" data-testid="whatsapp-help-btn"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#25D366] text-white font-semibold text-sm">
              <MessageCircle size={16} /> Get Help on WhatsApp
            </a>
            <Link href="/" data-testid="home-btn"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-gray-500 font-medium text-sm hover:text-primary transition-colors">
              <Home size={14} /> Back to Home
            </Link>
          </div>

          <p className="text-center text-[11px] text-gray-400 mt-5">
            If any amount was deducted despite this failure, it will be auto-reversed by your bank within 5–7 business days.
          </p>
        </motion.div>
      </div>

      <UpiPaymentModal
        isOpen={upiOpen}
        onClose={() => setUpiOpen(false)}
        amount={amount}
        itemName={service}
        itemId={bookingId || ref || 'retry'}
        itemType={bookingId ? 'consultation' : 'service'}
        onSuccess={refId => {
          setUpiOpen(false);
          toast.success(`Payment submitted! Ref: ${refId}`);
        }}
      />
    </main>
  );
}

export default function PaymentFailurePage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-spin">🕉️</div></div>}>
        <FailedContent />
      </Suspense>
      <Footer />
    </>
  );
}
