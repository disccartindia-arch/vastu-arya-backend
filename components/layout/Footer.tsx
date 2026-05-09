'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUIStore } from '../../store/uiStore';
import { useTranslation } from '../../lib/i18n';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { homepageSettingsAPI } from '../../lib/api';

export default function Footer() {
  const { } = useUIStore();
  const { t } = useTranslation();
  const [fd, setFd] = useState({ phone: '+91-7000343804', email: 'vastuarya@gmail.com', address: 'MP, India', whatsapp: '917000343804' });

  useEffect(() => {
    homepageSettingsAPI.get().then((r: any) => {
      const d = r?.data?.data;
      if (d) setFd(prev => ({ ...prev, phone: d.contactPhone || d.contactNumber || prev.phone, email: d.contactEmail || prev.email, address: d.contactAddress || prev.address, whatsapp: d.contactWhatsapp || prev.whatsapp }));
    }).catch(() => {});
  }, []);

  return (
    <footer style={{ background: '#0D0500', color: '#9CA3AF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ border: '2px solid rgba(212,160,23,0.35)' }}>
              <img src="/logo.jpg" alt="Vastu Arya" className="w-full h-full object-cover" />
            </div>
            <div><div className="font-display font-bold text-xl text-white">Vastu Arya</div><div className="text-xs font-accent" style={{ color: '#D4A017' }}>IVAF Certified</div></div>
          </div>
          <p className="text-sm leading-relaxed mb-4 text-gray-500">{t('footer.tagline')}</p>
        </div>

        <div>
          <h4 className="font-display font-semibold text-white mb-4">{t('footer.services')}</h4>
          <ul className="space-y-2">
            {[['/book-appointment', `${t('common.bookNow')} (₹11)`],['/services/vastu-consultancy','Vastu Consultancy'],['/services/home-energy-analysis','Home Energy Analysis'],['/services/business-vastu','Business Vastu'],['/services/mobile-numerology','Mobile Numerology'],['/services/gemstone-guidance','Gemstone Guidance']].map(([href, label]) => (
              <li key={href}><Link href={href} className="text-sm transition-colors hover:text-yellow-400" style={{ color: '#6B7280' }}>{label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold text-white mb-4">{t('footer.vastuStore')}</h4>
          <ul className="space-y-2">
            {[['rudraksha','Rudraksha'],['gemstones','Gemstones'],['yantras','Yantras'],['sacred-mala','Sacred Mala'],['divine-frames','Divine Frames']].map(([slug, label]) => (
              <li key={slug}><Link href={`/vastu-store/${slug}`} className="text-sm transition-colors hover:text-yellow-400" style={{ color: '#6B7280' }}>{label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold text-white mb-4">{t('footer.contactUs')}</h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-2.5"><Phone size={13} style={{ color: '#D4A017' }} className="mt-0.5 flex-shrink-0"/><span className="text-sm text-gray-500">{fd.phone}</span></li>
            <li className="flex items-start gap-2.5"><Mail size={13} style={{ color: '#D4A017' }} className="mt-0.5 flex-shrink-0"/><span className="text-sm text-gray-500">{fd.email}</span></li>
            <li className="flex items-start gap-2.5"><MapPin size={13} style={{ color: '#D4A017' }} className="mt-0.5 flex-shrink-0"/><span className="text-sm text-gray-500">{fd.address}</span></li>
            <li>
              <a href={`https://wa.me/${fd.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm text-white transition-colors mt-1" style={{ background: '#25D366' }}>
                <MessageCircle size={15}/> {t('contact.chatWhatsApp')}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-600">{t('footer.copyright')}</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-xs text-gray-600 hover:text-yellow-400 transition-colors">{t('footer.privacy')}</Link>
            <Link href="/terms" className="text-xs text-gray-600 hover:text-yellow-400 transition-colors">{t('footer.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
