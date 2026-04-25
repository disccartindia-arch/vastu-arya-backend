import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User';
import Service from '../models/Service';
import Product from '../models/Product';
import SiteSettings from '../models/SiteSettings';
import Slider from '../models/Slider';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vastuarya';

const services = [
  {
    title: { en: 'Book Appointment', hi: 'अपॉइंटमेंट बुक करें' },
    slug: 'book-appointment',
    category: 'consultation',
    shortDesc: { en: 'Connect with Dr. PPS on WhatsApp instantly', hi: 'तुरंत डॉ. PPS से WhatsApp पर जुड़ें' },
    description: { en: 'Book your appointment with India\'s top Vastu expert Dr. PPS at just ₹11. Get connected on WhatsApp for personalized Vastu and astrology guidance. IVAF certified expert with 15+ years of experience.', hi: 'मात्र ₹11 में भारत के शीर्ष वास्तु विशेषज्ञ डॉ. PPS के साथ अपॉइंटमेंट बुक करें।' },
    originalPrice: 499,
    offerPrice: 11,
    icon: '📅',
    features: [
      { en: 'Direct WhatsApp connection with Dr. PPS', hi: 'डॉ. PPS से सीधा WhatsApp कनेक्शन' },
      { en: 'Instant response within 30 minutes', hi: '30 मिनट के अंदर तुरंत जवाब' },
      { en: 'Personalized Vastu guidance', hi: 'व्यक्तिगत वास्तु मार्गदर्शन' },
      { en: 'IVAF certified expert consultation', hi: 'IVAF प्रमाणित विशेषज्ञ परामर्श' },
    ],
    formFields: ['name', 'phone'],
    redirectType: 'razorpay',
    isActive: true,
    showOnHome: true,
    sortOrder: 1,
    seo: { title: 'Book Vastu Appointment @ ₹11 | Vastu Arya', description: 'Book your Vastu consultation appointment with Dr. PPS at just ₹11. IVAF certified expert. WhatsApp connect.', keywords: 'vastu appointment, vastu consultation, book appointment' }
  },
  {
    title: { en: 'Mobile Number Numerology', hi: 'मोबाइल नंबर अंकशास्त्र' },
    slug: 'mobile-numerology',
    category: 'numerology',
    shortDesc: { en: 'Is your mobile number lucky for you?', hi: 'क्या आपका मोबाइल नंबर आपके लिए शुभ है?' },
    description: { en: 'Find out if your mobile number aligns with your destiny. Our expert Dr. PPS will analyze your number\'s energy, vibrations, and compatibility with your birth chart. Receive a detailed PDF report covering energy analysis, career compatibility, lucky number verification, and personal recommendations.', hi: 'जानें कि क्या आपका मोबाइल नंबर आपकी किस्मत के अनुरूप है।' },
    originalPrice: 999,
    offerPrice: 199,
    icon: '📱',
    features: [
      { en: 'Detailed PDF report of your number\'s energy', hi: 'आपके नंबर की ऊर्जा की विस्तृत PDF रिपोर्ट' },
      { en: 'Lucky number verification', hi: 'शुभ नंबर सत्यापन' },
      { en: 'Career and business compatibility', hi: 'करियर और व्यवसाय अनुकूलता' },
      { en: 'Remedies for unlucky numbers', hi: 'अशुभ नंबरों के उपाय' },
    ],
    formFields: ['name', 'phone', 'email'],
    redirectType: 'razorpay',
    isActive: true,
    showOnHome: true,
    sortOrder: 2,
    seo: { title: 'Mobile Number Numerology Analysis ₹199 | Vastu Arya', description: 'Get your mobile number analyzed by Dr. PPS. Is your number lucky? Detailed PDF report at just ₹199.', keywords: 'mobile number numerology, lucky number, numerology analysis' }
  },
  {
    title: { en: 'Numerology Analysis', hi: 'अंकशास्त्र विश्लेषण' },
    slug: 'numerology-analysis',
    category: 'numerology',
    shortDesc: { en: 'Your complete numerological profile by Dr. PPS', hi: 'डॉ. PPS द्वारा आपकी संपूर्ण अंकशास्त्र प्रोफाइल' },
    description: { en: 'Get a comprehensive numerological profile that reveals your lucky numbers, favorable colors, compatible professions, and planetary influences. Dr. PPS creates a detailed grid analysis showing missing numbers, their impact, and precise remedies.', hi: 'अपनी व्यापक अंकशास्त्र प्रोफाइल प्राप्त करें जो आपके शुभ अंक, अनुकूल रंग और ग्रहीय प्रभाव बताती है।' },
    originalPrice: 999,
    offerPrice: 499,
    icon: '🔢',
    features: [
      { en: 'Lucky numbers, colors, and days', hi: 'शुभ अंक, रंग और दिन' },
      { en: 'Detailed numerology grid analysis', hi: 'विस्तृत अंकशास्त्र ग्रिड विश्लेषण' },
      { en: 'Missing numbers and their impact', hi: 'लापता नंबर और उनका प्रभाव' },
      { en: 'Planet compatibility report', hi: 'ग्रह अनुकूलता रिपोर्ट' },
      { en: 'Personalized remedies', hi: 'व्यक्तिगत उपाय' },
    ],
    formFields: ['name', 'birthdate', 'birthplace', 'gender', 'email'],
    redirectType: 'razorpay',
    isActive: true,
    showOnHome: true,
    sortOrder: 3,
    seo: { title: 'Numerology Analysis ₹499 | Vastu Arya', description: 'Get your complete numerological blueprint by Dr. PPS. Lucky numbers, planet analysis, remedies. Only ₹499.', keywords: 'numerology analysis, lucky numbers, numerology profile' }
  },
  {
    title: { en: 'Vastu Check & Assistant', hi: 'वास्तु जांच और सहायक' },
    slug: 'vastu-check',
    category: 'vastu',
    shortDesc: { en: 'Complete 360° Vastu analysis of your home/office', hi: 'आपके घर/कार्यालय का संपूर्ण 360° वास्तु विश्लेषण' },
    description: { en: 'The most comprehensive Vastu analysis service in India. Dr. PPS conducts a complete analysis of your space using advanced Vastu principles including Brahm Bindu, Shakti Chakra, 16-Zone analysis, and 32-Devta energy field mapping. Includes detailed report with layout recommendations.', hi: 'भारत में सबसे व्यापक वास्तु विश्लेषण सेवा।' },
    originalPrice: 51000,
    offerPrice: 5100,
    icon: '🏠',
    features: [
      { en: 'Brahm Bindu (Centre of Gravity) Analysis', hi: 'ब्रह्म बिंदु (गुरुत्व केंद्र) विश्लेषण' },
      { en: 'Shakti Chakra placement for home', hi: 'घर के लिए शक्ति चक्र स्थापना' },
      { en: 'Marma Analysis - critical energy points', hi: 'मर्म विश्लेषण - महत्वपूर्ण ऊर्जा बिंदु' },
      { en: '16 Zone complete analysis with sq.ft breakdown', hi: '16 ज़ोन पूर्ण विश्लेषण sq.ft विवरण के साथ' },
      { en: 'Devta Energy Fields (32 Devta mapping)', hi: 'देवता ऊर्जा क्षेत्र (32 देवता मानचित्रण)' },
      { en: 'New house design & factory layout', hi: 'नए घर का डिजाइन और फैक्ट्री लेआउट' },
    ],
    formFields: ['name', 'phone', 'email', 'address', 'propertyType'],
    redirectType: 'razorpay',
    isActive: true,
    showOnHome: true,
    sortOrder: 4,
    seo: { title: 'Complete Vastu Check ₹5100 | Vastu Arya', description: '90% OFF! Get complete Vastu analysis by IVAF expert Dr. PPS. Brahm Bindu, 16 zones, 32 Devta analysis. Was ₹51,000, now ₹5,100.', keywords: 'vastu check, vastu analysis, vastu shastra, home vastu' }
  },
  {
    title: { en: 'Smart Layout Plan', hi: 'स्मार्ट लेआउट प्लान' },
    slug: 'smart-layout',
    category: 'vastu',
    shortDesc: { en: 'Professional scale floor plan by IVAF expert', hi: 'IVAF विशेषज्ञ द्वारा पेशेवर स्केल फ्लोर प्लान' },
    description: { en: 'Get a professionally designed floor plan for your plot or flat. Dr. PPS creates a detailed scale layout showing exact placement of walls, doors, windows, and furniture according to Vastu principles. Every placement is scientifically calculated for maximum positive energy.', hi: 'अपने प्लॉट या फ्लैट के लिए पेशेवर रूप से डिजाइन किया गया फ्लोर प्लान प्राप्त करें।' },
    originalPrice: 5100,
    offerPrice: 1100,
    icon: '📐',
    features: [
      { en: 'Precise scale floor plan (with measurements)', hi: 'सटीक स्केल फ्लोर प्लान (माप के साथ)' },
      { en: 'Vastu-compliant door & window placement', hi: 'वास्तु-अनुरूप दरवाजे और खिड़की स्थापना' },
      { en: 'Furniture placement map', hi: 'फर्नीचर स्थापना मानचित्र' },
      { en: 'Kitchen, bedroom, bathroom optimization', hi: 'रसोई, शयनकक्ष, बाथरूम अनुकूलन' },
    ],
    formFields: ['name', 'phone', 'email', 'plotSize', 'floors'],
    redirectType: 'razorpay',
    isActive: true,
    showOnHome: true,
    sortOrder: 5,
    seo: { title: 'Smart Vastu Layout Plan ₹1100 | Vastu Arya', description: 'Professional floor plan by IVAF expert Dr. PPS. Scale layout, furniture placement, Vastu-compliant design. ₹1100.', keywords: 'vastu floor plan, vastu layout, house design vastu' }
  },
  {
    title: { en: 'Vastu Consultancy by Dr. PPS', hi: 'डॉ. PPS द्वारा वास्तु परामर्श' },
    slug: 'vastu-consultancy',
    category: 'consultation',
    shortDesc: { en: 'One-on-one video/call consultation with Dr. PPS', hi: 'डॉ. PPS के साथ एक-पर-एक वीडियो/कॉल परामर्श' },
    description: { en: 'The premium consultation package with India\'s leading Vastu expert. Dr. PPS personally connects with you via video/phone call to discuss your Vastu, astrology, and gemology needs. Includes access to all services. Book advance at ₹1,100 or get full access at ₹11,000.', hi: 'भारत के अग्रणी वास्तु विशेषज्ञ के साथ प्रीमियम परामर्श पैकेज।' },
    originalPrice: 11000,
    offerPrice: 1100,
    icon: '📞',
    features: [
      { en: 'Personal video/phone call with Dr. PPS', hi: 'डॉ. PPS के साथ व्यक्तिगत वीडियो/फोन कॉल' },
      { en: 'Complete Vastu analysis included', hi: 'संपूर्ण वास्तु विश्लेषण शामिल' },
      { en: 'Astrology & gemology guidance', hi: 'ज्योतिष और रत्नशास्त्र मार्गदर्शन' },
      { en: 'Lifetime guidance from IVAF expert', hi: 'IVAF विशेषज्ञ से आजीवन मार्गदर्शन' },
    ],
    formFields: ['name', 'phone', 'email'],
    redirectType: 'razorpay',
    isActive: true,
    showOnHome: true,
    sortOrder: 6,
    seo: { title: 'Vastu Consultancy by Dr. PPS | Book @ ₹1100 | Vastu Arya', description: 'Personal consultation with IVAF certified Dr. PPS. Video/phone call. Book advance at ₹1,100 or full package ₹11,000.', keywords: 'vastu consultancy, vastu expert, Dr PPS, vastu consultation' }
  }
];

const products = [
  { name: { en: '7 Chakra Rudraksha Bracelet', hi: '7 चक्र रुद्राक्ष ब्रेसलेट' }, slug: '7-chakra-rudraksha-bracelet', category: 'rudraksha', description: { en: 'Balances all 7 chakras. Promotes peace, health and prosperity.', hi: 'सभी 7 चक्रों को संतुलित करता है।' }, benefits: ['Balances energy', 'Reduces stress', 'Promotes positive aura', 'Enhances mental clarity'], price: 1999, offerPrice: 999, images: [], stock: 50, isFeatured: true, isNewLaunch: false },
  { name: { en: 'Natural Citrine Gemstone Pendant', hi: 'प्राकृतिक सिट्रीन रत्न पेंडेंट' }, slug: 'citrine-gemstone-pendant', category: 'gemstone-pendants', description: { en: 'Natural citrine for wealth, success and positive energy.', hi: 'धन, सफलता के लिए प्राकृतिक सिट्रीन।' }, benefits: ['Attracts wealth', 'Boosts confidence', 'Removes negativity', 'Enhances creativity'], price: 3500, offerPrice: 1750, images: [], stock: 25, isFeatured: true, isNewLaunch: false },
  { name: { en: 'Shree Yantra (Gold Plated)', hi: 'श्री यंत्र (सोना चढ़ा)' }, slug: 'shree-yantra-gold-plated', category: 'yantras', description: { en: 'Sacred Shree Yantra for wealth and prosperity.', hi: 'धन और समृद्धि के लिए पवित्र श्री यंत्र।' }, benefits: ['Attracts wealth and prosperity', 'Removes financial obstacles', 'Brings positive energy', 'Sacred Lakshmi yantra'], price: 2500, offerPrice: 1299, images: [], stock: 30, isFeatured: true, isNewLaunch: true },
  { name: { en: 'Panchmukhi Rudraksha Mala', hi: 'पंचमुखी रुद्राक्ष माला' }, slug: 'panchmukhi-rudraksha-mala', category: 'sacred-mala', description: { en: '108 bead Panchmukhi Rudraksha mala for meditation and spiritual growth.', hi: 'ध्यान और आध्यात्मिक विकास के लिए 108 दाने की माला।' }, benefits: ['Enhances meditation', 'Promotes spiritual growth', 'Reduces anxiety', 'Brings divine blessings'], price: 2999, offerPrice: 1499, images: [], stock: 40, isFeatured: false, isNewLaunch: true },
  { name: { en: 'Vastu Crystal Pyramid', hi: 'वास्तु क्रिस्टल पिरामिड' }, slug: 'vastu-crystal-pyramid', category: 'yantras', description: { en: 'Clear quartz pyramid for positive Vastu energy in your home.', hi: 'घर में सकारात्मक वास्तु ऊर्जा के लिए स्पष्ट क्वार्ट्ज पिरामिड।' }, benefits: ['Amplifies positive energy', 'Removes Vastu defects', 'Enhances harmony', 'Improves prosperity'], price: 1500, offerPrice: 799, images: [], stock: 60, isFeatured: true, isNewLaunch: true },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected for seeding');

    // Seed Admin
    const existingAdmin = await User.findOne({ email: 'Vastuarya@Admin.com' });
    if (!existingAdmin) {
      await User.create({
        name: 'Dr. PPS - Vastu Arya',
        email: 'Vastuarya@Admin.com',
        password: 'Admin@2407@',
        role: 'admin',
        phone: '+91-0000000000',
      });
      console.log('✅ Admin user seeded: Vastuarya@Admin.com / Admin@2407@');
    } else {
      console.log('ℹ️  Admin already exists');
    }

    // Seed Services
    for (const service of services) {
      const existing = await Service.findOne({ slug: service.slug });
      if (!existing) {
        await Service.create(service);
        console.log(`✅ Service seeded: ${service.title.en}`);
      }
    }

    // Seed Products
    for (const product of products) {
      const existing = await Product.findOne({ slug: product.slug });
      if (!existing) {
        await Product.create(product);
        console.log(`✅ Product seeded: ${product.name.en}`);
      }
    }

    // Seed Site Settings
    const existingSettings = await SiteSettings.findOne();
    if (!existingSettings) {
      await SiteSettings.create({
        siteName: 'Vastu Arya',
        tagline: { en: 'Transform Your Space, Transform Your Life', hi: 'अपना जीवन बदलें, अपना वास्तु बदलें' },
        phone: '+91-9999999999',
        whatsappNumber: '919999999999',
        email: 'contact@vastuarya.com',
        address: 'New Delhi, India',
        seo: { defaultTitle: 'Vastu Arya - Premium Vastu & Astrology Consultancy | IVAF Certified', defaultDescription: 'India\'s premier Vastu Shastra, Astrology, Numerology consultation platform by Dr. PPS - IVAF Certified Expert. Book appointment at just ₹11.' },
      });
      console.log('✅ Site settings seeded');
    }

    // Seed Slider
    const existingSlider = await Slider.findOne();
    if (!existingSlider) {
      await Slider.create({
        title: 'Transform Your Space, Transform Your Life',
        subtitle: 'IVAF Certified Expert Dr. PPS • 15+ Years Experience • 10,000+ Happy Clients',
        image: '/images/hero-bg.jpg',
        ctaText: '📅 Book Appointment @ ₹11',
        ctaLink: '/book-appointment',
        isActive: true,
        sortOrder: 1,
      });
      console.log('✅ Slider seeded');
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log('Admin Login: Vastuarya@Admin.com / Admin@2407@');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
