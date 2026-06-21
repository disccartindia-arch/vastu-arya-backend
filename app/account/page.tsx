'use client';
/**
 * app/account/page.tsx — NEW (Feature 1: Customer Dashboard)
 *
 * PRODUCTION HOTFIX ROUND 11 — Phase D.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { accountAPI } from '../../lib/accountAPI';
import { formatPrice } from '../../lib/utils';
import { LoadingSkeleton, ErrorState } from '../../components/account/AccountStates';
import { Calendar, CheckCircle2, Clock, ShoppingBag, CreditCard, ShieldCheck, ArrowRight } from 'lucide-react';

interface DashboardData {
  stats: { totalBookings: number; activeBookings: number; completedBookings: number; totalOrders: number; pendingPayments: number; verifiedPayments: number };
  latestBooking: any;
  latestOrder: any;
  latestStatusUpdate: { bookingRef: string; field: string; newValue: string; timestamp: string } | null;
}

export default function AccountDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true); setError('');
    accountAPI.getDashboard()
      .then(r => setData(r.data.data))
      .catch(() => setError('Could not load your dashboard. Please try again.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSkeleton rows={3} />;
  if (error || !data) return <ErrorState message={error} onRetry={load} />;

  const cards = [
    { label: 'Total Bookings', value: data.stats.totalBookings, icon: Calendar, color: 'text-primary' },
    { label: 'Active Bookings', value: data.stats.activeBookings, icon: Clock, color: 'text-blue-600' },
    { label: 'Completed', value: data.stats.completedBookings, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Total Orders', value: data.stats.totalOrders, icon: ShoppingBag, color: 'text-purple-600' },
    { label: 'Pending Payments', value: data.stats.pendingPayments, icon: CreditCard, color: 'text-amber-600' },
    { label: 'Verified Payments', value: data.stats.verifiedPayments, icon: ShieldCheck, color: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
              <Icon size={18} className={`${c.color} mb-2`} />
              <p className="font-display font-bold text-2xl text-gray-800">{c.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">Latest Booking</h2>
          {data.latestBooking ? (
            <Link href={`/account/bookings/${data.latestBooking.bookingId}`} className="flex items-center justify-between group">
              <div>
                <p className="font-medium text-gray-800 text-sm">{data.latestBooking.serviceName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatPrice(data.latestBooking.amount)} · {new Date(data.latestBooking.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
            </Link>
          ) : <p className="text-sm text-gray-400">No bookings yet</p>}
        </div>

        <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">Latest Order</h2>
          {data.latestOrder ? (
            <Link href={`/account/orders/${data.latestOrder.orderId}`} className="flex items-center justify-between group">
              <div>
                <p className="font-medium text-gray-800 text-sm">{data.latestOrder.orderId}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatPrice(data.latestOrder.totalAmount)} · {new Date(data.latestOrder.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
            </Link>
          ) : <p className="text-sm text-gray-400">No orders yet</p>}
        </div>
      </div>

      {data.latestStatusUpdate && (
        <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
          <h2 className="font-semibold text-gray-800 mb-1 text-sm">Latest Status Update</h2>
          <p className="text-sm text-gray-600">
            Booking <span className="font-mono">{data.latestStatusUpdate.bookingRef}</span> — {data.latestStatusUpdate.field === 'paymentStatus' ? 'Payment' : 'Booking'} status changed to <strong>{data.latestStatusUpdate.newValue.replace(/_/g, ' ')}</strong>
          </p>
          <p className="text-xs text-gray-400 mt-1">{new Date(data.latestStatusUpdate.timestamp).toLocaleString('en-IN')}</p>
        </div>
      )}
    </div>
  );
}
