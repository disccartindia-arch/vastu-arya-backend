/// <reference types="node" />
/**
 * config.routes.ts
 *
 * Serves the Website Editor's configAPI calls — background animations,
 * particle settings, and other runtime-configurable keys that don't belong
 * in SiteSettings (which is for contact/SEO data).
 *
 * Routes:
 *   GET /api/config       — return all config key-value pairs
 *   PUT /api/config       — update one or more keys (admin only)
 *
 * Stored as a single MongoDB document (singleton pattern, same as AISettings).
 */
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();
const con = (console as any);

// ── Lazy model (singleton key-value config document) ─────────────────────────
let ConfigModel: mongoose.Model<any>;

function getConfigModel() {
  if (ConfigModel) return ConfigModel;
  if (mongoose.models.SiteConfig) {
    ConfigModel = mongoose.models.SiteConfig;
    return ConfigModel;
  }
  const schema = new mongoose.Schema(
    { _singleton: { type: String, default: 'main', unique: true }, data: { type: mongoose.Schema.Types.Mixed, default: {} } },
    { timestamps: true }
  );
  ConfigModel = mongoose.model('SiteConfig', schema);
  return ConfigModel;
}

// ── Defaults (mirrors BG_FIELDS in website-editor/page.tsx) ──────────────────
const DEFAULTS: Record<string, any> = {
  bg_animations_enabled: true,
  bg_particles_enabled:  true,
  bg_gold_intensity:     0.6,
  bg_animation_speed:    1.0,
  bg_particle_opacity:   0.4,
  bg_star_density:       80,
};

// ── GET /api/config ───────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const Model = getConfigModel();
    let doc = await Model.findOne({ _singleton: 'main' });
    if (!doc) doc = await Model.create({ _singleton: 'main', data: DEFAULTS });
    // Merge with defaults so new keys always have a value
    const merged = { ...DEFAULTS, ...(doc.data || {}) };
    res.json({ success: true, data: merged });
  } catch (error: any) {
    con.error('[Config] GET / error:', error.message);
    res.json({ success: true, data: DEFAULTS }); // safe fallback
  }
});

// ── PUT /api/config ───────────────────────────────────────────────────────────
router.put('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    // Accept either { key: val, key2: val2 } flat object, or { data: { ... } }
    const incoming = req.body?.data ?? req.body;

    // Whitelist only known safe config keys (prevent storing arbitrary data)
    const ALLOWED_PREFIXES = ['bg_', 'theme_', 'feature_', 'ui_'];
    const filtered: Record<string, any> = {};
    for (const [k, v] of Object.entries(incoming)) {
      const allowed = ALLOWED_PREFIXES.some(prefix => k.startsWith(prefix));
      if (allowed) filtered[k] = v;
    }

    const Model = getConfigModel();
    const doc = await Model.findOneAndUpdate(
      { _singleton: 'main' },
      { $set: { data: { ...DEFAULTS, ...filtered } } },
      { new: true, upsert: true }
    );
    const merged = { ...DEFAULTS, ...(doc?.data || {}) };
    res.json({ success: true, data: merged, message: 'Config saved' });
  } catch (error: any) {
    con.error('[Config] PUT / error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
