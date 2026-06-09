# FRONTEND-for-Vercel_v7_1 — Payment Fix

## What Changed (v7.1 vs v7)

### CRITICAL FIXES
1. **Fake success bug ELIMINATED** — `BookingConfirmClient` no longer trusts `?status=` URL param
2. **UPI QR now generates from `aryavartguna@ybl`** — was using invalid UPI ID
3. **Razorpay flow** — `onSuccess` only fires after backend HMAC confirmation
4. **UPI option added** to Checkout page
5. **Admin Payment Settings** — correct UPI IDs + fixed API route

### Files Changed
```
app/
├── admin/
│   └── payment-settings/
│       └── page.tsx                    ← correct UPI IDs + /admin/upi-config route
└── (public)/
    ├── booking-confirm/
    │   └── BookingConfirmClient.tsx    ← FAKE SUCCESS FIX (most critical)
    ├── order-status/
    │   └── OrderStatusClient.tsx       ← upi_pending status support
    └── checkout/
        └── CheckoutClient.tsx          ← UPI QR option added

components/
└── common/
    ├── UPIPaymentModal.tsx             ← aryavartguna@ybl QR, real QR generation
    └── AppointmentPopup.tsx            ← full UPI + Razorpay correct flow

lib/
└── razorpay.ts                         ← never success without backend confirmation
```

## Deploy to Vercel

1. Copy these files into your frontend repo (overwrite existing)
2. `git add . && git commit -m "fix: payment system v7.1 - UPI IDs + fake success fix"`
3. `git push` → Vercel auto-deploys

## Environment Variable Required

Make sure this is set in Vercel Dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_RAZORPAY_KEY_ID = rzp_live_XXXXXXXXXXXXXXXX
```
⚠️ NEVER add `RAZORPAY_KEY_SECRET` to frontend — backend only!

## Fake Success Bug — What Was Wrong

Old code in `BookingConfirmClient.tsx`:
```js
// BROKEN — any user could add ?status=paid to URL
setConfirmState(statusParam === 'paid' ? 'paid' : 'pending');
```

New code:
```js
// FIXED — always checks actual DB status from backend
const r = await api.get(`/payment/status/${bookingRef}`);
setConfirmState(r.data.data.paymentStatus === 'paid' ? 'paid' : 'pending');
```

## UPI IDs Used
| UPI ID | Bank | Used in |
|--------|------|---------|
| `aryavartguna@ybl` | SBI | Primary QR, all UPI intents |
| `vastuarya@ybl` | IDBI | Fallback QR option |
