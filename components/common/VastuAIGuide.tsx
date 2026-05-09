'use client';
import { useState } from 'react';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import { aiAPI } from '../../lib/api';
import Link from 'next/link';

const CHIPS = ['Financial problems','Relationship issues','Health problems','Career obstacles','Sleep disturbances','Family conflicts','Business losses'];

export default function VastuAIGuide() {
  const [open, setOpen] = useState(false);
  const [concern, setConcern] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAsk = async () => {
    if (concern.trim().length < 5) return;
    setLoading(true); setResult(null);
    try {
      const r = await aiAPI.vastuAnalysis({ concern: concern.trim() });
      if (r?.data?.success) setResult(r.data.data);
    } catch { setResult(null); } finally { setLoading(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} title="Ask AI Vastu Guide"
        style={{ position:'fixed', bottom:'148px', right:'20px', zIndex:998, background:'linear-gradient(135deg,#FF6B00,#FF9933)', boxShadow:'0 4px 20px rgba(255,107,0,0.5)', border:'none', borderRadius:'999px', height:'48px', padding:'0 16px 0 12px', display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', color:'#fff', fontWeight:700, fontSize:'14px' }}>
        <Sparkles size={17} /><span>Ask AI</span>
      </button>
      {open && <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.5)' }} />}
      <div style={{ position:'fixed', bottom:0, right:0, zIndex:1001, width:'100%', maxWidth:'420px', maxHeight:'88vh', background:'#fff', borderRadius:'24px 24px 0 0', boxShadow:'0 -8px 40px rgba(0,0,0,0.15)', display:'flex', flexDirection:'column', transform:open?'translateY(0)':'translateY(100%)', transition:'transform 0.3s cubic-bezier(0.32,0.72,0,1)' }}>
        <div style={{ background:'linear-gradient(135deg,#FF6B00,#FF9933)', borderRadius:'24px 24px 0 0', padding:'16px 20px', display:'flex', alignItems:'center', gap:'12px', flexShrink:0 }}>
          <div style={{ width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}><Sparkles size={18} color="#fff" /></div>
          <div style={{ flex:1 }}><p style={{ color:'#fff', fontWeight:700, fontSize:'14px', margin:0 }}>Vastu AI Guide</p><p style={{ color:'rgba(255,255,255,0.8)', fontSize:'12px', margin:0 }}>Describe your concern</p></div>
          <button onClick={() => setOpen(false)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><X size={15} color="#fff" /></button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
          {!result ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                {CHIPS.map(c=><button key={c} onClick={()=>setConcern(p=>p?`${p}, ${c}`:c)} style={{ fontSize:'12px', padding:'6px 12px', borderRadius:'999px', border:`1px solid ${concern.includes(c)?'#FF6B00':'#FED7AA'}`, background:concern.includes(c)?'#FF6B00':'#fff', color:concern.includes(c)?'#fff':'#4B5563', cursor:'pointer' }}>{c}</button>)}
              </div>
              <textarea value={concern} onChange={e=>setConcern(e.target.value)} rows={3} placeholder="Describe your Vastu concern..." style={{ width:'100%', boxSizing:'border-box', padding:'12px 16px', border:'1.5px solid #FED7AA', borderRadius:'12px', fontSize:'14px', outline:'none', resize:'none', fontFamily:'inherit' }} />
              <button onClick={handleAsk} disabled={loading||concern.trim().length<5} style={{ padding:'14px', borderRadius:'12px', border:'none', background:concern.trim().length<5?'#E5E7EB':'linear-gradient(135deg,#FF6B00,#FF9933)', color:concern.trim().length<5?'#9CA3AF':'#fff', fontWeight:700, fontSize:'14px', cursor:concern.trim().length<5?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                {loading?<><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/>Analysing…</>:<><Send size={14}/>Get Vastu Guidance</>}
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div style={{ background:'#FFF7ED', borderRadius:'16px', padding:'16px', border:'1px solid #FED7AA' }}>
                <p style={{ color:'#FF6B00', fontWeight:700, fontSize:'13px', marginBottom:'6px' }}>{result.greeting}</p>
                <p style={{ color:'#4B5563', fontSize:'13px', lineHeight:1.6, margin:0 }}>{result.analysis}</p>
              </div>
              {result.remedies?.map((r:any,i:number)=>(
                <div key={i} style={{ display:'flex', gap:'12px', padding:'12px', borderRadius:'16px', border:'1px solid #FED7AA', background:'#fff' }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'bold', fontSize:12, flexShrink:0, background:'linear-gradient(135deg,#FF6B00,#FF9933)' }}>{i+1}</div>
                  <div><p style={{ fontWeight:'bold', color:'#1A0A00', fontSize:13, marginBottom:4 }}>{r.title}</p><p style={{ color:'#4B5563', fontSize:12 }}>✅ {r.action}</p><p style={{ color:'#9CA3AF', fontSize:11, marginTop:4 }}>📍 {r.zone} · 💡 {r.benefit}</p></div>
                </div>
              ))}
              <Link href="/vastu-ai" onClick={()=>setOpen(false)} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'13px', borderRadius:'12px', border:'1.5px solid #FED7AA', color:'#FF6B00', fontWeight:600, fontSize:'13px', textDecoration:'none' }}>
                <Sparkles size={14}/> Full AI Vastu Analysis
              </Link>
              <button onClick={()=>{setResult(null);setConcern('');}} style={{ background:'none', border:'none', color:'#9CA3AF', fontSize:'12px', cursor:'pointer', padding:'4px' }}>Ask something else</button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
