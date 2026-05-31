// server.ts — VastuArya v2 (register payment routes)
// 🔴 MERGE this into your existing server.ts — do not replace the whole file.
// Find the section where you import routes and add these lines:

/*
  ─── ADD THESE IMPORTS ────────────────────────────────────────────────────────
  import paymentRoutes from './routes/payment.routes';
  ─────────────────────────────────────────────────────────────────────────────

  ─── WEBHOOK ROUTE MUST COME BEFORE express.json() ───────────────────────────
  Add this BEFORE app.use(express.json()):

    app.use(
      '/api/payment/webhook',
      express.raw({ type: 'application/json' }),
      paymentRoutes
    );

  ─── THEN register normal payment routes AFTER express.json() ────────────────
    app.use('/api/payment', paymentRoutes);

  ─── SEED PaymentSettings on startup ─────────────────────────────────────────
  Add to your DB connect callback:

    import PaymentSettings from './models/PaymentSettings';

    mongoose.connect(MONGO_URI).then(async () => {
      console.log('MongoDB connected');

      // Seed default payment settings if not present
      const existing = await PaymentSettings.findOne();
      if (!existing) {
        await PaymentSettings.create({
          primaryUPI:      'VASTUARYA@ybl',
          fallbackUPI:     'ARYAVAR@ybl',
          payeeName:       'Vastu Arya',
          razorpayEnabled: true,
          upiEnabled:      true,
          fallbackEnabled: true,
          codEnabled:      false,
        });
        console.log('PaymentSettings seeded');
      }
    });
*/

// ─── FULL MINIMAL server.ts EXAMPLE ──────────────────────────────────────────
// Only use this if you're starting fresh. Otherwise follow the merge notes above.

import express    from 'express';
import cors       from 'cors';
import mongoose   from 'mongoose';
import dotenv     from 'dotenv';
dotenv.config();

import paymentRoutes from './routes/payment.routes';
import PaymentSettings from './models/PaymentSettings';
// ... your other route imports ...

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ── Razorpay webhook (raw body BEFORE json parser) ────────────────────────────
app.use(
  '/api/payment/webhook',
  express.raw({ type: 'application/json' }),
  paymentRoutes
);

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/payment', paymentRoutes);
// app.use('/api/bookings', bookingRoutes);
// app.use('/api/orders',   orderRoutes);
// ... your other routes ...

// ── DB + Start ────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI!)
  .then(async () => {
    console.log('MongoDB connected');

    // Seed default payment settings if absent
    const existing = await PaymentSettings.findOne();
    if (!existing) {
      await PaymentSettings.create({
        primaryUPI:      'VASTUARYA@ybl',
        fallbackUPI:     'ARYAVAR@ybl',
        payeeName:       'Vastu Arya',
        razorpayEnabled: true,
        upiEnabled:      true,
        fallbackEnabled: true,
        codEnabled:      false,
      });
      console.log('✅ PaymentSettings seeded');
    }

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

export default app;
