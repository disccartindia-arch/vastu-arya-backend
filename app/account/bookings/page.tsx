'use client';
/**
 * app/account/bookings/page.tsx — NEW (Feature 2: My Bookings)
 * PRODUCTION HOTFIX ROUND 11 — Phase D.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { accountAPI } from '../../../lib/accountAPI';
import { formatPrice } from '../../../lib/utils';
import { LoadingSkeleton, EmptyState, ErrorState, Pagination } from '../../../components/account/AccountStates';
import { Search, Calendar, ChevronRight } from 'lucide-react';

interface BookingRow {
  bookingId: string; serviceName: string; amount: number; createdAt: string; updatedAt: string;
  paymentStatus: string; bookingStatus: string;
}

const PAYMENT_BADGE: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', submitted: 'bg-amber-100 text-amber-700', verified: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-600', refunded: 'bg-gray-200 text-gray-600' };
const BOOKING_BADGE: Record<string, string> = { pending_payment: 'bg-amber-100 text-amber-700', payment_submitted: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700', consultation_scheduled: 'bg-indigo-100 text-indigo-700', in_progress: 'bg-purple-100 text-purple-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600' };

const FILTERS = [
  { key: 'all', label: 'All' }, { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' }, { key: 'cancelled', label: 'Cancelled' },
];

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = () => {
    setLoading(true); setError('');
    accountAPI.getBookings({ search: search || undefined, filter, page, limit: 10 })
      .then(r => { setBookings(r.data.data || []); setPages(r.data.pages || 1); })
      .catch(() => setError('Could not load your bookings.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter, page]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(); };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Booking ID or service…" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium">Search</button>
      </form>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }} className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${filter === f.key ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'}`}>{f.label}</button>
        ))}
      </div>

      {loading ? <LoadingSkeleton /> : error ? <ErrorState message={error} onRetry={load} /> : bookings.length === 0 ? (
        <EmptyState icon={Calendar} title="No bookings found" subtitle={search || filter !== 'all' ? 'Try a different search or filter' : 'Your bookings will appear here once you book a consultation'} />
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <Link key={b.bookingId} href={`/account/bookings/${b.bookingId}`} className="flex items-center gap-3 bg-white rounded-2xl border border-orange-100 p-4 shadow-sm hover:shadow-orange transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-xs text-gray-400">{b.bookingId}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PAYMENT_BADGE[b.paymentStatus] || 'bg-gray-100'}`}>{b.paymentStatus}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${BOOKING_BADGE[b.bookingStatus] || 'bg-gray-100'}`}>{b.bookingStatus?.replace(/_/g, ' ')}</span>
                </div>
                <p className="font-medium text-gray-800 text-sm truncate">{b.serviceName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatPrice(b.amount)} · Updated {new Date(b.updatedAt).toLocaleDateString('en-IN')}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </Link>
          ))}
          <Pagination page={page} pages={pages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
