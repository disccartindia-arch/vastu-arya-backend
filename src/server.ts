/// <reference types="node" />
/**
 * server.ts
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 8 — Phase B, Feature 4):
 *   app.use('/api/bookings/status', bookingStatusRoutes)
 * This is the ONLY change in this file. Mounted as a sibling to the
 * existing /api/bookings (admin-only, full CRUD) route group — note the
 * deliberate path distinction: /api/bookings/status/:id is the new
 * public, minimal-field, read-only endpoint; /api/bookings (no
 * /status segment) remains the existing admin-only booking.routes.ts,
 * completely untouched. Express resolves these correctly since
 * /api/bookings/status is registered as its own router mount, not a
 * route inside booking.routes.ts.
 *
 * ROUTING ORDER NOTE (caught during this round's own review, not a
 * pre-existing issue): Express matches mounted routers by path PREFIX
 * in REGISTRATION ORDER, not by specificity. Mounting
 * '/api/bookings/status' AFTER '/api/bookings' would mean every request
 * to /api/bookings/status/:id matches the EXISTING bookingRoutes router
 * first (since that path starts with '/api/bookings'), hitting its
 * GET /:id handler with id="status" instead of ever reaching the new
 * route. To avoid this, '/api/bookings/status' is mounted BEFORE
 * '/api/bookings' below — Express tries mounts in registration order,
 * so the more specific path now gets first chance to match. The
 * existing '/api/bookings' router (admin CRUD) is completely unaffected
 * by this reordering — it still matches everything it did before, just
 * after the new, more specific mount has had first refusal.
 *
 * Every other route registration, middleware, CORS config, and the DB
 * connection block are byte-identical to the Phase A version of this
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
// NEW — Phase B, Feature 4: public booking status lookup
import bookingStatusRoutes from './routes/bookingStatus.routes';

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

// NEW — Phase B, Feature 4: GET /api/bookings/status/:bookingId
// Mounted BEFORE /api/bookings (see routing order note above) so this
// more specific path is matched first.
app.use('/api/bookings/status', bookingStatusRoutes);

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
app.use('/api/admin/upi-payments', adminUpiPaymentsRoutes);

app.use('/api/leads', leadRoutes);
app.use('/api/admin/leads', adminLeadsRoutes);

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
