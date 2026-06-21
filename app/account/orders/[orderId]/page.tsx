'use client';
/**
 * app/account/orders/[orderId]/page.tsx — NEW (Feature 6)
 * PRODUCTION HOTFIX ROUND 11 — Phase D.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { accountAPI } from '../../../../lib/accountAPI';
import { formatPrice } from '../../../../lib/utils';
import { LoadingSkeleton, ErrorState } from '../../../../components/account/AccountStates';

interface OrderDetail {
  orderId: string; customerInfo: { name: string; email: string; phone: string; address: string; city: string; pincode: string };
  items: { name: string; price: number; qty: number; image?: string }[];
  totalAmount: number; status: string; paymentId?: string; paymentMethod?: string; createdAt: string;
}

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const [data, setData] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true); setError('');
    accountAPI.getOrderDetail(orderId as string)
      .then(r => setData(r.data.data))
      .catch(e => setError(e?.response?.data?.message || 'Could not load this order.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { if (orderId) load(); /* eslint-disable-next-line */ }, [orderId]);

  if (loading) return <LoadingSkeleton rows={3} />;
  if (error || !data) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-sm text-primary font-bold">{data.orderId}</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 capitalize">{data.status}</span>
        </div>
        <p className="text-xs text-gray-400">Placed {new Date(data.createdAt).toLocaleString('en-IN')}</p>
      </div>

      <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3">Products</h2>
        <div className="space-y-2">
          {data.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
              <span className="text-gray-600">{item.name} × {item.qty}</span>
              <span className="font-semibold text-gray-800">{formatPrice(item.price * item.qty)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold text-sm pt-3 mt-1 border-t border-gray-100"><span>Total</span><span className="text-primary">{formatPrice(data.totalAmount)}</span></div>
      </div>

      <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3">Shipping Information</h2>
        <p className="text-sm text-gray-600">{data.customerInfo?.name}</p>
        <p className="text-sm text-gray-500 mt-1">{data.customerInfo?.address}, {data.customerInfo?.city} {data.customerInfo?.pincode}</p>
        <p className="text-sm text-gray-500 mt-1">{data.customerInfo?.phone}</p>
      </div>

      {data.paymentId && (
        <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-2">Payment Information</h2>
          <p className="text-sm text-gray-500">Method: <span className="capitalize text-gray-700">{data.paymentMethod?.replace('_', ' ') || 'Razorpay'}</span></p>
        </div>
      )}
    </div>
  );
}
