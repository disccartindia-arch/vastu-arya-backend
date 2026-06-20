'use client';
/**
 * app/admin/leads/page.tsx — NEW
 *
 * PRODUCTION HOTFIX ROUND 4 — "Booking Leads" admin panel requirement.
 * Displays every Lead (PENDING_PAYMENT/PAID/FAILED/CANCELLED), with
 * status filters and name/phone/city search, matching the existing
 * admin page patterns (bookings/page.tsx, orders/page.tsx) for visual
 * and structural consistency — same stat-card row, same table layout,
 * same loading/empty states.
 */
import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { formatPrice } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { Search, RefreshCw, Phone, MapPin, Users } from 'lucide-react';

interface Lead {
  _id: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  email?: string;
  message?: string;
  serviceName: string;
  price: number;
  sourcePage: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'FAILED' | 'CANCELLED';
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
  PAID:             'bg-green-100 text-green-700',
  FAILED:           'bg-red-100 text-red-600',
  CANCELLED:        'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Pending Payment',
  PAID:             'Paid',
  FAILED:           'Failed',
  CANCELLED:        'Cancelled',
};

export default function BookingLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({ all: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = () => {
    setLoading(true);
    api.get('/admin/leads', { params: { status: statusFilter, search: search || undefined, limit: 100 } })
      .then(r => { setLeads(r.data.data || []); setCounts(r.data.counts || { all: 0 }); })
      .catch(() => toast.error('Failed to load leads'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">Booking Leads</h1>
          <p className="text-gray-500 text-sm mt-1">Captured before payment — includes customers who didn't complete checkout</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: 'All', v: counts.all || 0, c: 'text-gray-800', key: 'all' },
          { l: 'Pending', v: counts.PENDING_PAYMENT || 0, c: 'text-amber-600', key: 'PENDING_PAYMENT' },
          { l: 'Paid', v: counts.PAID || 0, c: 'text-green-600', key: 'PAID' },
          { l: 'Failed', v: counts.FAILED || 0, c: 'text-red-500', key: 'FAILED' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            className={`bg-white rounded-2xl border p-4 shadow-sm text-left transition-all ${statusFilter === s.key ? 'border-primary ring-1 ring-primary' : 'border-orange-100 hover:border-orange-200'}`}
          >
            <p className="text-xs text-gray-400 uppercase tracking-wide">{s.l}</p>
            <p className={`font-display font-bold text-2xl mt-1 ${s.c}`}>{s.v}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSearch} className="flex gap-3 p-4 border-b border-orange-50">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone, city…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium">Search</button>
        </form>

        {loading ? (
          <div className="p-8 text-center text-gray-400"><div className="text-3xl animate-spin mb-2">🕉️</div>Loading…</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-gray-400"><Users size={32} className="mx-auto mb-2 opacity-40" />No leads found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>{['Name', 'Contact', 'Service', 'Amount', 'Status', 'Date'].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map(l => (
                  <tr key={l._id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{l.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <p className="flex items-center gap-1 text-xs"><Phone size={10} />{l.phone}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5"><MapPin size={10} />{l.city}, {l.state}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{l.serviceName}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{formatPrice(l.price)}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[l.status]}`}>{STATUS_LABELS[l.status]}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(l.createdAt).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
