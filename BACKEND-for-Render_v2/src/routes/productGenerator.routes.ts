/// <reference types="node" />
import { Router, Request, Response } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import AISettings from '../models/AISettings';
import rateLimit from 'express-rate-limit';
import { callAI, parseAIJson, sanitiseUserInput } from '../utils/ai.service';

const router  = Router();
const con     = (console as any);
const genLimit = rateLimit({ windowMs: 60 * 1000, max: 10, message: { success: false, message: 'Rate limit reached' } });

router.post('/generate', authMiddleware, adminMiddleware, genLimit, async (req: Request, res: Response) => {
  try {
    const rawInput   = req.body?.input;
    const rawCat     = req.body?.category;
    const input    = sanitiseUserInput(String(rawInput || ''), 300);
    const category = sanitiseUserInput(String(rawCat   || 'spiritual'), 80);

    if (!input || input.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Product name/description required' });
    }

    const slug = input.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

    const prompt = `You are a premium spiritual product copywriter for Vastu Arya, an IVAF Certified Vastu consultancy. Generate a complete product listing for: "${input}" in category: "${category}".

Return ONLY a valid JSON object (no markdown, no backticks) with this EXACT structure:
{
  "name": { "en": "Full Product Name", "hi": "Hindi name" },
  "slug": "${slug}",
  "category": "${category}",
  "description": {
    "en": "3-4 sentence premium product description. Mention: origin/tradition, spiritual significance, chakra connection if applicable, who should use it and how. 80-120 words. Sound premium and trustworthy.",
    "hi": "Hindi translation of description (2-3 sentences)"
  },
  "benefits": [
    "Benefit 1 — specific and authentic",
    "Benefit 2 — chakra or planetary connection",
    "Benefit 3 — practical everyday benefit",
    "Benefit 4 — Vastu or spiritual purpose"
  ],
  "price": 999,
  "offerPrice": 699,
  "sku": "VA-${slug.slice(0,6).toUpperCase()}",
  "stock": 50,
  "isFeatured": false,
  "isNewLaunch": true,
  "isActive": false,
  "images": [""]
}

Rules:
- No fake medical/health cure claims
- Price in Indian Rupees (₹), realistic market price
- Authentic spiritual/Vastu information only
- Keep en description 80-120 words, professional tone
- Return ONLY the JSON, no other text`;

    let rawText = '';
    try {
      const result = await callAI('You are a premium spiritual product copywriter.', prompt);
      rawText = result.text;
    } catch (aiErr: any) {
      con.warn('[ProductGen] AI call failed:', aiErr.message, '— using template');
      // Template fallback
      const templateProduct = {
        name:{ en: input.trim(), hi: '' },
        slug,
        category,
        description:{ en: `Natural ${input.trim()} from authentic sources. This premium spiritual product carries unique energy properties beneficial for meditation, wellbeing and Vastu enhancement. Suitable for daily wear or home placement. Comes with a Dr. PPS Tomar usage guide.`, hi: '' },
        benefits:[`Enhances spiritual awareness`, `Vastu recommended placement`, `Ideal for meditation`, `Premium quality, authenticated`],
        price: 999, offerPrice: 699,
        sku: `VA-${slug.slice(0,6).toUpperCase()}`,
        stock: 50, isFeatured: false, isNewLaunch: true, isActive: false, images:[''],
      };
      return res.json({ success: true, data: templateProduct, source: 'template' });
    }

    // Parse JSON from AI response
    let parsed: any;
    try {
      parsed = parseAIJson(rawText);
    } catch { parsed = null; }

    if (!parsed) {
      return res.status(500).json({ success: false, message: 'AI returned unparseable response. Please try again.' });
    }

    // Ensure required fields
    parsed.slug        = parsed.slug        || slug;
    parsed.category    = parsed.category    || category;
    parsed.isActive    = parsed.isActive    ?? false;
    parsed.isNewLaunch = parsed.isNewLaunch ?? true;
    parsed.images      = parsed.images      || [''];

    const { getGeminiKey } = await import('../utils/ai.service');
    res.json({ success: true, data: parsed, source: getGeminiKey() ? 'gemini' : 'anthropic' });
  } catch (err: any) {
    con.error('[ProductGen] Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Generation failed' });
  }
});

export default router;
