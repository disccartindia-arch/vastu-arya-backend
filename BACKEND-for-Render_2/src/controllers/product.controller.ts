/// <reference types="node" />
import { Request, Response } from 'express';
import Product from '../models/Product';
import slugify from 'slugify';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { category, isFeatured, isNewLaunch, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const filter: any = { isActive: true };
    if (category) filter.category = category;
    if (isFeatured) filter.isFeatured = isFeatured === 'true';
    if (isNewLaunch) filter.isNewLaunch = isNewLaunch === 'true';
    const products = await Product.find(filter).sort(sort as string).limit(Number(limit)).skip((Number(page) - 1) * Number(limit));
    const total = await Product.countDocuments(filter);
    res.json({ success: true, data: products, total, page: Number(page) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const related = await Product.find({ category: product.category, _id: { $ne: product._id }, isActive: true }).limit(4);
    res.json({ success: true, data: product, related });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, ...rest } = req.body;
    const slug = slugify(name?.en || name, { lower: true, strict: true });
    const product = await Product.create({ name, slug, ...rest });
    res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product updated', data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminProducts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    const filter: any = {};
    if (category) filter.category = category;
    const products = await Product.find(filter).sort('-createdAt').limit(Number(limit)).skip((Number(page) - 1) * Number(limit));
    const total = await Product.countDocuments(filter);
    res.json({ success: true, data: products, total });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
