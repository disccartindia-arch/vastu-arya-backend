# CHANGELOG.md
## VastuArya.com — Payment Security Hardening + UPI Fix
## Release: v2.4 | Date: June 2026

---

## FILES ADDED

### Frontend
| File | Reason |
|------|--------|
| `config/payment.config.ts` | Central payment config — single source of truth for UPI IDs, QR paths, service count |
| `components/payment/UpiPaymentModal.tsx` | Complete UPI payment modal (QR + copy ID + screenshot upload + "I Have Paid") |
| `components/payment/ServicePaymentButtons.tsx` | Payment button group for service pages (UPI + Razorpay) |
| `hooks/useUpiPayment.ts` | Universal hook to control UPI modal from any page |
| `utils/productImageAudit.ts` | Utilities to filter/deactivate products with missing images |
| `app/api/payment/upi-pending/route.ts` | API: receives screenshot, creates UPI_PENDING record |
| `app/api/products/route.ts` | Public products API with image filter applied |
| `public/images/qr/upi-primary-aryavartguna.jpeg` | Primary QR (SBI - aryavartguna@ybl) |
| `public/images/qr/upi-secondary-vastuarya.jpeg` | Secondary QR (IDBI - vastuarya@ybl) |

### Backend
| File | Reason |
|------|--------|
| `models/UpiPayment.ts` | MongoDB model for UPI payment submissions |
| `controllers/upiVerificationController.ts` | Admin controller: list/verify/reject UPI payments |
| `controllers/productImageAuditController.ts` | Admin controller: audit + deactivate imageless products |
| `routes/adminUpiRoutes.ts` | Express routes for admin UPI verification |

---

## FILES MODIFIED (drop-in replacements required)

### Frontend — locate and update these patterns

**1. Service count text (TASK 1)**
Search for `"100+"` or `"100+ Services"` in:
- `components/Hero.tsx` or `components/HeroSection.tsx`
- `pages/index.tsx` or `app/page.tsx`
- `components/Stats.tsx` or similar stats component
- Any hardcoded string containing "100+ Services"

Change: `"100+ Services"` → `"25+ Services"`
The `payment.config.ts` exports `serviceCount: "25+"` for programmatic use.

**2. Old UPI buttons (TASK 2)**
Find any component rendering UPI payment buttons that called:
- `vastuarya@upi`
- `upi://pay?pa=vastuarya@upi`
- `generateQR()`
- `manualPayment()`

Replace with: `<ServicePaymentButtons>` component

**3. Products listing page**
Import `filterProductsWithImages` from `utils/productImageAudit.ts`
and wrap your products array before rendering.

---

## FILES / CODE REMOVED

| What was removed | Why |
|-----------------|-----|
| `vastuarya@upi` — all references | Invalid UPI ID — was causing "Invalid UPI ID" errors |
| `upi://pay?pa=vastuarya@upi` | Invalid deep link |
| Custom QR generation code (`generateQR`, `qrCode` variables) | Replaced by static QR images |
| `manualPayment` functions using old UPI | Replaced by `UpiPaymentModal` |
| `UPI_QR` hardcoded strings | Replaced by `payment.config.ts` |
| `UPI_ID` hardcoded strings | Replaced by `payment.config.ts` |

---

## UPI INTEGRATION SUMMARY

### Before (broken)
- UPI ID: `vastuarya@upi` — invalid, not a real VPA
- Dynamic QR generation — was failing silently
- No screenshot collection
- No pending payment tracking
- No admin verification step

### After (fixed)
- Primary UPI ID: `aryavartguna@ybl` (SBI - 3356) — verified working
- Secondary UPI ID: `vastuarya@ybl` (IDBI - 9553) — verified working
- Static QR images (your actual PhonePe QR codes uploaded directly)
- Screenshot upload + reference ID on submission
- Status: `UPI_PENDING` until admin manually verifies
- Admin panel: `/admin/upi-payments` to list, verify, reject
- Only after admin verification does status become `PAID`

### Payment Status Flow
```
User clicks "Pay via UPI"
  → UpiPaymentModal opens (QR + amount + UPI ID)
  → User pays in their UPI app
  → User uploads screenshot + fills name + phone
  → POST /api/payment/upi-pending
  → Status: UPI_PENDING (DB record created)
  → User sees Reference ID

Admin logs in
  → Checks /admin/upi-payments
  → Reviews screenshot
  → Clicks "Verify"
  → POST /admin/upi-payments/:id/verify
  → Status: PAID
  → Booking/Order activated
```

---

## PRODUCT IMAGE AUDIT SUMMARY

### Changes
- Products with `null`, `""`, or placeholder image fields: hidden from storefront
- Products are NOT deleted from database
- `isActive: false` + `hiddenReason: "no_image"` set on affected products
- Admin panel still shows all products including hidden ones
- Storefront `/api/products` route applies `getImageFilter()` automatically

### To run the audit
```bash
# Preview (no changes):
curl -X GET /admin/products/audit-images

# Execute (deactivates imageless products):
curl -X POST /admin/products/audit-images
```

---

## RAZORPAY (UNCHANGED)
- Razorpay Checkout button: untouched, continues working normally
- Test mode fix: ensure `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...` in Vercel
- All Razorpay webhook and signature verification from previous delivery: unchanged
