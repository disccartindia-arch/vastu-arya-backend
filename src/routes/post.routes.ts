/// <reference types="node" />
import { Router, Request, Response } from 'express';
import Post from '../models/Post';
import Comment from '../models/Comment';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();
const interactLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: { success: false, message: 'Too many requests' } });

// ── Public: Get posts feed ────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 12, category, type } = req.query;
    const filter: any = { isPublished: true };
    if (category) filter.category = category;
    if (type) filter.type = type;
    const posts = await Post.find(filter).sort({ isFeatured: -1, createdAt: -1 }).limit(Number(limit)).skip((Number(page) - 1) * Number(limit));
    const total = await Post.countDocuments(filter);
    res.json({ success: true, data: posts, total, page: Number(page) });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// ── Public: Get single post ───────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || !post.isPublished) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: post });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// ── Public: Like / Unlike ─────────────────────────────────────────────────────
router.post('/:id/like', interactLimiter, async (req: Request, res: Response) => {
  try {
    const sessionId = (req.headers['x-session-id'] as string) || req.ip || 'anon';
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const alreadyLiked = post.likedBy.includes(sessionId);
    if (alreadyLiked) {
      post.likes = Math.max(0, post.likes - 1);
      post.likedBy = post.likedBy.filter(id => id !== sessionId);
    } else {
      post.likes += 1;
      post.likedBy.push(sessionId);
    }
    await post.save();
    res.json({ success: true, likes: post.likes, liked: !alreadyLiked });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// ── Public: Get comments ──────────────────────────────────────────────────────
router.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const comments = await Comment.find({ post: req.params.id, isApproved: true, parentId: null }).sort({ createdAt: 1 }).limit(50);
    const withReplies = await Promise.all(comments.map(async c => {
      const replies = await Comment.find({ parentId: c._id, isApproved: true }).sort({ createdAt: 1 }).limit(10);
      return { ...c.toObject(), replies };
    }));
    res.json({ success: true, data: withReplies });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// ── Public: Add comment ───────────────────────────────────────────────────────
router.post('/:id/comments', interactLimiter, async (req: Request, res: Response) => {
  try {
    const { name, text, parentId } = req.body;
    if (!name?.trim() || !text?.trim()) return res.status(400).json({ success: false, message: 'Name and text required' });
    if (text.length > 500) return res.status(400).json({ success: false, message: 'Comment too long' });
    const comment = await Comment.create({ post: req.params.id, name: name.trim(), text: text.trim(), parentId: parentId || null, sessionId: req.ip });
    await Post.findByIdAndUpdate(req.params.id, { $inc: { commentCount: 1 } });
    res.status(201).json({ success: true, data: comment });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// ── Admin: Create post ────────────────────────────────────────────────────────
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const post = await Post.create(req.body);
    res.status(201).json({ success: true, data: post });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// ── Admin: Update post ────────────────────────────────────────────────────────
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: post });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// ── Admin: Delete post ────────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ post: req.params.id });
    res.json({ success: true, message: 'Post deleted' });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

// ── Admin: Moderate comment ───────────────────────────────────────────────────
router.put('/comments/:commentId', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const comment = await Comment.findByIdAndUpdate(req.params.commentId, req.body, { new: true });
    res.json({ success: true, data: comment });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

router.delete('/comments/:commentId', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.commentId);
    if (comment) await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

export default router;
