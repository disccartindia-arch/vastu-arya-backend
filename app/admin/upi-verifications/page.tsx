'use client';
/**
 * app/admin/upi-verifications/page.tsx
 *
 * Admin panel for reviewing and approving/rejecting UPI payments.
 * Uses the same API route: /api/upi-payment
 */
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Eye, RefreshCw, ExternalLink, Phone, User, Mail, MapPin, Package, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

interface Payment {
  referenceId:   string;
  itemId:        string;
  itemType:      string;
  itemName:      string;
  amount:        number;
  upiId:         string;
  txnId:         string;
  screenshotUrl: string;
  name:          string;
  phone:         string;
  email:         string;
  address:       string;
  status:        'PENDING_VERIFICATION' | 'CONFIRMED' | 'REJECTED';
  submittedAt:   string;
  verifiedAt:    string | null;
  adminNote:     string | null;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING_VERIFICATION: { label: 'Pending',   cls: 'bg-amber-100 text-amber-700' },
  CONFIRMED:            { label: 'Confirmed', cls: 'bg-green-100 text-green-700' },
  REJECTED:             { label: 'Rejected',  cls: 'bg-red-100 text-red-600' },
};

export default function UpiVerificationsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<'all' | 'PENDING_VERIFICATION' | 'CONFIRMED' | 'REJECTED'>('all');
  const [selected, setSelected] = useState<Payment | null>(null);
  const [note,     setNote]     = useState('');
  const [acting,   setActing]   = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/upi-payment')
      .then(r => r.json())
      .then(d => setPayments(d.data || []))
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const act = async (action: 'approve' | 'reject') => {
    if (!selected) return;
    setActing(true);
    try {
      const res  = await fetch('/api/upi-payment', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ referenceId: selected.referenceId, action, adminNote: note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      toast.success(action === 'approve' ? '✅ Payment confirmed!' : '❌ Payment rejected');
      setSelected(null);
      setNote('');
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActing(false);
    }
  };

  const filtered = payments.filter(p => filter === 'all' || p.status === filter);
  const counts   = { all: payments.length, PENDING_VERIFICATION: payments.filter(p => p.status === 'PENDING_VERIFICATION').length, CONFIRMED: payments.filter(p => p.status === 'CONFIRMED').length, REJECTED: payments.filter(p => p.status === 'REJECTED').length };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">UPI Payment Verifications</h1>
          <p className="text-gray-500 text-sm mt-1">{counts.PENDING_VERIFICATION} pending · {counts.CONFIRMED} confirmed · {counts.REJECTED} rejected</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'PENDING_VERIFICATION', 'CONFIRMED', 'REJECTED'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${filter === f ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}>
            {f === 'all' ? `All (${counts.all})` : f === 'PENDING_VERIFICATION' ? `Pending (${counts.PENDING_VERIFICATION})` : f === 'CONFIRMED' ? `Confirmed (${counts.CONFIRMED})` : `Rejected (${counts.REJECTED})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400"><div className="text-3xl animate-spin mb-2">🕉️</div>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-orange-100 text-gray-400">
          <Clock size={32} className="mx-auto mb-2 opacity-40" />
          <p>No {filter === 'all' ? '' : filter.toLowerCase().replace('_', ' ')} payments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const badge = STATUS_BADGE[p.status] || STATUS_BADGE.PENDING_VERIFICATION;
            return (
              <div key={p.referenceId} className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  {/* Screenshot thumbnail */}
                  <a href={p.screenshotUrl} target="_blank" rel="noopener noreferrer"
                    className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200 hover:border-orange-300 transition-colors group relative">
                    <img src={p.screenshotUrl} alt="Payment screenshot" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink size={14} className="text-white" />
                    </div>
                  </a>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs text-gray-500">{p.referenceId}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1"><Package size={10} />{p.itemName} ({p.itemType})</span>
                      <span className="flex items-center gap-1 font-bold text-primary">₹{p.amount.toLocaleString('en-IN')}</span>
                      <span className="flex items-center gap-1"><User size={10} />{p.name}</span>
                      <span className="flex items-center gap-1"><Phone size={10} />{p.phone}</span>
                      {p.email && <span className="flex items-center gap-1"><Mail size={10} />{p.email}</span>}
                    </div>
                    {p.txnId && <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Hash size={10} />Txn: {p.txnId}</p>}
                    {p.address && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin size={10} />{p.address}</p>}
                    <p className="text-xs text-gray-400 mt-1">UPI: {p.upiId} · Submitted: {new Date(p.submittedAt).toLocaleString('en-IN')}</p>
                    {p.adminNote && <p className="text-xs bg-gray-50 rounded-lg px-2 py-1 mt-1 text-gray-600">Note: {p.adminNote}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <a href={p.screenshotUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">
                      <Eye size={12} /> View
                    </a>
                    {p.status === 'PENDING_VERIFICATION' && (
                      <button onClick={() => { setSelected(p); setNote(''); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-dark">
                        Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-orange-100">
              <h2 className="font-display font-bold text-lg text-gray-800">Review Payment</h2>
              <p className="text-xs text-gray-500 mt-0.5">{selected.referenceId}</p>
            </div>
            <div className="p-5 space-y-4">
              {/* Screenshot */}
              <a href={selected.screenshotUrl} target="_blank" rel="noopener noreferrer"
                className="block w-full h-48 rounded-xl overflow-hidden border border-gray-200 hover:border-orange-300 transition-colors">
                <img src={selected.screenshotUrl} alt="Payment screenshot" className="w-full h-full object-contain bg-gray-50" />
              </a>

              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-semibold">{selected.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-semibold">{selected.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Item</span><span className="font-semibold text-right max-w-[200px] truncate">{selected.itemName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-primary text-base">₹{selected.amount.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">UPI ID</span><span className="font-mono text-xs">{selected.upiId}</span></div>
                {selected.txnId && <div className="flex justify-between"><span className="text-gray-500">Txn ID</span><span className="font-mono text-xs">{selected.txnId}</span></div>}
                {selected.address && <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="text-xs text-right max-w-[180px]">{selected.address}</span></div>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Admin note (optional)</label>
                <input
                  type="text" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Payment verified via PhonePe"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => act('reject')} disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-red-400 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 disabled:opacity-50 transition-all">
                  <XCircle size={16} /> Reject
                </button>
                <button onClick={() => act('approve')} disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all">
                  <CheckCircle size={16} /> Approve
                </button>
              </div>
              <button onClick={() => setSelected(null)} className="w-full py-2 text-gray-400 text-sm hover:text-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
