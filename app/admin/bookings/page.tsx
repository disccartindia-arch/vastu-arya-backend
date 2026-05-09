'use client';
import { useEffect, useState } from 'react';
import { bookingsAPI } from '../../../lib/api';
import { formatPrice } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { Calendar, Phone, Search, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = { pending:'bg-yellow-100 text-yellow-700', confirmed:'bg-green-100 text-green-700', completed:'bg-blue-100 text-blue-700', cancelled:'bg-red-100 text-red-700' };

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = () => { setLoading(true); bookingsAPI.getAll().then(r => setBookings(r.data.data || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try { await bookingsAPI.updateStatus(id, { status }); setBookings(p => p.map(b => b._id === id ? { ...b, status } : b)); toast.success('Status updated!'); }
    catch { toast.error('Update failed'); }
  };

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    const matchQ = !q || b.name?.toLowerCase().includes(q) || b.phone?.includes(q) || b.serviceName?.toLowerCase().includes(q) || b.bookingId?.toLowerCase().includes(q);
    const matchS = statusFilter === 'all' || b.status === statusFilter;
    return matchQ && matchS;
  });

  const stats = { total: bookings.length, pending: bookings.filter(b => b.status === 'pending').length, confirmed: bookings.filter(b => b.status === 'confirmed').length, total_rev: bookings.reduce((s, b) => s + (b.amount || 0), 0) };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="font-display text-2xl font-bold text-gray-800">Bookings</h1><p className="text-gray-500 text-sm mt-1">{bookings.length} total bookings</p></div><button onClick={load} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"><RefreshCw size={14}/>Refresh</button></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{l:'Total',v:stats.total,c:'text-gray-800'},{l:'Pending',v:stats.pending,c:'text-yellow-600'},{l:'Confirmed',v:stats.confirmed,c:'text-green-600'},{l:'Revenue',v:formatPrice(stats.total_rev),c:'text-primary'}].map((s,i)=>(
          <div key={i} className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm"><p className="text-xs text-gray-400 uppercase tracking-wide">{s.l}</p><p className={`font-display font-bold text-2xl mt-1 ${s.c}`}>{s.v}</p></div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-orange-50">
          <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, phone, service…" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white">
            <option value="all">All Status</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
          </select>
        </div>
        {loading ? <div className="p-8 text-center text-gray-400"><div className="text-3xl animate-spin mb-2">🕉️</div>Loading…</div> : filtered.length === 0 ? <div className="p-8 text-center text-gray-400"><Calendar size={32} className="mx-auto mb-2 opacity-40"/>No bookings found</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>{['Booking ID','Customer','Service','Amount','Date','Status','Actions'].map(h=><th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(b => (
                  <tr key={b._id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.bookingId || b._id?.slice(-8)}</td>
                    <td className="px-4 py-3"><p className="font-medium text-gray-800">{b.name}</p><p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10}/>{b.phone}</p></td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px]"><p className="truncate">{b.serviceName}</p></td>
                    <td className="px-4 py-3 font-semibold text-primary">{formatPrice(b.amount || 0)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}`}>{b.status}</span></td>
                    <td className="px-4 py-3">
                      <select value={b.status} onChange={e=>updateStatus(b._id,e.target.value)} className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-primary">
                        <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                      </select>
                    </td>
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
