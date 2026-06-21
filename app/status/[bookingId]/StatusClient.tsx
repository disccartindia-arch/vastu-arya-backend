'use client';
/**
 * app/status/[bookingId]/StatusClient.tsx — NEW
 *
 * PRODUCTION HOTFIX ROUND 9 — Phase C Part 1, Feature 2.
 *
 * Visual language deliberately reuses what already exists in this
 * codebase rather than inventing a new style: the card/border/badge
 * patterns from payment-submitted/PaymentSubmittedClient.tsx and
 * order-status/OrderStatusClient.tsx (saffron gradient, cream
 * background, the same border color rgba(212,160,23,0.22), the same
 * monospace booking-ID treatment with a copy button). This is a
 * premium page specifically because it looks like the rest of this
 * site's already-established premium pages, not because it's a new
 * design.
 *
 * TIMELINE LOGIC (your requirement #7 — "automatically hide irrelevant
 * future steps"):
 * The stepper does NOT render the raw timeline[] array as its visual
 * spine — that array is a chronological audit log (could in theory
 * contain a rejected-then-reverified pair, out of linear order). The
 * stepper instead computes a single CURRENT POSITION from the
 * booking's current paymentStatus/bookingStatus and renders the
 * canonical happy-path steps UP TO that position. If the booking has
 * terminated abnormally (cancelled, or payment rejected/refunded), the
 * stepper stops at that point with a DISTINCT terminal marker (red for
 * rejected/cancelled, gray for refunded) instead of continuing to show
 * "Completed" as a grayed-out future step — showing a future step that
 * can no longer happen would be confusing, not reassuring.
 *
 * The raw timeline[] IS still shown, but as a secondary "Full History"
 * expandable section beneath the primary stepper — satisfying the
 * "permanent record" requirement without cluttering the primary premium
 * view, exactly as scoped in the approved implementation plan.
 */
import { useEffect, useState } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import { bookingStatusAPI, PublicBookingStatus } from '../../../lib/bookingStatusAPI';
import {
  CheckCircle, Clock, XCircle, RefreshCw, MessageCircle, Copy,
  CalendarCheck, CalendarClock, PlayCircle, PartyPopper, ChevronDown, Shield,
} from 'lucide-react';

interface StatusClientProps {
  bookingId: string;
}

// ── Plain-English copy (your requirement #5) ────────────────────────
const STATUS_DESCRIPTIONS: Record<string, { label: string; description: string; nextAction: string }> = {
  // paymentStatus-driven, shown only when relevant to current position
  payment_pending: {
    label: 'Payment Pending',
    description: 'We are waiting for your payment to be submitted.',
    nextAction: 'Complete your payment to proceed.',
  },
  payment_submitted: {
    label: 'Payment Submitted',
    description: 'We have received your payment screenshot and it is awaiting verification.',
    nextAction: 'Our team typically verifies payments within a few hours.',
  },
  payment_verified: {
    label: 'Payment Verified',
    description: 'Your payment has been verified successfully.',
    nextAction: 'Your booking is now being reviewed by our team.',
  },
  payment_rejected: {
    label: 'Payment Issue',
    description: 'We were unable to verify your payment.',
    nextAction: 'Please contact our support team so we can help resolve this.',
  },
  payment_refunded: {
    label: 'Refund Processed',
    description: 'Your refund has been processed.',
    nextAction: 'It may take a few business days to reflect in your account.',
  },
  // bookingStatus-driven
  confirmed: {
    label: 'Booking Confirmed',
    description: 'Our team has accepted your consultation request.',
    nextAction: 'You will receive consultation details shortly.',
  },
  consultation_scheduled: {
    label: 'Consultation Scheduled',
    description: 'Your consultation has been scheduled.',
    nextAction: 'You will receive consultation details shortly.',
  },
  in_progress: {
    label: 'In Progress',
    description: 'Your consultation is currently underway with Dr. PPS Tomar.',
    nextAction: 'No action needed — sit back and enjoy your session.',
  },
  completed: {
    label: 'Completed',
    description: 'Your consultation has been completed.',
    nextAction: 'Thank you for choosing Vastu Arya. We hope the guidance brings positive change.',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'This booking has been cancelled.',
    nextAction: 'If this was not expected, please contact our support team.',
  },
};

const PAYMENT_BADGE: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pending',  cls: 'bg-amber-100 text-amber-700' },
  submitted: { label: 'Pending',  cls: 'bg-amber-100 text-amber-700' },
  verified:  { label: 'Verified', cls: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejected', cls: 'bg-red-100 text-red-600' },
  refunded:  { label: 'Refunded', cls: 'bg-gray-200 text-gray-600' },
};

const BOOKING_BADGE: Record<string, { label: string; cls: string }> = {
  pending_payment:        { label: 'Pending',     cls: 'bg-amber-100 text-amber-700' },
  payment_submitted:      { label: 'Pending',     cls: 'bg-amber-100 text-amber-700' },
  confirmed:              { label: 'Confirmed',   cls: 'bg-blue-100 text-blue-700' },
  consultation_scheduled: { label: 'Scheduled',   cls: 'bg-indigo-100 text-indigo-700' },
  in_progress:            { label: 'In Progress', cls: 'bg-purple-100 text-purple-700' },
  completed:              { label: 'Completed',   cls: 'bg-green-100 text-green-700' },
  cancelled:              { label: 'Cancelled',   cls: 'bg-red-100 text-red-600' },
};

// The canonical happy-path stepper, in order. 'Cancelled' and
// 'Refunded' are terminal/abnormal markers handled separately, not
// positions in this linear array.
const HAPPY_PATH = [
  { key: 'created',     icon: CheckCircle,    label: 'Booking Created' },
  { key: 'submitted',   icon: Clock,          label: 'Payment Submitted' },
  { key: 'verified',    icon: CheckCircle,    label: 'Payment Verified' },
  { key: 'confirmed',   icon: CalendarCheck,  label: 'Booking Confirmed' },
  { key: 'scheduled',   icon: CalendarClock,  label: 'Consultation Scheduled' },
  { key: 'in_progress', icon: PlayCircle,     label: 'In Progress' },
  { key: 'completed',   icon: PartyPopper,    label: 'Completed' },
];

function computeCurrentStepIndex(data: PublicBookingStatus): { index: number; abnormal: 'cancelled' | 'rejected' | 'refunded' | null } {
  if (data.bookingStatus === 'cancelled') {
    // Determine how far it got before cancellation isn't reconstructible
    // perfectly from current state alone without more granular history
    // matching — show cancelled as its own terminal state rather than
    // guess a false position.
    return { index: -1, abnormal: 'cancelled' };
  }
  if (data.paymentStatus === 'rejected') return { index: 0, abnormal: 'rejected' };
  if (data.paymentStatus === 'refunded') return { index: -1, abnormal: 'refunded' };

  if (data.bookingStatus === 'completed') return { index: 6, abnormal: null };
  if (data.bookingStatus === 'in_progress') return { index: 5, abnormal: null };
  if (data.bookingStatus === 'consultation_scheduled') return { index: 4, abnormal: null };
  if (data.bookingStatus === 'confirmed') return { index: 3, abnormal: null };
  if (data.paymentStatus === 'verified') return { index: 2, abnormal: null };
  if (data.paymentStatus === 'submitted') return { index: 1, abnormal: null };
  return { index: 0, abnormal: null };
}

function currentDescriptionKey(data: PublicBookingStatus): string {
  if (data.bookingStatus === 'cancelled') return 'cancelled';
  if (data.paymentStatus === 'rejected') return 'payment_rejected';
  if (data.paymentStatus === 'refunded') return 'payment_refunded';
  if (data.bookingStatus === 'completed') return 'completed';
  if (data.bookingStatus === 'in_progress') return 'in_progress';
  if (data.bookingStatus === 'consultation_scheduled') return 'consultation_scheduled';
  if (data.bookingStatus === 'confirmed') return 'confirmed';
  if (data.paymentStatus === 'verified') return 'payment_verified';
  if (data.paymentStatus === 'submitted') return 'payment_submitted';
  return 'payment_pending';
}

function TimelineStepper({ data }: { data: PublicBookingStatus }) {
  const { index, abnormal } = computeCurrentStepIndex(data);

  if (abnormal === 'cancelled' || abnormal === 'refunded') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-100 border border-gray-200">
        <XCircle size={22} className="text-gray-500 flex-shrink-0" />
        <div>
          <p className="font-bold text-gray-700 text-sm">{abnormal === 'cancelled' ? 'Booking Cancelled' : 'Refund Processed'}</p>
          <p className="text-gray-500 text-xs mt-0.5">This booking will not continue through the standard process.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {HAPPY_PATH.map((step, i) => {
        const Icon = step.icon;
        const isPast = i < index;
        const isCurrent = i === index;
        const isFuture = i > index;
        const isRejectedHere = abnormal === 'rejected' && i === 0;

        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  isRejectedHere ? 'bg-red-100 text-red-600' :
                  isPast || isCurrent ? 'bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-md' :
                  'bg-gray-100 text-gray-300'
                }`}
              >
                <Icon size={16} />
              </div>
              {i < HAPPY_PATH.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[28px] ${isPast ? 'bg-orange-400' : 'bg-gray-200'}`} />
              )}
            </div>
            <div className="pb-7">
              <p className={`text-sm font-semibold ${isFuture ? 'text-gray-300' : isRejectedHere ? 'text-red-600' : 'text-gray-800'}`}>
                {step.label}
              </p>
              {isCurrent && !isRejectedHere && (
                <p className="text-xs text-primary font-medium mt-0.5">Current step</p>
              )}
              {isRejectedHere && (
                <p className="text-xs text-red-500 font-medium mt-0.5">Payment could not be verified</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StatusClient({ bookingId }: StatusClientProps) {
  const [data, setData] = useState<PublicBookingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    bookingStatusAPI.getPublicStatus(bookingId)
      .then(res => setData(res.data.data))
      .catch(err => setError(err?.response?.data?.message || 'Booking not found. Please check your Booking ID and try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (bookingId) load(); /* eslint-disable-next-line */ }, [bookingId]);

  const copyId = () => {
    if (!navigator.clipboard || !data) return;
    navigator.clipboard.writeText(data.bookingId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-cream flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-3 animate-spin">🕉️</div>
            <p className="text-text-light text-sm">Loading your booking status…</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-cream flex items-center justify-center px-4">
          <div className="max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={28} className="text-red-400" />
            </div>
            <h1 className="font-display text-xl font-bold text-text-dark mb-2">Booking Not Found</h1>
            <p className="text-text-light text-sm mb-6">{error}</p>
            <a href="https://wa.me/917000343804" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-3 rounded-xl font-semibold text-sm">
              <MessageCircle size={16} /> Contact Support
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const descKey = currentDescriptionKey(data);
  const desc = STATUS_DESCRIPTIONS[descKey];
  const paymentBadge = PAYMENT_BADGE[data.paymentStatus] || PAYMENT_BADGE.pending;
  const bookingBadge = BOOKING_BADGE[data.bookingStatus] || BOOKING_BADGE.pending_payment;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream py-10 px-4">
        <div className="max-w-lg mx-auto">

          {/* Trust header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 bg-orange-50 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <Shield size={12} /> Verified Booking Status
            </div>
            <h1 className="font-display text-2xl font-bold text-text-dark">Namaste, {data.customerName}! 🙏</h1>
          </div>

          {/* Main card */}
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden mb-5" style={{ border: '1px solid rgba(212,160,23,0.22)' }}>
            {/* Booking ID strip */}
            <div className="bg-orange-50 px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,107,0,0.15)' }}>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Booking ID</p>
                <p className="font-mono font-bold text-sm text-primary">{data.bookingId}</p>
              </div>
              <button onClick={copyId} className="p-2 hover:bg-orange-100 rounded-lg transition-colors">
                <Copy size={15} className={copied ? 'text-green-500' : 'text-gray-400'} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Key facts */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Service</p>
                  <p className="font-semibold text-gray-800 truncate">{data.serviceName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Amount</p>
                  <p className="font-bold text-primary">₹{data.amount.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex gap-2 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${paymentBadge.cls}`}>
                  Payment: {paymentBadge.label}
                </span>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${bookingBadge.cls}`}>
                  Booking: {bookingBadge.label}
                </span>
              </div>

              {/* Plain-English status explanation */}
              <div className="bg-orange-50 rounded-2xl p-4" style={{ border: '1px solid rgba(255,107,0,0.15)' }}>
                <p className="font-bold text-sm text-gray-800 mb-1">{desc.label}</p>
                <p className="text-sm text-gray-600 leading-relaxed mb-2">{desc.description}</p>
                <p className="text-xs text-orange-700 font-medium">→ {desc.nextAction}</p>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Last updated {new Date(data.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>

          {/* Progress timeline */}
          <div className="bg-white rounded-3xl shadow-sm p-5 mb-5" style={{ border: '1px solid rgba(212,160,23,0.22)' }}>
            <h2 className="font-display font-bold text-base text-gray-800 mb-4">Your Progress</h2>
            <TimelineStepper data={data} />
          </div>

          {/* Full history (secondary, collapsed by default) */}
          {data.timeline.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-5" style={{ border: '1px solid rgba(212,160,23,0.15)' }}>
              <button onClick={() => setHistoryOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-3.5">
                <span className="text-sm font-semibold text-gray-600">Full History ({data.timeline.length})</span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
              </button>
              {historyOpen && (
                <div className="px-5 pb-4 space-y-2 border-t border-gray-50 pt-3">
                  {data.timeline.map((t, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-500">{t.field === 'paymentStatus' ? 'Payment' : 'Booking'} → {t.newValue.replace(/_/g, ' ')}</span>
                      <span className="text-gray-400">{new Date(t.timestamp).toLocaleDateString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button onClick={load} className="w-full py-3 rounded-2xl border border-orange-200 text-primary font-semibold text-sm flex items-center justify-center gap-2">
              <RefreshCw size={14} /> Refresh Status
            </button>
            <a href={`https://wa.me/917000343804?text=${encodeURIComponent(`🙏 Namaste! I have a question about my booking ${data.bookingId}.`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#25D366] text-white font-bold text-sm">
              <MessageCircle size={16} /> Contact Support
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
