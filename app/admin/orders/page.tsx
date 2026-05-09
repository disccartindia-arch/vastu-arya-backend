'use client';
import { useEffect, useState } from 'react';
import { ordersAPI } from '../../../lib/api';
import { formatPrice } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { ShoppingBag, Search, RefreshCw, Phone, MapPin } from 'lucide-react';

const STATUS_COLORS: Record<string,string> = { pending:'bg-yellow-100 text-yellow-700', processing:'bg-blue-100 text-blue-700', shipped:'bg-purple-100 text-purple-700', delivered:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700' };

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<string|null>(null);

  const load = () => { setLoading(true); ordersAPI.getAll().then(r=>setOrders(r.data.data||[])).catch(()=>toast.error('Failed')).finally(()=>setLoading(false)); };
  useEffect(()=>{load();},[]);

  const updateStatus = async (id:string,status:string) => {
    try { await ordersAPI.updateStatus(id,{status}); setOrders(p=>p.map(o=>o._id===id?{...o,status}:o)); toast.success('Status updated!'); }
    catch { toast.error('Update failed'); }
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchQ = !q || o.customerInfo?.name?.toLowerCase().includes(q) || o.customerInfo?.phone?.includes(q) || o.orderId?.toLowerCase().includes(q);
    return matchQ && (statusFilter==='all'||o.status===statusFilter);
  });

  const stats = { total:orders.length, pending:orders.filter(o=>o.status==='pending').length, processing:orders.filter(o=>o.status==='processing').length, revenue:orders.reduce((s,o)=>s+(o.totalAmount||0),0) };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="font-display text-2xl font-bold text-gray-800">Orders</h1><p className="text-gray-500 text-sm mt-1">{orders.length} total orders</p></div><button onClick={load} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"><RefreshCw size={14}/>Refresh</button></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{l:'Total Orders',v:stats.total,c:'text-gray-800'},{l:'Pending',v:stats.pending,c:'text-yellow-600'},{l:'Processing',v:stats.processing,c:'text-blue-600'},{l:'Total Revenue',v:formatPrice(stats.revenue),c:'text-primary'}].map((s,i)=>(
          <div key={i} className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm"><p className="text-xs text-gray-400 uppercase tracking-wide">{s.l}</p><p className={`font-display font-bold text-2xl mt-1 ${s.c}`}>{s.v}</p></div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-orange-50">
          <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, phone, order ID…" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary">
            {['all','pending','processing','shipped','delivered','cancelled'].map(s=><option key={s} value={s} className="capitalize">{s==='all'?'All Status':s}</option>)}
          </select>
        </div>
        {loading?<div className="p-8 text-center text-gray-400"><div className="text-3xl animate-spin mb-2">🕉️</div>Loading…</div>:filtered.length===0?<div className="p-8 text-center text-gray-400"><ShoppingBag size={32} className="mx-auto mb-2 opacity-40"/>No orders found</div>:(
          <div className="divide-y divide-gray-50">
            {filtered.map(o=>(
              <div key={o._id}>
                <div className="flex items-center gap-4 px-4 py-3 hover:bg-orange-50/30 cursor-pointer" onClick={()=>setExpanded(expanded===o._id?null:o._id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs text-gray-400">{o.orderId||o._id?.slice(-8)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[o.status]||'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                    </div>
                    <p className="font-medium text-gray-800 mt-0.5">{o.customerInfo?.name}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1"><Phone size={10}/>{o.customerInfo?.phone}</span>
                      <span className="flex items-center gap-1"><MapPin size={10}/>{o.customerInfo?.city}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-primary">{formatPrice(o.totalAmount||0)}</p>
                    <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
                    <select value={o.status} onClick={e=>e.stopPropagation()} onChange={e=>updateStatus(o._id,e.target.value)} className="mt-1 text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none">
                      {['pending','processing','shipped','delivered','cancelled'].map(s=><option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </div>
                </div>
                {expanded===o._id&&o.items&&(
                  <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mt-3 mb-2 uppercase tracking-wide">Order Items</p>
                    {o.items.map((item:any,i:number)=>(
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                        {item.image&&<img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg"/>}
                        <div className="flex-1 text-sm"><p className="font-medium text-gray-800">{item.name}</p><p className="text-gray-400 text-xs">Qty: {item.qty}</p></div>
                        <p className="font-semibold text-sm text-primary">{formatPrice(item.price*item.qty)}</p>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-sm pt-2"><span>Total</span><span className="text-primary">{formatPrice(o.totalAmount)}</span></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
