/// <reference types="node" />
/**
 * content.routes.ts
 *
 * Serves the Website Editor admin panel's contentAPI calls.
 * Content is stored as key-value pairs inside SiteSettings.content map.
 * This avoids a new model — SiteSettings already exists and is seeded.
 *
 * Routes:
 *   GET  /api/content          — get all content keys
 *   GET  /api/content/:page    — get content for a specific page (e.g. "home", "global")
 *   PUT  /api/content          — update content (admin only)
 *   POST /api/content/bulk     — bulk update multiple items (admin only)
 */
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();
const con = (console as any);

// ── Lazy-load or create the ContentStore model ────────────────────────────────
// We use a simple key-value collection rather than polluting SiteSettings.
// Schema: { key: String (unique), value: Mixed }
let ContentStore: mongoose.Model<any>;

function getContentModel() {
  if (ContentStore) return ContentStore;
  if (mongoose.models.ContentStore) {
    ContentStore = mongoose.models.ContentStore;
    return ContentStore;
  }
  const schema = new mongoose.Schema(
    { key: { type: String, required: true, unique: true }, value: { type: mongoose.Schema.Types.Mixed, default: '' } },
    { timestamps: true }
  );
  ContentStore = mongoose.model('ContentStore', schema);
  return ContentStore;
}

// ── Default content seed (used when DB is empty) ──────────────────────────────
const DEFAULT_CONTENT: Record<string, Record<string, any>> = {
  home: {
    hero: {
      title1: 'Transform Your Space',
      title2: 'Transform Your Life',
      subtitle: 'IVAF Certified Vastu Expert — 45,000+ Clients Transformed',
      cta1: 'Book Consultation',
      cta2: 'Explore Services',
      badge: '⭐ India\'s #1 Vastu Consultancy',
    },
    stats: { clients: '45,000+', experience: '15+', services: '50+', cities: '200+' },
    cta: {
      title: 'Start Your Vastu Journey Today',
      subtitle: 'Book a personal consultation with Dr. PPS Tomar',
      button: 'Book @ ₹11 Only',
    },
    featured: {
      title: 'Our Expert Services',
      subtitle: 'Comprehensive Vastu solutions for home, office, and life',
    },
  },
  global: {
    navbar: { phone: '+91-7000343804', badge: '🎯 Book Consultation @ ₹11 Only' },
    popup: {
      title: 'Book Your Vastu Consultation',
      subtitle: 'Get expert guidance from Dr. PPS Tomar',
      badge: '🎉 Special Offer — ₹11 Only',
      cta: 'Book Now',
    },
    seo: {
      title: 'Vastu Arya — India\'s Premier Vastu Consultancy by Dr. PPS Tomar',
      description: 'IVAF Certified Vastu Shastra, Astrology & Gemology expert. 45,000+ clients transformed. Book your consultation today.',
    },
    footer: {
      tagline: 'Transforming Lives Through Ancient Wisdom',
      copyright: `© ${new Date().getFullYear()} Vastu Arya. All rights reserved.`,
    },
  },
};

// ── GET /api/content — return all content ─────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const Model = getContentModel();
    const items = await Model.find({});
    // Build page → section map from flat key-value store
    const result: Record<string, any> = {};
    for (const item of items) {
      result[item.key] = item.value;
    }
    // If empty, return defaults
    if (!items.length) {
      res.json({ success: true, data: DEFAULT_CONTENT });
      return;
    }
    res.json({ success: true, data: result });
  } catch (error: any) {
    con.error('[Content] GET / error:', error.message);
    res.json({ success: true, data: DEFAULT_CONTENT }); // safe fallback
  }
});

// ── GET /api/content/:page — return content for a specific page ───────────────
router.get('/:page', async (req: Request, res: Response) => {
  try {
    const { page } = req.params;
    const Model = getContentModel();
    const item = await Model.findOne({ key: page });
    if (item) {
      res.json({ success: true, data: item.value });
      return;
    }
    // Return defaults for known pages, empty object otherwise
    const defaults = DEFAULT_CONTENT[page] || {};
    res.json({ success: true, data: defaults });
  } catch (error: any) {
    con.error('[Content] GET /:page error:', error.message);
    res.json({ success: true, data: DEFAULT_CONTENT[req.params.page] || {} });
  }
});

// ── PUT /api/content — update or create a content page ───────────────────────
router.put('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { key, value, page, section, field, content } = req.body;

    // Support multiple call signatures the frontend may use
    const resolvedKey   = key   || page || 'home';
    const resolvedValue = value ?? content ?? req.body;

    const Model = getContentModel();
    const item = await Model.findOneAndUpdate(
      { key: resolvedKey },
      { value: resolvedValue },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: item?.value, message: 'Content saved' });
  } catch (error: any) {
    con.error('[Content] PUT / error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/content/bulk — bulk-update multiple pages/keys ─────────────────
router.post('/bulk', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items must be an array' });
    }

    const Model = getContentModel();
    const ops = items.map((item: { key: string; value: any }) => ({
      updateOne: {
        filter: { key: item.key },
        update: { $set: { value: item.value } },
        upsert: true,
      },
    }));

    if (ops.length) await Model.bulkWrite(ops);
    res.json({ success: true, message: `${ops.length} items updated` });
  } catch (error: any) {
    con.error('[Content] POST /bulk error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
