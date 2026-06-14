# INSTALLATION.md
## VastuArya.com — v2.4 Deployment Guide

---

## STEP 1: Environment Variables

Add these to Vercel (Production environment):

```env
# Razorpay — LIVE keys (fixes "Test Mode" banner)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_live_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# No UPI-specific env vars needed — UPI config is in payment.config.ts
```

> ⚠️ If `NEXT_PUBLIC_RAZORPAY_KEY_ID` starts with `rzp_test_`, the checkout will show "Test Mode".

---

## STEP 2: Files to Add (Frontend)

Copy these files into your Next.js frontend project:

```
config/payment.config.ts                        → /your-project/config/payment.config.ts
components/payment/UpiPaymentModal.tsx          → /your-project/components/payment/UpiPaymentModal.tsx
components/payment/ServicePaymentButtons.tsx    → /your-project/components/payment/ServicePaymentButtons.tsx
hooks/useUpiPayment.ts                          → /your-project/hooks/useUpiPayment.ts
utils/productImageAudit.ts                      → /your-project/utils/productImageAudit.ts
app/api/payment/upi-pending/route.ts            → /your-project/app/api/payment/upi-pending/route.ts
app/api/products/route.ts                       → /your-project/app/api/products/route.ts
```

---

## STEP 3: Add QR Images (CRITICAL)

```
public/images/qr/upi-primary-aryavartguna.jpeg    ← Primary QR (aryavartguna@ybl / SBI)
public/images/qr/upi-secondary-vastuarya.jpeg     ← Secondary QR (vastuarya@ybl / IDBI)
```

Both images are included in the Frontend ZIP.

---

## STEP 4: Files to Add (Backend)

```
models/UpiPayment.ts                            → /your-backend/models/UpiPayment.ts
controllers/upiVerificationController.ts        → /your-backend/controllers/upiVerificationController.ts
controllers/productImageAuditController.ts      → /your-backend/controllers/productImageAuditController.ts
routes/adminUpiRoutes.ts                        → /your-backend/routes/adminUpiRoutes.ts
```

Register the admin routes in your Express server:
```typescript
// server.ts or app.ts
import adminUpiRouter from "./routes/adminUpiRoutes";
app.use("/admin", adminAuthMiddleware, adminUpiRouter);
```

---

## STEP 5: Fix Service Count (TASK 1)

Search your project for `"100+"`:
```bash
grep -r "100+" . --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js"
```

Replace `"100+ Services"` → `"25+ Services"` in every location found.

To use the config value instead of hardcoding:
```tsx
import { PAYMENT_CONFIG } from "@/config/payment.config";
// ...
<span>{PAYMENT_CONFIG.serviceCount}+ Services by IVAF Certified Expert Dr. PPS Tomar</span>
```

---

## STEP 6: Replace Broken UPI Buttons (TASK 2)

Find any component that previously rendered UPI buttons (search for `vastuarya@upi`, `generateQR`, `manualPayment`):

```bash
grep -r "vastuarya@upi\|generateQR\|manualPayment\|UPI_QR\|upi://pay" . --include="*.tsx" --include="*.ts"
```

Replace each broken UPI button block with:

```tsx
import ServicePaymentButtons from "@/components/payment/ServicePaymentButtons";

<ServicePaymentButtons
  amount={service.price}          // e.g. 500 for ₹500
  serviceName={service.name}
  serviceId={service._id}
  bookingId={booking?._id}        // optional
  onUpiSubmitted={(refId) => {
    // show confirmation toast
    toast.success(`Payment submitted! Reference: ${refId}`);
  }}
  onRazorpayClick={handleRazorpayPayment}  // your existing Razorpay function
/>
```

---

## STEP 7: Product Image Audit (TASK 3)

After deploying the backend:

```bash
# Preview which products will be hidden (no changes):
curl -X GET https://your-render-url.onrender.com/admin/products/audit-images \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Review the response, then execute:
curl -X POST https://your-render-url.onrender.com/admin/products/audit-images \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

The audit sets `isActive: false` on products with missing images.
The public `/api/products` route already filters these out.

---

## STEP 8: Build & Deploy

### Frontend (Vercel)
```bash
npm run build          # verify no TypeScript errors
git add .
git commit -m "v2.4: UPI fix, service count update, product image audit"
git push origin main   # Vercel auto-deploys
```

### Backend (Render)
```bash
# Render auto-deploys on git push if connected
# Or trigger manual deploy from Render dashboard
```

---

## STEP 9: Verification

1. Open VastuArya.com → Click any service → Click "Pay via UPI"
   - ✅ Modal should open with QR code
   - ✅ UPI ID: `aryavartguna@ybl` should be visible and copyable
   - ✅ Amount should match service price

2. Click Razorpay checkout button
   - ✅ Should NOT show "Test Mode" banner (if live keys are set)
   - ✅ Should show "VastuArya" as merchant name

3. Check homepage service count
   - ✅ Should show "25+ Services"

4. Check product grid
   - ✅ Only products with real images should appear

5. Run `GET /admin/products/audit-images` to see audit results

---

## STEP 10: Create /public/uploads/upi-screenshots directory

Render's ephemeral filesystem resets on redeploy. For production:
- Use Cloudinary or AWS S3 for screenshot storage
- Or use MongoDB GridFS
- As a temporary measure, the local filesystem write will work until the next deploy

To switch to Cloudinary (recommended), update the `upi-pending/route.ts` file's screenshot-saving logic to use Cloudinary upload instead of `writeFile`.

---

## Admin Panel Access

After deployment, admin can view pending UPI payments at:
```
GET /admin/upi-payments                    — list all UPI_PENDING
GET /admin/upi-payments?status=PAID        — list verified
POST /admin/upi-payments/:id/verify        — approve payment
POST /admin/upi-payments/:id/reject        — reject payment
```
