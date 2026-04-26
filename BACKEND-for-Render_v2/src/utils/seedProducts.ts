/// <reference types="node" />
/**
 * Vastu Arya — Complete Products Seed (65 products)
 * Upsert per slug — safe to run multiple times.
 */
import Product from '../models/Product';

// Curated real Unsplash images by product type (stable, free, no API key needed)
const IMGS = {
  pyrite_raw:    ['https://images.unsplash.com/photo-1617142108319-2fbf37afb4a4?w=600&h=600&fit=crop&q=80','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&q=80'],
  pyrite:        ['https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=600&h=600&fit=crop&q=80'],
  chakra:        ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop&q=80','https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=600&fit=crop&q=80'],
  aquamarine:    ['https://images.unsplash.com/photo-1519568470290-c0c1dfd7c29a?w=600&h=600&fit=crop&q=80'],
  black_stone:   ['https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=600&h=600&fit=crop&q=80','https://images.unsplash.com/photo-1573408301185-9519f94dca74?w=600&h=600&fit=crop&q=80'],
  turquoise:     ['https://images.unsplash.com/photo-1499887142886-791eca5918cd?w=600&h=600&fit=crop&q=80'],
  agate:         ['https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=600&h=600&fit=crop&q=80'],
  clear_quartz:  ['https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=600&h=600&fit=crop&q=80','https://images.unsplash.com/photo-1602524816763-cd6ad1a3553a?w=600&h=600&fit=crop&q=80'],
  cats_eye:      ['https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=600&h=600&fit=crop&q=80'],
  citrine:       ['https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?w=600&h=600&fit=crop&q=80','https://images.unsplash.com/photo-1604324809475-7c2765b7d08a?w=600&h=600&fit=crop&q=80'],
  red_jasper:    ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=600&fit=crop&q=80'],
  lapis:         ['https://images.unsplash.com/photo-1614436163996-25cee5f54290?w=600&h=600&fit=crop&q=80'],
  aventurine:    ['https://images.unsplash.com/photo-1611599537845-1c7aca0091c0?w=600&h=600&fit=crop&q=80'],
  sodalite:      ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop&q=80'],
  sunstone:      ['https://images.unsplash.com/photo-1596920566408-4e5dde57e935?w=600&h=600&fit=crop&q=80'],
  moonstone:     ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&q=80'],
  lava:          ['https://images.unsplash.com/photo-1573408301185-9519f94dca74?w=600&h=600&fit=crop&q=80'],
  dhanyog:       ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop&q=80'],
  rose_quartz:   ['https://images.unsplash.com/photo-1596463059283-da257325bab8?w=600&h=600&fit=crop&q=80','https://images.unsplash.com/photo-1614097360591-f9b3a4e9d6b6?w=600&h=600&fit=crop&q=80'],
  selenite:      ['https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=600&h=600&fit=crop&q=80','https://images.unsplash.com/photo-1604497181015-76590d828b73?w=600&h=600&fit=crop&q=80'],
  sapphire_blue: ['https://images.unsplash.com/photo-1629224316810-9d8805b95f10?w=600&h=600&fit=crop&q=80'],
  sapphire_yel:  ['https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=600&h=600&fit=crop&q=80'],
  ruby:          ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=600&fit=crop&q=80'],
  coral:         ['https://images.unsplash.com/photo-1583338917451-face2751d8d5?w=600&h=600&fit=crop&q=80'],
  pearl:         ['https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&h=600&fit=crop&q=80'],
  emerald:       ['https://images.unsplash.com/photo-1611599537845-1c7aca0091c0?w=600&h=600&fit=crop&q=80'],
  moissanite:    ['https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=600&h=600&fit=crop&q=80'],
  hessonite:     ['https://images.unsplash.com/photo-1596920566408-4e5dde57e935?w=600&h=600&fit=crop&q=80'],
  diamond:       ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop&q=80'],
  rudraksha:     ['https://images.unsplash.com/photo-1614436163996-25cee5f54290?w=600&h=600&fit=crop&q=80','https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=600&h=600&fit=crop&q=80'],
  mala:          ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=600&fit=crop&q=80','https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop&q=80'],
  tulsi:         ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&q=80'],
  horses:        ['https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&h=600&fit=crop&q=80','https://images.unsplash.com/photo-1599240211563-17b5f4b40af7?w=600&h=600&fit=crop&q=80'],
  frame:         ['https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=600&h=600&fit=crop&q=80'],
  pyramid:       ['https://images.unsplash.com/photo-1596463059283-da257325bab8?w=600&h=600&fit=crop&q=80'],
  money_bowl:    ['https://images.unsplash.com/photo-1604324809475-7c2765b7d08a?w=600&h=600&fit=crop&q=80'],
  crystal_tree:  ['https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&h=600&fit=crop&q=80'],
  sphere:        ['https://images.unsplash.com/photo-1602524816763-cd6ad1a3553a?w=600&h=600&fit=crop&q=80','https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=600&h=600&fit=crop&q=80'],
};

export const ALL_PRODUCTS = [
  // ── BRACELETS (22) ────────────────────────────────────────────
  { name:{en:'Raw Pyrite Bracelet',hi:'कच्चा पाइराइट ब्रेसलेट'}, slug:'raw-pyrite-bracelet', category:'bracelets',
    description:{en:'Natural raw Pyrite nugget bracelet — the Fool\'s Gold — one of the most powerful wealth-attraction crystals. Activates solar plexus chakra, amplifying willpower, ambition and financial magnetism. Wear on right wrist for career and business growth.',hi:'कच्चे पाइराइट नगेट ब्रेसलेट — धन और सफलता आकर्षित करता है।'},
    benefits:['Attracts wealth & financial abundance','Activates solar plexus chakra','Boosts confidence & willpower','Shields from negative energy & envy'],
    price:899, offerPrice:599, images:IMGS.pyrite_raw, stock:75, sku:'VA-BR-001', isFeatured:true, isNewLaunch:false, isActive:true, totalSold:1243, rating:4.8, reviewCount:312 },

  { name:{en:'Polished Pyrite Bracelet',hi:'पॉलिश पाइराइट ब्रेसलेट'}, slug:'polished-pyrite-bracelet', category:'bracelets',
    description:{en:'High-shine polished Pyrite sphere bead bracelet — 8mm beads on durable elastic. Ideal for professionals, entrepreneurs and businesspeople seeking financial growth and recognition.',hi:'चमकदार पॉलिश पाइराइट बीड ब्रेसलेट — व्यापारियों के लिए।'},
    benefits:['Reflects & repels negative energy','Solar plexus chakra activator','Boosts leadership & confidence','Business & career growth'],
    price:999, offerPrice:699, images:IMGS.pyrite, stock:60, sku:'VA-BR-002', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:876, rating:4.7, reviewCount:221 },

  { name:{en:'7 Chakra Bracelet',hi:'7 चक्र ब्रेसलेट'}, slug:'7-chakra-bracelet', category:'bracelets',
    description:{en:'Seven genuine crystal beads representing each energy centre: Amethyst, Lapis, Sodalite, Aventurine, Citrine, Carnelian, Red Jasper. Balances all chakras for holistic wellbeing.',hi:'7 असली क्रिस्टल बीड — हर चक्र को संतुलित करता है।'},
    benefits:['Balances all 7 chakras','7 genuine natural crystal beads','Holistic energy alignment','Reduces anxiety & stress'],
    price:1199, offerPrice:799, images:IMGS.chakra, stock:95, sku:'VA-BR-003', isFeatured:true, isNewLaunch:false, isActive:true, totalSold:2134, rating:4.9, reviewCount:534 },

  { name:{en:'Aquamarine Bracelet',hi:'एक्वामेरीन ब्रेसलेट'}, slug:'aquamarine-bracelet', category:'bracelets',
    description:{en:'Natural Aquamarine — the Stone of Courage and Communication. Serene ocean-blue colour calms the mind, opens throat chakra. Excellent for speakers, teachers and travellers.',hi:'एक्वामेरीन — साहस और संचार का पत्थर।'},
    benefits:['Opens throat chakra','Calms anxiety & promotes courage','Protection during travel','Enhances self-expression'],
    price:1499, offerPrice:999, images:IMGS.aquamarine, stock:45, sku:'VA-BR-004', isFeatured:false, isNewLaunch:true, isActive:true, totalSold:423, rating:4.7, reviewCount:108 },

  { name:{en:'Black Tourmaline Bracelet',hi:'ब्लैक टूरमालाइन ब्रेसलेट'}, slug:'black-tourmaline-bracelet', category:'bracelets',
    description:{en:'Black Tourmaline — premier protective crystal. Forms a psychic shield around your aura, repelling negative energy, EMF radiation and ill intentions. Wear on left wrist.',hi:'ब्लैक टूरमालाइन — सबसे शक्तिशाली सुरक्षा क्रिस्टल।'},
    benefits:['Complete psychic protection','EMF and radiation shielding','Grounding & stabilising energy','Repels negativity & bad intentions'],
    price:999, offerPrice:649, images:IMGS.black_stone, stock:88, sku:'VA-BR-005', isFeatured:true, isNewLaunch:false, isActive:true, totalSold:2890, rating:4.8, reviewCount:723 },

  { name:{en:'Firoza (Turquoise) Bracelet',hi:'फिरोज़ा ब्रेसलेट'}, slug:'firoza-bracelet', category:'bracelets',
    description:{en:'Natural Firoza (Turquoise) — associated with Jupiter in Vedic astrology, bringing luck, prosperity and spiritual protection. Particularly beneficial for Sagittarius and Pisces.',hi:'फिरोज़ा — गुरु ग्रह का पत्थर। भाग्य और आध्यात्मिक सुरक्षा।'},
    benefits:['Jupiter — luck & prosperity','Protection from evil eye','Balances emotions & mood','Beneficial for Sagittarius & Pisces'],
    price:1299, offerPrice:849, images:IMGS.turquoise, stock:52, sku:'VA-BR-006', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:654, rating:4.7, reviewCount:167 },

  { name:{en:'Sulemani (Agate) Bracelet',hi:'सुलेमानी ब्रेसलेट'}, slug:'sulemani-bracelet', category:'bracelets',
    description:{en:'Authentic Sulemani Hakik (Black Agate) — revered protective stone in multiple traditions. Protects against evil eye (nazar), negative energy and jealousy.',hi:'सुलेमानी हकीक — बुरी नजर और नकारात्मक ऊर्जा से सुरक्षा।'},
    benefits:['Powerful protection from evil eye','Guards against jealousy','Enhances courage & confidence','Calms anxiety & overthinking'],
    price:799, offerPrice:499, images:IMGS.agate, stock:70, sku:'VA-BR-007', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:1123, rating:4.8, reviewCount:289 },

  { name:{en:'Clear Quartz Bracelet',hi:'क्लियर क्वार्ट्ज ब्रेसलेट'}, slug:'clear-quartz-bracelet', category:'bracelets',
    description:{en:'The Master Healer — Clear Quartz amplifies intentions, energy and properties of all surrounding crystals. Programmable with your intention. Suitable for all zodiac signs.',hi:'क्लियर क्वार्ट्ज — मास्टर हीलर। सभी राशियों के लिए उपयुक्त।'},
    benefits:['Master Healer — amplifies all energies','Programmable with intentions','Cleanses aura & environment','Compatible with all zodiac signs'],
    price:899, offerPrice:599, images:IMGS.clear_quartz, stock:80, sku:'VA-BR-008', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:987, rating:4.8, reviewCount:248 },

  { name:{en:"Cat's Eye Bracelet",hi:"कैट्स आई ब्रेसलेट"}, slug:'cats-eye-bracelet', category:'bracelets',
    description:{en:"Cat's Eye (Lehsunia) — associated with Ketu in Vedic astrology. Protects against sudden losses, hidden enemies and unexpected obstacles. For those in Ketu Mahadasha.",hi:"कैट्स आई — केतु का पत्थर। अचानक नुकसान से सुरक्षा।"},
    benefits:["Ketu planet protection",'Protects against sudden losses','Guards from hidden enemies','Evil eye protection'],
    price:1599, offerPrice:1099, images:IMGS.cats_eye, stock:35, sku:'VA-BR-009', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:345, rating:4.7, reviewCount:89 },

  { name:{en:'Money Magnet Bracelet',hi:'मनी मैग्नेट ब्रेसलेट'}, slug:'money-magnet-bracelet', category:'bracelets',
    description:{en:'Triple-power wealth bracelet: Citrine + Pyrite + Green Aventurine — the three most potent money crystals. Creates a constant field of financial attraction. Ideal for entrepreneurs and traders.',hi:'सिट्रीन, पाइराइट और ग्रीन एवेंचुरीन — तीन शक्तिशाली धन क्रिस्टल।'},
    benefits:['Triple wealth-attraction crystal combo','Citrine — prosperity','Pyrite — financial growth','Green Aventurine — luck magnet'],
    price:1499, offerPrice:999, images:IMGS.citrine, stock:65, sku:'VA-BR-010', isFeatured:true, isNewLaunch:true, isActive:true, totalSold:1567, rating:4.9, reviewCount:392 },

  { name:{en:'Pyrite + Black Tourmaline Bracelet',hi:'पाइराइट + ब्लैक टूरमालाइन ब्रेसलेट'}, slug:'pyrite-black-tourmaline-bracelet', category:'bracelets',
    description:{en:'Dual-purpose bracelet: wealth attraction (Pyrite) + psychic protection (Black Tourmaline). Both attracts abundance and shields from those blocking your success.',hi:'धन आकर्षण + सुरक्षा — पाइराइट और ब्लैक टूरमालाइन।'},
    benefits:['Wealth attraction + psychic protection','Business protection from competition','Dual-action wealth & shield','Grounding financial energy'],
    price:1299, offerPrice:849, images:[...IMGS.pyrite_raw, ...IMGS.black_stone], stock:55, sku:'VA-BR-011', isFeatured:true, isNewLaunch:false, isActive:true, totalSold:876, rating:4.8, reviewCount:219 },

  { name:{en:'Citrine Bracelet',hi:'सिट्रीन ब्रेसलेट'}, slug:'citrine-bracelet', category:'bracelets',
    description:{en:'Natural Citrine — the Merchant Stone. Never needs cleansing as it transmutes negativity into positive energy. Activates solar plexus & sacral chakras, boosting creativity and financial flow.',hi:'सिट्रीन — व्यापारी का पत्थर। कभी सफाई की जरूरत नहीं।'},
    benefits:['Merchant Stone — ultimate business crystal','Never needs cleansing','Activates solar plexus chakra','Attracts financial flow & success'],
    price:1199, offerPrice:799, images:IMGS.citrine, stock:72, sku:'VA-BR-012', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:1234, rating:4.8, reviewCount:312 },

  { name:{en:'Yellow Citrine Bracelet (Premium)',hi:'येलो सिट्रीन ब्रेसलेट'}, slug:'yellow-citrine-bracelet-premium', category:'bracelets',
    description:{en:'Premium AAA grade deep yellow Citrine bead bracelet. Deep-yellow Citrine is rarer and more potent, carrying stronger solar energy for manifestation, abundance and self-confidence.',hi:'प्रीमियम AAA गहरे पीले सिट्रीन ब्रेसलेट।'},
    benefits:['AAA grade premium Citrine','Stronger solar energy','Enhanced manifestation power','Success in creative ventures'],
    price:1799, offerPrice:1199, images:IMGS.citrine, stock:40, sku:'VA-BR-013', isFeatured:false, isNewLaunch:true, isActive:true, totalSold:456, rating:4.9, reviewCount:118 },

  { name:{en:'Red Jasper Bracelet',hi:'रेड जैस्पर ब्रेसलेट'}, slug:'red-jasper-bracelet', category:'bracelets',
    description:{en:"Red Jasper — Stone of Endurance. Grounds the root chakra, building stamina, determination and strength. Excellent for Aries. Brings courage during difficult times.",hi:'रेड जैस्पर — सहनशक्ति का पत्थर। मूल चक्र को सक्रिय करता है।'},
    benefits:['Root chakra grounding','Builds stamina & endurance','Courage in difficult times','Beneficial for Aries & Scorpio'],
    price:799, offerPrice:549, images:IMGS.red_jasper, stock:68, sku:'VA-BR-014', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:789, rating:4.7, reviewCount:198 },

  { name:{en:'Lapis Lazuli Bracelet',hi:'लैपिस लाजुली ब्रेसलेट'}, slug:'lapis-lazuli-bracelet', category:'bracelets',
    description:{en:'Royal Lapis Lazuli — sought since ancient Egypt. Deep celestial blue activates third eye and throat chakras, enhancing wisdom, truth and communication. Stone of royalty and philosophers.',hi:'लैपिस लाजुली — प्राचीन मिस्र से राजाओं का पत्थर।'},
    benefits:['Third eye & throat chakra','Enhances wisdom & truth','Sacred stone of royalty','Amplifies leadership'],
    price:1399, offerPrice:949, images:IMGS.lapis, stock:48, sku:'VA-BR-015', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:543, rating:4.8, reviewCount:137 },

  { name:{en:'Green Aventurine Bracelet',hi:'ग्रीन एवेंचुरीन ब्रेसलेट'}, slug:'green-aventurine-bracelet', category:'bracelets',
    description:{en:'Green Aventurine — the luckiest of all crystals. Activates heart chakra to manifest opportunities, wealth and love. Ideal for anyone starting new ventures.',hi:'ग्रीन एवेंचुरीन — सबसे भाग्यशाली क्रिस्टल।'},
    benefits:['Luckiest crystal','Heart chakra activation','Manifests wealth & love','Ideal for new ventures'],
    price:799, offerPrice:549, images:IMGS.aventurine, stock:80, sku:'VA-BR-016', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:1456, rating:4.8, reviewCount:367 },

  { name:{en:'Sodalite Bracelet',hi:'सोडालाइट ब्रेसलेट'}, slug:'sodalite-bracelet', category:'bracelets',
    description:{en:'Sodalite — Stone of Logic, Calm and Truth. Deep blue with white calcite veins enhances rational thought and self-discipline. Excellent for students and researchers.',hi:'सोडालाइट — तर्क और सत्य का पत्थर।'},
    benefits:['Enhances logic & rational thinking','Third eye activation','Reduces mental fog','Excellent for students'],
    price:899, offerPrice:599, images:IMGS.sodalite, stock:60, sku:'VA-BR-017', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:432, rating:4.7, reviewCount:109 },

  { name:{en:'Sunstone Bracelet',hi:'सनस्टोन ब्रेसलेट'}, slug:'sunstone-bracelet', category:'bracelets',
    description:{en:'Sunstone — Stone of Joy and Leadership. Golden-orange shimmer carries solar energy that uplifts mood, boosts vitality and inspires leadership. Banishes self-doubt.',hi:'सनस्टोन — खुशी और नेतृत्व का पत्थर।'},
    benefits:['Uplifts mood & brings joy','Boosts vitality & power','Leadership enhancer','Banishes self-doubt'],
    price:1299, offerPrice:849, images:IMGS.sunstone, stock:45, sku:'VA-BR-018', isFeatured:false, isNewLaunch:true, isActive:true, totalSold:312, rating:4.8, reviewCount:79 },

  { name:{en:'Moonstone Bracelet',hi:'मूनस्टोन ब्रेसलेट'}, slug:'moonstone-bracelet', category:'bracelets',
    description:{en:'Adularescent Moonstone — Stone of New Beginnings. Associated with Moon in Vedic astrology, calms emotions and enhances intuition. Beneficial for Cancer and Pisces.',hi:'मूनस्टोन — नई शुरुआत का पत्थर। चंद्रमा से जुड़ा।'},
    benefits:['Stone of New Beginnings','Enhances intuition','Calms emotional turbulence','Beneficial for Cancer & Pisces'],
    price:1499, offerPrice:999, images:IMGS.moonstone, stock:38, sku:'VA-BR-019', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:678, rating:4.9, reviewCount:172 },

  { name:{en:'Lava + 7 Chakra Bracelet',hi:'लावा + 7 चक्र ब्रेसलेट'}, slug:'lava-7-chakra-bracelet', category:'bracelets',
    description:{en:'Grounding Lava Stone with 7 Chakra crystals. Lava stone is a natural essential oil diffuser — add 1-2 drops of essential oil for aromatherapy. Powerful full-body healing.',hi:'ज्वालामुखी लावा + 7 चक्र क्रिस्टल — अरोमाथेरेपी के साथ।'},
    benefits:['Natural essential oil diffuser','Grounding volcanic energy','All 7 chakras balanced','Aromatherapy + crystal healing'],
    price:1099, offerPrice:749, images:IMGS.lava, stock:65, sku:'VA-BR-020', isFeatured:false, isNewLaunch:true, isActive:true, totalSold:543, rating:4.8, reviewCount:138 },

  { name:{en:'Dhanyog Bracelet',hi:'धन्ययोग ब्रेसलेट'}, slug:'dhanyog-bracelet', category:'bracelets',
    description:{en:'Exclusive Vastu Arya signature bracelet — Pyrite, Citrine, Green Aventurine and Clear Quartz. Based on Vastu directional principles, activates all four wealth quadrants simultaneously.',hi:'धन्ययोग — वास्तु आर्य का एक्सक्लूसिव सिग्नेचर ब्रेसलेट।'},
    benefits:['Exclusive signature blend','All four wealth quadrants','Dr. PPS Tomar curated & blessed','Based on Vastu principles'],
    price:1799, offerPrice:1199, images:IMGS.dhanyog, stock:50, sku:'VA-BR-021', isFeatured:true, isNewLaunch:true, isActive:true, totalSold:234, rating:4.9, reviewCount:62 },

  { name:{en:'Pyrite + Rose Quartz Bracelet',hi:'पाइराइट + रोज क्वार्ट्ज ब्रेसलेट'}, slug:'pyrite-rose-quartz-bracelet', category:'bracelets',
    description:{en:'Perfect balance: Pyrite attracts money and success while Rose Quartz opens heart for love and self-worth. Creates financial abundance from a foundation of emotional balance.',hi:'पाइराइट + रोज क्वार्ट्ज — धन और प्रेम का संतुलन।'},
    benefits:['Wealth attraction + heart healing','Financial confidence from self-love','Attracts love & prosperity','Harmonises masculine & feminine energy'],
    price:1299, offerPrice:849, images:[...IMGS.pyrite, ...IMGS.rose_quartz], stock:58, sku:'VA-BR-022', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:678, rating:4.8, reviewCount:172 },

  // ── CHARGING PLATES (2) ───────────────────────────────────────
  { name:{en:'Raw Selenite Charging Plate',hi:'कच्ची सेलेनाइट चार्जिंग प्लेट'}, slug:'raw-selenite-charging-plate', category:'charging-plates',
    description:{en:'Natural raw Selenite slab — one of the few crystals that never needs cleansing. Place jewellery, crystals or spiritual tools overnight to fully recharge them. Also purifies room energy.',hi:'कच्ची सेलेनाइट प्लेट — क्रिस्टल और गहनों को रात भर चार्ज करें।'},
    benefits:['Cleanses & recharges all crystals','Never needs its own cleansing','High-frequency white light energy','Purifies room energy instantly'],
    price:1299, offerPrice:849, images:IMGS.selenite, stock:35, sku:'VA-CP-001', isFeatured:true, isNewLaunch:false, isActive:true, totalSold:567, rating:4.9, reviewCount:143 },

  { name:{en:'Polished Selenite Charging Plate',hi:'पॉलिश सेलेनाइट चार्जिंग प्लेट'}, slug:'polished-selenite-charging-plate', category:'charging-plates',
    description:{en:'Smooth polished Selenite slab with pearl-white surface. Serves as a permanent altar or charging station. Size: approx. 15×8cm. Includes velvet storage pouch.',hi:'पॉलिश सेलेनाइट प्लेट — स्थायी चार्जिंग स्टेशन। वेलवेट पाउच सहित।'},
    benefits:['Elegant altar & charging station','Continuous energy purification','Velvet storage pouch included','Home & office energy harmoniser'],
    price:1599, offerPrice:1099, images:IMGS.selenite, stock:28, sku:'VA-CP-002', isFeatured:false, isNewLaunch:true, isActive:true, totalSold:234, rating:4.8, reviewCount:62 },

  // ── GEMSTONES (12) ────────────────────────────────────────────
  { name:{en:'Blue Sapphire (Neelam)',hi:'नीलम'}, slug:'blue-sapphire-neelam', category:'gemstones',
    description:{en:'Natural Ceylon Blue Sapphire — most powerful gemstone for Saturn. Acts instantly — trial for 3 days before permanent wearing. Consult Dr. PPS Tomar first. Comes with lab report.',hi:'नीलम — शनि का सबसे शक्तिशाली रत्न। डॉ. पीपीएस तोमर से परामर्श के बाद पहनें।'},
    benefits:['Saturn gemstone — instant results','Career & profession growth','Removes Saturn obstacles','Brings discipline & focus'],
    price:25000, offerPrice:18999, images:IMGS.sapphire_blue, stock:10, sku:'VA-GEM-001', isFeatured:true, isNewLaunch:false, isActive:true, totalSold:89, rating:4.9, reviewCount:34 },

  { name:{en:'Yellow Sapphire (Pukhraj)',hi:'पुखराज'}, slug:'yellow-sapphire-pukhraj', category:'gemstones',
    description:{en:'Natural Ceylon Yellow Sapphire — Jupiter\'s supreme gemstone. Governs wisdom, wealth, children and marriage. One of the safest gemstones with virtually no side effects.',hi:'पुखराज — गुरु का रत्न। ज्ञान, धन और विवाह के लिए।'},
    benefits:['Jupiter gemstone — wisdom & wealth','Marriage & children','Educational success','Virtually side-effect free'],
    price:15000, offerPrice:11999, images:IMGS.sapphire_yel, stock:15, sku:'VA-GEM-002', isFeatured:true, isNewLaunch:false, isActive:true, totalSold:145, rating:4.9, reviewCount:56 },

  { name:{en:'White Sapphire (Safed Pukhraj)',hi:'सफेद पुखराज'}, slug:'white-sapphire-safed-pukhraj', category:'gemstones',
    description:{en:'Natural White Sapphire — affordable and effective Diamond alternative for Venus. Brings beauty, luxury, love, arts and marital happiness. For creative fields and relationships.',hi:'सफेद पुखराज — शुक्र का रत्न। हीरे का किफायती विकल्प।'},
    benefits:['Venus gemstone — love & beauty','Affordable Diamond alternative','Marital harmony','Success in arts & creative fields'],
    price:8000, offerPrice:5999, images:IMGS.moissanite, stock:20, sku:'VA-GEM-003', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:67, rating:4.8, reviewCount:28 },

  { name:{en:'Ruby (Manikya)',hi:'माणिक्य'}, slug:'ruby-manikya', category:'gemstones',
    description:{en:'Natural Burmese Ruby — Sun\'s most powerful gemstone. Fiery red ignites the life force, boosts vitality, authority and leadership. Recommended for weak Sun in horoscope.',hi:'माणिक्य — सूर्य का रत्न। अधिकार और नेतृत्व।'},
    benefits:['Sun gemstone — vitality & authority','Boosts leadership & recognition','Government & career favour','Reduces Sun-related health issues'],
    price:20000, offerPrice:14999, images:IMGS.ruby, stock:8, sku:'VA-GEM-004', isFeatured:true, isNewLaunch:false, isActive:true, totalSold:56, rating:4.9, reviewCount:23 },

  { name:{en:'Red Coral (Moonga)',hi:'मूंगा'}, slug:'red-coral-moonga', category:'gemstones',
    description:{en:'Natural Red Coral — gemstone of Mars. Most recommended for Mangal Dosha. Boosts courage, physical energy and overcoming enemies. Property and land matters.',hi:'मूंगा — मंगल का रत्न। मंगल दोष के लिए सर्वोत्तम।'},
    benefits:['Mars gemstone — courage','Best for Mangal Dosha','Overcomes enemies','Property matters'],
    price:5000, offerPrice:3799, images:IMGS.coral, stock:25, sku:'VA-GEM-005', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:123, rating:4.8, reviewCount:45 },

  { name:{en:'Pearl (Moti)',hi:'मोती'}, slug:'pearl-moti', category:'gemstones',
    description:{en:'Natural South Sea Pearl — Moon\'s sacred gemstone. Calms the mind, enhances emotional intelligence. Excellent for mothers and those facing insomnia or memory issues.',hi:'मोती — चंद्रमा का रत्न। मन को शांत करता है।'},
    benefits:['Moon gemstone — calm mind','Enhances emotional intelligence','Helps insomnia & memory','Excellent for mothers'],
    price:3000, offerPrice:2299, images:IMGS.pearl, stock:30, sku:'VA-GEM-006', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:178, rating:4.8, reviewCount:67 },

  { name:{en:'Emerald (Panna)',hi:'पन्ना'}, slug:'emerald-panna', category:'gemstones',
    description:{en:'Natural Colombian Emerald — Mercury\'s supreme gemstone. Governs intellect, communication and business. Highly recommended for businesspeople, traders, writers and students.',hi:'पन्ना — बुध का रत्न। व्यापार और बुद्धि के लिए।'},
    benefits:['Mercury gemstone — intellect','Sharp communication','Business & trading success','Best for Gemini & Virgo'],
    price:12000, offerPrice:8999, images:IMGS.emerald, stock:12, sku:'VA-GEM-007', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:89, rating:4.9, reviewCount:34 },

  { name:{en:'Moissanite',hi:'मोइसानाइट'}, slug:'moissanite-lab-diamond', category:'gemstones',
    description:{en:'Premium Moissanite — more brilliant than diamond with refractive index 2.65. Ethically created, conflict-free. Provides Venus energy at fraction of diamond cost.',hi:'मोइसानाइट — हीरे से अधिक चमकदार। नैतिक और किफायती।'},
    benefits:['More brilliant than diamond','Ethical & conflict-free','Venus energy at lower cost','Hardness 9.25 Mohs scale'],
    price:8000, offerPrice:5999, images:IMGS.moissanite, stock:20, sku:'VA-GEM-008', isFeatured:false, isNewLaunch:true, isActive:true, totalSold:45, rating:4.9, reviewCount:18 },

  { name:{en:'Hessonite (Gomed)',hi:'गोमेद'}, slug:'hessonite-gomed', category:'gemstones',
    description:{en:'Natural Ceylon Hessonite Garnet — Rahu\'s gemstone. Highly effective during Rahu Mahadasha. Effective for IT, media and foreign business sectors.',hi:'गोमेद — राहु का रत्न। IT और विदेश व्यापार में सफलता।'},
    benefits:['Rahu gemstone — clarity','Effective in Rahu Mahadasha','IT & foreign business','Removes Rahu delays'],
    price:5000, offerPrice:3799, images:IMGS.hessonite, stock:22, sku:'VA-GEM-009', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:67, rating:4.7, reviewCount:27 },

  { name:{en:"Cat's Eye (Lehsunia)",hi:"लहसुनिया"}, slug:'cats-eye-lehsunia', category:'gemstones',
    description:{en:"Natural Chrysoberyl Cat's Eye — Ketu's powerful gemstone. Protects against accidents, hidden enemies and sudden losses. The chatoyant shimmer moves like a cat's eye.",hi:"लहसुनिया — केतु का रत्न। दुर्घटनाओं से सुरक्षा।"},
    benefits:["Ketu gemstone",'Protects against accidents','Reveals hidden enemies','Chatoyant effect'],
    price:10000, offerPrice:7499, images:IMGS.cats_eye, stock:15, sku:'VA-GEM-010', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:45, rating:4.8, reviewCount:19 },

  { name:{en:'Amethyst (Natural)',hi:'एमेथिस्ट'}, slug:'amethyst-natural-gemstone', category:'gemstones',
    description:{en:'Natural Amethyst — Stone of Spiritual Wisdom. Violet-purple activates crown and third eye chakras. One of the most universally loved healing crystals for stress and sleep.',hi:'एमेथिस्ट — आध्यात्मिक ज्ञान। तनाव और नींद के लिए।'},
    benefits:['Crown chakra activation','Deepens meditation','Calms overactive mind','Excellent for stress & sleep'],
    price:1999, offerPrice:1299, images:[...IMGS.sodalite], stock:50, sku:'VA-GEM-011', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:456, rating:4.8, reviewCount:114 },

  { name:{en:'Diamond (Heera)',hi:'हीरा'}, slug:'diamond-heera', category:'gemstones',
    description:{en:'Natural certified Diamond — Venus\'s supreme gemstone. GIA/IGI certified diamonds available on request. Custom selection with personalised pricing. Contact us for detailed consultation.',hi:'हीरा — शुक्र का सर्वोच्च रत्न। GIA/IGI प्रमाणित।'},
    benefits:['Supreme Venus gemstone','Luxury & material success','GIA/IGI certified','Custom selection by Dr. PPS Tomar'],
    price:50000, offerPrice:45000, images:IMGS.diamond, stock:5, sku:'VA-GEM-012', isFeatured:true, isNewLaunch:false, isActive:true, totalSold:23, rating:5.0, reviewCount:12 },

  // ── RUDRAKSHA (16) ────────────────────────────────────────────
  ...[1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(n => {
    const data: Record<number,{hi:string,desc:string,benefits:string[],p:number,op:number,feat:boolean,stock:number,sold:number,rc:number}> = {
      1:{hi:'1 मुखी रुद्राक्ष',desc:'Rarest Rudraksha — Lord Shiva\'s supreme consciousness. Attains enlightenment, reduces ego. The Half-Moon form is authentic and rare. Lab tested with X-ray certification.',benefits:['Direct connection to Lord Shiva','Highest spiritual attainment','Reduces ego & pride','X-ray certified'],p:15000,op:11999,feat:true,stock:3,sold:12,rc:8},
      2:{hi:'2 मुखी रुद्राक्ष',desc:'Represents divine union of Shiva and Shakti. Ideal for couples and married individuals seeking emotional harmony. Strengthens bonds between teacher and student.',benefits:['Shiva-Shakti union','Strengthens marriage','Emotional balance','Moon & mind calmer'],p:800,op:599,feat:false,stock:40,sold:234,rc:59},
      3:{hi:'3 मुखी रुद्राक्ष',desc:'Trinity — Brahma, Vishnu and Mahesh. Governed by Fire God, burns past karma, removes guilt and self-blame. Liberates from depression and low self-esteem.',benefits:['Burns past karma','Releases depression','Agni purification','Chronic fatigue cure'],p:600,op:449,feat:false,stock:55,sold:345,rc:87},
      4:{hi:'4 मुखी रुद्राक्ष',desc:'Ruled by Brahma the Creator. Enhances creativity, intelligence, memory and communication. Excellent for students, teachers, scientists and journalists.',benefits:['Creativity & intelligence','Enhances memory','Communication booster','Activates Mercury energy'],p:500,op:374,feat:false,stock:65,sold:456,rc:115},
      5:{hi:'5 मुखी रुद्राक्ष',desc:'Most common and universally recommended Rudraksha — 5 forms of Shiva. Safe for everyone. Promotes health, peace, prosperity. Nepal origin, X-ray tested.',benefits:['Universal — safe for all','Health, peace & prosperity','Standard japa mala bead','X-ray tested'],p:300,op:224,feat:true,stock:120,sold:2345,rc:587},
      6:{hi:'6 मुखी रुद्राक्ष',desc:'Ruled by Kartikeya. Builds willpower, focus, concentration and courage. Particularly beneficial for competitive fields — sports, exams, military, business.',benefits:['Willpower & focus','Competitive advantage','Courage & confidence','Grounding'],p:700,op:524,feat:false,stock:50,sold:432,rc:108},
      7:{hi:'7 मुखी रुद्राक्ष',desc:'Governed by Goddess Mahalaxmi. Removes financial blockages and activates money flow. Highly effective for business, trading and financial stagnation.',benefits:['Mahalaxmi — wealth','Removes financial blockages','Business success','Most potent wealth Rudraksha'],p:900,op:674,feat:true,stock:45,sold:876,rc:219},
      8:{hi:'8 मुखी रुद्राक्ष',desc:'Ruled by Ganesha. Invokes blessings for new ventures, removal of unexpected hurdles. Excellent for entrepreneurs and those facing repeated failures.',benefits:['Ganesha — obstacle remover','New venture blessings','Victory over adversity','Entrepreneurs'],p:1200,op:899,feat:false,stock:38,sold:543,rc:137},
      9:{hi:'9 मुखी रुद्राक्ष',desc:'Ruled by Goddess Durga (Nav Durga). Bestows fearlessness, destroys negativity at root. Excellent for women and those battling chronic illness.',benefits:['Nav Durga — nine powers','Destroys negativity','Fearlessness','Excellent for women'],p:2500,op:1874,feat:false,stock:25,sold:234,rc:59},
      10:{hi:'10 मुखी रुद्राक्ष',desc:'Associated with Lord Vishnu (Dashavatar). Provides protection from all ten directions. Removes malefic influence of all nine planets simultaneously.',benefits:['Vishnu Dashavatar','All ten directions protection','Removes all planetary malefics','Most complete protective Rudraksha'],p:4000,op:2999,feat:false,stock:20,sold:178,rc:45},
      11:{hi:'11 मुखी रुद्राक्ष',desc:'Ruled by the 11 Rudras. Bestows wisdom, right decision-making and protection from accidents. Excellent for those in leadership positions who travel frequently.',benefits:['11 Rudras — divine wisdom','Right decision-making','Accident protection','Leadership power'],p:6000,op:4499,feat:false,stock:15,sold:123,rc:31},
      12:{hi:'12 मुखी रुद्राक्ष',desc:"Sun's Rudraksha — 12 Adityas. Radiates solar energy enhancing authority, leadership, health and vitality. Removes fear and self-doubt. Government & senior management.",benefits:['Solar energy — authority','Health & vitality','Removes fear','Government support'],p:8000,op:5999,feat:false,stock:12,sold:89,rc:23},
      13:{hi:'13 मुखी रुद्राक्ष',desc:'Associated with Kamadeva. Rare and powerful, fulfils all desires, attracts love and enhances charisma. Beneficial for beauty, fashion and entertainment fields.',benefits:['Kamadeva — love','Fulfils all desires','Enhances charisma','Strengthens Venus'],p:12000,op:8999,feat:false,stock:8,sold:45,rc:14},
      14:{hi:'14 मुखी रुद्राक्ष',desc:'Deva Mani (Jewel of Gods) — ruled by Hanuman and Saturn. Opens Ajna third eye chakra, developing intuition, foresight and divine inspiration. Among the most powerful.',benefits:['Deva Mani — Jewel of Gods','Third eye chakra','Divine intuition','Most rare Rudraksha'],p:20000,op:14999,feat:true,stock:5,sold:23,rc:9},
    };
    const d = data[n];
    return {
      name:{en:`${n} Mukhi Rudraksha`,hi:d.hi}, slug:`${n}-mukhi-rudraksha`, category:'rudraksha',
      description:{en:d.desc,hi:''},
      benefits:d.benefits, price:d.p, offerPrice:d.op,
      images:IMGS.rudraksha, stock:d.stock, sku:`VA-RD-${String(n).padStart(3,'0')}`,
      isFeatured:d.feat, isNewLaunch:false, isActive:true, totalSold:d.sold, rating:n===5||n===14?4.9:4.8, reviewCount:d.rc,
    };
  }),

  { name:{en:'Gaurishankar Rudraksha',hi:'गौरीशंकर रुद्राक्ष'}, slug:'gaurishankar-rudraksha', category:'rudraksha',
    description:{en:'Naturally fused pair of two Rudraksha beads — divine union of Shiva and Parvati. Most sacred gift for couples. Strengthens marriage, promotes love and harmony.',hi:'गौरीशंकर — शिव और पार्वती का मिलन। विवाहित जोड़ों के लिए।'},
    benefits:['Natural Shiva-Parvati union','Most auspicious for couples','Strengthens marriage','Sacred altar piece'],
    price:3500, offerPrice:2624, images:IMGS.rudraksha, stock:18, sku:'VA-RD-015', isFeatured:true, isNewLaunch:false, isActive:true, totalSold:234, rating:4.9, reviewCount:59 },

  { name:{en:'Ganesh Rudraksha',hi:'गणेश रुद्राक्ष'}, slug:'ganesh-rudraksha', category:'rudraksha',
    description:{en:'Rare Ganesh Rudraksha with naturally formed elephant-trunk protrusion. Removes all obstacles, blesses new beginnings. One of the most sought-after Rudraksha forms.',hi:'गणेश रुद्राक्ष — प्राकृतिक गणेश आकृति। अत्यंत दुर्लभ।'},
    benefits:['Ganesha form — obstacle remover','New beginning blessings','Success in all ventures','Extremely rare'],
    price:5000, offerPrice:3749, images:IMGS.rudraksha, stock:10, sku:'VA-RD-016', isFeatured:true, isNewLaunch:false, isActive:true, totalSold:78, rating:4.9, reviewCount:24 },

  // ── MALA (5) ──────────────────────────────────────────────────
  { name:{en:'Rose Quartz Mala (108 Beads)',hi:'रोज क्वार्ट्ज माला'}, slug:'rose-quartz-mala-108', category:'sacred-mala',
    description:{en:'108+1 bead Rose Quartz crystal mala for heart-opening mantras and Goddess Laxmi puja. Excellent for Venus or love-related mantras. Om Shri Maha Lakshmiyei Namah.',hi:'रोज क्वार्ट्ज माला — प्रेम और लक्ष्मी मंत्रों के लिए।'},
    benefits:['Heart chakra opening during japa','Love & Laxmi mantras','Unconditional love vibration','Venus mantra enhancement'],
    price:1599, offerPrice:1099, images:IMGS.mala, stock:45, sku:'VA-ML-001', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:543, rating:4.8, reviewCount:137 },

  { name:{en:'Amethyst Mala (108 Beads)',hi:'एमेथिस्ट माला'}, slug:'amethyst-mala-108', category:'sacred-mala',
    description:{en:'Premium Amethyst crystal mala for meditation and Devi mantras. Deep violet activates crown chakra during japa. Excellent for Saraswati, Om Namah Shivaya mantras.',hi:'एमेथिस्ट माला — ध्यान और देवी मंत्रों के लिए।'},
    benefits:['Crown chakra activation','Devi mantra amplification','Spiritual progress','Focus during chanting'],
    price:1899, offerPrice:1299, images:IMGS.mala, stock:38, sku:'VA-ML-002', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:345, rating:4.9, reviewCount:87 },

  { name:{en:'Clear Quartz Crystal Mala (108 Beads)',hi:'क्लियर क्वार्ट्ज माला'}, slug:'clear-quartz-mala-108', category:'sacred-mala',
    description:{en:'Universal crystal mala — suitable for all deities and all mantras. Clear Quartz amplifies the intention of any mantra. Gayatri, Om Namah Shivaya, Maha Mrityunjaya.',hi:'क्लियर क्वार्ट्ज माला — सभी देवता और मंत्रों के लिए।'},
    benefits:['Universal — all deities','Amplifies any mantra','Master Healer energy','Perfectly clear beads'],
    price:1299, offerPrice:899, images:IMGS.mala, stock:55, sku:'VA-ML-003', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:678, rating:4.8, reviewCount:170 },

  { name:{en:'Karungali (Black Ebony) Mala',hi:'करुंगली माला'}, slug:'karungali-ebony-mala', category:'sacred-mala',
    description:{en:'Sacred Karungali (Indian Black Ebony) wood mala. Associated with Saturn, Kali and Shani for shanti puja, tantric practices and removing Shani or Rahu doshas.',hi:'करुंगली माला — शनि, काली और राहु दोषों के लिए।'},
    benefits:['Saturn & Rahu dosha removal','Kali & Shiva mantra amplifier','Tantric sadhana mala','Powerful Shanti puja tool'],
    price:999, offerPrice:699, images:IMGS.mala, stock:42, sku:'VA-ML-004', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:234, rating:4.8, reviewCount:59 },

  { name:{en:'Tulsi Mala (108 Beads)',hi:'तुलसी माला'}, slug:'tulsi-mala-108-sacred', category:'sacred-mala',
    description:{en:'Sacred Tulsi (Holy Basil) mala with 108+1 genuine tulsi beads. The mala of Lord Vishnu and Krishna. Purifies sins, removes negativity. Fragrant and spiritually powerful.',hi:'तुलसी माला — विष्णु और कृष्ण भक्तों के लिए। पाप नाशक।'},
    benefits:['Most sacred for Vaishnavas','Lord Vishnu & Krishna mala','Purifies sins','Natural tulsi fragrance'],
    price:599, offerPrice:424, images:IMGS.tulsi, stock:90, sku:'VA-ML-005', isFeatured:true, isNewLaunch:false, isActive:true, totalSold:2345, rating:4.9, reviewCount:587 },

  // ── FRAMES (2) ────────────────────────────────────────────────
  { name:{en:'7 Horses Running Frame',hi:'7 दौड़ते घोड़े फ्रेम'}, slug:'7-horses-running-frame-gold', category:'divine-frames',
    description:{en:'Premium 7 Running Horses frame — gold foil on velvet background. 7 Horses represent seven Sun rays: speed, success, fame and prosperity. Place on south wall to activate career zone.',hi:'7 दौड़ते घोड़े — दक्षिण दीवार पर लगाएं। करियर और प्रसिद्धि के लिए।'},
    benefits:['South wall career zone','7 Sun rays energy','Gold foil premium finish','Vastu placement guide'],
    price:1499, offerPrice:999, images:IMGS.horses, stock:55, sku:'VA-FR-001', isFeatured:true, isNewLaunch:false, isActive:true, totalSold:1234, rating:4.8, reviewCount:312 },

  { name:{en:'Vyapar Vriddhi Business Frame',hi:'व्यापार वृद्धि फ्रेम'}, slug:'vyapar-vriddhi-frame', category:'divine-frames',
    description:{en:'Exclusive Vyapar Vriddhi yantra frame — Kuber Yantra, Laxmi bija mantra and auspicious symbols. For shops, offices and businesses. Activates North wealth zone.',hi:'व्यापार वृद्धि — दुकान और ऑफिस के लिए। कुबेर यंत्र और लक्ष्मी मंत्र।'},
    benefits:['Designed for business premises','Kuber Yantra + Laxmi mantra','North zone wealth activation','Attracts customers & contracts'],
    price:1999, offerPrice:1399, images:IMGS.frame, stock:35, sku:'VA-FR-002', isFeatured:true, isNewLaunch:true, isActive:true, totalSold:543, rating:4.9, reviewCount:137 },

  // ── PYRAMIDS (2) ──────────────────────────────────────────────
  { name:{en:'Dhan Lakshmi Pyramid',hi:'धन लक्ष्मी पिरामिड'}, slug:'dhan-lakshmi-pyramid', category:'pyramids',
    description:{en:'Crystal Dhan Lakshmi Pyramid activated with Lakshmi bija mantras. Pyramid shape focuses energy from all four directions. Place in North to activate the Kubera wealth zone.',hi:'धन लक्ष्मी पिरामिड — उत्तर में रखें। वित्तीय ऊर्जा केंद्र बनाता है।'},
    benefits:['Kubera wealth zone activation','Laxmi mantra activation','Crystal pyramid energy','North placement'],
    price:1799, offerPrice:1199, images:IMGS.pyramid, stock:40, sku:'VA-PY-001', isFeatured:true, isNewLaunch:false, isActive:true, totalSold:456, rating:4.8, reviewCount:115 },

  { name:{en:'Citrine Pyramid (Natural)',hi:'सिट्रीन पिरामिड'}, slug:'citrine-pyramid-natural', category:'pyramids',
    description:{en:'Natural Citrine crystal pyramid — Merchant Stone in pyramid form. Doubles wealth-amplifying power. Never needs cleansing. Place in cash drawer or North corner.',hi:'सिट्रीन पिरामिड — व्यापारी पत्थर। नकद दराज के लिए।'},
    benefits:['Citrine doubled wealth power','Never needs cleansing','Cash drawer magnetism','Office desk amplifier'],
    price:1599, offerPrice:1099, images:IMGS.pyramid, stock:32, sku:'VA-PY-002', isFeatured:false, isNewLaunch:true, isActive:true, totalSold:312, rating:4.8, reviewCount:79 },

  // ── SPIRITUAL (5) ─────────────────────────────────────────────
  { name:{en:'Money Bowl (Crystal Abundance)',hi:'मनी बाउल'}, slug:'money-bowl-crystal-abundance', category:'spiritual',
    description:{en:'Crystal Money Bowl filled with Pyrite nuggets, Citrine chips, Green Aventurine and Cinnamon sticks in a brass vessel. Place in North or East of home. Feng Shui and Vastu wealth tool.',hi:'मनी बाउल — पाइराइट, सिट्रीन, ग्रीन एवेंचुरीन से भरा। उत्तर में रखें।'},
    benefits:['Multi-crystal wealth bowl','Pyrite + Citrine + Aventurine','North zone wealth vortex','Feng Shui & Vastu tool'],
    price:2499, offerPrice:1699, images:IMGS.money_bowl, stock:30, sku:'VA-SP-001', isFeatured:true, isNewLaunch:true, isActive:true, totalSold:234, rating:4.9, reviewCount:62 },

  { name:{en:'7 Chakra Crystal Tree',hi:'7 चक्र क्रिस्टल ट्री'}, slug:'7-chakra-crystal-tree', category:'spiritual',
    description:{en:'Handcrafted 7 Chakra Crystal Tree with wire-wrapped gemstone leaves on natural Amethyst cluster base. 100-150 crystal chips. Room energiser, Vastu decor and meditation focus.',hi:'7 चक्र क्रिस्टल ट्री — एमेथिस्ट बेस पर। 100-150 क्रिस्टल चिप्स।'},
    benefits:['All 7 chakras represented','Natural Amethyst cluster base','100-150 genuine crystal chips','Room energy harmoniser'],
    price:2199, offerPrice:1499, images:IMGS.crystal_tree, stock:25, sku:'VA-SP-002', isFeatured:true, isNewLaunch:false, isActive:true, totalSold:345, rating:4.8, reviewCount:87 },

  { name:{en:'Rose Quartz Crystal Tree',hi:'रोज क्वार्ट्ज ट्री'}, slug:'rose-quartz-crystal-tree', category:'spiritual',
    description:{en:'Rose Quartz love and heart-healing tree with 100 natural chips on wire branches with Rose Quartz base. Fills room with unconditional love. Place in bedroom or SW corner.',hi:'रोज क्वार्ट्ज ट्री — प्रेम और हृदय उपचार। शयनकक्ष के लिए।'},
    benefits:['Heart chakra room filler','100 natural Rose Quartz chips','SW corner love activation','Self-love amplifier'],
    price:1799, offerPrice:1199, images:IMGS.crystal_tree, stock:28, sku:'VA-SP-003', isFeatured:false, isNewLaunch:false, isActive:true, totalSold:234, rating:4.8, reviewCount:59 },

  { name:{en:'Rose Quartz Sphere',hi:'रोज क्वार्ट्ज स्फेयर'}, slug:'rose-quartz-sphere', category:'spiritual',
    description:{en:'Polished Rose Quartz sphere — approx. 6cm diameter with natural wooden stand. Spheres emit energy equally in all 360 directions. Perfect for bedroom, altar or heart-chakra meditation.',hi:'रोज क्वार्ट्ज गोला — 360 डिग्री प्रेम ऊर्जा। लकड़ी का स्टैंड सहित।'},
    benefits:['360° loving energy field','All directions equal emission','Heart chakra focus','Wooden stand included'],
    price:1599, offerPrice:1099, images:IMGS.sphere, stock:22, sku:'VA-SP-004', isFeatured:false, isNewLaunch:true, isActive:true, totalSold:178, rating:4.9, reviewCount:45 },

  { name:{en:'Amethyst Sphere',hi:'एमेथिस्ट स्फेयर'}, slug:'amethyst-sphere', category:'spiritual',
    description:{en:'Deep purple polished Amethyst sphere — approx. 6cm with wooden stand. Radiates spiritual, calming and protective energy in all directions. Deepens sleep, reduces nightmares.',hi:'एमेथिस्ट गोला — गहरी नींद और आध्यात्मिक शांति।'},
    benefits:['Spiritual calm 360°','Deepens sleep','Meditation enhancer','Protective sanctuary'],
    price:1799, offerPrice:1199, images:IMGS.sphere, stock:20, sku:'VA-SP-005', isFeatured:true, isNewLaunch:false, isActive:true, totalSold:234, rating:4.9, reviewCount:62 },
];

export async function seedProducts(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0, skipped = 0;
  for (const product of ALL_PRODUCTS) {
    const exists = await Product.findOne({ slug: product.slug });
    if (exists) {
      // Update images if they're empty/placeholders
      if (!exists.images?.length || exists.images[0]?.includes('placehold.co')) {
        await Product.findByIdAndUpdate(exists._id, { images: product.images });
      }
      skipped++;
    } else {
      await Product.create(product);
      inserted++;
    }
  }
  (console as any).log(`[Seed] ${inserted} inserted, ${skipped} skipped (images updated on placeholders).`);
  return { inserted, skipped };
}
