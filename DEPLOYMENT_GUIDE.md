# DEPLOYMENT_GUIDE.md — Vastu Arya Backend (Phase E)

Backend deploys unchanged from prior rounds — Render + MongoDB Atlas + Cloudinary + SMTP. The only new operational concern is the Razorpay webhook + Emergent LLM key.

## 1. Node runtime & install

- Node 18 or 20 (constraint in `package.json`).
- `npm install` (or `yarn install`) installs 219 packages.
- `npm run build` → `tsc` → `dist/`. `npm start` → `node dist/server.js`.
- Alternatively for zero-build: `npm run dev` uses `ts-node`.

## 2. Environment variables

See `.env.example`. **New required for Phase E:**

| Variable                     | Required? | Purpose                                                                            |
|------------------------------|-----------|------------------------------------------------------------------------------------|
| `EMERGENT_LLM_KEY`           | Yes for AI (or set GEMINI_API_KEY/ANTHROPIC_API_KEY as fallback) | Primary AI provider — single key, GPT-4o + vision. |
| `RAZORPAY_WEBHOOK_SECRET`    | Yes for webhook | Signing secret from Razorpay Dashboard → Settings → Webhooks. Without this, `/api/payment/webhook` refuses every request.        |

**Existing (unchanged):** `MONGO_URI`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `SMTP_HOST/PORT/USER/PASS`, `ADMIN_NOTIFICATION_EMAIL`, `CLOUDINARY_*`, `FRONTEND_URL`, `WHATSAPP_NUMBER`, `GEMINI_API_KEY` (optional), `ANTHROPIC_API_KEY` (optional).

## 3. Razorpay dashboard configuration

After deploy:

1. **Razorpay Dashboard → Settings → Webhooks → Add Webhook**.
2. **URL**: `https://<your-backend-domain>/api/payment/webhook`
3. **Active Events** (tick these three; you may add more, unhandled events are `200 ack`'d):
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
4. **Secret**: copy the value shown by Razorpay → paste into `RAZORPAY_WEBHOOK_SECRET` in your Render env vars → **Redeploy** the service so the new env is loaded.
5. Razorpay's "Send test webhook" tool should now return HTTP 200 with `{success:true,message:"..."}` in the response body.

## 4. AI provider setup

- Preferred: obtain the Emergent Universal Key from Profile → Universal Key → Copy. Set as `EMERGENT_LLM_KEY`.
- Alternative (grandfathered): set `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` — code still supports them as fallbacks in the same order documented in `ai.service.ts`.
- Neither key set → the AI endpoints will return the "provider-failure" fallback with `needsMoreInfo:true`, encouraging the user to retry. Never returns fake answers.

## 5. Post-deploy smoke tests

```bash
BASE=https://<your-backend>/api

# 1) Health
curl -s "$BASE/health"

# 2) AI provider status — should show emergent:true
curl -s "$BASE/ai/status"

# 3) Public AI settings — should list quick suggestions
curl -s "$BASE/ai-settings/public"

# 4) Payment settings — should list primaryUPI, fallbackUPI, payeeName
curl -s "$BASE/payment/settings"

# 5) AI vastu analysis
curl -s -X POST "$BASE/ai/vastu-analysis" \
  -H "Content-Type: application/json" \
  -d '{"concern":"My kitchen faces east, is this okay?","roomType":"Kitchen","direction":"East","sessionId":"deploy-smoke-1"}'

# 6) Webhook (simulate Razorpay). Compute HMAC with your webhook secret first.
SECRET="paste-your-webhook-secret"
BODY='{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_smoke","order_id":"order_smoke","amount":1100}}}}'
SIG=$(node -e "console.log(require('crypto').createHmac('sha256',process.argv[1]).update(process.argv[2]).digest('hex'))" "$SECRET" "$BODY")
curl -s -X POST "$BASE/payment/webhook" -H "Content-Type: application/json" -H "X-Razorpay-Signature: $SIG" -d "$BODY"
```

## 6. Rollback

- To revert Phase E while keeping Phase D:
  1. `git revert <the-phase-E-commit-range>` in your `vastu-arya-backend` repo.
  2. Redeploy.
- The new indexes on Booking/Order are additive — they can be safely left in place even if the code is rolled back. Optionally drop them per the commands in DATABASE_CHANGES.md.
- No data was mutated by Phase E code paths; only additive rows in `payment_audit_logs` and `status_audit_logs`. No cleanup required.

## 7. Known deploy hiccups

- **Render free tier cold start** — first request after idle takes ~ 20 s while the container spins up. The **frontend** `api.ts` already retries once at 3 s, so users see a 3-second delay, not a failure. Nothing to change on the backend.
- **Mongo Atlas free tier** — cold connection can take 2–3 s on top of Node cold start. Same acceptable behaviour.
- **First AI call after deploy** — Emergent proxy occasionally takes 3–5 s on first hit; the fallback branch will not fire unless the provider actually errors. Fine.

## 8. Frontend integration

The updated Next.js frontend at `vastuarya.com` already calls every endpoint touched in Phase E. No frontend redeploy is required.

If you have a preview / staging frontend hitting a different backend URL, make sure `NEXT_PUBLIC_API_URL` points to a backend that has Phase E deployed. Older backends will 404 `/api/ai/vastu-analysis` (see `FRONTEND_BACKEND_COMPATIBILITY_REPORT.md`).
