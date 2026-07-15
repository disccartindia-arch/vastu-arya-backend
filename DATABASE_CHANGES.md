# DATABASE_CHANGES.md — Vastu Arya Backend (Phase E)

## Summary

- **Zero schema-breaking changes.** All modifications are additive indexes on existing collections.
- **No migrations required.** New indexes are built by Mongoose on next process start; MongoDB does this in the background and does not lock the collection for reads or writes.

## Indexes added

### `bookings` collection (model: `Booking`)

```js
BookingSchema.index({ userId: 1, createdAt: -1 });        // /account/bookings list, sorted-newest-first per customer
BookingSchema.index({ paymentId: 1 });                     // Razorpay idempotency lookup + webhook
BookingSchema.index({ razorpayOrderId: 1 });               // Webhook order lookup
BookingSchema.index({ bookingStatus: 1, createdAt: -1 });  // Admin list filtered by status
```

### `orders` collection (model: `Order`)

```js
OrderSchema.index({ user: 1, createdAt: -1 });     // /account/orders list per customer
OrderSchema.index({ paymentId: 1 });                // Razorpay idempotency + webhook
OrderSchema.index({ razorpayOrderId: 1 });          // Webhook order lookup
OrderSchema.index({ status: 1, createdAt: -1 });    // Admin list filtered by status
```

## Field changes

**None.** Every field referenced by Phase E already existed:

- `Booking.paymentId` — set at write time by `verifyPayment`, now also read for idempotency.
- `Booking.razorpayOrderId` — set at write time, now also read by the webhook handler.
- `Booking.userId` — added in Phase D, no change here.
- `Order.paymentId`, `Order.razorpayOrderId`, `Order.user` — same pattern.

## Collections written to (added coverage)

- `payment_audit_logs` — Razorpay `VERIFIED` entries are now written from `verifyPayment` (previously only from UPI verify) and from the webhook (`payment.captured`, `payment.failed`, `refund.processed`).
- `status_audit_logs` — two entries written from every successful Razorpay `verifyPayment` (paymentStatus + bookingStatus). One entry written on `refund.processed`.

## Rollback

If Phase E is reverted, the added indexes remain harmless in the collection metadata — they occupy disk but don't affect correctness. To drop them explicitly:

```js
db.bookings.dropIndex('userId_1_createdAt_-1');
db.bookings.dropIndex('paymentId_1');
db.bookings.dropIndex('razorpayOrderId_1');
db.bookings.dropIndex('bookingStatus_1_createdAt_-1');
db.orders.dropIndex('user_1_createdAt_-1');
db.orders.dropIndex('paymentId_1');
db.orders.dropIndex('razorpayOrderId_1');
db.orders.dropIndex('status_1_createdAt_-1');
```

No data changes to revert — no rows were mutated by Phase E.

## Storage impact

The indexes above are on scalar fields with low cardinality per document. Estimated overhead: roughly **8–12 % of the collection size on disk** across both collections, which is standard for Mongo indexes on OLTP tables. On a 100 k-booking dataset that's typically < 20 MB extra.
