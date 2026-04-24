/// <reference types="node" />
import { Request, Response } from 'express';
import HomepageSettings from '../models/HomepageSettings';
import Testimonial from '../models/Testimonial';
import ThemeSettings from '../models/ThemeSettings';

// ─── Homepage Settings ────────────────────────────────────────────────────────

export const getHomepageSettings = async (req: Request, res: Response) => {
  try {
    let settings = await HomepageSettings.findOne();
    if (!settings) settings = await HomepageSettings.create({});
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHomepageSettings = async (req: Request, res: Response) => {
  try {
    const settings = await HomepageSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true, runValidators: true });
    res.json({ success: true, message: 'Homepage settings updated', data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Testimonials ─────────────────────────────────────────────────────────────

export const getTestimonials = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.query;
    const filter: any = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const testimonials = await Testimonial.find(filter).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: testimonials });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTestimonial = async (req: Request, res: Response) => {
  try {
    const testimonial = await Testimonial.create(req.body);
    res.status(201).json({ success: true, data: testimonial });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTestimonial = async (req: Request, res: Response) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!testimonial) return res.status(404).json({ success: false, message: 'Testimonial not found' });
    res.json({ success: true, data: testimonial });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTestimonial = async (req: Request, res: Response) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Testimonial deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Theme Settings ───────────────────────────────────────────────────────────

export const getThemeSettings = async (req: Request, res: Response) => {
  try {
    let theme = await ThemeSettings.findOne();
    if (!theme) theme = await ThemeSettings.create({});
    res.json({ success: true, data: theme });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateThemeSettings = async (req: Request, res: Response) => {
  try {
    const theme = await ThemeSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json({ success: true, message: 'Theme settings updated', data: theme });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
