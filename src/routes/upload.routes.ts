/// <reference types="node" />
/**
 * Upload routes — uses Cloudinary for permanent cloud storage.
 * Render's filesystem is ephemeral (wiped on redeploy) — local disk MUST NOT be used for images.
 * Cloudinary files persist permanently regardless of restarts/redeploys.
 */
import { Router, Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();
const con    = (console as any);
const env    = (process as any).env;

// ── Configure Cloudinary from env vars ───────────────────────────────────────
// Accepts multiple naming conventions to match what admin may have set in Render
function getCloudinaryConfig() {
  const name   = env.CLOUDINARY_CLOUD_NAME  || env.CLOUD_NAME        || '';
  const apiKey = env.CLOUDINARY_API_KEY     || env.CLOUDINARY_KEY    || '';
  const secret = env.CLOUDINARY_API_SECRET  || env.CLOUDINARY_SECRET || '';
  return { name, apiKey, secret, configured: !!(name && apiKey && secret) };
}

const cfg = getCloudinaryConfig();
if (cfg.configured) {
  cloudinary.config({ cloud_name: cfg.name, api_key: cfg.apiKey, api_secret: cfg.secret });
  con.log(`[Upload] Cloudinary configured: ${cfg.name}`);
} else {
  con.warn('[Upload] Cloudinary env vars NOT set — uploads will fail. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to Render environment.');
}

// ── Use memory storage — never write to disk (ephemeral on Render) ────────────
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg|mp4|mov|avi|webm/;
    const ok = allowed.test(file.mimetype) || allowed.test(file.originalname.toLowerCase());
    if (ok) cb(null, true);
    else cb(new Error('Only image and video files are allowed'));
  },
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

// ── Helper: upload buffer to Cloudinary ──────────────────────────────────────
async function uploadToCloudinary(buffer: Buffer, mimetype: string, originalname: string): Promise<{ url: string; publicId: string; width: number; height: number }> {
  const cfg = getCloudinaryConfig();
  if (!cfg.configured) {
    throw new Error('Cloudinary not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to Render environment variables.');
  }

  const isVideo    = mimetype.startsWith('video/');
  const resourceType: 'image' | 'video' | 'raw' = isVideo ? 'video' : 'image';
  const folder     = isVideo ? 'vastuarya/videos' : 'vastuarya/products';
  const timestamp  = Date.now();
  const publicId   = `${folder}/${timestamp}-${originalname.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        public_id: publicId,
        overwrite: false,
        quality: 'auto',         // Cloudinary auto-optimises quality
        fetch_format: 'auto',    // Serves WebP/AVIF automatically
        flags: 'progressive',    // Progressive JPEG loading
        folder,
      },
      (error, result) => {
        if (error || !result) {
          con.error('[Upload] Cloudinary error:', error);
          return reject(error || new Error('Cloudinary upload failed'));
        }
        con.log(`[Upload] Cloudinary success: ${result.secure_url} (${result.public_id})`);
        resolve({
          url:      result.secure_url,
          publicId: result.public_id,
          width:    result.width  || 0,
          height:   result.height || 0,
        });
      }
    );
    stream.end(buffer);
  });
}

// ── POST /api/upload — single file ───────────────────────────────────────────
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file received' });

    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, req.file.originalname);

    res.json({
      success: true,
      message: 'File uploaded to Cloudinary permanently',
      data: {
        url:      result.url,
        publicId: result.publicId,
        width:    result.width,
        height:   result.height,
        filename: result.publicId.split('/').pop() || '',
      },
    });
  } catch (error: any) {
    con.error('[Upload] Single upload failed:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Upload failed' });
  }
});

// ── POST /api/upload/multiple — multiple files ────────────────────────────────
router.post('/multiple', authMiddleware, adminMiddleware, upload.array('images', 10), async (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files received' });
    }

    const results = await Promise.all(
      req.files.map(file => uploadToCloudinary(file.buffer, file.mimetype, file.originalname))
    );

    res.json({
      success: true,
      data: results.map(r => ({ url: r.url, publicId: r.publicId, filename: r.publicId.split('/').pop() || '' })),
    });
  } catch (error: any) {
    con.error('[Upload] Multiple upload failed:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Upload failed' });
  }
});

// ── GET /api/upload/status — check Cloudinary config (admin only) ─────────────
router.get('/status', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const cfg = getCloudinaryConfig();
  res.json({
    success: true,
    configured: cfg.configured,
    cloudName: cfg.configured ? cfg.name : null,
    message: cfg.configured
      ? `Cloudinary connected (${cfg.name}). Images stored permanently.`
      : 'Cloudinary NOT configured. Images will not persist. Add env vars in Render.',
  });
});

export default router;
