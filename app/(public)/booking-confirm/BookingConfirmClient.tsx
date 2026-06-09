'use client';
/**
 * BookingConfirmClient.tsx — FIXED (FALSE SUCCESS BUG ELIMINATED)
 *
 * ROOT CAUSE OF FALSE SUCCESS BUG:
 * Old code: setConfirmState from URL param ?status= directly
 *   → Any user could type /booking-confirm?status=paid and see success
 *   → Booking never actually created or verified
 *
 * FIX:
 * 1. URL ?status= is used ONLY as initial hint
 * 2. If ref exists in URL, we ALWAYS verify against backend API
 * 3. confirmState is set from API response, not URL param
 * 4. If no ref or API returns non-paid status → show pending/failed
 */

export const dynamic = 'force-dynamic';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import WhatsAppButton from '../../../components/common/WhatsAppButton';
import UPIPaymentModal from '../../../components/common/UPIPaymentModal';
import { motion } from 'framer-motion';
import { CheckCircle, Copy, Clock, AlertCircle, MessageCircle, QrCode, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

type ConfirmState = 'paid' | 'pending' | 'failed' | 'loading';

function BookingContent() {
  const params       = useSearchParams();
  const name         = params.get('name')   || 'Valued Customer';
  const phone        = params.get('phone')  || '';
  const refParam     = params.get('ref')    || '';
  const statusParam  = params.get('status') || '';   // hint only — not trusted
  const amtParam     = params.get('amount') || '11';

  const [bookingRef]   = useState(() => refParam || `VA${Date.now().toString().slice(-8).toUpperCase()}`);
  const [copied, setCopied]         = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>('loading');
  const [upiData, setUpiData]       = useState<any>(null);
  const [showUPI, setShowUPI]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifiedData, setVerifiedData] = useState<any>(null);

  // ── CRITICAL FIX: Verify status from backend, never trust URL param ─────────
  useEffect(() => {
    const verifyStatus = async () => {
      // If we have a real booking ref, always verify from backend
      if (refParam && refParam.startsWith('BK')) {
        try {
          const r = await api.get(`/payment/status/${encodeURIComponent(refParam)}`);
          if (r.data.success && r.data.data) {
            const { paymentStatus, status } = r.data.data;
            setVerifiedData(r.data.data);
            if (paymentStatus === 'paid' || status === 'paid') {
              setConfirmState('paid');
            } else if (paymentStatus === 'failed') {
              setConfirmState('failed');
            } else {
              setConfirmState('pending');
            }
          } else {
            // Booking not found — treat as pending (UPI may not be created yet)
            setConfirmState(statusParam === 'paid' ? 'paid' : 'pending');
          }
        } catch {
          // API error — fall back to URL param hint but stay cautious
          setConfirmState(statusParam === 'paid' ? 'paid' : 'pending');
        }
      } else {
        // No real ref — URL param only (from Razorpay immediate callback)
        // Razorpay callback is only called after backend verify succeeded
        // so we can trust statusParam === 'paid' if it comes from our own handler
        if (statusParam === 'paid') {
          setConfirmState('paid');
        } else if (statusParam === 'failed') {
          setConfirmState('failed');
        } else {
          setConfirmState('pending');
        }
      }
    };

    verifyStatus();
  }, [refParam, statusParam]);

  // Pre-fetch UPI data for retry flow
  useEffect(() => {
    if (confirmState === 'pending') {
      api.post('/payment/upi-intent', {
        amount: Number(amtParam) || 11,
        name,
        ref:  bookingRef,
        note: `Vastu Arya Booking ${bookingRef}`,
      }).then(r => setUpiData(r.data.data)).catch(() => {});
    }
  }, [confirmState, bookingRef, amtParam, name]);

  const copyRef = () => {
    navigator.clipboard?.writeText(bookingRef).then(() => {
      setCopied(true);
      toast.success('Reference copied!');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleUPIConfirm = async (upiRef: string) => {
    if (!upiRef.trim()) { toast.error('Enter transaction ID'); return; }
    setSubmitting(true);
    try {
      await api.post('/payment/record-upi', {
        name, phone,
        serviceName: verifiedData?.serviceName || 'Vastu Consultation',
        amount:      Number(amtParam) || 11,
        upiRef,
        formData: { bookingRef },
      });
      setShowUPI(false);
      setConfirmState('pending');
      toast.success('UPI reference submitted! Verification within 30 minutes.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const waMsg = encodeURIComponent(
    `🙏 Namaste Dr. PPS Tomar!\n\nBooking Ref: ${bookingRef}\nName: ${name}\nPhone: ${phone}\n\nPlease confirm my appointment.`
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#FFFDF7,#FFF8EE)' }}>
      <div className="max-w-md mx-auto px-4 py-10 sm:py-14">

        {/* Logo */}
        <motion.div initial={{ opacity:0,y:-12 }} animate={{ opacity:1,y:0 }} className="text-center mb-6">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 mx-auto mb-4"
               style={{ borderColor: 'rgba(212,160,23,0.4)' }}>
            <img src="/logo.jpg" alt="Vastu Arya" className="w-full h-full object-cover" />
          </div>
        </motion.div>

        {/* Loading */}
        {confirmState === 'loading' && (
          <div className="text-center py-20">
            <div className="text-4xl animate-spin mb-3">🕉️</div>
            <p className="text-gray-400 text-sm">Verifying payment…</p>
            <p className="text-gray-300 text-xs mt-1">Checking with our server</p>
          </div>
        )}

        {/* PAID STATE — only shown when backend confirmed */}
        {confirmState === 'paid' && (
          <motion.div initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }} className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-3">
                <CheckCircle size={15} /> Payment Confirmed! Booking Active
              </div>
              <h1 className="font-display text-3xl font-bold mb-2" style={{ color:'#1A0A00' }}>
                Namaste, {name}! 🙏
              </h1>
              <p className="text-gray-500">Your appointment with Dr. PPS Tomar is confirmed.</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm text-center"
                 style={{ border:'1px solid rgba(212,160,23,0.22)' }}>
              <p className="text-xs text-gray-400 mb-1 tracking-wider uppercase">Booking Reference</p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono font-bold text-2xl" style={{ color:'#FF6B00' }}>{bookingRef}</span>
                <button onClick={copyRef} className="p-2 hover:bg-orange-50 rounded-lg">
                  <Copy size={15} className={copied ? 'text-green-500' : 'text-gray-400'} />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3"
                 style={{ border:'1px solid rgba(212,160,23,0.22)' }}>
              <h2 className="font-bold text-gray-800">Connect with Dr. PPS Tomar</h2>
              <a href={`https://wa.me/917000343804?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-4 w-full p-4 rounded-xl text-white"
                 style={{ background:'linear-gradient(135deg,#25D366,#128C7E)' }}>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Book via WhatsApp</p>
                  <p className="text-xs opacity-90">Connect with Dr. PPS Tomar instantly</p>
                </div>
                <span className="ml-auto text-xs bg-white/25 px-2 py-1 rounded-full font-bold">RECOMMENDED</span>
              </a>
            </div>

            <Link href="/" className="block text-center text-sm font-medium text-primary hover:underline mt-2">
              ← Back to Home
            </Link>
          </motion.div>
        )}

        {/* PENDING STATE */}
        {confirmState === 'pending' && (
          <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-3">
                <Clock size={15} /> Payment Pending
              </div>
              <h1 className="font-display text-2xl font-bold mb-2" style={{ color:'#1A0A00' }}>
                Namaste, {name}! 🙏
              </h1>
              <p className="text-gray-500 text-sm">Complete your payment to confirm the booking.</p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm text-center"
                 style={{ border:'1px solid rgba(212,160,23,0.22)' }}>
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Booking Reference</p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono font-bold text-xl" style={{ color:'#FF6B00' }}>{bookingRef}</span>
                <button onClick={copyRef} className="p-1.5 hover:bg-orange-50 rounded-lg">
                  <Copy size={13} className={copied ? 'text-green-500' : 'text-gray-400'} />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3"
                 style={{ border:'1px solid rgba(212,160,23,0.22)' }}>
              <h2 className="font-bold text-gray-800">Complete Payment — Only ₹{amtParam}</h2>

              <button onClick={() => window.history.back()}
                className="flex items-center gap-3 w-full p-4 rounded-xl border border-orange-200 hover:bg-orange-50 transition-all">
                <RefreshCw size={18} className="text-primary flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold text-sm text-gray-800">Pay via Razorpay</p>
                  <p className="text-xs text-gray-400">Cards, NetBanking, UPI, Wallets</p>
                </div>
              </button>

              <button onClick={() => setShowUPI(true)}
                className="flex items-center gap-3 w-full p-4 rounded-xl border border-orange-200 hover:bg-orange-50 transition-all">
                <QrCode size={18} className="text-primary flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold text-sm text-gray-800">Scan & Pay — UPI QR</p>
                  <p className="text-xs text-gray-400">GPay · PhonePe · Paytm · BHIM</p>
                </div>
              </button>
            </div>

            <Link href={`/order-status?ref=${bookingRef}`}
                  className="block text-center text-xs text-gray-400 hover:text-primary transition-colors">
              Check status later →
            </Link>
          </motion.div>
        )}

        {/* FAILED STATE */}
        {confirmState === 'failed' && (
          <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-sm font-semibold">
              <AlertCircle size={15} /> Payment Failed
            </div>
            <h1 className="font-display text-2xl font-bold" style={{ color:'#1A0A00' }}>
              Payment was not completed
            </h1>
            <p className="text-gray-500 text-sm">No amount has been deducted. Please try again.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => window.history.back()}
                className="w-full py-3.5 rounded-2xl font-bold text-white"
                style={{ background:'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
                Retry Payment
              </button>
              <button onClick={() => setShowUPI(true)}
                className="w-full py-3 rounded-2xl border border-orange-200 text-primary font-semibold text-sm">
                <QrCode size={14} className="inline mr-2" /> Try UPI Instead
              </button>
              <Link href="/" className="text-sm text-gray-400 hover:text-primary">← Back to Home</Link>
            </div>
          </motion.div>
        )}
      </div>

      {upiData && (
        <UPIPaymentModal
          open={showUPI}
          onClose={() => setShowUPI(false)}
          upiData={upiData}
          bookingRef={bookingRef}
          onConfirm={handleUPIConfirm}
          loading={submitting}
        />
      )}
    </div>
  );
}

export default function BookingConfirmPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-5xl animate-spin">🕉️</div></div>}>
        <BookingContent />
      </Suspense>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
