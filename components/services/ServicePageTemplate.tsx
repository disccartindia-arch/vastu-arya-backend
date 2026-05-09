'use client';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import WhatsAppButton from '../common/WhatsAppButton';
import AppointmentPopup from '../common/AppointmentPopup';
import PriceDisplay from '../common/PriceDisplay';
import { useUIStore } from '../../store/uiStore';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Video, Star, MessageCircle, Calendar, ChevronRight } from 'lucide-react';

interface FAQ { q: string; a: string; }
interface Props { icon: string; title: string; subtitle: string; description: string; price: number; originalPrice: number; duration: string; benefits: string[]; process: { step: string; title: string; desc: string }[]; faqs: FAQ[]; badge?: string; }

export default function ServicePageTemplate({ icon, title, subtitle, description, price, originalPrice, duration, benefits, process, faqs, badge }: Props) {
  const { setShowAppointmentPopup } = useUIStore();
  const WA = '917000343804';
  const waMsg = encodeURIComponent(`Namaste Dr. PPS ji 🙏 I want to book "${title}". Please guide me.`);
  const discount = Math.round((1 - price / originalPrice) * 100);
  return (
    <>
      <Navbar />
      <main style={{ background: '#FFFDF7' }}>
        <section className="bg-dark-gradient py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 mandala-bg opacity-10 pointer-events-none" />
          <div className="relative max-w-3xl mx-auto px-4">
            {badge && <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 border" style={{ background: 'rgba(212,160,23,0.15)', color: '#D4A017', borderColor: 'rgba(212,160,23,0.3)' }}>{badge}</span>}
            <div className="text-6xl mb-4">{icon}</div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">{title}</h1>
            <p className="text-gray-300 text-lg mb-6">{subtitle}</p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="flex items-center gap-1.5 text-sm text-gray-300"><Clock size={14}/>{duration}</span>
              <span className="flex items-center gap-1.5 text-sm text-gray-300"><Video size={14}/>Video / Phone Call</span>
              <span className="flex items-center gap-1.5 text-sm text-gray-300"><Star size={14} className="fill-yellow-400 text-yellow-400"/>IVAF Certified</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="text-center"><span className="text-gray-400 line-through text-lg">₹{originalPrice.toLocaleString()}</span><div className="text-4xl font-bold text-white">₹{price.toLocaleString()}</div><span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(255,107,0,0.2)', color: '#FF9933' }}>{discount}% OFF</span></div>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <button onClick={() => setShowAppointmentPopup(true)} className="px-8 py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}><Calendar size={16}/> Book Now</button>
                <a href={`https://wa.me/${WA}?text=${waMsg}`} target="_blank" rel="noopener noreferrer" className="px-8 py-3 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 bg-[#25D366]"><MessageCircle size={16}/> WhatsApp</a>
              </div>
            </div>
          </div>
        </section>
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-orange-100"><p className="text-gray-600 text-base leading-relaxed">{description}</p></div>
          <div>
            <h2 className="font-display text-2xl font-bold text-gray-800 mb-5">What You Get</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {benefits.map((b, i) => (<motion.div key={i} initial={{ opacity:0, x:-12 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay: i*0.07 }} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-orange-100 shadow-sm"><CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5"/><span className="text-gray-700 text-sm">{b}</span></motion.div>))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-gray-800 mb-5">How It Works</h2>
            <div className="space-y-3">{process.map((p, i) => (<div key={i} className="flex gap-4 p-5 bg-white rounded-2xl border border-orange-100 shadow-sm"><div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>{p.step}</div><div><p className="font-bold text-gray-800 mb-1">{p.title}</p><p className="text-gray-500 text-sm">{p.desc}</p></div></div>))}</div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-gray-800 mb-5">FAQs</h2>
            <div className="space-y-3">{faqs.map((faq, i) => (<details key={i} className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden group"><summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-gray-800 text-sm list-none">{faq.q}<ChevronRight size={16} className="text-primary flex-shrink-0 group-open:rotate-90 transition-transform"/></summary><div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">{faq.a}</div></details>))}</div>
          </div>
          <div className="text-center py-6">
            <h3 className="font-display text-2xl font-bold text-gray-800 mb-2">Ready to Transform Your Life?</h3>
            <button onClick={() => setShowAppointmentPopup(true)} className="px-10 py-4 rounded-2xl font-bold text-lg text-white inline-flex items-center gap-2" style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}><Calendar size={20}/> Book @ ₹{price.toLocaleString()} Now</button>
          </div>
        </div>
      </main>
      <Footer />
      <AppointmentPopup />
      <WhatsAppButton />
    </>
  );
}
