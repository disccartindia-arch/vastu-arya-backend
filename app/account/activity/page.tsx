'use client';
/**
 * app/account/activity/page.tsx — NEW (Feature 8: Customer Status Center)
 * PRODUCTION HOTFIX ROUND 11 — Phase D.
 */
import { useEffect, useState } from 'react';
import { accountAPI } from '../../../lib/accountAPI';
import { formatPrice } from '../../../lib/utils';
import { LoadingSkeleton, EmptyState, ErrorState, Pagination } from '../../../components/account/AccountStates';
import { Activity as ActivityIcon, Calendar, ShoppingBag, RefreshCw } from 'lucide-react';

interface Event { type: string; label: string; ref: string; amount: number | null; timestamp: string; }

const ICON: Record<string, any> = { booking_created: Calendar, order_created: ShoppingBag, status_change: RefreshCw };

export default function ActivityPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = () => {
    setLoading(true); setError('');
    accountAPI.getActivity({ page, limit: 20 })
      .then(r => { setEvents(r.data.data || []); setPages(r.data.pages || 1); })
      .catch(() => setError('Could not load your activity.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  if (loading) return <LoadingSkeleton rows={5} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (events.length === 0) return <EmptyState icon={ActivityIcon} title="No activity yet" subtitle="Your bookings, orders, and status updates will appear here" />;

  return (
    <div className="space-y-3">
      {events.map((e, i) => {
        const Icon = ICON[e.type] || ActivityIcon;
        return (
          <div key={i} className="flex items-start gap-3 bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Icon size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">{e.label}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs text-gray-400">{e.ref}</span>
                {e.amount !== null && <span className="text-xs font-semibold text-primary">{formatPrice(e.amount)}</span>}
              </div>
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">{new Date(e.timestamp).toLocaleDateString('en-IN')}</span>
          </div>
        );
      })}
      <Pagination page={page} pages={pages} onChange={setPage} />
    </div>
  );
}
