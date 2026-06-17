/// <reference types="node" />
/**
 * post.routes.ts — Vastu Feed (Instagram-style social posts) + comments.
 * Inline handlers (no separate controller file), consistent with the
 * config.routes.ts / content.routes.ts pattern already used in this codebase
 * for lighter-weight resources.
 */
import { Router, Request, Response } from 'express';
import Post from '../models/Post';
import Comment from '../models/Comment';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, isFeatured, page = 1, limit = 20 } = req.query;
    const filter: any = { isPublished: true };
    if (category) filter.category = category;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    const posts = await Post.find(filter).sort({ sortOrder: 1, createdAt: -1 }).limit(Number(limit)).skip((Number(page) - 1) * Number(limit));
    const total = await Post.countDocuments(filter);
    res.json({ success: true, data: posts, total });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: post });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const post = await Post.create(req.body);
    res.status(201).json({ success: true, data: post });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: post });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ post: req.params.id });
    res.json({ success: true, message: 'Post deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/like', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const already = sessionId && post.likedBy.includes(sessionId);
    if (already) {
      post.likedBy = post.likedBy.filter((s: string) => s !== sessionId);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      if (sessionId) post.likedBy.push(sessionId);
      post.likes += 1;
    }
    await post.save();
    res.json({ success: true, data: { likes: post.likes, liked: !already } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const comments = await Comment.find({ post: req.params.id, isApproved: true }).sort('createdAt');
    res.json({ success: true, data: comments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/comments', async (req: Request, res: Response) => {
  try {
    const { name, text, parentId, sessionId } = req.body;
    if (!name || !text) return res.status(400).json({ success: false, message: 'Name and text are required.' });
    const comment = await Comment.create({ post: req.params.id, name, text, parentId: parentId || null, sessionId });
    await Post.findByIdAndUpdate(req.params.id, { $inc: { commentCount: 1 } });
    res.status(201).json({ success: true, data: comment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
