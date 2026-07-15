# AI_ENGINE_AUDIT.md — Vastu Arya AI (Phase E)

## 1. Before this phase — the "static" problem, diagnosed

The frontend correctly reported that responses "appear repetitive and static". Root causes found:

| Cause                                                                                             | Evidence                                     |
|---------------------------------------------------------------------------------------------------|----------------------------------------------|
| **Wrong endpoint** — frontend called `POST /api/ai/vastu-analysis`; backend only had `/chat`.     | Every AI request returned **404** in production. |
| **No conversation memory** — each `/chat` call was stateless.                                     | Backend had no session store.                |
| **Demo-fallback fired even when keys were configured** on cold starts, because the LLM call would time-out and the handler returned one of exactly two hardcoded `trustedAdviceBlocks`. | `ai.routes.ts` demo-fallback branch, `AISettings.trustedAdviceBlocks` default. |
| **Response shape too narrow** — no `summary / recommendations / warnings / nextSteps / followUp[] / confidence`. | `AISettings.systemPrompt` requested only `greeting/analysis/remedies/note/consultationCTA`. |
| **No image support** — the frontend already accepts up to 4 photos, but nothing on the backend consumed them. |

## 2. Classification (per problem-statement requirement)

The **prior** backend behaviour on a working key was **LLM-powered** (Gemini 1.5 Flash primary, Anthropic Haiku 3.5 fallback). It was NOT template/rule/cached — genuine model calls happened. The **appearance of** static behaviour was two things:

1. The 404 → the FE never actually reached the LLM in production.
2. The demo-fallback path — used any time the key was missing, or the LLM 5xx'd on cold start — returned one of two rotating hardcoded blocks, so those two customer touches always looked identical.

## 3. This phase — genuine dynamic AI

- **Primary provider: Emergent Universal Key** — `EMERGENT_LLM_KEY`. Single key routes to GPT-4o (vision-capable) / GPT-4o-mini (text). See `src/utils/ai.service.ts` → `_callEmergent`.
- **Fallback chain** — if `EMERGENT_LLM_KEY` is unset, we fall through to direct `GEMINI_API_KEY` and then direct `ANTHROPIC_API_KEY`. Existing deployments with either of those keep working.
- **Endpoint** — `POST /api/ai/vastu-analysis` (JSON) OR multipart with up to 4 `images` parts. Backwards-compatible `POST /api/ai/chat` retained.
- **JSON contract** — the system prompt explicitly asks for the new frontend shape: `greeting/analysis/summary/recommendations/warnings/nextSteps/remedies/followUp[]/confidence/note/needsMoreInfo/clarifyingQuestions`. Emergent's OpenAI-compatible endpoint is called with `response_format: { type: "json_object" }` when no images are attached, which forces strict JSON.
- **Uncertainty handling** — the prompt explicitly instructs "Never fabricate specifics" and to set `needsMoreInfo: true` + populate `clarifyingQuestions` when images are ambiguous or context is thin. Confidence pill on the FE reflects `payload.confidence`.
- **Conversation context** — an in-memory map keyed by `sessionId` retains the last 6 user turns for up to 30 min, sent to the LLM as `Prior conversation` in the system-prompt suffix. Two calls with the same `sessionId` produce contextually connected replies (verified in TESTING_REPORT.md).

## 4. Image analysis

- Multipart POST with `images` field × up to 4 files (limit enforced by `multer` config already in `upload.routes.ts`).
- Each file is base64-encoded and sent as an OpenAI vision `image_url` content-part to Emergent's `gpt-4o` model.
- Model is instructed to refuse-with-questions when the image is unreadable, unclear, or unrecognisable as a floor plan — see `callAIVision` in `ai.service.ts` and the prompt rules in `callAIStructured`.
- **Uses**: floor plans, house layouts, commercial layouts, site plans, blueprints, land images — anything the model can OCR-then-reason on.
- Frontend already renders `needsMoreInfo` / `clarifyingQuestions` (part of the FE contract) so ambiguous-image responses flow through cleanly.

## 5. Response contract (JSON — final shape)

```json
{
  "success": true,
  "data": {
    "greeting": "…",
    "analysis": "…",
    "summary":  "…",
    "recommendations": ["…"],
    "warnings":        ["…"],
    "nextSteps":       ["…"],
    "remedies": [{ "title": "…", "action": "…", "zone": "…", "benefit": "…" }],
    "followUp":     ["…"],
    "confidence":   "low | medium | high",
    "note":         "…",
    "needsMoreInfo": false,
    "clarifyingQuestions": [],
    "disclaimer":   "…",
    "consultationCTA": "…"
  },
  "meta": { "source": "emergent", "sessionId": "...", "hasImages": false }
}
```

**Backward compatibility:** `POST /api/ai/chat` still returns the older `greeting/analysis/remedies/note/disclaimer/followUp(string)` shape — no legacy consumer breaks.

## 6. Streaming readiness

Not shipped this phase (frontend PRD deferred SSE to later). The FE's `useVastuChat` engine is streaming-ready. Enabling SSE on the backend is a ≤ 60-line change to `ai.routes.ts` (swap `res.json` for `text/event-stream` and push chunks from the Emergent SDK's streaming completion). Documented as backlog.
