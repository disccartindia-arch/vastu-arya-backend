'use client';
/**
 * app/account/orders/[orderId]/page.tsx — enhanced with an Order Timeline.
 * Backend contract unchanged.
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { accountAPI } from '../../../../lib/accountAPI';
import { formatPrice } from '../../../../lib/utils';
import { LoadingSkeleton, ErrorState } from '../../../../components/account/AccountStates';
import PaymentTimeline, { PaymentTimelineStep, StepStatus } from '../../../../components/payment/PaymentTimeline';
import { Package, Copy, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderDetail {
  orderId: string;
  customerInfo: { name: string; email: string; phone: string; address: string; city: string; pincode: string };
  items: { name: string; price: number; qty: number; image?: string }[];
  totalAmount: number; status: string; paymentId?: string; paymentMethod?: string; createdAt: string;
}

const ORDER_STAGES = ['pending', 'processing', 'shipped', 'delivered'];

function statusForStep(idx: number, i: number, cancelled = false): StepStatus {
  if (cancelled) return 'failed';
  if (idx > i) return 'done';
  if (idx === i) return 'active';
  return 'pending';
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

  const timeline: PaymentTimelineStep[] = useMemo(() => {
    if (!data) return [];
    const idx = ORDER_STAGES.indexOf(data.status);
    const cancelled = data.status === 'cancelled';
    return [
      { key: 'placed',     label: 'Order placed',      status: 'done', timestamp: data.createdAt },
      { key: 'processing', label: 'Being prepared',    status: statusForStep(idx, 1, cancelled) },
      { key: 'shipped',    label: 'Shipped',           status: statusForStep(idx, 2, cancelled) },
      { key: 'delivered',  label: 'Delivered',         status: statusForStep(idx, 3, cancelled) },
    ];
  }, [data]);

  if (loading) return <LoadingSkeleton rows={3} />;
  if (error || !data) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Order ID</p>
            <p className="font-mono text-sm text-primary font-bold">{data.orderId}</p>
          </div>
          <button data-testid="copy-order-id" onClick={() => { navigator.clipboard?.writeText(data.orderId); toast.success('Copied'); }} className="p-2 hover:bg-orange-50 rounded-lg">
            <Copy size={15} className="text-gray-400" />
          </button>
        </div>
        <p className="text-xs text-gray-400">Placed {new Date(data.createdAt).toLocaleString('en-IN')}</p>
      </div>

      <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm"><Package size={16} className="text-primary" /> Order Timeline</h2>
        <PaymentTimeline steps={timeline} testId="order-timeline" />
      </div>

      <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3 text-sm">Products</h2>
        <div className="space-y-2">
          {data.items?.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                {item.image && <img src={item.image} alt={item.name} className="w-9 h-9 rounded-md object-cover flex-shrink-0" />}
                <span className="text-gray-600 truncate">{item.name} × {item.qty}</span>
              </div>
              <span className="font-semibold text-gray-800 flex-shrink-0">{formatPrice(item.price * item.qty)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold text-sm pt-3 mt-1 border-t border-gray-100"><span>Total</span><span className="text-primary">{formatPrice(data.totalAmount)}</span></div>
      </div>

      <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3 text-sm">Shipping Information</h2>
        <p className="text-sm text-gray-600">{data.customerInfo?.name}</p>
        <p className="text-sm text-gray-500 mt-1">{data.customerInfo?.address}, {data.customerInfo?.city} {data.customerInfo?.pincode}</p>
        <p className="text-sm text-gray-500 mt-1">{data.customerInfo?.phone}</p>
      </div>

      {data.paymentId && (
        <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-2 text-sm">Payment Information</h2>
          <p className="text-sm text-gray-500">Method: <span className="capitalize text-gray-700">{data.paymentMethod?.replace('_', ' ') || 'Razorpay'}</span></p>
          <p className="text-xs text-gray-400 font-mono mt-1">{data.paymentId}</p>
        </div>
      )}

      <a href="https://wa.me/917000343804" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#25D366] text-white font-semibold text-sm">
        <Phone size={15} /> Contact Support
      </a>
    </div>
  );
}
