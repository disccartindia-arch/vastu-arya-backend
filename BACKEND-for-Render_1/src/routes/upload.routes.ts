/// <reference types="node" />
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) cb(null, true);
  else cb(new Error('Only image files are allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', authMiddleware, adminMiddleware, upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${(req.file as any).filename}`;
  res.json({ success: true, message: 'File uploaded', data: { url, filename: (req.file as any).filename } });
});

router.post('/multiple', authMiddleware, adminMiddleware, upload.array('images', 10), (req: Request, res: Response) => {
  if (!req.files || !Array.isArray(req.files)) return res.status(400).json({ success: false, message: 'No files uploaded' });
  const urls = (req.files as any[]).map((file: any) => ({
    url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
    filename: file.filename,
  }));
  res.json({ success: true, data: urls });
});

export default router;
