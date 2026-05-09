'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import { TrendingUp, Users, ShoppingBag, Calendar, Layers, Package } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminAPI.getDashboard().then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="space-y-6"><div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">{[...Array(6)].map((_,i)=><div key={i} className="h-24 skeleton rounded-2xl"/>)}</div></div>;
  const s = data?.stats;
  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold text-gray-800">Dashboard</h1><p className="text-gray-500 text-sm mt-1">Welcome back, Admin 🙏</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Total Revenue', value: formatPrice(s?.totalRevenue||0), icon: TrendingUp, href: '/admin/orders', color: 'border-primary' },
          { label: 'Orders', value: s?.totalOrders||0, icon: ShoppingBag, href: '/admin/orders', color: 'border-blue-500' },
          { label: 'Bookings', value: s?.totalBookings||0, icon: Calendar, href: '/admin/bookings', color: 'border-green-500' },
          { label: 'Users', value: s?.totalUsers||0, icon: Users, href: '/admin/users', color: 'border-purple-500' },
          { label: 'Services', value: s?.totalServices||0, icon: Layers, href: '/admin/services', color: 'border-yellow-500' },
          { label: 'Products', value: s?.totalProducts||0, icon: Package, href: '/admin/products', color: 'border-pink-500' },
        ].map((c,i)=>(
          <Link key={i} href={c.href} className={`bg-white rounded-2xl p-5 border-l-4 ${c.color} hover:shadow-md transition-all`}>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{c.label}</p>
            <p className="font-display text-2xl font-bold text-gray-800 mt-1">{c.value}</p>
          </Link>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-gray-800">Recent Orders</h2><Link href="/admin/orders" className="text-primary text-xs hover:underline">View All →</Link></div>
          {data?.recentOrders?.slice(0,5).map((o:any)=>(
            <div key={o._id} className="flex justify-between py-2 border-b border-gray-50 text-sm last:border-0">
              <span className="text-gray-700">{o.customerInfo?.name}</span>
              <span className="font-semibold text-primary">{formatPrice(o.totalAmount)}</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-gray-800">Recent Bookings</h2><Link href="/admin/bookings" className="text-primary text-xs hover:underline">View All →</Link></div>
          {data?.recentBookings?.slice(0,5).map((b:any)=>(
            <div key={b._id} className="flex justify-between py-2 border-b border-gray-50 text-sm last:border-0">
              <span className="text-gray-700">{b.name} — {b.serviceName}</span>
              <span className="font-semibold text-primary">{formatPrice(b.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
