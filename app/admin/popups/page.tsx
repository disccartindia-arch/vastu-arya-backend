'use client';
import { useEffect, useState } from 'react';
import { settingsAPI } from '../../../lib/api';
import MobileImageUpload from '../../../components/admin/MobileImageUpload';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Save, MessageSquare, ToggleLeft, ToggleRight } from 'lucide-react';

const TYPES = ['appointment', 'discount', 'announcement', 'newsletter'];
const EMPTY = { title: '', content: '', image: '', ctaText: 'Book Now', ctaLink: '/book-appointment', delay: 3, isActive: true, type: 'appointment' };

export default function PopupsPage() {
  const [popups, setPopups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); settingsAPI.getPopups().then(r => setPopups(r.data.data || [])).catch(() => toast.error('Failed')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!modal.title) return toast.error('Title is required');
    setSaving(true);
    try {
      if (modal._id) { await settingsAPI.updatePopup(modal._id, modal); toast.success('Popup updated!'); }
      else { await settingsAPI.createPopup(modal); toast.success('Popup created!'); }
      load(); setModal(null);
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this popup?')) return;
    try { await settingsAPI.deletePopup(id); setPopups(p => p.filter(x => x._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const toggle = async (p: any) => {
    try { await settingsAPI.updatePopup(p._id, { isActive: !p.isActive }); setPopups(prev => prev.map(x => x._id === p._id ? { ...x, isActive: !x.isActive } : x)); }
    catch { toast.error('Update failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold text-gray-800">Popups</h1><p className="text-gray-500 text-sm mt-1">Manage site-wide popup banners</p></div>
        <button onClick={() => setModal({ ...EMPTY })} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark"><Plus size={16}/>New Popup</button>
      </div>

      {loading ? <div className="text-center py-20 text-gray-400"><div className="text-3xl animate-spin mb-2">🕉️</div>Loading…</div> : (
        <div className="grid gap-4">
          {popups.map(p => (
            <div key={p._id} className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm flex items-start gap-4">
              {p.image ? <img src={p.image} alt={p.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0"/> : <div className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0"><MessageSquare size={24} className="text-orange-300"/></div>}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">{p.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.content}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">{p.type}</span>
                  <span className="text-xs text-gray-400">⏱ {p.delay}s delay</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.isActive ? 'Active' : 'Hidden'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggle(p)} className="p-2 rounded-lg hover:bg-gray-50">{p.isActive ? <ToggleRight size={20} className="text-green-500"/> : <ToggleLeft size={20} className="text-gray-400"/>}</button>
                <button onClick={() => setModal({ ...p })} className="p-2 rounded-lg hover:bg-orange-50 text-primary"><Edit2 size={16}/></button>
                <button onClick={() => del(p._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
          {popups.length === 0 && <div className="text-center py-20 bg-white rounded-2xl border border-orange-100 text-gray-400"><MessageSquare size={32} className="mx-auto mb-2 opacity-40"/>No popups yet</div>}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between p-5 border-b border-orange-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-display font-bold text-lg">{modal._id ? 'Edit Popup' : 'New Popup'}</h2>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              <MobileImageUpload
                value={modal.image || ''}
                onChange={(url: string) => setModal((p: any) => ({ ...p, image: url }))}
                label="Popup Image (optional)"
                height="h-36"
              />
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Title *</label><input value={modal.title || ''} onChange={e => setModal((p: any) => ({ ...p, title: e.target.value }))} placeholder="e.g. Special Offer!" className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Content</label><textarea value={modal.content || ''} onChange={e => setModal((p: any) => ({ ...p, content: e.target.value }))} rows={3} placeholder="Popup message text…" className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">CTA Button</label><input value={modal.ctaText || ''} onChange={e => setModal((p: any) => ({ ...p, ctaText: e.target.value }))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">CTA Link</label><input value={modal.ctaLink || ''} onChange={e => setModal((p: any) => ({ ...p, ctaLink: e.target.value }))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label><select value={modal.type} onChange={e => setModal((p: any) => ({ ...p, type: e.target.value }))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary">{TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Delay (seconds)</label><input type="number" min="0" max="30" value={modal.delay || 3} onChange={e => setModal((p: any) => ({ ...p, delay: +e.target.value }))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-green-50 rounded-xl border border-green-200">
                <input type="checkbox" checked={modal.isActive} onChange={e => setModal((p: any) => ({ ...p, isActive: e.target.checked }))} className="rounded w-4 h-4"/>
                <div><p className="text-sm font-medium text-green-800">Show on site</p><p className="text-xs text-green-600">Users will see this popup when visiting</p></div>
              </label>
            </div>
            <div className="p-5 border-t border-orange-100 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-60"><Save size={14}/>{saving ? 'Saving…' : 'Save Popup'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
