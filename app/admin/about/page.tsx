'use client';
import { useEffect, useState } from 'react';
import { contentAPI } from '../../../lib/api';
import MobileImageUpload from '../../../components/admin/MobileImageUpload';
import toast from 'react-hot-toast';
import { Save, Plus, X } from 'lucide-react';

export default function AboutAdminPage() {
  const [data, setData] = useState<any>({ hero: { title: 'About Dr. PPS Tomar', subtitle: 'IVAF Certified Vastu Expert' }, bio: { en: '', hi: '' }, photo: '', credentials: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCred, setNewCred] = useState('');

  useEffect(() => {
    contentAPI.getPage('about').then(r => { if (r.data.data) setData(r.data.data); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try { await contentAPI.update({ page: 'about', data }); toast.success('About page updated!'); }
    catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const f = (path: string, val: any) => setData((prev: any) => {
    const r = { ...prev }; const keys = path.split('.'); let o: any = r;
    keys.slice(0, -1).forEach((k: string) => { o[k] = { ...o[k] }; o = o[k]; });
    o[keys[keys.length - 1]] = val; return r;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-4xl animate-spin">🕉️</div></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold text-gray-800">About Page</h1><p className="text-gray-500 text-sm mt-1">Edit the About section content</p></div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-60"><Save size={14}/>{saving ? 'Saving…' : 'Save Changes'}</button>
      </div>

      {/* Doctor's Photo */}
      <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">Doctor Photo</h2>
        <div className="max-w-xs">
          <MobileImageUpload value={data.photo || ''} onChange={(url: string) => f('photo', url)} label="Profile Photo of Dr. PPS Tomar" height="h-52"/>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-800">Hero Section</h2>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Page Title</label><input value={data.hero?.title || ''} onChange={e => f('hero.title', e.target.value)} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Subtitle</label><input value={data.hero?.subtitle || ''} onChange={e => f('hero.subtitle', e.target.value)} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
      </div>

      {/* Biography */}
      <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-800">Biography</h2>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Biography (English)</label><textarea value={data.bio?.en || ''} onChange={e => f('bio.en', e.target.value)} rows={6} placeholder="Write Dr. PPS Tomar's biography in English…" className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary"/></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Biography (हिंदी)</label><textarea value={data.bio?.hi || ''} onChange={e => f('bio.hi', e.target.value)} rows={6} placeholder="हिंदी में जीवनी लिखें…" className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary"/></div>
      </div>

      {/* Credentials */}
      <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">Credentials & Awards</h2>
        <div className="space-y-2 mb-3">
          {(data.credentials || []).map((c: string, i: number) => (
            <div key={i} className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-xl">
              <span className="flex-1 text-sm text-gray-700">🏆 {c}</span>
              <button onClick={() => f('credentials', data.credentials.filter((_: any, idx: number) => idx !== i))} className="text-red-400 hover:text-red-600"><X size={14}/></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newCred} onChange={e => setNewCred(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newCred.trim()) { f('credentials', [...(data.credentials || []), newCred.trim()]); setNewCred(''); }}} placeholder="e.g. IVAF Certified Expert, USA" className="flex-1 px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/>
          <button onClick={() => { if (newCred.trim()) { f('credentials', [...(data.credentials || []), newCred.trim()]); setNewCred(''); }}} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium"><Plus size={14}/></button>
        </div>
      </div>
    </div>
  );
}
