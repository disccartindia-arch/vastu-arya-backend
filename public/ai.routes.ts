/// <reference types="node" />
/**
 * ai.routes.ts — Vastu AI endpoints (Phase E).
 *
 * PHASE E CHANGES (backward-compatible, additive):
 *
 *   • NEW  POST /api/ai/vastu-analysis      — the endpoint the new
 *          frontend uses. Accepts either JSON (`{ concern, roomType?,
 *          direction?, sessionId? }`) OR multipart (same fields plus
 *          up to 4 `images` file parts, each an image/*). Returns the
 *          structured `{ greeting, analysis, summary, recommendations,
 *          warnings, nextSteps, remedies, followUp[], confidence,
 *          note, disclaimer, needsMoreInfo?, clarifyingQuestions? }`
 *          contract the new UI renders.
 *
 *   • NEW  Session context store — a lightweight per-sessionId
 *          rolling buffer of the last 6 user turns kept in memory
 *          (never persisted, never keyed by identity). Passed as
 *          `context[]` to the LLM so replies feel conversational
 *          instead of stateless.
 *
 *   • KEPT POST /api/ai/chat                — legacy path. Same JSON
 *          contract as before; ai.routes.ts (existing consumers)
 *          continue to work unchanged.
 *
 *   • KEPT GET  /api/ai/status              — provider status probe.
 *   • KEPT GET  /api/ai/quick-suggestions   — chip suggestions.
 */
import { Router, Request, Response } from 'express';
import AISettings from '../models/AISettings';
import {
  callAI, callAIStructured, callAIVision, parseAIJson,
  sanitiseUserInput, getProviderStatus, logProviderStatusOnce,
} from '../utils/ai.service';
import { upload } from './upload.routes';

const router = Router();
const con = (console as any);

logProviderStatusOnce();

// ── Lightweight per-session context store ───────────────────────────
// In-memory, capped, no persistence, no PII. Cleared when the process
// restarts. Good enough for "does the AI remember what I just said
// during this browsing session" — a real durable store (Mongo) is a
// future improvement, deliberately not in this phase.
const SESSION_CACHE_MAX  = 500;
const SESSION_TURNS_MAX  = 6;
const SESSION_TTL_MS     = 30 * 60 * 1000; // 30 minutes

type SessionEntry = { turns: string[]; lastSeen: number };
const sessionStore = new Map<string, SessionEntry>();

function rememberTurn(sessionId: string, turn: string) {
  if (!sessionId) return;
  let entry = sessionStore.get(sessionId);
  if (!entry) entry = { turns: [], lastSeen: Date.now() };
  entry.turns.push(turn);
  if (entry.turns.length > SESSION_TURNS_MAX) entry.turns.shift();
  entry.lastSeen = Date.now();
  sessionStore.set(sessionId, entry);
  // Evict old entries when we cross the cap
  if (sessionStore.size > SESSION_CACHE_MAX) {
    const now = Date.now();
    for (const [k, v] of sessionStore) {
      if (now - v.lastSeen > SESSION_TTL_MS) sessionStore.delete(k);
      if (sessionStore.size <= SESSION_CACHE_MAX) break;
    }
  }
}

function recallContext(sessionId: string): string[] {
  if (!sessionId) return [];
  const entry = sessionStore.get(sessionId);
  if (!entry) return [];
  if (Date.now() - entry.lastSeen > SESSION_TTL_MS) {
    sessionStore.delete(sessionId);
    return [];
  }
  return entry.turns.slice(0, -1); // exclude the current turn (added just before recall)
}

// ── GET /api/ai/status ─────────────────────────────────────────────
router.get('/status', async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, data: getProviderStatus() });
  } catch {
    res.json({ success: true, data: { emergent: false, gemini: false, anthropic: false, mode: 'demo' } });
  }
});

// ── GET /api/ai/quick-suggestions ──────────────────────────────────
router.get('/quick-suggestions', async (_req: Request, res: Response) => {
  try {
    let settings = await AISettings.findOne();
    if (!settings) settings = await AISettings.create({});
    res.json({ success: true, data: settings.quickSuggestions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/ai/vastu-analysis (NEW — Phase E) ────────────────────
// Accepts JSON OR multipart. When multipart, up to 4 `images` parts
// are forwarded to the vision-capable structured call.
router.post('/vastu-analysis', upload.array('images', 4), async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const concern   = sanitiseUserInput(body.concern   || body.message || '', 1200);
    const roomType  = sanitiseUserInput(body.roomType  || '', 60);
    const direction = sanitiseUserInput(body.direction || '', 60);
    const sessionId = sanitiseUserInput(body.sessionId || req.headers['x-session-id']?.toString() || '', 80);

    if (!concern) return res.status(400).json({ success: false, message: 'concern is required.' });

    const files = (req.files as Express.Multer.File[]) || [];
    const images = files.slice(0, 4).map(f => `data:${f.mimetype};base64,${f.buffer.toString('base64')}`);

    // Compose the user message (backend-side, so the model always sees
    // room+direction if the user picked them, regardless of client).
    const userMsg = [
      concern,
      roomType  ? `Room type: ${roomType}`           : '',
      direction ? `Facing direction: ${direction}`   : '',
      images.length ? `The user also attached ${images.length} image(s) of the space.` : '',
    ].filter(Boolean).join('\n');

    // Persist this turn to the session context BEFORE calling the LLM
    // so the model sees it (but recallContext excludes the just-added
    // current turn — see helper).
    rememberTurn(sessionId, userMsg);
    const context = recallContext(sessionId);

    let settings = await AISettings.findOne();
    if (!settings) settings = await AISettings.create({});

    try {
      const { payload, source } = images.length
        ? await callAIVision(settings.systemPrompt, userMsg, images)
        : await callAIStructured(settings.systemPrompt, userMsg, { context });

      // Attach adornments the model doesn't produce
      const data: any = {
        ...payload,
        // If the LLM omitted followUp / confidence, don't invent —
        // just carry through whatever it returned.
        disclaimer: settings.showDisclaimer ? settings.disclaimerText : undefined,
        consultationCTA: settings.showConsultationCTA ? settings.ctaText : undefined,
      };

      res.json({ success: true, data, meta: { source, sessionId, hasImages: images.length > 0 } });
    } catch (aiErr: any) {
      con.error('[AI /vastu-analysis] provider error:', aiErr.message);
      // Production fix: NO static/canned fallback. If the LLM fails
      // we surface a real error to the client — better a retry-able
      // 503 than a "static-feeling" hardcoded reply.
      res.status(503).json({
        success: false,
        message: 'AI is temporarily unavailable. Please try again in a few seconds.',
        meta: { source: 'provider-failure', sessionId, hasImages: images.length > 0 },
      });
    }
  } catch (error: any) {
    con.error('[AI /vastu-analysis] handler error:', error.message);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// ── POST /api/ai/chat (LEGACY) ─────────────────────────────────────
// Kept byte-compatible with prior consumers. Response envelope is
// unchanged. Uses the same underlying provider fan-out via callAI.
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'message is required.' });
    }
    const cleanMessage = sanitiseUserInput(message, 800);
    if (!cleanMessage) {
      return res.status(400).json({ success: false, message: 'Please describe your Vastu concern.' });
    }

    let settings = await AISettings.findOne();
    if (!settings) settings = await AISettings.create({});

    try {
      const { text, source } = await callAI(settings.systemPrompt, cleanMessage);
      const parsed = parseAIJson(text);

      if (!parsed) {
        return res.json({
          success: true,
          data: {
            greeting: 'Namaste!',
            analysis: text.slice(0, 400),
            remedies: [],
            note: settings.commonLines[0] || '',
            consultationCTA: settings.showConsultationCTA ? settings.ctaText : undefined,
          },
          meta: { source, parsed: false },
        });
      }

      res.json({
        success: true,
        data: {
          ...parsed,
          disclaimer: settings.showDisclaimer ? settings.disclaimerText : undefined,
          followUp: settings.showFollowUp ? settings.followUpText : undefined,
        },
        meta: { source, parsed: true },
      });
    } catch (aiError: any) {
      con.error('[AI Chat] provider error:', aiError.message);
      // Production fix: NO static/canned "trustedAdviceBlocks" fallback.
      // Returning a hardcoded advice block made replies feel static
      // to real users. Now we return a real 503 the client can retry.
      res.status(503).json({
        success: false,
        message: 'AI is temporarily unavailable. Please try again in a few seconds.',
        meta: { source: 'provider-failure' },
      });
    }
  } catch (error: any) {
    con.error('[AI Chat] error:', error.message);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

export default router;
