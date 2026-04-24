/// <reference types="node" />
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User';
import Service from '../models/Service';
import Product from '../models/Product';
import SiteSettings from '../models/SiteSettings';
import Slider from '../models/Slider';
import PageContent from '../models/PageContent';
import SiteConfig from '../models/SiteConfig';

const env = (process as any).env;
const con = (console as any);
const proc = process as any;

const MONGO_URI: string = env.MONGO_URI || 'mongodb://localhost:27017/vastuarya';

const defaultPageContent = [
  { page: 'home', section: 'hero', key: 'title1', value: 'Transform Your Space,', type: 'text' as const, label: 'Hero Title Line 1' },
  { page: 'home', section: 'hero', key: 'title2', value: 'Transform Your Life', type: 'text' as const, label: 'Hero Title Line 2' },
  { page: 'home', section: 'hero', key: 'subtitle', value: "India's Premier Vastu & Astrology Platform by Dr. PPS", type: 'text' as const, label: 'Hero Subtitle' },
  { page: 'home', section: 'hero', key: 'cta1', value: 'Book Appointment @ Rs.11', type: 'text' as const, label: 'Primary CTA' },
  { page: 'home', section: 'hero', key: 'cta2', value: 'Explore Vastu Store', type: 'text' as const, label: 'Secondary CTA' },
  { page: 'home', section: 'stats', key: 'clients', value: '45,000+', type: 'text' as const, label: 'Clients Count' },
  { page: 'home', section: 'stats', key: 'experience', value: '15+', type: 'text' as const, label: 'Years Experience' },
  { page: 'home', section: 'stats', key: 'services', value: '100+', type: 'text' as const, label: 'Services Count' },
  { page: 'home', section: 'stats', key: 'cities', value: '50+', type: 'text' as const, label: 'Cities Served' },
  { page: 'home', section: 'cta', key: 'title', value: 'Transform Your Life Today', type: 'text' as const, label: 'CTA Title' },
  { page: 'home', section: 'cta', key: 'subtitle', value: 'Connect with Dr. PPS on WhatsApp. Only Rs.11.', type: 'text' as const, label: 'CTA Subtitle' },
  { page: 'home', section: 'cta', key: 'button', value: 'Book Appointment @ Rs.11', type: 'text' as const, label: 'CTA Button' },
  { page: 'global', section: 'navbar', key: 'phone', value: '+91-9999999999', type: 'text' as const, label: 'Phone Number' },
  { page: 'global', section: 'popup', key: 'title', value: 'Book Your Appointment', type: 'text' as const, label: 'Popup Title' },
  { page: 'global', section: 'popup', key: 'subtitle', value: 'Connect with Dr. PPS on WhatsApp', type: 'text' as const, label: 'Popup Subtitle' },
  { page: 'global', section: 'popup', key: 'badge', value: 'Only Rs.11 - Limited Offer!', type: 'text' as const, label: 'Popup Badge' },
  { page: 'global', section: 'popup', key: 'cta', value: 'Book @ Rs.11', type: 'text' as const, label: 'Popup Button' },
  { page: 'global', section: 'seo', key: 'title', value: 'Vastu Arya - Premium Vastu & Astrology | IVAF Certified', type: 'text' as const, label: 'SEO Title' },
  { page: 'global', section: 'seo', key: 'description', value: "India's premier Vastu consultation by Dr. PPS - IVAF Certified.", type: 'text' as const, label: 'SEO Description' },
];

const defaultConfigs = [
  { key: 'bg_animations_enabled', value: true, category: 'background', label: 'Enable Animations' },
  { key: 'bg_gold_intensity', value: 0.7, category: 'background', label: 'Gold Intensity' },
  { key: 'bg_animation_speed', value: 1, category: 'background', label: 'Animation Speed' },
  { key: 'logo_url', value: '/logo.jpg', category: 'branding', label: 'Logo URL' },
];

const services = [
  { title: { en: 'Book Appointment', hi: 'अपॉइंटमेंट बुक करें' }, slug: 'book-appointment', category: 'consultation', shortDesc: { en: 'Connect with Dr. PPS on WhatsApp instantly', hi: 'तुरंत डॉ. PPS से जुड़ें' }, description: { en: 'Book your appointment at just Rs.11. Get connected on WhatsApp.', hi: '' }, originalPrice: 499, offerPrice: 11, icon: '📅', features: [], formFields: ['name', 'phone'], redirectType: 'razorpay' as const, isActive: true, showOnHome: true, sortOrder: 1, seo: { title: 'Book Vastu Appointment', description: '', keywords: '' } },
  { title: { en: 'Mobile Number Numerology', hi: 'मोबाइल नंबर अंकशास्त्र' }, slug: 'mobile-numerology', category: 'numerology', shortDesc: { en: 'Is your mobile number lucky for you?', hi: 'क्या आपका मोबाइल नंबर शुभ है?' }, description: { en: 'Detailed PDF report of your number energy.', hi: '' }, originalPrice: 999, offerPrice: 199, icon: '📱', features: [], formFields: ['name', 'phone', 'email'], redirectType: 'razorpay' as const, isActive: true, showOnHome: true, sortOrder: 2, seo: { title: 'Mobile Number Numerology', description: '', keywords: '' } },
  { title: { en: 'Numerology Analysis', hi: 'अंकशास्त्र विश्लेषण' }, slug: 'numerology-analysis', category: 'numerology', shortDesc: { en: 'Your complete numerological profile', hi: 'आपकी संपूर्ण अंकशास्त्र प्रोफाइल' }, description: { en: 'Complete numerology profile by Dr. PPS.', hi: '' }, originalPrice: 999, offerPrice: 499, icon: '🔢', features: [], formFields: ['name', 'birthdate', 'email'], redirectType: 'razorpay' as const, isActive: true, showOnHome: true, sortOrder: 3, seo: { title: 'Numerology Analysis', description: '', keywords: '' } },
  { title: { en: 'Vastu Check & Assistant', hi: 'वास्तु जांच और सहायक' }, slug: 'vastu-check', category: 'vastu', shortDesc: { en: 'Complete 360 degree Vastu analysis', hi: 'संपूर्ण वास्तु विश्लेषण' }, description: { en: 'Comprehensive Vastu analysis by Dr. PPS.', hi: '' }, originalPrice: 51000, offerPrice: 5100, icon: '🏠', features: [], formFields: ['name', 'phone', 'email', 'address'], redirectType: 'razorpay' as const, isActive: true, showOnHome: true, sortOrder: 4, seo: { title: 'Vastu Check', description: '', keywords: '' } },
  { title: { en: 'Smart Layout Plan', hi: 'स्मार्ट लेआउट प्लान' }, slug: 'smart-layout', category: 'vastu', shortDesc: { en: 'Professional scale floor plan by IVAF expert', hi: 'IVAF विशेषज्ञ द्वारा फ्लोर प्लान' }, description: { en: 'Professional Vastu layout plan.', hi: '' }, originalPrice: 5100, offerPrice: 1100, icon: '📐', features: [], formFields: ['name', 'phone', 'email'], redirectType: 'razorpay' as const, isActive: true, showOnHome: true, sortOrder: 5, seo: { title: 'Smart Layout Plan', description: '', keywords: '' } },
  { title: { en: 'Vastu Consultancy by Dr. PPS', hi: 'डॉ. PPS द्वारा वास्तु परामर्श' }, slug: 'vastu-consultancy', category: 'consultation', shortDesc: { en: 'One-on-one consultation with Dr. PPS', hi: 'डॉ. PPS के साथ परामर्श' }, description: { en: 'Premium one-on-one consultation.', hi: '' }, originalPrice: 11000, offerPrice: 1100, icon: '📞', features: [], formFields: ['name', 'phone', 'email'], redirectType: 'razorpay' as const, isActive: true, showOnHome: true, sortOrder: 6, seo: { title: 'Vastu Consultancy', description: '', keywords: '' } },
];

const products = [
  { name: { en: '7 Chakra Rudraksha Bracelet', hi: '7 चक्र रुद्राक्ष ब्रेसलेट' }, slug: '7-chakra-rudraksha-bracelet', category: 'rudraksha', description: { en: 'Balances all 7 chakras.', hi: '' }, benefits: ['Balances energy', 'Reduces stress'], price: 1999, offerPrice: 999, images: [], stock: 50, isFeatured: true, isNewLaunch: false },
  { name: { en: 'Natural Citrine Gemstone Pendant', hi: 'प्राकृतिक सिट्रीन रत्न पेंडेंट' }, slug: 'citrine-gemstone-pendant', category: 'gemstone-pendants', description: { en: 'Natural citrine for wealth.', hi: '' }, benefits: ['Attracts wealth', 'Boosts confidence'], price: 3500, offerPrice: 1750, images: [], stock: 25, isFeatured: true, isNewLaunch: false },
  { name: { en: 'Shree Yantra Gold Plated', hi: 'श्री यंत्र सोना चढ़ा' }, slug: 'shree-yantra-gold-plated', category: 'yantras', description: { en: 'Sacred Shree Yantra.', hi: '' }, benefits: ['Attracts prosperity', 'Removes obstacles'], price: 2500, offerPrice: 1299, images: [], stock: 30, isFeatured: true, isNewLaunch: true },
  { name: { en: 'Panchmukhi Rudraksha Mala', hi: 'पंचमुखी रुद्राक्ष माला' }, slug: 'panchmukhi-rudraksha-mala', category: 'sacred-mala', description: { en: '108 bead mala for meditation.', hi: '' }, benefits: ['Enhances meditation', 'Reduces anxiety'], price: 2999, offerPrice: 1499, images: [], stock: 40, isFeatured: false, isNewLaunch: true },
  { name: { en: 'Vastu Crystal Pyramid', hi: 'वास्तु क्रिस्टल पिरामिड' }, slug: 'vastu-crystal-pyramid', category: 'yantras', description: { en: 'Clear quartz pyramid.', hi: '' }, benefits: ['Amplifies positive energy', 'Removes Vastu defects'], price: 1500, offerPrice: 799, images: [], stock: 60, isFeatured: true, isNewLaunch: true },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    con.log('MongoDB connected');

    const existingAdmin = await User.findOne({ email: 'Vastuarya@Admin.com' });
    if (!existingAdmin) {
      await User.create({ name: 'Dr. PPS - Vastu Arya', email: 'Vastuarya@Admin.com', password: 'Admin@2407@', role: 'admin', phone: '+91-0000000000' });
      con.log('Admin seeded: Vastuarya@Admin.com / Admin@2407@');
    } else {
      con.log('Admin exists');
    }

    for (const svc of services) {
      if (!await Service.findOne({ slug: svc.slug })) {
        await Service.create(svc);
        con.log('Service seeded:', svc.title.en);
      }
    }

    for (const prod of products) {
      if (!await Product.findOne({ slug: prod.slug })) {
        await Product.create(prod);
        con.log('Product seeded:', prod.name.en);
      }
    }

    for (const content of defaultPageContent) {
      await PageContent.findOneAndUpdate({ page: content.page, section: content.section, key: content.key }, content, { upsert: true });
    }
    con.log('Page content seeded');

    for (const config of defaultConfigs) {
      await SiteConfig.findOneAndUpdate({ key: config.key }, config, { upsert: true });
    }
    con.log('Site config seeded');

    if (!await SiteSettings.findOne()) {
      await SiteSettings.create({ siteName: 'Vastu Arya', tagline: { en: 'Transform Your Space, Transform Your Life', hi: 'अपना जीवन बदलें' }, phone: '+91-9999999999', whatsappNumber: '919999999999', email: 'contact@vastuarya.com', address: 'New Delhi, India' });
      con.log('Settings seeded');
    }

    if (!await Slider.findOne()) {
      await Slider.create({ title: 'Transform Your Space, Transform Your Life', subtitle: 'IVAF Certified Expert Dr. PPS - 45,000+ Happy Clients', image: '/images/hero-bg.jpg', ctaText: 'Book @ Rs.11', ctaLink: '/book-appointment', isActive: true, sortOrder: 1 });
      con.log('Slider seeded');
    }

    con.log('Seeding complete! Admin: Vastuarya@Admin.com / Admin@2407@');
    proc.exit(0);
  } catch (error) {
    con.error('Seed failed:', error);
    proc.exit(1);
  }
}

seed();
