# Vastu Arya Backend - Patch Files

## Files Changed (copy these into your backend repo)

| File | Fix |
|------|-----|
| src/routes/ai.routes.ts | CRITICAL: /api/ai/status now returns {available, message, model} — fixes AI OFFLINE in admin |
| src/utils/ai.service.ts | Updated Anthropic model: claude-3-haiku-20240307 → claude-3-5-haiku-20241022 |
| src/models/AISettings.ts | Updated default systemPrompt: 73,000+ (was 45,000+) |
| src/routes/content.routes.ts | Updated DEFAULT_CONTENT: 73,000+ (was 45,000+) |
| src/utils/email.ts | Fixed booking confirmation email: real phone number, WhatsApp button |

## Deploy Steps

1. Copy all files from this zip into your backend repo (matching paths)
2. Run: npm run build
3. Commit and push — Render auto-deploys
4. Check Render logs: should see "Vastu Arya API v3.0 on port 10000"

## For seed.ts (too large to include):
Run this from backend root:
  sed -i 's/45,000+ clients/73,000+ clients/g' src/utils/seed.ts
  sed -i 's/45,000+ Clients/73,000+ Clients/g' src/utils/seed.ts

## Why AI was showing OFFLINE (even with API key set)

The /api/ai/status endpoint returned:
  { success, providers: {...}, mode: 'live' }

But the frontend's aiStatusAPI.check() checked:
  r.data.available  ← this field didn't exist!

So available was always undefined → falsy → showed OFFLINE.
Now fixed to return: { available: true, message, model, providers, mode }
