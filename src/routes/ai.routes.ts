/// <reference types="node" />
/**
 * ai.routes.ts — FIXED VERSION
 * 1. /api/ai/status now returns {available, message, model} — fixes AI OFFLINE in admin dashboard
 * 2. 73,000+ clients everywhere (was 45,000+)
 * 3. Category-aware remedies unchanged
 */
import { Router, Request, Response } from 'express';
import AISettings from '../models/AISettings';
import rateLimit from 'express-rate-limit';
import {
  callAI, parseAIJson, getGeminiKey, getAnthropicKey,
  sanitiseUserInput, logProviderStatusOnce,
} from '../utils/ai.service';

const router = Router();
const con = (console as any);
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 15, message: { success: false, message: 'Too many requests. Please wait a minute.' } });

type Category = 'financial' | 'relationship' | 'health' | 'career' | 'sleep' | 'family' | 'business' | 'education' | 'general';

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  financial: ['financial','money','wealth','income','salary','debt','loan','savings','loss','funds','broke','expense','profit','cash'],
  relationship: ['relationship','marriage','husband','wife','spouse','love','partner','divorce','separation','couple','matrimony'],
  health: ['health','illness','disease','sick','hospital','pain','chronic','fatigue','energy','body','headache'],
  career: ['career','job','promotion','office','boss','work','employment','interview','salary hike','fired'],
  sleep: ['sleep','insomnia','nightmare','rest','awake','disturb','dream','bedroom','bed'],
  family: ['family','children','parents','mother','father','son','daughter','sibling','domestic','harmony'],
  business: ['business','shop','factory','clients','customers','sales','revenue','startup','enterprise','trade'],
  education: ['education','study','exam','child','kids','school','college','marks','concentration','focus','memory'],
  general: [],
};

function detectCategory(concern: string): Category {
  const lower = concern.toLowerCase();
  let best: Category = 'general'; let bestScore = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
    if (cat === 'general') continue;
    const score = keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}

const CATEGORY_PROMPT: Record<Category, string> = {
  financial: 'CATEGORY: Financial Vastu — focus on North zone (Kuber), locker in SW, fix leaking taps, remove North clutter.',
  relationship: 'CATEGORY: Relationship Vastu — focus on SW bedroom, paired objects, rose quartz, repair leaks.',
  health: 'CATEGORY: Health Vastu — focus on NE cleansing, head toward South sleep, Tulsi plant, East sunlight.',
  career: 'CATEGORY: Career Vastu — focus on North zone, desk facing North/East, files in SW, awards on South.',
  sleep: 'CATEGORY: Sleep Vastu — focus on head toward South, no mirrors facing bed, device-free bedroom, clear under bed.',
  family: 'CATEGORY: Family Harmony Vastu — focus on Brahmasthana open, family photos SW, camphor burning, wind chimes.',
  business: 'CATEGORY: Business Vastu — focus on owner facing East/North, cash box in SW, energised entrance, NE reception.',
  education: 'CATEGORY: Education Vastu — focus on desk facing East/North, Saraswati yantra, Tulsi near study, no distractions.',
  general: 'CATEGORY: General Vastu — balance entrance, living room, kitchen, bedroom energy.',
};

const DEMO_REMEDIES: Record<Category, any[]> = {
  financial: [
    { title: 'North Zone Activation', action: 'Keep North zone clutter-free, place Kuber Yantra or money plant', zone: 'North', benefit: 'Activates wealth and income flow' },
    { title: 'Locker Placement', action: 'Place locker/safe in South-West, door opening North', zone: 'South-West', benefit: 'Retains money and savings' },
    { title: 'Fix Leaking Taps', action: 'Repair all dripping taps immediately', zone: 'Entire home', benefit: 'Stops financial drain' },
    { title: 'Tulsi in North-East', action: 'Plant Tulsi or money plant in North-East corner', zone: 'North-East', benefit: 'Attracts prosperity energy' },
  ],
  relationship: [
    { title: 'Bedroom Zone', action: 'Use South-West room as master bedroom', zone: 'South-West', benefit: 'Strengthens relationship stability' },
    { title: 'Rose Quartz', action: 'Place a pair of rose quartz crystals in the bedroom', zone: 'SW corner', benefit: 'Enhances love and harmony' },
    { title: 'Remove Thorny Plants', action: 'Remove cactus and thorny plants from indoors', zone: 'Entire home', benefit: 'Reduces arguments' },
    { title: 'Repair Leaks', action: 'Fix all leaking taps — represents emotional drain', zone: 'Kitchen/Bathroom', benefit: 'Restores emotional balance' },
  ],
  health: [
    { title: 'North-East Cleansing', action: 'Deep-clean North-East corner, remove heavy furniture', zone: 'North-East', benefit: 'Activates healing energy' },
    { title: 'Sleep Direction', action: 'Sleep with head toward South, feet toward North', zone: 'Bedroom', benefit: 'Improves immunity' },
    { title: 'Tulsi Plant', action: 'Place Tulsi at entrance or in North-East', zone: 'Entrance/NE', benefit: 'Purifies air and prana' },
    { title: 'Morning Sunlight', action: 'Open East-facing windows every morning for 30 minutes', zone: 'East zone', benefit: 'Boosts vitality' },
  ],
  career: [
    { title: 'North Zone', action: 'Keep North zone clutter-free, place career symbols', zone: 'North', benefit: 'Opens new opportunities' },
    { title: 'Desk Direction', action: 'Face North or East while working', zone: 'Office/Study', benefit: 'Enhances professional growth' },
    { title: 'Awards on South', action: 'Display achievements on South or SW wall', zone: 'South', benefit: 'Reinforces recognition' },
    { title: 'Files in SW', action: 'Store important documents in South-West', zone: 'South-West', benefit: 'Career stability' },
  ],
  sleep: [
    { title: 'Head Position', action: 'Sleep with head toward South, never North', zone: 'Bedroom', benefit: 'Deep restful sleep' },
    { title: 'Cover Mirrors', action: 'No mirrors facing the bed; cover at night', zone: 'Bedroom', benefit: 'Eliminates energy disturbance' },
    { title: 'Device-Free', action: 'Remove TV, mobile charger, wifi from bedroom', zone: 'Bedroom', benefit: 'Reduces electromagnetic disturbance' },
    { title: 'Clear Under Bed', action: 'Remove all items stored under your bed', zone: 'Bedroom floor', benefit: 'Smooth energy flow during sleep' },
  ],
  family: [
    { title: 'Brahmasthana', action: 'Keep exact centre of home open and clutter-free', zone: 'Centre', benefit: 'Improves family harmony' },
    { title: 'Family Photos', action: 'Place happy family photos in South-West zone', zone: 'South-West', benefit: 'Strengthens family bond' },
    { title: 'Camphor Burning', action: 'Burn camphor in centre of home every evening', zone: 'Centre', benefit: 'Removes negativity' },
    { title: 'Wind Chime', action: 'Hang a metal wind chime at the main entrance', zone: 'Main Door', benefit: 'Deflects arguments' },
  ],
  business: [
    { title: 'Owner Seating', action: 'Owner must sit facing East or North', zone: 'Owner cabin', benefit: 'Better decisions, growth' },
    { title: 'Cash Box', action: 'Keep cash box in South-West, opening toward North', zone: 'South-West', benefit: 'Retains revenue' },
    { title: 'Energise Entrance', action: 'Keep entrance well-lit, signboard clear', zone: 'Main entrance', benefit: 'Attracts customers' },
    { title: 'NE Reception', action: 'Place reception or water feature in North-East', zone: 'North-East', benefit: 'Client trust' },
  ],
  education: [
    { title: 'Study Direction', action: 'Sit facing East or North while studying', zone: 'Study room', benefit: 'Sharpens focus' },
    { title: 'Saraswati Yantra', action: 'Place Saraswati Yantra on East wall of study room', zone: 'East wall', benefit: 'Knowledge and wisdom' },
    { title: 'Tulsi for Memory', action: 'Keep a Tulsi plant near study area', zone: 'Study/NE', benefit: 'Improves memory' },
    { title: 'Distraction-Free', action: 'Remove TV and gaming from study room', zone: 'Study room', benefit: 'Eliminates energy breaks' },
  ],
  general: [
    { title: 'Entrance Energy', action: 'Place Ganesha at main entrance, keep clean and lit', zone: 'Main entrance', benefit: 'Attracts positive energy' },
    { title: 'NE Activation', action: 'Deep-clean North-East, place Tulsi or water element', zone: 'North-East', benefit: 'Health and prosperity' },
    { title: 'Brahmasthana', action: 'Keep exact centre of home open, light lamp daily', zone: 'Centre', benefit: 'Harmonises all zones' },
    { title: 'North Wealth Zone', action: 'Keep North zone clutter-free, place money plant', zone: 'North', benefit: 'Opens financial channels' },
  ],
};

const DEMO_ANALYSIS: Record<Category, string> = {
  financial: 'I understand your financial concerns. North zone imbalances and South-West instability are the most common Vastu causes of financial difficulties.',
  relationship: 'Relationship challenges often stem from South-West bedroom placement and broken objects in the home. These remedies address the Vastu root causes.',
  health: 'Health issues in Vastu are often linked to North-East zone blockages and incorrect sleep direction. These remedies activate the healing zones.',
  career: 'Career stagnation in Vastu is often caused by North zone blockages and incorrect work desk direction. These remedies will activate growth.',
  sleep: 'Sleep disturbances are most often caused by incorrect head direction and electronic devices in the bedroom.',
  family: 'Family conflicts are often rooted in a blocked Brahmasthana (centre) and misplaced family energy.',
  business: 'Business challenges in Vastu relate to entrance energy, owner seating and cash flow zones.',
  education: 'Academic performance is deeply affected by study direction, room placement and distractions.',
  general: 'Here are the most impactful general Vastu remedies for the most common energy imbalances in Indian homes.',
};

async function loadSettings(): Promise<any> {
  try {
    let s = await AISettings.findOne();
    if (!s) s = await AISettings.create({});
    return s;
  } catch {
    return { systemPrompt: '', commonLines: [], ctaText: 'Book a Consultation with Dr. PPS Tomar', showConsultationCTA: true, showDisclaimer: true, showFollowUp: true, disclaimerText: 'AI-generated guidance. Personal consultation recommended.', followUpText: 'Book a session with Dr. PPS Tomar for deeper insights.', trustedAdviceBlocks: [] };
  }
}

// FIXED: 73,000+ (was 45,000+)
const BASE_SYSTEM_PROMPT = `You are Dr. Pranveer Pratap Singh Tomar (Dr. PPS Tomar), IVAF Certified Vastu Shastra expert with 15+ years of experience and 73,000+ clients transformed.

RULES:
- Give EXACTLY 3-4 remedies SPECIFIC to the user's concern — never generic
- Be warm, empathetic, expert-like
- Respond in same language as user (English/Hindi)
- Keep analysis under 80 words

RESPONSE FORMAT — Return ONLY valid JSON:
{
  "greeting": "short warm opening",
  "analysis": "empathetic 1-2 sentence analysis",
  "remedies": [{ "title": "emoji + name", "action": "specific step", "zone": "direction/room", "benefit": "direct benefit" }],
  "note": "closing encouragement",
  "consultationCTA": "natural consultation suggestion"
}`;

function buildDemo(concern: string, category: Category, s: any) {
  return {
    greeting: 'Namaste! 🙏',
    analysis: DEMO_ANALYSIS[category],
    remedies: DEMO_REMEDIES[category],
    note: (s.commonLines || ['These remedies follow ancient Vastu Shastra principles.']).join(' '),
    consultationCTA: s.showConsultationCTA ? s.ctaText : '',
    disclaimer: s.showDisclaimer ? s.disclaimerText : '',
    followUp: s.showFollowUp ? s.followUpText : '',
  };
}

function validateResponse(parsed: any): boolean {
  if (!parsed || typeof parsed !== 'object') return false;
  if (!parsed.greeting || !parsed.analysis) return false;
  if (!Array.isArray(parsed.remedies) || parsed.remedies.length === 0) return false;
  return parsed.remedies.filter((r: any) => r?.title && r?.action).length > 0;
}

router.post('/vastu-analysis', aiLimiter, async (req: Request, res: Response) => {
  try {
    logProviderStatusOnce();
    const concern   = sanitiseUserInput(String(req.body?.concern   || ''), 800);
    const roomType  = sanitiseUserInput(String(req.body?.roomType  || ''), 80);
    const direction = sanitiseUserInput(String(req.body?.direction || ''), 40);
    if (!concern || concern.trim().length < 10) return res.status(400).json({ success: false, message: 'Please describe your concern in more detail.' });

    const category = detectCategory(concern);
    const s = await loadSettings();
    const hasGemini = !!getGeminiKey(); const hasAnthropic = !!getAnthropicKey();
    if (!hasGemini && !hasAnthropic) return res.json({ success: true, isDemo: true, category, data: buildDemo(concern, category, s) });

    const adminSection = s.systemPrompt?.trim() ? `\n\nADMIN INSTRUCTIONS:\n${s.systemPrompt}` : '';
    const systemPrompt = [BASE_SYSTEM_PROMPT, adminSection, CATEGORY_PROMPT[category]].filter(Boolean).join('\n');
    const userMessage = [`USER CONCERN: ${concern}`, roomType ? `Room: ${roomType}` : '', direction ? `Direction: ${direction}` : '', `Category: ${category.toUpperCase()}`].filter(Boolean).join('\n');

    let rawText = ''; let source = '';
    try { const r = await callAI(systemPrompt, userMessage); rawText = r.text; source = r.source; }
    catch (e: any) {
      if (e.message === 'NO_PROVIDER' || e.message === 'ALL_PROVIDERS_FAILED') return res.json({ success: true, isDemo: true, category, data: buildDemo(concern, category, s) });
      throw e;
    }

    let parsed = parseAIJson(rawText);
    if (!validateResponse(parsed)) return res.json({ success: true, isDemo: true, category, data: buildDemo(concern, category, s) });
    if (s.showConsultationCTA && !parsed.consultationCTA) parsed.consultationCTA = s.ctaText;
    if (s.showDisclaimer) parsed.disclaimer = s.disclaimerText;
    if (s.showFollowUp) parsed.followUp = s.followUpText;
    parsed.remedies = parsed.remedies.filter((r: any) => r?.title && r?.action);
    return res.json({ success: true, data: parsed, source, category });
  } catch (err: any) {
    con.error('[AI] Fatal error:', err.message);
    return res.status(500).json({ success: false, message: 'AI analysis temporarily unavailable.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FIXED STATUS ENDPOINT
// Previously returned {providers, mode} — frontend expected {available, message, model}
// This mismatch caused the admin dashboard to ALWAYS show AI as OFFLINE
// ─────────────────────────────────────────────────────────────────────────────
router.get('/status', async (req: Request, res: Response) => {
  const g = getGeminiKey();
  const a = getAnthropicKey();
  const available = !!(g || a);
  const activeModel = a ? 'claude-3-5-haiku-20241022' : (g ? 'gemini-1.5-flash' : null);
  res.json({
    success: true,
    available,                                    // ADDED — was missing, caused OFFLINE display
    model: activeModel,                           // ADDED — was missing
    message: available
      ? `AI online — ${a ? 'Anthropic Claude' : 'Gemini'}${g && a ? ' (Gemini primary + Anthropic fallback)' : ''} active`
      : 'No AI keys configured. Add ANTHROPIC_API_KEY in Render environment variables.',
    providers: {
      gemini:    { configured: !!g, keyPreview: g ? g.slice(0, 8) + '...' : null },
      anthropic: { configured: !!a, keyPreview: a ? a.slice(0, 8) + '...' : null },
    },
    mode: available ? 'live' : 'demo',
  });
});

router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const s = await AISettings.findOne().select('quickSuggestions');
    res.json({ success: true, data: s?.quickSuggestions || [] });
  } catch { res.json({ success: true, data: [] }); }
});

export default router;
