'use client';
export const dynamic = 'force-dynamic';
import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import WhatsAppButton from '../../../components/common/WhatsAppButton';
import { Search, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw, MessageCircle, Package, Calendar } from 'lucide-react';
import Link from 'next/link';
import api from '../../../lib/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  paid:          { label: 'Paid & Confirmed', color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  pending:       { label: 'Pending',          color: 'text-amber-700',  bg: 'bg-amber-100',  icon: Clock },
  awaiting_payment: { label: 'Awaiting Payment', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
  failed:        { label: 'Failed',           color: 'text-red-600',    bg: 'bg-red-100',    icon: XCircle },
  cancelled:     { label: 'Cancelled',        color: 'text-gray-600',   bg: 'bg-gray-100',   icon: XCircle },
  cod_pending:   { label: 'COD Pending',      color: 'text-blue-700',   bg: 'bg-blue-100',   icon: Package },
  processing:    { label: 'Processing',       color: 'text-blue-700',   bg: 'bg-blue-100',   icon: RefreshCw },
  shipped:       { label: 'Shipped',          color: 'text-indigo-700', bg: 'bg-indigo-100', icon: Package },
  delivered:     { label: 'Delivered',        color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  completed:     { label: 'Completed',        color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  called:        { label: 'Called',           color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  refunded:      { label: 'Refunded',         color: 'text-purple-700', bg: 'bg-purple-100', icon: RefreshCw },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'text-gray-600', bg: 'bg-gray-100', icon: AlertCircle };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string | undefined | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-orange-50 last:border-0">
      <span className="text-xs text-gray-400 flex-shrink-0 w-36">{label}</span>
      <span className="text-xs font-semibold text-gray-700 text-right break-all">{value}</span>
    </div>
  );
}

function OrderStatusContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const initRef = params.get('ref') || '';

  const [ref, setRef]         = useState(initRef);
  const [query, setQuery]     = useState(initRef);
  const [result, setResult]   = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const search = async (searchRef?: string) => {
    const r = (searchRef || query).trim();
    if (!r) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.get(`/payment/status/${encodeURIComponent(r)}`);
      setResult(res.data);
      router.replace(`/order-status?ref=${encodeURIComponent(r)}`, { scroll: false });
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No record found. Check the reference and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-search if ref passed in URL
  useState(() => { if (initRef) search(initRef); });

  const d    = result?.data;
  const type = result?.type; // 'booking' | 'order'

  const waMsg = d
    ? encodeURIComponent(`🙏 Namaste!\n\nRef: ${d.id}\nName: ${d.name}\nStatus: ${d.paymentStatus}\n\nPlease assist.`)
    : '';

  return (
    <main className="min-h-screen bg-cream py-12">
      <div className="max-w-lg mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🕉️</div>
          <h1 className="font-display text-3xl font-bold text-text-dark mb-1">Order Status</h1>
          <p className="text-text-light text-sm">Enter your booking reference or order ID</p>
        </div>

        {/* Search bar */}
        <div className="flex gap-2 mb-6">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="e.g. BK17799884… or ORD176…"
            className="flex-1 px-4 py-3 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"
          />
          <button
            onClick={() => search()}
            disabled={loading}
            className="px-5 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? '' : 'Check'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl mb-4">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Result */}
        {d && (
          <div className="space-y-4">
            {/* Status card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid rgba(212,160,23,0.2)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {type === 'booking'
                    ? <Calendar size={18} className="text-primary" />
                    : <Package size={18} className="text-primary" />}
                  <span className="font-bold text-gray-800 text-sm">
                    {type === 'booking' ? 'Appointment Booking' : 'Store Order'}
                  </span>
                </div>
                <StatusBadge status={d.paymentStatus || d.status} />
              </div>

              {/* Reference */}
              <div className="bg-orange-50 rounded-xl p-3 text-center mb-4" style={{ border: '1px solid rgba(255,107,0,0.2)' }}>
                <p className="text-xs text-gray-400 mb-0.5">{type === 'booking' ? 'Booking Reference' : 'Order ID'}</p>
                <p className="font-mono font-bold text-lg text-primary">{d.id}</p>
              </div>

              {/* Details */}
              <div className="space-y-0">
                <Row label="Customer Name"   value={d.name} />
                <Row label="Phone"           value={d.phone} />
                <Row label={type === 'booking' ? 'Service' : 'Amount'} value={type === 'booking' ? d.serviceName : `₹${d.totalAmount}`} />
                <Row label="Amount Paid"     value={d.amountPaid > 0 ? `₹${d.amountPaid}` : null} />
                <Row label="Payment Method"  value={d.paymentMethod} />
                <Row label="Payment Status"  value={d.paymentStatus} />
                <Row label="Booking Status"  value={d.status} />
                <Row label="Razorpay ID"     value={d.paymentId} />
                <Row label="Transaction Ref" value={d.transactionRef} />
                <Row label="Verified At"     value={d.verifiedAt ? new Date(d.verifiedAt).toLocaleString('en-IN') : null} />
                <Row label="Created"         value={d.createdAt ? new Date(d.createdAt).toLocaleString('en-IN') : null} />
              </div>
            </div>

            {/* Order items (for product orders) */}
            {type === 'order' && d.items?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid rgba(212,160,23,0.2)' }}>
                <h3 className="font-semibold text-gray-800 text-sm mb-3">Order Items</h3>
                <div className="space-y-2">
                  {d.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.name} × {item.qty}</span>
                      <span className="font-semibold text-gray-800">₹{item.price * item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {/* Retry if pending */}
              {(d.paymentStatus === 'pending' || d.paymentStatus === 'failed') && (
                <Link href={`/book-appointment`}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
                  <RefreshCw size={16} /> Retry Payment
                </Link>
              )}

              {/* WhatsApp support */}
              <a href={`https://wa.me/917000343804?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#25D366] text-white font-semibold text-sm">
                <MessageCircle size={16} /> Contact on WhatsApp
              </a>

              <button onClick={() => search()}
                className="w-full py-3 rounded-2xl border border-orange-200 text-primary font-semibold text-sm flex items-center justify-center gap-2">
                <RefreshCw size={14} /> Refresh Status
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function OrderStatusPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-4xl animate-spin">🕉️</div>
        </div>
      }>
        <OrderStatusContent />
      </Suspense>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
