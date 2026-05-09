'use client';
import { useState } from 'react';
import { X, Phone, User } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useTranslation } from '../../lib/i18n';
import { useRouter } from 'next/navigation';
import { initiateRazorpayPayment } from '../../lib/razorpay';
import toast from 'react-hot-toast';

export default function AppointmentPopup() {
  const { showAppointmentPopup, setShowAppointmentPopup } = useUIStore();
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  if (!showAppointmentPopup) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return toast.error(t('booking.fillAll'));
    if (!/^[6-9]\d{9}$/.test(phone)) return toast.error(t('booking.invalidPhone'));
    setLoading(true);
    const redirectToConfirm = (ref?: string) => {
      setLoading(false); setShowAppointmentPopup(false);
      router.push(`/booking-confirm?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}${ref ? `&ref=${encodeURIComponent(ref)}` : ''}`);
    };
    await initiateRazorpayPayment({
      amount: 11, name, phone, description: 'Book Appointment with Dr. PPS Tomar', type: 'booking',
      orderData: { name, phone, serviceName: 'Book Appointment', amount: 11 },
      onSuccess: (data: any) => redirectToConfirm(data?.bookingId || ''),
      onFailure: () => redirectToConfirm(),
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowAppointmentPopup(false)}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" style={{ border: '1px solid rgba(212,160,23,0.2)' }} onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center relative" style={{ background: 'linear-gradient(135deg, #FF6B00, #FF9933, #D4A017)' }}>
          <button onClick={() => setShowAppointmentPopup(false)} className="absolute top-3 right-3 text-white/70 hover:text-white"><X size={20} /></button>
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 mx-auto mb-3"><img src="/logo.jpg" alt="Vastu Arya" className="w-full h-full object-cover" /></div>
          <h2 className="font-display text-xl font-bold text-white mb-1">{t('booking.title')}</h2>
          <p className="text-white/85 text-sm">{t('booking.subtitle')}</p>
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            ⚡ {t('booking.badge')}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#5C3D1E' }}>{t('booking.name')} *</label>
            <div className="relative"><User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={name} onChange={e => setName(e.target.value)} type="text" placeholder={t('booking.namePlaceholder')} className="w-full pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none" style={{ border: '1px solid #FED7AA' }} required /></div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#5C3D1E' }}>{t('booking.phone')} *</label>
            <div className="relative"><Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} type="tel" maxLength={10} placeholder={t('booking.phonePlaceholder')} className="w-full pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none" style={{ border: '1px solid #FED7AA' }} required /></div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-bold text-lg text-white transition-all disabled:opacity-60" style={{ background: loading ? '#ccc' : 'linear-gradient(135deg, #FF6B00, #FF8C33)', boxShadow: loading ? 'none' : '0 4px 20px rgba(255,107,0,0.4)' }}>
            {loading ? t('booking.processing') : t('booking.bookBtn')}
          </button>
          <p className="text-center text-xs text-gray-400">{t('booking.secure')}</p>
        </form>
      </div>
    </div>
  );
}
