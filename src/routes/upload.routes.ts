/// <reference types="node" />
/**
 * upload.routes.ts
 *
 * CHANGED this round: `uploadToCloudinary`, `getCloudinaryConfig` and the
 * `upload` multer instance are now exported (previously module-private),
 * and `uploadToCloudinary` gained an optional `folderOverride` parameter.
 *
 * Why: upiPayment.controller.ts needs to upload payment screenshots to
 * Cloudinary and was told to reuse this existing infrastructure rather than
 * duplicating it. Every existing call site in this file calls
 * uploadToCloudinary(buffer, mimetype, filename) with no 4th argument, so
 * folderOverride defaults to undefined and the original 'vastuarya/products'
 * (or whatever folder was already being passed) behaviour is byte-for-byte
 * unchanged for them. Only the new UPI controller passes
 * 'vastuarya/upi-screenshots' explicitly.
 */
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();
const con = (console as any);
const env = (process as any).env;

export function getCloudinaryConfig() {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|mp4|mov|webm/;
    const ok = allowed.test(file.mimetype);
    cb(ok ? null : new Error('Unsupported file type.'), ok);
  },
});

export async function uploadToCloudinary(
  buffer: Buffer,
  mimetype: string,
  originalName: string,
  folderOverride?: string
): Promise<{ url: string; publicId: string }> {
  const cl = getCloudinaryConfig();
  const isVideo = mimetype.startsWith('video/');
  const folder = folderOverride || (isVideo ? 'vastuarya/videos' : 'vastuarya/products');
  const base64 = `data:${mimetype};base64,${buffer.toString('base64')}`;

  const result = await cl.uploader.upload(base64, {
    folder,
    resource_type: isVideo ? 'video' : 'image',
    public_id: `${Date.now()}-${originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')}`,
    ...(isVideo ? {} : { transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }] }),
  });

  return { url: result.secure_url, publicId: result.public_id };
}

router.post('/image', authMiddleware, adminMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, req.file.originalname);
    res.json({ success: true, data: result });
  } catch (error: any) {
    con.error('[Upload] image error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Upload failed.' });
  }
});

router.post('/video', authMiddleware, adminMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, req.file.originalname, 'vastuarya/videos');
    res.json({ success: true, data: result });
  } catch (error: any) {
    con.error('[Upload] video error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Upload failed.' });
  }
});

router.delete('/:publicId', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const cl = getCloudinaryConfig();
    const publicId = decodeURIComponent(req.params.publicId);
    await cl.uploader.destroy(publicId);
    res.json({ success: true, message: 'File deleted' });
  } catch (error: any) {
    con.error('[Upload] delete error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
