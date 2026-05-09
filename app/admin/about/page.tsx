'use client';
import { useEffect, useState } from 'react';
import { contentAPI } from '../../../lib/api';
import MobileImageUpload from '../../../components/admin/MobileImageUpload';
import toast from 'react-hot-toast';
import { Save, Plus, X, User, FileText, Award, BarChart2, Search, Eye } from 'lucide-react';

type Tab = 'profile' | 'bio' | 'credentials' | 'stats' | 'seo';

const DEFAULTS = {
  photo: '',
  doctorName: 'Dr. Pranveer Pratap Singh Tomar',
  designation: 'IVAF Certified Vastu Expert',
  hero: { title: 'About Vastu Arya', subtitle: "India's Premier Vastu & Astrology Platform" },
  bio: {
    en: "Dr. PPS Tomar is one of India's most respected Vastu Shastra experts, holding a prestigious Doctorate degree in Vastu Vadana. Awarded by the International Vedic Astrology Federation (IVAF LLC, USA) and recognized in New Delhi, Dr. PPS Tomar has transformed over 73,000 lives across India and worldwide through authentic Vastu consultations.",
    hi: 'डॉ. PPS तोमर भारत के सबसे सम्मानित वास्तु शास्त्र विशेषज्ञों में से एक हैं। IVAF (USA) द्वारा प्रमाणित और नई दिल्ली में मान्यता प्राप्त, डॉ. PPS तोमर ने 73,000+ जीवन बदले हैं।',
  },
  mission: { en: 'To transform lives through authentic Vastu Shastra and make expert guidance accessible to every Indian household.', hi: 'प्रामाणिक वास्तु शास्त्र के माध्यम से जीवन बदलना।' },
  credentials: [
    'IVAF Certified Expert (International Vedic Astrology Federation, USA)',
    'Vastu Vadana Doctorate Degree',
    'New Delhi Government Recognition & Award',
    'ALLSO Award Winner',
    '73,000+ Clients Transformed',
    '15+ Years of Expert Practice',
  ],
  stats: [
    { value: '73,000+', label: 'Happy Clients', labelHi: 'खुश ग्राहक' },
    { value: '15+', label: 'Years Experience', labelHi: 'साल का अनुभव' },
    { value: '100+', label: 'Services Offered', labelHi: 'सेवाएं' },
    { value: '50+', label: 'Cities Covered', labelHi: 'शहर' },
  ],
  seo: {
    title: 'About Dr. PPS Tomar - IVAF Certified Vastu Expert | Vastu Arya',
    description: 'Meet Dr. PPS Tomar - IVAF Certified Vastu Shastra Expert and Astrologer with 20+ years of experience. 73,000+ clients transformed across India.',
  },
  cta: { title: 'Ready to Transform Your Life?', buttonText: 'Book Appointment @ ₹11' },
  showMission: true,
  showStats: true,
  showCredentials: true,
};

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'profile', label: 'Profile & Photo', icon: User },
  { id: 'bio', label: 'Biography', icon: FileText },
  { id: 'credentials', label: 'Credentials', icon: Award },
  { id: 'stats', label: 'Stats', icon: BarChart2 },
  { id: 'seo', label: 'SEO', icon: Search },
];

function FI({ label, value, onChange, placeholder = '', type = 'text' }: any) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/>
    </div>
  );
}
function TA({ label, value, onChange, placeholder = '', rows = 4 }: any) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary"/>
    </div>
  );
}

export default function AboutAdminPage() {
  const [data, setData] = useState<any>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>('profile');
  const [newCred, setNewCred] = useState('');
  const [newStat, setNewStat] = useState({ value: '', label: '', labelHi: '' });

  useEffect(() => {
    contentAPI.getPage('about')
      .then(r => { if (r.data.data && Object.keys(r.data.data).length > 0) setData({ ...DEFAULTS, ...r.data.data }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const upd = (path: string, val: any) => setData((prev: any) => {
    const r = { ...prev };
    const keys = path.split('.');
    let o: any = r;
    keys.slice(0, -1).forEach((k: string) => { o[k] = { ...o[k] }; o = o[k]; });
    o[keys[keys.length - 1]] = val;
    return r;
  });

  const save = async () => {
    setSaving(true);
    try {
      await contentAPI.update({ page: 'about', data });
      toast.success('About page updated! Changes live on site.');
    } catch { toast.error('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  const addCred = () => {
    if (!newCred.trim()) return;
    upd('credentials', [...(data.credentials || []), newCred.trim()]);
    setNewCred('');
  };

  const removeCred = (i: number) => upd('credentials', (data.credentials || []).filter((_: any, idx: number) => idx !== i));

  const addStat = () => {
    if (!newStat.value || !newStat.label) return;
    upd('stats', [...(data.stats || []), { ...newStat }]);
    setNewStat({ value: '', label: '', labelHi: '' });
  };

  const removeStat = (i: number) => upd('stats', (data.stats || []).filter((_: any, idx: number) => idx !== i));
  const editStat = (i: number, key: string, val: string) => { const a = [...(data.stats || [])]; a[i] = { ...a[i], [key]: val }; upd('stats', a); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-4xl animate-spin">🕉️</div></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold text-gray-800">About Page Editor</h1><p className="text-gray-500 text-sm mt-1">All changes reflect instantly on the public About page</p></div>
        <div className="flex gap-2">
          <a href="/about" target="_blank" className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"><Eye size={14}/>Preview</a>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark disabled:opacity-60 shadow-orange"><Save size={14}/>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${tab === t.id ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={12}/>{t.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE & PHOTO ─── */}
      {tab === 'profile' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-5">Doctor's Profile Photo</h2>
            <div className="max-w-xs">
              <MobileImageUpload value={data.photo || ''} onChange={(url: string) => upd('photo', url)} label="Profile Photo of Dr. PPS Tomar" height="h-56"/>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800">Personal Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <FI label="Doctor's Full Name" value={data.doctorName} onChange={(v:string) => upd('doctorName', v)} placeholder="Dr. Pranveer Pratap Singh Tomar"/>
              <FI label="Designation / Title" value={data.designation} onChange={(v:string) => upd('designation', v)} placeholder="IVAF Certified Vastu Expert"/>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800">Page Hero Section</h2>
            <FI label="Page Title" value={data.hero?.title} onChange={(v:string) => upd('hero.title', v)} placeholder="About Vastu Arya"/>
            <FI label="Page Subtitle" value={data.hero?.subtitle} onChange={(v:string) => upd('hero.subtitle', v)} placeholder="India's Premier Vastu & Astrology Platform"/>
          </div>

          <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800">CTA Section</h2>
            <FI label="CTA Heading" value={data.cta?.title} onChange={(v:string) => upd('cta.title', v)} placeholder="Ready to Transform Your Life?"/>
            <FI label="CTA Button Text" value={data.cta?.buttonText} onChange={(v:string) => upd('cta.buttonText', v)} placeholder="Book Appointment @ ₹11"/>
          </div>
        </div>
      )}

      {/* ── BIOGRAPHY ─── */}
      {tab === 'bio' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800">Biography</h2>
            <TA label="Biography (English) *" value={data.bio?.en} onChange={(v:string) => upd('bio.en', v)} placeholder="Write Dr. PPS Tomar's biography in English…" rows={8}/>
            <TA label="Biography (हिंदी)" value={data.bio?.hi} onChange={(v:string) => upd('bio.hi', v)} placeholder="हिंदी में जीवनी लिखें…" rows={6}/>
          </div>

          <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-gray-800">Mission Statement</h2>
              <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={data.showMission} onChange={e => upd('showMission', e.target.checked)} className="rounded"/> Show on page</label>
            </div>
            <TA label="Mission (English)" value={data.mission?.en} onChange={(v:string) => upd('mission.en', v)} placeholder="Our mission…" rows={3}/>
            <TA label="Mission (हिंदी)" value={data.mission?.hi} onChange={(v:string) => upd('mission.hi', v)} placeholder="हमारा मिशन…" rows={2}/>
          </div>
        </div>
      )}

      {/* ── CREDENTIALS ─── */}
      {tab === 'credentials' && (
        <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-800">Awards & Credentials</h2>
            <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={data.showCredentials} onChange={e => upd('showCredentials', e.target.checked)} className="rounded"/> Show on page</label>
          </div>
          <div className="space-y-2 mb-4">
            {(data.credentials || []).map((c: string, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-orange-50 px-4 py-3 rounded-xl border border-orange-100">
                <span className="text-orange-500 font-bold text-sm flex-shrink-0">🏆</span>
                <span className="flex-1 text-sm text-gray-700">{c}</span>
                <button onClick={() => removeCred(i)} className="text-red-400 hover:text-red-600 flex-shrink-0"><X size={14}/></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newCred} onChange={e => setNewCred(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCred()} placeholder="e.g. IVAF Certified Expert, USA" className="flex-1 px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/>
            <button onClick={addCred} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium flex items-center gap-1"><Plus size={14}/>Add</button>
          </div>
          <p className="text-xs text-gray-400 mt-2">These appear as a list of achievements on the About page</p>
        </div>
      )}

      {/* ── STATS ─── */}
      {tab === 'stats' && (
        <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-800">Statistics / Counters</h2>
            <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={data.showStats} onChange={e => upd('showStats', e.target.checked)} className="rounded"/> Show on page</label>
          </div>
          <div className="space-y-3 mb-4">
            {(data.stats || []).map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <input value={s.value} onChange={e => editStat(i, 'value', e.target.value)} className="w-28 px-3 py-2 border border-orange-200 rounded-xl text-sm font-bold text-primary focus:outline-none focus:border-primary" placeholder="73,000+"/>
                <input value={s.label} onChange={e => editStat(i, 'label', e.target.value)} className="flex-1 px-3 py-2 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="Happy Clients"/>
                <input value={s.labelHi || ''} onChange={e => editStat(i, 'labelHi', e.target.value)} className="flex-1 px-3 py-2 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="खुश ग्राहक"/>
                <button onClick={() => removeStat(i)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 flex-shrink-0"><X size={14}/></button>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <input value={newStat.value} onChange={e => setNewStat(p => ({ ...p, value: e.target.value }))} placeholder="Value (73,000+)" className="px-3 py-2 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/>
              <input value={newStat.label} onChange={e => setNewStat(p => ({ ...p, label: e.target.value }))} placeholder="Label (EN)" className="px-3 py-2 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/>
              <input value={newStat.labelHi} onChange={e => setNewStat(p => ({ ...p, labelHi: e.target.value }))} placeholder="Label (HI)" className="px-3 py-2 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/>
            </div>
            <button onClick={addStat} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"><Plus size={13}/>Add Stat</button>
          </div>

          {/* Preview */}
          <div className="mt-5 pt-5 border-t border-orange-50">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide font-semibold">Preview</p>
            <div className="grid grid-cols-4 gap-3">
              {(data.stats || []).map((s: any, i: number) => (
                <div key={i} className="text-center bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl p-3">
                  <div className="text-white font-bold text-lg leading-tight">{s.value}</div>
                  <div className="text-orange-100 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SEO ─── */}
      {tab === 'seo' && (
        <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">SEO Settings</h2>
          <FI label="SEO Title (shown in browser tab & Google)" value={data.seo?.title} onChange={(v:string) => upd('seo.title', v)} placeholder="About Dr. PPS Tomar - IVAF Certified Vastu Expert | Vastu Arya"/>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">SEO Description (shown in Google search results)</label>
            <textarea value={data.seo?.description || ''} onChange={e => upd('seo.description', e.target.value)} rows={3} placeholder="155-160 character description for Google…" className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary"/>
            <p className="text-xs text-gray-400 mt-1">{(data.seo?.description || '').length}/160 characters</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Google Preview</p>
            <p className="text-blue-600 text-sm font-medium truncate">{data.seo?.title || 'About Page Title'}</p>
            <p className="text-green-600 text-xs mt-0.5">vastuarya.com/about</p>
            <p className="text-gray-600 text-xs mt-1 line-clamp-2">{data.seo?.description || 'SEO description will appear here…'}</p>
          </div>
        </div>
      )}

      {/* Floating save */}
      <div className="sticky bottom-4 flex justify-end">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-orange hover:bg-primary-dark disabled:opacity-60">
          <Save size={16}/>{saving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
