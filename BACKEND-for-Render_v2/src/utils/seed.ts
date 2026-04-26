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
    shortDesc: { en: 'Connect with Dr. PPS Tomar on WhatsApp instantly', hi: 'तुरंत डॉ. PPS से WhatsApp पर जुड़ें' },
    description: { en: 'Book your appointment with India\'s top Vastu expert Dr. PPS Tomar at just ₹11. Get connected on WhatsApp for personalized Vastu and astrology guidance. IVAF certified expert with 15+ years of experience.', hi: 'मात्र ₹11 में भारत के शीर्ष वास्तु विशेषज्ञ डॉ. PPS के साथ अपॉइंटमेंट बुक करें।' },
    originalPrice: 499,
    offerPrice: 11,
    icon: '📅',
    features: [
      { en: 'Direct WhatsApp connection with Dr. PPS Tomar', hi: 'डॉ. PPS से सीधा WhatsApp कनेक्शन' },
      { en: 'Instant response within 30 minutes', hi: '30 मिनट के अंदर तुरंत जवाब' },
      { en: 'Personalized Vastu guidance', hi: 'व्यक्तिगत वास्तु मार्गदर्शन' },
      { en: 'IVAF certified expert consultation', hi: 'IVAF प्रमाणित विशेषज्ञ परामर्श' },
    ],
    formFields: ['name', 'phone'],
    redirectType: 'razorpay',
    isActive: true,
    showOnHome: true,
    sortOrder: 1,
    seo: { title: 'Book Vastu Appointment @ ₹11 | Vastu Arya', description: 'Book your Vastu consultation appointment with Dr. PPS Tomar at just ₹11. IVAF certified expert. WhatsApp connect.', keywords: 'vastu appointment, vastu consultation, book appointment' }
  },
  {
    title: { en: 'Mobile Number Numerology', hi: 'मोबाइल नंबर अंकशास्त्र' },
    slug: 'mobile-numerology',
    category: 'numerology',
    shortDesc: { en: 'Is your mobile number lucky for you?', hi: 'क्या आपका मोबाइल नंबर आपके लिए शुभ है?' },
    description: { en: 'Find out if your mobile number aligns with your destiny. Our expert Dr. PPS Tomar will analyze your number\'s energy, vibrations, and compatibility with your birth chart. Receive a detailed PDF report covering energy analysis, career compatibility, lucky number verification, and personal recommendations.', hi: 'जानें कि क्या आपका मोबाइल नंबर आपकी किस्मत के अनुरूप है।' },
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
    seo: { title: 'Mobile Number Numerology Analysis ₹199 | Vastu Arya', description: 'Get your mobile number analyzed by Dr. PPS Tomar. Is your number lucky? Detailed PDF report at just ₹199.', keywords: 'mobile number numerology, lucky number, numerology analysis' }
  },
  {
    title: { en: 'Numerology Analysis', hi: 'अंकशास्त्र विश्लेषण' },
    slug: 'numerology-analysis',
    category: 'numerology',
    shortDesc: { en: 'Your complete numerological profile by Dr. PPS Tomar', hi: 'डॉ. PPS द्वारा आपकी संपूर्ण अंकशास्त्र प्रोफाइल' },
    description: { en: 'Get a comprehensive numerological profile that reveals your lucky numbers, favorable colors, compatible professions, and planetary influences. Dr. PPS Tomar creates a detailed grid analysis showing missing numbers, their impact, and precise remedies.', hi: 'अपनी व्यापक अंकशास्त्र प्रोफाइल प्राप्त करें जो आपके शुभ अंक, अनुकूल रंग और ग्रहीय प्रभाव बताती है।' },
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
    seo: { title: 'Numerology Analysis ₹499 | Vastu Arya', description: 'Get your complete numerological blueprint by Dr. PPS Tomar. Lucky numbers, planet analysis, remedies. Only ₹499.', keywords: 'numerology analysis, lucky numbers, numerology profile' }
  },
  {
    title: { en: 'Vastu Check & Assistant', hi: 'वास्तु जांच और सहायक' },
    slug: 'vastu-check',
    category: 'vastu',
    shortDesc: { en: 'Complete 360° Vastu analysis of your home/office', hi: 'आपके घर/कार्यालय का संपूर्ण 360° वास्तु विश्लेषण' },
    description: { en: 'The most comprehensive Vastu analysis service in India. Dr. PPS Tomar conducts a complete analysis of your space using advanced Vastu principles including Brahm Bindu, Shakti Chakra, 16-Zone analysis, and 32-Devta energy field mapping. Includes detailed report with layout recommendations.', hi: 'भारत में सबसे व्यापक वास्तु विश्लेषण सेवा।' },
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
    seo: { title: 'Complete Vastu Check ₹5100 | Vastu Arya', description: '90% OFF! Get complete Vastu analysis by IVAF expert Dr. PPS Tomar. Brahm Bindu, 16 zones, 32 Devta analysis. Was ₹51,000, now ₹5,100.', keywords: 'vastu check, vastu analysis, vastu shastra, home vastu' }
  },
  {
    title: { en: 'Smart Layout Plan', hi: 'स्मार्ट लेआउट प्लान' },
    slug: 'smart-layout',
    category: 'vastu',
    shortDesc: { en: 'Professional scale floor plan by IVAF expert', hi: 'IVAF विशेषज्ञ द्वारा पेशेवर स्केल फ्लोर प्लान' },
    description: { en: 'Get a professionally designed floor plan for your plot or flat. Dr. PPS Tomar creates a detailed scale layout showing exact placement of walls, doors, windows, and furniture according to Vastu principles. Every placement is scientifically calculated for maximum positive energy.', hi: 'अपने प्लॉट या फ्लैट के लिए पेशेवर रूप से डिजाइन किया गया फ्लोर प्लान प्राप्त करें।' },
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
    seo: { title: 'Smart Vastu Layout Plan ₹1100 | Vastu Arya', description: 'Professional floor plan by IVAF expert Dr. PPS Tomar. Scale layout, furniture placement, Vastu-compliant design. ₹1100.', keywords: 'vastu floor plan, vastu layout, house design vastu' }
  },
  {
    title: { en: 'Vastu Consultancy by Dr. PPS Tomar', hi: 'डॉ. PPS द्वारा वास्तु परामर्श' },
    slug: 'vastu-consultancy',
    category: 'consultation',
    shortDesc: { en: 'One-on-one video/call consultation with Dr. PPS Tomar', hi: 'डॉ. PPS के साथ एक-पर-एक वीडियो/कॉल परामर्श' },
    description: { en: 'The premium consultation package with India\'s leading Vastu expert. Dr. PPS Tomar personally connects with you via video/phone call to discuss your Vastu, astrology, and gemology needs. Includes access to all services. Book advance at ₹1,100 or get full access at ₹11,000.', hi: 'भारत के अग्रणी वास्तु विशेषज्ञ के साथ प्रीमियम परामर्श पैकेज।' },
    originalPrice: 11000,
    offerPrice: 1100,
    icon: '📞',
    features: [
      { en: 'Personal video/phone call with Dr. PPS Tomar', hi: 'डॉ. PPS के साथ व्यक्तिगत वीडियो/फोन कॉल' },
      { en: 'Complete Vastu analysis included', hi: 'संपूर्ण वास्तु विश्लेषण शामिल' },
      { en: 'Astrology & gemology guidance', hi: 'ज्योतिष और रत्नशास्त्र मार्गदर्शन' },
      { en: 'Lifetime guidance from IVAF expert', hi: 'IVAF विशेषज्ञ से आजीवन मार्गदर्शन' },
    ],
    formFields: ['name', 'phone', 'email'],
    redirectType: 'razorpay',
    isActive: true,
    showOnHome: true,
    sortOrder: 6,
    seo: { title: 'Vastu Consultancy by Dr. PPS Tomar | Book @ ₹1100 | Vastu Arya', description: 'Personal consultation with IVAF certified Dr. PPS Tomar. Video/phone call. Book advance at ₹1,100 or full package ₹11,000.', keywords: 'vastu consultancy, vastu expert, Dr PPS, vastu consultation' }
  },

  {
    title: { en: 'Home Energy Vastu Analysis', hi: 'घर की ऊर्जा वास्तु विश्लेषण' },
    slug: 'home-energy-analysis',
    category: 'vastu',
    shortDesc: { en: 'Comprehensive energy audit of your home using advanced Vastu principles.', hi: 'उन्नत वास्तु सिद्धांतों से आपके घर का व्यापक ऊर्जा ऑडिट।' },
    description: { en: 'A complete Vastu energy analysis of your entire home by IVAF certified Dr. Pranveer Pratap Singh Tomar. Includes analysis of all eight directions, entry points, room placements, colour energy, element balance, and non-demolition remedies. Receive a detailed written report with actionable remedies.', hi: 'IVAF प्रमाणित डॉ. पीपीएस तोमर द्वारा आपके पूरे घर का वास्तु ऊर्जा विश्लेषण।' },
    originalPrice: 3999, offerPrice: 2499, icon: '🏠',
    features: [
      { en: 'Complete 8-direction energy analysis', hi: 'पूर्ण 8-दिशा ऊर्जा विश्लेषण' },
      { en: 'Room-by-room Vastu audit', hi: 'कमरे-दर-कमरे वास्तु ऑडिट' },
      { en: 'No demolition remedies only', hi: 'बिना तोड़-फोड़ के उपाय' },
      { en: 'Written report with actionable steps', hi: 'लिखित रिपोर्ट' },
    ],
    formFields: ['name', 'phone', 'email', 'address', 'propertyType'],
    redirectType: 'razorpay', isActive: true, isFeatured: true, isNewLaunch: false, showOnHome: true, sortOrder: 7,
    seo: { title: 'Home Vastu Energy Analysis | Dr. PPS Tomar | Vastu Arya', description: 'Complete Vastu energy audit by IVAF certified Dr. PPS Tomar. 8-direction analysis, written report, no demolition remedies.', keywords: 'home vastu analysis, vastu audit, energy analysis' }
  },
  {
    title: { en: 'Business Vastu Consultation', hi: 'व्यापार वास्तु परामर्श' },
    slug: 'business-vastu',
    category: 'vastu',
    shortDesc: { en: 'Specialised Vastu for shops, offices, factories. Increase profits and remove business obstacles.', hi: 'दुकान, ऑफिस, फैक्ट्री के लिए विशेष वास्तु परामर्श।' },
    description: { en: "Business success is deeply connected to the Vastu of your commercial space. Dr. PPS Tomar's consultation covers cash box placement, entrance, seating, owner's cabin, reception, storage and all zones affecting profitability, employee harmony and customer footfall. Ideal for shops, restaurants, offices, clinics and factories.", hi: 'व्यापारिक सफलता आपके वाणिज्यिक स्थान के वास्तु से गहराई से जुड़ी है।' },
    originalPrice: 4999, offerPrice: 2999, icon: '🏢',
    features: [
      { en: 'Cash box and safe optimal placement', hi: 'कैश बॉक्स की सर्वोत्तम स्थिति' },
      { en: 'Entrance and signboard Vastu', hi: 'प्रवेश द्वार और साइनबोर्ड वास्तु' },
      { en: 'Employee seating arrangement', hi: 'कर्मचारी बैठक व्यवस्था' },
      { en: 'Customer attraction remedies', hi: 'ग्राहक आकर्षण के उपाय' },
    ],
    formFields: ['name', 'phone', 'email', 'businessType', 'address'],
    redirectType: 'razorpay', isActive: true, isFeatured: true, isNewLaunch: false, showOnHome: true, sortOrder: 8,
    seo: { title: 'Business Vastu Consultation | Increase Profits | Dr. PPS Tomar', description: 'Business Vastu consultation by Dr. PPS Tomar. Covers shop, office, factory. Increase profits and resolve employee issues.', keywords: 'business vastu, office vastu, shop vastu' }
  },
  {
    title: { en: 'Personalised Gemstone Guidance', hi: 'व्यक्तिगत रत्न मार्गदर्शन' },
    slug: 'gemstone-guidance',
    category: 'astrology',
    shortDesc: { en: 'Expert gemstone recommendation based on your birth chart by IVAF certified Dr. PPS Tomar.', hi: 'आपकी जन्म कुंडली के आधार पर विशेषज्ञ रत्न अनुशंसा।' },
    description: { en: 'Wearing the wrong gemstone can cause harm. Dr. PPS Tomar analyses your complete birth chart, current planetary periods and life goals to recommend the correct gemstone(s). Covers: which stone to wear, which finger, which metal, carat requirement, auspicious day, activation mantra, and which stones to avoid.', hi: 'गलत रत्न पहनना हानिकारक हो सकता है। डॉ. पीपीएस तोमर सही रत्न की अनुशंसा करते हैं।' },
    originalPrice: 2499, offerPrice: 1499, icon: '💎',
    features: [
      { en: 'Complete birth chart analysis', hi: 'पूर्ण जन्म कुंडली विश्लेषण' },
      { en: 'Correct gemstone recommendation', hi: 'सही रत्न की अनुशंसा' },
      { en: 'Which finger and metal to use', hi: 'कौन सी उंगली और धातु' },
      { en: 'Activation mantra and procedure', hi: 'सक्रियण मंत्र और प्रक्रिया' },
    ],
    formFields: ['name', 'phone', 'email', 'dob', 'birthTime', 'birthPlace'],
    redirectType: 'razorpay', isActive: true, isFeatured: true, isNewLaunch: true, showOnHome: true, sortOrder: 9,
    seo: { title: 'Personalised Gemstone Guidance | Dr. PPS Tomar | Vastu Arya', description: 'Expert gemstone recommendation based on birth chart by IVAF certified Dr. PPS Tomar.', keywords: 'gemstone recommendation, which gemstone to wear, gemstone astrology' }
  },
  {
    title: { en: 'Rudraksha Recommendation Session', hi: 'रुद्राक्ष अनुशंसा सत्र' },
    slug: 'rudraksha-recommendation',
    category: 'astrology',
    shortDesc: { en: 'Personalised Rudraksha recommendation by Dr. PPS Tomar based on horoscope and life goals.', hi: 'कुंडली और जीवन लक्ष्यों के आधार पर व्यक्तिगत रुद्राक्ष अनुशंसा।' },
    description: { en: 'Rudraksha effectiveness depends on choosing the right Mukhi for your chart. Dr. PPS Tomar analyses your birth chart, running dasha and specific challenges to recommend the ideal Rudraksha(s), with wearing guidelines, activation mantras, and care instructions.', hi: 'रुद्राक्ष की प्रभावशीलता सही मुखी के चुनाव पर निर्भर करती है।' },
    originalPrice: 1999, offerPrice: 1199, icon: '🌰',
    features: [
      { en: 'Horoscope-based Mukhi selection', hi: 'कुंडली आधारित मुखी चयन' },
      { en: 'Activation mantra provided', hi: 'सक्रियण मंत्र प्रदान किया गया' },
      { en: 'Care and storage instructions', hi: 'देखभाल और भंडारण निर्देश' },
      { en: 'Authentic sourcing guidance', hi: 'प्रामाणिक स्रोत मार्गदर्शन' },
    ],
    formFields: ['name', 'phone', 'email', 'dob', 'birthTime', 'birthPlace'],
    redirectType: 'razorpay', isActive: true, isFeatured: false, isNewLaunch: true, showOnHome: false, sortOrder: 10,
    seo: { title: 'Rudraksha Recommendation by Dr. PPS Tomar | Vastu Arya', description: 'Personalised Rudraksha selection based on birth chart by IVAF certified Dr. PPS Tomar.', keywords: 'rudraksha recommendation, which rudraksha to wear' }
  },
  {
    title: { en: 'New Property Vastu Check', hi: 'नई संपत्ति वास्तु जांच' },
    slug: 'new-property-vastu',
    category: 'vastu',
    shortDesc: { en: 'Check Vastu before buying or renting. Avoid costly mistakes with Dr. PPS Tomar.', hi: 'नया घर या ऑफिस खरीदने से पहले वास्तु जांच करवाएं।' },
    description: { en: 'The property you choose shapes your destiny. Before investing in a new home, plot, flat or commercial space, let Dr. PPS Tomar assess its Vastu. Submit floor plans and photographs. Receive a detailed assessment with entry, kitchen, master bedroom, toilet placements, plot shape, road-facing direction and a clear go/no-go recommendation.', hi: 'नई संपत्ति में निवेश करने से पहले वास्तु मूल्यांकन करवाएं।' },
    originalPrice: 2999, offerPrice: 1999, icon: '🏗️',
    features: [
      { en: 'Floor plan and photo analysis', hi: 'फ्लोर प्लान और फोटो विश्लेषण' },
      { en: 'Go/no-go purchase recommendation', hi: 'खरीदें/न खरीदें की सिफारिश' },
      { en: 'Entry bedroom kitchen analysis', hi: 'प्रवेश शयनकक्ष रसोई विश्लेषण' },
      { en: 'Remedy options if defects found', hi: 'दोष मिलने पर उपाय' },
    ],
    formFields: ['name', 'phone', 'email', 'propertyType', 'address'],
    redirectType: 'razorpay', isActive: true, isFeatured: false, isNewLaunch: true, showOnHome: false, sortOrder: 11,
    seo: { title: 'New Property Vastu Check | Before You Buy | Dr. PPS Tomar', description: 'Vastu assessment of new home, flat, plot or office before purchase by IVAF certified Dr. PPS Tomar.', keywords: 'new home vastu check, property vastu, plot vastu' }
  },

