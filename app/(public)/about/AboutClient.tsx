'use client';
import { useEffect, useState } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import AppointmentPopup from '../../../components/common/AppointmentPopup';
import CartDrawer from '../../../components/common/CartDrawer';
import WhatsAppButton from '../../../components/common/WhatsAppButton';
import { useUIStore } from '../../../store/uiStore';
import { contentAPI } from '../../../lib/api';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const DEFAULTS = {
  photo:'',doctorName:'Dr. Pranveer Pratap Singh Tomar',designation:'IVAF Certified Vastu Expert',
  hero:{title:'About Vastu Arya',subtitle:"India's Premier Vastu & Astrology Platform"},
  bio:{en:"Dr. PPS Tomar is one of India's most respected Vastu Shastra experts. Awarded by the IVAF (USA) and recognized in New Delhi, he has transformed over 73,000 lives.",hi:'डॉ. PPS तोमर भारत के सबसे सम्मानित वास्तु शास्त्र विशेषज्ञों में से एक हैं। IVAF (USA) द्वारा प्रमाणित, उन्होंने 73,000+ जीवन बदले हैं।'},
  mission:{en:'To transform lives through authentic Vastu Shastra and make expert guidance accessible to every Indian household.',hi:'प्रामाणिक वास्तु शास्त्र के माध्यम से जीवन बदलना।'},
  credentials:['IVAF Certified Expert (International Vedic Astrology Federation, USA)','Vastu Vadana Doctorate Degree','New Delhi Government Recognition & Award','ALLSO Award Winner','73,000+ Clients Transformed','15+ Years of Expert Practice'],
  stats:[{value:'73,000+',label:'Happy Clients',labelHi:'खुश ग्राहक'},{value:'15+',label:'Years Experience',labelHi:'साल का अनुभव'},{value:'100+',label:'Services Offered',labelHi:'सेवाएं'},{value:'50+',label:'Cities Covered',labelHi:'शहर'}],
  cta:{title:'Ready to Transform Your Life?',buttonText:'Book Appointment @ ₹11'},
  showMission:true,showStats:true,showCredentials:true,
};

export default function AboutPage() {
  const { lang, setShowAppointmentPopup } = useUIStore();
  const [data, setData] = useState<any>(DEFAULTS);
  useEffect(()=>{contentAPI.getPage('about').then(r=>{if(r.data.data&&Object.keys(r.data.data).length>2)setData({...DEFAULTS,...r.data.data});}).catch(()=>{});}, []);
  const bio = lang==='hi'&&data.bio?.hi ? data.bio.hi : data.bio?.en||DEFAULTS.bio.en;
  const mission = lang==='hi'&&data.mission?.hi ? data.mission.hi : data.mission?.en||DEFAULTS.mission.en;
  return (
    <><Navbar />
    <main>
      <section className="bg-dark-gradient py-20 text-center relative overflow-hidden"><div className="absolute inset-0 mandala-bg opacity-10"/><div className="relative max-w-3xl mx-auto px-4"><div className="text-6xl mb-4">🕉️</div><h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">{lang==='hi'?'वास्तु आर्या के बारे में':(data.hero?.title||DEFAULTS.hero.title)}</h1><p className="text-gray-300 text-lg">{lang==='hi'?'भारत का प्रमुख वास्तु और ज्योतिष प्लेटफॉर्म':(data.hero?.subtitle||DEFAULTS.hero.subtitle)}</p></div></section>
      <section className="py-20 bg-cream"><div className="max-w-5xl mx-auto px-4 sm:px-6"><div className="grid lg:grid-cols-2 gap-12 items-start">
        <div>
          {data.photo?(<div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-orange-100 mb-6"><img src={data.photo} alt={data.doctorName||'Dr. PPS Tomar'} className="w-full object-cover aspect-square"/></div>):(<div className="rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mb-6 aspect-square border-4 border-orange-100"><div className="text-center"><div className="text-8xl mb-3">🕉️</div><p className="text-orange-700 font-semibold text-sm">{data.doctorName||'Dr. PPS Tomar'}</p></div></div>)}
          {data.showStats&&(<div className="grid grid-cols-2 gap-4">{(data.stats||DEFAULTS.stats).map((s:any,i:number)=>(<div key={i} className="bg-white rounded-2xl p-4 text-center border border-orange-100 shadow-sm"><div className="font-display font-bold text-2xl text-primary">{s.value}</div><div className="text-text-light text-xs mt-1">{lang==='hi'?(s.labelHi||s.label):s.label}</div></div>))}</div>)}
        </div>
        <div className="space-y-6">
          <div><span className="font-accent text-primary text-sm tracking-widest uppercase">{lang==='hi'?'विशेषज्ञ से मिलें':'Meet the Expert'}</span><h2 className="font-display text-3xl font-bold text-text-dark mt-2 mb-1">{data.doctorName||DEFAULTS.doctorName}</h2><p className="text-primary font-semibold text-sm">{data.designation||DEFAULTS.designation}</p></div>
          <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-sm"><p className="text-text-mid leading-relaxed text-sm">{bio}</p></div>
          {data.showMission&&mission&&(<div className="bg-orange-50 rounded-2xl p-5 border border-orange-100"><h3 className="font-semibold text-orange-800 mb-2 text-xs uppercase tracking-wide">{lang==='hi'?'हमारा मिशन':'Our Mission'}</h3><p className="text-orange-700 text-sm leading-relaxed italic">"{mission}"</p></div>)}
          {data.showCredentials&&data.credentials?.length>0&&(<div className="space-y-3">{(data.credentials||DEFAULTS.credentials).map((c:string,i:number)=>(<motion.div key={i} initial={{opacity:0,x:20}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:i*0.07}} className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-orange-100 shadow-sm"><CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5"/><p className="text-text-mid text-sm leading-relaxed">{c}</p></motion.div>))}</div>)}
        </div>
      </div></div></section>
      <section className="py-16 bg-saffron-gradient text-center"><h2 className="font-display text-3xl font-bold text-white mb-4">{lang==='hi'?'अपना जीवन बदलने के लिए तैयार हैं?':(data.cta?.title||DEFAULTS.cta.title)}</h2><button onClick={()=>setShowAppointmentPopup(true)} className="bg-white text-primary hover:bg-cream px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg">{lang==='hi'?'₹11 में अपॉइंटमेंट बुक करें':(data.cta?.buttonText||DEFAULTS.cta.buttonText)}</button></section>
    </main>
    <Footer /><AppointmentPopup /><CartDrawer /><WhatsAppButton />
    </>
  );
}
