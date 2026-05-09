'use client';
import { useEffect, useState } from 'react';
import { adminAPI, aiStatusAPI } from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import Link from 'next/link';
import { TrendingUp, Users, ShoppingBag, Calendar, Layers, Package, Globe, Sparkles, Rss, ImageIcon, MessageSquare, Settings, BookOpen, Wand2, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

const QUICK_ACTIONS = [
  { href: '/admin/website-editor', icon: Globe, label: 'Website Editor', desc: 'Edit homepage content', color: 'bg-blue-50 text-blue-600 border-blue-100', badge: 'HOT' },
  { href: '/admin/services', icon: Layers, label: 'Services', desc: 'Manage consultations', color: 'bg-orange-50 text-primary border-orange-100' },
  { href: '/admin/products', icon: Package, label: 'Products', desc: 'Manage store items', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { href: '/admin/blogs', icon: BookOpen, label: 'Blogs', desc: 'Write & publish posts', color: 'bg-green-50 text-green-600 border-green-100' },
  { href: '/admin/bookings', icon: Calendar, label: 'Bookings', desc: 'View appointments', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { href: '/admin/orders', icon: ShoppingBag, label: 'Orders', desc: 'Track store orders', color: 'bg-pink-50 text-pink-600 border-pink-100' },
  { href: '/admin/social-posts', icon: Rss, label: 'Vastu Feed', desc: 'Post updates & tips', color: 'bg-teal-50 text-teal-600 border-teal-100', badge: 'NEW' },
  { href: '/admin/ai-settings', icon: Sparkles, label: 'AI Settings', desc: 'Configure AI guide', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', badge: 'NEW' },
  { href: '/admin/product-generator', icon: Wand2, label: 'AI Generator', desc: 'Auto-create products', color: 'bg-violet-50 text-violet-600 border-violet-100' },
  { href: '/admin/slider', icon: ImageIcon, label: 'Slider', desc: 'Homepage banners', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
  { href: '/admin/popups', icon: MessageSquare, label: 'Popups', desc: 'Manage site popups', color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
  { href: '/admin/settings', icon: Settings, label: 'Settings', desc: 'Site configuration', color: 'bg-gray-50 text-gray-600 border-gray-200' },
];

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState<any>(null);

  useEffect(() => {
    adminAPI.getDashboard().then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false));
    aiStatusAPI.check().then(r => setAiStatus(r.data)).catch(() => setAiStatus({ available: false, message: 'Could not connect to AI API' }));
  }, []);

  const s = data?.stats;

  const STATS = [
    { label: 'Total Revenue', value: formatPrice(s?.totalRevenue || 0), icon: TrendingUp, color: 'border-l-primary', href: '/admin/orders' },
    { label: 'Orders', value: s?.totalOrders || 0, icon: ShoppingBag, color: 'border-l-blue-500', href: '/admin/orders' },
    { label: 'Bookings', value: s?.totalBookings || 0, icon: Calendar, color: 'border-l-green-500', href: '/admin/bookings' },
    { label: 'Users', value: s?.totalUsers || 0, icon: Users, color: 'border-l-purple-500', href: '/admin/users' },
    { label: 'Services', value: s?.totalServices || 0, icon: Layers, color: 'border-l-yellow-500', href: '/admin/services' },
    { label: 'Products', value: s?.totalProducts || 0, icon: Package, color: 'border-l-pink-500', href: '/admin/products' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, Admin 🙏 — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <Link href="/" target="_blank" className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">View Site <ArrowRight size={12}/></Link>
      </div>

      {/* AI Status Banner */}
      {aiStatus && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm ${aiStatus.available ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {aiStatus.available
            ? <><CheckCircle size={16} className="flex-shrink-0 text-green-600"/><span><strong>AI Vastu Guide is online</strong> — {aiStatus.model || 'Claude AI'} ready</span></>
            : <><AlertTriangle size={16} className="flex-shrink-0 text-red-500"/><span><strong>AI Guide is offline</strong> — {aiStatus.message || 'Check ANTHROPIC_API_KEY in Render environment variables'}</span><Link href="/admin/ai-settings" className="ml-auto text-xs font-semibold underline flex-shrink-0">Fix →</Link></>
          }
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl"/>)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Link key={i} href={stat.href} className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${stat.color} p-4 hover:shadow-md transition-all group`}>
                <div className="flex items-start justify-between mb-2"><p className="text-xs text-gray-400 uppercase tracking-wide leading-tight">{stat.label}</p><Icon size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors mt-0.5"/></div>
                <p className="font-display font-bold text-2xl text-gray-800">{stat.value}</p>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={i} href={action.href} className={`relative flex items-center gap-3 p-3.5 bg-white rounded-2xl border hover:shadow-md transition-all group ${action.color.split(' ').find((c: string) => c.startsWith('border-')) || 'border-gray-100'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${action.color}`}><Icon size={18}/></div>
                <div className="min-w-0"><p className="font-semibold text-gray-800 text-sm leading-tight">{action.label}</p><p className="text-xs text-gray-400 mt-0.5 truncate">{action.desc}</p></div>
                {action.badge && <span className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(255,107,0,0.15)', color: '#FF6B00', fontSize: '9px' }}>{action.badge}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-gray-800">Recent Bookings</h2><Link href="/admin/bookings" className="text-primary text-xs hover:underline font-medium">View All →</Link></div>
          {data?.recentBookings?.length > 0 ? data.recentBookings.slice(0, 5).map((b: any) => (
            <div key={b._id} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
              <div><p className="text-sm font-medium text-gray-800">{b.name}</p><p className="text-xs text-gray-400">{b.serviceName}</p></div>
              <span className="font-semibold text-primary text-sm">{formatPrice(b.amount)}</span>
            </div>
          )) : <p className="text-center text-gray-400 text-sm py-8">No bookings yet</p>}
        </div>
        <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-gray-800">Recent Orders</h2><Link href="/admin/orders" className="text-primary text-xs hover:underline font-medium">View All →</Link></div>
          {data?.recentOrders?.length > 0 ? data.recentOrders.slice(0, 5).map((o: any) => (
            <div key={o._id} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
              <div><p className="text-sm font-medium text-gray-800">{o.customerInfo?.name}</p><p className="text-xs text-gray-400 capitalize">{o.status}</p></div>
              <span className="font-semibold text-primary text-sm">{formatPrice(o.totalAmount)}</span>
            </div>
          )) : <p className="text-center text-gray-400 text-sm py-8">No orders yet</p>}
        </div>
      </div>

      {/* AI Fix Guide - shown when AI is offline */}
      {aiStatus && !aiStatus.available && (
        <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-orange-500"/>Fix AI Vastu Guide</h2>
          <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
            <li>Go to <strong>Render Dashboard</strong> → your backend service → <strong>Environment</strong></li>
            <li>Add: <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-xs">ANTHROPIC_API_KEY</code> = your key from console.anthropic.com</li>
            <li>Also check: <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-xs">GEMINI_API_KEY</code> if using Gemini</li>
            <li>Click <strong>Save Changes</strong> → Render will auto-restart the service</li>
            <li>Wait 2-3 minutes, then refresh this dashboard</li>
          </ol>
        </div>
      )}
    </div>
  );
}
