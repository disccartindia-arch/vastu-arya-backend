'use client';
/**
 * app/account/orders/page.tsx — NEW (Feature 5: My Orders)
 * PRODUCTION HOTFIX ROUND 11 — Phase D.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { accountAPI } from '../../../lib/accountAPI';
import { formatPrice } from '../../../lib/utils';
import { LoadingSkeleton, EmptyState, ErrorState, Pagination } from '../../../components/account/AccountStates';
import { Search, Package, ChevronRight } from 'lucide-react';

interface OrderRow { orderId: string; items: { name: string }[]; totalAmount: number; status: string; createdAt: string; }

const STATUS_BADGE: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', processing: 'bg-blue-100 text-blue-700', shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600', paid: 'bg-green-100 text-green-700' };

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = () => {
    setLoading(true); setError('');
    accountAPI.getOrders({ search: search || undefined, page, limit: 10 })
      .then(r => { setOrders(r.data.data || []); setPages(r.data.pages || 1); })
      .catch(() => setError('Could not load your orders.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(); };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Order ID or product…" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium">Search</button>
      </form>

      {loading ? <LoadingSkeleton /> : error ? <ErrorState message={error} onRetry={load} /> : orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders found" subtitle="Your Vastu Store orders will appear here" />
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <Link key={o.orderId} href={`/account/orders/${o.orderId}`} className="flex items-center gap-3 bg-white rounded-2xl border border-orange-100 p-4 shadow-sm hover:shadow-orange transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-xs text-gray-400">{o.orderId}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[o.status] || 'bg-gray-100'}`}>{o.status}</span>
                </div>
                <p className="font-medium text-gray-800 text-sm truncate">{o.items?.map(i => i.name).join(', ') || 'Order'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatPrice(o.totalAmount)} · {new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
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
