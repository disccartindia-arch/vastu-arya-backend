'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import WhatsAppButton from '../../../components/common/WhatsAppButton';
import AppointmentPopup from '../../../components/common/AppointmentPopup';
import { useUIStore } from '../../../store/uiStore';
import { aiAPI, aiSettingsAPI } from '../../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, CheckCircle, Star, Send, Shield, Calendar, MessageCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_CONCERNS = ['Financial problems','Relationship issues','Health problems','Career obstacles','Sleep disturbances','Family conflicts','Business losses','Child education'];
const ROOM_TYPES = ['Living Room','Bedroom','Kitchen','Home Office','Entire Home','Shop/Office'];
const DIRECTIONS = ['North','South','East','West','North-East','North-West','South-East','South-West'];
const WA = '917000343804';

interface AIResult { greeting: string; analysis: string; remedies: { title: string; action: string; zone: string; benefit: string }[]; note: string; consultationCTA: string; disclaimer?: string; followUp?: string; }

function ResultsModal({ result, concern, ctaText, onClose, onBook }: { result: AIResult; concern: string; ctaText: string; onClose: () => void; onBook: () => void; }) {
  const waMsg = encodeURIComponent(`Namaste Dr. Pranveer ji, I received AI Vastu guidance for "${concern.slice(0,50)}" and would like a personal consultation.`);
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }} className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white rounded-t-3xl px-5 pt-5 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-200"><img src="/logo.jpg" alt="Dr. PPS Tomar" className="w-full h-full object-cover"/></div><div><p className="font-bold text-gray-800 text-sm">Dr. PPS Tomar — IVAF Certified</p><div className="flex items-center gap-0.5">{[...Array(5)].map((_,i)=><Star key={i} size={10} className="fill-yellow-400 text-yellow-400"/>)}</div></div></div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100"><X size={18} className="text-gray-400"/></button>
            </div>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100"><p className="text-primary font-semibold mb-1">{result.greeting}</p><p className="text-gray-600 text-sm leading-relaxed">{result.analysis}</p></div>
            {result.remedies?.length > 0 && (<div><h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><CheckCircle size={18} className="text-green-500"/>Your Personalised Vastu Remedies</h3><div className="space-y-3">{result.remedies.map((r,i)=>(<motion.div key={i} initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{delay:i*0.08}} className="flex gap-3 p-3.5 rounded-2xl bg-white border border-orange-100 shadow-sm"><div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5" style={{background:'linear-gradient(135deg,#FF6B00,#FF9933)'}}>{i+1}</div><div className="flex-1"><p className="font-bold text-gray-800 text-sm mb-1">{r.title}</p><p className="text-gray-600 text-xs mb-1.5">✅ {r.action}</p><div className="flex flex-wrap gap-2 text-xs text-gray-400"><span>📍 {r.zone}</span><span>💡 {r.benefit}</span></div></div></motion.div>))}</div></div>)}
            {result.note && <p className="text-gray-500 text-sm italic px-1 leading-relaxed">{result.note}</p>}
            <div className="rounded-2xl p-4 border" style={{background:'linear-gradient(135deg,#0D0500,#1A0A00)',borderColor:'rgba(212,160,23,0.3)'}}>
              <div className="flex items-center gap-3 mb-3"><div className="w-12 h-12 rounded-full overflow-hidden border-2 flex-shrink-0" style={{borderColor:'rgba(212,160,23,0.5)'}}><img src="/logo.jpg" alt="Dr. PPS Tomar" className="w-full h-full object-cover"/></div><div><p className="font-bold text-white text-sm">Want a Deeper Personal Analysis?</p><p className="text-xs mt-0.5" style={{color:'#D4A017'}}>Dr. PPS Tomar • IVAF Certified • 45,000+ Clients</p></div></div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button onClick={onBook} className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm text-white" style={{background:'linear-gradient(135deg,#FF6B00,#FF9933)'}}><Calendar size={14}/> Book @ ₹11</button>
                <a href={`https://wa.me/${WA}?text=${waMsg}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm text-white bg-[#25D366]"><MessageCircle size={14}/> WhatsApp</a>
              </div>
            </div>
            <button onClick={onClose} className="w-full py-3 rounded-xl border border-orange-200 text-primary font-medium text-sm hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"><Send size={13}/> Analyse Another Concern</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function VastuAIPage() {
  const { setShowAppointmentPopup } = useUIStore();
  const [concerns, setConcerns] = useState<string[]>(DEFAULT_CONCERNS);
  const [ctaText, setCtaText] = useState('Book a Consultation with Dr. PPS Tomar');
  const [concern, setConcern] = useState('');
  const [roomType, setRoomType] = useState('');
  const [direction, setDirection] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);

  useEffect(() => { aiSettingsAPI.getPublic().then((r:any) => { const d=r?.data?.data; if(d?.quickSuggestions?.length) setConcerns(d.quickSuggestions); if(d?.ctaText) setCtaText(d.ctaText); }).catch(()=>{}); }, []);

  const handleAnalyse = async () => {
    if (concern.trim().length < 10) { toast.error('Please describe your concern in at least 10 characters'); return; }
    setLoading(true); setResult(null);
    try {
      const r = await aiAPI.vastuAnalysis({ concern: concern.trim(), roomType, direction });
      if (r?.data?.success) setResult(r.data.data);
      else toast.error(r?.data?.message || 'Analysis failed. Please try again.');
    } catch(e:any) { toast.error(e?.response?.data?.message || 'AI analysis unavailable. Please try again.'); }
    finally { setLoading(false); }
  };

  const addConcern = (c: string) => setConcern(prev => prev ? (prev.includes(c) ? prev : `${prev}, ${c}`) : c);

  return (<><Navbar /><main style={{ background: 'linear-gradient(135deg,#FFFDF7 0%,#FFF8EE 100%)', minHeight: '100vh' }}>
    <section className="py-16 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0D0500,#1A0A00)' }}>
      <div className="absolute inset-0 mandala-bg opacity-10 pointer-events-none"/>
      <div className="relative max-w-3xl mx-auto px-4">
        <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-5 border" style={{background:'rgba(255,107,0,0.15)',borderColor:'rgba(255,107,0,0.3)',color:'#FF9933'}}><Sparkles size={14}/> AI-Powered Instant Vastu Analysis</motion.div>
        <motion.h1 initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">Get Instant Vastu Guidance</motion.h1>
        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2}} className="text-gray-300 text-lg">Describe your concern and receive personalised Vastu remedies in seconds.</motion.p>
      </div>
    </section>
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-orange-100">
        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-2xl border border-orange-100 mb-6">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-200 flex-shrink-0"><img src="/logo.jpg" alt="Dr. PPS Tomar" className="w-full h-full object-cover"/></div>
          <div className="flex-1"><p className="font-bold text-gray-800 text-sm">Dr. Pranveer Pratap Singh Tomar</p><p className="text-xs text-gray-500">IVAF Certified • 15+ Years • 45,000+ Clients</p></div>
          <div className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/><span>Online</span></div>
        </div>
        <div className="mb-4"><p className="text-xs text-gray-400 font-medium mb-2">Common concerns — tap to add:</p><div className="flex flex-wrap gap-2">{concerns.map(c=>(<button key={c} onClick={()=>addConcern(c)} className={`text-xs px-3 py-1.5 rounded-full border transition-all ${concern.includes(c)?'bg-primary text-white border-primary':'border-orange-200 text-gray-600 hover:border-primary hover:text-primary'}`}>{c}</button>))}</div></div>
        <textarea value={concern} onChange={e=>setConcern(e.target.value)} rows={4} placeholder="e.g. We have been facing financial losses for 2 years. Money comes but never stays..." className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:border-primary text-sm resize-none mb-4"/>
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Room Type (optional)</label><select value={roomType} onChange={e=>setRoomType(e.target.value)} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white"><option value="">Select room type</option>{ROOM_TYPES.map(r=><option key={r} value={r}>{r}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Home Facing Direction (optional)</label><select value={direction} onChange={e=>setDirection(e.target.value)} className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white"><option value="">Select direction</option>{DIRECTIONS.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
        </div>
        <button onClick={handleAnalyse} disabled={loading||concern.trim().length<10} className="w-full py-4 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all" style={{background:'linear-gradient(135deg,#FF6B00,#FF9933)',boxShadow:concern.trim().length>=10?'0 8px 24px rgba(255,107,0,0.35)':'none'}}>
          {loading?<><Loader2 size={20} style={{animation:'spin 1s linear infinite'}}/>Analysing your space…</>:<><Sparkles size={20}/>Get My Vastu Analysis</>}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1"><Shield size={11}/> Private & secure • Based on authentic Vastu Shastra</p>
      </motion.div>
    </div>
  </main>
  {result && <ResultsModal result={result} concern={concern} ctaText={ctaText} onClose={()=>setResult(null)} onBook={()=>{setShowAppointmentPopup(true);setResult(null);}}/>}
  <Footer /><AppointmentPopup /><WhatsAppButton />
  <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
  </>);
}
