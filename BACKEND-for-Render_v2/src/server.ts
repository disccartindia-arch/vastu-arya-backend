/// <reference types="node" />
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
const env = (process as any).env;
const con = (console as any);

import authRoutes from './routes/auth.routes';
import serviceRoutes from './routes/service.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import bookingRoutes from './routes/booking.routes';
import blogRoutes from './routes/blog.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';
import settingsRoutes from './routes/settings.routes';
import uploadRoutes from './routes/upload.routes';
import reviewRoutes from './routes/review.routes';
import contentRoutes from './routes/content.routes';
import configRoutes from './routes/config.routes';
import homepageRoutes from './routes/homepage.routes';
import searchRoutes from './routes/search.routes';
import postRoutes from './routes/post.routes';
import aiRoutes from './routes/ai.routes';
import aiSettingsRoutes from './routes/aiSettings.routes';
import productGeneratorRoutes from './routes/productGenerator.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { seedDatabase } from './utils/seed';

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Priority order:
//   1. FRONTEND_URL env var (set this in Render to your production domain)
//   2. Hardcoded production domains (vastuarya.com + www)
//   3. Any *.vercel.app preview URL (covers all Vercel preview deployments)
//   4. localhost for local dev

const FRONTEND_URL = env.FRONTEND_URL || '';
const isProduction = env.NODE_ENV === 'production';

// Static allowed origins
const STATIC_ORIGINS = [
  FRONTEND_URL,
  'https://vastuarya.com',
  'https://www.vastuarya.com',
  'https://vastu-arya-frontend.vercel.app',
  'https://vastuarya.vercel.app',
].filter(Boolean);

// Pattern-based allowed origins (covers all Vercel preview URLs)
const ALLOWED_PATTERNS = [
  /^https:\/\/vastu-arya-frontend.*\.vercel\.app$/,   // all preview deploys
  /^https:\/\/vastuarya.*\.vercel\.app$/,             // any vastuarya* vercel URL
  /^http:\/\/localhost(:\d+)?$/,                      // local dev
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,                  // local dev alt
];

function isOriginAllowed(origin: string): boolean {
  if (STATIC_ORIGINS.includes(origin)) return true;
  return ALLOWED_PATTERNS.some(pattern => pattern.test(origin));
}

app.use(cors({
  origin: (origin: any, callback: any) => {
    // Allow requests with no origin (server-to-server, curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    if (isOriginAllowed(origin)) return callback(null, true);
    con.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-session-id'],
  optionsSuccessStatus: 200,
}));

// Handle preflight for all routes
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
if (env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/health', (req: any, res: any) => {
  res.json({ status: 'ok', message: 'Vastu Arya API v3.0', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/config', configRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/product-generator', productGeneratorRoutes);
app.use('/api/ai-settings', aiSettingsRoutes);

app.use('*', (req: any, res: any) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorMiddleware);

const PORT = parseInt(env.PORT || '5000', 10);

const connectAndStart = async () => {
  try {
    if (!env.MONGO_URI) throw new Error('MONGO_URI not set');
    await mongoose.connect(env.MONGO_URI as string);
    con.log('MongoDB connected');
    seedDatabase().catch((e: any) => con.warn('[Seed] Auto-seed warning:', e.message));
    app.listen(PORT, () => con.log(`Vastu Arya API v3.0 on port ${PORT}`));
  } catch (error) {
    con.error('Startup failed:', error);
    (process as any).exit(1);
  }
};
connectAndStart();
export default app;
