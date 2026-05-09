'use client';
import { useEffect, useState } from 'react';
import { settingsAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
const EMPTY={title:'',content:'',image:'',ctaText:'Book Now',ctaLink:'/book-appointment',delay:3,isActive:true,type:'appointment'};
const TYPES=['appointment','discount','announcement','newsletter'];
export default function PopupsPage() {
  const [popups,setPopups]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState<any>(null);
  const [saving,setSaving]=useState(false);
  const load=()=>{setLoading(true);settingsAPI.getPopups().then(r=>setPopups(r.data.data||[])).catch(()=>toast.error('Failed')).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[]);
  const save=async()=>{setSaving(true);try{if(modal._id){await settingsAPI.updatePopup(modal._id,modal);toast.success('Updated!');}else{await settingsAPI.createPopup(modal);toast.success('Created!');}load();setModal(null);}catch{toast.error('Failed');}finally{setSaving(false);}};
  const del=async(id:string)=>{if(!confirm('Delete popup?'))return;try{await settingsAPI.deletePopup(id);setPopups(p=>p.filter(x=>x._id!==id));toast.success('Deleted');}catch{toast.error('Failed');}};
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="font-display text-2xl font-bold text-gray-800">Popups</h1><p className="text-gray-500 text-sm mt-1">Manage site-wide popups</p></div><button onClick={()=>setModal({...EMPTY})} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium"><Plus size={16}/>New Popup</button></div>
      {loading?<div className="text-center py-20 text-gray-400"><div className="text-3xl animate-spin mb-2">🕉️</div>Loading…</div>:(
        <div className="grid gap-4">{popups.map(p=>(
          <div key={p._id} className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm flex items-start gap-4">
            <div className="text-3xl">💬</div>
            <div className="flex-1 min-w-0"><h3 className="font-semibold text-gray-800">{p.title||'Untitled'}</h3><p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.content}</p><div className="flex items-center gap-3 mt-2 text-xs text-gray-400"><span className="capitalize px-2 py-0.5 bg-gray-100 rounded-full">{p.type}</span><span>Delay: {p.delay}s</span><span className={`px-2 py-0.5 rounded-full font-semibold ${p.isActive?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{p.isActive?'Active':'Inactive'}</span></div></div>
            <div className="flex gap-1"><button onClick={()=>setModal({...p})} className="p-2 rounded-lg hover:bg-orange-50 text-primary"><Edit2 size={16}/></button><button onClick={()=>del(p._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={16}/></button></div>
          </div>
        ))}{popups.length===0&&<div className="text-center py-20 text-gray-400">No popups yet</div>}</div>
      )}
      {modal&&(<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-orange-100 sticky top-0 bg-white"><h2 className="font-display font-bold text-lg">{modal._id?'Edit Popup':'New Popup'}</h2><button onClick={()=>setModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button></div>
          <div className="p-5 space-y-4">
            {[['Title','title'],['CTA Text','ctaText'],['CTA Link','ctaLink'],['Image URL','image']].map(([label,key])=><div key={key}><label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label><input value={(modal as any)[key]||''} onChange={e=>setModal((p:any)=>({...p,[key]:e.target.value}))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>)}
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Content</label><textarea value={modal.content||''} onChange={e=>setModal((p:any)=>({...p,content:e.target.value}))} rows={3} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary"/></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label><select value={modal.type} onChange={e=>setModal((p:any)=>({...p,type:e.target.value}))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary">{TYPES.map(t=><option key={t} value={t} className="capitalize">{t}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Delay (seconds)</label><input type="number" min="0" max="30" value={modal.delay||3} onChange={e=>setModal((p:any)=>({...p,delay:+e.target.value}))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={modal.isActive} onChange={e=>setModal((p:any)=>({...p,isActive:e.target.checked}))} className="rounded"/><span className="text-sm">Active (show on site)</span></label>
          </div>
          <div className="p-5 border-t border-orange-100 flex justify-end gap-3"><button onClick={()=>setModal(null)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm">Cancel</button><button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-60"><Save size={14}/>{saving?'Saving…':'Save'}</button></div>
        </div>
      </div>)}
    </div>
  );
}
