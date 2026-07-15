# API_CHANGELOG.md — Vastu Arya Backend (Phase E)

## Added

### `POST /api/ai/vastu-analysis`
Public. Vastu analysis with optional multi-image upload.

- **Request (JSON)**
  ```json
  { "concern": "string (required, ≥5 chars)",
    "roomType": "string (optional)",
    "direction": "string (optional)",
    "sessionId": "string (optional, enables conversation memory)" }
  ```
- **Request (multipart, when images are attached)**
  Same fields as above, plus 1–4 `images` file parts (`image/*`, ≤ 25 MB each).
- **Response**
  ```json
  { "success": true,
    "data": {
      "greeting": "...",
      "analysis": "...",
      "summary": "...",
      "recommendations": ["..."],
      "warnings":        ["..."],
      "nextSteps":       ["..."],
      "remedies": [{ "title":"...", "action":"...", "zone":"...", "benefit":"..." }],
      "followUp":     ["..."],
      "confidence":   "low | medium | high",
      "note":         "...",
      "needsMoreInfo": false,
      "clarifyingQuestions": [],
      "disclaimer":   "...",
      "consultationCTA": "..."
    },
    "meta": { "source": "emergent", "sessionId": "...", "hasImages": false }
  }
  ```
- **Rate limit**: `generalLimiter` (200 / 15 min per IP).

### `GET /api/ai-settings/public`
Public. Returns visitor-safe subset of AISettings (quickSuggestions, ctaText, disclaimer/followUp toggles + text). No systemPrompt, no trustedAdviceBlocks.

### `POST /api/payment/webhook`
Public but HMAC-authenticated. Razorpay signed webhook.

- Headers required: `X-Razorpay-Signature`.
- Signature = `sha256(RAZORPAY_WEBHOOK_SECRET, JSON.stringify(body))`.
- Events handled:
  - `payment.captured` — writes `PaymentAuditLog(VERIFIED)`; safety net if client-side verify was missed.
  - `payment.failed` — writes `PaymentAuditLog(REJECTED)`; cancels any Booking linked by `razorpayOrderId`.
  - `refund.processed` — updates linked Booking `paymentStatus=refunded`; writes `StatusAuditLog` + fires customer notification.
- Response: `{ success: true, message: string }`. Always 200 on unhandled events (ack) unless HMAC fails (401) or handler crashes (500).

## Changed (behaviour, not path)

### `POST /api/payment/verify`
- **Idempotent**: repeat calls with the same `razorpay_payment_id` short-circuit to the existing Booking/Order and return `data.idempotent: true`. No duplicate document, no duplicate email.
- On success now also writes:
  - `PaymentAuditLog(VERIFIED, adminUser='razorpay-auto')` — payment method now has audit parity with the UPI flow.
  - `StatusAuditLog(paymentStatus: pending→verified)` and `StatusAuditLog(bookingStatus: pending_payment→confirmed)` — the customer timeline on `/account/bookings/[bookingId]` is now populated for Razorpay bookings.
- Fires `notificationService.sendCustomerUpdate` for `bookingStatus=confirmed` — email content is the same as when an admin drives the transition.
- Request/response envelope: **unchanged** (except the optional `data.idempotent: true` marker on the short-circuit path).

## Unchanged (verified for backwards compatibility)

- Every other public route path.
- Response envelope on all existing endpoints — `{ success, data | message, ... }`.
- `POST /api/ai/chat` — legacy chat still returns the older `greeting/analysis/remedies/note/consultationCTA/disclaimer/followUp(string)` shape.
- `POST /api/payment/upi/submit`, `GET /api/payment/upi/status/:ref` — no behavioural changes.
- All admin routes.
- All `/account/*` routes (paths, params, response shapes).

## Deprecated (still supported, may be removed in a future major)

- `POST /api/ai/chat` — new FE calls `/vastu-analysis` instead. Kept for any external consumer or older FE build.
