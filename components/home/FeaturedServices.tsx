'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useUIStore } from '../../store/uiStore';
import { Service } from '../../types';
import PriceDisplay from '../common/PriceDisplay';
import { ArrowRight } from 'lucide-react';

interface Props { services: Service[]; onBookAppointment: () => void; servicesButtonText?: string; }

export default function FeaturedServices({ services, onBookAppointment, servicesButtonText }: Props) {
  const { lang } = useUIStore();
  return (
    <section className="py-20 bg-cream mandala-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="font-accent text-primary text-sm tracking-widest uppercase">Our Services</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-dark mt-2 mb-3">{lang === 'en' ? 'Premier Consultation Services' : 'प्रमुख परामर्श सेवाएं'}</h2>
          <p className="text-text-light max-w-xl mx-auto">{lang === 'en' ? 'Expert consultations by IVAF Certified Dr. PPS Tomar — 15+ years of transforming lives' : 'IVAF प्रमाणित डॉ. PPS द्वारा विशेषज्ञ परामर्श'}</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <motion.div key={service._id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -8 }} className="glass-card rounded-2xl p-6 hover:shadow-orange-lg transition-all cursor-pointer group">
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="font-display font-bold text-text-dark text-lg mb-2 group-hover:text-primary transition-colors">{lang === 'en' ? service.title.en : (service.title.hi || service.title.en)}</h3>
              <p className="text-text-light text-sm mb-4 leading-relaxed line-clamp-2">{lang === 'en' ? service.shortDesc.en : (service.shortDesc.hi || service.shortDesc.en)}</p>
              <PriceDisplay original={service.originalPrice} offer={service.offerPrice} size="sm" />
              <div className="flex gap-2 mt-4">
                {service.slug === 'book-appointment' ? (
                  <button onClick={onBookAppointment} className="flex-1 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5">{lang === 'en' ? 'Book Now' : 'अभी बुक करें'} <ArrowRight size={14} /></button>
                ) : (
                  <Link href={`/services/${service.slug}`} className="flex-1 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-xl text-sm font-semibold text-center transition-all">{lang === 'en' ? 'Know More' : 'और जानें'}</Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/services" className="inline-flex items-center gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 rounded-xl font-semibold transition-all">
            {servicesButtonText || (lang === 'en' ? 'View All 100+ Services' : 'सभी 100+ सेवाएं देखें')} <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
