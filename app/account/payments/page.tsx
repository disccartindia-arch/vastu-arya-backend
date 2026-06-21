'use client';
/**
 * app/account/payments/page.tsx — NEW (Feature 4: My Payments)
 * PRODUCTION HOTFIX ROUND 11 — Phase D.
 */
import { useEffect, useState } from 'react';
import { accountAPI } from '../../../lib/accountAPI';
import { formatPrice } from '../../../lib/utils';
import { LoadingSkeleton, EmptyState, ErrorState } from '../../../components/account/AccountStates';
import { CreditCard } from 'lucide-react';

interface PaymentRow { reference: string; amount: number; status: string; method: string; date: string; type: string; }

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', submitted: 'bg-amber-100 text-amber-700', UPI_PENDING: 'bg-amber-100 text-amber-700',
  verified: 'bg-green-100 text-green-700', paid: 'bg-green-100 text-green-700', PAID: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600', REJECTED: 'bg-red-100 text-red-600',
  refunded: 'bg-gray-200 text-gray-600',
};

const FILTERS = [{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'verified', label: 'Verified' }, { key: 'rejected', label: 'Rejected' }, { key: 'refunded', label: 'Refunded' }];

export default function MyPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = () => {
    setLoading(true); setError('');
    accountAPI.getPayments({ filter })
      .then(r => setPayments(r.data.data || []))
      .catch(() => setError('Could not load your payments.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${filter === f.key ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'}`}>{f.label}</button>
        ))}
      </div>

      {loading ? <LoadingSkeleton /> : error ? <ErrorState message={error} onRetry={load} /> : payments.length === 0 ? (
        <EmptyState icon={CreditCard} title="No payments found" subtitle="Your UPI and card payments will appear here" />
      ) : (
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>{['Reference', 'Amount', 'Date', 'Method', 'Status'].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((p, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.reference}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{formatPrice(p.amount)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.date).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs capitalize">{p.method.replace('_', ' ')}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[p.status] || 'bg-gray-100'}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
