/// <reference types="node" />
import { Request, Response } from 'express';
import Blog from '../models/Blog';
import slugify from 'slugify';

export const getAllBlogs = async (req: Request, res: Response) => {
  try {
    const { isPublished, category, page = 1, limit = 10 } = req.query;
    const filter: any = {};
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
    if (category) filter.category = category;
    const blogs = await Blog.find(filter).sort('-publishedAt -createdAt').limit(Number(limit)).skip((Number(page) - 1) * Number(limit));
    const total = await Blog.countDocuments(filter);
    res.json({ success: true, data: blogs, total });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBlogBySlug = async (req: Request, res: Response) => {
  try {
    const blog = await Blog.findOneAndUpdate({ slug: req.params.slug }, { $inc: { views: 1 } }, { new: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, data: blog });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBlog = async (req: Request, res: Response) => {
  try {
    const { title, isPublished, ...rest } = req.body;
    const slug = slugify(title?.en || title, { lower: true, strict: true });
    const blog = await Blog.create({ title, slug, isPublished, publishedAt: isPublished ? new Date() : undefined, ...rest });
    res.status(201).json({ success: true, message: 'Blog created', data: blog });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBlog = async (req: Request, res: Response) => {
  try {
    const existing = await Blog.findById(req.params.id);
    const update = req.body;
    if (req.body.isPublished && !existing?.isPublished) update.publishedAt = new Date();
    const blog = await Blog.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, message: 'Blog updated', data: blog });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBlog = async (req: Request, res: Response) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Blog deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
