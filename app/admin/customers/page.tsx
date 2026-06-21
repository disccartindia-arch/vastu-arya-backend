'use client';
/**
 * app/admin/customers/page.tsx — NEW
 * PRODUCTION HOTFIX ROUND 11 — Phase D, admin requirement.
 *
 * Read-only by design — no edit/delete actions anywhere on this page,
 * per the brief's explicit "no customer data editing from this screen."
 */
import { useState } from 'react';
import api from '../../../lib/api';
import { formatPrice } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { Search, User, Calendar, ShoppingBag, Link2 } from 'lucide-react';

export default function AdminCustomerLookupPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ bookings: any[]; orders: any[]; leads: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.get('/admin/customers/search', { params: { q: query.trim() } });
      setResults(data.data);
    } catch {
      toast.error('Search failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-800">Customer Lookup</h1>
        <p className="text-gray-500 text-sm mt-1">Search by name, email, phone, Booking ID, or Order ID — read-only</p>
      </div>

      <form onSubmit={search} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search…" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
        </div>
        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-60">{loading ? 'Searching…' : 'Search'}</button>
      </form>

      {results && (
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2"><Calendar size={14} /> Bookings ({results.bookings.length})</h2>
            {results.bookings.length === 0 ? <p className="text-sm text-gray-400">No matches</p> : (
              <div className="space-y-2">
                {results.bookings.map((b: any) => (
                  <div key={b.bookingId} className="bg-white rounded-xl border border-orange-100 p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-400">{b.bookingId}</span>
                        {b.userId && <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><Link2 size={10} /> Linked</span>}
                      </div>
                      <p className="font-medium text-gray-800 text-sm mt-1">{b.name} · {b.phone}{b.email ? ` · ${b.email}` : ''}</p>
                      <p className="text-xs text-gray-400">{b.serviceName} — {formatPrice(b.amount)}</p>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <p className="capitalize">{b.paymentStatus} / {b.bookingStatus?.replace(/_/g, ' ')}</p>
                      <p>{new Date(b.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2"><ShoppingBag size={14} /> Orders ({results.orders.length})</h2>
            {results.orders.length === 0 ? <p className="text-sm text-gray-400">No matches</p> : (
              <div className="space-y-2">
                {results.orders.map((o: any) => (
                  <div key={o.orderId} className="bg-white rounded-xl border border-orange-100 p-4 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs text-gray-400">{o.orderId}</span>
                      <p className="font-medium text-gray-800 text-sm mt-1">{o.customerInfo?.name} · {o.customerInfo?.phone}</p>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <p className="font-semibold text-primary">{formatPrice(o.totalAmount)}</p>
                      <p>{new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2"><User size={14} /> Leads ({results.leads.length})</h2>
            {results.leads.length === 0 ? <p className="text-sm text-gray-400">No matches</p> : (
              <div className="space-y-2">
                {results.leads.map((l: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl border border-orange-100 p-4">
                    <p className="font-medium text-gray-800 text-sm">{l.name} · {l.phone}{l.email ? ` · ${l.email}` : ''}</p>
                    <p className="text-xs text-gray-400">{l.serviceName} — {l.status}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
