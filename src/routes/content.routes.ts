/// <reference types="node" />
/**
 * content.routes.ts — FIXED: 73,000+ everywhere (was 45,000+)
 */
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();
const con = (console as any);

let ContentStore: mongoose.Model<any>;
function getContentModel() {
  if (ContentStore) return ContentStore;
  if (mongoose.models.ContentStore) { ContentStore = mongoose.models.ContentStore; return ContentStore; }
  const schema = new mongoose.Schema(
    { key: { type: String, required: true, unique: true }, value: { type: mongoose.Schema.Types.Mixed, default: '' } },
    { timestamps: true }
  );
  ContentStore = mongoose.model('ContentStore', schema);
  return ContentStore;
}

// FIXED: 73,000+ (was 45,000+)
const DEFAULT_CONTENT: Record<string, Record<string, any>> = {
  home: {
    hero: {
      title1: 'Transform Your Space',
      title2: 'Transform Your Life',
      subtitle: 'IVAF Certified Vastu Expert — 73,000+ Clients Transformed',
      cta1: 'Book Consultation',
      cta2: 'Explore Services',
      badge: "India's #1 Vastu Consultancy",
    },
    stats: { clients: '73,000+', experience: '15+', services: '50+', cities: '200+' },
    cta: {
      title: 'Start Your Vastu Journey Today',
      subtitle: 'Book a personal consultation with Dr. PPS Tomar',
      button: 'Book @ Rs.11 Only',
    },
    featured: {
      title: 'Our Expert Services',
      subtitle: 'Comprehensive Vastu solutions for home, office, and life',
    },
  },
  global: {
    navbar: { phone: '+91-7000343804', badge: 'Book Consultation @ Rs.11 Only' },
    popup: {
      title: 'Book Your Vastu Consultation',
      subtitle: 'Get expert guidance from Dr. PPS Tomar',
      badge: 'Special Offer — Rs.11 Only',
      cta: 'Book Now',
    },
    seo: {
      title: "Vastu Arya — India's Premier Vastu Consultancy by Dr. PPS Tomar",
      description: 'IVAF Certified Vastu Shastra, Astrology & Gemology expert. 73,000+ clients transformed. Book your consultation today.',
    },
    footer: {
      tagline: 'Transforming Lives Through Ancient Wisdom',
      copyright: `© ${new Date().getFullYear()} Vastu Arya. All rights reserved.`,
    },
  },
};

router.get('/', async (req: Request, res: Response) => {
  try {
    const Model = getContentModel();
    const items = await Model.find({});
    const result: Record<string, any> = {};
    for (const item of items) result[item.key] = item.value;
    if (!items.length) { res.json({ success: true, data: DEFAULT_CONTENT }); return; }
    res.json({ success: true, data: result });
  } catch (error: any) {
    con.error('[Content] GET / error:', error.message);
    res.json({ success: true, data: DEFAULT_CONTENT });
  }
});

router.get('/:page', async (req: Request, res: Response) => {
  try {
    const { page } = req.params;
    const Model = getContentModel();
    const item = await Model.findOne({ key: page });
    if (item) { res.json({ success: true, data: item.value }); return; }
    res.json({ success: true, data: DEFAULT_CONTENT[page] || {} });
  } catch (error: any) {
    con.error('[Content] GET /:page error:', error.message);
    res.json({ success: true, data: DEFAULT_CONTENT[req.params.page] || {} });
  }
});

router.put('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { key, value, page, content } = req.body;
    const resolvedKey   = key || page || 'home';
    const resolvedValue = value ?? content ?? req.body;
    const Model = getContentModel();
    const item = await Model.findOneAndUpdate({ key: resolvedKey }, { value: resolvedValue }, { new: true, upsert: true });
    res.json({ success: true, data: item?.value, message: 'Content saved' });
  } catch (error: any) {
    con.error('[Content] PUT / error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/bulk', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ success: false, message: 'items must be an array' });
    const Model = getContentModel();
    const ops = items.map((item: { key: string; value: any }) => ({
      updateOne: { filter: { key: item.key }, update: { $set: { value: item.value } }, upsert: true },
    }));
    if (ops.length) await Model.bulkWrite(ops);
    res.json({ success: true, message: `${ops.length} items updated` });
  } catch (error: any) {
    con.error('[Content] POST /bulk error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
