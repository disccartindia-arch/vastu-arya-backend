'use client';
import { useEffect, useState } from 'react';
import { blogsAPI } from '../../../lib/api';
import ImageUploader from '../../../components/admin/ImageUploader';
import MobileImageUpload from '../../../components/admin/MobileImageUpload';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Save, Search, Eye, ToggleLeft, ToggleRight } from 'lucide-react';

const CATS = ['Vastu Tips','Astrology','Numerology','Gemstones','Remedies','Spirituality','Success Stories'];
const EMPTY = { title:{en:'',hi:''}, slug:'', content:{en:'',hi:''}, excerpt:{en:'',hi:''}, category:CATS[0], tags:[], author:'Dr. PPS Tomar', coverImage:'', isPublished:false, seo:{title:'',description:''} };
const slugify = (t:string) => t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'en'|'hi'>('en');

  const load = () => { setLoading(true); blogsAPI.getAll().then(r=>setBlogs(r.data.data||[])).catch(()=>toast.error('Failed')).finally(()=>setLoading(false)); };
  useEffect(()=>{load();},[]);

  const openNew = () => { setModal({...EMPTY}); setTab('en'); };
  const openEdit = (b:any) => { setModal({...b}); setTab('en'); };
  const closeModal = () => setModal(null);

  const save = async () => {
    if (!modal.title.en||!modal.slug) return toast.error('Title and slug are required');
    setSaving(true);
    try {
      if (modal._id){await blogsAPI.update(modal._id,modal);toast.success('Blog updated!');}
      else{await blogsAPI.create(modal);toast.success('Blog published!');}
      load();closeModal();
    } catch(e:any){toast.error(e?.response?.data?.message||'Save failed');}
    finally{setSaving(false);}
  };

  const del = async (id:string,title:string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try{await blogsAPI.delete(id);setBlogs(p=>p.filter(b=>b._id!==id));toast.success('Deleted');}
    catch{toast.error('Delete failed');}
  };

  const toggle = async (b:any) => {
    try{await blogsAPI.update(b._id,{isPublished:!b.isPublished});setBlogs(p=>p.map(x=>x._id===b._id?{...x,isPublished:!x.isPublished}:x));}
    catch{toast.error('Toggle failed');}
  };

  const filtered = blogs.filter(b=>!search||b.title.en.toLowerCase().includes(search.toLowerCase())||b.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="font-display text-2xl font-bold text-gray-800">Blogs</h1><p className="text-gray-500 text-sm mt-1">{blogs.length} blog posts</p></div><button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark"><Plus size={16}/>New Post</button></div>
      <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search blogs…" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
      {loading?<div className="text-center py-20 text-gray-400"><div className="text-3xl animate-spin mb-2">🕉️</div>Loading…</div>:(
        <div className="grid gap-4">
          {filtered.map(b=>(
            <div key={b._id} className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm flex items-center gap-4">
              {b.coverImage?<img src={b.coverImage} alt={b.title.en} className="w-14 h-14 rounded-xl object-cover flex-shrink-0"/>:<div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">📝</div>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><h3 className="font-semibold text-gray-800 truncate">{b.title.en}</h3><span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${b.isPublished?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{b.isPublished?'Published':'Draft'}</span></div>
                <p className="text-xs text-gray-400 mt-0.5">{b.category} · By {b.author} · <span className="flex items-center gap-1 inline-flex"><Eye size={10}/>{b.views||0} views</span></p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={()=>toggle(b)} className="p-2 rounded-lg hover:bg-gray-50">{b.isPublished?<ToggleRight size={20} className="text-green-500"/>:<ToggleLeft size={20} className="text-gray-400"/>}</button>
                <button onClick={()=>openEdit(b)} className="p-2 rounded-lg hover:bg-orange-50 text-primary"><Edit2 size={16}/></button>
                <button onClick={()=>del(b._id,b.title.en)} className="p-2 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
          {filtered.length===0&&<div className="text-center py-20 text-gray-400">No blog posts found</div>}
        </div>
      )}

      {modal&&(
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={e=>{if(e.target===e.currentTarget)closeModal();}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4">
            <div className="flex items-center justify-between p-5 border-b border-orange-100"><h2 className="font-display font-bold text-lg text-gray-800">{modal._id?'Edit Blog Post':'New Blog Post'}</h2><button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button></div>
            <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
              <div className="flex gap-2 mb-2">{(['en','hi'] as const).map(l=><button key={l} onClick={()=>setTab(l)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab===l?'bg-primary text-white':'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{l==='en'?'English':'हिंदी'}</button>)}</div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Title ({tab.toUpperCase()}) *</label><input value={modal.title[tab]||''} onChange={e=>{const v=e.target.value;setModal((p:any)=>({...p,title:{...p.title,[tab]:v},slug:p._id?p.slug:(tab==='en'?slugify(v):p.slug)}));}} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Slug</label><input value={modal.slug||''} onChange={e=>setModal((p:any)=>({...p,slug:e.target.value}))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm font-mono focus:outline-none focus:border-primary"/></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label><select value={modal.category} onChange={e=>setModal((p:any)=>({...p,category:e.target.value}))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary">{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Author</label><input value={modal.author||'Dr. PPS Tomar'} onChange={e=>setModal((p:any)=>({...p,author:e.target.value}))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={modal.isPublished} onChange={e=>setModal((p:any)=>({...p,isPublished:e.target.checked}))} className="rounded"/><span className="text-sm font-medium">Publish immediately</span></label>
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Excerpt ({tab.toUpperCase()})</label><textarea value={modal.excerpt?.[tab]||''} onChange={e=>setModal((p:any)=>({...p,excerpt:{...p.excerpt,[tab]:e.target.value}}))} rows={2} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none"/></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Content ({tab.toUpperCase()})</label><textarea value={modal.content?.[tab]||''} onChange={e=>setModal((p:any)=>({...p,content:{...p.content,[tab]:e.target.value}}))} rows={12} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm font-mono focus:outline-none focus:border-primary resize-none" placeholder="Supports HTML markup…"/></div>
              <MobileImageUpload value={modal.coverImage||''} onChange={(url:string)=>setModal((p:any)=>({...p,coverImage:url}))} label="Cover Photo" height="h-36"/>
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Tags (comma-separated)</label><input value={(modal.tags||[]).join(', ')} onChange={e=>setModal((p:any)=>({...p,tags:e.target.value.split(',').map((t:string)=>t.trim()).filter(Boolean)}))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">SEO Title</label><input value={modal.seo?.title||''} onChange={e=>setModal((p:any)=>({...p,seo:{...p.seo,title:e.target.value}}))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">SEO Description</label><input value={modal.seo?.description||''} onChange={e=>setModal((p:any)=>({...p,seo:{...p.seo,description:e.target.value}}))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
              </div>
            </div>
            <div className="p-5 border-t border-orange-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark disabled:opacity-60"><Save size={14}/>{saving?'Saving…':'Save Post'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
