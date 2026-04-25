/**
 * Vastu Arya — Complete Products Seed (45 products, 5 per category)
 * Uses UPSERT per slug — safe to run multiple times, never deletes existing products.
 */
import Product from '../models/Product';

const img = (text: string) =>
  `https://placehold.co/600x600/FFF8EE/FF6B00?text=${encodeURIComponent(text)}`;

export const SAMPLE_PRODUCTS = [

  // ─── DIVINE FRAMES ────────────────────────────────────────────────────────
  {
    name: { en: '7 Horses on Raw Pyrite Frame', hi: 'पाइराइट फ्रेम पर 7 घोड़े' },
    slug: '7-horses-pyrite-frame', category: 'divine-frames',
    description: { en: 'The 7 Horses symbolise the energy of the Sun, driving speed, growth, fame, and prosperity. Hang on the south or east wall. Each frame comes with a Dr. PPS Vastu placement guide.', hi: '7 घोड़े सूर्य की ऊर्जा का प्रतीक हैं। दक्षिण या पूर्व दीवार पर लगाएं।' },
    benefits: ['Boosts career growth & financial success', 'Enhances positive energy on south wall', 'Pyrite base attracts wealth & recognition', 'Dr. PPS placement guide included'],
    price: 1499, offerPrice: 999, images: [img('7 Horses Pyrite Frame'), img('7 Horses Side View')],
    stock: 48, sku: 'VA-DF-001', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 1238, rating: 4.8, reviewCount: 312,
  },
  {
    name: { en: 'Lord Ganesha Vastu Frame — Copper Finish', hi: 'भगवान गणेश वास्तु फ्रेम — कॉपर फिनिश' },
    slug: 'ganesha-vastu-copper-frame', category: 'divine-frames',
    description: { en: 'A premium copper-finish Lord Ganesha frame. Place at the main door facing inward to welcome prosperity and remove obstacles. Frame size: 12×14 inches.', hi: 'कॉपर फिनिश गणेश फ्रेम — प्रवेश द्वार के वास्तु दोष दूर करती है।' },
    benefits: ['Removes Vastu doshas at main entrance', 'Attracts prosperity and positive visitors', 'Copper energises and purifies aura', 'Ideal housewarming & business gift'],
    price: 1299, offerPrice: 849, images: [img('Ganesha Copper Frame'), img('Ganesha Frame Detail')],
    stock: 35, sku: 'VA-DF-002', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 876, rating: 4.9, reviewCount: 224,
  },
  {
    name: { en: 'Laxmi–Ganesha Gold-Plated Dual Frame', hi: 'लक्ष्मी–गणेश गोल्ड-प्लेटेड डुअल फ्रेम' },
    slug: 'laxmi-ganesha-gold-dual-frame', category: 'divine-frames',
    description: { en: 'A double-deity frame with Goddess Laxmi and Lord Ganesha in elegant 24K gold plating — the most auspicious pairing in Vastu Shastra. Ideal for pooja rooms, offices, and shops.', hi: '24K गोल्ड प्लेटिंग में लक्ष्मी और गणेश की दोहरी फ्रेम।' },
    benefits: ['Dual deity — wealth + wisdom', '24K gold plating resists tarnishing', 'Activates North zone for financial growth', 'Energised with Lakshmi Ganesha mantra'],
    price: 1999, offerPrice: 1299, images: [img('Laxmi Ganesha Gold Frame'), img('Gold Frame Close-up')],
    stock: 22, sku: 'VA-DF-003', isFeatured: false, isNewLaunch: true, isActive: true, totalSold: 543, rating: 4.8, reviewCount: 136,
  },
  {
    name: { en: 'Vastu Purush Yantra Frame — Blessed', hi: 'वास्तु पुरुष यंत्र फ्रेम — मंत्र सिद्ध' },
    slug: 'vastu-purush-yantra-frame', category: 'divine-frames',
    description: { en: 'The Vastu Purush yantra frame, energised by Dr. PPS, ensures that all 16 directions in your home are balanced. Place in the Brahmasthana (centre) of your home or pooja room.', hi: 'वास्तु पुरुष फ्रेम — 16 दिशाओं में ऊर्जा संतुलित करता है।' },
    benefits: ['Balances all 16 Vastu directions', 'Removes existing Vastu doshas', 'Energised and activated by Dr. PPS', 'Best for homes undergoing renovation'],
    price: 2499, offerPrice: 1599, images: [img('Vastu Purush Yantra Frame'), img('Yantra Frame Side')],
    stock: 18, sku: 'VA-DF-004', isFeatured: false, isNewLaunch: false, isActive: true, totalSold: 321, rating: 4.7, reviewCount: 89,
  },
  {
    name: { en: 'OM Symbol 3D Wooden Vastu Frame', hi: 'ओम प्रतीक 3D लकड़ी वास्तु फ्रेम' },
    slug: 'om-3d-wooden-vastu-frame', category: 'divine-frames',
    description: { en: 'A handcrafted 3D wooden OM frame made from natural sheesham (rosewood). The OM symbol is the primordial sound of the Universe. Place at home entrance or meditation room.', hi: 'शीशम लकड़ी से बनी 3D ओम फ्रेम — ध्यान कक्ष और प्रवेश द्वार के लिए।' },
    benefits: ['Hand-carved from natural sheesham wood', 'OM vibrations purify atmosphere', 'Activates spiritual energy in meditation spaces', 'Eco-friendly and chemical-free finish'],
    price: 1199, offerPrice: 799, images: [img('OM 3D Wooden Frame'), img('Wooden Frame Grain')],
    stock: 60, sku: 'VA-DF-005', isFeatured: true, isNewLaunch: true, isActive: true, totalSold: 1089, rating: 4.9, reviewCount: 287,
  },

  // ─── RUDRAKSHA ────────────────────────────────────────────────────────────
  {
    name: { en: '5 Mukhi Rudraksha Mala (108+1 Beads)', hi: '5 मुखी रुद्राक्ष माला (108+1 दाने)' },
    slug: '5-mukhi-rudraksha-mala-108', category: 'rudraksha',
    description: { en: 'Sourced directly from Nepal, these 5 Mukhi Rudraksha beads represent Lord Shiva. The 108+1 bead mala is energised for daily japa, meditation, and spiritual protection. Each bead is X-ray tested for authenticity.', hi: 'नेपाल से प्राप्त 5 मुखी रुद्राक्ष माला — भगवान शिव का प्रतीक।' },
    benefits: ['Calms mind & reduces stress', 'Boosts concentration & spiritual growth', 'Protects against negative energies', 'Certificate of authenticity included'],
    price: 1799, offerPrice: 1199, images: [img('5 Mukhi Rudraksha Mala'), img('Rudraksha Close-up')],
    stock: 65, sku: 'VA-RU-001', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 2140, rating: 4.9, reviewCount: 542,
  },
  {
    name: { en: '1 Mukhi Half Moon Rudraksha — Rare', hi: '1 मुखी अर्धचंद्र रुद्राक्ष — दुर्लभ' },
    slug: '1-mukhi-half-moon-rudraksha', category: 'rudraksha',
    description: { en: 'The rarest of all Rudraksha — the 1 Mukhi Half Moon. Ruled by the Sun, it bestows enlightenment, clarity, and supreme consciousness. Authentic lab-tested bead with certificate.', hi: '1 मुखी अर्धचंद्र रुद्राक्ष — सबसे दुर्लभ। सूर्य द्वारा शासित, आत्मज्ञान प्रदान करता है।' },
    benefits: ['Governs the Sun — health & leadership', 'Boosts clarity and decision-making', 'Lab-tested & certified authentic', 'Enhances spiritual consciousness'],
    price: 4999, offerPrice: 2999, images: [img('1 Mukhi Rudraksha'), img('Rudraksha Certificate')],
    stock: 8, sku: 'VA-RU-002', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 198, rating: 4.9, reviewCount: 67,
  },
  {
    name: { en: '7 Mukhi Rudraksha Pendant — Silver Capped', hi: '7 मुखी रुद्राक्ष पेंडेंट — सिल्वर कैप' },
    slug: '7-mukhi-rudraksha-silver-pendant', category: 'rudraksha',
    description: { en: 'A 7 Mukhi Rudraksha set in a pure silver cap with black thread. Governed by Goddess Mahalaxmi, it attracts wealth, removes financial blockages, and brings luck in business.', hi: '7 मुखी रुद्राक्ष शुद्ध चांदी कैप में — महालक्ष्मी द्वारा शासित।' },
    benefits: ['Governed by Goddess Mahalaxmi', 'Removes financial blockages', 'Pure silver cap — no nickel', 'Energised by IVAF expert Dr. PPS'],
    price: 999, offerPrice: 649, images: [img('7 Mukhi Pendant'), img('Silver Cap Detail')],
    stock: 42, sku: 'VA-RU-003', isFeatured: false, isNewLaunch: true, isActive: true, totalSold: 789, rating: 4.8, reviewCount: 198,
  },
  {
    name: { en: 'Gauri Shankar Rudraksha — Love & Unity', hi: 'गौरी शंकर रुद्राक्ष — प्रेम और एकता' },
    slug: 'gauri-shankar-rudraksha-pair', category: 'rudraksha',
    description: { en: 'A naturally joined pair symbolising the union of Shiva and Parvati. Strengthens marital bonds, promotes love, and harmonises relationships. Best for couples and newlyweds.', hi: 'गौरी शंकर रुद्राक्ष — शिव और पार्वती के मिलन का प्रतीक।' },
    benefits: ['Strengthens marital bonds', 'Promotes love & understanding', 'Best gifted to couples', 'Natural joined pair — not glued'],
    price: 2499, offerPrice: 1699, images: [img('Gauri Shankar Rudraksha'), img('Rudraksha Pair')],
    stock: 15, sku: 'VA-RU-004', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 432, rating: 4.9, reviewCount: 112,
  },
  {
    name: { en: 'Rudraksha Bracelet — 5 Mukhi (10mm)', hi: 'रुद्राक्ष ब्रेसलेट — 5 मुखी (10mm)' },
    slug: 'rudraksha-bracelet-5-mukhi-10mm', category: 'rudraksha',
    description: { en: 'A 5 Mukhi Rudraksha bracelet with 10mm large beads on elastic thread. Energised with Shiva mantras. Brings peace, focus, and protection throughout the day. Fits all wrists.', hi: '10mm के 5 मुखी रुद्राक्ष ब्रेसलेट — शांति, एकाग्रता और सुरक्षा के लिए।' },
    benefits: ['Easy to wear daily', 'Shiva mantra energised', 'Elastic thread — fits all wrists', 'Promotes calm and focus'],
    price: 799, offerPrice: 499, images: [img('Rudraksha Bracelet 5 Mukhi'), img('Bracelet Wrist View')],
    stock: 88, sku: 'VA-RU-005', isFeatured: false, isNewLaunch: true, isActive: true, totalSold: 1654, rating: 4.7, reviewCount: 421,
  },

  // ─── GEMSTONES ────────────────────────────────────────────────────────────
  {
    name: { en: 'Natural Amethyst Cluster — Positive Vibes', hi: 'प्राकृतिक एमेथिस्ट क्लस्टर' },
    slug: 'amethyst-cluster-positive-energy', category: 'gemstones',
    description: { en: 'A raw, natural Amethyst cluster (150-200g). The stone of spiritual wisdom and inner peace. Place in your bedroom or meditation space to cleanse the aura. Each piece is unique.', hi: 'प्राकृतिक एमेथिस्ट क्लस्टर (150-200g) — आध्यात्मिक ज्ञान का पत्थर।' },
    benefits: ['Purifies negative energy from home & office', 'Promotes restful sleep', 'Enhances intuition & spiritual awareness', 'Each piece unique — natural variation'],
    price: 1299, offerPrice: 849, images: [img('Amethyst Cluster'), img('Amethyst Close-up')],
    stock: 31, sku: 'VA-GS-001', isFeatured: false, isNewLaunch: true, isActive: true, totalSold: 389, rating: 4.7, reviewCount: 95,
  },
  {
    name: { en: 'Rose Quartz Heart — Love & Harmony Stone', hi: 'रोज क्वार्ट्ज हार्ट — प्रेम और सामंजस्य' },
    slug: 'rose-quartz-heart-love-stone', category: 'gemstones',
    description: { en: 'A hand-polished Rose Quartz heart (60-80g). Known as the stone of unconditional love, it opens the heart chakra and promotes love, compassion, and emotional healing.', hi: 'हाथ से पॉलिश रोज क्वार्ट्ज हार्ट — प्रेम का पत्थर।' },
    benefits: ['Opens heart chakra', 'Promotes love & compassion', 'Emotional healing stone', 'Place in SW corner for relationships'],
    price: 899, offerPrice: 599, images: [img('Rose Quartz Heart'), img('Rose Quartz Shine')],
    stock: 55, sku: 'VA-GS-002', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 723, rating: 4.8, reviewCount: 187,
  },
  {
    name: { en: 'Black Tourmaline Raw Crystal — EMF Protection', hi: 'ब्लैक टूरमालाइन — EMF सुरक्षा' },
    slug: 'black-tourmaline-emf-protection', category: 'gemstones',
    description: { en: 'A powerful raw Black Tourmaline crystal (100-150g) for EMF protection and grounding. Place near your WiFi router, TV, or computer to neutralise radiation and negative energy.', hi: 'ब्लैक टूरमालाइन — EMF विकिरण से सुरक्षा।' },
    benefits: ['Blocks harmful EMF radiation', 'Provides psychic protection', 'Grounding & stabilising energy', 'Best near electronics & WiFi routers'],
    price: 1099, offerPrice: 699, images: [img('Black Tourmaline Crystal'), img('Tourmaline Raw Form')],
    stock: 44, sku: 'VA-GS-003', isFeatured: false, isNewLaunch: false, isActive: true, totalSold: 512, rating: 4.6, reviewCount: 134,
  },
  {
    name: { en: 'Citrine Pyramid — Wealth Manifestation', hi: 'सिट्रीन पिरामिड — धन आकर्षण' },
    slug: 'citrine-pyramid-wealth', category: 'gemstones',
    description: { en: 'A natural Citrine pyramid (approx. 100g). The merchant stone — attracts money, success, and abundance. Place in the North or Northwest of your home or business for results.', hi: 'प्राकृतिक सिट्रीन पिरामिड — व्यापार और धन के लिए।' },
    benefits: ['Attracts money & business success', 'Place in North for career growth', 'Self-cleansing stone — no maintenance', 'No negative energy absorption'],
    price: 1599, offerPrice: 999, images: [img('Citrine Pyramid'), img('Citrine Pyramid Glow')],
    stock: 27, sku: 'VA-GS-004', isFeatured: true, isNewLaunch: true, isActive: true, totalSold: 634, rating: 4.8, reviewCount: 162,
  },
  {
    name: { en: 'Clear Quartz Crystal Ball (60mm) — Master Healer', hi: 'क्लियर क्वार्ट्ज क्रिस्टल बॉल (60mm)' },
    slug: 'clear-quartz-crystal-ball-60mm', category: 'gemstones',
    description: { en: 'A perfectly spherical 60mm Clear Quartz ball — the Master Healer of all crystals. It amplifies the energy of all other stones around it. Comes with wooden stand and velvet pouch.', hi: '60mm क्लियर क्वार्ट्ज क्रिस्टल बॉल — सभी क्रिस्टल का मास्टर हीलर।' },
    benefits: ['Amplifies energy of all stones', 'Raises vibration of entire room', 'Wooden stand & velvet pouch included', 'Excellent for meditation and healing'],
    price: 2199, offerPrice: 1399, images: [img('Crystal Ball 60mm'), img('Crystal Ball Refraction')],
    stock: 19, sku: 'VA-GS-005', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 445, rating: 4.9, reviewCount: 118,
  },

  // ─── YANTRAS ─────────────────────────────────────────────────────────────
  {
    name: { en: 'Shree Yantra in Rose Quartz Crystal', hi: 'रोज क्वार्ट्ज श्री यंत्र' },
    slug: 'shree-yantra-rose-quartz', category: 'yantras',
    description: { en: 'Hand-carved from pure Rose Quartz, energised with Lakshmi mantras. Activates abundance, love, and prosperity. Place facing East in your pooja room or office desk.', hi: 'शुद्ध रोज क्वार्ट्ज श्री यंत्र — लक्ष्मी मंत्र से ऊर्जावान।' },
    benefits: ['Attracts wealth & abundance', 'Activates divine feminine energy', 'Clears negative energy', 'Energised by IVAF Certified expert'],
    price: 2199, offerPrice: 1499, images: [img('Shree Yantra Rose Quartz'), img('Yantra Side View')],
    stock: 22, sku: 'VA-YA-001', isFeatured: true, isNewLaunch: true, isActive: true, totalSold: 847, rating: 4.9, reviewCount: 198,
  },
  {
    name: { en: 'Sphatik Shivalinga with Vastu Guide', hi: 'स्फटिक शिवलिंग वास्तु गाइड सहित' },
    slug: 'sphatik-shivalinga-vastu', category: 'yantras',
    description: { en: 'A pure Sphatik Shivalinga (50-60g), energised with Maha Mrityunjaya mantras. Comes with a detailed Vastu placement guide by Dr. PPS. Ideal for home pooja and office desk.', hi: 'स्फटिक शिवलिंग — महामृत्युंजय मंत्र से ऊर्जावान।' },
    benefits: ['Removes Vastu doshas', 'Health, peace & divine blessings', 'Amplifies pooja space energy', 'Premium gift packaging available'],
    price: 999, offerPrice: 699, images: [img('Sphatik Shivalinga'), img('Shivalinga Clear')],
    stock: 54, sku: 'VA-YA-002', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 1087, rating: 4.8, reviewCount: 278,
  },
  {
    name: { en: 'Kuber Yantra — North Wall Wealth Activator', hi: 'कुबेर यंत्र — उत्तर दीवार धन सक्रियक' },
    slug: 'kuber-yantra-wealth', category: 'yantras',
    description: { en: 'The most powerful tool for financial abundance. Made on copper sheet, energised with Kuber mantras by Dr. PPS. Place on the North wall to unlock the flow of wealth.', hi: 'कुबेर यंत्र — सबसे शक्तिशाली धन यंत्र। उत्तर दीवार पर लगाएं।' },
    benefits: ['Activates North zone wealth energy', 'Removes financial obstacles', 'Copper base — maximum conductivity', 'Mantra energised by Dr. PPS'],
    price: 1799, offerPrice: 1199, images: [img('Kuber Yantra Copper'), img('Yantra Mantra Detail')],
    stock: 38, sku: 'VA-YA-003', isFeatured: false, isNewLaunch: false, isActive: true, totalSold: 678, rating: 4.7, reviewCount: 176,
  },
  {
    name: { en: 'Vastu Dosh Nivaran Yantra — Full Home', hi: 'वास्तु दोष निवारण यंत्र' },
    slug: 'vastu-dosh-nivaran-yantra', category: 'yantras',
    description: { en: 'Corrects all major Vastu defects in one go. Recommended for homes with construction-level Vastu problems. Made on gold-plated copper, energised for 3 months by Dr. PPS.', hi: 'वास्तु दोष निवारण यंत्र — सभी प्रमुख वास्तु दोष ठीक करता है।' },
    benefits: ['Corrects all major Vastu defects', 'No renovation needed', 'Gold-plated copper — long lasting', 'Energised for 3 months by Dr. PPS'],
    price: 2999, offerPrice: 1999, images: [img('Vastu Dosh Yantra'), img('Gold Plated Yantra')],
    stock: 14, sku: 'VA-YA-004', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 312, rating: 4.8, reviewCount: 89,
  },
  {
    name: { en: 'Navgrah Yantra — Nine Planet Balancer', hi: 'नवग्रह यंत्र — नौ ग्रह संतुलनकर्ता' },
    slug: 'navgrah-yantra-nine-planets', category: 'yantras',
    description: { en: 'Pacifies all nine planets and removes their malefic effects. Made on pure copper, energised with all nine planetary mantras. Best combined with a Dr. PPS consultation.', hi: 'नवग्रह यंत्र — सभी नौ ग्रहों को शांत करता है।' },
    benefits: ['Pacifies all nine planets', 'Removes malefic planetary effects', 'Pure copper sheet — authentic', 'Best with Dr. PPS consultation'],
    price: 2499, offerPrice: 1699, images: [img('Navgrah Yantra'), img('Nine Planet Symbol')],
    stock: 25, sku: 'VA-YA-005', isFeatured: false, isNewLaunch: true, isActive: true, totalSold: 234, rating: 4.6, reviewCount: 67,
  },

  // ─── GEMSTONE PENDANTS ────────────────────────────────────────────────────
  {
    name: { en: 'Natural Citrine Gemstone Pendant — Gold Wire', hi: 'प्राकृतिक सिट्रीन पेंडेंट — गोल्ड वायर' },
    slug: 'citrine-gemstone-pendant-gold', category: 'gemstone-pendants',
    description: { en: 'A natural Citrine faceted pendant in gold-plated wire wrap. Citrine is the success and abundance stone. Wear to attract financial growth, boost confidence, and stay energised.', hi: 'प्राकृतिक सिट्रीन पेंडेंट — सफलता और समृद्धि के लिए।' },
    benefits: ['Attracts financial success', 'Boosts confidence & self-esteem', 'Gold-plated wire — hypoallergenic', 'Certificate of natural gemstone'],
    price: 3500, offerPrice: 1750, images: [img('Citrine Gold Pendant'), img('Pendant Worn View')],
    stock: 25, sku: 'VA-GP-001', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 567, rating: 4.8, reviewCount: 143,
  },
  {
    name: { en: 'Amethyst Teardrop Pendant — Calming Energy', hi: 'एमेथिस्ट टियरड्रॉप पेंडेंट' },
    slug: 'amethyst-teardrop-pendant', category: 'gemstone-pendants',
    description: { en: 'A genuine Amethyst teardrop pendant in sterling silver setting. Calms the mind, improves sleep, and enhances intuition. Ideal for students, spiritual seekers, and anyone with anxiety.', hi: 'असली एमेथिस्ट पेंडेंट स्टर्लिंग सिल्वर में — मन को शांत करता है।' },
    benefits: ['Calms anxiety & overthinking', 'Improves sleep quality', 'Sterling silver — certified', 'Best for students & meditators'],
    price: 1999, offerPrice: 1299, images: [img('Amethyst Teardrop Pendant'), img('Silver Setting Detail')],
    stock: 33, sku: 'VA-GP-002', isFeatured: false, isNewLaunch: true, isActive: true, totalSold: 389, rating: 4.7, reviewCount: 98,
  },
  {
    name: { en: 'Rose Quartz Oval Pendant — Love Magnet', hi: 'रोज क्वार्ट्ज ओवल पेंडेंट — प्रेम आकर्षक' },
    slug: 'rose-quartz-oval-pendant', category: 'gemstone-pendants',
    description: { en: 'A polished Rose Quartz oval pendant in rose-gold plated brass. Wear to open your heart chakra, attract love, and heal emotional wounds. Beautiful jewellery and healing tool in one.', hi: 'रोज क्वार्ट्ज पेंडेंट — हृदय चक्र खोलता है, प्रेम आकर्षित करता है।' },
    benefits: ['Opens heart chakra', 'Attracts love & relationships', 'Rose-gold plating — tarnish-resistant', 'Emotional healing & self-love'],
    price: 1499, offerPrice: 899, images: [img('Rose Quartz Pendant'), img('Rose Quartz Glow')],
    stock: 48, sku: 'VA-GP-003', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 712, rating: 4.8, reviewCount: 187,
  },
  {
    name: { en: 'Labradorite Cabochon Pendant — Intuition Stone', hi: 'लैब्राडोराइट पेंडेंट — अंतर्ज्ञान का पत्थर' },
    slug: 'labradorite-cabochon-pendant', category: 'gemstone-pendants',
    description: { en: 'A stunning Labradorite cabochon pendant with magical blue-green flash. Enhances psychic abilities, protects the aura, and stimulates creative thinking. Set in oxidised silver.', hi: 'लैब्राडोराइट पेंडेंट — मानसिक क्षमताएं बढ़ाता है, आभा की रक्षा करता है।' },
    benefits: ['Enhances intuition & psychic ability', 'Protects aura from energy drains', 'Stimulates creativity', 'Unique labradorescence in every piece'],
    price: 2299, offerPrice: 1499, images: [img('Labradorite Pendant'), img('Labradorite Flash')],
    stock: 20, sku: 'VA-GP-004', isFeatured: false, isNewLaunch: true, isActive: true, totalSold: 245, rating: 4.9, reviewCount: 72,
  },
  {
    name: { en: 'Green Aventurine Pendant — Luck & Prosperity', hi: 'ग्रीन एवेंचुरीन पेंडेंट — भाग्य और समृद्धि' },
    slug: 'green-aventurine-pendant-luck', category: 'gemstone-pendants',
    description: { en: 'Natural Green Aventurine pendant in gold-filled wire. The stone of opportunity — manifests prosperity and luck. Wear during job interviews, business meetings, or exams.', hi: 'ग्रीन एवेंचुरीन पेंडेंट — अवसर और सौभाग्य का पत्थर।' },
    benefits: ['Manifests luck & opportunity', 'Boosts confidence in challenges', 'Gold-filled wire — durable', 'Best for students & job seekers'],
    price: 1299, offerPrice: 799, images: [img('Green Aventurine Pendant'), img('Aventurine Sparkle')],
    stock: 56, sku: 'VA-GP-005', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 934, rating: 4.7, reviewCount: 234,
  },

  // ─── BOX BRACELET ─────────────────────────────────────────────────────────
  {
    name: { en: '7 Chakra Box Bracelet — Energy Balance', hi: '7 चक्र बॉक्स ब्रेसलेट — ऊर्जा संतुलन' },
    slug: '7-chakra-box-bracelet', category: 'box-bracelet',
    description: { en: 'A 7 Chakra Box Bracelet featuring 7 genuine gemstone beads representing each chakra. Balances all energy centres from Root to Crown. Premium gift box — perfect for self-care or gifting.', hi: '7 चक्र बॉक्स ब्रेसलेट — सभी 7 ऊर्जा केंद्रों को संतुलित करता है।' },
    benefits: ['Balances all 7 chakras', '7 genuine gemstone beads', 'Premium gift box included', 'Suitable for men and women'],
    price: 1499, offerPrice: 899, images: [img('7 Chakra Box Bracelet'), img('Chakra Stones Detail')],
    stock: 72, sku: 'VA-BB-001', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 1876, rating: 4.8, reviewCount: 478,
  },
  {
    name: { en: 'Tiger Eye Box Bracelet — Confidence & Power', hi: 'टाइगर आई बॉक्स ब्रेसलेट — आत्मविश्वास' },
    slug: 'tiger-eye-box-bracelet', category: 'box-bracelet',
    description: { en: 'A premium Tiger Eye bead bracelet in a luxury gift box. The stone of courage, confidence, and clarity. Wear to overcome fear, make bold decisions, and achieve your goals.', hi: 'टाइगर आई ब्रेसलेट — साहस, आत्मविश्वास और स्पष्टता का पत्थर।' },
    benefits: ['Boosts confidence & courage', 'Sharpens decision-making', 'Protects from negative energy', 'Luxury gift box included'],
    price: 1199, offerPrice: 749, images: [img('Tiger Eye Box Bracelet'), img('Tiger Eye Shine')],
    stock: 64, sku: 'VA-BB-002', isFeatured: false, isNewLaunch: true, isActive: true, totalSold: 1123, rating: 4.7, reviewCount: 289,
  },
  {
    name: { en: 'Black Obsidian Protection Box Bracelet', hi: 'ब्लैक ओब्सीडियन प्रोटेक्शन ब्रेसलेट' },
    slug: 'black-obsidian-protection-bracelet', category: 'box-bracelet',
    description: { en: 'Black Obsidian bracelet in premium gift box. The ultimate protection stone — creates a shield against negativity, psychic attacks, and bad intentions. 8mm volcanic glass beads.', hi: 'ब्लैक ओब्सीडियन ब्रेसलेट — नकारात्मकता और बुरी नजर से पूर्ण सुरक्षा।' },
    benefits: ['Complete protection from negativity', 'Shields against psychic attacks', 'Grounding volcanic glass stone', 'Premium gift box & auth. card'],
    price: 999, offerPrice: 649, images: [img('Black Obsidian Bracelet'), img('Obsidian Bracelet Box')],
    stock: 83, sku: 'VA-BB-003', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 2134, rating: 4.8, reviewCount: 547,
  },
  {
    name: { en: 'Amethyst Healing Box Bracelet — Calm Mind', hi: 'एमेथिस्ट हीलिंग ब्रेसलेट — शांत मन' },
    slug: 'amethyst-healing-box-bracelet', category: 'box-bracelet',
    description: { en: 'An Amethyst bead bracelet in luxury gift box with healing card. Soothes anxiety, stops overthinking, and brings mental clarity. Excellent for exam-stressed students and corporate professionals.', hi: 'एमेथिस्ट ब्रेसलेट — मन को शांत करता है, तनाव में सहायक।' },
    benefits: ['Soothes anxiety & overthinking', 'Mental clarity & focus', 'Healing card included', 'Best for students & professionals'],
    price: 1099, offerPrice: 699, images: [img('Amethyst Healing Bracelet'), img('Amethyst Bracelet Box')],
    stock: 59, sku: 'VA-BB-004', isFeatured: false, isNewLaunch: true, isActive: true, totalSold: 876, rating: 4.7, reviewCount: 223,
  },
  {
    name: { en: 'Rose Quartz Love Box Bracelet — Gift Set', hi: 'रोज क्वार्ट्ज लव ब्रेसलेट गिफ्ट सेट' },
    slug: 'rose-quartz-love-bracelet-gift', category: 'box-bracelet',
    description: { en: 'Rose Quartz bead bracelet gift set including bracelet, matching pendant, and a love crystal card. Opens the heart and attracts love. Perfect Valentine\'s Day, anniversary, or wedding gift.', hi: 'रोज क्वार्ट्ज लव गिफ्ट सेट — ब्रेसलेट, पेंडेंट, और लव क्रिस्टल कार्ड।' },
    benefits: ['Complete love crystal set', 'Opens heart chakra', 'Bracelet + pendant combo', 'Perfect for Valentine & anniversaries'],
    price: 1999, offerPrice: 1199, images: [img('Rose Quartz Gift Set'), img('Love Bracelet Set')],
    stock: 41, sku: 'VA-BB-005', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 1098, rating: 4.9, reviewCount: 312,
  },

  // ─── SACRED MALA ─────────────────────────────────────────────────────────
  {
    name: { en: 'Tulsi Mala — 108 Beads for Vishnu Bhaktas', hi: 'तुलसी माला — 108 दाने' },
    slug: 'tulsi-mala-108-vishnu', category: 'sacred-mala',
    description: { en: 'A sacred Tulsi mala with 108 genuine tulsi beads in red cotton thread. Purifies the aura, removes sins, and bestows divine blessings. Especially recommended for Vishnu and Krishna devotees.', hi: 'शुद्ध तुलसी माला 108 दानों के साथ — विष्णु भक्तों के लिए।' },
    benefits: ['Sacred for Vishnu & Krishna devotees', 'Purifies aura & removes negativity', 'Genuine tulsi — certificate included', 'Best for daily japa & meditation'],
    price: 599, offerPrice: 399, images: [img('Tulsi Mala 108'), img('Tulsi Bead Close-up')],
    stock: 120, sku: 'VA-SM-001', isFeatured: false, isNewLaunch: false, isActive: true, totalSold: 3456, rating: 4.9, reviewCount: 876,
  },
  {
    name: { en: 'Sphatik Mala — 108 Crystal Beads', hi: 'स्फटिक माला — 108 क्रिस्टल दाने' },
    slug: 'sphatik-mala-108-crystal', category: 'sacred-mala',
    description: { en: 'A pure Sphatik (clear quartz crystal) mala with 108+1 beads. Used for japa of all deities and especially recommended for chanting Devi mantras. Keeps the mind cool during meditation.', hi: 'शुद्ध स्फटिक माला 108+1 दानों के साथ — सभी देवी मंत्र जप के लिए।' },
    benefits: ['Suitable for all deity mantras', 'Keeps mind cool during japa', 'Each bead natural, no synthetic', 'Ideal for Devi & Shiva mantras'],
    price: 1299, offerPrice: 899, images: [img('Sphatik Crystal Mala'), img('Crystal Mala Shine')],
    stock: 78, sku: 'VA-SM-002', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 1567, rating: 4.8, reviewCount: 398,
  },
  {
    name: { en: 'Chandan (Sandalwood) Mala — 108 Beads', hi: 'चंदन माला — 108 दाने' },
    slug: 'chandan-sandalwood-mala-108', category: 'sacred-mala',
    description: { en: 'A fragrant Chandan (white sandalwood) mala with 108+1 handcrafted beads. The natural fragrance enhances focus during japa. Recommended for Gayatri Mantra, Ram Naam, and Hanuman mantras.', hi: 'असली चंदन की खुशबू वाली माला — गायत्री, राम नाम और हनुमान मंत्र के लिए।' },
    benefits: ['Natural sandalwood fragrance', 'Enhances focus during japa', 'Best for Gayatri & Ram mantras', 'Handcrafted 108+1 beads'],
    price: 899, offerPrice: 599, images: [img('Sandalwood Mala 108'), img('Chandan Mala Fragrant')],
    stock: 95, sku: 'VA-SM-003', isFeatured: false, isNewLaunch: true, isActive: true, totalSold: 2234, rating: 4.8, reviewCount: 567,
  },
  {
    name: { en: 'Lotus Seed Kamal Gatta Mala — Laxmi Japa', hi: 'कमल गट्टा माला — लक्ष्मी जप' },
    slug: 'lotus-seed-kamal-gatta-mala', category: 'sacred-mala',
    description: { en: 'A sacred Kamal Gatta (Lotus seed) mala with 108 beads — the mala of Goddess Lakshmi. Chanting Laxmi mantras on this mala brings exceptional wealth and prosperity. Ideal for business owners.', hi: 'कमल गट्टा माला — देवी लक्ष्मी की माला। व्यापारियों के लिए सर्वोत्तम।' },
    benefits: ['Goddess Lakshmi\'s own mala', 'Best for wealth & business mantras', 'Natural lotus seeds — authentic', 'Ideal for traders & entrepreneurs'],
    price: 799, offerPrice: 499, images: [img('Lotus Seed Mala'), img('Kamal Gatta Close-up')],
    stock: 88, sku: 'VA-SM-004', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 2876, rating: 4.9, reviewCount: 712,
  },
  {
    name: { en: 'Rudraksha Sphatik Combination Mala', hi: 'रुद्राक्ष स्फटिक संयोजन माला' },
    slug: 'rudraksha-sphatik-combination-mala', category: 'sacred-mala',
    description: { en: 'A unique combination mala alternating Rudraksha and Sphatik beads — giving the power of both Lord Shiva (protection) and Goddess Shakti (abundance). 108 beads, energised by Dr. PPS.', hi: 'रुद्राक्ष और स्फटिक की संयुक्त माला — शिव और शक्ति की दोहरी ऊर्जा।' },
    benefits: ['Shiva + Shakti dual power', 'Protection + Prosperity together', 'Energised by Dr. PPS IVAF', 'Perfect balance of 54+54 beads'],
    price: 1599, offerPrice: 1099, images: [img('Rudraksha Sphatik Mala'), img('Combination Mala Detail')],
    stock: 45, sku: 'VA-SM-005', isFeatured: true, isNewLaunch: true, isActive: true, totalSold: 765, rating: 4.8, reviewCount: 198,
  },

  // ─── MURTHY ───────────────────────────────────────────────────────────────
  {
    name: { en: 'Ganesha Marble Murti — Handcrafted', hi: 'गणेश मार्बल मूर्ति — हस्तनिर्मित' },
    slug: 'ganesha-marble-murti-handcrafted', category: 'murthy',
    description: { en: 'A hand-chiselled Ganesha murti in white Makrana marble — the same marble used in the Taj Mahal. 5 inches. Includes a red velvet seat and placement guide by Dr. PPS.', hi: 'मकराना संगमरमर की हस्तनिर्मित गणेश मूर्ति — 5 इंच।' },
    benefits: ['Removes all obstacles', 'Makrana marble — premium quality', 'Velvet seat & placement guide included', 'Vastu recommended — east facing'],
    price: 2499, offerPrice: 1599, images: [img('Ganesha Marble Murti'), img('Marble Murti Detail')],
    stock: 28, sku: 'VA-MU-001', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 567, rating: 4.9, reviewCount: 145,
  },
  {
    name: { en: 'Lakshmi Brass Murti — 6 Inch Puja Grade', hi: 'लक्ष्मी पीतल मूर्ति — 6 इंच पूजा ग्रेड' },
    slug: 'lakshmi-brass-murti-6inch', category: 'murthy',
    description: { en: 'A puja-grade Goddess Lakshmi brass murti — 6 inches tall, approx. 400g. Traditional Dhokra process, gold-antique finish. Install on the North wall during pooja for wealth and grace.', hi: '6 इंच लक्ष्मी पीतल मूर्ति — धोकरा प्रक्रिया से निर्मित।' },
    benefits: ['Puja-grade heavy brass — 400g', 'Traditional Dhokra casting', 'Gold antique finish — elegant', 'North wall placement for wealth'],
    price: 1999, offerPrice: 1299, images: [img('Lakshmi Brass Murti 6 Inch'), img('Lakshmi Murti Gold')],
    stock: 35, sku: 'VA-MU-002', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 789, rating: 4.8, reviewCount: 201,
  },
  {
    name: { en: 'Hanuman Panchmukhi Silver-Plated Murti', hi: 'पंचमुखी हनुमान सिल्वर प्लेटेड मूर्ति' },
    slug: 'hanuman-panchmukhi-silver-murti', category: 'murthy',
    description: { en: 'The Panchmukhi (5-faced) Hanuman for maximum protection and courage. Silver-plated brass, 5 inches. Dr. PPS recommends placing in the South zone of home or on the car dashboard.', hi: '5 इंच पंचमुखी हनुमान — सुरक्षा और साहस के लिए।' },
    benefits: ['Panchmukhi — maximum protection', 'Silver-plated brass — tarnish-resistant', 'Car dashboard & home — versatile', 'South zone Vastu placement'],
    price: 1799, offerPrice: 1199, images: [img('Panchmukhi Hanuman Murti'), img('Hanuman Silver Murti')],
    stock: 42, sku: 'VA-MU-003', isFeatured: false, isNewLaunch: true, isActive: true, totalSold: 623, rating: 4.9, reviewCount: 167,
  },
  {
    name: { en: 'Shiva Nataraja Bronze Murti — 4 Inch', hi: 'शिव नटराज कांस्य मूर्ति — 4 इंच' },
    slug: 'shiva-nataraja-bronze-4inch', category: 'murthy',
    description: { en: 'A traditional Nataraja (dancing Shiva) murti cast in bronze. Symbolises the cosmic dance of creation and destruction. Place in the West zone for artistic growth and spiritual power.', hi: 'कांस्य शिव नटराज — ब्रह्मांडीय नृत्य का प्रतीक।' },
    benefits: ['Bronze cast — museum quality', 'Promotes creativity & art', 'West zone Vastu placement', 'Symbol of divine dance & power'],
    price: 2199, offerPrice: 1499, images: [img('Nataraja Bronze Murti'), img('Nataraja Dance Pose')],
    stock: 22, sku: 'VA-MU-004', isFeatured: false, isNewLaunch: false, isActive: true, totalSold: 321, rating: 4.7, reviewCount: 87,
  },
  {
    name: { en: 'Kuber Murti — Wealth God Brass Idol', hi: 'कुबेर मूर्ति — धन के देव पीतल' },
    slug: 'kuber-murti-wealth-brass', category: 'murthy',
    description: { en: 'Lord Kuber — the treasurer of the Gods. This brass Kuber murti (5 inches, 300g) is Vastu-activated. Place on the North wall to continuously attract and retain wealth at home or business.', hi: 'धन के देव कुबेर पीतल मूर्ति — उत्तर दीवार पर रखें।' },
    benefits: ['Attracts & retains wealth', 'North zone Vastu placement', 'Heavy brass 300g — premium', 'Activated for wealth magnetism'],
    price: 1599, offerPrice: 1099, images: [img('Kuber Brass Murti'), img('Kuber Murti Detail')],
    stock: 31, sku: 'VA-MU-005', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 456, rating: 4.8, reviewCount: 119,
  },

  // ─── SHOP BY RASHI ────────────────────────────────────────────────────────
  {
    name: { en: 'Mesh Rashi (Aries) Crystal Kit', hi: 'मेष राशि क्रिस्टल किट' },
    slug: 'mesh-rashi-aries-crystal-kit', category: 'rashi',
    description: { en: 'A curated crystal kit for Mesh Rashi (Aries, Mar 21 – Apr 19). Includes Bloodstone for courage, Red Jasper for energy, and Clear Quartz for clarity. Personalised Rashi card & placement guide included.', hi: 'मेष राशि के लिए क्रिस्टल किट — ब्लडस्टोन, रेड जैस्पर, क्लियर क्वार्ट्ज।' },
    benefits: ['3 curated crystals for Mesh Rashi', 'Personalised Rashi card included', 'Dr. PPS usage guide', 'Activates Mars energy (ruler of Aries)'],
    price: 1499, offerPrice: 999, images: [img('Mesh Rashi Crystal Kit'), img('Aries Crystal Set')],
    stock: 40, sku: 'VA-RS-001', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 456, rating: 4.7, reviewCount: 118,
  },
  {
    name: { en: 'Vrishabha Rashi (Taurus) Healing Kit', hi: 'वृषभ राशि हीलिंग किट' },
    slug: 'vrishabha-rashi-taurus-healing-kit', category: 'rashi',
    description: { en: 'A Vrishabha Rashi crystal healing kit for Taurus (Apr 20 – May 20). Includes Rose Quartz for love, Green Aventurine for prosperity, and Malachite for growth. Venus-energy crystals curated by Dr. PPS.', hi: 'वृषभ राशि के लिए क्रिस्टल किट — रोज क्वार्ट्ज, ग्रीन एवेंचुरीन, मैलाकाइट।' },
    benefits: ['3 Venus-energy crystals', 'Boosts love & financial growth', 'Personalised Rashi guidance', 'Ideal for stable sign individuals'],
    price: 1499, offerPrice: 999, images: [img('Taurus Rashi Crystal Kit'), img('Taurus Crystal Stones')],
    stock: 35, sku: 'VA-RS-002', isFeatured: false, isNewLaunch: true, isActive: true, totalSold: 312, rating: 4.8, reviewCount: 89,
  },
  {
    name: { en: 'Mithun Rashi (Gemini) Mercury Kit', hi: 'मिथुन राशि मर्करी किट' },
    slug: 'mithun-rashi-gemini-mercury-kit', category: 'rashi',
    description: { en: 'Mithun Rashi kit for Gemini (May 21 – Jun 20). Includes Agate for communication, Blue Lace Agate for clarity of speech, and Citrine for mental agility. Mercury-activated crystals for the quick-minded Gemini.', hi: 'मिथुन राशि के लिए मर्करी क्रिस्टल किट।' },
    benefits: ['Mercury-activated crystals', 'Enhances communication skills', 'Boosts mental agility', 'Best for writers, speakers & traders'],
    price: 1499, offerPrice: 999, images: [img('Gemini Rashi Crystal Kit'), img('Mercury Crystal Set')],
    stock: 38, sku: 'VA-RS-003', isFeatured: false, isNewLaunch: false, isActive: true, totalSold: 278, rating: 4.7, reviewCount: 74,
  },
  {
    name: { en: 'Karka Rashi (Cancer) Moon Energy Kit', hi: 'कर्क राशि मून एनर्जी किट' },
    slug: 'karka-rashi-cancer-moon-kit', category: 'rashi',
    description: { en: 'Karka Rashi Moon Energy Kit for Cancer (Jun 21 – Jul 22). Includes Moonstone for intuition, Pearl for calm, and Selenite for protection. Moon-activated, perfect for emotionally sensitive Cancer natives.', hi: 'कर्क राशि मून किट — मूनस्टोन, पर्ल, सेलेनाइट।' },
    benefits: ['Moon-activated crystals', 'Soothes emotional sensitivity', 'Enhances intuition & empathy', 'Moonstone + Pearl combo — rare'],
    price: 1799, offerPrice: 1199, images: [img('Cancer Moon Crystal Kit'), img('Moonstone Pearl Set')],
    stock: 29, sku: 'VA-RS-004', isFeatured: true, isNewLaunch: false, isActive: true, totalSold: 345, rating: 4.9, reviewCount: 92,
  },
  {
    name: { en: 'Simha Rashi (Leo) Sun Power Kit', hi: 'सिंह राशि सन पावर किट' },
    slug: 'simha-rashi-leo-sun-power-kit', category: 'rashi',
    description: { en: 'Simha Rashi Sun Power Kit for Leo (Jul 23 – Aug 22). Includes Pyrite for power and recognition, Sunstone for leadership, and Tiger Eye for courage. Sun-activated for the natural-born leader.', hi: 'सिंह राशि के लिए सन पावर किट — पाइराइट, सनस्टोन, टाइगर आई।' },
    benefits: ['Sun-activated power crystals', 'Boosts leadership & recognition', 'Strengthens self-expression', 'Pyrite + Tiger Eye — career combo'],
    price: 1699, offerPrice: 1099, images: [img('Leo Sun Power Crystal Kit'), img('Leo Crystals Shine')],
    stock: 33, sku: 'VA-RS-005', isFeatured: true, isNewLaunch: true, isActive: true, totalSold: 421, rating: 4.8, reviewCount: 108,
  },
];

/**
 * Upserts all sample products by slug — safe to run multiple times.
 * Adds missing products, never deletes or overwrites existing ones you've edited.
 */
export async function seedProducts() {
  let inserted = 0;
  let skipped = 0;

  for (const product of SAMPLE_PRODUCTS) {
    const exists = await Product.findOne({ slug: product.slug });
    if (exists) {
      skipped++;
    } else {
      await Product.create(product);
      inserted++;
    }
  }

  console.log(`[Seed] ✅ Products: ${inserted} inserted, ${skipped} already existed.`);
  return { inserted, skipped };
}
