'use client';
/**
 * app/account/bookings/[bookingId]/page.tsx — NEW (Feature 3)
 * PRODUCTION HOTFIX ROUND 11 — Phase D.
 *
 * Reuses the exact customer-safe timeline shape and rendering logic
 * already proven in Phase C's public /status/[bookingId] page — the
 * backend's getMyBookingDetail() already strips adminUser/adminNotes
 * at the query level (see account.controller.ts), so this component
 * never even receives that data, let alone needs to filter it
 * client-side.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { accountAPI } from '../../../../lib/accountAPI';
import { formatPrice } from '../../../../lib/utils';
import { LoadingSkeleton, ErrorState } from '../../../../components/account/AccountStates';
import { Copy, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

interface BookingDetail {
  bookingId: string; name: string; serviceName: string; amount: number;
  paymentStatus: string; bookingStatus: string; createdAt: string; updatedAt: string;
  timeline: { field: string; newValue: string; timestamp: string }[];
}

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
          <button onClick={() => { navigator.clipboard?.writeText(data.bookingId); toast.success('Copied'); }} className="p-2 hover:bg-orange-100 rounded-lg">
            <Copy size={15} className="text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Service</p><p className="font-semibold text-gray-800">{data.serviceName}</p></div>
            <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Amount</p><p className="font-bold text-primary">{formatPrice(data.amount)}</p></div>
            <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Payment Status</p><p className="font-semibold text-gray-800 capitalize">{data.paymentStatus}</p></div>
            <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Booking Status</p><p className="font-semibold text-gray-800 capitalize">{data.bookingStatus.replace(/_/g, ' ')}</p></div>
          </div>
          <p className="text-xs text-gray-400">Last updated {new Date(data.updatedAt).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3">Status History</h2>
        {data.timeline.length === 0 ? (
          <p className="text-sm text-gray-400">No status changes recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {data.timeline.map((t, i) => (
              <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-600">{t.field === 'paymentStatus' ? 'Payment' : 'Booking'} → {t.newValue.replace(/_/g, ' ')}</span>
                <span className="text-gray-400 text-xs">{new Date(t.timestamp).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <a href={`/status/${data.bookingId}`} target="_blank" rel="noopener noreferrer" className="block text-center text-sm text-primary hover:underline">
        View public tracking page →
      </a>

      <a href="https://wa.me/917000343804" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#25D366] text-white font-semibold text-sm">
        <Phone size={15} /> Contact Support
      </a>
    </div>
  );
}
