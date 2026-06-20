'use client';
/**
 * app/admin/upi-verifications/page.tsx
 *
 * FIXED this round (PRODUCTION HOTFIX ROUND 7 — Issue 1, "verify admin
 * visibility"):
 *
 * ROOT CAUSE: this page fetched `/api/upi-payment` (relative, singular,
 * no /admin/ segment) — a route that resolves against the FRONTEND's
 * own domain (Vercel), not the backend (Render). No such Next.js API
 * route exists in this frontend repo, so this call would 404 silently
 * against whatever Vercel serves at that path, meaning admin payment
 * verification submissions were likely never actually visible here,
 * regardless of whether the underlying screenshot upload itself
 * succeeded — confirmed via cross-reference against server.ts, which
 * registers the REAL endpoint at `/api/admin/upi-payments` (plural,
 * with /admin/), backed by adminUpiPayments.routes.ts and
 * upiPayment.controller.ts's listUpiPayments()/verifyUpiPayment()/
 * rejectUpiPayment() — all of which are correctly implemented and
 * already working, just never being called from this page.
 *
 * FIX: switched every fetch()/PATCH call in this file from the dead
 * relative path to the real backend endpoint via lib/api.ts's shared
 * axios instance (api.get/api.post), matching how every other admin
 * page in this codebase calls the backend — this also gains the
 * automatic Authorization header injection and cold-start retry that
 * lib/api.ts provides, which the previous raw fetch() calls had neither
 * of.
 *
 * Response shape adapted to match listUpiPayments()'s actual return
 * value (`{ success, data, total, page }` where `data` is an array of
 * UpiPayment documents with fields: referenceId, itemType, itemId,
 * orderId, bookingId, amount, upiId, transactionId, screenshotUrl,
 * uploaderName, uploaderPhone, status, submittedAt, verifiedAt,
 * adminNotes — NOT the differently-named field set the old dead-route
 * version of this page expected, e.g. `itemName`/`txnId`/`name`/`phone`/
 * `address` did not exist on the real backend response and have been
 * corrected to the real field names below).
 */
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Eye, RefreshCw, ExternalLink, Phone, User, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

interface Payment {
  _id:           string;
  referenceId:   string;
  itemId?:       string | null;
  itemType:      string;
  bookingId?:    string | null;
  orderId?:      string | null;
  amount:        number;
  upiId:         string;
  transactionId?: string | null;
  screenshotUrl: string;
  uploaderName:  string;
  uploaderPhone: string;
  status:        'UPI_PENDING' | 'PAID' | 'REJECTED';
  submittedAt:   string;
  verifiedAt?:   string | null;
  adminNotes?:   string | null;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  UPI_PENDING: { label: 'Pending',  cls: 'bg-amber-100 text-amber-700' },
  PAID:        { label: 'Paid',     cls: 'bg-green-100 text-green-700' },
  REJECTED:    { label: 'Rejected', cls: 'bg-red-100 text-red-600' },
};

export default function UpiVerificationsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<'all' | 'UPI_PENDING' | 'PAID' | 'REJECTED'>('UPI_PENDING');
  const [selected, setSelected] = useState<Payment | null>(null);
  const [note,     setNote]     = useState('');
  const [acting,   setActing]   = useState(false);

  const load = () => {
    setLoading(true);
    // FIXED: real backend endpoint via the shared api instance, instead
    // of the dead relative '/api/upi-payment' path.
    api.get('/admin/upi-payments', { params: { status: filter, limit: 100 } })
      .then(r => setPayments(r.data?.data || []))
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const act = async (action: 'verify' | 'reject') => {
    if (!selected) return;
    setActing(true);
    try {
      // FIXED: real backend endpoints — POST /admin/upi-payments/:id/verify
      // and /reject, matching upiPayment.controller.ts exactly.
      await api.post(`/admin/upi-payments/${selected._id}/${action}`, { adminNotes: note });
      toast.success(action === 'verify' ? '✅ Payment verified!' : '❌ Payment rejected');
      setSelected(null);
      setNote('');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setActing(false);
    }
  };

  const counts = {
    all:          payments.length,
    UPI_PENDING:  payments.filter(p => p.status === 'UPI_PENDING').length,
    PAID:         payments.filter(p => p.status === 'PAID').length,
    REJECTED:     payments.filter(p => p.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">UPI Payment Verifications</h1>
          <p className="text-gray-500 text-sm mt-1">{counts.UPI_PENDING} pending · {counts.PAID} paid · {counts.REJECTED} rejected</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['UPI_PENDING', 'PAID', 'REJECTED', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${filter === f ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}>
            {f === 'all' ? 'All' : f === 'UPI_PENDING' ? `Pending (${counts.UPI_PENDING})` : f === 'PAID' ? `Paid (${counts.PAID})` : `Rejected (${counts.REJECTED})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400"><div className="text-3xl animate-spin mb-2">🕉️</div>Loading…</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-orange-100 text-gray-400">
          <Clock size={32} className="mx-auto mb-2 opacity-40" />
          <p>No payments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(p => {
            const badge = STATUS_BADGE[p.status] || STATUS_BADGE.UPI_PENDING;
            return (
              <div key={p._id} className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
                <div className="flex items-start gap-4">
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
                      <span className="text-xs text-gray-400 capitalize">{p.itemType}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1 font-bold text-primary">₹{p.amount.toLocaleString('en-IN')}</span>
                      <span className="flex items-center gap-1"><User size={10} />{p.uploaderName}</span>
                      <span className="flex items-center gap-1"><Phone size={10} />{p.uploaderPhone}</span>
                    </div>
                    {p.transactionId && <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Hash size={10} />UTR: {p.transactionId}</p>}
                    <p className="text-xs text-gray-400 mt-1">UPI: {p.upiId} · Submitted: {new Date(p.submittedAt).toLocaleString('en-IN')}</p>
                    {p.adminNotes && <p className="text-xs bg-gray-50 rounded-lg px-2 py-1 mt-1 text-gray-600">Note: {p.adminNotes}</p>}
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <a href={p.screenshotUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">
                      <Eye size={12} /> View
                    </a>
                    {p.status === 'UPI_PENDING' && (
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-orange-100">
              <h2 className="font-display font-bold text-lg text-gray-800">Review Payment</h2>
              <p className="text-xs text-gray-500 mt-0.5">{selected.referenceId}</p>
            </div>
            <div className="p-5 space-y-4">
              <a href={selected.screenshotUrl} target="_blank" rel="noopener noreferrer"
                className="block w-full h-48 rounded-xl overflow-hidden border border-gray-200 hover:border-orange-300 transition-colors">
                <img src={selected.screenshotUrl} alt="Payment screenshot" className="w-full h-full object-contain bg-gray-50" />
              </a>

              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-semibold">{selected.uploaderName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-semibold">{selected.uploaderPhone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-semibold capitalize">{selected.itemType}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-primary text-base">₹{selected.amount.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">UPI ID</span><span className="font-mono text-xs">{selected.upiId}</span></div>
                {selected.transactionId && <div className="flex justify-between"><span className="text-gray-500">UTR</span><span className="font-mono text-xs">{selected.transactionId}</span></div>}
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
                <button onClick={() => act('verify')} disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all">
                  <CheckCircle size={16} /> Verify
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
