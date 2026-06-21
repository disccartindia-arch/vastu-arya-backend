'use client';
/**
 * app/admin/bookings/page.tsx
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 9 — Phase C Part 1,
 * Blocker 1 resolution + your additional requirement #6):
 *
 * - The single legacy status <select> is REPLACED with two separate
 *   dropdowns (Payment Status, Booking Status) driven by the new
 *   two-axis vocabulary, calling the EXTENDED PUT /api/bookings/:id
 *   with {paymentStatus, bookingStatus} — per your confirmed choice to
 *   replace rather than run both controls side by side. The legacy
 *   `status` field is no longer surfaced as its own control, but the
 *   backend continues to derive/accept it independently — nothing here
 *   breaks any other code path that still reads the legacy field.
 *
 * - Each row is now expandable (clicking the row, same interaction
 *   pattern already used in app/admin/orders/page.tsx — reused
 *   deliberately for consistency, not reinvented) to reveal phone,
 *   email, last-updated timestamp, and a copy-booking-ID button,
 *   without navigating to a second screen — satisfying your
 *   requirement #6 directly.
 *
 * - An optional "Admin notes" field is included in the expanded row,
 *   sent as `adminNotes` in the same PUT request — stored on
 *   StatusAuditLog, admin-only, never shown on the public status page
 *   (see publicStatus.controller.ts).
 *
 * getAll/load behavior is otherwise unchanged from before.
 */
import { useEffect, useState } from 'react';
import { bookingsAPI } from '../../../lib/api';
import { formatPrice } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { Calendar, Phone, Mail, Search, RefreshCw, Copy, ChevronDown, ExternalLink } from 'lucide-react';

interface Booking {
  _id: string;
  bookingId: string;
  name: string;
  phone: string;
  email?: string;
  serviceName: string;
  amount: number;
  status: string;
  paymentStatus: 'pending' | 'submitted' | 'verified' | 'rejected' | 'refunded';
  bookingStatus: 'pending_payment' | 'payment_submitted' | 'confirmed' | 'consultation_scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

const PAYMENT_OPTIONS: { value: Booking['paymentStatus']; label: string }[] = [
  { value: 'pending',   label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'verified',  label: 'Verified' },
  { value: 'rejected',  label: 'Rejected' },
  { value: 'refunded',  label: 'Refunded' },
];

const BOOKING_OPTIONS: { value: Booking['bookingStatus']; label: string }[] = [
  { value: 'pending_payment',        label: 'Pending Payment' },
  { value: 'payment_submitted',      label: 'Payment Submitted' },
  { value: 'confirmed',              label: 'Confirmed' },
  { value: 'consultation_scheduled', label: 'Scheduled' },
  { value: 'in_progress',            label: 'In Progress' },
  { value: 'completed',              label: 'Completed' },
  { value: 'cancelled',              label: 'Cancelled' },
];

const PAYMENT_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', submitted: 'bg-amber-100 text-amber-700',
  verified: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-600',
  refunded: 'bg-gray-200 text-gray-600',
};
const BOOKING_BADGE: Record<string, string> = {
  pending_payment: 'bg-amber-100 text-amber-700', payment_submitted: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700', consultation_scheduled: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-purple-100 text-purple-700', completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    bookingsAPI.getAll().then(r => setBookings(r.data.data || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const updateField = async (id: string, field: 'paymentStatus' | 'bookingStatus', value: string) => {
    try {
      const adminNotes = noteDrafts[id]?.trim() || undefined;
      const { data } = await bookingsAPI.updateStatus(id, { [field]: value, adminNotes });
      setBookings(prev => prev.map(b => b._id === id ? { ...b, ...data.data } : b));
      toast.success('Status updated — customer notified if applicable');
      setNoteDrafts(prev => ({ ...prev, [id]: '' }));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Update failed');
    }
  };

  const copyId = (bookingId: string) => {
    navigator.clipboard?.writeText(bookingId).then(() => toast.success('Booking ID copied'));
  };

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    return !q || b.name?.toLowerCase().includes(q) || b.phone?.includes(q) || b.serviceName?.toLowerCase().includes(q) || b.bookingId?.toLowerCase().includes(q);
  });

  const stats = {
    total: bookings.length,
    pendingPayment: bookings.filter(b => b.paymentStatus === 'pending' || b.paymentStatus === 'submitted').length,
    confirmed: bookings.filter(b => b.bookingStatus === 'confirmed' || b.bookingStatus === 'consultation_scheduled').length,
    total_rev: bookings.filter(b => b.paymentStatus === 'verified').reduce((s, b) => s + (b.amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold text-gray-800">Bookings</h1><p className="text-gray-500 text-sm mt-1">{bookings.length} total bookings</p></div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"><RefreshCw size={14}/>Refresh</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: 'Total', v: stats.total, c: 'text-gray-800' },
          { l: 'Awaiting Payment', v: stats.pendingPayment, c: 'text-amber-600' },
          { l: 'Confirmed/Scheduled', v: stats.confirmed, c: 'text-blue-600' },
          { l: 'Verified Revenue', v: formatPrice(stats.total_rev), c: 'text-primary' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm"><p className="text-xs text-gray-400 uppercase tracking-wide">{s.l}</p><p className={`font-display font-bold text-2xl mt-1 ${s.c}`}>{s.v}</p></div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-orange-50">
          <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, phone, service, booking ID…" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400"><div className="text-3xl animate-spin mb-2">🕉️</div>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400"><Calendar size={32} className="mx-auto mb-2 opacity-40"/>No bookings found</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(b => (
              <div key={b._id}>
                <div className="flex items-center gap-4 px-4 py-3 hover:bg-orange-50/30 cursor-pointer" onClick={() => setExpanded(expanded === b._id ? null : b._id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs text-gray-400">{b.bookingId}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PAYMENT_BADGE[b.paymentStatus] || 'bg-gray-100'}`}>{b.paymentStatus}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${BOOKING_BADGE[b.bookingStatus] || 'bg-gray-100'}`}>{b.bookingStatus?.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="font-medium text-gray-800">{b.name}</p>
                    <p className="text-xs text-gray-400 truncate">{b.serviceName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-primary">{formatPrice(b.amount || 0)}</p>
                    <p className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <ChevronDown size={16} className={`text-gray-300 flex-shrink-0 transition-transform ${expanded === b._id ? 'rotate-180' : ''}`} />
                </div>

                {expanded === b._id && (
                  <div className="px-4 pb-5 bg-gray-50 border-t border-gray-100 space-y-4" onClick={e => e.stopPropagation()}>
                    {/* Contact + meta — requirement #6: visible inline, no second screen */}
                    <div className="grid grid-cols-2 gap-3 pt-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600"><Phone size={12} className="text-gray-400" />{b.phone}</div>
                      {b.email && <div className="flex items-center gap-2 text-gray-600 truncate"><Mail size={12} className="text-gray-400 flex-shrink-0" />{b.email}</div>}
                      <div className="text-xs text-gray-400">Last updated: {new Date(b.updatedAt).toLocaleString('en-IN')}</div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => copyId(b.bookingId)} className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"><Copy size={11} /> Copy Booking ID</button>
                        <a href={`/status/${b.bookingId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary"><ExternalLink size={11} /> View public page</a>
                      </div>
                    </div>

                    {/* Dual status controls */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Payment Status</label>
                        <select value={b.paymentStatus} onChange={e => updateField(b._id, 'paymentStatus', e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-primary">
                          {PAYMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Booking Status</label>
                        <select value={b.bookingStatus} onChange={e => updateField(b._id, 'bookingStatus', e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-primary">
                          {BOOKING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Admin-only note */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Admin note (optional — internal only, never shown to customer)</label>
                      <input
                        value={noteDrafts[b._id] || ''}
                        onChange={e => setNoteDrafts(prev => ({ ...prev, [b._id]: e.target.value }))}
                        placeholder="e.g. Consultation fixed for Sunday 4pm"
                        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Applied to the next status change you make above.</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
