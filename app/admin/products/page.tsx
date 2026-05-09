'use client';
import { useEffect, useState } from 'react';
import { productsAPI, adminAPI } from '../../../lib/api';
import ImageUploader from '../../../components/admin/ImageUploader';
import { formatPrice } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Save, Search, ToggleLeft, ToggleRight, Star, RefreshCw, Database, Loader2 } from 'lucide-react';

const CATS = ['bracelets','box-bracelet','rudraksha','gemstones','gemstone-pendants','yantras','rashi','murthy','divine-frames','sacred-mala','charging-plates','pyramids','spiritual'];
const EMPTY = { name:{en:'',hi:''}, slug:'', category:'rudraksha', description:{en:'',hi:''}, benefits:[], price:0, offerPrice:0, images:[''], stock:10, isFeatured:false, isNewLaunch:false, isActive:true, sku:'' };
const slugify = (t:string) => t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [modal, setModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [newBenefit, setNewBenefit] = useState('');

  const load = () => {
    setLoading(true);
    // FIX: Pass limit:500 to get ALL products, not just the default 20
    productsAPI.getAdminAll({ limit: 500, page: 1 })
      .then(r => setProducts(r.data.data || []))
      .catch(() => {
        // Fallback to public API with high limit if admin route fails
        return productsAPI.getAll({ limit: 500 }).then(r => setProducts(r.data.data || []));
      })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const seedProducts = async () => {
    setSeeding(true);
    try {
      const r = await adminAPI.seedProducts();
      toast.success(`Seed complete! ${r.data.message || 'Products restored.'}`);
      load();
    } catch(e:any) { toast.error(e?.response?.data?.message || 'Seed failed. Check backend logs.'); }
    finally { setSeeding(false); }
  };

  const openNew = () => { setModal({ ...EMPTY, images: [''] }); };
  const openEdit = (p: any) => setModal({ ...p, images: p.images?.length ? p.images : [''] });
  const closeModal = () => { setModal(null); setNewBenefit(''); };

  const save = async () => {
    if (!modal.name.en || !modal.slug || !modal.offerPrice) return toast.error('Fill required fields');
    setSaving(true);
    try {
      const data = { ...modal, images: modal.images.filter((u:string) => u.trim()) };
      if (modal._id) { await productsAPI.update(modal._id, data); toast.success('Product updated!'); }
      else { await productsAPI.create(data); toast.success('Product created!'); }
      load(); closeModal();
    } catch(e:any) { toast.error(e?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const del = async (id:string, name:string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await productsAPI.delete(id); setProducts(p => p.filter(x => x._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const toggle = async (p:any, field:string) => {
    try { await productsAPI.update(p._id, { [field]: !p[field] }); setProducts(prev => prev.map(x => x._id === p._id ? { ...x, [field]: !x[field] } : x)); }
    catch { toast.error('Update failed'); }
  };

  const addBenefit = () => {
    if (!newBenefit.trim()) return;
    setModal((p:any) => ({ ...p, benefits: [...(p.benefits || []), newBenefit.trim()] }));
    setNewBenefit('');
  };

  // Filter client-side from ALL loaded products
  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || p.name.en.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    const matchC = catFilter === 'all' || p.category === catFilter;
    return matchQ && matchC;
  });

  const stats = {
    total: products.length,
    active: products.filter(p => p.isActive).length,
    featured: products.filter(p => p.isFeatured).length,
    lowStock: products.filter(p => p.stock <= 5).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} total · {stats.active} active · {stats.featured} featured · {stats.lowStock} low stock</p>
        </div>
        <div className="flex gap-2">
          <button onClick={seedProducts} disabled={seeding} className="flex items-center gap-2 px-4 py-2.5 border border-orange-300 bg-orange-50 text-orange-700 rounded-xl text-sm font-medium hover:bg-orange-100 disabled:opacity-60">
            {seeding ? <><Loader2 size={14} className="animate-spin"/>Seeding…</> : <><Database size={14}/>Seed All 65+ Products</>}
          </button>
          <button onClick={load} className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50"><RefreshCw size={16} className="text-gray-500"/></button>
          <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark"><Plus size={16}/>Add Product</button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {[{l:'Total',v:stats.total,c:'text-gray-800'},{l:'Active',v:stats.active,c:'text-green-600'},{l:'Featured',v:stats.featured,c:'text-yellow-600'},{l:'Low Stock (≤5)',v:stats.lowStock,c:'text-red-500'}].map((s,i)=>(
          <div key={i} className="bg-white rounded-2xl border border-orange-100 p-3 shadow-sm text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{s.l}</p>
            <p className={`font-display font-bold text-xl mt-1 ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products by name, SKU or category…" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary">
          <option value="all">All Categories ({products.length})</option>
          {CATS.map(c => <option key={c} value={c} className="capitalize">{c} ({products.filter(p=>p.category===c).length})</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400"><div className="text-3xl animate-spin mb-2">🕉️</div>Loading all {' '}products…</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(p => (
            <div key={p._id} className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-orange-50">
                {p.images?.[0] ? <img src={p.images[0]} alt={p.name.en} className="w-full h-full object-cover" loading="lazy"/> : <div className="w-full h-full flex items-center justify-center text-xl">🕉️</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-800 truncate">{p.name.en}</h3>
                  {p.isFeatured && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold flex items-center gap-1"><Star size={9}/>Featured</span>}
                  {p.isNewLaunch && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">New</span>}
                  {!p.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">Inactive</span>}
                  {p.stock <= 5 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">Low Stock</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">{p.category} · {formatPrice(p.offerPrice)} <span className="line-through text-gray-300">{formatPrice(p.price)}</span> · Stock: {p.stock}{p.sku ? ` · ${p.sku}` : ''}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggle(p, 'isActive')} className="p-2 rounded-lg hover:bg-gray-50">{p.isActive ? <ToggleRight size={20} className="text-green-500"/> : <ToggleLeft size={20} className="text-gray-400"/>}</button>
                <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-orange-50 text-primary"><Edit2 size={16}/></button>
                <button onClick={() => del(p._id, p.name.en)} className="p-2 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="text-center py-20 bg-white rounded-2xl border border-orange-100">
              <div className="text-5xl mb-3">📦</div>
              <p className="text-gray-500 font-medium mb-2">No products found</p>
              <p className="text-gray-400 text-sm mb-4">
                {catFilter !== 'all' ? `No products in "${catFilter}" category.` : 'No products match your search.'}
              </p>
              {products.length === 0 && (
                <button onClick={seedProducts} disabled={seeding} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium mx-auto">
                  <Database size={14}/>{seeding ? 'Seeding…' : 'Seed All Products Now'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between p-5 border-b border-orange-100">
              <h2 className="font-display font-bold text-lg text-gray-800">{modal._id ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Name (EN) *</label><input value={modal.name.en} onChange={e => { const v = e.target.value; setModal((p:any) => ({ ...p, name: { ...p.name, en: v }, slug: p._id ? p.slug : slugify(v) })); }} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Name (हिंदी)</label><input value={modal.name.hi || ''} onChange={e => setModal((p:any) => ({ ...p, name: { ...p.name, hi: e.target.value } }))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Slug *</label><input value={modal.slug} onChange={e => setModal((p:any) => ({ ...p, slug: e.target.value }))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm font-mono focus:outline-none focus:border-primary"/></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label><select value={modal.category} onChange={e => setModal((p:any) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary">{CATS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">MRP ₹</label><input type="number" value={modal.price} onChange={e => setModal((p:any) => ({ ...p, price: +e.target.value }))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Offer Price ₹ *</label><input type="number" value={modal.offerPrice} onChange={e => setModal((p:any) => ({ ...p, offerPrice: +e.target.value }))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Stock</label><input type="number" value={modal.stock} onChange={e => setModal((p:any) => ({ ...p, stock: +e.target.value }))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">SKU</label><input value={modal.sku || ''} onChange={e => setModal((p:any) => ({ ...p, sku: e.target.value }))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm font-mono focus:outline-none focus:border-primary"/></div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                {[['isActive', 'Active'], ['isFeatured', 'Featured'], ['isNewLaunch', 'New Launch']].map(([f, l]) => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!!(modal as any)[f]} onChange={e => setModal((p:any) => ({ ...p, [f]: e.target.checked }))} className="rounded"/><span className="text-sm">{l}</span></label>
                ))}
              </div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Description (EN)</label><textarea value={modal.description?.en || ''} onChange={e => setModal((p:any) => ({ ...p, description: { ...p.description, en: e.target.value } }))} rows={3} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none"/></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Description (हिंदी)</label><textarea value={modal.description?.hi || ''} onChange={e => setModal((p:any) => ({ ...p, description: { ...p.description, hi: e.target.value } }))} rows={2} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none"/></div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Benefits</label>
                <div className="space-y-2 mb-2">{(modal.benefits || []).map((b:string, i:number) => <div key={i} className="flex items-center gap-2"><span className="flex-1 text-sm bg-orange-50 px-3 py-2 rounded-lg">{b}</span><button onClick={() => setModal((p:any) => ({ ...p, benefits: p.benefits.filter((_:any, idx:number) => idx !== i) }))} className="text-red-400"><X size={14}/></button></div>)}</div>
                <div className="flex gap-2"><input value={newBenefit} onChange={e => setNewBenefit(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBenefit()} placeholder="Add benefit…" className="flex-1 px-3 py-2 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/><button onClick={addBenefit} className="px-3 py-2 bg-primary text-white rounded-xl text-sm"><Plus size={14}/></button></div>
              </div>
              <ImageUploader images={modal.images || ['']} onChange={(imgs:string[]) => setModal((p:any) => ({ ...p, images: imgs }))} maxImages={5} label="Product Images"/>
            </div>
            <div className="p-5 border-t border-orange-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark disabled:opacity-60"><Save size={14}/>{saving ? 'Saving…' : 'Save Product'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
