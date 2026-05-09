'use client';
import { useEffect, useState } from 'react';
import { postsAPI } from '../../../lib/api';
import MobileMediaUpload from '../../../components/admin/MobileMediaUpload';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Save, Heart, MessageCircle, Search, Rss, Play } from 'lucide-react';

const CATS = ['vastu-tip', 'remedy', 'transformation', 'astrology', 'numerology', 'motivation'];
const EMPTY = { caption: '', category: CATS[0], media: [], isActive: true, author: 'Dr. PPS Tomar' };

export default function SocialPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const load = () => {
    setLoading(true);
    postsAPI.getAll({ limit: 50 }).then(r => setPosts(r.data.data || [])).catch(() => toast.error('Failed to load posts')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openNew = () => setModal({ ...EMPTY, media: [] });
  const openEdit = (p: any) => setModal({ ...p, media: p.media || [] });

  const save = async () => {
    if (!modal.caption?.trim()) return toast.error('Caption is required');
    setSaving(true);
    try {
      const data = { ...modal, media: modal.media.filter((m: any) => m.url?.trim()) };
      if (modal._id) { await postsAPI.update(modal._id, data); toast.success('Post updated!'); }
      else { await postsAPI.create(data); toast.success('Post published!'); }
      load(); setModal(null);
    } catch { toast.error('Failed to save post'); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    try { await postsAPI.delete(id); setPosts(p => p.filter(x => x._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const filtered = posts.filter(p => {
    const q = search.toLowerCase();
    return (!q || p.caption?.toLowerCase().includes(q)) && (catFilter === 'all' || p.category === catFilter);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold text-gray-800">Vastu Feed</h1><p className="text-gray-500 text-sm mt-1">{posts.length} posts · photos & videos supported</p></div>
        <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark"><Plus size={16}/>New Post</button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts…" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary">
          <option value="all">All</option>{CATS.map(c => <option key={c} value={c} className="capitalize">{c.replace('-', ' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400"><div className="text-3xl animate-spin mb-2">🕉️</div>Loading…</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const firstMedia = p.media?.[0];
            const isVideo = firstMedia?.type === 'video';
            return (
              <div key={p._id} className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden group">
                {firstMedia?.url ? (
                  <div className="aspect-square overflow-hidden bg-gray-900 relative">
                    {isVideo ? (
                      <>
                        <video src={firstMedia.url} className="w-full h-full object-cover" playsInline muted preload="metadata"/>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40"><div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center"><Play size={16} className="text-gray-800 ml-0.5"/></div></div>
                        <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">VIDEO</span>
                      </>
                    ) : (
                      <img src={firstMedia.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                    )}
                    {p.media.length > 1 && <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">+{p.media.length - 1}</span>}
                  </div>
                ) : (
                  <div className="aspect-square bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center"><Rss size={32} className="text-orange-200"/></div>
                )}
                <div className="p-4">
                  <span className="inline-block text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-semibold capitalize mb-2">{p.category?.replace('-', ' ')}</span>
                  <p className="text-sm text-gray-800 line-clamp-3 leading-relaxed">{p.caption}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Heart size={11}/>{p.likes || 0}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={11}/>{p.commentCount || 0}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-orange-50 text-primary"><Edit2 size={14}/></button>
                      <button onClick={() => del(p._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14}/></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="col-span-3 text-center py-20 text-gray-400"><Rss size={32} className="mx-auto mb-2 opacity-40"/>No posts found</div>}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between p-5 border-b border-orange-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-display font-bold text-lg text-gray-800">{modal._id ? 'Edit Post' : 'New Post'}</h2>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-5">
              {/* Media Upload - photos + videos */}
              <MobileMediaUpload
                media={modal.media || []}
                onChange={(media: any[]) => setModal((p: any) => ({ ...p, media }))}
                maxItems={3}
              />

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Caption *</label>
                <textarea value={modal.caption || ''} onChange={e => setModal((p: any) => ({ ...p, caption: e.target.value }))} rows={5} placeholder="Share your Vastu tip, remedy, transformation or inspiration…" className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                  <select value={modal.category} onChange={e => setModal((p: any) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary">
                    {CATS.map(c => <option key={c} value={c} className="capitalize">{c.replace('-', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Author</label>
                  <input value={modal.author || 'Dr. PPS Tomar'} onChange={e => setModal((p: any) => ({ ...p, author: e.target.value }))} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-green-50 rounded-xl border border-green-200">
                <input type="checkbox" checked={modal.isActive !== false} onChange={e => setModal((p: any) => ({ ...p, isActive: e.target.checked }))} className="rounded w-4 h-4"/>
                <div><p className="text-sm font-medium text-green-800">Visible on Vastu Feed</p><p className="text-xs text-green-600">Users will see this post on the public feed</p></div>
              </label>
            </div>

            <div className="p-5 border-t border-orange-100 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark disabled:opacity-60"><Save size={14}/>{saving ? 'Publishing…' : 'Publish Post'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
