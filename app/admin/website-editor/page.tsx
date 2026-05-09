'use client';
import { useEffect, useState } from 'react';
import { homepageSettingsAPI, configAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import { Save, Plus, X, Globe, Phone, Sparkles, BarChart2, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';

type Tab = 'brand' | 'hero' | 'stats' | 'background';

const DEFAULTS = {
  brandName:'Vastu Arya',brandSubtitle:'IVAF Certified',brandFontSize:'18',
  contactPhone:'+91-7000343804',contactEmail:'contact@vastuarya.com',
  contactAddress:'New Delhi, India',contactWhatsapp:'917000343804',
  heroHeading:'Transform Your Space, Transform Your Life',
  heroSubheading:"India's Premier Vastu Shastra & Astrology Platform by Dr. PPS Tomar",
  cta1Text:'Book Appointment @ ₹11',cta1Link:'/book-appointment',
  cta2Text:'Explore Vastu Store',cta2Link:'/vastu-store',
  servicesButtonText:'View All 100+ Services',
  trustBadges:[{label:'IVAF Awarded',order:0},{label:'73,000+ Consultations',order:1},{label:'New Delhi Recognized',order:2}],
  stats:[{value:'73,000+',label:'Happy Clients',order:0},{value:'15+',label:'Years Experience',order:1},{value:'100+',label:'Services',order:2},{value:'50+',label:'Cities Served',order:3}],
};
const BG_DEFAULTS={bg_animations_enabled:true,bg_particles_enabled:true,bg_gold_intensity:0.6,bg_animation_speed:1.0,bg_particle_opacity:0.4,bg_star_density:80};

function F({label,value,onChange,placeholder='',type='text'}:any){return(<div><label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label><input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/></div>);}

export default function WebsiteEditorPage() {
  const [tab,setTab]=useState<Tab>('brand');
  const [s,setS]=useState<any>(DEFAULTS);
  const [bg,setBg]=useState<any>(BG_DEFAULTS);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [newBadge,setNewBadge]=useState('');
  const [newStat,setNewStat]=useState({value:'',label:''});
  const upd=(k:string,v:any)=>setS((p:any)=>({...p,[k]:v}));

  useEffect(()=>{
    Promise.all([
      homepageSettingsAPI.get().catch(()=>({data:{data:DEFAULTS}})),
      configAPI.get().catch(()=>({data:{data:BG_DEFAULTS}})),
    ]).then(([sr,cr])=>{
      setS({...DEFAULTS,...(sr.data.data||{})});
      setBg({...BG_DEFAULTS,...(cr.data.data||{})});
    }).finally(()=>setLoading(false));
  },[]);

  const saveAll=async()=>{
    setSaving(true);
    try{
      await Promise.all([homepageSettingsAPI.update(s),configAPI.update(bg)]);
      toast.success('Website settings saved!');
    }catch{toast.error('Save failed. Please try again.');}
    finally{setSaving(false);}
  };

  const addBadge=()=>{if(!newBadge.trim())return;upd('trustBadges',[...(s.trustBadges||[]),{label:newBadge.trim(),order:(s.trustBadges||[]).length}]);setNewBadge('');};
  const removeBadge=(i:number)=>upd('trustBadges',(s.trustBadges||[]).filter((_:any,idx:number)=>idx!==i));
  const moveBadge=(i:number,d:-1|1)=>{const arr=[...(s.trustBadges||[])];const j=i+d;if(j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];upd('trustBadges',arr.map((b:any,idx:number)=>({...b,order:idx})));};

  const addStat=()=>{if(!newStat.value||!newStat.label)return;upd('stats',[...(s.stats||[]),{...newStat,order:(s.stats||[]).length}]);setNewStat({value:'',label:''}); };
  const removeStat=(i:number)=>upd('stats',(s.stats||[]).filter((_:any,idx:number)=>idx!==i));
  const editStat=(i:number,k:string,v:string)=>{const a=[...(s.stats||[])];a[i]={...a[i],[k]:v};upd('stats',a);};
  const moveStat=(i:number,d:-1|1)=>{const a=[...(s.stats||[])];const j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];upd('stats',a.map((x:any,idx:number)=>({...x,order:idx})));};

  if(loading)return(<div className="flex items-center justify-center h-64"><div className="text-center"><div className="text-4xl animate-spin mb-3">🕉️</div><p className="text-gray-400 text-sm">Loading website settings…</p></div></div>);

  const tabs=[{id:'brand',label:'Brand & Contact',icon:Globe},{id:'hero',label:'Hero Section',icon:Sparkles},{id:'stats',label:'Stats & Badges',icon:BarChart2},{id:'background',label:'Background FX',icon:null}];

  return(
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold text-gray-800">Website Editor</h1><p className="text-gray-500 text-sm mt-1">Edit homepage content, contact info and visual effects</p></div>
        <button onClick={saveAll} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark disabled:opacity-60 shadow-orange"><Save size={14}/>{saving?'Saving…':'Save All Changes'}</button>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {tabs.map(t=>(<button key={t.id} onClick={()=>setTab(t.id as Tab)} className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${tab===t.id?'bg-white text-primary shadow-sm':'text-gray-500 hover:text-gray-700'}`}>{t.label}</button>))}
      </div>

      {tab==='brand'&&(<div className="space-y-5">
        <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">Brand Identity</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <F label="Brand Name" value={s.brandName} onChange={(v:string)=>upd('brandName',v)} placeholder="Vastu Arya"/>
            <F label="Brand Subtitle" value={s.brandSubtitle} onChange={(v:string)=>upd('brandSubtitle',v)} placeholder="IVAF Certified"/>
          </div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Brand Font Size: <strong>{s.brandFontSize||18}px</strong></label><input type="range" min="14" max="32" value={s.brandFontSize||18} onChange={e=>upd('brandFontSize',e.target.value)} className="w-full accent-orange-500"/></div>
        </div>
        <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Phone size={16}/>Contact Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <F label="Phone Number" value={s.contactPhone} onChange={(v:string)=>upd('contactPhone',v)} placeholder="+91-7000343804"/>
            <F label="Email Address" value={s.contactEmail} onChange={(v:string)=>upd('contactEmail',v)} placeholder="contact@vastuarya.com"/>
            <F label="WhatsApp (with country code)" value={s.contactWhatsapp} onChange={(v:string)=>upd('contactWhatsapp',v)} placeholder="917000343804"/>
            <F label="Address" value={s.contactAddress} onChange={(v:string)=>upd('contactAddress',v)} placeholder="New Delhi, India"/>
          </div>
        </div>
      </div>)}

      {tab==='hero'&&(<div className="space-y-5">
        <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">Hero Heading</h2>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Main Heading <span className="text-gray-400">(comma splits into two lines — after comma = orange gradient)</span></label><textarea value={s.heroHeading||''} onChange={e=>upd('heroHeading',e.target.value)} rows={2} placeholder="Transform Your Space, Transform Your Life" className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary"/></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Subheading</label><textarea value={s.heroSubheading||''} onChange={e=>upd('heroSubheading',e.target.value)} rows={2} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary"/></div>
        </div>
        <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">CTA Buttons</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <F label="Button 1 Text (orange)" value={s.cta1Text} onChange={(v:string)=>upd('cta1Text',v)} placeholder="Book Appointment @ ₹11"/>
            <F label="Button 1 Link" value={s.cta1Link} onChange={(v:string)=>upd('cta1Link',v)} placeholder="/book-appointment"/>
            <F label="Button 2 Text (outline)" value={s.cta2Text} onChange={(v:string)=>upd('cta2Text',v)} placeholder="Explore Vastu Store"/>
            <F label="Button 2 Link" value={s.cta2Link} onChange={(v:string)=>upd('cta2Link',v)} placeholder="/vastu-store"/>
          </div>
          <div className="pt-2 border-t border-orange-50"><F label="Services Button Text" value={s.servicesButtonText} onChange={(v:string)=>upd('servicesButtonText',v)} placeholder="View All 100+ Services"/></div>
        </div>
        <div className="bg-gray-900 rounded-2xl p-5 text-white">
          <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wide">Live Preview</p>
          <div className="text-xl font-bold mb-2">{(s.heroHeading||'').split(',')[0]?.trim()},<span className="text-orange-400"> {(s.heroHeading||'').split(',').slice(1).join(',').trim()}</span></div>
          <p className="text-gray-400 text-xs mb-4">{s.heroSubheading}</p>
          <div className="flex gap-2"><span className="px-3 py-1.5 bg-orange-500 rounded-lg text-xs font-semibold">{s.cta1Text}</span><span className="px-3 py-1.5 border border-orange-400 rounded-lg text-xs text-orange-300">{s.cta2Text}</span></div>
        </div>
      </div>)}

      {tab==='stats'&&(<div className="space-y-5">
        <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Trust Badges <span className="text-xs font-normal text-gray-400">(below hero heading)</span></h2>
          <div className="space-y-2 mb-4">
            {(s.trustBadges||[]).map((b:any,i:number)=>(<div key={i} className="flex items-center gap-2">
              <span className="flex-1 bg-orange-50 px-3 py-2.5 rounded-xl text-sm text-gray-700 border border-orange-100">{b.label}</span>
              <div className="flex gap-1">
                <button onClick={()=>moveBadge(i,-1)} disabled={i===0} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ArrowUp size={13}/></button>
                <button onClick={()=>moveBadge(i,1)} disabled={i===(s.trustBadges||[]).length-1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ArrowDown size={13}/></button>
                <button onClick={()=>removeBadge(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><X size={13}/></button>
              </div>
            </div>))}
          </div>
          <div className="flex gap-2"><input value={newBadge} onChange={e=>setNewBadge(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addBadge()} placeholder="e.g. IVAF Awarded" className="flex-1 px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/><button onClick={addBadge} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium"><Plus size={14}/></button></div>
        </div>
        <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Statistics</h2>
          <div className="space-y-3 mb-4">
            {(s.stats||[]).map((st:any,i:number)=>(<div key={i} className="flex items-center gap-2">
              <input value={st.value} onChange={e=>editStat(i,'value',e.target.value)} className="w-28 px-3 py-2 border border-orange-200 rounded-xl text-sm font-bold text-primary focus:outline-none focus:border-primary"/>
              <input value={st.label} onChange={e=>editStat(i,'label',e.target.value)} className="flex-1 px-3 py-2 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/>
              <div className="flex gap-1">
                <button onClick={()=>moveStat(i,-1)} disabled={i===0} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ArrowUp size={13}/></button>
                <button onClick={()=>moveStat(i,1)} disabled={i===(s.stats||[]).length-1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ArrowDown size={13}/></button>
                <button onClick={()=>removeStat(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><X size={13}/></button>
              </div>
            </div>))}
          </div>
          <div className="flex gap-2">
            <input value={newStat.value} onChange={e=>setNewStat(p=>({...p,value:e.target.value}))} placeholder="73,000+" className="w-28 px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/>
            <input value={newStat.label} onChange={e=>setNewStat(p=>({...p,label:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addStat()} placeholder="Label" className="flex-1 px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"/>
            <button onClick={addStat} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium"><Plus size={14}/></button>
          </div>
          <div className="mt-4 pt-4 border-t border-orange-50">
            <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wide">Preview</p>
            <div className="grid grid-cols-4 gap-2">{(s.stats||[]).map((st:any,i:number)=>(<div key={i} className="text-center bg-orange-500 rounded-xl p-3"><div className="text-white font-bold text-base">{st.value}</div><div className="text-orange-100 text-xs">{st.label}</div></div>))}</div>
          </div>
        </div>
      </div>)}

      {tab==='background'&&(<div className="space-y-5">
        <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-5">
          <h2 className="font-semibold text-gray-800">Background Animation Settings</h2>
          <p className="text-xs text-gray-400">Controls the luxury gold particles and mandala animations on the homepage.</p>
          {[{k:'bg_animations_enabled',l:'Enable All Animations',d:'Master switch for all background effects'},{k:'bg_particles_enabled',l:'Enable Gold Particles',d:'Floating gold dust particles overlay'}].map(({k,l,d})=>(<div key={k} className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-100">
            <div><p className="font-medium text-sm text-gray-800">{l}</p><p className="text-xs text-gray-400">{d}</p></div>
            <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={bg[k]} onChange={e=>setBg((p:any)=>({...p,[k]:e.target.checked}))} className="sr-only peer"/><div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div></label>
          </div>))}
          {[{k:'bg_gold_intensity',l:'Gold Intensity',min:0,max:1,step:0.1,fmt:(v:number)=>`${Math.round(v*100)}%`},{k:'bg_animation_speed',l:'Animation Speed',min:0.1,max:3,step:0.1,fmt:(v:number)=>`${v.toFixed(1)}x`},{k:'bg_particle_opacity',l:'Particle Opacity',min:0,max:1,step:0.05,fmt:(v:number)=>`${Math.round(v*100)}%`},{k:'bg_star_density',l:'Star Density',min:20,max:200,step:10,fmt:(v:number)=>`${v} stars`}].map(({k,l,min,max,step,fmt})=>(<div key={k}>
            <div className="flex justify-between mb-1.5"><label className="text-xs font-medium text-gray-500">{l}</label><span className="text-xs font-semibold text-primary">{fmt(Number(bg[k]??BG_DEFAULTS[k as keyof typeof BG_DEFAULTS]))}</span></div>
            <input type="range" min={min} max={max} step={step} value={bg[k]??BG_DEFAULTS[k as keyof typeof BG_DEFAULTS]} onChange={e=>setBg((p:any)=>({...p,[k]:parseFloat(e.target.value)}))} className="w-full accent-orange-500"/>
          </div>))}
          <button onClick={()=>setBg(BG_DEFAULTS)} className="flex items-center gap-2 text-xs text-gray-400 hover:text-primary"><RefreshCw size={12}/>Reset to defaults</button>
        </div>
      </div>)}

      <div className="sticky bottom-4 flex justify-end pt-2">
        <button onClick={saveAll} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-orange hover:bg-primary-dark disabled:opacity-60"><Save size={16}/>{saving?'Saving…':'Save All Changes'}</button>
      </div>
    </div>
  );
}
