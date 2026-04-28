/// <reference types="node" />
/**
 * ai.routes.ts — Vastu AI analysis engine
 *
 * Fixes applied:
 *  1. Category detection — concern text is analysed for 9 distinct categories
 *  2. Category-specific system prompt injection — each category gets tailored Vastu guidance
 *  3. Relevant advice blocks are filtered by category and injected into the prompt
 *  4. Demo mode is category-aware — returns different remedies per category
 *  5. Response validation before sending to frontend
 *  6. Structured logging at every step for debugging
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

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many requests. Please wait a minute.' },
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY DETECTION
// Maps user concern text → one of 9 Vastu concern categories
// ─────────────────────────────────────────────────────────────────────────────
type Category =
  | 'financial'
  | 'relationship'
  | 'health'
  | 'career'
  | 'sleep'
  | 'family'
  | 'business'
  | 'education'
  | 'general';

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  financial:    ['financial','money','wealth','income','salary','debt','loan','savings','loss','losses','funds','broke','poor','expense','investment','profit','cash'],
  relationship: ['relationship','marriage','husband','wife','spouse','love','partner','divorce','separation','affair','romance','couple','matrimony','shaadi','vivah'],
  health:       ['health','illness','disease','sick','hospital','medicine','pain','chronic','cancer','diabetes','bp','blood pressure','sleep problem','headache','fatigue','energy','body'],
  career:       ['career','job','promotion','office','boss','work','employment','business partner','interview','salary hike','transfer','resignation','fired'],
  sleep:        ['sleep','insomnia','nightmare','rest','awake','disturb','dream','bedroom','bed'],
  family:       ['family','children','parents','mother','father','son','daughter','sibling','brother','sister','in-law','domestic','home peace','harmony'],
  business:     ['business','shop','factory','office','clients','customers','sales','revenue','turnover','startup','enterprise','commercial','trade'],
  education:    ['education','study','exam','child','kids','school','college','marks','concentration','focus','memory','learning','academic'],
  general:      [],
};

function detectCategory(concern: string): Category {
  const lower = concern.toLowerCase();
  let best: Category = 'general';
  let bestScore = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
    if (cat === 'general') continue;
    const score = keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  con.log(`[AI] Category detected: ${best} (score: ${bestScore})`);
  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY-SPECIFIC PROMPT INJECTIONS
// Each category adds focused Vastu guidance on top of the base system prompt
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_PROMPT: Record<Category, string> = {
  financial: `
CATEGORY: Financial / Wealth Vastu
Focus your remedies on:
- North zone activation (water element, wealth deity Kuber)
- Locker/safe placement (South-West zone, facing North)
- Removing clutter from North and North-East zones
- Kitchen placement and fire element balance affecting wealth
- Avoid mirrors facing the dining table
Remedies must specifically address money flow, savings retention, and financial stability.`,

  relationship: `
CATEGORY: Relationship / Marriage Vastu
Focus your remedies on:
- South-West bedroom for master bedroom (stability)
- Avoid South-East bedroom for couples (fire element causes arguments)
- Pair imagery, objects in twos — avoid single/broken items
- Rose quartz or paired crystals in South-West
- Avoid cactus, thorny plants indoors
- Repair all leaking taps (represents draining emotions)
Remedies must specifically address harmony, trust, and relationship healing.`,

  health: `
CATEGORY: Health / Wellness Vastu
Focus your remedies on:
- North-East zone for health (keep clean, no toilets here)
- Sleeping with head to South (aligns with Earth's magnetic field)
- Avoid sleeping under beams
- East-facing windows for morning sunlight (prana energy)
- Remove stagnant water, clutter from North-East
- Tulsi plant at entrance or North-East for healing energy
Remedies must specifically address immunity, energy levels, and recovery.`,

  career: `
CATEGORY: Career / Professional Growth Vastu
Focus your remedies on:
- North zone for career (Kuber's direction, new opportunities)
- Study/work desk facing North or East
- Avoid sitting with back to door
- South-West for heavy files, important documents (stability)
- Place recognition awards on South wall
- Blue or green elements in North zone for growth
Remedies must specifically address promotions, opportunities, and professional success.`,

  sleep: `
CATEGORY: Sleep / Rest Vastu
Focus your remedies on:
- Master bedroom in South-West (never North-East)
- Head toward South while sleeping (never North)
- Remove mirrors facing bed or cover them at night
- No TV, electronic devices in bedroom
- Blue or lavender walls in bedroom for calm
- Avoid placing water features in bedroom
- Declutter under the bed completely
Remedies must specifically address sleep quality, nightmares, and restfulness.`,

  family: `
CATEGORY: Family Harmony / Domestic Peace Vastu
Focus your remedies on:
- Living room in North-East or North for peace
- Centre of home (Brahmasthana) must be open and clutter-free
- Family photos in South-West (stability and belonging)
- Avoid fighting-scene art or single/sad imagery
- Camphor burning in centre removes negativity
- Wind chimes at entrance deflect arguments
Remedies must specifically address family bonding, reduced conflicts, and domestic happiness.`,

  business: `
CATEGORY: Business / Commercial Vastu
Focus your remedies on:
- Owner sits facing East or North (growth direction)
- Cash box/safe in South-West facing North
- Main entrance energy — signboard, welcoming, well-lit
- Reception in North-East (first impression zone)
- Avoid sharp corners pointing at owner's desk
- Customer-facing staff should face East
- Keep North-West for marketing, sales staff (movement zone)
Remedies must specifically address customer flow, profitability, and business growth.`,

  education: `
CATEGORY: Education / Children's Studies Vastu
Focus your remedies on:
- Study room in North, North-East, or East
- Study desk facing East or North
- Avoid South-facing study desk
- Yellow or green walls in study room for focus
- Saraswati yantra or image on East wall
- No television or gaming near study area
- Tulsi plant in study area for memory enhancement
Remedies must specifically address concentration, memory, exam performance, and academic success.`,

  general: `
CATEGORY: General Vastu Guidance
Provide balanced Vastu remedies covering:
- Main entrance energy and first impression
- Living room placement and energy flow
- Kitchen and fire element balance
- Bedroom and sleep quality
- Overall home energy circulation
Give practical, implementable remedies suitable for any home situation.`,
};

// ─────────────────────────────────────────────────────────────────────────────
// ADVICE BLOCK FILTERING
// Filters admin-uploaded advice blocks by category relevance
// ─────────────────────────────────────────────────────────────────────────────
const BLOCK_CATEGORY_KEYWORDS: Record<Category, string[]> = {
  financial:    ['wealth','money','north zone','kuber','locker','safe','financial','income'],
  relationship: ['relationship','marriage','couple','south-west','love','partner','bedroom'],
  health:       ['health','north-east','tulsi','healing','immunity','wellness'],
  career:       ['career','north','desk','office','professional','promotion'],
  sleep:        ['sleep','bedroom','mirror','rest','bed'],
  family:       ['family','harmony','living room','brahmasthana','peace','domestic'],
  business:     ['business','commercial','shop','reception','customer','cash box'],
  education:    ['study','education','children','concentration','memory','exam'],
  general:      [],
};

function filterAdviceBlocks(blocks: { title: string; content: string }[], category: Category): { title: string; content: string }[] {
  if (!blocks?.length) return [];
  if (category === 'general') return blocks.slice(0, 3);
  const keywords = BLOCK_CATEGORY_KEYWORDS[category];
  const matched = blocks.filter(b => {
    const text = (b.title + ' ' + b.content).toLowerCase();
    return keywords.some(kw => text.includes(kw));
  });
  // Always return at least 1 block even if no match — admin added them for a reason
  return matched.length ? matched : blocks.slice(0, 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY-AWARE DEMO RESPONSES
// Different hardcoded remedies per category when no AI key is configured
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_REMEDIES: Record<Category, any[]> = {
  financial: [
    { title: '💰 North Zone Activation',   action: 'Keep North zone clutter-free, place Kuber Yantra or money plant', zone: 'North',           benefit: 'Activates wealth and income flow' },
    { title: '🔐 Locker Placement',         action: 'Place your locker/safe in South-West, door opening North',       zone: 'South-West',      benefit: 'Retains money and savings' },
    { title: '💧 Fix Leaking Taps',         action: 'Repair all dripping taps and leaking pipes immediately',         zone: 'Entire home',     benefit: 'Stops financial drain' },
    { title: '🌿 Tulsi in North-East',      action: 'Plant Tulsi or money plant in North-East corner',               zone: 'North-East',      benefit: 'Attracts prosperity energy' },
  ],
  relationship: [
    { title: '🛏 Bedroom Zone',             action: 'Use South-West room as master bedroom for stability',            zone: 'South-West',      benefit: 'Strengthens relationship stability' },
    { title: '💎 Rose Quartz Placement',    action: 'Place a pair of rose quartz crystals in the bedroom',           zone: 'South-West corner',benefit: 'Enhances love and harmony' },
    { title: '🪴 Remove Thorny Plants',     action: 'Remove cactus and thorny plants from indoors',                  zone: 'Entire home',     benefit: 'Reduces arguments and tension' },
    { title: '💧 Repair Leaks',             action: 'Fix all leaking taps — represents emotional drain in Vastu',    zone: 'Kitchen/Bathroom',benefit: 'Restores emotional balance' },
  ],
  health: [
    { title: '🧹 North-East Cleansing',    action: 'Deep-clean North-East corner, remove heavy furniture',           zone: 'North-East',      benefit: 'Activates health and healing energy' },
    { title: '🌙 Correct Sleep Direction',  action: 'Sleep with head toward South, feet toward North',               zone: 'Bedroom',         benefit: 'Aligns with Earth energy, improves immunity' },
    { title: '🌿 Tulsi Plant',             action: 'Place Tulsi plant at entrance or in North-East',                zone: 'Entrance/NE',     benefit: 'Purifies air and invites healing prana' },
    { title: '☀️ Morning Sunlight',         action: 'Open East-facing windows every morning for 30 minutes',         zone: 'East zone',       benefit: 'Vital prana energy boosts vitality' },
  ],
  career: [
    { title: '🧭 North Zone for Career',    action: 'Keep North zone clutter-free, place career-growth symbols',     zone: 'North',           benefit: 'Opens new opportunities' },
    { title: '🪑 Desk Placement',           action: 'Face North or East while working or studying',                  zone: 'Office/Study',    benefit: 'Enhances focus and professional growth' },
    { title: '🏆 Awards on South Wall',     action: 'Display achievements, certificates on South or South-West wall',zone: 'South',           benefit: 'Reinforces recognition and status' },
    { title: '💼 South-West for Files',     action: 'Store important documents and files in South-West corner',      zone: 'South-West',      benefit: 'Stability in career and decisions' },
  ],
  sleep: [
    { title: '🛏 Head Position',            action: 'Sleep with head toward South, never toward North',              zone: 'Bedroom',         benefit: 'Deep restful sleep, no nightmares' },
    { title: '🪞 Cover or Remove Mirrors',  action: 'No mirrors facing the bed; cover them at night',               zone: 'Bedroom',         benefit: 'Eliminates energy disturbance during sleep' },
    { title: '📵 Device-Free Bedroom',      action: 'Remove TV, mobile charger, wifi router from bedroom',          zone: 'Bedroom',         benefit: 'Reduces electromagnetic disturbance' },
    { title: '🧹 Clear Under the Bed',      action: 'Remove all items stored under your bed',                       zone: 'Bedroom floor',   benefit: 'Allows smooth energy flow during sleep' },
  ],
  family: [
    { title: '🕯️ Brahmasthana Clearing',  action: 'Keep the exact centre of home open and clutter-free',           zone: 'Centre (Brahmasthana)', benefit: 'Improves overall family harmony' },
    { title: '📸 Family Photos South-West', action: 'Place happy family photos in South-West zone',                zone: 'South-West',      benefit: 'Strengthens family bond and belonging' },
    { title: '🪔 Camphor Burning',          action: 'Burn camphor in centre of home every evening',                 zone: 'Centre',          benefit: 'Removes negativity, promotes peace' },
    { title: '🔔 Wind Chime at Entrance',  action: 'Hang a metal wind chime at the main entrance',                 zone: 'Main Door',       benefit: 'Deflects arguments and invites positivity' },
  ],
  business: [
    { title: '🧭 Owner Seating',            action: 'Owner/manager must sit facing East or North',                   zone: 'Owner cabin',     benefit: 'Better decisions, growth mindset' },
    { title: '💰 Cash Box Placement',       action: 'Keep cash box/safe in South-West, opening toward North',       zone: 'South-West',      benefit: 'Retains revenue and profits' },
    { title: '🚪 Energise Entrance',        action: 'Keep entrance well-lit, signboard clear, no obstructions',     zone: 'Main entrance',   benefit: 'Attracts customers and opportunities' },
    { title: '🌿 North-East Reception',     action: 'Place reception or water feature in North-East',               zone: 'North-East',      benefit: 'First impression, client trust' },
  ],
  education: [
    { title: '🧭 Study Room Direction',     action: 'Sit facing East or North while studying',                      zone: 'Study room',      benefit: 'Sharpens focus and retention' },
    { title: '🪷 Saraswati Yantra',         action: 'Place Saraswati Yantra or image on East wall of study room',  zone: 'East wall',       benefit: 'Blesses with knowledge and wisdom' },
    { title: '🌿 Tulsi for Memory',         action: 'Keep a Tulsi plant near study area',                          zone: 'Study/North-East',benefit: 'Improves memory and concentration' },
    { title: '📵 Distraction-Free Zone',    action: 'Remove TV and gaming setup from study room completely',        zone: 'Study room',      benefit: 'Eliminates energy that breaks focus' },
  ],
  general: [
    { title: '🪔 Entrance Energising',      action: 'Place a Ganesha idol at main entrance, keep it clean and lit', zone: 'Main entrance',   benefit: 'Attracts positive energy into home' },
    { title: '🧹 North-East Activation',   action: 'Deep-clean North-East zone, place Tulsi or water element',     zone: 'North-East',      benefit: 'Activates health and prosperity zone' },
    { title: '🕯️ Brahmasthana Clearing',  action: 'Keep exact centre of home open, light a lamp here daily',       zone: 'Centre (Brahmasthana)', benefit: 'Harmonises all zones of the home' },
    { title: '💰 North Zone for Wealth',   action: 'Keep North zone clutter-free, place money plant or Kuber',     zone: 'North',           benefit: 'Opens financial energy channels' },
  ],
};

const DEMO_ANALYSIS: Record<Category, string> = {
  financial:    'I understand your financial concerns deeply. Vastu imbalances in the North (wealth zone) and South-West (stability zone) are the most common causes of financial difficulties. These targeted remedies will help restore prosperity flow.',
  relationship: 'I understand the pain of relationship challenges. Vastu imbalances — particularly in the South-West zone (relationships/stability) and bedroom placement — significantly affect harmony between partners. These remedies will help restore love and trust.',
  health:       'I understand your health concerns. The North-East zone (health zone) and sleep direction are the two most critical Vastu factors affecting physical wellbeing. These remedies target the root energy causes of health issues.',
  career:       'I understand your career challenges. The North zone governs professional opportunities in Vastu, and your seating direction directly affects decision-making energy. These remedies will activate career growth.',
  sleep:        'I understand your sleep disturbances. Vastu imbalances — especially incorrect head direction, mirror placement, and electronic devices in the bedroom — are the leading causes of poor sleep. These remedies will restore deep, peaceful rest.',
  family:       'I understand the stress of family conflicts. The Brahmasthana (centre of home) and South-West zone are key to domestic harmony in Vastu. These remedies will help bring peace and understanding to your household.',
  business:     'I understand your business challenges. Commercial Vastu focuses on owner seating, cash flow zones, and entrance energy. These remedies target the Vastu causes of reduced sales and customer flow.',
  education:    'I understand your child\'s study challenges. Study direction, room placement, and the presence of distractions are major Vastu factors affecting academic performance. These remedies will enhance focus and memory.',
  general:      'I understand your Vastu concerns. Here are the most impactful general Vastu remedies that address the most common energy imbalances found in Indian homes.',
};

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS LOADER
// ─────────────────────────────────────────────────────────────────────────────
async function loadSettings(): Promise<any> {
  try {
    let s = await AISettings.findOne();
    if (!s) {
      con.log('[AI] No settings found, creating defaults');
      s = await AISettings.create({});
    }
    return s;
  } catch (e) {
    con.warn('[AI] AISettings DB read failed, using hardcoded defaults:', e);
    return {
      systemPrompt: '',
      commonLines: ['These remedies follow ancient Vastu Shastra principles.'],
      ctaText: 'Book a Consultation with Dr. PPS Tomar',
      showConsultationCTA: true,
      showDisclaimer: true,
      showFollowUp: true,
      disclaimerText: 'AI-generated guidance. For precise results, consult Dr. PPS Tomar personally.',
      followUpText: 'Book a personal session with Dr. PPS Tomar for deeper insights.',
      trustedAdviceBlocks: [],
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BASE SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────
const BASE_SYSTEM_PROMPT = `You are Dr. Pranveer Pratap Singh Tomar (Dr. PPS Tomar), an IVAF Certified Vastu Shastra expert with 15+ years of experience. You have helped 45,000+ clients transform their homes and lives.

CORE RULES:
- Read the user's concern carefully and identify their SPECIFIC problem
- Generate remedies SPECIFICALLY tailored to that exact concern — not generic ones
- NEVER give the same 3 remedies (Ganesha idol, camphor lamp, money plant) for every concern
- Remedies must be DIRECTLY relevant to the category/type of problem described
- Be warm, empathetic, expert-like — address the user's emotional pain first
- Give EXACTLY 3-4 specific, practical Vastu remedies
- Each remedy: what to do, where exactly (direction/room/zone), and why it helps this specific problem
- Respond in the same language the user writes in (English/Hindi mix is fine)
- Keep analysis under 80 words — be direct and empathetic
- Include relevant emojis to make responses engaging

CRITICAL: You MUST adapt your response to the CATEGORY CONTEXT provided below. Remedies for financial problems MUST differ from remedies for relationship issues, sleep problems, career growth, etc.

RESPONSE FORMAT — Return ONLY valid JSON, no markdown, no extra text:
{
  "greeting": "short warm personalized opening (1 sentence)",
  "analysis": "empathetic 1-2 sentence analysis of their specific concern",
  "remedies": [
    { "title": "remedy name with emoji", "action": "specific actionable step", "zone": "exact direction or room", "benefit": "direct benefit for THIS specific concern" }
  ],
  "note": "closing encouragement (1 sentence)",
  "consultationCTA": "natural suggestion for personal consultation"
}`;

// ─────────────────────────────────────────────────────────────────────────────
// BUILD DEMO RESPONSE (category-aware)
// ─────────────────────────────────────────────────────────────────────────────
function buildDemo(concern: string, category: Category, s: any) {
  return {
    greeting:        'Namaste! 🙏',
    analysis:        DEMO_ANALYSIS[category],
    remedies:        DEMO_REMEDIES[category],
    note:            (s.commonLines || ['These remedies follow ancient Vastu Shastra principles.']).join(' '),
    consultationCTA: s.showConsultationCTA ? s.ctaText : '',
    disclaimer:      s.showDisclaimer      ? s.disclaimerText : '',
    followUp:        s.showFollowUp        ? s.followUpText   : '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATE AI RESPONSE
// Ensures the parsed JSON has the required shape before sending to frontend
// ─────────────────────────────────────────────────────────────────────────────
function validateResponse(parsed: any): boolean {
  if (!parsed || typeof parsed !== 'object') return false;
  if (!parsed.greeting || !parsed.analysis) return false;
  if (!Array.isArray(parsed.remedies) || parsed.remedies.length === 0) return false;
  const validRemedies = parsed.remedies.filter((r: any) =>
    r && typeof r === 'object' && r.title && r.action
  );
  return validRemedies.length > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ROUTE: POST /api/ai/vastu-analysis
// ─────────────────────────────────────────────────────────────────────────────
router.post('/vastu-analysis', aiLimiter, async (req: Request, res: Response) => {
  try {
    logProviderStatusOnce();

    // 1. Sanitise inputs
    const concern   = sanitiseUserInput(String(req.body?.concern   || ''), 800);
    const roomType  = sanitiseUserInput(String(req.body?.roomType  || ''), 80);
    const direction = sanitiseUserInput(String(req.body?.direction || ''), 40);

    if (!concern || concern.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Please describe your concern in more detail.' });
    }

    con.log(`[AI] Analysis request | concern length: ${concern.length} | roomType: ${roomType} | direction: ${direction}`);

    // 2. Detect category
    const category = detectCategory(concern);

    // 3. Load admin settings
    const s = await loadSettings();
    con.log(`[AI] Settings loaded | adviceBlocks: ${(s.trustedAdviceBlocks || []).length} | systemPrompt: ${s.systemPrompt ? 'custom' : 'using base'}`);

    // 4. Check provider availability
    const hasGemini    = !!getGeminiKey();
    const hasAnthropic = !!getAnthropicKey();

    if (!hasGemini && !hasAnthropic) {
      con.log(`[AI] Demo mode | category: ${category}`);
      return res.json({ success: true, isDemo: true, category, data: buildDemo(concern, category, s) });
    }

    // 5. Filter advice blocks relevant to this category
    const relevantBlocks = filterAdviceBlocks(s.trustedAdviceBlocks || [], category);
    con.log(`[AI] Relevant advice blocks: ${relevantBlocks.length}/${(s.trustedAdviceBlocks || []).length}`);

    // 6. Build system prompt = base + admin custom prompt + category context
    const adminPromptSection = s.systemPrompt?.trim()
      ? `\n\nADMIN ADDITIONAL INSTRUCTIONS:\n${s.systemPrompt}`
      : '';

    const systemPrompt = [
      BASE_SYSTEM_PROMPT,
      adminPromptSection,
      CATEGORY_PROMPT[category],
      (s.commonLines || []).filter(Boolean).length
        ? `\nALWAYS include in note field: "${s.commonLines.filter(Boolean).join(' ')}"`
        : '',
      s.showConsultationCTA
        ? `\nConsultation CTA: "${s.ctaText}"`
        : '\nDo NOT include consultationCTA.',
    ].filter(Boolean).join('\n');

    // 7. Build user message with full context
    const adviceBlockText = relevantBlocks.length
      ? `\n\nRELEVANT VASTU KNOWLEDGE BASE (use this to make remedies more specific):\n${relevantBlocks.map(b => `• ${b.title}: ${b.content}`).join('\n')}`
      : '';

    const userMessage = [
      `USER CONCERN: ${concern}`,
      roomType  ? `Room/Space Type: ${roomType}`           : '',
      direction ? `Home/Office Facing Direction: ${direction}` : '',
      `Detected Problem Category: ${category.toUpperCase()}`,
      adviceBlockText,
    ].filter(Boolean).join('\n');

    con.log(`[AI] Calling provider | system: ${systemPrompt.length} chars | user: ${userMessage.length} chars`);

    // 8. Call AI
    let rawText = '';
    let source  = '';
    try {
      const result = await callAI(systemPrompt, userMessage);
      rawText = result.text;
      source  = result.source;
      con.log(`[AI] Response received from ${source} | length: ${rawText.length}`);
    } catch (e: any) {
      if (e.message === 'NO_PROVIDER' || e.message === 'ALL_PROVIDERS_FAILED') {
        con.warn(`[AI] All providers failed | category: ${category} | falling back to category-aware demo`);
        return res.json({ success: true, isDemo: true, category, data: buildDemo(concern, category, s) });
      }
      throw e;
    }

    // 9. Parse JSON response
    let parsed = parseAIJson(rawText);
    con.log(`[AI] JSON parsed: ${parsed ? 'success' : 'failed'}`);

    // 10. Validate response shape
    if (!validateResponse(parsed)) {
      con.warn('[AI] Response validation failed — using category-aware demo');
      con.warn('[AI] Raw response was:', rawText.slice(0, 200));
      return res.json({ success: true, isDemo: true, category, data: buildDemo(concern, category, s) });
    }

    // 11. Inject admin-controlled display fields
    if (s.showConsultationCTA && !parsed.consultationCTA) parsed.consultationCTA = s.ctaText;
    if (s.showDisclaimer) parsed.disclaimer = s.disclaimerText;
    if (s.showFollowUp)   parsed.followUp   = s.followUpText;

    // 12. Ensure remedies are clean
    parsed.remedies = parsed.remedies.filter((r: any) => r?.title && r?.action);

    con.log(`[AI] Sending response | category: ${category} | source: ${source} | remedies: ${parsed.remedies.length}`);
    return res.json({ success: true, data: parsed, source, category });

  } catch (err: any) {
    con.error('[AI] Fatal error in vastu-analysis:', err.message);
    return res.status(500).json({ success: false, message: 'AI analysis temporarily unavailable. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STATUS ENDPOINT — admin debug
// ─────────────────────────────────────────────────────────────────────────────
router.get('/status', async (req: Request, res: Response) => {
  const g = getGeminiKey();
  const a = getAnthropicKey();
  res.json({
    success: true,
    providers: {
      gemini:    { configured: !!g, keyPreview: g ? g.slice(0, 8) + '...' : null },
      anthropic: { configured: !!a, keyPreview: a ? a.slice(0, 8) + '...' : null },
    },
    mode: (g || a) ? 'live' : 'demo',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUGGESTIONS — public, used by frontend chips
// ─────────────────────────────────────────────────────────────────────────────
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const s = await AISettings.findOne().select('quickSuggestions');
    res.json({ success: true, data: s?.quickSuggestions || [] });
  } catch {
    res.json({ success: true, data: [] });
  }
});

export default router;
