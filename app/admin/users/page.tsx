'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import { Users, Search, RefreshCw, Shield, UserCircle } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => { setLoading(true); adminAPI.getUsers().then((r:any)=>setUsers(r.data.data||[])).catch(()=>toast.error('Failed')).finally(()=>setLoading(false)); };
  useEffect(()=>{load();},[]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="font-display text-2xl font-bold text-gray-800">Users</h1><p className="text-gray-500 text-sm mt-1">{users.length} registered users</p></div><button onClick={load} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"><RefreshCw size={14}/>Refresh</button></div>
      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-orange-50">
          <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email, phone…" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
        </div>
        {loading?<div className="p-8 text-center text-gray-400"><div className="text-3xl animate-spin mb-2">🕉️</div>Loading…</div>:filtered.length===0?<div className="p-8 text-center text-gray-400"><Users size={32} className="mx-auto mb-2 opacity-40"/>No users found</div>:(
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide"><tr>{['User','Email','Phone','Role','Joined'].map(h=><th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u=>(
                  <tr key={u._id} className="hover:bg-orange-50/30">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{u.name?.[0]?.toUpperCase()||'?'}</div><span className="font-medium text-gray-800">{u.name}</span></div></td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500">{u.phone||'—'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${u.role==='admin'?'bg-primary/10 text-primary':'bg-gray-100 text-gray-600'}`}>{u.role==='admin'&&<Shield size={10}/>}{u.role}</span></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
