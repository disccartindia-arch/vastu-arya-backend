/// <reference types="node" />
/**
 * productGenerator.routes.ts — AI-assisted product listing generator for
 * the admin panel. Admin supplies a rough product name/category and gets
 * back a structured draft (description, benefits, SEO-friendly name) they
 * can review and edit before saving via product.controller.ts's createProduct.
 *
 * Uses the same callAI/parseAIJson helpers as the Vastu AI assistant
 * (ai.routes.ts) — same provider fallback chain (Gemini -> Anthropic),
 * same demo-mode behaviour when no keys are configured.
 */
import { Router, Request, Response } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { callAI, parseAIJson, sanitiseUserInput } from '../utils/ai.service';

const router = Router();
const con = (console as any);

const SYSTEM_PROMPT = `You are a product copywriter for Vastu Arya, an Indian spiritual/Vastu e-commerce store selling crystals, gemstones, Rudraksha, yantras and spiritual decor.

Given a rough product name and category, generate a polished listing.

Respond ONLY as JSON, no markdown:
{
  "name": { "en": "polished product name", "hi": "Hindi translation" },
  "description": { "en": "2-3 sentence description", "hi": "Hindi translation" },
  "benefits": ["benefit 1", "benefit 2", "benefit 3", "benefit 4"],
  "seoTitle": "SEO friendly title under 60 chars",
  "seoKeywords": "comma, separated, keywords"
}`;

router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { productName, category } = req.body;
    if (!productName) {
      return res.status(400).json({ success: false, message: 'productName is required.' });
    }
    const cleanName = sanitiseUserInput(productName, 200);
    const cleanCategory = sanitiseUserInput(category || 'spiritual product', 100);

    const { text, source } = await callAI(SYSTEM_PROMPT, `Product: ${cleanName}\nCategory: ${cleanCategory}`);
    const parsed = parseAIJson(text);

    if (!parsed) {
      return res.status(502).json({ success: false, message: 'AI returned an unparseable response. Please try again.' });
    }

    res.json({ success: true, data: parsed, source });
  } catch (error: any) {
    con.error('[ProductGenerator] error:', error.message);
    if (error.message === 'NO_PROVIDER') {
      return res.status(503).json({ success: false, message: 'No AI provider configured. Set GEMINI_API_KEY or ANTHROPIC_API_KEY.' });
    }
    res.status(500).json({ success: false, message: 'Generation failed. Please try again or fill the listing manually.' });
  }
});

export default router;
