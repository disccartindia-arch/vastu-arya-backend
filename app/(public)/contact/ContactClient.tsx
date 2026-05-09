'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import WhatsAppButton from '../../../components/common/WhatsAppButton';
import { useUIStore } from '../../../store/uiStore';
import { Phone, Mail, MapPin, MessageCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { homepageSettingsAPI } from '../../../lib/api';
export default function ContactPage() {
  const { lang } = useUIStore();
  const [form, setForm] = useState({ name:'', email:'', phone:'', message:'' });
  const [sending, setSending] = useState(false);
  const [contact, setContact] = useState({ phone: '+91-7000343804', email: 'contact@vastuarya.com', address: 'New Delhi, India', whatsapp: '917000343804' });
  useEffect(() => { homepageSettingsAPI.get().then((r:any) => { const d=r?.data?.data; if(d) setContact({ phone:d.contactPhone||d.contactNumber||'+91-7000343804', email:d.contactEmail||'contact@vastuarya.com', address:d.contactAddress||'New Delhi, India', whatsapp:d.contactWhatsapp||'917000343804' }); }).catch(()=>{}); }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return toast.error('Fill all required fields');
    setSending(true); await new Promise(r=>setTimeout(r,1500));
    toast.success('Message sent! We'll reply within 24 hours.');
    setForm({ name:'', email:'', phone:'', message:'' }); setSending(false);
  };
  return (<><Navbar /><main>
    <section className="bg-dark-gradient py-16 text-center relative"><div className="absolute inset-0 mandala-bg opacity-10"/><div className="relative"><h1 className="font-display text-4xl font-bold text-white mb-2">{lang==='en'?'Contact Us':'संपर्क करें'}</h1></div></section>
    <section className="py-16 bg-cream"><div className="max-w-5xl mx-auto px-4 sm:px-6"><div className="grid lg:grid-cols-2 gap-12">
      <div><h2 className="font-display text-2xl font-bold text-text-dark mb-6">Get in Touch</h2>
        <div className="space-y-4 mb-8">{[{icon:Phone,label:'Phone',val:contact.phone},{icon:Mail,label:'Email',val:contact.email},{icon:MapPin,label:'Location',val:contact.address}].map((c,i)=>(<div key={i} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-orange-100"><div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><c.icon size={18} className="text-primary"/></div><div><p className="text-xs text-text-light">{c.label}</p><p className="font-semibold text-text-dark">{c.val}</p></div></div>))}</div>
        <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-2xl font-bold transition-all"><MessageCircle size={20}/> Chat on WhatsApp</a>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm"><h2 className="font-display text-2xl font-bold text-text-dark mb-4">Send a Message</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[['name','Your Name *','text'],['email','Email Address *','email'],['phone','Phone Number','tel']].map(([k,p,t])=>(<input key={k} type={t} value={(form as any)[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={p} className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:border-primary text-sm"/>))}
          <textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Your message *" rows={5} className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:border-primary text-sm resize-none"/>
          <button type="submit" disabled={sending} className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"><Send size={16}/>{sending?'Sending...':'Send Message'}</button>
        </form>
      </div>
    </div></div></section></main><Footer /><WhatsAppButton /></>);
}
