'use client';
import { useEffect, useState } from 'react';
import { servicesAPI } from '../../../lib/api';
import ImageUploader from '../../../components/admin/ImageUploader';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Save, Layers, ToggleLeft, ToggleRight, Search } from 'lucide-react';

const EMPTY = { title:{en:'',hi:''}, slug:'', icon:'🕉️', category:'vastu', shortDesc:{en:'',hi:''}, description:{en:'',hi:''}, originalPrice:999, offerPrice:499, features:[], formFields:[], redirectType:'whatsapp', isActive:true, showOnHome:false, images:[''], seo:{title:'',description:'',keywords:''} };

const slugify = (t:string) => t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [newFeature, setNewFeature] = useState({en:'',hi:''});

  const load = () => { setLoading(true); servicesAPI.getAll().then(r=>setServices(r.data.data||[])).catch(()=>toast.error('Failed')).finally(()=>setLoading(false)); };
  useEffect(()=>{load();},[]);

  const openNew = () => setModal({...EMPTY, images:['']});
  const openEdit = (s:any) => setModal({...s, images:s.images||['']});
  const closeModal = () => { setModal(null); setNewFeature({en:'',hi:''}); };

  const save = async () => {
    if (!modal.title.en || !modal.slug || !modal.offerPrice) return toast.error('Fill required fields');
    setSaving(true);
    try {
      if (modal._id) { await servicesAPI.update(modal._id, modal); toast.success('Service updated!'); }
      else { await servicesAPI.create(modal); toast.success('Service created!'); }
      load(); closeModal();
    } catch(e:any) { toast.error(e?.response?.data?.message||'Save failed'); }
    finally { setSaving(false); }
  };

  const del = async (id:string,name:string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await servicesAPI.delete(id); setServices(p=>p.filter(s=>s._id!==id)); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const toggle = async (s:any,field:string) => {
    try { await servicesAPI.update(s._id,{[field]:!s[field]}); setServices(p=>p.map(x=>x._id===s._id?{...x,[field]:!x[field]}:x)); }
    catch { toast.error('Update failed'); }
  };

  const addFeature = () => {
    if (!newFeature.en) return;
    setModal((p:any)=>({...p,features:[...(p.features||[]),{...newFeature}]}));
    setNewFeature({en:'',hi:''});
  };

  const filtered = services.filter(s=>!search||s.title.en.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold text-gray-800">Services</h1><p className="text-gray-500 text-sm mt-1">{services.length} services</p></div>
        <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark"><Plus size={16}/>Add Service</button>
      </div>
      <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search services…" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
      {loading?<div className="text-center py-20 text-gray-400"><div className="text-3xl animate-spin mb-2">🕉️</div>Loading…</div>:(
        <div className="grid gap-4">
          {filtered.map(s=>(
            <div key={s._id} className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm flex items-center gap-4">
              <div className="text-3xl w-12 h-12 flex items-center justify-center bg-orange-50 rounded-xl flex-shrink-0">{s.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap"><h3 className="font-semibold text-gray-800">{s.title.en}</h3><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.isActive?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{s.isActive?'Active':'Inactive'}</span>{s.showOnHome&&<span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">Homepage</span>}</div>
                <p className="text-xs text-gray-400 mt-0.5">{s.slug} · ₹{s.offerPrice} <span className="line-through text-gray-300">₹{s.originalPrice}</span></p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={()=>toggle(s,'isActive')} className="p-2 rounded-lg hover:bg-gray-50" title={s.isActive?'Deactivate':'Activate'}>{s.isActive?<ToggleRight size={20} className="text-green-500"/>:<ToggleLeft size={20} className="text-gray-400"/>}</button>
                <button onClick={()=>openEdit(s)} className="p-2 rounded-lg hover:bg-orange-50 text-primary"><Edit2 size={16}/></button>
                <button onClick={()=>del(s._id,s.title.en)} className="p-2 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal&&(
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={e=>{if(e.target===e.currentTarget)closeModal();}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between p-5 border-b border-orange-100">
              <h2 className="font-display font-bold text-lg text-gray-800">{modal._id?'Edit Service':'New Service'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Title (EN) *</label><input value={modal.title.en} onChange={e=>{const v=e.target.value;setModal((p:any)=>({...p,title:{...p.title,en:v},slug:p._id?p.slug:slugify(v)}));}} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Title (हिंदी)</label><input value={modal.title.hi||''} onChange={e=>setModal((p:any)=>({...p,title:{...p.title,hi:e.target.value}}))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Slug *</label><input value={modal.slug} onChange={e=>setModal((p:any)=>({...p,slug:e.target.value}))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm font-mono focus:outline-none focus:border-primary"/></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Icon (emoji)</label><input value={modal.icon||'🕉️'} onChange={e=>setModal((p:any)=>({...p,icon:e.target.value}))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Original Price ₹</label><input type="number" value={modal.originalPrice} onChange={e=>setModal((p:any)=>({...p,originalPrice:+e.target.value}))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Offer Price ₹ *</label><input type="number" value={modal.offerPrice} onChange={e=>setModal((p:any)=>({...p,offerPrice:+e.target.value}))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Redirect Type</label><select value={modal.redirectType} onChange={e=>setModal((p:any)=>({...p,redirectType:e.target.value}))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary"><option value="whatsapp">WhatsApp</option><option value="razorpay">Razorpay</option><option value="form">Form</option></select></div>
                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={modal.isActive} onChange={e=>setModal((p:any)=>({...p,isActive:e.target.checked}))} className="rounded"/><span className="text-sm">Active</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={modal.showOnHome} onChange={e=>setModal((p:any)=>({...p,showOnHome:e.target.checked}))} className="rounded"/><span className="text-sm">Show on Home</span></label>
                </div>
              </div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Short Description (EN)</label><textarea value={modal.shortDesc?.en||''} onChange={e=>setModal((p:any)=>({...p,shortDesc:{...p.shortDesc,en:e.target.value}}))} rows={2} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none"/></div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Features (Benefits)</label>
                <div className="space-y-2 mb-2">{(modal.features||[]).map((f:any,i:number)=><div key={i} className="flex items-center gap-2"><span className="flex-1 text-sm bg-orange-50 px-3 py-2 rounded-lg">{f.en}</span><button onClick={()=>setModal((p:any)=>({...p,features:p.features.filter((_:any,idx:number)=>idx!==i)}))} className="text-red-400 hover:text-red-600"><X size={14}/></button></div>)}</div>
                <div className="flex gap-2"><input value={newFeature.en} onChange={e=>setNewFeature(p=>({...p,en:e.target.value}))} placeholder="Feature text (EN)" className="flex-1 px-3 py-2 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/><button onClick={addFeature} className="px-3 py-2 bg-primary text-white rounded-xl text-sm"><Plus size={14}/></button></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">SEO Title</label><input value={modal.seo?.title||''} onChange={e=>setModal((p:any)=>({...p,seo:{...p.seo,title:e.target.value}}))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">SEO Description</label><textarea value={modal.seo?.description||''} onChange={e=>setModal((p:any)=>({...p,seo:{...p.seo,description:e.target.value}}))} rows={2} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none"/></div>
            </div>
            <div className="p-5 border-t border-orange-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark disabled:opacity-60"><Save size={14}/>{saving?'Saving…':'Save Service'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
