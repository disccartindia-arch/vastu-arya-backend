/// <reference types="node" />
/**
 * server.ts
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 11 — Phase D): four new
 * route mounts —
 *   /api/account/claim    (accountClaim.routes.ts)
 *   /api/account           (account.routes.ts)
 *   /api/admin/customers   (adminCustomerLookup.routes.ts)
 *
 * MOUNT ORDER — verified explicitly against every existing mount in
 * this file, not assumed safe by pattern-matching alone (full
 * reasoning in this round's IMPLEMENTATION_REPORT.md):
 *   - '/api/account/claim' and '/api/account' don't collide with any
 *     EXISTING mount (no existing prefix is a prefix of '/api/account').
 *     Between the two new account mounts themselves, order isn't
 *     actually load-bearing (different HTTP methods), but
 *     accountClaimRoutes is still mounted first as defensive practice.
 *   - '/api/admin/customers' DOES share a prefix with the existing
 *     '/api/admin' mount (adminRoutes) — same shape as the original
 *     bookingStatus-vs-bookings bug. Mounted BEFORE the general
 *     '/api/admin' here, consistent with how '/api/admin/upi-payments'
 *     and '/api/admin/leads' were already correctly ordered ahead of
 *     it in prior rounds.
 *
 * Every other route registration, middleware, CORS config, and the DB
 * connection block are byte-identical to the Phase C version of this
 * file.
 */
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import serviceRoutes from './routes/service.routes';
import productRoutes from './routes/product.routes';
import bookingRoutes from './routes/booking.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import blogRoutes from './routes/blog.routes';
import homepageRoutes from './routes/homepage.routes';
import settingsRoutes from './routes/settings.routes';
import uploadRoutes from './routes/upload.routes';
import searchRoutes from './routes/search.routes';
import reviewRoutes from './routes/review.routes';
import postRoutes from './routes/post.routes';
import configRoutes from './routes/config.routes';
import contentRoutes from './routes/content.routes';
import aiRoutes from './routes/ai.routes';
import aiSettingsRoutes from './routes/aiSettings.routes';
import productGeneratorRoutes from './routes/productGenerator.routes';
import upiPaymentRoutes from './routes/upiPayment.routes';
import adminUpiPaymentsRoutes from './routes/adminUpiPayments.routes';
import leadRoutes from './routes/lead.routes';
import adminLeadsRoutes from './routes/adminLeads.routes';
import bookingStatusRoutes from './routes/bookingStatus.routes';
// NEW — Phase D
import accountClaimRoutes from './routes/accountClaim.routes';
import accountRoutes from './routes/account.routes';
import adminCustomerLookupRoutes from './routes/adminCustomerLookup.routes';

import { errorMiddleware } from './middleware/error.middleware';
import { generalLimiter } from './middleware/rateLimit.middleware';

const app = express();
const con = (console as any);
const env = (process as any).env;
const PORT = env.PORT || 5000;

const allowedOrigins = [
  env.FRONTEND_URL,
  'https://vastuarya.com',
  'https://www.vastuarya.com',
  'http://localhost:3000',
].filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));
app.use('/api', generalLimiter);

app.get('/health', (req, res) => res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() }));

// Most-specific-prefix mounts first — see file header.
app.use('/api/bookings/status', bookingStatusRoutes);
app.use('/api/account/claim', accountClaimRoutes); // NEW
app.use('/api/account', accountRoutes);             // NEW
app.use('/api/admin/customers', adminCustomerLookupRoutes); // NEW
app.use('/api/admin/upi-payments', adminUpiPaymentsRoutes);
app.use('/api/admin/leads', adminLeadsRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/config', configRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-settings', aiSettingsRoutes);
app.use('/api/product-generator', productGeneratorRoutes);

app.use('/api/payment/upi', upiPaymentRoutes);

app.use('/api/leads', leadRoutes);

app.use(errorMiddleware);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

const MONGO_URI = env.MONGO_URI || 'mongodb://localhost:27017/vastuarya';

mongoose.connect(MONGO_URI)
  .then(() => {
    con.log('[DB] MongoDB connected');
    app.listen(PORT, () => {
      con.log(`[Server] Vastu Arya API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    con.error('[DB] MongoDB connection error:', err.message);
    process.exit(1);
  });

process.on('unhandledRejection', (reason) => {
  con.error('[Process] Unhandled rejection:', reason);
});

export default app;
