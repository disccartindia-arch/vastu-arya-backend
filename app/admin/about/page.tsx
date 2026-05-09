'use client';
import { useEffect, useState } from 'react';
import { contentAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
export default function AboutAdminPage() {
  const [data,setData]=useState<any>({hero:{title:'',subtitle:''},bio:{en:'',hi:''},credentials:[],achievements:[]});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  useEffect(()=>{contentAPI.getPage('about').then(r=>{if(r.data.data)setData(r.data.data);}).catch(()=>{}).finally(()=>setLoading(false));}, []);
  const save=async()=>{setSaving(true);try{await contentAPI.update({page:'about',data});toast.success('About page updated!');}catch{toast.error('Failed');}finally{setSaving(false);}};
  if(loading)return<div className="flex items-center justify-center h-64"><div className="text-4xl animate-spin">🕉️</div></div>;
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between"><div><h1 className="font-display text-2xl font-bold text-gray-800">About Page</h1></div><button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-60"><Save size={14}/>{saving?'Saving…':'Save'}</button></div>
      {[{title:'Hero Section',fields:[{label:'Hero Title',path:'hero.title',type:'text'},{label:'Hero Subtitle',path:'hero.subtitle',type:'textarea'}]},{title:'Biography',fields:[{label:'Biography (EN)',path:'bio.en',type:'textarea'},{label:'Biography (हिंदी)',path:'bio.hi',type:'textarea'}]}].map(section=>(
        <div key={section.title} className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">{section.title}</h2>
          {section.fields.map(f=>{const val=f.path.split('.').reduce((o:any,k)=>o?.[k]??'',data);const update=(v:string)=>{setData((p:any)=>{const r={...p};const keys=f.path.split('.');let o=r;keys.slice(0,-1).forEach((k:string)=>{o[k]=o[k]||{};o=o[k];});o[keys[keys.length-1]]=v;return r;});};return(<div key={f.path}><label className="block text-xs font-medium text-gray-500 mb-1.5">{f.label}</label>{f.type==='textarea'?<textarea value={val} onChange={e=>update(e.target.value)} rows={4} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary"/>:<input value={val} onChange={e=>update(e.target.value)} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/>}</div>);})}
        </div>
      ))}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        <strong>Tip:</strong> For full About page customisation including credentials and stats, use the <strong>Website Editor</strong> which has more advanced controls.
      </div>
    </div>
  );
}
