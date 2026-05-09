'use client';
import { useEffect, useState } from 'react';
import { settingsAPI } from '../../../lib/api';
import MobileImageUpload from '../../../components/admin/MobileImageUpload';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Save, Image as ImageIcon, ToggleLeft, ToggleRight } from 'lucide-react';

const EMPTY = { title: '', subtitle: '', image: '', ctaText: 'Book Now', ctaLink: '/book-appointment', isActive: true, sortOrder: 0 };

export default function SliderPage() {
  const [sliders, setSliders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    settingsAPI.getAllSliders().then(r => setSliders(r.data.data || [])).catch(() => toast.error('Failed to load slides')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!modal.image) return toast.error('Please add a slide image');
    setSaving(true);
    try {
      if (modal._id) { await settingsAPI.updateSlider(modal._id, modal); toast.success('Slide updated!'); }
      else { await settingsAPI.createSlider(modal); toast.success('Slide added!'); }
      load(); setModal(null);
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this slide?')) return;
    try { await settingsAPI.deleteSlider(id); setSliders(p => p.filter(s => s._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const toggle = async (s: any) => {
    try { await settingsAPI.updateSlider(s._id, { isActive: !s.isActive }); setSliders(p => p.map(x => x._id === s._id ? { ...x, isActive: !x.isActive } : x)); }
    catch { toast.error('Update failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold text-gray-800">Homepage Slider</h1><p className="text-gray-500 text-sm mt-1">{sliders.length} slides configured</p></div>
        <button onClick={() => setModal({ ...EMPTY })} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark"><Plus size={16}/>Add Slide</button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400"><div className="text-3xl animate-spin mb-2">🕉️</div>Loading…</div>
      ) : sliders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-orange-100">
          <ImageIcon size={40} className="mx-auto mb-3 text-gray-200"/>
          <p className="text-gray-500 font-medium">No slides yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first homepage slide to get started</p>
          <button onClick={() => setModal({ ...EMPTY })} className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium mx-auto"><Plus size={14}/>Add First Slide</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {sliders.sort((a, b) => a.sortOrder - b.sortOrder).map(s => (
            <div key={s._id} className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm flex items-center gap-4">
              <div className="w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-orange-50">
                {s.image ? <img src={s.image} alt={s.title} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="text-gray-300"/></div>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{s.title || 'Untitled Slide'}</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{s.subtitle}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.isActive ? 'Active' : 'Hidden'}</span>
                  <span className="text-xs text-gray-400">Order: {s.sortOrder}</span>
                  <span className="text-xs bg-orange-50 text-primary px-2 py-0.5 rounded-full">{s.ctaText}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggle(s)} className="p-2 rounded-lg hover:bg-gray-50">{s.isActive ? <ToggleRight size={20} className="text-green-500"/> : <ToggleLeft size={20} className="text-gray-400"/>}</button>
                <button onClick={() => setModal({ ...s })} className="p-2 rounded-lg hover:bg-orange-50 text-primary"><Edit2 size={16}/></button>
                <button onClick={() => del(s._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between p-5 border-b border-orange-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-display font-bold text-lg text-gray-800">{modal._id ? 'Edit Slide' : 'New Slide'}</h2>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              <MobileImageUpload
                value={modal.image || ''}
                onChange={(url: string) => setModal((p: any) => ({ ...p, image: url }))}
                label="Slide Image *"
                height="h-40"
              />
              {[['Title', 'title', 'e.g. Transform Your Space'], ['Subtitle', 'subtitle', 'e.g. Expert Vastu consultation from ₹11']].map(([label, key, ph]) => (
                <div key={key}><label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label><input value={(modal as any)[key] || ''} onChange={e => setModal((p: any) => ({ ...p, [key]: e.target.value }))} placeholder={ph} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">CTA Button Text</label><input value={modal.ctaText || ''} onChange={e => setModal((p: any) => ({ ...p, ctaText: e.target.value }))} placeholder="Book Now" className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">CTA Link</label><input value={modal.ctaLink || ''} onChange={e => setModal((p: any) => ({ ...p, ctaLink: e.target.value }))} placeholder="/book-appointment" className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={modal.isActive} onChange={e => setModal((p: any) => ({ ...p, isActive: e.target.checked }))} className="rounded"/><span className="text-sm">Active</span></label>
                <div><label className="text-xs font-medium text-gray-500 mr-2">Sort Order:</label><input type="number" min="0" value={modal.sortOrder || 0} onChange={e => setModal((p: any) => ({ ...p, sortOrder: +e.target.value }))} className="w-16 px-2 py-1.5 border border-orange-200 rounded-lg text-sm focus:outline-none text-center"/></div>
              </div>
            </div>
            <div className="p-5 border-t border-orange-100 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-60"><Save size={14}/>{saving ? 'Saving…' : 'Save Slide'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
