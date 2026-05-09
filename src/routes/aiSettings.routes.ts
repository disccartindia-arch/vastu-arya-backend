/// <reference types="node" />
import { Router, Request, Response } from 'express';
import AISettings from '../models/AISettings';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// ── PUBLIC: returns only safe fields needed by the frontend UI ────────────────
// No auth required — never exposes systemPrompt, keys, or admin-only data
router.get('/public', async (req: Request, res: Response) => {
  try {
    const s = await AISettings.findOne().select(
      'quickSuggestions ctaText showConsultationCTA trustedAdviceBlocks'
    );
    res.json({
      success: true,
      data: {
        quickSuggestions:    s?.quickSuggestions    || [],
        ctaText:             s?.ctaText             || 'Book a Consultation with Dr. PPS Tomar',
        showConsultationCTA: s?.showConsultationCTA ?? true,
        // expose only titles of advice blocks (not full content — that stays server-side)
        adviceBlockTitles:   (s?.trustedAdviceBlocks || []).map((b: any) => b.title).filter(Boolean),
      },
    });
  } catch {
    res.json({
      success: true,
      data: {
        quickSuggestions: [],
        ctaText: 'Book a Consultation with Dr. PPS Tomar',
        showConsultationCTA: true,
        adviceBlockTitles: [],
      },
    });
  }
});

// ── ADMIN: full settings read ─────────────────────────────────────────────────
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    let settings = await AISettings.findOne();
    if (!settings) settings = await AISettings.create({});
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── ADMIN: update settings ────────────────────────────────────────────────────
router.put('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const allowed = [
      'systemPrompt', 'commonLines', 'ctaText',
      'showConsultationCTA', 'showDisclaimer', 'showFollowUp',
      'disclaimerText', 'followUpText', 'quickSuggestions', 'trustedAdviceBlocks',
    ];
    const update: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const settings = await AISettings.findOneAndUpdate({}, update, { new: true, upsert: true });
    res.json({ success: true, data: settings, message: 'AI settings saved successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── ADMIN: reset to defaults ──────────────────────────────────────────────────
router.post('/reset', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    await AISettings.deleteMany({});
    const settings = await AISettings.create({});
    res.json({ success: true, data: settings, message: 'Reset to defaults' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
