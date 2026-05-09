'use client';
import { useState } from 'react';
import { productGeneratorAPI, productsAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import { Wand2, Save, Loader2, Sparkles } from 'lucide-react';
const CATS=['rudraksha','gemstones','yantras','bracelets','sacred-mala','pyramids','divine-frames','spiritual'];
export default function ProductGeneratorPage() {
  const [input,setInput]=useState('');
  const [category,setCategory]=useState(CATS[0]);
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState<any>(null);
  const [saving,setSaving]=useState(false);
  const generate=async()=>{if(!input.trim())return toast.error('Describe the product');setLoading(true);setResult(null);try{const r=await productGeneratorAPI.generate({input:input.trim(),category});setResult(r.data.data);}catch(e:any){toast.error(e?.response?.data?.message||'Generation failed. Check AI settings.');}finally{setLoading(false);}};
  const saveProduct=async()=>{if(!result)return;setSaving(true);try{await productsAPI.create({...result,isActive:true});toast.success('Product saved to store!');setResult(null);setInput('');}catch{toast.error('Save failed');}finally{setSaving(false);}};
  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="font-display text-2xl font-bold text-gray-800">AI Product Generator</h1><p className="text-gray-500 text-sm mt-1">Describe a product and AI will write the full listing</p></div>
      <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label><select value={category} onChange={e=>setCategory(e.target.value)} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary">{CATS.map(c=><option key={c} value={c} className="capitalize">{c}</option>)}</select></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Product Description *</label><textarea value={input} onChange={e=>setInput(e.target.value)} rows={5} placeholder="e.g. 5 Mukhi Rudraksha from Nepal, premium quality, for mental peace and concentration. Include benefits for students and professionals…" className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary"/></div>
        <button onClick={generate} disabled={loading||!input.trim()} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white disabled:opacity-50" style={{background:'linear-gradient(135deg,#FF6B00,#FF9933)'}}>
          {loading?<><Loader2 size={18} className="animate-spin"/>Generating with AI…</>:<><Wand2 size={18}/>Generate Product Listing</>}
        </button>
      </div>
      {result&&(
        <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-display font-bold text-lg text-gray-800 flex items-center gap-2"><Sparkles size={18} className="text-primary"/>Generated Product</h2><button onClick={saveProduct} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-60"><Save size={14}/>{saving?'Saving…':'Save to Store'}</button></div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div><span className="text-xs text-gray-400 block mb-1">Name (EN)</span><p className="font-semibold text-gray-800">{result.name?.en}</p></div>
            {result.name?.hi&&<div><span className="text-xs text-gray-400 block mb-1">Name (HI)</span><p className="font-semibold text-gray-800">{result.name.hi}</p></div>}
            <div><span className="text-xs text-gray-400 block mb-1">Price</span><p className="font-semibold text-primary">₹{result.offerPrice} <span className="line-through text-gray-400 font-normal">₹{result.price}</span></p></div>
            <div><span className="text-xs text-gray-400 block mb-1">Category</span><p className="capitalize text-gray-700">{result.category}</p></div>
          </div>
          {result.description?.en&&<div><span className="text-xs text-gray-400 block mb-1">Description</span><p className="text-sm text-gray-700 leading-relaxed">{result.description.en}</p></div>}
          {result.benefits?.length>0&&<div><span className="text-xs text-gray-400 block mb-2">Benefits</span><ul className="space-y-1">{result.benefits.map((b:string,i:number)=><li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-green-500 mt-0.5">✓</span>{b}</li>)}</ul></div>}
        </div>
      )}
    </div>
  );
}
