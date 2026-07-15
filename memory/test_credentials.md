# Test Credentials — Vastu Arya (local pod only)

These credentials exist **only** on the local test MongoDB used for the Phase E
end-to-end test run. Production databases are untouched.

## Customer user

- **Email:** `e1test@example.com`
- **Password:** `testpass123`
- **Role:** `user`
- Local Mongo DB: `vastuarya_e1_test` (Mongo URL `mongodb://localhost:27017/vastuarya_e1_test`)

## Sample verified Razorpay booking (created during E2E)

- **Booking ID:** `BK1784093080029677`
- **Service:** Home Vastu
- **Amount:** ₹11
- **Razorpay payment_id:** `pay_e1_001`
- **Razorpay order_id:** `order_test`
- **paymentStatus / bookingStatus:** `verified` / `confirmed`

## Admin credentials

Not created by this phase. Use `npm run seed` (`src/utils/seed.ts`) to seed admin +
services + products in a fresh environment. The default admin email/password
are documented inside `seed.ts`.

## Emergent LLM key

Bundled in `.env` as `EMERGENT_LLM_KEY=sk-emergent-002E481429f5aDdAeC` (Emergent
Universal Key, injected via `emergent_integrations_manager` at build time).
This key enables text + vision AI. Do NOT commit it to a public git repo; the
`.env` file is git-ignored.

## How to reset

```bash
# From /app/backend:
mongosh --quiet vastuarya_e1_test --eval 'db.dropDatabase()'
```

This wipes only the local test DB; production Mongo Atlas is unaffected.
