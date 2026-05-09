import { Request, Response } from 'express';
import Service from '../models/Service';
import slugify from 'slugify';

export const getAllServices = async (req: Request, res: Response) => {
  try {
    const { category, isActive, showOnHome, page = 1, limit = 50 } = req.query;
    const filter: any = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (showOnHome !== undefined) filter.showOnHome = showOnHome === 'true';
    const services = await Service.find(filter).sort({ sortOrder: 1, createdAt: -1 }).limit(Number(limit)).skip((Number(page) - 1) * Number(limit));
    const total = await Service.countDocuments(filter);
    res.json({ success: true, data: services, total, page: Number(page) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getServiceBySlug = async (req: Request, res: Response) => {
  try {
    const service = await Service.findOne({ slug: req.params.slug, isActive: true });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: service });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const { title, ...rest } = req.body;
    const slug = slugify(title?.en || title, { lower: true, strict: true });
    const service = await Service.create({ title, slug, ...rest });
    res.status(201).json({ success: true, message: 'Service created', data: service });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, message: 'Service updated', data: service });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Service deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
