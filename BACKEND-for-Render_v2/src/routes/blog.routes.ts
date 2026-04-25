import { Router } from 'express';
import { getAllBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog } from '../controllers/blog.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.get('/', getAllBlogs);
router.get('/:slug', getBlogBySlug);
router.post('/', authMiddleware, adminMiddleware, createBlog);
router.put('/:id', authMiddleware, adminMiddleware, updateBlog);
router.delete('/:id', authMiddleware, adminMiddleware, deleteBlog);
export default router;
