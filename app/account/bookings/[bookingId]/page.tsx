'use client';
/**
 * app/account/bookings/[bookingId]/page.tsx — enhanced with a proper
 * timeline UI (PaymentTimeline), copy actions, and a WhatsApp support
 * fallback. Backend contract unchanged — same accountAPI.getBookingDetail
 * call, same PublicBookingStatus shape.
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { accountAPI } from '../../../../lib/accountAPI';
import { formatPrice } from '../../../../lib/utils';
import { LoadingSkeleton, ErrorState } from '../../../../components/account/AccountStates';
import PaymentTimeline, { PaymentTimelineStep, StepStatus } from '../../../../components/payment/PaymentTimeline';
import { Copy, Phone, ExternalLink, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface BookingDetail {
  bookingId: string; name: string; serviceName: string; amount: number;
  paymentStatus: string; bookingStatus: string; createdAt: string; updatedAt: string;
  timeline: { field: string; newValue: string; timestamp: string }[];
}

const PAYMENT_ORDER = ['pending', 'submitted', 'verified'];
const BOOKING_ORDER = ['pending_payment', 'payment_submitted', 'confirmed', 'consultation_scheduled', 'in_progress', 'completed'];

function statusForStep(currentIdx: number, stepIdx: number, isFailedTerminal = false): StepStatus {
  if (isFailedTerminal) return 'failed';
  if (currentIdx > stepIdx) return 'done';
  if (currentIdx === stepIdx) return 'active';
  return 'pending';
}

function humanise(s: string) { return s.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()); }

export default function BookingDetailPage() {
  const { bookingId } = useParams();
  const [data, setData] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true); setError('');
    accountAPI.getBookingDetail(bookingId as string)
      .then(r => setData(r.data.data))
      .catch(e => setError(e?.response?.data?.message || 'Could not load this booking.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { if (bookingId) load(); /* eslint-disable-next-line */ }, [bookingId]);

  const timelineSteps: PaymentTimelineStep[] = useMemo(() => {
    if (!data) return [];
    const paymentIdx = PAYMENT_ORDER.indexOf(data.paymentStatus);
    const rejected = data.paymentStatus === 'rejected';
    const refunded = data.paymentStatus === 'refunded';
    const bookingIdx = BOOKING_ORDER.indexOf(data.bookingStatus);
    const cancelled = data.bookingStatus === 'cancelled';

    const findWhen = (field: 'paymentStatus' | 'bookingStatus', value: string) =>
      data.timeline.find(t => t.field === field && t.newValue === value)?.timestamp;

    const steps: PaymentTimelineStep[] = [
      { key: 'payment-pending',   label: 'Payment initiated',    status: statusForStep(paymentIdx, 0, refunded), timestamp: data.createdAt },
      { key: 'payment-submitted', label: 'Payment reference received', status: rejected ? 'failed' : statusForStep(paymentIdx, 1), timestamp: findWhen('paymentStatus', 'submitted') },
      { key: 'payment-verified',  label: 'Payment verified',     status: rejected ? 'skipped' : statusForStep(paymentIdx, 2), timestamp: findWhen('paymentStatus', 'verified') },
      { key: 'booking-confirmed', label: 'Booking confirmed',    status: cancelled ? 'failed' : statusForStep(bookingIdx, 2),   timestamp: findWhen('bookingStatus', 'confirmed') },
      { key: 'consultation',      label: 'Consultation scheduled', status: cancelled ? 'skipped' : statusForStep(bookingIdx, 3), timestamp: findWhen('bookingStatus', 'consultation_scheduled') },
      { key: 'in-progress',       label: 'In progress',          status: cancelled ? 'skipped' : statusForStep(bookingIdx, 4),   timestamp: findWhen('bookingStatus', 'in_progress') },
      { key: 'completed',         label: 'Completed',            status: cancelled ? 'failed'  : statusForStep(bookingIdx, 5),   timestamp: findWhen('bookingStatus', 'completed') },
    ];
    return steps;
  }, [data]);

  if (loading) return <LoadingSkeleton rows={3} />;
  if (error || !data) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden" style={{ border: '1px solid rgba(212,160,23,0.22)' }}>
        <div className="bg-orange-50 px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,107,0,0.15)' }}>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Booking ID</p>
            <p className="font-mono font-bold text-sm text-primary">{data.bookingId}</p>
          </div>
          <button data-testid="copy-booking-id" onClick={() => { navigator.clipboard?.writeText(data.bookingId); toast.success('Copied'); }} className="p-2 hover:bg-orange-100 rounded-lg">
            <Copy size={15} className="text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Service</p><p className="font-semibold text-gray-800">{data.serviceName}</p></div>
            <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Amount</p><p className="font-bold text-primary">{formatPrice(data.amount)}</p></div>
            <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Payment</p><p className="font-semibold text-gray-800 capitalize">{humanise(data.paymentStatus)}</p></div>
            <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Booking</p><p className="font-semibold text-gray-800 capitalize">{humanise(data.bookingStatus)}</p></div>
          </div>
          <p className="text-xs text-gray-400">Last updated {new Date(data.updatedAt).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Calendar size={16} className="text-primary" /> Booking Timeline</h2>
        </div>
        <PaymentTimeline steps={timelineSteps} testId="booking-timeline" />
      </div>

      {data.timeline.length > 0 && (
        <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3 text-sm">Status History</h2>
          <div className="space-y-2">
            {data.timeline.map((t, i) => (
              <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-600 capitalize">{t.field === 'paymentStatus' ? 'Payment' : 'Booking'} → {humanise(t.newValue)}</span>
                <span className="text-gray-400 text-xs">{new Date(t.timestamp).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <a href={`/status/${data.bookingId}`} target="_blank" rel="noopener noreferrer" data-testid="public-tracking-link" className="flex items-center justify-center gap-1 text-sm text-primary hover:underline">
        View public tracking page <ExternalLink size={12} />
      </a>

      <a href="https://wa.me/917000343804" target="_blank" rel="noopener noreferrer" data-testid="support-btn"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#25D366] text-white font-semibold text-sm">
        <Phone size={15} /> Contact Support
      </a>
    </div>
  );
}
