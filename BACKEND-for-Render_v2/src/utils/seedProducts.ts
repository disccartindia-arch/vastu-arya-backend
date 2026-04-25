/**
 * Vastu Arya — Sample Products Seed
 * Run once: npx ts-node src/utils/seedProducts.ts
 * Or call seedProducts() from your server startup if DB is empty.
 */
import mongoose from 'mongoose';
import Product from '../models/Product';

const SAMPLE_PRODUCTS = [
  {
    name: { en: '7 Horses on Raw Pyrite Frame', hi: 'पाइराइट फ्रेम पर 7 घोड़े' },
    slug: '7-horses-pyrite-frame',
    category: 'divine-frames',
    description: {
      en: 'The 7 Horses symbolise the energy of the Sun, driving speed, growth, fame, and prosperity in every Vastu field. This raw pyrite base amplifies wealth energy and ensures the honey-gold recognition that comes with hard work.',
      hi: '7 घोड़े सूर्य की ऊर्जा का प्रतीक हैं, जो गति, विकास, प्रसिद्धि और समृद्धि को बढ़ाते हैं।',
    },
    benefits: [
      'Boosts career growth and financial success',
      'Enhances positive energy flow in the south wall',
      'Pyrite base attracts wealth and recognition',
      'Dr. PPS recommended placement guide included',
    ],
    price: 1499,
    offerPrice: 999,
    images: [],
    stock: 48,
    sku: 'VA-DF-001',
    isFeatured: true,
    isNewLaunch: false,
    isActive: true,
    totalSold: 1238,
    rating: 4.8,
    reviewCount: 312,
  },
  {
    name: { en: 'Shree Yantra in Rose Quartz Crystal', hi: 'रोज क्वार्ट्ज श्री यंत्र' },
    slug: 'shree-yantra-rose-quartz',
    category: 'yantras',
    description: {
      en: 'Hand-carved from pure Rose Quartz, this Shree Yantra is energised with Lakshmi mantras. It activates the energy of abundance, love, and prosperity in your space. Place it facing East in your pooja room or office desk.',
      hi: 'शुद्ध रोज क्वार्ट्ज से हस्त-निर्मित यह श्री यंत्र लक्ष्मी मंत्रों से ऊर्जावान है।',
    },
    benefits: [
      'Attracts wealth, prosperity, and abundance',
      'Activates divine feminine energy',
      'Clears negative energy from your home',
      'Energised by IVAF Certified Vastu expert',
    ],
    price: 2199,
    offerPrice: 1499,
    images: [],
    stock: 22,
    sku: 'VA-YA-001',
    isFeatured: true,
    isNewLaunch: true,
    isActive: true,
    totalSold: 847,
    rating: 4.9,
    reviewCount: 198,
  },
  {
    name: { en: '5 Mukhi Rudraksha Mala (108+1 Beads)', hi: '5 मुखी रुद्राक्ष माला (108+1 दाने)' },
    slug: '5-mukhi-rudraksha-mala-108',
    category: 'rudraksha',
    description: {
      en: 'Sourced directly from Nepal, these 5 Mukhi Rudraksha beads represent Lord Shiva and Kalagni Rudra. The 108+1 bead mala is strung in red thread and energised for daily japa, meditation, and spiritual protection.',
      hi: 'नेपाल से सीधे प्राप्त ये 5 मुखी रुद्राक्ष माला भगवान शिव और कालाग्नि रुद्र का प्रतीक है।',
    },
    benefits: [
      'Calms the mind and reduces stress',
      'Boosts concentration and spiritual growth',
      'Protects against negative energies',
      'Certificate of authenticity included',
    ],
    price: 1799,
    offerPrice: 1199,
    images: [],
    stock: 65,
    sku: 'VA-RU-001',
    isFeatured: true,
    isNewLaunch: false,
    isActive: true,
    totalSold: 2140,
    rating: 4.9,
    reviewCount: 542,
  },
  {
    name: { en: 'Natural Amethyst Cluster for Positive Vibes', hi: 'प्राकृतिक एमेथिस्ट क्लस्टर' },
    slug: 'amethyst-cluster-positive-energy',
    category: 'gemstones',
    description: {
      en: 'A raw, natural Amethyst cluster weighing 150-200g. Amethyst is the stone of spiritual wisdom and inner peace. Place it in your bedroom or meditation space to cleanse the aura and invite calm, positive energy.',
      hi: '150-200 ग्राम का प्राकृतिक एमेथिस्ट क्लस्टर जो आध्यात्मिक ज्ञान और आंतरिक शांति का पत्थर है।',
    },
    benefits: [
      'Purifies negative energy from home and office',
      'Promotes restful sleep and peaceful dreams',
      'Enhances intuition and spiritual awareness',
      'Each piece is unique — natural weight variation applies',
    ],
    price: 1299,
    offerPrice: 849,
    images: [],
    stock: 31,
    sku: 'VA-GS-001',
    isFeatured: false,
    isNewLaunch: true,
    isActive: true,
    totalSold: 389,
    rating: 4.7,
    reviewCount: 95,
  },
  {
    name: { en: 'Sphatik (Crystal) Shivalinga with Vastu Guide', hi: 'स्फटिक शिवलिंग वास्तु गाइड सहित' },
    slug: 'sphatik-shivalinga-vastu',
    category: 'yantras',
    description: {
      en: 'A pure Sphatik (transparent quartz) Shivalinga of 50-60g, hand-polished and energised with Maha Mrityunjaya mantras. Comes with a detailed Vastu placement guide by Dr. PPS. Ideal for home pooja, business desk, and gift.',
      hi: '50-60 ग्राम का शुद्ध स्फटिक शिवलिंग, महामृत्युंजय मंत्र से ऊर्जावान, डॉ. PPS की वास्तु गाइड सहित।',
    },
    benefits: [
      'Removes Vastu doshas and ensures harmony',
      'Brings health, peace, and divine blessings',
      'Amplifies the energy of your pooja space',
      'Premium gift packaging available on request',
    ],
    price: 999,
    offerPrice: 699,
    images: [],
    stock: 54,
    sku: 'VA-YA-002',
    isFeatured: true,
    isNewLaunch: false,
    isActive: true,
    totalSold: 1087,
    rating: 4.8,
    reviewCount: 278,
  },
];

export async function seedProducts() {
  const count = await Product.countDocuments();
  if (count > 0) {
    console.log(`[Seed] ${count} products already exist — skipping seed.`);
    return;
  }
  await Product.insertMany(SAMPLE_PRODUCTS);
  console.log(`[Seed] ✅ Inserted ${SAMPLE_PRODUCTS.length} sample products.`);
}
