/// <reference types="node" />
import { Router, Request, Response } from 'express';
import SiteConfig from '../models/SiteConfig';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

const defaultConfigs = [
  { key: 'bg_animations_enabled', value: true, category: 'background', label: 'Enable Background Animations' },
  { key: 'bg_gold_intensity', value: 0.7, category: 'background', label: 'Gold Intensity (0-1)' },
  { key: 'bg_animation_speed', value: 1, category: 'background', label: 'Animation Speed (0.1-3)' },
  { key: 'bg_particle_opacity', value: 0.6, category: 'background', label: 'Particle Opacity' },
  { key: 'bg_star_density', value: 80, category: 'background', label: 'Star Count' },
  { key: 'bg_particles_enabled', value: true, category: 'background', label: 'Enable Particles' },
  { key: 'bg_theme', value: 'luxury-gold', category: 'background', label: 'Visual Theme' },
  { key: 'bg_custom_image', value: '', category: 'background', label: 'Custom Background Image URL' },
  { key: 'client_count', value: '45,000+', category: 'stats', label: 'Client Count Display' },
  { key: 'logo_url', value: '/logo.jpg', category: 'branding', label: 'Logo URL' },
  { key: 'primary_color', value: '#FF6B00', category: 'theme', label: 'Primary Color' },
  { key: 'gold_color', value: '#D4A017', category: 'theme', label: 'Gold Accent Color' },
];

router.get('/', async (req: Request, res: Response) => {
  try {
    const configs = await SiteConfig.find();
    if (configs.length === 0) {
      await SiteConfig.insertMany(defaultConfigs);
      return res.json({ success: true, data: defaultConfigs });
    }
    const result: Record<string, any> = {};
    configs.forEach(c => { result[c.key] = c.value; });
    res.json({ success: true, data: result, raw: configs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const ops = Object.entries(updates).map(([key, value]) => ({
      updateOne: {
        filter: { key },
        update: { $set: { key, value, category: 'general', label: key } },
        upsert: true
      }
    }));
    await SiteConfig.bulkWrite(ops);
    res.json({ success: true, message: 'Config updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
