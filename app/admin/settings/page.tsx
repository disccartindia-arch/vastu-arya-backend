'use client';
import { useEffect, useState } from 'react';
import { settingsAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import { Save, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [s, setS] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const f = (path:string, val:any) => setS((prev:any)=>{const r={...prev};const keys=path.split('.');let o=r;keys.slice(0,-1).forEach((k:string)=>{o[k]=o[k]||{};o=o[k];});o[keys[keys.length-1]]=val;return r;});
  useEffect(()=>{settingsAPI.get().then(r=>setS(r.data.data||{})).catch(()=>{}).finally(()=>setLoading(false));}, []);
  const save=async()=>{setSaving(true);try{await settingsAPI.update(s);toast.success('Settings saved!');}catch{toast.error('Failed');}finally{setSaving(false);}};
  if(loading)return<div className="flex items-center justify-center h-64"><div className="text-4xl animate-spin">🕉️</div></div>;
  const I=({label,path,type='text',placeholder=''}:{label:string,path:string,type?:string,placeholder?:string})=>(<div><label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label><input type={type} value={path.split('.').reduce((o:any,k)=>o?.[k],s)||''} onChange={e=>f(path,e.target.value)} placeholder={placeholder} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>);
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between"><div><h1 className="font-display text-2xl font-bold text-gray-800">Site Settings</h1><p className="text-gray-500 text-sm mt-1">Global configuration for Vastu Arya</p></div><button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark disabled:opacity-60"><Save size={14}/>{saving?'Saving…':'Save All'}</button></div>
      {[{title:'General',fields:[['Site Name','siteName'],['Tagline (EN)','tagline.en'],['Tagline (HI)','tagline.hi'],['Logo URL','logo']]},{title:'Contact',fields:[['Phone','phone'],['WhatsApp Number','whatsappNumber'],['Email','email'],['Address','address']]},{title:'Social Links',fields:[['Instagram URL','socialLinks.instagram'],['Facebook URL','socialLinks.facebook'],['YouTube URL','socialLinks.youtube']]},{title:'SEO Defaults',fields:[['Default Title','seo.defaultTitle'],['Default Description','seo.defaultDescription'],['OG Image URL','seo.ogImage']]}].map(section=>(
        <div key={section.title} className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">{section.title}</h2>
          <div className="grid sm:grid-cols-2 gap-4">{section.fields.map(([label,path])=><I key={path} label={label} path={path}/>)}</div>
        </div>
      ))}
      <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">Localization</h2>
        <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={s.enableHindi||false} onChange={e=>f('enableHindi',e.target.checked)} className="rounded w-4 h-4"/><div><p className="text-sm font-medium text-gray-800">Enable Hindi Language</p><p className="text-xs text-gray-400">Shows language switcher in navbar</p></div></label>
      </div>
    </div>
  );
}
